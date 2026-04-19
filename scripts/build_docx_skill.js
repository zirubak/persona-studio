#!/usr/bin/env node
// Build the archival Word document for a simulation transcript using docx-js
// (document-skills:docx skill path). Reads the markdown produced by
// /simulate-meeting-team-ralph and emits a properly-styled .docx with:
//   - YAML frontmatter as metadata paragraphs
//   - H1/H2/H3 as real Word heading styles
//   - blockquotes rendered verbatim as indented italic paragraphs
//   - the markdown action-item table as a real Word table

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} = require(path.join(
  "/Users/jhbaek/.nvm/versions/node/v22.19.0/lib/node_modules",
  "docx"
));

// ---------- CLI ----------

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("usage: node build_docx_skill.js <input.md> <output.docx>");
  process.exit(2);
}

const raw = fs.readFileSync(inputPath, "utf8");

// ---------- parse frontmatter ----------

const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
const frontmatter = fmMatch ? fmMatch[1] : "";
const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

// ---------- line-wise block parser ----------
// Produces an array of blocks: { kind, ...payload }
// Kinds: h1, h2, h3, para, bq, table, blank, hr

const lines = body.split("\n");
const blocks = [];
let tableBuf = null; // collecting a markdown table

function flushTable() {
  if (tableBuf && tableBuf.length) {
    blocks.push({ kind: "table", rows: tableBuf });
  }
  tableBuf = null;
}

for (const line of lines) {
  const trimmed = line.trimEnd();
  if (/^\|/.test(trimmed)) {
    if (tableBuf === null) tableBuf = [];
    tableBuf.push(trimmed);
    continue;
  } else {
    flushTable();
  }
  if (/^# /.test(trimmed)) blocks.push({ kind: "h1", text: trimmed.replace(/^# /, "") });
  else if (/^## /.test(trimmed)) blocks.push({ kind: "h2", text: trimmed.replace(/^## /, "") });
  else if (/^### /.test(trimmed)) blocks.push({ kind: "h3", text: trimmed.replace(/^### /, "") });
  else if (/^---\s*$/.test(trimmed)) blocks.push({ kind: "hr" });
  else if (/^> ?/.test(trimmed)) blocks.push({ kind: "bq", text: trimmed.replace(/^> ?/, "") });
  else if (trimmed === "") blocks.push({ kind: "blank" });
  else blocks.push({ kind: "para", text: trimmed });
}
flushTable();

// ---------- helpers: inline formatting ----------
// Minimal bold/italic handling for **text** only (enough for this transcript).

function inlineRuns(text, base = {}) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const p of parts) {
    if (!p) continue;
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      runs.push(new TextRun({ ...base, text: p.slice(2, -2), bold: true }));
    } else {
      runs.push(new TextRun({ ...base, text: p }));
    }
  }
  return runs.length ? runs : [new TextRun({ ...base, text: "" })];
}

// ---------- render: frontmatter metadata block ----------

const metaChildren = [];
metaChildren.push(
  new Paragraph({
    children: [new TextRun({ text: "회의 메타 (frontmatter)", bold: true })],
    spacing: { before: 120, after: 80 },
  })
);
for (const fLine of frontmatter.split("\n")) {
  if (!fLine.trim()) continue;
  metaChildren.push(
    new Paragraph({
      children: [new TextRun({ text: fLine, font: "Menlo", size: 20 })],
      spacing: { after: 40 },
    })
  );
}
metaChildren.push(new Paragraph({ children: [new TextRun("")] }));

// ---------- render: body blocks ----------

const bodyChildren = [];

function renderTable(rows) {
  // rows: ["| a | b |", "|---|---|", "| 1 | 2 |", ...]
  const parsed = rows
    .map((r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  if (parsed.length < 2) return;
  const header = parsed[0];
  const dataRows = parsed.slice(2); // skip separator row
  const colCount = header.length;

  // US Letter content width = 12240 - 2880 = 9360 DXA
  const totalWidth = 9360;
  const colWidth = Math.floor(totalWidth / colCount);
  const columnWidths = new Array(colCount).fill(colWidth);
  columnWidths[colCount - 1] = totalWidth - colWidth * (colCount - 1);

  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map(
      (cell, i) =>
        new TableCell({
          borders,
          width: { size: columnWidths[i], type: WidthType.DXA },
          shading: { fill: "E8EEF5", type: ShadingType.CLEAR, color: "auto" },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, bold: true })],
            }),
          ],
        })
    ),
  });

  const dataTableRows = dataRows.map(
    (cells) =>
      new TableRow({
        children: cells.map(
          (cell, i) =>
            new TableCell({
              borders,
              width: { size: columnWidths[i] || colWidth, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: inlineRuns(cell) })],
            })
        ),
      })
  );

  bodyChildren.push(
    new Table({
      width: { size: totalWidth, type: WidthType.DXA },
      columnWidths,
      rows: [headerRow, ...dataTableRows],
    })
  );
  bodyChildren.push(new Paragraph({ children: [new TextRun("")] }));
}

for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i];
  switch (b.kind) {
    case "h1":
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: inlineRuns(b.text),
        })
      );
      break;
    case "h2":
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: inlineRuns(b.text),
        })
      );
      break;
    case "h3":
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: inlineRuns(b.text),
        })
      );
      break;
    case "para":
      bodyChildren.push(
        new Paragraph({
          children: inlineRuns(b.text),
          spacing: { after: 120 },
        })
      );
      break;
    case "bq":
      bodyChildren.push(
        new Paragraph({
          indent: { left: 720 },
          children: inlineRuns(b.text, { italics: true, color: "444444" }),
          spacing: { after: 60 },
        })
      );
      break;
    case "table":
      renderTable(b.rows);
      break;
    case "hr":
      bodyChildren.push(
        new Paragraph({
          border: { bottom: { color: "AAAAAA", size: 6, style: BorderStyle.SINGLE } },
          spacing: { before: 60, after: 180 },
          children: [new TextRun("")],
        })
      );
      break;
    case "blank":
      // collapse multiple blanks; add one spacer only if last wasn't already blank
      const last = bodyChildren[bodyChildren.length - 1];
      if (last && last.constructor === Paragraph) {
        // skip — paragraph spacing handles it
      }
      break;
  }
}

// ---------- assemble document ----------

const doc = new Document({
  creator: "Claude (persona-studio)",
  title: "K-콘텐츠 글로벌 전략 Ⅱ — 회의 (Ralph iter-1)",
  styles: {
    default: {
      document: { run: { font: "Noto Sans KR", size: 22 } }, // 11pt
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Noto Sans KR" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 30, bold: true, font: "Noto Sans KR", color: "1A365D" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Noto Sans KR", color: "2C5282" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [...metaChildren, ...bodyChildren],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outputPath, buf);
  console.log(`docx written: ${outputPath} (${buf.length} bytes)`);
  console.log(`blocks parsed: ${blocks.length}, body children: ${bodyChildren.length}`);
});
