"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, optNumber, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const backlinkSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month is required"),
  source_domain: z.string().min(1, "Source domain is required"),
  source_url: z.url({ message: "Source URL must be a full URL" }).nullable(),
  target_url: z.url({ message: "Target URL must be a full URL" }),
  anchor_text: z.string().nullable(),
  cost: z.number().min(0).nullable(),
  status: z.enum(["planned", "ordered", "live", "lost"]),
  ordered_at: z.string().regex(ISO_DATE).nullable(),
  live_at: z.string().regex(ISO_DATE).nullable(),
  notes: z.string().nullable(),
});

function parseBacklink(fd: FormData) {
  const parsed = backlinkSchema.safeParse({
    month: str(fd, "month"),
    source_domain: str(fd, "source_domain").replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    source_url: optStr(fd, "source_url"),
    target_url: str(fd, "target_url"),
    anchor_text: optStr(fd, "anchor_text"),
    cost: optNumber(fd, "cost"),
    status: str(fd, "status") || "planned",
    ordered_at: optStr(fd, "ordered_at"),
    live_at: optStr(fd, "live_at"),
    notes: optStr(fd, "notes"),
  });
  if (!parsed.success) return parsed;
  // The month column stores the first day of the month.
  return { success: true as const, data: { ...parsed.data, month: `${parsed.data.month}-01` } };
}

export async function createBacklinkAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseBacklink(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("backlinks").insert({ ...parsed.data, client_id: clientId });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/backlinks`);
  redirect(`/clients/${clientId}/backlinks`);
}

export async function updateBacklinkAction(
  backlinkId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseBacklink(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("backlinks")
    .update(parsed.data)
    .eq("id", backlinkId)
    .select("client_id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/clients/${data.client_id}/backlinks`);
  redirect(`/clients/${data.client_id}/backlinks`);
}

export async function deleteBacklinkAction(backlinkId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("backlinks").delete().eq("id", backlinkId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/backlinks`);
  redirect(`/clients/${clientId}/backlinks`);
}
