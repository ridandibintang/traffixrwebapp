// English labels for every enum shown in the UI, plus option lists for forms.
import type {
  BacklinkStatus,
  ClientStatus,
  CycleStatus,
  GbpPostStatus,
  GbpPostType,
  PriorityLevel,
  TaskCategory,
  TaskSource,
  TaskStatus,
  TemplateFrequency,
} from "@/lib/types";

export const CLIENT_STATUS: Record<ClientStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

export const CYCLE_STATUS: Record<CycleStatus, string> = {
  planning: "Planning",
  active: "Active",
  review: "Review",
  closed: "Closed",
};

export const TASK_CATEGORY: Record<TaskCategory, string> = {
  on_page: "On-page",
  technical: "Technical",
  content: "Content",
  keyword_research: "Keyword research",
  off_page: "Off-page",
  gbp: "GBP",
  reporting: "Reporting",
  other: "Other",
};

export const TASK_STATUS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  wont_do: "Won't do",
};

// Column order on the kanban board
export const TASK_STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
  "wont_do",
];

export const OPEN_TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked"];

export const TASK_SOURCE: Record<TaskSource, string> = {
  manual: "Manual",
  audit: "Audit",
  template: "Template",
};

export const PRIORITY: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TEMPLATE_FREQUENCY: Record<TemplateFrequency, string> = {
  per_cycle: "Every cycle",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const BACKLINK_STATUS: Record<BacklinkStatus, string> = {
  planned: "Planned",
  ordered: "Ordered",
  live: "Live",
  lost: "Lost",
};

export const GBP_POST_TYPE: Record<GbpPostType, string> = {
  update: "Update",
  offer: "Offer",
  event: "Event",
};

export const GBP_POST_STATUS: Record<GbpPostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

export function options<T extends string>(map: Record<T, string>) {
  return (Object.keys(map) as T[]).map((value) => ({ value, label: map[value] }));
}
