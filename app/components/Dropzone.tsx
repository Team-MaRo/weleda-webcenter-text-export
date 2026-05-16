import type {ChangeEvent, KeyboardEvent} from 'react';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';

interface Props {
  onFileChosen: (file: File) => void;
}

export function Dropzone({onFileChosen}: Props) {
  const {t} = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChosen(file);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    // The form is the no-JS fallback path: when scripting is off, the hidden
    // file input gets a `name="file"`, so picking a file and clicking the
    // <noscript> submit button POSTs straight to the home route's action().
    // With JS, the existing onChange handler intercepts file selection and
    // the submit button isn't in the live DOM (browsers parse <noscript>
    // contents as text in JS mode), so the form is never submitted.
    // `action="?index"` is required — React Router treats POSTs to `/` as
    // ambiguous between root layout and index route; the query picks index.
    <form method="post" action="?index" encType="multipart/form-data" className="dropzone-form">
      <label
        className="dropzone"
        htmlFor="file-input"
        tabIndex={0}
        role="button"
        aria-label={t('dropzone.aria_label')}
        onKeyDown={handleKey}
      >
        <div className="icon-wrap" aria-hidden="true">
          <UploadIcon width={22} height={22} strokeWidth={1.6} />
        </div>
        <p className="title-line">{t('dropzone.title')}</p>
        <p className="sub-line">
          {t('dropzone.subtitle_prefix')} <span className="pill">{t('dropzone.subtitle_pill')}</span>
        </p>
        <input
          ref={inputRef}
          className="dropzone-input"
          id="file-input"
          type="file"
          name="file"
          accept=".xml,application/xml,text/xml"
          required
          onChange={handleChange}
        />
      </label>
      <p className="hint">
        {t('dropzone.paste_hint_prefix')}{' '}
        <kbd>{t('dropzone.paste_hint_cmd')}</kbd>{t('dropzone.paste_hint_or')}<kbd>{t('dropzone.paste_hint_ctrl')}</kbd>
        {' + '}
        <kbd>{t('dropzone.paste_hint_v')}</kbd>{' '}
        {t('dropzone.paste_hint_suffix')}
      </p>
      <noscript>
        <div className="no-js-submit">
          <p className="no-js-selected-hint">
            <span aria-hidden="true">✓</span> {t('no_js.file_selected')}
          </p>
          <button type="submit" className="btn">{t('no_js.submit')}</button>
        </div>
      </noscript>
    </form>
  );
}
