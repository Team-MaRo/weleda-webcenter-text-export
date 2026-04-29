import type {ChangeEvent, ReactNode} from 'react';
import type {Segment} from '~/lib/xml-to-text/convert';
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import CheckIcon from '~/assets/icons/check.svg?react';
import CloseIcon from '~/assets/icons/close.svg?react';
import CopyIcon from '~/assets/icons/copy.svg?react';
import DownloadIcon from '~/assets/icons/download.svg?react';
import FileIcon from '~/assets/icons/file.svg?react';
import SearchIcon from '~/assets/icons/search.svg?react';
import {escapeRegex, formatNumber, formatSize} from '~/lib/format';

interface Props {
  paragraphs: Segment[][];
  text: string;
  html: string;
  fileName: string;
  fileSize: number;
  words: number;
  chars: number;
  visible: boolean;
  onClear: () => void;
  onCopyFailed: () => void;
}

interface RenderSegment extends Segment {
  mark: boolean;
}

const COPIED_RESET_MS = 1600;
const EXTENSION_RE = /\.[^.]+$/;

// Wrap a render segment in <strong>/<em>/<u> (matching segmentToHtml in
// convert.ts) plus <mark> for search highlights. Order is innermost-out:
// text → mark → u → em → strong, so a highlighted bold word renders as
// <strong><mark>…</mark></strong> in the DOM.
function wrapSegment(seg: RenderSegment, key: number): ReactNode {
  let node: ReactNode = seg.mark ? <mark>{seg.text}</mark> : seg.text;
  if (seg.underline) {
    node = <u>{node}</u>;
  }
  if (seg.italic) {
    node = <em>{node}</em>;
  }
  if (seg.bold) {
    node = <strong>{node}</strong>;
  }
  return <span key={key}>{node}</span>;
}

export function Result({
  paragraphs,
  text,
  html,
  fileName,
  fileSize,
  words,
  chars,
  visible,
  onClear,
  onCopyFailed,
}: Props) {
  const {t, i18n} = useTranslation();
  const [query, setQuery] = useState('');
  const debounced = useDeferredValue(query);
  const [prevText, setPrevText] = useState(text);
  const [copied, setCopied] = useState(false);
  const copiedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the search query when a new file is loaded. Using React's
  // "adjust state in render" pattern instead of useEffect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (text !== prevText) {
    setPrevText(text);
    setQuery('');
  }

  useEffect(() => () => {
    if (copiedRef.current) {
      clearTimeout(copiedRef.current);
    }
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleCopy = async () => {
    if (!text) {
      return;
    }
    try {
      // Dual-format clipboard: rich-text targets (Word, Outlook, Google
      // Docs, Slack rich compose) pick up text/html and preserve bold /
      // italic. Plain-text targets (Notepad, terminal, VSCode source view)
      // fall back to text/plain — identical to the previous writeText
      // behaviour, no UX regression.
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], {type: 'text/html'}),
          'text/plain': new Blob([text], {type: 'text/plain'}),
        }),
      ]);
      setCopied(true);
      if (copiedRef.current) {
        clearTimeout(copiedRef.current);
      }
      copiedRef.current = setTimeout(setCopied, COPIED_RESET_MS, false);
    } catch {
      onCopyFailed();
    }
  };

  const handleDownload = () => {
    if (!text) {
      return;
    }
    const base = (fileName || t('download.fallback_basename')).replace(EXTENSION_RE, '');
    const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const lang = i18n.resolvedLanguage ?? 'de-CH';

  const {renderedParagraphs, matchCount} = useMemo(() => {
    const q = debounced.trim();
    if (!q) {
      return {
        renderedParagraphs: paragraphs.map((para) =>
          para.map<RenderSegment>((seg) => ({...seg, mark: false})),
        ),
        matchCount: 0,
      };
    }
    const re = new RegExp(escapeRegex(q), 'gi');
    let total = 0;
    const out = paragraphs.map<RenderSegment[]>((para) => {
      const slices: RenderSegment[] = [];
      for (const seg of para) {
        const matches = Array.from(seg.text.matchAll(re));
        if (matches.length === 0) {
          slices.push({...seg, mark: false});
          continue;
        }
        let lastIndex = 0;
        for (const m of matches) {
          const idx = m.index ?? 0;
          const matchText = m[0];
          if (idx > lastIndex) {
            slices.push({...seg, text: seg.text.slice(lastIndex, idx), mark: false});
          }
          slices.push({...seg, text: matchText, mark: true});
          lastIndex = idx + matchText.length;
          total += 1;
        }
        if (lastIndex < seg.text.length) {
          slices.push({...seg, text: seg.text.slice(lastIndex), mark: false});
        }
      }
      return slices;
    });
    return {renderedParagraphs: out, matchCount: total};
  }, [paragraphs, debounced]);

  const className = `result${visible ? ' is-visible' : ''}`;

  return (
    <article className={className} aria-live="polite">
      <header className="result-head">
        <div className="file-meta">
          <div className="file-icon" aria-hidden="true">
            <FileIcon width={16} height={16} />
          </div>
          <div className="file-meta-text">
            <div className="file-name">{fileName || t('result.empty_dash')}</div>
            <div className="file-stats">
              <span>{fileSize > 0 ? formatSize(fileSize) : t('result.size_initial')}</span>
              <span>{formatNumber(words, lang)} {t('result.words_suffix')}</span>
              <span>{formatNumber(chars, lang)} {t('result.chars_suffix')}</span>
            </div>
          </div>
        </div>
        <div className="actions">
          <button className={`btn${copied ? ' is-copied' : ''}`} type="button" onClick={handleCopy}>
            <CopyIcon className="copy-i" width={14} height={14} />
            <CheckIcon className="check" width={14} height={14} />
            <span>{copied ? t('actions.copied') : t('actions.copy')}</span>
          </button>
          <button className="btn" type="button" onClick={handleDownload}>
            <DownloadIcon width={14} height={14} />
            <span>{t('actions.download')}</span>
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={onClear}
            title={t('actions.reset')}
            aria-label={t('actions.reset')}
          >
            <CloseIcon width={15} height={15} />
          </button>
        </div>
      </header>

      <div className="search">
        <SearchIcon width={14} height={14} />
        <input
          type="search"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={handleSearchChange}
        />
        <span className="count">
          {debounced.trim()
            ? matchCount > 0
              ? t('search.matches_other', {count: matchCount})
              : t('search.no_matches')
            : ''}
        </span>
      </div>

      <div className="output">
        {renderedParagraphs.map((segments, paraIdx) => (
          // eslint-disable-next-line react/no-array-index-key -- paragraphs render in document order from the converter; index is the stable identity
          <p key={paraIdx}>
            {/* eslint-disable-next-line ts/promise-function-async -- React 19's ReactNode type includes Promise<ReactNode> for async components, which trips the rule. wrapSegment is purely sync; adding `async` here would wrap each node in a Promise that React can't render. */}
            {segments.map((seg, segIdx) => wrapSegment(seg, segIdx))}
          </p>
        ))}
      </div>
    </article>
  );
}
