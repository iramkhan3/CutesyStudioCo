"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { StoreSettings } from "@/lib/settings-defaults";

const input =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pastel";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-light">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-ink-light">
      {label}
      {children}
      {hint && <span className="mt-1 block font-normal">{hint}</span>}
    </label>
  );
}

type ZoneRow = { country: string; rate: string };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [defaults, setDefaults] = useState<StoreSettings | null>(null);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/store")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.value);
        setDefaults(data.defaults);
        setZones(zoneRows(data.value));
      })
      .catch(() => setError("Failed to load settings."));
  }, []);

  function zoneRows(s: StoreSettings): ZoneRow[] {
    return Object.entries(s.shipping.intlZones)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, rate]) => ({ country, rate: String(rate) }));
  }

  function update(patch: Partial<StoreSettings>) {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    setDirty(true);
    setSaved(false);
  }
  function updateShipping(patch: Partial<StoreSettings["shipping"]>) {
    setSettings((s) => (s ? { ...s, shipping: { ...s.shipping, ...patch } } : s));
    setDirty(true);
    setSaved(false);
  }
  function updateZones(next: ZoneRow[]) {
    setZones(next);
    setDirty(true);
    setSaved(false);
  }

  const usdHint = useMemo(() => {
    if (!settings) return "";
    const r = settings.shipping.usdInrRate;
    return `₹${settings.shipping.domesticFlatInr} ≈ $${(settings.shipping.domesticFlatInr / r).toFixed(2)} · $${settings.shipping.freeThresholdUsdIntl} ≈ ₹${Math.round(settings.shipping.freeThresholdUsdIntl * r)}`;
  }, [settings]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    const intlZones: Record<string, number> = {};
    for (const z of zones) {
      if (!z.country.trim()) continue;
      intlZones[z.country.trim()] = Number(z.rate);
    }
    const value: StoreSettings = { ...settings, shipping: { ...settings.shipping, intlZones } };
    try {
      const res = await fetch("/api/admin/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setSettings(data.value);
      setZones(zoneRows(data.value));
      setDirty(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings || !defaults) return <p className="text-ink-light">{error ?? "Loading…"}</p>;
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div className="max-w-3xl pb-24">
      <h1 className="font-heading text-3xl font-bold text-ink">Store settings</h1>
      <p className="mt-1 text-ink-light">
        Changes apply across the whole site — checkout, emails, footer, WhatsApp button — as soon as you save.
      </p>

      <div className="mt-6 space-y-5">
        <Section title="Contact details" description="Shown in the footer, contact section, emails, and the WhatsApp button. New-order and custom-request notifications are sent to the contact email.">
          <Field label="Contact email">
            <input type="email" value={settings.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} className={input} />
          </Field>
          <Field label="WhatsApp number" hint="With country code, e.g. 919167829289 for +91 91678 29289.">
            <input value={settings.whatsappNumber} onChange={(e) => update({ whatsappNumber: e.target.value })} className={input} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Instagram handle">
              <input value={settings.instagramHandle} onChange={(e) => update({ instagramHandle: e.target.value })} className={input} placeholder="@cutesystudioco" />
            </Field>
            <Field label="Instagram link">
              <input value={settings.instagramUrl} onChange={(e) => update({ instagramUrl: e.target.value })} className={input} placeholder="https://www.instagram.com/…" />
            </Field>
          </div>
        </Section>

        <Section title="Announcement bar" description="A thin strip above the menu on every page — great for sales, holidays, or shipping delays. Leave empty to hide it.">
          <Field label="Announcement text" hint={`${settings.announcementText.length}/200`}>
            <input
              value={settings.announcementText}
              maxLength={200}
              onChange={(e) => update({ announcementText: e.target.value })}
              className={input}
              placeholder="e.g. 🎄 Order by Dec 15 for Christmas delivery!"
            />
          </Field>
          {settings.announcementText.trim() && (
            <div className="rounded-lg bg-ink px-4 py-2 text-center font-heading text-xs font-semibold text-white">{settings.announcementText}</div>
          )}
        </Section>

        <Section title="Custom order note" description="Shown in the custom builder, cart, and checkout whenever a custom (made-to-order) piece is involved.">
          <Field label="Note">
            <textarea
              value={settings.customOrderTimelineNote}
              rows={3}
              maxLength={600}
              onChange={(e) => update({ customOrderTimelineNote: e.target.value })}
              className={input}
            />
          </Field>
        </Section>

        <Section title="Shipping & currency" description="Used for every order. Checks are made on what the customer pays for items after any coupon.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Shipping within India (₹)">
              <input type="number" min={0} value={settings.shipping.domesticFlatInr} onChange={(e) => updateShipping({ domesticFlatInr: num(e.target.value) })} className={input} />
            </Field>
            <Field label="Free shipping in India from (₹)">
              <input type="number" min={0} value={settings.shipping.freeThresholdInr} onChange={(e) => updateShipping({ freeThresholdInr: num(e.target.value) })} className={input} />
            </Field>
            <Field label="Free international shipping from ($)">
              <input type="number" min={0} step={0.01} value={settings.shipping.freeThresholdUsdIntl} onChange={(e) => updateShipping({ freeThresholdUsdIntl: num(e.target.value) })} className={input} />
            </Field>
            <Field label="International rate for other countries (₹)" hint="Used for any country not in the list below.">
              <input type="number" min={0} value={settings.shipping.intlDefaultInr} onChange={(e) => updateShipping({ intlDefaultInr: num(e.target.value) })} className={input} />
            </Field>
            <Field label="$1 = ₹" hint={usdHint}>
              <input type="number" min={10} step={0.01} value={settings.shipping.usdInrRate} onChange={(e) => updateShipping({ usdInrRate: num(e.target.value) })} className={input} />
            </Field>
          </div>
          <p className="text-xs text-ink-light">
            The $/₹ rate converts shipping for PayPal orders, coupon minimums, and the &quot;(~$X USD)&quot; hints. It does
            not change product $ prices — those are set per product.
          </p>
        </Section>

        <Section
          title="International shipping by country"
          description="Flat shipping rate (₹) per country. These countries also appear in the checkout country list; PayPal orders are charged the $ equivalent."
        >
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {zones.map((z, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={z.country}
                  onChange={(e) => updateZones(zones.map((row, j) => (j === i ? { ...row, country: e.target.value } : row)))}
                  className={`${input} mt-0 flex-1`}
                  placeholder="Country"
                />
                <span className="text-sm text-ink-light">₹</span>
                <input
                  type="number"
                  min={0}
                  value={z.rate}
                  onChange={(e) => updateZones(zones.map((row, j) => (j === i ? { ...row, rate: e.target.value } : row)))}
                  className={`${input} mt-0 w-28`}
                />
                <button
                  type="button"
                  onClick={() => updateZones(zones.filter((_, j) => j !== i))}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  aria-label={`Remove ${z.country}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => updateZones([...zones, { country: "", rate: String(settings.shipping.intlDefaultInr) }])}
              className="rounded-full border-2 border-pastel-light px-4 py-1.5 text-sm font-semibold text-ink hover:border-pastel"
            >
              + Add country
            </button>
            <button
              type="button"
              onClick={() => updateZones(zoneRows(defaults))}
              className="text-sm text-ink-light underline"
            >
              Reset to the original list
            </button>
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blush-light bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm">
            {error ? (
              <span className="font-medium text-red-700">{error}</span>
            ) : saved ? (
              <span className="font-medium text-green-700">Saved — live on the site now.</span>
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
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
