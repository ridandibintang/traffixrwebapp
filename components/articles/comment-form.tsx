"use client";

import { useActionState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/shared/field";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";

export function CommentForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const ref = useRef<HTMLFormElement>(null);

  // Clear the box after a successful post.
  useEffect(() => {
    if (!pending && state.error === null) ref.current?.reset();
  }, [pending, state]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2">
      <Textarea name="body" rows={3} placeholder="Write a comment..." aria-label="Comment" required />
      <FormError error={state.error} />
      <SubmitButton size="sm" variant="outline" className="self-start" pendingText="Posting...">
        Post comment
      </SubmitButton>
    </form>
  );
}
