import { AdminShell } from "@/components/layout/admin-shell";
import { WriterShell } from "@/components/layout/writer-shell";
import { getCurrentUser } from "@/lib/auth";

// Every route under (app) requires a session, so nothing here is prerendered.
export const dynamic = "force-dynamic";

// The shell depends on the role: admins get the sidebar, writers get the
// simple header layout.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user.profile.role === "admin") {
    return <AdminShell user={user}>{children}</AdminShell>;
  }

  return <WriterShell user={user}>{children}</WriterShell>;
}
