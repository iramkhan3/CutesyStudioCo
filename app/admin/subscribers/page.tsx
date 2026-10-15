"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/admin-format";

type Subscriber = { id: string; email: string; created_at: string };

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then((data) => setSubscribers(data.subscribers ?? []))
      .catch(() => setError("Failed to load subscribers."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => subscribers.filter((s) => s.email.toLowerCase().includes(search.trim().toLowerCase())),
    [subscribers, search]
  );
  const last30 = useMemo(
    () => subscribers.filter((s) => Date.now() - new Date(s.created_at).getTime() < 30 * 86400_000).length,
    [subscribers]
  );

  async function remove(s: Subscriber) {
    if (!confirm(`Remove ${s.email} from your list?`)) return;
    const res = await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    });
    if (res.ok) setSubscribers((prev) => prev.filter((x) => x.id !== s.id));
    else setError("Failed to remove subscriber.");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Subscribers</h1>
          <p className="mt-1 text-ink-light">
            People who joined your list from the homepage &quot;Get first dibs on new drops&quot; box. Export them to
            use in an email tool (Mailchimp, Brevo, etc.).
          </p>
        </div>
        <a
          href="/api/admin/subscribers?format=csv"
          className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-pastel-dark"
        >
          ⬇ Download CSV
        </a>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="rounded-xl2 border border-blush-light bg-white p-4 text-center shadow-soft">
          <p className="font-heading text-2xl font-bold text-ink">{subscribers.length}</p>
          <p className="text-xs text-ink-light">Total</p>
        </div>
        <div className="rounded-xl2 border border-blush-light bg-white p-4 text-center shadow-soft">
          <p className="font-heading text-2xl font-bold text-ink">{last30}</p>
          <p className="text-xs text-ink-light">Last 30 days</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emails…"
        className="mt-5 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-pastel sm:max-w-sm"
      />

      {error && <p className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && (
        <div className="mt-4 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-blush-light/50 text-ink-light">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-ink-light">
                    {subscribers.length === 0 ? "No subscribers yet." : "No matches."}
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-blush-light/70">
                  <td className="break-all px-4 py-3 text-ink">{s.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-light">{formatDateTime(s.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s)} className="text-xs font-semibold text-red-700 hover:underline">
                      Remove
                    </button>
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
