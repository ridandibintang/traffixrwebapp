"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { GBP_POST_STATUS, GBP_POST_TYPE, options } from "@/lib/labels";
import type { GbpPost } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: GbpPost;
  defaultDate: string;
  cancelHref: string;
};

export function GbpPostForm({ action, initial, defaultDate, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Scheduled date" htmlFor="scheduled_date">
          <Input id="scheduled_date" name="scheduled_date" type="date" required defaultValue={initial?.scheduled_date ?? defaultDate} />
        </Field>
        <Field label="Type" htmlFor="post_type">
          <NativeSelect id="post_type" name="post_type" defaultValue={initial?.post_type ?? "update"}>
            {options(GBP_POST_TYPE).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "draft"}>
            {options(GBP_POST_STATUS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={initial?.title ?? ""} />
      </Field>

      <Field label="Body" htmlFor="body" hint="Post text, ready to paste into Google Business Profile.">
        <Textarea id="body" name="body" rows={6} defaultValue={initial?.body ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Image" htmlFor="image_path" hint="Link to the image (Drive, Canva, or a URL). Uploads come later.">
          <Input id="image_path" name="image_path" defaultValue={initial?.image_path ?? ""} />
        </Field>
        <Field label="CTA URL" htmlFor="cta_url">
          <Input id="cta_url" name="cta_url" type="url" placeholder="https://" defaultValue={initial?.cta_url ?? ""} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requested_by_client"
          defaultChecked={initial?.requested_by_client ?? false}
          className="size-4"
        />
        Requested by the client
      </label>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Schedule post"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
