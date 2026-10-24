"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormError } from "@/components/shared/field";
import { CategoryBadge, SeverityBadge } from "@/components/shared/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { setGroupStatusAction } from "@/lib/actions/audits";
import { initialFormState, type FormState } from "@/lib/form";
import { options, PRIORITY, SEVERITY_TO_PRIORITY } from "@/lib/labels";
import type { FindingSeverity, TaskCategory } from "@/lib/types";

export type GroupRow = {
  issue_name: string;
  key: string;
  hasRule: boolean;
  severity: FindingSeverity;
  category: TaskCategory | null;
  counts: { new: number; persisting: number; fixed: number; open: number; converted: number; ignored: number };
  urlCount: number;
  taskIds: string[];
};

type Props = {
  auditId: string;
  clientId: string;
  groups: GroupRow[];
  team: { id: string; full_name: string }[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
};

function GroupStatusButton({ auditId, group }: { auditId: string; group: GroupRow }) {
  const [pending, startTransition] = useTransition();
  if (group.counts.open === 0 && group.counts.ignored === 0) return null;
  const next = group.counts.open > 0 ? "ignored" : "open";
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() => startTransition(() => setGroupStatusAction(auditId, group.key, next))}
    >
      {next === "ignored" ? "Ignore" : "Reopen"}
    </Button>
  );
}

export function AuditGroups({ auditId, clientId, groups, team, action }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const convertible = groups.filter((g) => g.counts.open > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set(convertible.filter((g) => g.hasRule).map((g) => g.key)));

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                aria-label="Select all open issues"
                className="size-4"
                checked={convertible.length > 0 && convertible.every((g) => selected.has(g.key))}
                onChange={(e) => setSelected(e.target.checked ? new Set(convertible.map((g) => g.key)) : new Set())}
              />
            </TableHead>
            <TableHead>Issue</TableHead>
            <TableHead className="text-right">URLs</TableHead>
            <TableHead className="text-right">New</TableHead>
            <TableHead className="text-right">Persisting</TableHead>
            <TableHead className="text-right">Fixed</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Task priority</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-muted-foreground">No findings in this crawl.</TableCell>
            </TableRow>
          ) : (
            groups.map((g) => {
              const canConvert = g.counts.open > 0;
              return (
                <TableRow key={g.key} className={g.counts.open === 0 ? "text-muted-foreground" : undefined}>
                  <TableCell>
                    {canConvert ? (
                      <input
                        type="checkbox"
                        name="issue"
                        value={g.key}
                        className="size-4"
                        checked={selected.has(g.key)}
                        onChange={() => toggle(g.key)}
                        aria-label={`Convert ${g.issue_name}`}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className="font-medium">
                    {g.issue_name}
                    {!g.hasRule ? <span className="ml-2 text-xs font-normal text-muted-foreground">unclassified</span> : null}
                  </TableCell>
                  <TableCell className="text-right">{g.urlCount}</TableCell>
                  <TableCell className="text-right">{g.counts.new || "—"}</TableCell>
                  <TableCell className="text-right">{g.counts.persisting || "—"}</TableCell>
                  <TableCell className="text-right">{g.counts.fixed || "—"}</TableCell>
                  <TableCell>{g.category ? <CategoryBadge category={g.category} /> : "—"}</TableCell>
                  <TableCell><SeverityBadge severity={g.severity} /></TableCell>
                  <TableCell>
                    {canConvert ? (
                      <NativeSelect
                        name={`priority_${g.key}`}
                        defaultValue={SEVERITY_TO_PRIORITY[g.severity]}
                        className="h-7 text-xs"
                        aria-label={`Priority for ${g.issue_name}`}
                      >
                        {options(PRIORITY).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </NativeSelect>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-wrap items-center gap-1">
                      {g.taskIds.map((id, i) => (
                        <Link key={id} href={`/clients/${clientId}/tasks/${id}/edit?return_to=${encodeURIComponent(`/clients/${clientId}/audits/${auditId}`)}`} className="hover:underline">
                          Task{g.taskIds.length > 1 ? ` ${i + 1}` : ""}
                        </Link>
                      ))}
                      {g.counts.ignored > 0 && g.counts.open === 0 ? <span>Ignored</span> : null}
                      {g.counts.open === 0 && g.counts.ignored === 0 && g.taskIds.length === 0 && g.urlCount === 0 ? <span>All fixed</span> : null}
                      <GroupStatusButton auditId={auditId} group={g} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <FormError error={state.error} />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <label className="flex items-center gap-2 text-sm">
          Assign tasks to
          <NativeSelect name="assignee_id" defaultValue="" className="h-8 w-44">
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </NativeSelect>
        </label>
        <SubmitButton size="sm" disabled={selected.size === 0} pendingText="Creating tasks...">
          Create {selected.size} task{selected.size === 1 ? "" : "s"}
        </SubmitButton>
        <span className="text-xs text-muted-foreground">
          One task per issue, with every affected URL attached. Unclassified issues use the suggested category.
        </span>
      </div>
    </form>
  );
}
