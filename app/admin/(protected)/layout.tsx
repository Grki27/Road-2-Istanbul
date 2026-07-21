import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminContext();
  return <AdminShell email={user.email ?? "Admin"}>{children}</AdminShell>;
}
