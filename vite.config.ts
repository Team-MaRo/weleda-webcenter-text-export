import {join} from 'node:path';
import process from 'node:process';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import {defineConfig} from 'vitest/config';
import {copyrightFromLicense} from './app/vite/plugins/copyright-from-license';
import {faviconRasters} from './app/vite/plugins/favicon-rasters';
import {robots} from './app/vite/plugins/robots';
import {sitemap} from './app/vite/plugins/sitemap';
import {spaFallback} from './app/vite/plugins/spa-fallback';
import {stripSpaServerExports} from './app/vite/plugins/strip-spa-server-exports';
import {webManifest} from './app/vite/plugins/web-manifest';

const WEB_MANIFEST_ICONS = [
  {size: 192, out: 'web-app-manifest-192x192.png', purpose: 'maskable'},
  {size: 512, out: 'web-app-manifest-512x512.png', purpose: 'maskable'},
] as const;

const isVitest = process.env.VITEST === 'true';
// SSR serves the SEO artifacts as runtime resource routes; only the SPA
// (GitHub Pages) build emits them as static files (host known at build time).
const isSpa = process.env.SSR === 'false';

// Deployed hostname for the SPA build's static SEO files. CI's
// deploy-gh-pages.yml passes it as SITE_HOST (from the Pages custom domain);
// local dev falls back to localhost. The SSR image ignores this and resolves
// the host per request (app/lib/site-url.ts).
const trimmedHost = process.env.SITE_HOST?.trim();
const SITE_HOST = trimmedHost === undefined || trimmedHost === '' ? 'localhost' : trimmedHost;
const SITE_URL = `https://${SITE_HOST}`;

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Must run before reactRouter so its scan sees the post-transform source
    // (with `action` removed in SPA mode).
    stripSpaServerExports(),
    // Pulls year(s) + holder from LICENSE.txt and exposes them as
    // build-time globals (__COPYRIGHT_YEARS__, __COPYRIGHT_HOLDER__) so
    // the footer copyright stays in lockstep with the legal artefact.
    copyrightFromLicense(),
    // Rasterises `app/assets/favicon.svg` to PNG + multi-resolution ICO
    // during the client build. Modern browsers use the SVG directly; these
    // are fallbacks for older platforms. The PNG set merges the favicon-only
    // sizes with the shared PWA manifest icons so the rasters and the
    // manifest stay in lockstep.
    faviconRasters({
      source: join('app', 'assets', 'favicon.svg'),
      svgOut: 'favicon.svg',
      icoOut: 'favicon.ico',
      pngs: [
        {size: 96, out: 'favicon-96x96.png'},
        {size: 180, out: 'apple-touch-icon.png'},
        ...WEB_MANIFEST_ICONS.map((i) => ({size: i.size, out: i.out})),
      ],
      icoSizes: [16, 32, 48],
    }),
    // Emits `site.webmanifest` at build time. Shares its icon set with
    // `faviconRasters`; sources the text fields from the locale YAML's
    // `brand.*` so a single edit in `de.yml` propagates to the PWA listing.
    webManifest({
      locale: join('app', 'locales', 'de.yml'),
      out: 'site.webmanifest',
      keys: {name: 'brand.name', short_name: 'brand.short_name', description: 'brand.description'},
      // Static knobs; colours are sRGB hex (precomputed from OKLCH — some
      // Android launchers don't parse `oklch(...)`). Matches the redesign's
      // light `--background` (THEME_COLOR_LIGHT = oklch(98.1% 0.005 95.1deg)).
      manifest: {lang: 'de', display: 'standalone', theme_color: '#faf9f5', background_color: '#faf9f5'},
      icons: WEB_MANIFEST_ICONS,
    }),
    // react-router's vite plugin clashes with vitest's environment setup, so
    // skip it when running tests.
    ...(isVitest ? [] : [reactRouter()]),
    ViteYaml(),
    // `import Mark from '~/assets/foo.svg?react'` returns a React component;
    // `?url` keeps the URL form (used for the favicon link). The replaceAttrValues
    // entry rewrites the brand-grey fill to currentColor in the React variant,
    // so the same source SVG renders fixed-grey as a favicon and re-themes
    // when used inline.
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {replaceAttrValues: {'#575756': 'currentColor'}},
    }),
    // sitemap.xml / robots.txt as static files — SPA build only, each via its
    // own plugin's render fn (the SSR image serves the same through resource
    // routes, resolving the host per request).
    ...(isSpa
      ? [
          sitemap({siteUrl: SITE_URL, paths: ['/']}),
          robots({siteUrl: SITE_URL}),
        ]
      : []),
    // Copies build/client/index.html → 404.html (GitHub Pages SPA fallback).
    // Reads build/client itself; SSR builds emit no index.html there → no-op.
    spaFallback(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
  },
});
