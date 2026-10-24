import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import type { ReviewWithReviewer } from "@/lib/queries/articles";

function CheckMark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${ok ? "text-foreground" : "text-muted-foreground"}`}>
      {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {label}
    </span>
  );
}

export function ReviewHistory({ reviews }: { reviews: ReviewWithReviewer[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              Round {r.round}
              <span className="ml-2 font-normal text-muted-foreground">
                {r.reviewer?.full_name ?? "Reviewer"} · {formatDate(r.created_at.slice(0, 10))}
              </span>
            </span>
            <Badge variant={r.decision === "approve" ? "default" : "destructive"}>
              {r.decision === "approve" ? "Approved" : "Revision requested"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <CheckMark ok={r.intent_ok} label="Intent" />
            <CheckMark ok={r.readability_ok} label="Readability" />
            <CheckMark ok={r.facts_ok} label="Facts" />
          </div>
          {r.notes ? <p className="text-sm whitespace-pre-wrap">{r.notes}</p> : null}
        </li>
      ))}
    </ol>
  );
}
