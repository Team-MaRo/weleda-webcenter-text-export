import {useTranslation} from 'react-i18next';
import UploadIcon from '~/assets/icons/upload.svg?react';
import {cn} from '~/lib/utils';

interface Props {
  active: boolean;
}

export function DragOverlay({active}: Props) {
  const {t} = useTranslation();
  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center border-[3px] border-dashed border-sage bg-background/70 backdrop-blur-sm transition-opacity pointer-events-none',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-8 py-6 text-base font-medium text-foreground shadow-2xl">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-sage-foreground">
          <UploadIcon width={20} height={20} />
        </span>
        {t('drag_overlay.message')}
      </div>
    </div>
  );
}
