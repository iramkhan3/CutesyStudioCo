// Client-safe formatting helpers shared by the admin dashboard pages.

export function formatMoney(amount: number, currency: "INR" | "USD"): string {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}
