"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import {
  CUSTOM_CASE_COLOURS,
  CUSTOM_CASE_PRICE_INR,
  CUSTOM_CASE_STYLES,
  CUSTOM_CASE_THEMES,
  CUSTOM_CASE_WEIGHTS,
  PHONE_MODELS,
  SURPRISE_ME_PRICE_INR,
} from "@/lib/constants";
import type { CustomCaseMode } from "@/lib/types";
import { CartIcon, GiftIcon, WandIcon } from "@/components/Icons";

const CUSTOM_TYPE_YOUR_OWN = "Type your own";
const PHONE_OTHER = "My phone isn't listed (type below)";

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border-2 px-4 py-2 font-heading text-sm font-semibold transition-all duration-150 hover:scale-105 ${
              value === option
                ? "border-pastel bg-pastel text-white"
                : "border-ink/10 bg-white text-ink/70 hover:border-pastel/50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CustomCaseBuilder() {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const [mode, setMode] = useState<CustomCaseMode>("build");
  const [phoneModel, setPhoneModel] = useState("");
  const [customPhoneModel, setCustomPhoneModel] = useState("");
  const [theme, setTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [style, setStyle] = useState("");
  const [weight, setWeight] = useState("");
  const [colour, setColour] = useState("");
  const [customColour, setCustomColour] = useState("");
  const [note, setNote] = useState("");
  const [surpriseNote, setSurpriseNote] = useState("");
  const [added, setAdded] = useState(false);

  const price = mode === "build" ? CUSTOM_CASE_PRICE_INR : SURPRISE_ME_PRICE_INR;

  const resolvedPhoneModel = phoneModel === PHONE_OTHER ? customPhoneModel.trim() : phoneModel;
  const resolvedTheme = theme === CUSTOM_TYPE_YOUR_OWN ? customTheme.trim() : theme;
  const resolvedColour = colour === CUSTOM_TYPE_YOUR_OWN ? customColour.trim() : colour;

  const buildValid =
    mode === "build" &&
    !!resolvedPhoneModel &&
    !!resolvedTheme &&
    !!style &&
    !!weight &&
    !!resolvedColour;
  const surpriseValid = mode === "surprise" && surpriseNote.trim().length >= 20;
  const canAdd = buildValid || surpriseValid;

  function handleAddToCart() {
    if (!canAdd) return;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    addItem(
      {
        kind: "custom",
        id,
        name: mode === "build" ? "Custom Phone Case" : "Surprise Me Phone Case",
        image: "/products/phone-cases.svg",
        priceInr: price,
        customization:
          mode === "build"
            ? {
                mode,
                phoneModel: resolvedPhoneModel,
                theme: resolvedTheme,
                style,
                weight,
                colour: resolvedColour,
                note: note.trim(),
              }
            : { mode, note: surpriseNote.trim() },
      },
      1
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setMode("build")}
          className={`card flex flex-1 items-center gap-3 p-5 text-left transition-transform hover:-translate-y-0.5 ${
            mode === "build" ? "ring-2 ring-pastel" : ""
          }`}
        >
          <span className="rounded-full bg-blush-light p-3">
            <WandIcon className="h-6 w-6 text-pastel" />
          </span>
          <span>
            <span className="block font-heading font-semibold text-ink">Build Your Own</span>
            <span className="block text-sm text-ink/60">Pick every detail yourself — ₹{CUSTOM_CASE_PRICE_INR}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("surprise")}
          className={`card flex flex-1 items-center gap-3 p-5 text-left transition-transform hover:-translate-y-0.5 ${
            mode === "surprise" ? "ring-2 ring-pastel" : ""
          }`}
        >
          <span className="rounded-full bg-lavender-light p-3">
            <GiftIcon className="h-6 w-6 text-pastel" />
          </span>
          <span>
            <span className="block font-heading font-semibold text-ink">Surprise Me</span>
            <span className="block text-sm text-ink/60">Tell me your dream, I&apos;ll design it — ₹{SURPRISE_ME_PRICE_INR}</span>
          </span>
        </button>
      </div>

      {mode === "build" ? (
        <div className="card mt-6 flex flex-col gap-6 p-6">
          <label className="block">
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Phone Model
            </span>
            <select
              value={phoneModel}
              onChange={(e) => setPhoneModel(e.target.value)}
              className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2.5 text-sm text-ink focus:border-pastel focus:outline-none"
            >
              <option value="" disabled>
                Select your phone model
              </option>
              {PHONE_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            {phoneModel === PHONE_OTHER && (
              <input
                type="text"
                required
                value={customPhoneModel}
                onChange={(e) => setCustomPhoneModel(e.target.value)}
                placeholder="Type your phone model"
                className="mt-2 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
              />
            )}
          </label>

          <ChipGroup label="Theme" options={CUSTOM_CASE_THEMES} value={theme} onChange={setTheme} />
          {theme === CUSTOM_TYPE_YOUR_OWN && (
            <input
              type="text"
              required
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="Describe your theme"
              className="-mt-3 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
          )}

          <ChipGroup label="Style" options={CUSTOM_CASE_STYLES} value={style} onChange={setStyle} />
          <ChipGroup label="Weight" options={CUSTOM_CASE_WEIGHTS} value={weight} onChange={setWeight} />
          <ChipGroup label="Colours" options={CUSTOM_CASE_COLOURS} value={colour} onChange={setColour} />
          {colour === CUSTOM_TYPE_YOUR_OWN && (
            <input
              type="text"
              required
              value={customColour}
              onChange={(e) => setCustomColour(e.target.value)}
              placeholder="Describe your colours"
              className="-mt-3 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
          )}

          <label className="block">
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Note (optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="vibe, favorite colors, things you love, things to avoid — the more detail you give me, the closer I'll get to your dream. I'll use my best judgment for anything you don't specify."
              className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
          </label>
        </div>
      ) : (
        <div className="card mt-6 flex flex-col gap-4 p-6">
          <label className="block">
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Tell me your dream case
            </span>
            <p className="mb-2 text-sm text-ink/60">
              Phone model, vibe, favorite colors, characters you love, things
              to avoid — the more detail you give me, the closer I&apos;ll get to
              your dream. I&apos;ll use my best judgment for anything you don&apos;t
              specify.
            </p>
            <textarea
              value={surpriseNote}
              onChange={(e) => setSurpriseNote(e.target.value)}
              rows={7}
              required
              placeholder="e.g. iPhone 15, obsessed with Cinnamoroll and baby blue, love bows, please no glitter texture, it's a birthday gift for myself!"
              className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
            {!surpriseValid && surpriseNote.length > 0 && (
              <p className="mt-1 text-xs text-pastel-dark">
                A few more details would help — at least 20 characters.
              </p>
            )}
          </label>
        </div>
      )}

      <div className="card mt-6 flex flex-col items-center gap-4 p-6 text-center">
        <div>
          <span className="font-heading text-2xl font-bold text-ink">₹{price}</span>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CartIcon className="h-4 w-4" /> {added ? "Added to Cart!" : "Add to Cart"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!canAdd}
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
        {!canAdd && (
          <p className="text-xs text-ink/50">
            {mode === "build"
              ? "Pick a phone model, theme, style, weight, and colour to continue."
              : "Write a little more about your dream case to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
