"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmailTemplate } from "@/lib/email-templates";

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/emails");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load email templates.");
        if (!cancelled) setTemplates(data.templates);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load email templates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleActive(t: EmailTemplate) {
    setTogglingKey(t.key);
    try {
      const res = await fetch(`/api/admin/emails/${t.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: t.subject, html: t.html, active: !t.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update.");
      setTemplates((prev) => prev.map((p) => (p.key === t.key ? data.template : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setTogglingKey(null);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">Emails</h1>
      <p className="mt-1 max-w-2xl text-ink-light">
        These are the automated emails sent through an order&apos;s life — confirmation, shipped, delivered,
        cancelled, plus your own new-order alert. Turn any of them off, or edit the subject and message. Changes
        apply to the very next email sent.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-blush-light/50 text-ink-light">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.key} className="border-t border-blush-light/70 hover:bg-cream-light">
                  <td className="px-4 py-3 font-semibold text-ink">{t.name}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink-light">{t.subject}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(t)}
                      disabled={togglingKey === t.key}
                      title={t.active ? "Click to deactivate" : "Click to activate"}
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-75 disabled:opacity-50 ${
                        t.active ? "bg-green-100 text-green-800" : "bg-blush-light text-ink"
                      }`}
                    >
                      {togglingKey === t.key ? "…" : t.active ? "active" : "inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/emails/${t.key}`} className="text-sm font-semibold text-pastel-dark hover:underline">
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
