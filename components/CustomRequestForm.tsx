"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { useStore } from "@/components/StoreProvider";

type Category = { slug: string; name: string; fromInr: number | null };

const inputClass =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pastel";

/**
 * "Request a custom piece" form — any enabled category, free-text notes.
 * Nothing is charged here: the maker reviews it, then emails a price and a
 * payment link (or politely declines). See lib/custom-requests.ts.
 */
export function CustomRequestForm({ categories, initialCategory }: { categories: Category[]; initialCategory?: string }) {
  const { settings, countries: COUNTRIES, whatsappLink } = useStore();
  const [category, setCategory] = useState(
    categories.some((c) => c.slug === initialCategory) ? initialCategory! : categories[0]?.slug ?? ""
  );
  const [quantity, setQuantity] = useState("1");
  const [deviceModel, setDeviceModel] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("India");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const selected = categories.find((c) => c.slug === category);
  const isPhoneCase = category === "phone-cases";
  const notesLength = notes.trim().length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (notesLength < 20) {
      setError("Please describe what you'd like in at least 20 characters — colours, characters, theme, names…");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, quantity: Number(quantity), deviceModel, notes, name, email, phone, country, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSubmittedId(data.requestId ?? "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId !== null) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className="text-4xl">🎀</p>
        <h2 className="mt-3 font-heading text-2xl font-bold text-ink">Request received!</h2>
        <p className="mt-3 text-ink/70">
          Thank you{name ? `, ${name.split(" ")[0]}` : ""}! Your request{submittedId ? ` #${submittedId}` : ""} is with us.
          We&apos;ll review it personally and email you within 1-2 days with a price and a payment link — or with any
          questions. Nothing is charged until you approve the price.
        </p>
        <p className="mt-3 text-sm text-ink/60">We&apos;ve sent a confirmation to {email}.</p>
        <a
          href={whatsappLink(`Hi! Reference photos for my custom request #${submittedId}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-6"
        >
          Send reference photos on WhatsApp
        </a>
        <div className="mt-4">
          <Link href="/shop" className="text-sm font-semibold text-pastel hover:underline">
            Browse ready-made designs →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
      <div>
        <label className="block text-sm font-semibold text-ink">
          What would you like made?
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-1.5 text-xs text-ink/60">
          {selected?.fromInr != null
            ? `Starting from ₹${selected.fromInr.toLocaleString("en-IN")} each (~$${Math.ceil(selected.fromInr / settings.shipping.usdInrRate)}) — the final price depends on your design.`
            : "Price is quoted after we review your request."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
        <label className="block text-sm font-semibold text-ink">
          Quantity
          <input
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          {isPhoneCase ? "Phone model" : "Model / size (if relevant)"}
          <input
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder={isPhoneCase ? "e.g. iPhone 15 Pro" : "e.g. 750 ml bottle, A4 poster, 13\" laptop"}
            className={inputClass}
            required={isPhoneCase}
            maxLength={120}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-ink">
        Describe your dream piece
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="Colours, characters (Hello Kitty, Kuromi, Cinnamoroll…), theme, names or text to add, occasion, deadline — anything that helps!"
          className={inputClass}
          required
        />
        <span className={`mt-1 block text-xs font-normal ${notesLength < 20 ? "text-ink/50" : "text-green-700"}`}>
          {notesLength < 20 ? `${20 - notesLength} more characters needed` : "Looks great!"} · {notesLength}/2000
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required autoComplete="name" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required autoComplete="email" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Phone / WhatsApp
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required autoComplete="tel" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Country
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} required>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Honeypot — hidden from people, filled in by spam bots. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        name="website"
      />

      {error && (
        <p role="alert" className="rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Sending…" : "Send my request"}
      </button>
      <p className="text-center text-xs text-ink/60">
        No payment now. {SITE.name} reviews every request by hand and emails you a price within 1-2 days.
      </p>
    </form>
  );
}
