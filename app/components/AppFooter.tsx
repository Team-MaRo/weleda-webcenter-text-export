import {useTranslation} from 'react-i18next';

export function AppFooter() {
  const {t} = useTranslation();
  return (
    <footer className="text-center text-ink-mute text-xs px-8 pt-6 pb-10">
      <div>
        <span className="text-accent-d">{t('footer.brand')}</span> {t('footer.separator')} {t('footer.text')}
      </div>
      <div className="mt-1 opacity-75">
        {t('footer.copyright', {years: __COPYRIGHT_YEARS__, holder: __COPYRIGHT_HOLDER__})}
      </div>
    </footer>
  );
}
