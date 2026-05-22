import type {ToastState} from '~/hooks/useToast';
import classNames from 'classnames';

interface Props {
  toast: ToastState;
}

export function Toast({toast}: Props) {
  return (
    <div
      className={classNames(
        'fixed bottom-6 left-1/2 -translate-x-1/2 text-toast-fg text-sm px-4 py-2 rounded-lg shadow-card-md transition-[opacity,transform] duration-200 pointer-events-none z-[200]',
        toast.kind === 'error' ? 'bg-warn' : 'bg-toast-bg',
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      )}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
