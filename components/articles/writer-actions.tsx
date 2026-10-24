"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/shared/field";
import { SubmitButton } from "@/components/shared/submit-button";
import { markPublishedAction, saveDraftUrlAction, submitForReviewAction } from "@/lib/actions/writer";
import { initialFormState } from "@/lib/form";
import type { Article } from "@/lib/types";

// The writer's lane: draft link, submit for review, published URL.
export function WriterActions({ article }: { article: Article }) {
  const [draftState, draftAction] = useActionState(saveDraftUrlAction.bind(null, article.id), initialFormState);
  const [publishState, publishAction] = useActionState(markPublishedAction.bind(null, article.id), initialFormState);

  const canEditDraft = ["draft", "assigned", "writing", "revision"].includes(article.status);
  const canSubmit = ["assigned", "writing", "revision"].includes(article.status) && !!article.draft_url;
  const waiting = article.status === "submitted" || article.status === "in_review";
  const canPublish = article.status === "approved";

  return (
    <div className="flex flex-col gap-5">
      {canEditDraft ? (
        <form action={draftAction} className="flex flex-col gap-3">
          <Field label="Draft link (Google Docs)" htmlFor="draft_url" hint="Share the doc with the admin, then paste the link here.">
            <Input id="draft_url" name="draft_url" type="url" placeholder="https://docs.google.com/document/..." defaultValue={article.draft_url ?? ""} required />
          </Field>
          <FormError error={draftState.error} />
          <SubmitButton size="sm" variant="outline" className="self-start">Save draft link</SubmitButton>
        </form>
      ) : null}

      {canSubmit ? (
        <form action={submitForReviewAction.bind(null, article.id)}>
          <Button type="submit" size="sm">
            <Send />
            {article.status === "revision" ? "Resubmit for review" : "Submit for review"}
          </Button>
        </form>
      ) : null}

      {waiting ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Submitted. The admin is reviewing your draft; you will see the decision and notes here.
        </p>
      ) : null}

      {canPublish ? (
        <form action={publishAction} className="flex flex-col gap-3">
          <Field label="Published URL" htmlFor="published_url" hint="Approved. Once the article is live, paste its URL.">
            <Input id="published_url" name="published_url" type="url" placeholder="https://" required />
          </Field>
          <FormError error={publishState.error} />
          <SubmitButton size="sm" className="self-start">Mark as published</SubmitButton>
        </form>
      ) : null}

      {article.status === "published" ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Published:{" "}
          <a href={article.published_url ?? "#"} target="_blank" rel="noreferrer" className="hover:underline">
            {article.published_url}
          </a>
        </p>
      ) : null}
    </div>
  );
}
