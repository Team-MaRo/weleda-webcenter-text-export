import type {Route} from './+types/home';
import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {useActionData} from 'react-router';
import {AppFooter} from '~/components/AppFooter';
import {DragOverlay} from '~/components/DragOverlay';
import {Dropzone} from '~/components/Dropzone';
import {Lede} from '~/components/Lede';
import {Result} from '~/components/Result';
import {Toast} from '~/components/Toast';
import {Topbar} from '~/components/Topbar';
import {useConverter} from '~/hooks/useConverter';
import {usePageDragDrop} from '~/hooks/usePageDragDrop';
import {usePasteXml} from '~/hooks/usePasteXml';
import {useToast} from '~/hooks/useToast';
import {i18n} from '~/i18n';
import {xmlToText} from '~/lib/xml-to-text/convert';

const XML_EXTENSION_RE = /\.xml$/i;
const XML_TYPE_RE = /xml/i;

function errorMessageKey(code: string): string {
  if (code === 'no-file') {
    return 'toast.no_file';
  }
  if (code === 'not-xml') {
    return 'toast.not_xml';
  }
  return 'toast.no_content';
}

export function meta(_: Route.MetaArgs) {
  return [
    {title: i18n.t('meta.page_title')},
    {name: 'description', content: i18n.t('meta.page_description')},
  ];
}

// Server action for the no-JS upload form. The whole `export async function
// action` block is stripped from the SPA build by the `stripSpaServerExports`
// vite plugin (see vite.config.ts) — React Router 7's vite plugin rejects an
// `action` export in SPA-mode route modules, but we need it for the SSR
// container's no-JS form POST. Mirrors the client useConverter validation
// (extension/type check, parse, non-empty check) so both paths produce the
// same error vocabulary.
export async function action({request}: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return {error: 'no-file' as const};
  }
  if (!XML_EXTENSION_RE.test(file.name) && !XML_TYPE_RE.test(file.type)) {
    return {error: 'not-xml' as const};
  }
  const xml = await file.text();
  const {paragraphs, text, html} = xmlToText(xml);
  if (paragraphs.length === 0) {
    return {error: 'no-content' as const};
  }
  return {paragraphs, text, html, fileName: file.name, fileSize: file.size};
}

export default function Home() {
  const {t} = useTranslation();
  const actionData = useActionData<typeof action>();
  const initial = actionData && !('error' in actionData)
    ? {
        paragraphs: actionData.paragraphs,
        text: actionData.text,
        html: actionData.html,
        fileName: actionData.fileName,
        fileSize: actionData.fileSize,
      }
    : undefined;
  const {state, stats, hasResult, loadFile, clear} = useConverter(initial);
  const {toast, showToast} = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      const result = await loadFile(file);
      if (!result.ok) {
        showToast(result.reason === 'not-xml' ? t('toast.not_xml') : t('toast.read_failed'), 'error');
        return;
      }
      if (!result.nonEmpty) {
        showToast(t('toast.no_content'), 'error');
      }
    },
    [loadFile, showToast, t],
  );

  const {active: dragActive} = usePageDragDrop(handleFile);

  const handleShortcutNotUsable = useCallback(() => {
    showToast(t('toast.not_xml'), 'error');
  }, [showToast, t]);
  usePasteXml(handleFile, t('paste.pasted_file_name'), handleShortcutNotUsable);

  const handleCopyFailed = useCallback(() => {
    showToast(t('toast.copy_failed'), 'error');
  }, [showToast, t]);

  return (
    <>
      <Topbar />
      <main className="page-main">
        <Lede />
        <Dropzone onFileChosen={handleFile} />
        {actionData && 'error' in actionData && actionData.error && (
          <p className="upload-error" role="alert">
            {t(errorMessageKey(actionData.error))}
          </p>
        )}
        {hasResult && (
          <Result
            paragraphs={state.paragraphs}
            text={state.text}
            html={state.html}
            fileName={state.fileName}
            fileSize={state.fileSize}
            words={stats.words}
            chars={stats.chars}
            visible={hasResult}
            onClear={clear}
            onCopyFailed={handleCopyFailed}
          />
        )}
      </main>
      <AppFooter />
      <DragOverlay active={dragActive} />
      <Toast toast={toast} />
    </>
  );
}
