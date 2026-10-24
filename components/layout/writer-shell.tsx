import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { UserBadge } from "./user-badge";

// Writers get a single-page layout: a slim header and their content below.
export function WriterShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/my-articles" className="text-lg font-semibold tracking-tight">
            Traffixr
          </Link>
          <div className="flex items-center gap-4">
            <UserBadge user={user} />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
