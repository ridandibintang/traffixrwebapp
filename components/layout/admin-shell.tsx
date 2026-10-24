import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { CurrentUser } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import { UserBadge } from "./user-badge";

export function AdminShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Traffixr
          </Link>
        </div>
        <div className="px-3">
          <SidebarNav />
        </div>
        <div className="mt-auto flex flex-col gap-3 p-3">
          <Separator />
          <div className="px-2">
            <UserBadge user={user} />
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
