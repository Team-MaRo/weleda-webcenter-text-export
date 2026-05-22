import {useEffect, useState} from 'react';

const STORAGE_KEY = 'weleda-konverter:theme';

// Shared by the JSX `<meta name="theme-color">` tags in root.tsx, the inline
// bootstrap that runs them on first paint, and the effect below. Values
// match the `--bg` token in main.scss so the mobile browser chrome blends
// continuously with the page body.
export const THEME_COLOR_LIGHT = 'oklch(95.9% 1.7% 90deg)';
export const THEME_COLOR_DARK = 'oklch(18% 3% 200deg)';

export type Theme = 'light' | 'dark';

function readInitial(): Theme {
  if (typeof document === 'undefined') {
    return 'light';
  }
  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  if (document.documentElement.classList.contains('light')) {
    return 'light';
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage may throw in private mode / sandboxed contexts; ignore.
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may throw in private mode / sandboxed contexts; ignore.
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    // Override every `<meta name="theme-color">` regardless of its `media`
    // attribute. Both metas end up with the same value, so whichever one
    // wins the browser's media match shows the chosen theme's chrome
    // colour.
    const color = theme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', color);
    });
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return {theme, toggle, setTheme};
}
