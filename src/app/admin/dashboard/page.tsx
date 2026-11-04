/* Protects the canonical administrator dashboard route with a server-verified session. */
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return <AdminDashboard user={user} />;
}
