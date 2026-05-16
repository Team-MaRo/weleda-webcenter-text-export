import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {xmlToText} from './convert';

const here = dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(join(here, '__fixtures__/sample.xml'), 'utf-8');
const expectedTxt = readFileSync(join(here, '__fixtures__/expected.txt'), 'utf-8')
  .replace(/\r\n/g, '\n')
  .trimEnd();

describe('xmlToText', () => {
  it('renders the Weleda fixture as readable plain text', () => {
    const {text, paragraphs} = xmlToText(sampleXml);
    expect(text).toBe(expectedTxt);
    expect(paragraphs).toHaveLength(6);
  });

  it('preserves document order, ignoring instanceSequence', () => {
    const {text} = xmlToText(sampleXml);
    // INDICATIONS_HEADER (seq=3) appears before INDICATIONS_LONG (seq=2) in
    // document order; the output must mirror that.
    const headerIdx = text.indexOf('Wann wird');
    const longIdx = text.indexOf('Hilft');
    expect(headerIdx).toBeGreaterThan(-1);
    expect(longIdx).toBeGreaterThan(-1);
    expect(headerIdx).toBeLessThan(longIdx);
  });

  it('skips the GS1 standard business document header', () => {
    const {text} = xmlToText(sampleXml);
    expect(text).not.toContain('GS1');
    expect(text).not.toContain('FixtureMessage');
    expect(text).not.toContain('de-CH');
  });

  it('honours <br/> as a soft line break inside the same paragraph', () => {
    const {text} = xmlToText(sampleXml);
    expect(text).toContain('Tropfen einnehmen\ndanach Wasser trinken');
  });

  it('keeps a leading inline <b>/<i> on the same line as sibling text', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p><b>Kinder unter 10 Jahren:</b> so viele Atemzüge inhalieren, wie das Kind in Jahren alt ist.</p>`
      + `<p><i>Hinweis:</i> kühl und trocken lagern.</p>`
      + `</textContent></root>`;
    const {paragraphs, text} = xmlToText(xml);
    expect(text).toBe(
      'Kinder unter 10 Jahren: so viele Atemzüge inhalieren, wie das Kind in Jahren alt ist.'
      + '\n\n'
      + 'Hinweis: kühl und trocken lagern.',
    );
    expect(paragraphs).toEqual([
      [
        {text: 'Kinder unter 10 Jahren:', bold: true},
        {text: ' so viele Atemzüge inhalieren, wie das Kind in Jahren alt ist.'},
      ],
      [
        {text: 'Hinweis:', italic: true},
        {text: ' kühl und trocken lagern.'},
      ],
    ]);
  });

  it('emits semantic <strong>/<em> in the HTML output for bold/italic source tags', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p><b>Bold</b> and <i>italic</i>.</p>`
      + `</textContent></root>`;
    const {html} = xmlToText(xml);
    expect(html).toBe('<p><strong>Bold</strong> and <em>italic</em>.</p>');
  });

  it('preserves nested <b><i>… formatting as both flags on the same segment', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p><b><i>Wichtig</i></b></p>`
      + `</textContent></root>`;
    const {paragraphs, html} = xmlToText(xml);
    expect(paragraphs).toEqual([[{text: 'Wichtig', bold: true, italic: true}]]);
    expect(html).toBe('<p><strong><em>Wichtig</em></strong></p>');
  });

  it('treats unknown inline tags (<span>) as transparent text', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p>A <span>middle</span> Z</p>`
      + `</textContent></root>`;
    const {paragraphs, text, html} = xmlToText(xml);
    expect(text).toBe('A middle Z');
    // No formatting flags survive on any segment — the <span> is invisible.
    expect(paragraphs[0]?.every((s) => !s.bold && !s.italic && !s.underline)).toBe(true);
    expect(html).toBe('<p>A middle Z</p>');
  });

  it('escapes HTML-significant characters in the HTML output', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p>A &lt; B &amp; C &gt; D</p>`
      + `</textContent></root>`;
    const {text, html} = xmlToText(xml);
    expect(text).toBe('A < B & C > D');
    expect(html).toBe('<p>A &lt; B &amp; C &gt; D</p>');
  });

  it('renders a soft <br/> as a <br> in the HTML output', () => {
    const xml = `<?xml version="1.0"?><root><textContent>`
      + `<p>line 1<br/>line 2</p>`
      + `</textContent></root>`;
    const {html, text} = xmlToText(xml);
    expect(text).toBe('line 1\nline 2');
    expect(html).toBe('<p>line 1<br>line 2</p>');
  });

  it('returns an empty result for empty / whitespace-only input', () => {
    expect(xmlToText('')).toEqual({paragraphs: [], text: '', html: ''});
    expect(xmlToText('   \n  ')).toEqual({paragraphs: [], text: '', html: ''});
  });

  it('returns an empty result for input without any <textContent>', () => {
    const xml = '<?xml version="1.0"?><root><other>ignored</other></root>';
    expect(xmlToText(xml)).toEqual({paragraphs: [], text: '', html: ''});
  });
});
