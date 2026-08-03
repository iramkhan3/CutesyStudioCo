"use client";

import { useState, type FormEvent } from "react";
import { MailIcon, SparkleIcon } from "@/components/Icons";

type Status = "idle" | "loading" | "success" | "error";

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-full bg-white/70 px-6 py-3 font-heading text-sm font-semibold text-ink">
        <SparkleIcon className="h-4 w-4 text-pastel" />
        You&apos;re on the list! Welcome to the studio 🎀
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <label htmlFor="email-signup" className="sr-only">
        Email address
      </label>
      <div className="relative flex-1">
        <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          id="email-signup"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border-2 border-white bg-white/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-pastel focus:outline-none"
        />
      </div>
      <button type="submit" disabled={status === "loading"} className="btn-primary shrink-0">
        {status === "loading" ? "Joining..." : "Join the List"}
      </button>
      {status === "error" && (
        <p className="mt-1 w-full text-center text-xs text-pastel-dark sm:absolute sm:translate-y-16">
          Something went wrong — please try again in a bit.
        </p>
      )}
    </form>
  );
}
