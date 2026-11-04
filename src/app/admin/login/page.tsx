import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administrator login" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");
  return <AdminLoginForm />;
}
