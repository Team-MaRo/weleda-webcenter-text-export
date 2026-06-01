import type {ToasterProps} from 'sonner';
import {Toaster as Sonner} from 'sonner';
import {useTheme} from '~/hooks/useTheme';

// shadcn Sonner wrapper, retargeted from `next-themes` to this project's
// `useTheme` (html.dark cascade). Sonner ships its own default status icons,
// so we drop the lucide icon overrides to keep the dep surface lean.
function Toaster(props: ToasterProps) {
  const {theme} = useTheme();
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        // No `--destructive-foreground` token in this palette — error toast
        // text rides on `--background` (the prototype's error contrast).
        '--error-bg': 'var(--destructive)',
        '--error-text': 'var(--background)',
        '--error-border': 'var(--destructive)',
        '--border-radius': 'var(--radius)',
      } as React.CSSProperties}
      {...props}
    />
  );
}

export {Toaster};
