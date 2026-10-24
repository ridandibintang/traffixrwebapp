"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, linkItems, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website_url: z.url({ message: "Enter a full URL, e.g. https://example.com" }),
  cms: z.string().nullable(),
  industry: z.string().nullable(),
  status: z.enum(["active", "paused", "ended"]),
  started_at: z.string().regex(ISO_DATE).nullable(),
  audience: z.string().nullable(),
  brand_voice: z.string().nullable(),
  services: z.array(z.object({ name: z.string().min(1), url: z.string() })),
  key_pages: z.array(z.object({ name: z.string().min(1), url: z.string() })),
  client_notes: z.string().nullable(),
  gbp_url: z.url({ message: "GBP URL must be a full URL" }).nullable(),
});

function parseClient(fd: FormData) {
  return clientSchema.safeParse({
    name: str(fd, "name"),
    website_url: str(fd, "website_url"),
    cms: optStr(fd, "cms"),
    industry: optStr(fd, "industry"),
    status: str(fd, "status"),
    started_at: optStr(fd, "started_at"),
    audience: optStr(fd, "audience"),
    brand_voice: optStr(fd, "brand_voice"),
    services: linkItems(fd, "services"),
    key_pages: linkItems(fd, "key_pages"),
    client_notes: optStr(fd, "client_notes"),
    gbp_url: optStr(fd, "gbp_url"),
  });
}

export async function createClientAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseClient(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) {
    return {
      error: error.code === "23505" ? "A client with this website already exists." : error.message,
    };
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseClient(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", clientId);
  if (error) {
    return {
      error: error.code === "23505" ? "A client with this website already exists." : error.message,
    };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
