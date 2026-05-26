import {useTranslation} from 'react-i18next';
import WeledaMark from '~/assets/weleda-mark.svg?react';
import WeledaWordmark from '~/assets/weleda-wordmark.svg?react';
import {ThemeToggle} from './ThemeToggle';

export function Topbar() {
  const {t} = useTranslation();
  return (
    <header className="sticky top-0 z-30 bg-header backdrop-blur-md border-b border-line-soft">
      <div className="container flex items-center justify-between py-5 px-8 max-md:px-5">
        <div className="flex items-center gap-3.5">
          <WeledaMark className="w-8 h-8 block text-ink" aria-hidden="true" />
          <WeledaWordmark className="h-4 w-auto block text-ink" role="img" aria-label={t('brand.weleda_alt')} />
          <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
          <span className="text-xs text-ink-soft tracking-wide font-medium">{t('brand.tagline')}</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-xs text-ink-mute tracking-wide max-md:hidden">
            {t('topbar.hint')}{' '}
            <kbd className="font-sans text-xs font-medium px-1.5 py-0.5 border border-line border-b-2 rounded-md bg-paper text-ink-soft">
              {t('topbar.hint_kbd')}
            </kbd>
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
