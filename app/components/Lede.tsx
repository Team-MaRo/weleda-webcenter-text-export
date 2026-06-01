import {useTranslation} from 'react-i18next';

export function Lede() {
  const {t} = useTranslation();
  return (
    <section className="relative mb-9 overflow-hidden">
      <svg
        className="pointer-events-none absolute -right-20 -top-24 h-[300px] w-[300px] text-border opacity-70"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="1" />
        <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1" />
        <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="1" />
        <circle cx="200" cy="200" r="198" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="relative max-w-xl">
        <h1 className="font-serif text-[1.9rem] font-medium leading-[1.1] tracking-tight sm:text-[2.3rem] [&_em]:italic [&_em]:text-primary">
          {t('lede.title_prefix')} <em>{t('lede.title_emphasis')}</em>&nbsp;{t('lede.title_suffix')}
        </h1>
        <p className="mt-3 max-w-prose-narrow text-[15px] text-muted-foreground">{t('lede.subtitle')}</p>
      </div>
    </section>
  );
}
