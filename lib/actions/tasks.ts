"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, lines, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  category: z.enum([
    "on_page", "technical", "content", "keyword_research", "off_page", "gbp", "reporting", "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "done", "blocked", "wont_do"]),
  assignee_id: z.uuid().nullable(),
  cycle_id: z.uuid().nullable(),
  due_date: z.string().regex(ISO_DATE).nullable(),
  affected_urls: z.array(z.string()),
});

function parseTask(fd: FormData) {
  return taskSchema.safeParse({
    title: str(fd, "title"),
    description: optStr(fd, "description"),
    category: str(fd, "category"),
    priority: str(fd, "priority"),
    status: str(fd, "status") || "todo",
    assignee_id: optStr(fd, "assignee_id"),
    cycle_id: optStr(fd, "cycle_id"),
    due_date: optStr(fd, "due_date"),
    affected_urls: lines(fd, "affected_urls"),
  });
}

/** Only allow in-app paths as redirect targets. */
function safeReturnTo(fd: FormData, fallback: string) {
  const value = optStr(fd, "return_to");
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function completedAt(status: TaskStatus, previous?: TaskStatus) {
  if (status === "done") return previous === "done" ? undefined : new Date().toISOString();
  return null;
}

export async function createTaskAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseTask(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    client_id: clientId,
    source: "manual",
    completed_at: completedAt(parsed.data.status) ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`, "layout");
  redirect(safeReturnTo(fd, `/clients/${clientId}`));
}

export async function updateTaskAction(
  taskId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseTask(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("client_id, status")
    .eq("id", taskId)
    .single();
  if (!existing) return { error: "Task not found." };

  const completed = completedAt(parsed.data.status, existing.status);
  const { error } = await supabase
    .from("tasks")
    .update({ ...parsed.data, ...(completed === undefined ? {} : { completed_at: completed }) })
    .eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${existing.client_id}`, "layout");
  redirect(safeReturnTo(fd, `/clients/${existing.client_id}`));
}

/** Quick status change from the board or list. */
export async function setTaskStatusAction(taskId: string, status: TaskStatus) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("client_id, status")
    .eq("id", taskId)
    .single();
  if (!existing) return;

  const completed = completedAt(status, existing.status);
  const { error } = await supabase
    .from("tasks")
    .update({ status, ...(completed === undefined ? {} : { completed_at: completed }) })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${existing.client_id}`, "layout");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(taskId: string, returnTo: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("client_id")
    .eq("id", taskId)
    .single();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  if (existing) revalidatePath(`/clients/${existing.client_id}`, "layout");
  redirect(returnTo.startsWith("/") ? returnTo : "/clients");
}
