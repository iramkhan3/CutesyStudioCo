"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

const input =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pastel";

/** Public review form — saved as pending until the maker approves it in Admin → Reviews. */
export function ReviewForm({ initialOrder, initialName }: { initialOrder: string; initialName: string }) {
  const { settings, whatsappLink } = useStore();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState(initialOrder);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body, name, location, email, orderRef, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">💕</p>
        <h2 className="mt-3 font-heading text-2xl font-bold text-ink">Thank you so much!</h2>
        <p className="mt-2 text-ink/70">Your review means a lot. It&apos;ll appear on our homepage once we&apos;ve read it.</p>
        <p className="mt-4 text-sm text-ink/60">
          Have a photo of your piece? We&apos;d love to see it —{" "}
          <a href={whatsappLink("Hi! Here's a photo for my review 📸")} target="_blank" rel="noopener noreferrer" className="font-semibold text-pastel hover:underline">
            send it on WhatsApp
          </a>{" "}
          or tag {settings.instagramHandle} on Instagram.
        </p>
        <Link href="/shop" className="btn-secondary mt-6">
          Back to the shop
        </Link>
      </div>
    );
  }

  const shown = hover || rating;
  const labels = ["", "Not great", "Okay", "Good", "Lovely", "Absolutely loved it!"];

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-ink">Your rating</p>
        <div className="mt-2 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`text-4xl leading-none transition-transform hover:scale-110 ${n <= shown ? "text-amber-400" : "text-ink/15"}`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm text-ink/60">{labels[shown]}</p>
      </div>

      <label className="block text-sm font-semibold text-ink">
        Your review
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={1500}
          required
          placeholder="What did you order? How did it look in person? Would you recommend us?"
          className={input}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">
          Name to show
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} className={input} placeholder="e.g. Aanya S." />
        </label>
        <label className="block text-sm font-semibold text-ink">
          City (optional)
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} className={input} placeholder="e.g. Mumbai" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Email (optional, not shown)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} className={input} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Order number (optional)
          <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} maxLength={40} className={input} placeholder="e.g. 0f1bb124" />
        </label>
      </div>

      <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" />

      {error && <p role="alert" className="rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Sending…" : "Submit my review"}
      </button>
    </form>
  );
}
