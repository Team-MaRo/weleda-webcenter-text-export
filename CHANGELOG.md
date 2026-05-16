# Changelog

## [3.0.1](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/3.0.0...3.0.1) (2026-05-16)


### 🐛 Bug Fixes

* **deps:** Force transitive js-yaml ≥4.1.1 & gate CI on lockfile audit ([cbf4d6f](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/cbf4d6f941b171ec0dfb21c98d071b7ae7e60b95))

## [3.0.0](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.1.2...3.0.0) (2026-05-16)


### ⚠ BREAKING CHANGES

* Rewrite as React Router v7 app, redesigned UI & Nix-built OCI image

### ✨ Features

* Rewrite as React Router v7 app, redesigned UI & Nix-built OCI image ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* New single-page UI with full-window drag-and-drop, file picker, paste from clipboard (file or raw XML), live search-as-you-type, dual-format copy that preserves bold/italic for Word/Outlook, .txt download, and a light/dark theme persisted in localStorage with no FOUC ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* XML-to-text conversion via fast-xml-parser scoped to <textContent> subtrees — paragraph-aware, preserves bold/italic/underline as formatting flags, document-ordered, locked down by a fixture-based Vitest spec ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* All user-facing strings flow through i18next loaded from app/locales/de.yml; per-icon SVGs imported via svgr with brand-grey fills rewritten to currentColor so the same source renders fixed-grey as a favicon and re-themes when used inline ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* No-JavaScript fallback in SSR mode: the dropzone wraps a real form post with a server action returning the same shape the client store uses, hydration seeds useConverter from useActionData so the SSR-rendered result lands without a re-fetch, and pure-CSS :has() feedback un-dims the submit button and reveals the selected-file hint after picking ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Dual-mode build: the same source tree compiles to SSR (Docker) or a static SPA (GitHub Pages) via SSR=process.env.SSR in react-router.config.ts; a small stripSpaServerExports Vite plugin lifts the server action out of the SPA bundle since React Router rejects action exports there ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Static artifacts for GitHub Pages: sitemap.xml, robots.txt with sitemap directive, and a 404.html SPA fallback; public/CNAME is the single source of truth for the deployed hostname (vite reads it at config-eval time so sitemap and robots stay in lockstep with the Pages binding) ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Production image rebuilt with Nix (no Dockerfile) into a distroless OCI tarball via dockerTools.streamLayeredImage with clean layer history — runs as nonroot:65532, react-router-serve on port 3000, HEALTHCHECK via a stripped curlSlim, no nodejs in the runtime closure, reproducible config digest tied to lastModifiedDate ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* CI/release pipeline rewritten: ci.yml runs lint + typecheck + build + tests + Trivy + Grype scan of the OCI image with a .grype.yaml allowlist carrying per-CVE rationale; docker.yml builds multi-arch amd64 + arm64 + opt-in riscv64 Nix images with cosign and SLSA attestation per arch and per manifest-list tag; bump-pnpm-hash.yml self-heals the FOD pnpmDeps.hash after lockfile changes; release.yml runs release-please for version-bump PRs ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Dev environments unified: compose.yml runs nix develop → pnpm dev in a nixos/nix container so the same file works on host docker, in the devcontainer, and in the Vagrant VM; the Vagrant variant brings up Traefik on :443 with mkcert at weleda-webcenter-text-export.test; devcontainer adds Node 24, docker-outside-of-docker, act, and the GH CLI ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Stack moves to Node 24 + pnpm (pinned via Corepack) + Tailwind v4 + Sass + Vitest; ESLint via @iwf-web/eslint-coding-standard flat config; README rewritten around the Docker-first deploy story; AGENTS.md added for AI-coding-agent context ([3c4a97c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/3c4a97c032a89a9cca97507eef14155ddb42e081))
* Vagrant SSH provisioning, Centralize boilerplate files & Update dependencies ([fa0c306](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/fa0c30691f3b51c92e5319e95244d20d83dd02e4))

## [2.1.2](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.1.1...2.1.2) (2024-07-17)


### ✨ Features

* Bump the pwa-dependencies group with 9 updates ([d0727d2](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/d0727d27f3a2b2ac1edd76b131148acb10a58e6b))


### 🐛 Bug Fixes

* Fix Dependabot groups ([d0727d2](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/d0727d27f3a2b2ac1edd76b131148acb10a58e6b))

## [2.1.1](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.1.0...2.1.1) (2024-07-16)


### ✨ Features

* Move Dependabot to a weekly schedule and drop the reviewer requirement for non-major bumps ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))
* Add Docker Compose profiles, including a prod profile ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))
* Add a note about a possible NFS issue in Vagrant ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))
* Remove the redundant init in the container ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))
* Multiple PWA dependency group bumps (vite, typescript, react-router-dom, @testing-library/dom, eslint-plugin-jsx-a11y, eslint-plugin-react, ...) ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))


### 🐛 Bug Fixes

* Fix a wrong path in CI ([073572b](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/073572b4b04d49e33403811e2a6da3e1eaacc23f))

## [2.1.0](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.0.4...2.1.0) (2024-06-17)


### ✨ Features

* Switch to the official node and nginx images to run unprivileged containers (drops the custom supervisord and entrypoint scripts) ([7cc1ad6](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/7cc1ad6803a9d710bc835ff153107a8140a655a8))
* Bump docker/build-push-action 5 -> 6 ([7cc1ad6](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/7cc1ad6803a9d710bc835ff153107a8140a655a8))

## [2.0.4](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.0.3...2.0.4) (2024-06-17)


### ✨ Features

* Group all minor and patch Dependabot updates into a single PR ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Schedule Dependabot during working hours ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Validate dependabot config on changes ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Pull container images on Vagrant stack startup ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Always forward dev requests to HTTPS ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Add peer dependencies ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Remove CODEOWNERS to allow Dependabot auto-merge ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Bump @testing-library/react 15 -> 16 ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Bump i18next-browser-languagedetector 7 -> 8 ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))
* Update the PWA dependency group ([29ef9b3](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/29ef9b3d9f44471a8d55ada458fd755d4d7c3fa9))

## [2.0.3](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.0.2...2.0.3) (2024-05-03)


### ✨ Features

* Reformat the useDarkMode hook ([40d855a](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/40d855ad71577a8bda4d3c9d26400699e3281bd3))

## [2.0.2](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.0.1...2.0.2) (2024-05-03)


### ✨ Features

* Target Dependabot at the develop branch ([8f37c2e](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/8f37c2e821a41df1535904684fed8723ac1ee871))
* Update dependencies ([8f37c2e](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/8f37c2e821a41df1535904684fed8723ac1ee871))

## [2.0.1](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/2.0.0...2.0.1) (2024-05-03)


### ✨ Features

* Add Dependabot configuration ([a049378](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0493789b2f4ea932a279ad05aad5309c9d5d613))
* Add an auto-merge workflow for Dependabot PRs ([a049378](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0493789b2f4ea932a279ad05aad5309c9d5d613))
* Update the Docker Hub description workflow ([a049378](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0493789b2f4ea932a279ad05aad5309c9d5d613))


### 🐛 Bug Fixes

* Fix the labeler workflow ([a049378](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0493789b2f4ea932a279ad05aad5309c9d5d613))

## [2.0.0](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/1.0.0...2.0.0) (2024-05-03)


### ✨ Features

* Major rewrite and restructuring ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Move the application into the /pwa subdirectory ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Replace Material UI with Tailwind CSS ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Replace Create React App with Vite + Vitest ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Replace the bundled nginx with a custom Docker image based on supervisord ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Rebuild the CI pipeline using GitHub Actions ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Add a Vagrant VM with Docker Compose for local development ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Add HTTPS support in the dev environment ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Add auto-linter (ESLint + Prettier) and source-map-explorer ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))
* Refresh community documentation and dependencies ([a0508ee](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/a0508ee950248f1eca4825ff22d84d05382aed2f))

## [1.0.0](https://github.com/D3strukt0r/weleda-webcenter-text-export/compare/0.1.0...1.0.0) (2020-10-07)


### ✨ Features

* Initial release ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* React + TypeScript application scaffolded with Create React App ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* Material UI with a custom theme ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* Service worker for PWA support ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* Yarn 2 (Berry) with Plug'n'Play ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* Docker image based on nginx ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
* GitHub workflows: CI/CD, Docker Hub description, labeler, stale, greetings ([87c855c](https://github.com/D3strukt0r/weleda-webcenter-text-export/commit/87c855c8e8592e646168b2bf3196f59dae931b58))
