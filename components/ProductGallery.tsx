"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/Icons";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function showPrev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }
  function showNext() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, images.length]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="View larger image"
        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl3 bg-blush-light shadow-soft"
      >
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl2 bg-blush-light transition-opacity ${
                i === activeIndex ? "ring-2 ring-pastel" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="relative h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex]}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {activeIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
