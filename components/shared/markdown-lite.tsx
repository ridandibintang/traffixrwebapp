import { Fragment } from "react";
import { parseBlocks, splitBold } from "@/lib/markdown";

function Inline({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  return (
    <>
      {splitBold(text).map((run, i) =>
        run.bold ? (
          <strong key={`${keyPrefix}${i}`}>{run.text}</strong>
        ) : (
          <Fragment key={`${keyPrefix}${i}`}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}

export function MarkdownLite({ text, className }: { text: string | null; className?: string }) {
  if (!text) return <span className="text-muted-foreground">—</span>;
  const blocks = parseBlocks(text);
  return (
    <div className={className ?? "flex flex-col gap-2 text-sm"}>
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i}>
            <Inline text={block.text} keyPrefix={`p${i}-`} />
          </p>
        ) : (
          <ul key={i} className="list-disc pl-5">
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} keyPrefix={`l${i}-${j}-`} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
