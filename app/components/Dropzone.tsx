import type {ChangeEvent, KeyboardEvent} from 'react';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';
import {Button} from '~/components/Button';

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
        className="group block relative bg-paper border-[1.5px] border-dashed border-line rounded-card px-8 py-13 text-center cursor-pointer transition-[border-color,background,transform] duration-200 ease-soft hover:border-accent hover:bg-accent-s focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
        htmlFor="file-input"
        tabIndex={0}
        role="button"
        aria-label={t('dropzone.aria_label')}
        onKeyDown={handleKey}
      >
        <div
          className="size-14 mx-auto mb-4 rounded-full bg-bg-soft grid place-items-center text-ink-soft transition-colors duration-200 ease-soft group-hover:bg-paper-hover group-hover:text-accent-d"
          aria-hidden="true"
        >
          <UploadIcon width={22} height={22} strokeWidth={1.6} />
        </div>
        <p className="text-base font-medium text-ink m-0 mb-1">{t('dropzone.title')}</p>
        <p className="text-sm text-ink-mute m-0">
          {t('dropzone.subtitle_prefix')}{' '}
          <span className="inline-block px-1.5 py-px rounded-full bg-bg-soft text-ink-soft text-xs ml-1.5 tracking-wide font-medium">
            {t('dropzone.subtitle_pill')}
          </span>
        </p>
        <input
          ref={inputRef}
          className="hidden"
          id="file-input"
          type="file"
          name="file"
          accept=".xml,application/xml,text/xml"
          required
          onChange={handleChange}
        />
      </label>
      <p className="mt-5 text-center text-ink-mute text-xs leading-relaxed [&_kbd]:font-sans [&_kbd]:text-xs [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:border [&_kbd]:border-line [&_kbd]:border-b-2 [&_kbd]:rounded-md [&_kbd]:bg-paper [&_kbd]:text-ink-soft">
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
          <Button variant="primary" type="submit">{t('no_js.submit')}</Button>
        </div>
      </noscript>
    </form>
  );
}
