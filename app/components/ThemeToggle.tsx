import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import MoonIcon from '~/assets/icons/moon.svg?react';
import SunIcon from '~/assets/icons/sun.svg?react';
import {useTheme} from '~/hooks/useTheme';

export function ThemeToggle() {
  const {t} = useTranslation();
  const {theme, toggle} = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- SSR-hydration marker: must fire only on the client after mount, so aria-pressed stays absent during SSR
  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';
  const label = isDark ? t('theme.switch_to_light') : t('theme.switch_to_dark');

  return (
    <button
      type="button"
      className="theme-toggle icon-btn"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={mounted ? isDark : undefined}
    >
      {isDark
        ? <SunIcon width={18} height={18} aria-hidden="true" />
        : <MoonIcon width={18} height={18} aria-hidden="true" />}
    </button>
  );
}
