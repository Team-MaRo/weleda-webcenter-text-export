import type {ButtonHTMLAttributes} from 'react';
import classNames from 'classnames';

type Variant = 'default' | 'primary' | 'icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  // Triggers the "just-copied" visual on default/primary variants. Ignored
  // by the icon variant.
  copied?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  default: 'inline-flex items-center gap-1.5 border border-line bg-paper text-ink text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-bg-soft hover:border-ink-mute',
  primary: 'inline-flex items-center gap-1.5 border border-accent bg-accent text-accent-fg text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-accent-d hover:border-accent-d',
  icon: 'size-8 grid place-items-center border border-transparent bg-transparent text-ink-mute rounded-md hover:bg-bg-soft hover:text-ink',
};

export function Button({variant = 'default', copied = false, className, children, ...rest}: Props) {
  const showCopied = copied && variant !== 'icon';
  return (
    <button
      {...rest}
      className={classNames(
        'cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        VARIANTS[variant],
        showCopied && 'bg-accent-s text-accent-d border-accent hover:bg-accent-s hover:border-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}
