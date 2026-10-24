"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { bool, firstIssue, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const gbpSchema = z.object({
  scheduled_date: z.string().regex(ISO_DATE, "Scheduled date is required"),
  post_type: z.enum(["update", "offer", "event"]),
  title: z.string().nullable(),
  body: z.string().nullable(),
  image_path: z.string().nullable(),
  cta_url: z.url({ message: "CTA URL must be a full URL" }).nullable(),
  status: z.enum(["draft", "scheduled", "published"]),
  requested_by_client: z.boolean(),
});

function parsePost(fd: FormData) {
  return gbpSchema.safeParse({
    scheduled_date: str(fd, "scheduled_date"),
    post_type: str(fd, "post_type") || "update",
    title: optStr(fd, "title"),
    body: optStr(fd, "body"),
    image_path: optStr(fd, "image_path"),
    cta_url: optStr(fd, "cta_url"),
    status: str(fd, "status") || "draft",
    requested_by_client: bool(fd, "requested_by_client"),
  });
}

export async function createGbpPostAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePost(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("gbp_posts").insert({
    ...parsed.data,
    client_id: clientId,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/gbp`);
  redirect(`/clients/${clientId}/gbp`);
}

export async function updateGbpPostAction(
  postId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePost(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("gbp_posts")
    .select("client_id, published_at")
    .eq("id", postId)
    .single();
  if (!existing) return { error: "Post not found." };

  const published_at =
    parsed.data.status === "published"
      ? (existing.published_at ?? new Date().toISOString())
      : null;

  const { error } = await supabase
    .from("gbp_posts")
    .update({ ...parsed.data, published_at })
    .eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${existing.client_id}/gbp`);
  redirect(`/clients/${existing.client_id}/gbp`);
}

export async function deleteGbpPostAction(postId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("gbp_posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/gbp`);
  redirect(`/clients/${clientId}/gbp`);
}
