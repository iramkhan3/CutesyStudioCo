"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type MediaFile = { filename: string; url: string; type: "image" | "video" };
type FolderGroup = { folder: string; files: MediaFile[] };

const VIDEO_EXT_RE = /\.(mp4|webm|mov)$/i;

function isVideoUrl(url: string): boolean {
  return VIDEO_EXT_RE.test(url);
}

function MediaThumb({ src, alt, sizePx }: { src: string; alt: string; sizePx: number }) {
  if (isVideoUrl(src)) {
    return <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />;
  }
  return (
    <Image src={src} alt={alt} fill sizes={`${sizePx}px`} className="object-cover" unoptimized={src.endsWith(".svg") || src.startsWith("/products/all/")} />
  );
}

export default function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [browsing, setBrowsing] = useState(false);
  const [groups, setGroups] = useState<FolderGroup[] | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function toggleBrowse() {
    const next = !browsing;
    setBrowsing(next);
    if (next && groups === null) {
      setLocalLoading(true);
      setLocalError(null);
      try {
        const res = await fetch("/api/admin/local-images");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load folder.");
        setGroups(data.groups);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load folder.");
      } finally {
        setLocalLoading(false);
      }
    }
  }

  function toggleLocalPick(url: string) {
    if (images.includes(url)) {
      onChange(images.filter((i) => i !== url));
    } else {
      onChange([...images, url]);
    }
  }

  function selectAllInGroup(group: FolderGroup) {
    const urls = group.files.map((f) => f.url);
    const merged = [...images];
    for (const url of urls) if (!merged.includes(url)) merged.push(url);
    onChange(merged);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}.`);
        uploaded.push(data.url);
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setAsThumbnail(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div
            key={src + i}
            className={`group relative h-24 w-24 overflow-hidden rounded-xl2 border-2 bg-cream-light ${
              i === 0 ? "border-pastel" : "border-blush-light"
            }`}
          >
            <MediaThumb src={src} alt={`Media ${i + 1}`} sizePx={96} />
            {isVideoUrl(src) && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                Video
              </span>
            )}
            {i === 0 ? (
              <span className="absolute bottom-1 right-1 rounded-full bg-pastel px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                ★ Thumbnail
              </span>
            ) : (
              !isVideoUrl(src) && (
                <button
                  type="button"
                  onClick={() => setAsThumbnail(i)}
                  className="absolute inset-x-1 bottom-1 rounded-full bg-black/60 py-0.5 text-[9px] font-bold uppercase text-white opacity-0 transition group-hover:opacity-100"
                >
                  Set as thumbnail
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
              aria-label={`Remove media ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl2 border-2 border-dashed border-ink/20 text-xs font-semibold text-ink-light transition hover:border-pastel hover:text-pastel-dark disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add media"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-ink-light">
        Images: JPEG/PNG/WebP/GIF up to 5MB. Videos: MP4/WebM/MOV up to 50MB. First item is used as the main product photo
        (put an image first, not a video).
      </p>

      <button type="button" onClick={toggleBrowse} className="mt-3 text-xs font-semibold text-pastel-dark hover:underline">
        {browsing ? "Hide" : "Or pick from public/products/all →"}
      </button>

      {browsing && (
        <div className="mt-2 space-y-3 rounded-xl2 border border-blush-light bg-cream-light p-3">
          {localLoading && <p className="text-xs text-ink-light">Loading…</p>}
          {localError && <p className="text-xs font-medium text-red-700">{localError}</p>}
          {!localLoading && !localError && groups?.length === 0 && (
            <p className="text-xs text-ink-light">
              No media found in <code>public/products/all</code> yet. Drop files there — put multiple photos/videos of
              the same product in their own subfolder (e.g. <code>public/products/all/strawberry-case/1.jpg</code>) so
              they group together automatically — then redeploy and they&apos;ll show up here.
            </p>
          )}
          {!localLoading &&
            groups &&
            groups.map((group) => (
              <div key={group.folder}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">{group.folder}</span>
                  {group.files.length > 1 && (
                    <button
                      type="button"
                      onClick={() => selectAllInGroup(group)}
                      className="text-xs font-semibold text-pastel-dark hover:underline"
                    >
                      Select all ({group.files.length})
                    </button>
                  )}
                </div>
                <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
                  {group.files.map((file) => {
                    const selected = images.includes(file.url);
                    return (
                      <button
                        key={file.url}
                        type="button"
                        onClick={() => toggleLocalPick(file.url)}
                        className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                          selected ? "border-pastel" : "border-transparent hover:border-ink/20"
                        }`}
                        title={file.filename}
                      >
                        <MediaThumb src={file.url} alt={file.filename} sizePx={64} />
                        {file.type === "video" && (
                          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[8px] font-bold uppercase text-white">
                            Vid
                          </span>
                        )}
                        {selected && (
                          <span className="absolute inset-0 flex items-center justify-center bg-pastel/40 text-sm font-bold text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
