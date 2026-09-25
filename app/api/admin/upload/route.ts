import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — matches the bucket's fileSizeLimit
const MAX_DIM = 1600;
const THUMB_DIM = 500;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
// sharp's format-preserving resize needs an explicit encoder per format —
// GIFs are skipped entirely (resizing would flatten any animation to a
// single frame) and uploaded as-is.
const SHARP_FORMAT: Record<string, "jpeg" | "png" | "webp"> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

function randomFileId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Storage isn't configured." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF images or MP4/WebM/MOV videos are allowed." }, { status: 400 });
  }
  const isVideo = file.type.startsWith("video/");
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: isVideo ? "Video must be 50MB or smaller." : "Image must be 5MB or smaller." },
      { status: 400 }
    );
  }

  const id = randomFileId();
  const path = `${id}.${ext}`;
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const sharpFormat = SHARP_FORMAT[file.type];

  let mainBuffer: Buffer = originalBuffer;
  let thumbBuffer: Buffer | null = null;

  if (sharpFormat) {
    try {
      mainBuffer = await sharp(originalBuffer)
        .rotate()
        .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
        [sharpFormat]({ quality: 82 })
        .toBuffer();
      thumbBuffer = await sharp(originalBuffer)
        .rotate()
        .resize(THUMB_DIM, THUMB_DIM, { fit: "cover" })
        [sharpFormat]({ quality: 80 })
        .toBuffer();
    } catch {
      // Fall back to uploading the untouched original rather than failing
      // the whole upload over a resize hiccup (e.g. an unusual color profile).
      mainBuffer = originalBuffer;
      thumbBuffer = null;
    }
  }

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, mainBuffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    // Surface the real Supabase Storage error (e.g. the "product-images" bucket's
    // allowedMimeTypes/fileSizeLimit policy rejecting a type or size that this
    // route itself allows) instead of a generic message that hides which one it was.
    console.error("Supabase storage upload failed:", uploadError);
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  if (thumbBuffer) {
    const thumbPath = `${id}-thumb.${ext}`;
    await supabase.storage.from("product-images").upload(thumbPath, thumbBuffer, {
      contentType: file.type,
      upsert: false,
    });
    // Not fatal if this second upload fails — getThumbnailUrl() consumers
    // only rely on the thumbnail existing for images that went through this
    // route successfully end-to-end; a partial failure here just means that
    // one image's card view falls back to browser-scaled full-size (still
    // correct, just not as lean).
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
