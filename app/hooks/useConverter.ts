import type {Segment} from '~/lib/xml-to-text/convert';
import {useCallback, useMemo, useState} from 'react';
import {xmlToText} from '~/lib/xml-to-text/convert';

export interface ConverterState {
  paragraphs: Segment[][];
  text: string;
  html: string;
  fileName: string;
  fileSize: number;
}

export type LoadOutcome
  = {ok: true; nonEmpty: boolean}
    | {ok: false; reason: 'not-xml' | 'read-failed'};

const EMPTY: ConverterState = {paragraphs: [], text: '', html: '', fileName: '', fileSize: 0};

const XML_EXTENSION_RE = /\.xml$/i;
const XML_TYPE_RE = /xml/i;
const WORD_RE = /\S+/g;

export function useConverter(initial?: ConverterState) {
  const [state, setState] = useState<ConverterState>(initial ?? EMPTY);

  const loadXml = useCallback((rawXml: string, fileName: string, fileSize: number): boolean => {
    const {paragraphs, text, html} = xmlToText(rawXml);
    setState({paragraphs, text, html, fileName, fileSize});
    return paragraphs.length > 0;
  }, []);

  const loadFile = useCallback(
    async (file: File): Promise<LoadOutcome> =>
      new Promise((resolve) => {
        const isXml = XML_EXTENSION_RE.test(file.name) || XML_TYPE_RE.test(file.type);
        if (!isXml) {
          resolve({ok: false, reason: 'not-xml'});
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = typeof e.target?.result === 'string' ? e.target.result : '';
          const nonEmpty = loadXml(result, file.name, file.size);
          resolve({ok: true, nonEmpty});
        };
        reader.onerror = () => resolve({ok: false, reason: 'read-failed'});
        reader.readAsText(file);
      }),
    [loadXml],
  );

  const clear = useCallback(() => {
    setState(EMPTY);
  }, []);

  const stats = useMemo(() => {
    const wordCount = (state.text.match(WORD_RE) ?? []).length;
    return {
      words: wordCount,
      chars: state.text.length,
    };
  }, [state.text]);

  const hasResult = state.paragraphs.length > 0;

  return {state, stats, hasResult, loadFile, loadXml, clear};
}
