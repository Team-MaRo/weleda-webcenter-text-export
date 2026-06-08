# Weleda Web Center XML to Text Converter

Converts a GS1 `artwork_content:artworkContentMessage` XML (the format
exported from Esko Web Center) into a readable plain-text leaflet — the
kind that's easy to paste into Word for layouting. With JavaScript on,
everything runs **locally in the browser**; no file ever leaves the
machine. With JavaScript off, the SSR container falls back to a server-
side conversion (see [No-JavaScript fallback](#no-javascript-fallback)).

Four ways to load an XML:

- **Drop it anywhere on the page** — the whole window is a drop target.
- **Click the dropzone** — opens a regular file picker.
- **Ctrl/Cmd+V** — paste either the *file* (copied with Ctrl+C in your
  file explorer) or the *raw XML text* directly.
- **`<form>` POST** — picks the file in the dropzone and clicks the
  Hochladen button that only appears when JavaScript is disabled.

[![License](https://img.shields.io/github/license/Team-MaRo/weleda-webcenter-text-export?label=License)](LICENSE.txt)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa)][code-of-conduct]
[![Docker Stars](https://img.shields.io/docker/stars/d3strukt0r/weleda-webcenter-text-export)][docker]
[![Docker Pulls](https://img.shields.io/docker/pulls/d3strukt0r/weleda-webcenter-text-export)][docker]

[![CI](https://github.com/Team-MaRo/weleda-webcenter-text-export/actions/workflows/ci.yml/badge.svg)][gh-action]
[![Pages](https://github.com/Team-MaRo/weleda-webcenter-text-export/actions/workflows/deploy-gh-pages.yml/badge.svg)][gh-action]
[![Docker](https://github.com/Team-MaRo/weleda-webcenter-text-export/actions/workflows/docker.yml/badge.svg)][gh-action]

## Running the container

The published image serves the SSR build on port `3000`.

### Prerequisites

You need [Docker](https://docs.docker.com/get-docker/) installed.

* [Windows](https://docs.docker.com/desktop/install/windows-install/)
* [macOS](https://docs.docker.com/desktop/install/mac-install/)
* [Linux](https://docs.docker.com/engine/install/)

### Usage

Pull and run the latest image:

```shell
docker run --rm -p 3000:3000 d3strukt0r/weleda-webcenter-text-export:latest
```

Then open <http://localhost:3000>.

Pin to a specific version (recommended for production):

```shell
docker run --rm -p 3000:3000 d3strukt0r/weleda-webcenter-text-export:2.1.2
```

Run on a different host port:

```shell
docker run --rm -p 8080:3000 d3strukt0r/weleda-webcenter-text-export:latest
```

Get a shell inside the container:

```shell
docker run --rm -it --entrypoint sh d3strukt0r/weleda-webcenter-text-export:latest
```

### docker compose

```yaml
services:
  web:
    image: d3strukt0r/weleda-webcenter-text-export:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
```

### Environment variables

* `PORT` — port `react-router-serve` listens on. Default `3000`.
* `NODE_ENV` — set to `production` in the image. Don't override.

No secrets or per-deployment configuration — the converter has no
backend state.

### Image details

* **Base:** distroless (Nix-built, no shell as PID 1, runs as `nonroot:65532`)
* **Server:** `@react-router/serve` (SSR)
* **Exposed port:** `3000`
* **Healthcheck:** `curl` against `/` every 30 s
* **Architectures:** `linux/amd64`, `linux/arm64`, `linux/riscv64`

### Tags

* `latest` — highest published semver release (via `flavor.latest=auto`)
* `<major>`, `<major>.<minor>`, `<major>.<minor>.<patch>` — semver releases
* `develop` — branch tip for the `develop` branch (pre-release / preview builds)

`master` is not published as a branch tag — release tags from `release.yml` are the only path to `:latest`.

Full list at [hub.docker.com/r/d3strukt0r/weleda-webcenter-text-export](https://hub.docker.com/r/d3strukt0r/weleda-webcenter-text-export/tags).

### Building your own image

The image is built by `flake.nix`, not a `Dockerfile`. See
[Development → Building the OCI image locally](#building-the-oci-image-locally)
for the full recipe (works on Windows / macOS / Linux via a throwaway
`nixos/nix` container; no host Nix install required).

## No-JavaScript fallback

The page works without JavaScript when running from the SSR image (the
GitHub Pages SPA build has no Node runtime, so it can only do client-
side conversion). With JS off you get the dropzone, the file picker,
and a **Hochladen** submit button that posts the file to a React Router
`action` on `/?index`; the server runs `xmlToText` and re-renders the
page with the converted result. After picking a file, the dropzone
shows a "✓ Datei ausgewählt" indicator via pure-CSS `:has(input:valid)`
— no inline JS.

Search, copy, and download require JavaScript; without it, the user
can still read and select-copy the rendered text manually.

## Stack

- [React Router v7](https://reactrouter.com/) (framework mode), React 19,
  TypeScript
- [Vite](https://vitejs.dev/) build, [Vitest](https://vitest.dev/) tests
- [Tailwind CSS v4](https://tailwindcss.com/) + [Sass](https://sass-lang.com/)
  (`api: modern-compiler`)
- [i18next](https://www.i18next.com/) — UI strings live in
  [`app/locales/de.yml`](app/locales/de.yml)
- [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser)
  — pure JS, runs in browser + Node, deterministic for tests
- [pnpm](https://pnpm.io/) (`packageManager` pinned)
- Dual-mode build: SSR for the Nix-built OCI image, static (SPA) for
  GitHub Pages

## Development

For working on the site itself (not just running the published image).

### Prerequisites

* [Git](https://git-scm.com/)
* [Node.js 24+](https://nodejs.org/) with
  [Corepack](https://nodejs.org/api/corepack.html) enabled
  (`corepack enable`) — pnpm is pinned via `packageManager` in
  `package.json`.

Or use one of the prebuilt environments below.

### Setup (host)

```shell
git clone git@github.com:D3strukt0r/weleda-webcenter-text-export.git
cd weleda-webcenter-text-export
pnpm install
pnpm dev
```

The dev server runs on <http://localhost:5173> with HMR.

### Devcontainer (Docker outside of Docker)

`.devcontainer/devcontainer.json` provisions Node 24, the DooD feature
(`moby: false`), `act`, common-utils. Open in VS Code → **Reopen in
Container**, then:

```shell
pnpm dev                 # Vite inside the devcontainer
# or
docker compose up dev    # Vite in a sibling Nix container, host
                         # workspace bind-mounted via $LOCAL_WORKSPACE_FOLDER
```

### Vagrant VM (full HTTPS stack on a `.test` hostname)

Requires VirtualBox + Vagrant + [`mkcert`](https://github.com/FiloSottile/mkcert)
on the host (the Vagrantfile asks `mkcert` to mint local certs on first
boot).

```shell
vagrant up        # provisions Debian 12, Docker, brings up Traefik + dev
# app reachable at https://weleda-webcenter-text-export.test
# Traefik dashboard at https://traefik.weleda-webcenter-text-export.test
```

`compose.vm.dist.yml` is the template; it's copied to `compose.vm.yml`
inside the VM (gitignored) so you can edit it without churning the
repo.

### Common commands

* `pnpm dev` — Vite dev server (5173) with HMR
* `pnpm build` — production build → `build/client/` + `build/server/`
* `SSR=false pnpm build` — static / SPA build → `build/client/` only
* `pnpm preview` — preview the static build locally on 4173
* `pnpm typecheck` — `react-router typegen && tsc --noEmit`
* `pnpm lint` / `pnpm lint:fix` — ESLint
* `pnpm test` / `pnpm test:watch` — Vitest

Run a single test by file or name:

```shell
pnpm test app/lib/xml-to-text/convert.test.ts
pnpm vitest run -t "preserves document order"
```

### Build modes

`react-router.config.ts` toggles SSR via the `SSR` env var:

- **Docker / Node hosting (default):** `pnpm build` → SSR bundle, served
  by `react-router-serve` on port 3000. Enables the no-JS form POST
  path.
- **GitHub Pages (no Node runtime):** `SSR=false pnpm build` → static
  SPA in `build/client/`. The
  [`deploy-gh-pages.yml`](.github/workflows/deploy-gh-pages.yml) workflow
  uploads that folder via `actions/deploy-pages`. The no-JS form POST is
  inert on GH Pages.

### Building the OCI image locally

The production image is Nix-built (`flake.nix`); there is no
`Dockerfile`. If you have Nix installed, `nix build .#dockerImage` is
enough. Otherwise — and on Windows in particular — run Nix inside a
throwaway `nixos/nix` container; everything else lives in your existing
Docker daemon.

PowerShell (Windows / macOS Docker Desktop):

```powershell
docker run --rm `
  -v "${PWD}:/work" -w /work `
  nixos/nix:2.34.6 `
  nix --extra-experimental-features "nix-command flakes" `
      build .#dockerImage
docker load --input result
docker run --rm -p 3000:3000 d3strukt0r/weleda-webcenter-text-export:latest
```

Bash (Linux / WSL / macOS):

```shell
docker run --rm \
  -v "$PWD:/work" -w /work \
  nixos/nix:2.34.6 \
  nix --extra-experimental-features "nix-command flakes" \
      build .#dockerImage
docker load --input result
docker run --rm -p 3000:3000 d3strukt0r/weleda-webcenter-text-export:latest
```

For repeated builds, add `-v nix-store:/nix` to the `docker run` flags
so the Nix store survives across container restarts (mirrors what
`compose.yml` already does for the dev shell). First build: 5–10 min.
Subsequent rebuilds: seconds.

For a containerized **dev server** with HMR (no image build, just
`pnpm run dev` inside Nix), use `compose.yml`:

```shell
docker compose up --build
```

## XML conversion

The converter walks every `<textContent>` subtree and emits one
paragraph per `<p>` or `<li>`. `<b>`, `<i>` etc. bubble through;
`<br/>` becomes a soft line break inside the same paragraph. The GS1
standard business document header and other metadata are ignored — the
output reads like a patient information leaflet, not an XML dump.

The full behaviour is locked down by a fixture-based Vitest spec at
[`app/lib/xml-to-text/convert.test.ts`](app/lib/xml-to-text/convert.test.ts)
plus [`__fixtures__/sample.xml`](app/lib/xml-to-text/__fixtures__/sample.xml)
+ [`expected.txt`](app/lib/xml-to-text/__fixtures__/expected.txt).

## Project layout

```
app/
  assets/icons/    # per-icon SVGs imported via `?react` (svgr)
  components/      # Topbar, Lede, Dropzone, DragOverlay, Result, Toast, AppFooter
  hooks/           # useConverter, usePageDragDrop, usePasteXml, useToast, useTheme
  lib/
    xml-to-text/   # convert.ts + tests + fixtures
    format.ts      # size / number formatters, regex escape
  locales/de.yml   # all UI strings
  routes/          # home.tsx (with server action), not-found.tsx
  styles/          # main.scss (design tokens), tailwind.css
  i18n.ts          # i18next bootstrap
  root.tsx
  routes.ts        # manifest
public/            # served from /, includes Weleda logo + robots.txt
```

## Built with

* [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/)
* [Vite 8](https://vitejs.dev/) + [Vitest 4](https://vitest.dev/)
* [Tailwind CSS v4](https://tailwindcss.com/) + [Sass](https://sass-lang.com/)
* [react-i18next](https://react.i18next.com/) (DE)
* [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser)
* Node 24, Nix-built distroless OCI image (no Dockerfile)

## Contributing

Please read [CONTRIBUTING.md][contributing] for details on our code of conduct and the process for submitting pull requests.

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

## Versioning

We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository][gh-tags].

## Authors

### Special thanks for all the people who had helped this project so far

- **Manuele** - [D3strukt0r](https://github.com/D3strukt0r)

See also the full list of [contributors][gh-contributors] who participated in this project.

### I would like to join this list. How can I help the project?

We're currently looking for contributions for the following:

- [ ] Bug fixes
- [ ] Translations
- [ ] etc...

For more information, please refer to our [CONTRIBUTING.md][contributing] guide.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

This project currently uses no third-party libraries or copied code.

[docker]: https://hub.docker.com/r/d3strukt0r/weleda-webcenter-text-export
[gh-action]: https://github.com/Team-MaRo/weleda-webcenter-text-export/actions
[gh-tags]: https://github.com/Team-MaRo/weleda-webcenter-text-export/tags
[gh-contributors]: https://github.com/Team-MaRo/weleda-webcenter-text-export/contributors
[contributing]: https://github.com/Team-MaRo/.github/blob/master/CONTRIBUTING.md
[code-of-conduct]: https://github.com/Team-MaRo/.github/blob/master/CODE_OF_CONDUCT.md
