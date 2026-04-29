import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';

interface Props {
  active: boolean;
}

export function DragOverlay({active}: Props) {
  const {t} = useTranslation();
  return (
    <div className={`drag-overlay${active ? ' is-active' : ''}`} aria-hidden="true">
      <div className="drag-overlay-panel">
        <UploadIcon width={22} height={22} />
        <span>{t('drag_overlay.message')}</span>
      </div>
    </div>
  );
}
