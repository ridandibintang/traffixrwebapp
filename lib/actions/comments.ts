"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { CommentEntity } from "@/lib/types";

// Comments on an article (writers: own articles only, via RLS) or a brief.
export async function addCommentAction(
  entityType: CommentEntity,
  entityId: string,
  revalidate: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const body = str(fd, "body");
  if (!body) return { error: "Write something first." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    entity_type: entityType,
    entity_id: entityId,
    author_id: user.id,
    body,
  });
  if (error) return { error: error.message };

  revalidatePath(revalidate);
  return { error: null };
}
