import {useTranslation} from 'react-i18next';
import {FallbackPage} from '~/components/FallbackPage';

export default function NotFound() {
  const {t} = useTranslation();
  return <FallbackPage title={t('not_found.title')} message={t('not_found.message')} />;
}
