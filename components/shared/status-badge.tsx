import { Badge } from "@/components/ui/badge";
import {
  ARTICLE_STATUS,
  AUDIT_TYPE,
  BACKLINK_STATUS,
  BRIEF_STATUS,
  CLIENT_STATUS,
  CYCLE_STATUS,
  FINDING_SEVERITY,
  FINDING_STATE,
  GBP_POST_STATUS,
  PRIORITY,
  SEARCH_INTENT,
  TASK_CATEGORY,
  TASK_STATUS,
} from "@/lib/labels";
import type {
  ArticleStatus,
  AuditType,
  BacklinkStatus,
  BriefStatus,
  ClientStatus,
  CycleStatus,
  FindingSeverity,
  FindingState,
  GbpPostStatus,
  PriorityLevel,
  SearchIntent,
  TaskCategory,
  TaskStatus,
} from "@/lib/types";

type Variant = React.ComponentProps<typeof Badge>["variant"];

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const variant: Variant = status === "active" ? "default" : "secondary";
  return <Badge variant={variant}>{CLIENT_STATUS[status]}</Badge>;
}

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  const variant: Variant =
    status === "active" ? "default" : status === "closed" ? "outline" : "secondary";
  return <Badge variant={variant}>{CYCLE_STATUS[status]}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variant: Variant =
    status === "done"
      ? "default"
      : status === "blocked"
        ? "destructive"
        : status === "wont_do"
          ? "outline"
          : "secondary";
  return <Badge variant={variant}>{TASK_STATUS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const variant: Variant =
    priority === "urgent" ? "destructive" : priority === "high" ? "default" : "outline";
  return <Badge variant={variant}>{PRIORITY[priority]}</Badge>;
}

export function CategoryBadge({ category }: { category: TaskCategory }) {
  return <Badge variant="secondary">{TASK_CATEGORY[category]}</Badge>;
}

export function BacklinkStatusBadge({ status }: { status: BacklinkStatus }) {
  const variant: Variant =
    status === "live" ? "default" : status === "lost" ? "destructive" : "secondary";
  return <Badge variant={variant}>{BACKLINK_STATUS[status]}</Badge>;
}

export function GbpStatusBadge({ status }: { status: GbpPostStatus }) {
  const variant: Variant = status === "published" ? "default" : "secondary";
  return <Badge variant={variant}>{GBP_POST_STATUS[status]}</Badge>;
}

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const variant: Variant =
    status === "published"
      ? "default"
      : status === "approved"
        ? "default"
        : status === "revision"
          ? "destructive"
          : status === "submitted" || status === "in_review"
            ? "secondary"
            : "outline";
  return <Badge variant={variant}>{ARTICLE_STATUS[status]}</Badge>;
}

export function BriefStatusBadge({ status }: { status: BriefStatus }) {
  const variant: Variant =
    status === "ready" ? "default" : status === "archived" ? "outline" : "secondary";
  return <Badge variant={variant}>{BRIEF_STATUS[status]}</Badge>;
}

export function IntentBadge({ intent }: { intent: SearchIntent | null }) {
  if (!intent) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="outline">{SEARCH_INTENT[intent]}</Badge>;
}

export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const variant: Variant =
    severity === "critical" ? "destructive" : severity === "high" ? "default" : severity === "medium" ? "secondary" : "outline";
  return <Badge variant={variant}>{FINDING_SEVERITY[severity]}</Badge>;
}

export function FindingStateBadge({ state }: { state: FindingState }) {
  const variant: Variant = state === "new" ? "default" : state === "fixed" ? "outline" : "secondary";
  return <Badge variant={variant}>{FINDING_STATE[state]}</Badge>;
}

export function AuditTypeBadge({ type }: { type: AuditType }) {
  return <Badge variant="outline">{AUDIT_TYPE[type]}</Badge>;
}
