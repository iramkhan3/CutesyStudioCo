"use client";

import { useEffect, useState, type ReactNode } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import type { CarouselSlide, HomepageContent } from "@/lib/settings-defaults";

const input =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pastel";
const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-light">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [defaults, setDefaults] = useState<HomepageContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/homepage")
      .then((r) => r.json())
      .then((data) => {
        setContent(data.value);
        setDefaults(data.defaults);
      })
      .catch(() => setError("Failed to load homepage content."));
  }, []);

  function update(patch: Partial<HomepageContent>) {
    setContent((c) => (c ? { ...c, ...patch } : c));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setContent(data.value);
      setDirty(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!content || !defaults) return <p className="text-ink-light">{error ?? "Loading…"}</p>;

  // A text field with a "reset" link back to the original wording.
  const text = (key: keyof HomepageContent, label: string, opts: { rows?: number; max: number; hint?: string }) => {
    const value = content[key] as string;
    const changed = value !== defaults[key];
    return (
      <label className="block text-xs font-semibold text-ink-light">
        <span className="flex items-center justify-between">
          {label}
          {changed && (
            <button type="button" onClick={() => update({ [key]: defaults[key] } as Partial<HomepageContent>)} className="font-normal underline">
              Reset to original
            </button>
          )}
        </span>
        {opts.rows ? (
          <textarea value={value} rows={opts.rows} maxLength={opts.max} onChange={(e) => update({ [key]: e.target.value } as Partial<HomepageContent>)} className={input} />
        ) : (
          <input value={value} maxLength={opts.max} onChange={(e) => update({ [key]: e.target.value } as Partial<HomepageContent>)} className={input} />
        )}
        {opts.hint && <span className="mt-1 block font-normal">{opts.hint}</span>}
      </label>
    );
  };

  const setCarouselFromImages = (images: string[]) => {
    const altBySrc = new Map(content.carousel.map((s) => [s.src, s.alt]));
    update({ carousel: images.filter((src) => !isVideo(src)).map((src) => ({ src, alt: altBySrc.get(src) ?? "" })) });
  };
  const updateSlide = (i: number, patch: Partial<CarouselSlide>) =>
    update({ carousel: content.carousel.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveSlide = (i: number, dir: -1 | 1) => {
    const next = [...content.carousel];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ carousel: next });
  };

  return (
    <div className="max-w-3xl pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Homepage</h1>
          <p className="mt-1 text-ink-light">Edit the words and photos on your homepage. Saving updates the live site immediately.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-pastel-dark hover:underline">
          Open homepage ↗
        </a>
      </div>

      <div className="mt-6 space-y-5">
        <Section title="Top banner (hero)">
          {text("heroTag", "Small label", { max: 80 })}
          {text("heroTitle", "Headline", { rows: 2, max: 140, hint: "Press Enter for a line break." })}
          {text("heroText", "Intro text", { rows: 4, max: 1200 })}
        </Section>

        <Section title="Existing designs section">
          {text("shopTag", "Small label", { max: 80 })}
          {text("shopTitle", "Heading", { max: 140 })}
          {text("shopText", "Text", { rows: 3, max: 1200 })}
        </Section>

        <Section title="Custom builder section">
          {text("customizeTitle", "Heading", { max: 140 })}
          {text("customizeText", "Text", { rows: 3, max: 1200 })}
        </Section>

        <Section title="Photo carousel" description="The 'Real pieces' slideshow. Upload photos (videos aren't supported here), then describe each one — descriptions help Google and screen readers.">
          {text("carouselTitle", "Heading", { max: 140 })}
          {text("carouselText", "Text", { rows: 3, max: 1200 })}
          <ImageUploader images={content.carousel.map((s) => s.src)} onChange={setCarouselFromImages} />
          <ol className="space-y-2">
            {content.carousel.map((slide, i) => (
              <li key={slide.src} className="flex items-center gap-3 rounded-xl2 border border-blush-light p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.src} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                <input
                  value={slide.alt}
                  maxLength={200}
                  onChange={(e) => updateSlide(i, { alt: e.target.value })}
                  placeholder="Describe this photo, e.g. Pastel Hello Kitty phone case"
                  className={`${input} mt-0 flex-1`}
                />
                <div className="flex shrink-0 flex-col">
                  <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0} className="px-2 text-xs disabled:opacity-30" aria-label="Move up">
                    ▲
                  </button>
                  <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === content.carousel.length - 1} className="px-2 text-xs disabled:opacity-30" aria-label="Move down">
                    ▼
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {content.carousel.length === 0 && <p className="text-sm text-amber-800">No photos — the carousel is hidden on the homepage.</p>}
          <button type="button" onClick={() => update({ carousel: defaults.carousel })} className="text-sm text-ink-light underline">
            Reset to the original photos
          </button>
        </Section>

        <Section title="Launch offer banner" description="Only shows while an auto-apply coupon is active (Admin → Coupons). {percent} is replaced with the coupon's % off.">
          {text("launchTitle", "Heading", { max: 80 })}
          {text("launchText", "Text", { rows: 3, max: 1200 })}
        </Section>

        <Section title="Our story (About)">
          {text("aboutTitle", "Heading", { max: 140 })}
          {content.aboutParagraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={p}
                rows={4}
                maxLength={2000}
                onChange={(e) => update({ aboutParagraphs: content.aboutParagraphs.map((x, j) => (j === i ? e.target.value : x)) })}
                className={`${input} mt-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => update({ aboutParagraphs: content.aboutParagraphs.filter((_, j) => j !== i) })}
                className="self-start rounded-full px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            {content.aboutParagraphs.length < 12 && (
              <button
                type="button"
                onClick={() => update({ aboutParagraphs: [...content.aboutParagraphs, ""] })}
                className="rounded-full border-2 border-pastel-light px-4 py-1.5 text-sm font-semibold text-ink hover:border-pastel"
              >
                + Add paragraph
              </button>
            )}
            <button type="button" onClick={() => update({ aboutParagraphs: defaults.aboutParagraphs })} className="text-sm text-ink-light underline">
              Reset to original
            </button>
          </div>
        </Section>

        <Section title="Meet the maker">
          {text("makerTitle", "Heading", { max: 80 })}
          {text("makerText", "Text", { rows: 4, max: 1200 })}
          <div>
            <p className="text-xs font-semibold text-ink-light">Photo</p>
            <ImageUploader
              images={[content.makerImage]}
              onChange={(images) => {
                const last = images.filter((src) => !isVideo(src)).pop();
                update({ makerImage: last ?? defaults.makerImage });
              }}
            />
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blush-light bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm">
            {error ? (
              <span className="font-medium text-red-700">{error}</span>
            ) : saved ? (
              <span className="font-medium text-green-700">Saved — live on the homepage now.</span>
            ) : dirty ? (
              <span className="text-amber-800">Unsaved changes</span>
            ) : (
              <span className="text-ink-light">All changes saved</span>
            )}
          </p>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-full bg-pastel px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save homepage"}
          </button>
        </div>
      </div>
    </div>
  );
}
