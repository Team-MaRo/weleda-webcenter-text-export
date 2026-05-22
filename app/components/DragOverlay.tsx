import classNames from 'classnames';
import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';

interface Props {
  active: boolean;
}

export function DragOverlay({active}: Props) {
  const {t} = useTranslation();
  return (
    <div
      aria-hidden="true"
      className={classNames(
        'fixed inset-0 bg-accent-glow backdrop-blur-[2px] border-2 border-dashed border-accent pointer-events-none transition-opacity duration-150 z-[100] grid place-items-center',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="bg-paper rounded-card px-9 py-7 shadow-card-md flex items-center gap-4 text-ink font-medium text-base [&>svg]:text-accent-d">
        <UploadIcon width={22} height={22} />
        <span>{t('drag_overlay.message')}</span>
      </div>
    </div>
  );
}
