// Renders a brief as the Golden Standard Word document:
//   title Arial 18pt bold #1F3864 centred; section bars white on #1F3864;
//   two-column tables with #D5E8F0 label cells; outline table with a
//   #4A4A4A header and rows coloured by heading level; #CCCCCC borders;
//   US Letter, 1-inch margins.
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IBorderOptions,
} from "docx";
import { parseBlocks, splitBold } from "@/lib/markdown";
import { SEARCH_INTENT } from "@/lib/labels";
import type { BriefWithChildren } from "@/lib/types";

const FONT = "Arial";
const NAVY = "1F3864";
const LABEL_BG = "D5E8F0";
const OUTLINE_HEADER_BG = "4A4A4A";
const H2_BG = "2E75B6";
const H3_BG = "D6E4F0";
const BORDER_COLOR = "CCCCCC";

const PAGE_WIDTH = 12240; // 8.5in in twips
const MARGIN = 1440; // 1in
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 9360
const LABEL_WIDTH = 2900;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH;

const thin: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };
const borders = {
  top: thin,
  bottom: thin,
  left: thin,
  right: thin,
  insideHorizontal: thin,
  insideVertical: thin,
};

type Opts = { bold?: boolean; color?: string; size?: number };

function run(text: string, opts: Opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 20, bold: opts.bold, color: opts.color });
}

/** Markdown-lite text -> paragraphs (bullets become "•" lines). */
function paragraphs(text: string | null, opts: Opts = {}): Paragraph[] {
  if (!text) return [new Paragraph({ children: [run("—", opts)] })];
  const out: Paragraph[] = [];
  for (const block of parseBlocks(text)) {
    if (block.type === "p") {
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: splitBold(block.text).map((r) => run(r.text, { ...opts, bold: opts.bold || r.bold })),
        }),
      );
    } else {
      for (const item of block.items) {
        out.push(
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 280, hanging: 200 },
            children: [run("•  ", opts), ...splitBold(item).map((r) => run(r.text, { ...opts, bold: opts.bold || r.bold }))],
          }),
        );
      }
    }
  }
  return out;
}

function cell(children: Paragraph[], width: number, fill?: string) {
  return new TableCell({
    children,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function sectionBar(title: string) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    borders,
    rows: [
      new TableRow({
        children: [
          cell([new Paragraph({ children: [run(title, { bold: true, size: 24, color: "FFFFFF" })] })], CONTENT_WIDTH, NAVY),
        ],
      }),
    ],
  });
}

function labelRow(label: string, value: Paragraph[]) {
  return new TableRow({
    children: [
      cell([new Paragraph({ children: [run(label, { bold: true })] })], LABEL_WIDTH, LABEL_BG),
      cell(value, VALUE_WIDTH),
    ],
  });
}

function twoColTable(rows: TableRow[]) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH, VALUE_WIDTH],
    borders,
    rows,
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 160 }, children: [] });
}

function link(text: string, url: string) {
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text, font: FONT, size: 20, style: "Hyperlink" })],
      }),
    ],
  });
}

export async function renderBriefDocx(brief: BriefWithChildren, clientName: string): Promise<Buffer> {
  const wordCount =
    brief.word_count_min != null || brief.word_count_max != null
      ? `${brief.word_count_min ?? "?"} – ${brief.word_count_max ?? "?"} words`
      : null;
  const intent = brief.search_intent
    ? `${SEARCH_INTENT[brief.search_intent]}${brief.intent_reason ? ` — ${brief.intent_reason}` : ""}`
    : brief.intent_reason;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [run(`Content Brief: ${brief.target_keyword}`, { bold: true, size: 36, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [run(clientName, { color: "666666" })],
    }),

    sectionBar("1. Fundamentals"),
    twoColTable([
      labelRow("Objective", paragraphs(brief.objective)),
      labelRow("Search Intent", paragraphs(intent)),
      labelRow("Target Audience", paragraphs(brief.target_audience)),
      labelRow("Target Keyword", paragraphs(brief.target_keyword)),
      labelRow("Word Count", paragraphs(wordCount)),
    ]),
    spacer(),

    sectionBar("2. Meta Data"),
    twoColTable([
      labelRow("Meta Title", paragraphs(brief.meta_title ? `${brief.meta_title} [${brief.meta_title.length} characters]` : null)),
      labelRow(
        "Meta Description",
        paragraphs(brief.meta_description ? `${brief.meta_description} [${brief.meta_description.length} characters]` : null),
      ),
    ]),
    spacer(),

    sectionBar("3. Competitors & Gap Analysis"),
    twoColTable([
      ...brief.competitors.map((c) =>
        labelRow(`Competitor ${c.position}`, [link(`${c.domain}${c.page_title ? ` — ${c.page_title}` : ""}`, c.url)]),
      ),
      labelRow("Content Gaps (What Competitors Are Missing)", paragraphs(brief.content_gaps)),
    ]),
    spacer(),

    sectionBar("4. Internal Links"),
    twoColTable([
      labelRow("Note", paragraphs("Place links contextually throughout the article, not clustered in one section.")),
      ...brief.internal_links.map((l) =>
        labelRow(`Link ${l.position}`, [
          link(l.url, l.url),
          new Paragraph({ children: [run("Anchor text: "), run(l.anchor_text, { bold: true })] }),
          ...(l.placement_note ? [new Paragraph({ children: [run(l.placement_note)] })] : []),
        ]),
      ),
    ]),
    spacer(),

    sectionBar("5. Content Outline"),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [LABEL_WIDTH + 600, VALUE_WIDTH - 600],
      borders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell([new Paragraph({ children: [run("Heading", { bold: true, color: "FFFFFF" })] })], LABEL_WIDTH + 600, OUTLINE_HEADER_BG),
            cell([new Paragraph({ children: [run("Key Points to Cover", { bold: true, color: "FFFFFF" })] })], VALUE_WIDTH - 600, OUTLINE_HEADER_BG),
          ],
        }),
        ...brief.outline.map((o) => {
          const fill = o.level === "h1" ? NAVY : o.level === "h2" ? H2_BG : H3_BG;
          const color = o.level === "h3" ? "000000" : "FFFFFF";
          return new TableRow({
            children: [
              cell(
                [new Paragraph({ children: [run(`${o.level.toUpperCase()}: `, { bold: true, color }), run(o.heading, { bold: true, color })] })],
                LABEL_WIDTH + 600,
                fill,
              ),
              cell(paragraphs(o.key_points), VALUE_WIDTH - 600),
            ],
          });
        }),
      ],
    }),
    spacer(),

    sectionBar("6. Writing Best Practices"),
    twoColTable([labelRow("Best Practices for the Writer", paragraphs(brief.writing_best_practices))]),
    spacer(),

    sectionBar("7. Conclusion & CTA"),
    twoColTable([
      labelRow("Conclusion Notes", paragraphs(brief.conclusion_notes)),
      labelRow("CTA Copy Example", paragraphs(brief.cta_copy)),
    ]),
  ];

  const doc = new Document({
    creator: "Traffixr",
    title: `Content Brief: ${brief.target_keyword}`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: 15840 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/** [Client]_[Keyword]_Content_Brief.docx with filesystem-safe parts. */
export function briefFilename(clientName: string, keyword: string) {
  const safe = (s: string) =>
    s
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "Brief";
  return `${safe(clientName)}_${safe(keyword)}_Content_Brief.docx`;
}
