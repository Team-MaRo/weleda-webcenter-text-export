import type {ChangeEvent, KeyboardEvent} from 'react';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';
import {Button} from '~/components/ui/button';

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
        className="group block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card/60 px-6 py-14 text-center transition-colors hover:border-sage hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        htmlFor="file-input"
        tabIndex={0}
        role="button"
        aria-label={t('dropzone.aria_label')}
        onKeyDown={handleKey}
      >
        <span
          className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-sage text-sage-foreground transition-colors group-hover:bg-sage-hover"
          aria-hidden="true"
        >
          <UploadIcon width={28} height={28} strokeWidth={1.6} />
        </span>
        <span className="block text-base font-medium sm:text-lg">{t('dropzone.title')}</span>
        <span className="mt-1.5 block text-sm text-muted-foreground">
          {t('dropzone.subtitle_prefix')}
          <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
            {t('dropzone.subtitle_pill')}
          </span>
        </span>
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
      <p className="mt-4 text-center text-[12.5px] text-muted-foreground [&_kbd]:rounded-md [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-border [&_kbd]:bg-card [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:text-[11px] [&_kbd]:font-medium [&_kbd]:text-foreground">
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
          <Button variant="sage" type="submit">{t('no_js.submit')}</Button>
        </div>
      </noscript>
    </form>
  );
}
