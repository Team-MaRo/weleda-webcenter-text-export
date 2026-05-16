# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, Codex, …) working in this repository.

## Commands

```shell
pnpm install
pnpm dev                # http://localhost:5173, HMR
pnpm build              # SSR build → build/client + build/server
SSR=false pnpm build    # static / SPA build → build/client only
pnpm preview            # serve the static build locally (4173)
pnpm typecheck          # react-router typegen && tsc --noEmit
pnpm lint               # eslint
pnpm test               # vitest run
pnpm test:watch         # vitest in watch mode
```

Single test: `pnpm test app/lib/xml-to-text/convert.test.ts`
or `pnpm vitest run -t "preserves document order"` for one case by name.

OCI image (Nix-built, no Dockerfile): `nix build .#dockerImage && docker load < result && docker run --rm -p 3000:3000 d3strukt0r/weleda-webcenter-text-export:latest`. On Windows / macOS without a host Nix install, run the `nix build` step inside `nixos/nix:2.34.6` (see README → Building the OCI image locally).

## Local development paths

Three ways to run the app locally; all produce Vite on port 5173 (or the SSR runtime on 3000):

1. **Host** — `pnpm install && pnpm dev`. Plain Node, no Docker.
2. **Devcontainer (Docker outside of Docker)** — `.devcontainer/devcontainer.json` provisions Node 24, the DooD feature (`moby: false`), `act`, common-utils. Open in VS Code → "Reopen in Container", then either:
   - `pnpm dev` directly inside the devcontainer, or
   - `docker compose up dev` to spin up a sibling Vite container. This works because the devcontainer exports `LOCAL_WORKSPACE_FOLDER=${localWorkspaceFolder}` via `remoteEnv`, and `compose.yml`'s bind mount uses `"${LOCAL_WORKSPACE_FOLDER:-.}:/opt/weleda-webcenter-text-export"` so the host docker daemon sees a path it can resolve.
3. **Vagrant VM** — `vagrant up` boots `bento/debian-12`, installs Docker, runs `mkcert` on the host for `weleda-webcenter-text-export.test`, then `docker compose -f compose.vm.yml up`. Traefik on `:443` routes to the dev container. App reachable at `https://weleda-webcenter-text-export.test`.

Compose files:
- `compose.yml` — host + devcontainer dev (Vite only, no Traefik). Runs `nix develop --command sh -c "pnpm install && pnpm run dev --host 0.0.0.0"` inside `nixos/nix`. Source bind-mounted; `node_modules/` and `/nix` are named volumes.
- `compose.vm.dist.yml` → copied to `compose.vm.yml` on first `vagrant up`. Traefik + dev profile. The synced `/vagrant` folder makes `compose.vm.yml` visible on the host too; it's gitignored so user customisation doesn't leak into commits.

## Architecture

### Dual-mode build is the central design fork

`react-router.config.ts` reads `process.env.SSR`. Default is SSR (Node host, Docker). GitHub Pages has no Node runtime, so `deploy-gh-pages.yml` sets `SSR=false`, which produces a pure SPA in `build/client/`. CI runs both builds. When debugging deployment issues, check which mode the failing path actually targets — they take different code paths through `react-router build`.

The split also gates the **no-JS fallback path**: the server-side `action()` on the home route only exists in the SSR build. The SPA build still ships the `<noscript>` form markup, but a POST to GitHub Pages would 404 — accept that, it's consistent with the SPA-mode constraint.

### XML → text conversion (`app/lib/xml-to-text/convert.ts`)

This is the only non-trivial logic in the app. Behaviour is locked down by `convert.test.ts` against `__fixtures__/sample.xml` + `expected.txt`. Four deliberate decisions:

1. **Scoped to `<textContent>` subtrees only.** The GS1 `StandardBusinessDocumentHeader`, `<artworkContentLocale>`, `<sourceReference>` etc. are skipped — those carry timestamps and IDs that would pollute the leaflet text.
2. **Paragraph-aware.** Each `<p>` and `<li>` becomes one output paragraph. Inline elements (`<b>`, `<i>`, …) bubble up; `<br/>` becomes a soft `\n` inside the same paragraph. The renderer relies on `.output p { white-space: pre-line }` to display those soft breaks without a `<br>` element.
3. **Document order, never `<instanceSequence>` sorting.** The fixture deliberately puts `instanceSequence=3` before `=2` so any sort would break the round-trip test.
4. **`fast-xml-parser` with `preserveOrder: true`, not `DOMParser`.** Means the same code runs unchanged in Vitest (Node), SSR, and the browser — no environment branching. Don't reach for `DOMParser` here; jsdom's namespace handling has surprised the project before. The fact that conversion is Node-compatible is what enables the no-JS server action below.

### State and event flow

`routes/home.tsx` is the only meaningful route. It owns:

- **`action({request})`** (SSR-only) — parses `multipart/form-data`, validates extension/type, calls `xmlToText` server-side. Returns either `{paragraphs, text, html, fileName, fileSize}` or `{error: 'no-file' | 'not-xml' | 'no-content'}`. See [No-JS fallback](#no-js-fallback) below.
- **`useActionData<typeof action>()`** seeds the client store via `useConverter(initial)` so a server-rendered result hydrates into the same state. `useActionData` widens literal unions through React Router's serialization — narrow with a runtime helper (`if (code === 'no-file') return …`), not a `Record<…>` lookup, otherwise TS will fail with "string undefined cannot be used as index".
- **`useConverter(initial?)`** — file → `{paragraphs, text, html, fileName, fileSize}` + stats. The async `loadFile` reads with `FileReader`, then dispatches to `loadXml` (which calls `xmlToText`). Returns `{ok, reason}` on failure or `{ok: true, nonEmpty}` so the caller can toast on `not-xml` / `read-failed` and on parses that produced zero `<textContent>` paragraphs — all without the hook touching i18n. The optional `initial` param exists so a server-rendered action result seeds the same `useState` slot on first render.
- **`usePageDragDrop()`** — window-level dragenter/over/leave/drop with a depth counter and a `Files`-only guard (so dragging text/HTML across the page doesn't trigger the overlay). Drop anywhere → `handleFile`.
- **`usePasteXml()`** — Ctrl/Cmd+V handling with two paths:
  1. **Standard `paste` event** (something on the page is focused, *or* in newer Chromium even when body is focused). Inspects `clipboardData.files` first — supports pasting a file copied from Explorer/Finder, passes it straight to `handleFile`. Falls back to `text/xml` → `application/xml` → `text/plain` for raw-XML pastes.
  2. **`keydown` fallback** (only when `document.activeElement` is `<body>`/`<html>`, where Chromium often *doesn't* fire a paste event). Uses `navigator.clipboard.readText()`, which prompts for permission once.
  The two paths coordinate via a `lastPasteHandledAt` timestamp so a single Ctrl+V can't double-toast (the keydown's `await readText()` continuation is async; the synchronous paste event runs in between and sets the timestamp). The hook also accepts an `onShortcutClipboardNotUsable` callback so the keydown path can toast "this isn't XML" — the standard path stays silent because the user might be pasting into the search box.
- **`useToast()`** — single-slot toast with auto-hide.
- **`useTheme()`** — dark/light → `body.light|.dark` + `localStorage['weleda-konverter:theme']`. The inline `themeBootstrap` IIFE in `root.tsx` runs before hydration so the first paint matches the persisted preference (no light/dark FOUC).

The `Result` component owns search/copy/download locally. Two patterns worth knowing:

- **`useDeferredValue` over setTimeout debounce.** The search query is fed through `useDeferredValue(query)`; the deferred value drives the highlight + match-count `useMemo`. Replaces the previous `setTimeout`/`debounceRef` machinery — same behaviour, less code, scheduler-aware.
- **"Adjust state in render" instead of a reset effect.** The search query clears when a new file loads via:
  ```ts
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setQuery('');
  }
  ```
  Lifted straight from [react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes). Avoids the `react-hooks-extra/no-direct-set-state-in-use-effect` lint warning and one extra re-render.

### No-JS fallback

Reachable only from the SSR build. The `Dropzone` component renders a real `<form method="post" action="?index" encType="multipart/form-data">` wrapping the existing label + hidden file input (the hidden input gets `name="file"` and `required`). The submit button + "file selected" hint live inside `<noscript>`, so:

- **With JS:** browsers parse `<noscript>` contents as text-only — those elements are not in the live DOM, the JS `onChange` handler intercepts file selection, the form is never submitted.
- **Without JS:** `<noscript>` contents materialize as real elements. User picks a file via the dropzone label, the `:has(input[type=file]:valid)` CSS rule reveals the "✓ Datei ausgewählt" hint and un-dims the Hochladen button (the `required` attribute is what makes `:valid` mean "file present"). Click Hochladen → POST → server runs `action()` → page re-renders SSR with the converted result.

Two non-obvious requirements:

1. **`action="?index"` is mandatory.** React Router treats `POST /` as ambiguous between the root layout and the index route, returning 405. The `?index` query disambiguates to the index action. Without it, you get a `405 Method Not Allowed` rendered through the root `ErrorBoundary`.
2. **`required` on the file input is structural, not just validation.** Stripping it would break the `:has(input:valid)` CSS feedback because file inputs are unconditionally `:valid` without `required`.

Search, copy, and download are JS-only by nature (search reruns the highlight memo, copy uses the Clipboard API, download uses Blob URLs). Without JS they render but do nothing — the user reads / select-copies the text manually. Don't try to polyfill them.

### i18n is mandatory for all UI strings

Every user-facing string lives in `app/locales/de.yml`. Components import `useTranslation` from `react-i18next` and call `t('key')`. The `meta()` export in `routes/home.tsx` calls `i18n.t(...)` directly because it runs outside React. To add a string: add a key to `de.yml`, reference it via `t('…')` — never inline German in TSX.

Action-side error codes use the same keys as toasts: `not-xml` → `toast.not_xml`, `no-content` → `toast.no_content`, `no-file` → `toast.no_file`. The mapping is a runtime if-chain in `home.tsx` (not a `Record`) so TS can narrow string literal returns — see the note under State and event flow about `useActionData` widening.

### Styling

All visual rules live in `app/styles/main.scss`. The design tokens are oklch CSS variables on `:root`. Tailwind v4 is wired via `@tailwindcss/vite` (utility classes are fine). **No inline `style={…}` on JSX** — give the element a class and add the rule to `main.scss` instead. The 404 / error fallbacks use `.fallback-page` for this reason.

The no-JS feedback states rely on the **`:has()` selector**:

```scss
.dropzone-form:has(input[type='file']:valid) .no-js-selected-hint { display: block; }
.dropzone-form:not(:has(input[type='file']:valid)) .no-js-submit button { opacity: 0.55; }
```

Both rules target elements that only live inside `<noscript>` in JS mode (so they have no effect for JS users — the `:has()` parent on `.dropzone-form` still matches, but the children aren't in the live DOM). Browser support is Chrome/Edge 105+, Safari 15.4+, Firefox 121+.

### Icons (extracted SVGs)

Per-icon files in `app/assets/icons/*.svg`, imported as React components via the `?react` query (vite-plugin-svgr, configured in `vite.config.ts`). Example:

```tsx
import CheckIcon from '~/assets/icons/check.svg?react';
// …
<CheckIcon width={14} height={14} className="check" />
```

- Default stroke width is `1.8`; override per call site with `<UploadIcon strokeWidth={1.6} />` when needed.
- `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"` — so icons re-theme via CSS `color`.
- Indentation in the SVG source files is 4 spaces.
- The svgr plugin in `vite.config.ts` rewrites `#575756` → `currentColor` so the same source SVG renders fixed-grey as a favicon (`?url` import) and re-themes when used inline.
- Ambient type declarations for `*.svg?react` and `*.svg?url` are in `app/globals.d.ts`.

### Path alias

`~` resolves to `app/` (in both `tsconfig.json` paths and `vite.config.ts` resolve.alias). Use `~/components/Foo` rather than `../../components/Foo`.

### YAML imports

`app/locales/*.yml` are loaded as ES modules through `@modyfi/vite-plugin-yaml`. The ambient `*.yml` declaration lives in `app/globals.d.ts`.

## Production image (Nix-built OCI)

**No Dockerfile.** Image produced by `flake.nix` via `pkgs.dockerTools.streamLayeredImage`, post-processed by `nix-utils`' `fixOciImageHistory` so layers show per-step Commands in Dive and Trivy stops flagging the synthetic `HEALTHCHECK` (DS-0026).

- **Build**: `nix build .#dockerImage` → `./result` is a docker-load-able tarball.
- **Two derivations**: `weleda-webcenter-text-export` builds the SSR bundle (`pnpm.fetchDeps` FOD, build, prune, lay at `$out/opt/weleda-webcenter-text-export/`). `dockerImage` wraps it via `dockerImageStream` piped through `fixOciImageHistory`.
- **Runtime contents**: `usrBinEnv` + `fakeNss` (with appended nonroot user) + `bashInteractive` + `coreutils` + `gnused` + `which` (pnpm bin shims) + `nodejs-slim_24` + a stripped `curlSlim` + the app derivation. `bashInteractive` (not plain bash) because nodejs-slim transitively pulls it; adding plain bash would ship two shells.
- **Runtime layout**: app lives at `/opt/weleda-webcenter-text-export/{build,node_modules,package.json}`. User `nonroot:65532`; `/tmp` mode 1777 created in `extraCommands`. CMD `react-router-serve ./build/server/index.js`, found via `PATH=/opt/weleda-webcenter-text-export/node_modules/.bin:/bin:/usr/bin`. Healthcheck `curl -fsS http://localhost:3000/` every 30 s.
- **Reproducibility**: `created = createdFromDate self.lastModifiedDate` — clean tree = HEAD commit time → identical config-blob digest from identical sources.
- **Hardening tricks** (don't undo):
  - `dontFixup`/`dontStrip`/`dontPatchShebangs`/`dontPatchELF = true`. Without them, `patchShebangs` rewrites every `#!/usr/bin/env node` in `node_modules` to absolute `/nix/store/<hash>-nodejs-24…` paths, dragging full nodejs + stdenv + perl + python + gcc-libs into the runtime closure. Plain `/usr/bin/env <prog>` shebangs work because the image ships `usrBinEnv` + `nodejs-slim_24` + `bashInteractive` + `coreutils` + `gnused`.
  - `disallowedReferences = [ pkgs.nodejs_24 ]` — hard-fails the build if the full nodejs sneaks back in.
  - `enableFakechroot = true` — `extraCommands` paths resolve relative to image root.
- **`weleda-webcenter-text-export` is in `streamLayeredImage.contents`** — only safe because its `installPhase` nests output under `$out/opt/weleda-webcenter-text-export/`. dockerTools symlinks every top-level path of each contents package into rootfs; don't move files back to `$out/` root.
- **`pnpmDeps.hash`** is a fixed-output hash. Every lockfile change → new hash. First build with a stale hash fails with `specified: X / got: Y` — copy the `got` value in. Auto-bumped via `bump-pnpm-hash.yml` (Workflows).

## Workflows

- **`ci.yml`** — lint + typecheck + build + tests on every PR / push, plus a Trivy / Grype scan of the OCI image.
- **`deploy-gh-pages.yml`** — `SSR=false pnpm build` → `actions/upload-pages-artifact@v5` → `actions/deploy-pages@v5` on push to `master`.
- **`docker.yml`** — multi-arch (`amd64`, `arm64`, `riscv64`) Nix-built OCI image to Docker Hub. Same `setup → build → manifest → attest` pipeline as `d3strukt0r/d3strukt0r.github.io`: build matrix has no Docker Hub creds, manifest job uses a `registry:3` service container + `skopeo` + `imagetools create`, cosign + attest per arch + per manifest-list tag. `paths-ignore: [pnpm-lock.yaml, package.json]` skips lockfile-only Dependabot merges (the follow-up bump commit re-fires the workflow).
- **`bump-pnpm-hash.yml`** — push-triggered on `master`/`develop` when `pnpm-lock.yaml`/`package.json` changes. Runs `bin/bump-pnpm-hash.sh`: swaps `pnpmDeps.hash` with `lib.fakeHash`, runs `nix build` to provoke the FOD mismatch, extracts the real value from the `got:` line, writes it back, commits + pushes under `github-actions[bot]`. **Requires `GH_PAT`** — plain `GITHUB_TOKEN` commits don't trigger downstream workflows (docker.yml would stay queued).
- **`release.yml`** — `googleapis/release-please-action@v5` on push to `master`. Scans conventional commits, opens a release PR with version bump + `CHANGELOG.md`; on merge cuts a GitHub Release + git tag. The tag triggers `docker.yml`. Managed files: `package.json` (`version`) + `flake.nix` (`version = "X.Y.Z"; # x-release-please-version`). Uses `GH_PAT`.
- `dependabot-validate.yml` / `dependabot-automerge.yml` / `dockerhub-description.yml` / `greetings.yml` / `label.yml` / `stale.yml` — peripheral automation.

## Devcontainer

`.devcontainer/devcontainer.json` — `mcr.microsoft.com/devcontainers/base:debian` + features: `common-utils`, `node:1` (v24), `docker-outside-of-docker` (`moby: false`), `github-cli`-equivalent, `devcontainers-extra/features/act`. Forwards 5173/4173/3000. `postCreateCommand: corepack enable && pnpm install`. **Nix is not preinstalled** — for image builds, run inside `nixos/nix:2.34.6` (see `compose.yml`) or install ad-hoc.

## Gotchas

- **`POST /` returns 405** unless the form has `action="?index"`. React Router treats it as ambiguous between root layout and index route. See No-JS fallback above.
- **`useActionData<typeof action>()` widens literal unions.** Narrow with explicit if-chains, not `Record<'no-file'|'not-xml'|'no-content', string>` lookups — TS reports `Argument of type 'string | undefined' is not assignable to parameter of type 'string'` on the index.
- **Don't put a `<button type=submit>` inside the dropzone `<label>`.** Clicking the button would also trigger the label's file picker. Submit lives as a sibling inside the wrapping `<form>`, gated by `<noscript>`.
- **`<noscript>` contents are text-only in JS mode.** When testing the no-JS path in JS-enabled browsers, you have to re-inject the noscript innerHTML as live elements (see how we verify CSS state in the Chrome DevTools MCP path). Don't expect `document.querySelector('form.no-js-form')` to find anything.
- **`pnpmDeps.hash`** — every `pnpm-lock.yaml` change needs a paired hash bump in `flake.nix`. `bump-pnpm-hash.yml` handles it on `master`/`develop`. For local manual `pnpm add`/`update`, run `./bin/bump-pnpm-hash.sh`.
- **pnpm via Corepack** (host/devcontainer/CI only). `packageManager` field in `package.json` pins the version. `corepack enable` once on dev machines; don't `npm i -g pnpm`. Production image bypasses Corepack — uses `pkgs.pnpm_10` at build time, ships zero pnpm at runtime.
- **The `themeBootstrap` IIFE in `root.tsx`** is intentionally minified to a single line so it parses inline before hydration (avoids the theme FOUC). Two `eslint-disable-next-line` comments on the same const + the `<script dangerouslySetInnerHTML>` — both have a `--` rationale; keep them when editing.
- **`react-hooks-extra/no-direct-set-state-in-use-effect`** trips on the canonical SSR-hydration mounted marker (`useEffect(() => setMounted(true), [])`). The suppression on `ThemeToggle.tsx` is intentional; don't rewrite it.
- **`ts/promise-function-async` on `wrapSegment`** — React 19's `ReactNode` includes `Promise<ReactNode>`, which trips the rule on synchronous renderers. Suppression has a `--` rationale; adding `async` would wrap each node in a Promise React can't render.
- **`release.yml`-managed lines** — the `version = "X.Y.Z"; # x-release-please-version` line in `flake.nix` is bot-managed. Hand-edits get overwritten on the next release PR.
