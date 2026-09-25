"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_VARIABLES,
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplate,
  type EmailTemplateKey,
} from "@/lib/email-templates";

export default function AdminEmailEditorPage() {
  const params = useParams<{ key: string }>();
  const key = params.key as EmailTemplateKey;
  const isValidKey = (EMAIL_TEMPLATE_KEYS as string[]).includes(key);

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isValidKey) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/admin/emails/${key}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load.");
        if (cancelled) return;
        setTemplate(data.template);
        setSubject(data.template.subject);
        setHtml(data.template.html);
        setActive(data.template.active);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [key, isValidKey]);

  async function handlePreview() {
    setPreviewing(true);
    try {
      const res = await fetch(`/api/admin/emails/${key}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to preview.");
      setPreview(data);
    } catch (err) {
      setPreview({
        subject: "Preview failed",
        html: `<p>${err instanceof Error ? err.message : "Failed to preview."}</p>`,
      });
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/emails/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setTemplate(data.template);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/emails/${key}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html, to: testTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test email.");
      setTestResult({ ok: true, message: `Test email sent to ${testTo}.` });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "Failed to send test email." });
    } finally {
      setSendingTest(false);
    }
  }

  function handleResetToDefault() {
    const def = DEFAULT_EMAIL_TEMPLATES[key];
    if (!def) return;
    setSubject(def.subject);
    setHtml(def.html);
  }

  if (!isValidKey) {
    return (
      <div>
        <Link href="/admin/emails" className="text-sm font-semibold text-pastel-dark hover:underline">
          ← Back to emails
        </Link>
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Unknown email template.
        </p>
      </div>
    );
  }

  if (loading) return <div className="animate-pulse text-ink-light">Loading…</div>;

  if (loadError || !template) {
    return (
      <div>
        <Link href="/admin/emails" className="text-sm font-semibold text-pastel-dark hover:underline">
          ← Back to emails
        </Link>
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError || "Template not found."}
        </p>
      </div>
    );
  }

  const variables = EMAIL_TEMPLATE_VARIABLES[key] ?? [];

  return (
    <div>
      <Link href="/admin/emails" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to emails
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink">{template.name}</h1>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
          Send this email automatically
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
            <label className="mb-1 block text-xs font-semibold text-ink-light">Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
            />

            <label className="mb-1 mt-4 block text-xs font-semibold text-ink-light">Email body (HTML)</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={18}
              className="w-full rounded-xl2 border border-ink/15 px-3 py-2 font-mono text-xs outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
              >
                {previewing ? "Rendering…" : "Preview with sample order"}
              </button>
              <button onClick={handleResetToDefault} className="text-sm font-semibold text-ink-light hover:text-ink">
                Reset text to default
              </button>
              {saved && <span className="text-sm font-medium text-green-700">Saved.</span>}
              {saveError && <span className="text-sm font-medium text-red-700">{saveError}</span>}
            </div>
          </div>

          {preview && (
            <div className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
              <h2 className="font-heading text-lg font-bold text-ink">Preview</h2>
              <p className="mt-1 text-sm text-ink-light">Subject: {preview.subject}</p>
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                className="mt-3 h-96 w-full rounded-xl2 border border-blush-light bg-cream-light"
              />
            </div>
          )}

          <div className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
            <h2 className="font-heading text-lg font-bold text-ink">Send a test email</h2>
            <p className="mt-1 text-sm text-ink-light">
              Sends this draft (including unsaved changes) to an address of your choice, filled in with sample order
              data.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="min-w-[220px] flex-1 rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
              />
              <button
                onClick={handleSendTest}
                disabled={sendingTest || !testTo}
                className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
              >
                {sendingTest ? "Sending…" : "Send test"}
              </button>
            </div>
            {testResult && (
              <p className={`mt-2 text-sm font-medium ${testResult.ok ? "text-green-700" : "text-red-700"}`}>
                {testResult.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
            <h2 className="font-heading text-lg font-bold text-ink">Available placeholders</h2>
            <p className="mt-1 text-xs text-ink-light">
              Use these anywhere in the subject or body — they&apos;re filled in automatically for each order.
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              {variables.map((v) => (
                <div key={v.token}>
                  <dt className="font-mono font-semibold text-pastel-dark">{"{{" + v.token + "}}"}</dt>
                  <dd className="text-ink-light">{v.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
