import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|svg)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov)$/i;
const FOLDER = path.join(process.cwd(), "public", "products", "all");

type MediaFile = { filename: string; url: string; type: "image" | "video" };
type FolderGroup = { folder: string; files: MediaFile[] };

function mediaType(filename: string): "image" | "video" | null {
  if (IMAGE_EXT_RE.test(filename)) return "image";
  if (VIDEO_EXT_RE.test(filename)) return "video";
  return null;
}

/**
 * Scans public/products/all/ two ways:
 *  - subfolders (public/products/all/<product-name>/*) become one group per
 *    product, so multiple photos/videos of the same item stay together
 *    automatically without any manual grouping in the admin.
 *  - files sitting directly in public/products/all/ (no subfolder) are
 *    returned as a single "(ungrouped)" group, so the flat-drop workflow
 *    from before subfolders existed still works.
 */
export async function GET() {
  let entries: string[];
  try {
    entries = await readdir(FOLDER);
  } catch {
    return NextResponse.json({ groups: [] });
  }

  const groups: FolderGroup[] = [];
  const ungrouped: MediaFile[] = [];

  for (const entry of entries) {
    const entryPath = path.join(FOLDER, entry);
    let entryStat;
    try {
      entryStat = await stat(entryPath);
    } catch {
      continue;
    }

    if (entryStat.isDirectory()) {
      let subEntries: string[];
      try {
        subEntries = await readdir(entryPath);
      } catch {
        continue;
      }
      const files: MediaFile[] = subEntries
        .map((name) => {
          const type = mediaType(name);
          return type ? { filename: name, url: `/products/all/${entry}/${name}`, type } : null;
        })
        .filter((f): f is MediaFile => f !== null)
        .sort((a, b) => a.filename.localeCompare(b.filename));
      if (files.length > 0) groups.push({ folder: entry, files });
    } else {
      const type = mediaType(entry);
      if (type) ungrouped.push({ filename: entry, url: `/products/all/${entry}`, type });
    }
  }

  groups.sort((a, b) => a.folder.localeCompare(b.folder));
  if (ungrouped.length > 0) {
    groups.push({ folder: "(ungrouped)", files: ungrouped.sort((a, b) => a.filename.localeCompare(b.filename)) });
  }

  return NextResponse.json({ groups });
}
