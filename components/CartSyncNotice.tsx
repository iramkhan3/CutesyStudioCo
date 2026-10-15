"use client";

/** Shows what useCartSync() changed in the saved cart, if anything. */
export function CartSyncNotice({ notices }: { notices: string[] }) {
  if (notices.length === 0) return null;
  return (
    <div role="status" className="mt-6 rounded-xl2 border-2 border-lavender-dark/20 bg-lavender-light/60 p-4 text-sm text-ink/80">
      <p className="font-semibold text-ink">Your cart was updated</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {notices.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
