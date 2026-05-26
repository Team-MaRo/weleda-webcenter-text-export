import {useTranslation} from 'react-i18next';

export function Lede() {
  const {t} = useTranslation();
  return (
    <section className="mb-9 flex items-end justify-between gap-8 flex-wrap">
      <div>
        <h1 className="font-serif font-medium text-display m-0 mb-2 text-ink [&_em]:italic [&_em]:text-accent-d max-md:text-3xl">
          {t('lede.title_prefix')} <em>{t('lede.title_emphasis')}</em>&nbsp;{t('lede.title_suffix')}
        </h1>
        <p className="m-0 text-ink-soft text-base max-w-prose-narrow">{t('lede.subtitle')}</p>
      </div>
    </section>
  );
}
