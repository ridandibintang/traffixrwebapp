"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { bool, firstIssue, optStr, str, type FormState } from "@/lib/form";
import { OPEN_TASK_STATUSES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { generateCycleTasks } from "@/lib/templates";
import type { CycleStatus } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const cycleSchema = z
  .object({
    number: z.coerce.number().int().min(1, "Cycle number must be 1 or more"),
    start_date: z.string().regex(ISO_DATE, "Start date is required"),
    end_date: z.string().regex(ISO_DATE, "End date is required"),
    meeting_date: z.string().regex(ISO_DATE).nullable(),
    status: z.enum(["planning", "active", "review", "closed"]),
    summary: z.string().nullable(),
  })
  .refine((c) => c.end_date >= c.start_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  });

function parseCycle(fd: FormData) {
  return cycleSchema.safeParse({
    number: str(fd, "number"),
    start_date: str(fd, "start_date"),
    end_date: str(fd, "end_date"),
    meeting_date: optStr(fd, "meeting_date"),
    status: str(fd, "status") || "planning",
    summary: optStr(fd, "summary"),
  });
}

function duplicateMessage(code: string | undefined, message: string) {
  return code === "23505" ? "This client already has a cycle with that number." : message;
}

export async function createCycleAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCycle(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: cycle, error } = await supabase
    .from("cycles")
    .insert({ ...parsed.data, client_id: clientId })
    .select("id, client_id, end_date")
    .single();
  if (error) return { error: duplicateMessage(error.code, error.message) };

  // Carry unfinished tasks over from the cycle that was just closed. Template
  // tasks stay behind: the new cycle gets its own copies from the templates.
  const moveFrom = optStr(fd, "move_from");
  if (moveFrom && bool(fd, "move_tasks")) {
    const { error: moveError } = await supabase
      .from("tasks")
      .update({ cycle_id: cycle.id })
      .eq("cycle_id", moveFrom)
      .in("status", OPEN_TASK_STATUSES)
      .is("template_id", null);
    if (moveError) return { error: `Cycle created, but moving tasks failed: ${moveError.message}` };
  }

  await generateCycleTasks(supabase, cycle);

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}/cycles/${cycle.id}`);
}

export async function updateCycleAction(
  cycleId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCycle(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: cycle, error } = await supabase
    .from("cycles")
    .update(parsed.data)
    .eq("id", cycleId)
    .select("client_id")
    .single();
  if (error) return { error: duplicateMessage(error.code, error.message) };

  revalidatePath(`/clients/${cycle.client_id}`);
  redirect(`/clients/${cycle.client_id}/cycles/${cycleId}`);
}

/** Button-driven status moves. Closing a cycle offers to create the next one. */
export async function setCycleStatusAction(cycleId: string, status: CycleStatus) {
  await requireAdmin();
  const supabase = await createClient();

  if (status === "active") {
    // Only one active cycle per client: park any other active cycle in review.
    const { data: current } = await supabase
      .from("cycles")
      .select("client_id")
      .eq("id", cycleId)
      .single();
    if (current) {
      await supabase
        .from("cycles")
        .update({ status: "review" })
        .eq("client_id", current.client_id)
        .eq("status", "active")
        .neq("id", cycleId);
    }
  }

  const { data: cycle, error } = await supabase
    .from("cycles")
    .update({ status })
    .eq("id", cycleId)
    .select("client_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${cycle.client_id}`);
  if (status === "closed") {
    redirect(`/clients/${cycle.client_id}/cycles/new?from=${cycleId}`);
  }
  redirect(`/clients/${cycle.client_id}/cycles/${cycleId}`);
}
