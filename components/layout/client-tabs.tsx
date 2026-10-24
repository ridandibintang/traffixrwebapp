"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { label: "Keywords", path: "/keywords" },
  { label: "Briefs", path: "/briefs" },
  { label: "Articles", path: "/articles" },
  { label: "Audits", path: "/audits" },
  { label: "Backlinks", path: "/backlinks" },
  { label: "GBP posts", path: "/gbp" },
  { label: "Metrics", path: "/metrics" },
  { label: "Reports", path: "/reports" },
];

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const activeSection = SECTIONS.find((s) => pathname.startsWith(`${base}${s.path}`));

  const tabs = [
    { label: "Overview", href: base, active: !activeSection },
    ...SECTIONS.map((s) => ({
      label: s.label,
      href: `${base}${s.path}`,
      active: activeSection?.path === s.path,
    })),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab.active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
