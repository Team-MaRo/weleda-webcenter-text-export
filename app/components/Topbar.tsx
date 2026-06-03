import {useTranslation} from 'react-i18next';
import WeledaMark from '~/assets/weleda-mark.svg?react';
import WeledaWordmark from '~/assets/weleda-wordmark.svg?react';
import {ThemeToggle} from './ThemeToggle';

export function Topbar() {
  const {t} = useTranslation();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-header backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4 px-8 max-md:px-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <WeledaMark className="h-6 w-6 shrink-0 object-contain text-foreground" aria-hidden="true" />
          <WeledaWordmark className="h-3.5 w-auto shrink-0 text-foreground" role="img" aria-label={t('brand.weleda_alt')} />
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          <span className="hidden truncate text-xs font-medium tracking-wide text-muted-foreground sm:block">{t('brand.tagline')}</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-xs tracking-wide text-muted-foreground max-md:hidden [&_kbd]:rounded-md [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-border [&_kbd]:bg-card [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:text-xs [&_kbd]:font-medium [&_kbd]:text-foreground">
            {t('topbar.hint')}{' '}
            <kbd>{t('topbar.hint_kbd')}</kbd>
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
