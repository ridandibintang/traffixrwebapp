"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { DEFAULT_BEST_PRACTICES } from "@/lib/briefs/schema";
import { initialFormState, type FormState } from "@/lib/form";
import { BRIEF_STATUS, options, OUTLINE_LEVEL, SEARCH_INTENT } from "@/lib/labels";
import type { BriefWithChildren, OutlineLevel } from "@/lib/types";

type CompetitorRow = { domain: string; page_title: string; url: string };
type LinkRow = { url: string; anchor_text: string; placement_note: string };
type OutlineRow = { level: OutlineLevel; heading: string; key_points: string };

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: BriefWithChildren;
  defaultKeyword?: { id: string | null; text: string };
  keywords: { id: string; keyword: string }[];
  cancelHref: string;
};

const META_TITLE_MAX = 60;
const META_DESC_MAX = 155;

function Section({ number, title, hint, children }: { number: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border p-5">
      <div>
        <h2 className="text-base font-semibold">
          {number}. {title}
        </h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function RowTools<T>({
  rows,
  index,
  setRows,
}: {
  rows: T[];
  index: number;
  setRows: (rows: T[]) => void;
}) {
  const move = (dir: -1 | 1) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  };
  return (
    <div className="flex shrink-0 gap-0.5">
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Move up" onClick={() => move(-1)}>
        <ArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Move down" onClick={() => move(1)}>
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Remove row"
        onClick={() => setRows(rows.filter((_, i) => i !== index))}
      >
        <X />
      </Button>
    </div>
  );
}

export function BriefForm({ action, initial, defaultKeyword, keywords, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  const [targetKeyword, setTargetKeyword] = useState(initial?.target_keyword ?? defaultKeyword?.text ?? "");
  const [keywordId, setKeywordId] = useState(initial?.keyword_id ?? defaultKeyword?.id ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.meta_description ?? "");

  const [competitors, setCompetitors] = useState<CompetitorRow[]>(
    initial?.competitors.map((c) => ({ domain: c.domain, page_title: c.page_title ?? "", url: c.url })) ?? [],
  );
  const [links, setLinks] = useState<LinkRow[]>(
    initial?.internal_links.map((l) => ({ url: l.url, anchor_text: l.anchor_text, placement_note: l.placement_note ?? "" })) ?? [],
  );
  const [outline, setOutline] = useState<OutlineRow[]>(
    initial?.outline.map((o) => ({ level: o.level, heading: o.heading, key_points: o.key_points ?? "" })) ??
      [{ level: "h1", heading: "", key_points: "" }],
  );

  const withPositions = <T,>(rows: T[]) => rows.map((r, i) => ({ ...r, position: i + 1 }));

  const update = <T,>(rows: T[], setRows: (r: T[]) => void, index: number, patch: Partial<T>) =>
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const counter = (len: number, max: number) => (
    <span className={len > max ? "text-destructive" : "text-muted-foreground"}>
      {len}/{max} characters
    </span>
  );

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-6">
      <input type="hidden" name="competitors_json" value={JSON.stringify(withPositions(competitors))} />
      <input type="hidden" name="internal_links_json" value={JSON.stringify(withPositions(links))} />
      <input type="hidden" name="outline_json" value={JSON.stringify(withPositions(outline))} />

      <div className="grid gap-4 rounded-lg border bg-muted/30 p-5 sm:grid-cols-3">
        <Field label="Target keyword" htmlFor="target_keyword">
          <Input
            id="target_keyword"
            name="target_keyword"
            required
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
          />
        </Field>
        <Field label="Linked keyword" htmlFor="keyword_id" hint="Optional: tie the brief to a researched keyword.">
          <NativeSelect
            id="keyword_id"
            name="keyword_id"
            value={keywordId}
            onChange={(e) => {
              setKeywordId(e.target.value);
              const k = keywords.find((kw) => kw.id === e.target.value);
              if (k && !targetKeyword) setTargetKeyword(k.keyword);
            }}
          >
            <option value="">None</option>
            {keywords.map((k) => (
              <option key={k.id} value={k.id}>{k.keyword}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status" hint="Ready means it can be assigned to a writer.">
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "draft"}>
            {options(BRIEF_STATUS).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Section number={1} title="Fundamentals">
        <Field label="Objective" htmlFor="objective" hint="What the article must achieve, its angle, and which service page it nudges toward.">
          <Textarea id="objective" name="objective" rows={3} defaultValue={initial?.objective ?? ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Search intent" htmlFor="search_intent">
            <NativeSelect id="search_intent" name="search_intent" defaultValue={initial?.search_intent ?? ""}>
              <option value="">Not set</option>
              {options(SEARCH_INTENT).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Intent reason" htmlFor="intent_reason" hint="One line, drawn from what is ranking.">
            <Input id="intent_reason" name="intent_reason" defaultValue={initial?.intent_reason ?? ""} />
          </Field>
        </div>
        <Field label="Target audience" htmlFor="target_audience">
          <Textarea id="target_audience" name="target_audience" rows={2} defaultValue={initial?.target_audience ?? ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Word count (min)" htmlFor="word_count_min">
            <Input id="word_count_min" name="word_count_min" type="number" min={0} defaultValue={initial?.word_count_min ?? ""} />
          </Field>
          <Field label="Word count (max)" htmlFor="word_count_max">
            <Input id="word_count_max" name="word_count_max" type="number" min={0} defaultValue={initial?.word_count_max ?? ""} />
          </Field>
        </div>
      </Section>

      <Section number={2} title="Meta Data">
        <div className="flex flex-col gap-1.5">
          <Field label="Meta title" htmlFor="meta_title">
            <Input id="meta_title" name="meta_title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </Field>
          <p className="text-xs">{counter(metaTitle.length, META_TITLE_MAX)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Field label="Meta description" htmlFor="meta_description">
            <Textarea id="meta_description" name="meta_description" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </Field>
          <p className="text-xs">{counter(metaDescription.length, META_DESC_MAX)}</p>
        </div>
      </Section>

      <Section number={3} title="Competitors & Gap Analysis" hint="Real, currently ranking pages for the target keyword.">
        <div className="flex flex-col gap-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1.5fr_2fr]">
                <Input placeholder="domain.com" value={c.domain} onChange={(e) => update(competitors, setCompetitors, i, { domain: e.target.value })} aria-label="Competitor domain" />
                <Input placeholder="Page title" value={c.page_title} onChange={(e) => update(competitors, setCompetitors, i, { page_title: e.target.value })} aria-label="Competitor page title" />
                <Input placeholder="https://..." value={c.url} onChange={(e) => update(competitors, setCompetitors, i, { url: e.target.value })} aria-label="Competitor URL" />
              </div>
              <RowTools rows={competitors} index={i} setRows={setCompetitors} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setCompetitors([...competitors, { domain: "", page_title: "", url: "" }])}>
            <Plus />
            Add competitor
          </Button>
        </div>
        <Field label="Content gaps (what competitors are missing)" htmlFor="content_gaps" hint="Markdown: **Gap name.** then the explanation. Blank line between gaps.">
          <Textarea id="content_gaps" name="content_gaps" rows={8} defaultValue={initial?.content_gaps ?? ""} />
        </Field>
      </Section>

      <Section number={4} title="Internal Links" hint="Place links contextually throughout the article, not clustered in one section.">
        <div className="flex flex-col gap-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
              <div className="grid flex-1 gap-2 sm:grid-cols-[2fr_1.5fr_1.5fr]">
                <Input placeholder="https://client-site.com/page" value={l.url} onChange={(e) => update(links, setLinks, i, { url: e.target.value })} aria-label="Internal link URL" />
                <Input placeholder="Anchor text" value={l.anchor_text} onChange={(e) => update(links, setLinks, i, { anchor_text: e.target.value })} aria-label="Anchor text" />
                <Input placeholder="Placement, e.g. under H2 ..." value={l.placement_note} onChange={(e) => update(links, setLinks, i, { placement_note: e.target.value })} aria-label="Placement note" />
              </div>
              <RowTools rows={links} index={i} setRows={setLinks} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setLinks([...links, { url: "", anchor_text: "", placement_note: "" }])}>
            <Plus />
            Add link
          </Button>
        </div>
      </Section>

      <Section number={5} title="Content Outline" hint="One H1, H2 per section, H3 per parallel item. Key points as a bulleted list when there is more than one point.">
        <div className="flex flex-col gap-3">
          {outline.map((o, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border p-2">
              <span className="mt-2 w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
              <div className="grid flex-1 gap-2">
                <div className="grid gap-2 sm:grid-cols-[6rem_1fr]">
                  <NativeSelect value={o.level} onChange={(e) => update(outline, setOutline, i, { level: e.target.value as OutlineLevel })} aria-label="Heading level">
                    {options(OUTLINE_LEVEL).map((lv) => (
                      <option key={lv.value} value={lv.value}>{lv.label}</option>
                    ))}
                  </NativeSelect>
                  <Input placeholder="Heading" value={o.heading} onChange={(e) => update(outline, setOutline, i, { heading: e.target.value })} aria-label="Heading" />
                </div>
                <Textarea placeholder={"Key points to cover\n- one point per line"} rows={3} value={o.key_points} onChange={(e) => update(outline, setOutline, i, { key_points: e.target.value })} aria-label="Key points" />
              </div>
              <RowTools rows={outline} index={i} setRows={setOutline} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOutline([...outline, { level: "h2", heading: "", key_points: "" }])}>
            <Plus />
            Add heading
          </Button>
        </div>
      </Section>

      <Section number={6} title="Writing Best Practices">
        <Textarea
          id="writing_best_practices"
          name="writing_best_practices"
          rows={8}
          aria-label="Best practices for the writer"
          defaultValue={initial?.writing_best_practices ?? (initial ? "" : DEFAULT_BEST_PRACTICES)}
        />
      </Section>

      <Section number={7} title="Conclusion & CTA">
        <Field label="Conclusion notes" htmlFor="conclusion_notes">
          <Textarea id="conclusion_notes" name="conclusion_notes" rows={3} defaultValue={initial?.conclusion_notes ?? ""} />
        </Field>
        <Field label="CTA copy example" htmlFor="cta_copy">
          <Textarea id="cta_copy" name="cta_copy" rows={3} defaultValue={initial?.cta_copy ?? ""} />
        </Field>
      </Section>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save brief" : "Create brief"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
