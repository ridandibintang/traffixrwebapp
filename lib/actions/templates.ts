"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const templateSchema = z.object({
  client_id: z.uuid().nullable(),
  title: z.string().min(1, "Title is required"),
  category: z.enum([
    "on_page", "technical", "content", "keyword_research", "off_page", "gbp", "reporting", "other",
  ]),
  frequency: z.enum(["per_cycle", "weekly", "monthly"]),
  default_assignee_id: z.uuid().nullable(),
});

function parseTemplate(fd: FormData) {
  return templateSchema.safeParse({
    client_id: optStr(fd, "client_id"),
    title: str(fd, "title"),
    category: str(fd, "category"),
    frequency: str(fd, "frequency"),
    default_assignee_id: optStr(fd, "default_assignee_id"),
  });
}

export async function createTemplateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseTemplate(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("task_templates").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  redirect("/templates");
}

export async function updateTemplateAction(
  templateId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseTemplate(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("task_templates").update(parsed.data).eq("id", templateId);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  redirect("/templates");
}

export async function deleteTemplateAction(templateId: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Tasks already generated keep existing; their template_id becomes null.
  const { error } = await supabase.from("task_templates").delete().eq("id", templateId);
  if (error) throw new Error(error.message);
  revalidatePath("/templates");
  redirect("/templates");
}
