import Link from "next/link";
import { KanbanSquare, List } from "lucide-react";
import { options, TASK_CATEGORY } from "@/lib/labels";
import type { TaskCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// Board/list toggle and category filter, driven by query params so the page
// stays a Server Component.
export function TaskFilters({
  basePath,
  view,
  category,
}: {
  basePath: string;
  view: "board" | "list";
  category: TaskCategory | null;
}) {
  const href = (next: { view?: "board" | "list"; category?: TaskCategory | null }) => {
    const params = new URLSearchParams();
    const v = next.view ?? view;
    const c = next.category === undefined ? category : next.category;
    if (v !== "board") params.set("view", v);
    if (c) params.set("category", c);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pill = (active: boolean) =>
    cn(
      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        <Link href={href({ category: null })} className={pill(category === null)}>
          All
        </Link>
        {options(TASK_CATEGORY).map((o) => (
          <Link key={o.value} href={href({ category: o.value })} className={pill(category === o.value)}>
            {o.label}
          </Link>
        ))}
      </div>
      <div className="flex rounded-lg border p-0.5">
        <Link
          href={href({ view: "board" })}
          aria-current={view === "board" ? "page" : undefined}
          className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", view === "board" && "bg-muted")}
        >
          <KanbanSquare className="size-3.5" /> Board
        </Link>
        <Link
          href={href({ view: "list" })}
          aria-current={view === "list" ? "page" : undefined}
          className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", view === "list" && "bg-muted")}
        >
          <List className="size-3.5" /> List
        </Link>
      </div>
    </div>
  );
}
