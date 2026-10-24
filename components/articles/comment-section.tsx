import { addCommentAction } from "@/lib/actions/comments";
import { formatDate } from "@/lib/dates";
import type { CommentWithAuthor } from "@/lib/queries/articles";
import type { CommentEntity } from "@/lib/types";
import { CommentForm } from "./comment-form";

export function CommentSection({
  entityType,
  entityId,
  comments,
  revalidate,
}: {
  entityType: CommentEntity;
  entityId: string;
  comments: CommentWithAuthor[];
  revalidate: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{c.author?.full_name ?? "Someone"}</span> ·{" "}
                {formatDate(c.created_at.slice(0, 10))}
              </p>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      <CommentForm action={addCommentAction.bind(null, entityType, entityId, revalidate)} />
    </div>
  );
}
