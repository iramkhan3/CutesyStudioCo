import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

// Belt-and-suspenders alongside the /admin disallow rule in app/robots.ts —
// this order-management area should never be indexed or linked from search.
export const metadata: Metadata = {
  title: "Admin — CutesyStudioCo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
