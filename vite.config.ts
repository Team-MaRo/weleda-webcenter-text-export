import type {Plugin} from 'vite';
import {mkdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import {ALLOW_ALL, robots} from 'vite-plugin-robots-ts';
import sitemap from 'vite-plugin-sitemap';
import svgr from 'vite-plugin-svgr';
import {defineConfig} from 'vitest/config';
import {copyrightFromLicense} from './app/vite/plugins/copyright-from-license';
import {spaFallback} from './app/vite/plugins/spa-fallback';
import {stripSpaServerExports} from './app/vite/plugins/strip-spa-server-exports';

const isVitest = process.env.VITEST === 'true';

// Single source of truth for the deployed hostname: public/CNAME. GitHub
// Pages reads it to bind the custom domain; sitemap + robots read it here
// so both stay in lockstep with a single edit.
const cname = readFileSync(join(process.cwd(), 'public', 'CNAME'), 'utf8').trim();
const SITE_URL = `https://${cname}`;
const OUT_DIR = 'build/client';
const absOutDir = join(process.cwd(), OUT_DIR);

// sitemap + robots close their bundle hooks before react-router has flushed
// assets to build/client on a cold build, so the dir might not exist yet.
mkdirSync(absOutDir, {recursive: true});

// react-router 7 runs Vite with multiple environments (client, ssr). Scope
// sitemap + robots to the client build so their closeBundle hooks don't fire
// for the SSR output (which lives at build/server/).
function clientOnly(plugin: Plugin): Plugin {
  return {...plugin, applyToEnvironment: (env) => env.name === 'client'};
}

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
    clientOnly(sitemap({
      hostname: SITE_URL,
      outDir: OUT_DIR,
      dynamicRoutes: ['/'],
      generateRobotsTxt: false,
    })),
    clientOnly(robots({
      content: `${ALLOW_ALL}\n`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    })),
    spaFallback({outDir: absOutDir}),
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
