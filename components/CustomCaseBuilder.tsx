"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import {
  CUSTOM_CASE_COLOURS,
  CUSTOM_CASE_STYLES,
  CUSTOM_CASE_THEMES,
  CUSTOM_CASE_WEIGHTS,
  CUSTOM_ORDER_TIMELINE_NOTE,
  CUSTOM_PRODUCT_TYPES,
  PHONE_MODELS,
  type CustomProductTypeSlug,
} from "@/lib/constants";
import { getDisplayPricing } from "@/lib/pricing";
import type { CustomCaseMode } from "@/lib/types";
import { CartIcon, GiftIcon, WandIcon } from "@/components/Icons";

const CUSTOM_TYPE_YOUR_OWN = "Type your own";
const PHONE_OTHER = "My phone isn't listed (type below)";
const NOTE_MAX_LENGTH = 500;
const SURPRISE_NOTE_MIN_LENGTH = 20;

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

  const [productType, setProductType] = useState<CustomProductTypeSlug>("phone-case");
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

  const typeConfig = CUSTOM_PRODUCT_TYPES.find((t) => t.slug === productType)!;
  const pricing = mode === "build" ? typeConfig.build : typeConfig.surprise;
  // Display pricing reflects the currently-active auto-discount (e.g.
  // LAUNCH50) that also applies at checkout, so the price/badge shown here
  // always matches what's actually charged — pricing.priceInr itself (the
  // raw, pre-auto-discount amount) is still what gets added to the cart.
  const buildDisplay = getDisplayPricing(typeConfig.build.mrpInr, typeConfig.build.priceInr);
  const surpriseDisplay = getDisplayPricing(typeConfig.surprise.mrpInr, typeConfig.surprise.priceInr);
  const activeDisplay = mode === "build" ? buildDisplay : surpriseDisplay;

  const resolvedPhoneModel = phoneModel === PHONE_OTHER ? customPhoneModel.trim() : phoneModel;
  const resolvedTheme = theme === CUSTOM_TYPE_YOUR_OWN ? customTheme.trim() : theme;
  const resolvedColour = colour === CUSTOM_TYPE_YOUR_OWN ? customColour.trim() : colour;

  const buildValid =
    mode === "build" &&
    (!typeConfig.requiresPhoneModel || !!resolvedPhoneModel) &&
    !!resolvedTheme &&
    !!style &&
    !!weight &&
    !!resolvedColour;
  const surpriseNoteTrimmed = surpriseNote.trim();
  const surpriseValid =
    mode === "surprise" &&
    surpriseNoteTrimmed.length >= SURPRISE_NOTE_MIN_LENGTH &&
    surpriseNoteTrimmed.length <= NOTE_MAX_LENGTH;
  const canAdd = buildValid || surpriseValid;

  function handleProductTypeChange(slug: CustomProductTypeSlug) {
    setProductType(slug);
    // Phone model only makes sense for the phone-case type — clear it so a
    // stale selection can't silently ride along on a different product.
    setPhoneModel("");
    setCustomPhoneModel("");
  }

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
        name: `Custom ${typeConfig.name}${mode === "surprise" ? " (Surprise Me)" : ""}`,
        image: typeConfig.image,
        priceInr: pricing.priceInr,
        customization:
          mode === "build"
            ? {
                mode,
                productType,
                phoneModel: resolvedPhoneModel || undefined,
                theme: resolvedTheme,
                style,
                weight,
                colour: resolvedColour,
                note: note.trim().slice(0, NOTE_MAX_LENGTH),
              }
            : { mode, productType, note: surpriseNoteTrimmed },
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
      <div className="mb-6 flex items-start gap-3 rounded-xl2 border-2 border-pastel-dark/20 bg-pastel-dark/10 p-4 text-sm text-ink/80">
        <span className="text-lg leading-none">🎀</span>
        <p>{CUSTOM_ORDER_TIMELINE_NOTE}</p>
      </div>

      <div className="card p-5">
        <span className="mb-3 block font-heading text-sm font-semibold text-ink/70">
          What are we making?
        </span>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_PRODUCT_TYPES.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => handleProductTypeChange(t.slug)}
              className={`rounded-full border-2 px-4 py-2 font-heading text-sm font-semibold transition-all duration-150 hover:scale-105 ${
                productType === t.slug
                  ? "border-pastel bg-pastel text-white"
                  : "border-ink/10 bg-white text-ink/70 hover:border-pastel/50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
            <span className="block text-sm text-ink/60">
              Pick every detail yourself —{" "}
              {buildDisplay.percentOff > 0 && (
                <span className="line-through">₹{buildDisplay.mrpInr}</span>
              )}{" "}
              ₹{buildDisplay.effectivePriceInr}
              {buildDisplay.percentOff > 0 && (
                <span className="ml-1 rounded-full bg-pastel-dark/10 px-1.5 py-0.5 text-[10px] font-bold text-pastel-dark">
                  {buildDisplay.percentOff}% OFF
                </span>
              )}
            </span>
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
            <span className="block text-sm text-ink/60">
              Tell me your dream, I&apos;ll design it —{" "}
              {surpriseDisplay.percentOff > 0 && (
                <span className="line-through">₹{surpriseDisplay.mrpInr}</span>
              )}{" "}
              ₹{surpriseDisplay.effectivePriceInr}
              {surpriseDisplay.percentOff > 0 && (
                <span className="ml-1 rounded-full bg-pastel-dark/10 px-1.5 py-0.5 text-[10px] font-bold text-pastel-dark">
                  {surpriseDisplay.percentOff}% OFF
                </span>
              )}
            </span>
          </span>
        </button>
      </div>

      {mode === "build" ? (
        <div className="card mt-6 flex flex-col gap-6 p-6">
          {typeConfig.requiresPhoneModel && (
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
                  maxLength={80}
                  className="mt-2 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
                />
              )}
            </label>
          )}

          <ChipGroup label="Theme" options={CUSTOM_CASE_THEMES} value={theme} onChange={setTheme} />
          {theme === CUSTOM_TYPE_YOUR_OWN && (
            <input
              type="text"
              required
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="Describe your theme"
              maxLength={80}
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
              maxLength={80}
              className="-mt-3 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
          )}

          <label className="block">
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Note (optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
              rows={4}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="vibe, favorite colors, things you love, things to avoid — the more detail you give me, the closer I'll get to your dream. I'll use my best judgment for anything you don't specify."
              className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
            <span className="mt-1 block text-right text-xs text-ink/40">
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </label>
        </div>
      ) : (
        <div className="card mt-6 flex flex-col gap-4 p-6">
          <label className="block">
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Tell me your dream {typeConfig.name.toLowerCase()}
            </span>
            <p className="mb-2 text-sm text-ink/60">
              {typeConfig.requiresPhoneModel ? "Phone model, vibe" : "Vibe"}, favorite colors,
              characters you love, things to avoid — the more detail you give me, the closer
              I&apos;ll get to your dream. I&apos;ll use my best judgment for anything you don&apos;t
              specify.
            </p>
            <textarea
              value={surpriseNote}
              onChange={(e) => setSurpriseNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
              rows={7}
              required
              maxLength={NOTE_MAX_LENGTH}
              placeholder={
                typeConfig.requiresPhoneModel
                  ? "e.g. iPhone 15, obsessed with Cinnamoroll and baby blue, love bows, please no glitter texture, it's a birthday gift for myself!"
                  : "e.g. obsessed with Cinnamoroll and baby blue, love bows and pearls, please no glitter texture, it's a birthday gift for myself!"
              }
              className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between">
              {!surpriseValid && surpriseNoteTrimmed.length > 0 ? (
                <p className="text-xs text-pastel-dark">
                  A few more details would help — at least {SURPRISE_NOTE_MIN_LENGTH} characters.
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-ink/40">
                {surpriseNote.length}/{NOTE_MAX_LENGTH}
              </span>
            </div>
          </label>
        </div>
      )}

      <div className="card mt-6 flex flex-col items-center gap-4 p-6 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-2">
          {activeDisplay.percentOff > 0 && (
            <span className="font-heading text-lg text-ink/40 line-through">₹{activeDisplay.mrpInr}</span>
          )}
          <span className="font-heading text-2xl font-bold text-ink">₹{activeDisplay.effectivePriceInr}</span>
          {activeDisplay.percentOff > 0 && (
            <span className="rounded-full bg-pastel-dark/10 px-2 py-0.5 text-xs font-bold text-pastel-dark">
              {activeDisplay.percentOff}% OFF
            </span>
          )}
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
              ? typeConfig.requiresPhoneModel
                ? "Pick a phone model, theme, style, weight, and colour to continue."
                : "Pick a theme, style, weight, and colour to continue."
              : `Write a little more about your dream ${typeConfig.name.toLowerCase()} to continue.`}
          </p>
        )}
      </div>
    </div>
  );
}
