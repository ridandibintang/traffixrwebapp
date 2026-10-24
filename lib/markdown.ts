// The small Markdown subset Golden Standard briefs use: paragraphs separated
// by blank lines, "- " bullet lists, and **bold** runs. Shared by the web
// renderer and the .docx exporter.

export type MdBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

export function parseBlocks(text: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let bullets: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushBullets = () => {
    if (bullets.length) blocks.push({ type: "ul", items: bullets });
    bullets = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushBullets();
    } else if (/^[-*•]\s+/.test(line)) {
      flushPara();
      bullets.push(line.replace(/^[-*•]\s+/, ""));
    } else {
      flushBullets();
      para.push(line);
    }
  }
  flushPara();
  flushBullets();
  return blocks;
}

export type MdRun = { text: string; bold: boolean };

export function splitBold(text: string): MdRun[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
