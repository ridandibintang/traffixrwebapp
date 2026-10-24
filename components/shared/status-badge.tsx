import { Badge } from "@/components/ui/badge";
import {
  BACKLINK_STATUS,
  CLIENT_STATUS,
  CYCLE_STATUS,
  GBP_POST_STATUS,
  PRIORITY,
  TASK_CATEGORY,
  TASK_STATUS,
} from "@/lib/labels";
import type {
  BacklinkStatus,
  ClientStatus,
  CycleStatus,
  GbpPostStatus,
  PriorityLevel,
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
