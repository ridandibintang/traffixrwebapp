"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const tabs = [
    { label: "Overview", href: base, exact: false, excludes: ["/backlinks", "/gbp"] },
    { label: "Backlinks", href: `${base}/backlinks`, exact: false, excludes: [] },
    { label: "GBP posts", href: `${base}/gbp`, exact: false, excludes: [] },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const matches =
          pathname.startsWith(tab.href) &&
          !tab.excludes.some((ex) => pathname.startsWith(`${base}${ex}`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={matches ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              matches
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
