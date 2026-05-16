import {XMLParser} from 'fast-xml-parser';

// Pure XML → readable text converter for Weleda's GS1
// `artwork_content:artworkContentMessage` documents.
//
// Behaviour (deliberate):
//
// 1. Only `<textContent>` subtrees are read. The
//    `<sh:StandardBusinessDocumentHeader>`, `<artworkContentLocale>`,
//    `<sourceReference>`, etc. are ignored — their values would be metadata
//    noise (timestamps, IDs) in the rendered text.
//
// 2. Within a `<textContent>`, every `<p>` and `<li>` becomes its own
//    output paragraph. Inline elements (`<b>`, `<i>`, `<u>`, `<strong>`,
//    `<em>`) carry their formatting forward as per-segment flags so the
//    paragraph can be re-rendered as rich HTML for the clipboard. Unknown
//    inline elements (`<span>`, `<a>`, …) bubble their text up with the
//    current formatting flags unchanged. `<br/>` becomes a soft newline
//    inside the same paragraph.
//
// 3. Whitespace inside a paragraph is collapsed to single spaces and
//    trimmed at line edges, across segment boundaries. Empty paragraphs
//    are dropped.
//
// 4. Document order is preserved — we do NOT sort by `<instanceSequence>`.
//    The source XMLs are authored in display order; resequencing them
//    would surprise the operator without giving any benefit.
//
// 5. The function is server-safe: it parses with fast-xml-parser instead
//    of `DOMParser`, so the same code path runs in Vitest (Node), in SSR,
//    and in the browser without environment branching.

type Node = Record<string, unknown>;

export interface SegmentFlags {
  bold?: true;
  italic?: true;
  underline?: true;
}

export interface Segment extends SegmentFlags {
  text: string;
}

const parser = new XMLParser({
  ignoreAttributes: true,
  preserveOrder: true,
  trimValues: false,
  parseTagValue: false,
});

const PARAGRAPH_TAGS = new Set(['p', 'li']);
const LINE_BREAK_TAG = 'br';
const TEXT_CONTENT_TAG = 'textContent';

// Inline tags that contribute a formatting flag. Anything not in this
// table (`<span>`, `<a>`, `<sub>`, …) recurses transparently — its text
// inherits the parent's flags unchanged.
const INLINE_FORMATTERS: Readonly<Record<string, keyof SegmentFlags>> = {
  b: 'bold',
  strong: 'bold',
  i: 'italic',
  em: 'italic',
  u: 'underline',
};

const NEWLINE_RE = /\n/g;
const WHITESPACE_RE = /\s+/g;
const LEADING_WS_RE = /^\s+/;
const TRAILING_WS_RE = /\s+$/;
const HTML_ENTITY_RE = /[&<>]/g;
const HTML_ENTITIES: Readonly<Record<string, string>> = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};

function localName(tag: string): string {
  const i = tag.indexOf(':');
  return i === -1 ? tag : tag.slice(i + 1);
}

function isTextNode(node: Node): node is {'#text': unknown} {
  return Object.hasOwn(node, '#text');
}

function withText(seg: Segment, text: string): Segment {
  return {...seg, text};
}

// Walk a paragraph's children, collecting text into segments that carry
// the active formatting flags from the enclosing inline tags.
function collectInlineSegments(children: Node[], out: Segment[], flags: SegmentFlags): void {
  for (const child of children) {
    if (isTextNode(child)) {
      out.push({text: String(child['#text']), ...flags});
      continue;
    }
    for (const key of Object.keys(child)) {
      if (key === ':@') {
        continue;
      }
      const local = localName(key);
      if (local === LINE_BREAK_TAG) {
        out.push({text: '\n', ...flags});
        continue;
      }
      const sub = child[key];
      if (!Array.isArray(sub)) {
        continue;
      }
      const formatter = INLINE_FORMATTERS[local];
      const nextFlags = formatter ? {...flags, [formatter]: true} : flags;
      collectInlineSegments(sub as Node[], out, nextFlags);
    }
  }
}

// Split a flat segment list into per-line buckets at every '\n'.
function splitOnNewlines(segments: Segment[]): Segment[][] {
  let currentLine: Segment[] = [];
  const lines: Segment[][] = [currentLine];
  for (const seg of segments) {
    const parts = seg.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) {
        currentLine = [];
        lines.push(currentLine);
      }
      if (part !== '') {
        currentLine.push(withText(seg, part));
      }
    });
  }
  return lines;
}

// Collapse runs of whitespace within and across segment boundaries, then
// trim leading/trailing whitespace at the line edges.
function normalizeLine(line: Segment[]): Segment[] {
  let out = line
    .map((s) => withText(s, s.text.replace(WHITESPACE_RE, ' ')))
    .filter((s) => s.text !== '');
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1];
    const curr = out[i];
    if (prev && curr && prev.text.endsWith(' ') && curr.text.startsWith(' ')) {
      out[i] = withText(curr, curr.text.slice(1));
    }
  }
  out = out.filter((s) => s.text !== '');
  const first = out[0];
  if (first) {
    out[0] = withText(first, first.text.replace(LEADING_WS_RE, ''));
    if (out[0].text === '') {
      out.shift();
    }
  }
  const last = out.at(-1);
  if (last) {
    out[out.length - 1] = withText(last, last.text.replace(TRAILING_WS_RE, ''));
    if (out.at(-1)!.text === '') {
      out.pop();
    }
  }
  return out;
}

// Re-join normalized lines into a single segment list with explicit
// `\n` separators (carrying no formatting flags).
function joinLines(lines: Segment[][]): Segment[] {
  const nonEmpty = lines.filter((line) => line.length > 0);
  const out: Segment[] = [];
  nonEmpty.forEach((line, i) => {
    if (i > 0) {
      out.push({text: '\n'});
    }
    out.push(...line);
  });
  return out;
}

function renderParagraphSegments(children: Node[]): Segment[] {
  const raw: Segment[] = [];
  collectInlineSegments(children, raw, {});
  return joinLines(splitOnNewlines(raw).map(normalizeLine));
}

function emitParagraphs(children: Node[], out: Segment[][]): void {
  for (const child of children) {
    if (isTextNode(child)) {
      continue;
    }
    for (const key of Object.keys(child)) {
      if (key === ':@') {
        continue;
      }
      const sub = child[key];
      if (!Array.isArray(sub)) {
        continue;
      }
      const local = localName(key);
      if (PARAGRAPH_TAGS.has(local)) {
        const para = renderParagraphSegments(sub as Node[]);
        if (para.length > 0) {
          out.push(para);
        }
      } else {
        emitParagraphs(sub as Node[], out);
      }
    }
  }
}

function findTextContent(children: Node[], out: Node[][]): void {
  for (const child of children) {
    if (isTextNode(child)) {
      continue;
    }
    for (const key of Object.keys(child)) {
      if (key === ':@') {
        continue;
      }
      const sub = child[key];
      if (!Array.isArray(sub)) {
        continue;
      }
      const local = localName(key);
      if (local === TEXT_CONTENT_TAG) {
        out.push(sub as Node[]);
      } else {
        findTextContent(sub as Node[], out);
      }
    }
  }
}

// ----- output builders --------------------------------------------------

function paragraphsToText(paragraphs: Segment[][]): string {
  return paragraphs
    .map((p) => p.map((s) => s.text).join(''))
    .join('\n\n');
}

function escapeHtml(s: string): string {
  return s.replace(HTML_ENTITY_RE, (c) => HTML_ENTITIES[c] ?? c);
}

// Wrap a segment's text in semantic inline elements (<strong>/<em>/<u>).
// Matches the visual nesting in `Result.tsx` so clipboard and on-screen
// renderings agree.
function segmentToHtml(seg: Segment): string {
  let inner = escapeHtml(seg.text).replace(NEWLINE_RE, '<br>');
  if (seg.underline) {
    inner = `<u>${inner}</u>`;
  }
  if (seg.italic) {
    inner = `<em>${inner}</em>`;
  }
  if (seg.bold) {
    inner = `<strong>${inner}</strong>`;
  }
  return inner;
}

function paragraphsToHtml(paragraphs: Segment[][]): string {
  return paragraphs
    .map((p) => `<p>${p.map(segmentToHtml).join('')}</p>`)
    .join('');
}

export interface ConvertResult {
  paragraphs: Segment[][];
  text: string;
  html: string;
}

const EMPTY: ConvertResult = {paragraphs: [], text: '', html: ''};

export function xmlToText(xml: string): ConvertResult {
  if (!xml || !xml.trim()) {
    return EMPTY;
  }

  let parsed: Node[];
  try {
    parsed = parser.parse(xml) as Node[];
  } catch {
    return EMPTY;
  }

  const textContents: Node[][] = [];
  findTextContent(parsed, textContents);

  const paragraphs: Segment[][] = [];
  for (const tc of textContents) {
    const before = paragraphs.length;
    emitParagraphs(tc, paragraphs);
    if (paragraphs.length === before) {
      // No <p>/<li> children — fall back to whatever text the textContent
      // does carry, so we don't silently drop content from oddly-shaped XML.
      const fallback = renderParagraphSegments(tc);
      if (fallback.length > 0) {
        paragraphs.push(fallback);
      }
    }
  }

  return {
    paragraphs,
    text: paragraphsToText(paragraphs),
    html: paragraphsToHtml(paragraphs),
  };
}
