"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, linkItemsToText, type FormState } from "@/lib/form";
import { CLIENT_STATUS, options } from "@/lib/labels";
import type { Client } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Client;
  cancelHref: string;
};

export function ClientForm({ action, initial, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">Profile</h2>
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
        </Field>
        <Field label="Website URL" htmlFor="website_url">
          <Input
            id="website_url"
            name="website_url"
            type="url"
            required
            placeholder="https://"
            defaultValue={initial?.website_url ?? ""}
          />
        </Field>
        <Field label="CMS" htmlFor="cms">
          <Input id="cms" name="cms" placeholder="WordPress" defaultValue={initial?.cms ?? ""} />
        </Field>
        <Field label="Industry" htmlFor="industry">
          <Input id="industry" name="industry" defaultValue={initial?.industry ?? ""} />
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "active"}>
            {options(CLIENT_STATUS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Started on" htmlFor="started_at">
          <Input id="started_at" name="started_at" type="date" defaultValue={initial?.started_at ?? ""} />
        </Field>
        <Field label="Google Business Profile URL" htmlFor="gbp_url" className="sm:col-span-2">
          <Input id="gbp_url" name="gbp_url" type="url" placeholder="https://" defaultValue={initial?.gbp_url ?? ""} />
        </Field>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-base font-semibold">Content context</h2>
          <p className="text-sm text-muted-foreground">
            Replaces the Claude project instructions. Copy this block when creating a brief.
          </p>
        </div>
        <Field label="Audience" htmlFor="audience" hint="Who the content is for.">
          <Textarea id="audience" name="audience" rows={3} defaultValue={initial?.audience ?? ""} />
        </Field>
        <Field label="Brand voice" htmlFor="brand_voice" hint="Tone, do's and don'ts.">
          <Textarea id="brand_voice" name="brand_voice" rows={3} defaultValue={initial?.brand_voice ?? ""} />
        </Field>
        <Field
          label="Services"
          htmlFor="services"
          hint="One per line as: Service name | https://page-url"
        >
          <Textarea
            id="services"
            name="services"
            rows={4}
            placeholder={"WhatsApp Business API | https://example.com/whatsapp"}
            defaultValue={linkItemsToText(initial?.services)}
          />
        </Field>
        <Field
          label="Key pages"
          htmlFor="key_pages"
          hint="Pages to link to internally. One per line as: Page title | https://page-url"
        >
          <Textarea
            id="key_pages"
            name="key_pages"
            rows={4}
            defaultValue={linkItemsToText(initial?.key_pages)}
          />
        </Field>
        <Field label="Client notes" htmlFor="client_notes" hint="Special requests, taboo topics, where credentials are kept (never the credentials themselves).">
          <Textarea id="client_notes" name="client_notes" rows={4} defaultValue={initial?.client_notes ?? ""} />
        </Field>
      </section>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Create client"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
