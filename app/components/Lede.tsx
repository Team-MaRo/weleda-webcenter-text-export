import {useTranslation} from 'react-i18next';
import ConcentricRings from '~/assets/icons/concentric-rings.svg?react';

export function Lede() {
  const {t} = useTranslation();
  return (
    <section className="relative mb-9 overflow-hidden">
      <ConcentricRings
        className="pointer-events-none absolute -right-20 -top-24 h-75 w-75 text-border opacity-70"
        aria-hidden="true"
      />
      <div className="relative max-w-xl">
        <h1 className="font-serif text-3xl font-medium leading-display tracking-tight sm:text-4xl [&_em]:italic [&_em]:text-primary">
          {t('lede.title_prefix')} <em>{t('lede.title_emphasis')}</em>&nbsp;{t('lede.title_suffix')}
        </h1>
        <p className="mt-3 max-w-prose-narrow text-base text-muted-foreground">{t('lede.subtitle')}</p>
      </div>
    </section>
  );
}
