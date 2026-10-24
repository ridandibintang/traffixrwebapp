import { MarkdownLite } from "@/components/shared/markdown-lite";
import { SEARCH_INTENT } from "@/lib/labels";
import type { BriefWithChildren } from "@/lib/types";

// Read-only brief that mirrors the Golden Standard document: section bars,
// two-column tables, and the colour-coded outline. Used by admins and by
// writers on their article page.

const COLORS = {
  bar: "#1F3864",
  label: "#D5E8F0",
  outlineHeader: "#4A4A4A",
  h1: "#1F3864",
  h2: "#2E75B6",
  h3: "#D6E4F0",
  border: "#CCCCCC",
};

function SectionBar({ title }: { title: string }) {
  return (
    <div className="rounded-t-md px-3 py-1.5 text-sm font-bold text-white" style={{ backgroundColor: COLORS.bar }}>
      {title}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="align-top">
      <th
        scope="row"
        className="w-44 border px-3 py-2 text-left text-sm font-bold"
        style={{ backgroundColor: COLORS.label, borderColor: COLORS.border }}
      >
        {label}
      </th>
      <td className="border px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
        {children}
      </td>
    </tr>
  );
}

function TwoCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionBar title={title} />
      <table className="w-full border-collapse">
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

function Text({ value }: { value: string | null }) {
  return value ? <span className="whitespace-pre-wrap">{value}</span> : <span className="text-muted-foreground">—</span>;
}

export function BriefView({ brief }: { brief: BriefWithChildren }) {
  const wordCount =
    brief.word_count_min != null || brief.word_count_max != null
      ? `${brief.word_count_min ?? "?"} – ${brief.word_count_max ?? "?"} words`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <TwoCol title="1. Fundamentals">
        <Row label="Objective"><Text value={brief.objective} /></Row>
        <Row label="Search Intent">
          {brief.search_intent ? (
            <>
              <span className="font-medium">{SEARCH_INTENT[brief.search_intent]}</span>
              {brief.intent_reason ? <span> — {brief.intent_reason}</span> : null}
            </>
          ) : (
            <Text value={brief.intent_reason} />
          )}
        </Row>
        <Row label="Target Audience"><Text value={brief.target_audience} /></Row>
        <Row label="Target Keyword"><span className="font-medium">{brief.target_keyword}</span></Row>
        <Row label="Word Count"><Text value={wordCount} /></Row>
      </TwoCol>

      <TwoCol title="2. Meta Data">
        <Row label="Meta Title">
          <Text value={brief.meta_title} />
          {brief.meta_title ? <span className="ml-2 text-xs text-muted-foreground">({brief.meta_title.length} characters)</span> : null}
        </Row>
        <Row label="Meta Description">
          <Text value={brief.meta_description} />
          {brief.meta_description ? <span className="ml-2 text-xs text-muted-foreground">({brief.meta_description.length} characters)</span> : null}
        </Row>
      </TwoCol>

      <TwoCol title="3. Competitors & Gap Analysis">
        {brief.competitors.map((c) => (
          <Row key={c.id} label={`Competitor ${c.position}`}>
            <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-400">
              {c.domain}
              {c.page_title ? ` — ${c.page_title}` : ""}
            </a>
          </Row>
        ))}
        <Row label="Content Gaps (What Competitors Are Missing)">
          <MarkdownLite text={brief.content_gaps} />
        </Row>
      </TwoCol>

      <TwoCol title="4. Internal Links">
        <Row label="Note">Place links contextually throughout the article, not clustered in one section.</Row>
        {brief.internal_links.map((l) => (
          <Row key={l.id} label={`Link ${l.position}`}>
            <div className="flex flex-col gap-0.5">
              <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-blue-700 hover:underline dark:text-blue-400">
                {l.url}
              </a>
              <span>
                Anchor: <span className="font-medium">{l.anchor_text}</span>
              </span>
              {l.placement_note ? <span className="text-muted-foreground">{l.placement_note}</span> : null}
            </div>
          </Row>
        ))}
      </TwoCol>

      <section>
        <SectionBar title="5. Content Outline" />
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm font-bold text-white" style={{ backgroundColor: COLORS.outlineHeader }}>
              <th className="w-72 border px-3 py-2" style={{ borderColor: COLORS.border }}>Heading</th>
              <th className="border px-3 py-2" style={{ borderColor: COLORS.border }}>Key Points to Cover</th>
            </tr>
          </thead>
          <tbody>
            {brief.outline.map((o) => {
              const style =
                o.level === "h1"
                  ? { backgroundColor: COLORS.h1, color: "#fff" }
                  : o.level === "h2"
                    ? { backgroundColor: COLORS.h2, color: "#fff" }
                    : { backgroundColor: COLORS.h3, color: "#000" };
              return (
                <tr key={o.id} className="align-top">
                  <td className="border px-3 py-2 text-sm font-bold" style={{ ...style, borderColor: COLORS.border }}>
                    <span className="mr-2 text-xs font-normal opacity-80">{o.level.toUpperCase()}</span>
                    {o.heading}
                  </td>
                  <td className="border px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    <MarkdownLite text={o.key_points} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <TwoCol title="6. Writing Best Practices">
        <Row label="Best Practices for the Writer">
          <MarkdownLite text={brief.writing_best_practices} />
        </Row>
      </TwoCol>

      <TwoCol title="7. Conclusion & CTA">
        <Row label="Conclusion Notes"><Text value={brief.conclusion_notes} /></Row>
        <Row label="CTA Copy Example"><Text value={brief.cta_copy} /></Row>
      </TwoCol>
    </div>
  );
}
