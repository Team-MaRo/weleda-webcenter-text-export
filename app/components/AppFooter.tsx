import {useTranslation} from 'react-i18next';

export function AppFooter() {
  const {t} = useTranslation();
  return (
    <footer className="app-footer">
      <div className="footer-main">
        <span className="footer-brand">{t('footer.brand')}</span> {t('footer.separator')} {t('footer.text')}
      </div>
      <div className="footer-copyright">
        {t('footer.copyright', {years: __COPYRIGHT_YEARS__, holder: __COPYRIGHT_HOLDER__})}
      </div>
    </footer>
  );
}
