# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PWA for field technical inspection of broadcast-retransmission sites ("postos"). Technicians scan a
QR code to open a posto, then record either a *chamado* (incident + resolution) or a *preventiva*
(item-by-item checklist wizard with photos and GPS). The preventiva is **per-posto**: 10 standard
items for most postos, but posto `P001` (Ribeirão Preto) has its own 20-item, rack-grouped checklist
with per-item option sets — see `getChecklistForPosto` in [js/data.js](js/data.js). Vanilla HTML + CSS + ES6 modules — **no framework, no
bundler, no TypeScript, no transpile step**. The same source is wrapped as an Android APK via
Capacitor. Domain language, identifiers, UI strings, and comments are all pt-BR — match that.

## Commands

```powershell
npm install
npm run serve            # http-server on http://localhost:4173 — serves the repo ROOT directly, no build needed
npm run build:web        # copies app files into www/ and writes www/app-version.json (needed before Capacitor/Pages)

npm run firebase:deploy:rules      # publish firestore.rules
npm run firebase:seed              # write postosBase/tecnicosBase from js/data.js into Firestore
npm run firebase:create-users      # create Firebase Auth accounts (tools/create-auth-users.mjs)
npm run firebase:set-default-password
npm run qrcode:generate            # regenerate qrcodes/ from postosBase

npm run cap:add:android  # build:web + cap add android
npm run cap:sync         # build:web + cap sync + patch:android + patch:android-version
npm run cap:open         # open Android Studio
```

There are **no tests and no linter** configured. Verify changes manually via `npm run serve`.

## Two runtime modes (the most important thing to understand)

Every data operation in [js/firebase-service.js](js/firebase-service.js) branches on
`firebaseIsConfigured` from [firebase-config.js](firebase-config.js) (true when apiKey/appId etc. are
filled in):

- **Firebase mode** (config filled — the production state): Firebase Auth for login, Firestore for
  postos/tecnicos/visitas. The Firebase Web SDK is imported **dynamically from the gstatic CDN**
  (`firebasejs/10.12.5/...`) inside `ensureFirebase()`, *not* from npm. The npm `firebase` dependency
  is only for the Node scripts in `tools/`.
- **Local mode** (config empty): users/passwords live in `localStorage`, everything else in
  IndexedDB. Default password is `123456`. **To exercise local mode, temporarily blank out
  firebase-config.js** — otherwise `npm run serve` hits real Firebase.

Most functions try Firebase and silently fall back to the static seed data or local history on error,
so the field flow keeps working offline.

## Offline-first sync

[js/local-db.js](js/local-db.js) wraps IndexedDB (`inspecao-postos` DB) with two stores:
`pendingVisitas` and `historicoLocal`, both keyed by a client-generated `localId`.

`saveVisita()` writes to Firestore when online, otherwise queues to `pendingVisitas` and marks the
visit `pendente`. A `window "online"` listener calls `syncPendingVisits()`, which flushes the queue.
`listVisitas()` merges Firestore/local results with pending ones by `localId`. **Photos are never
uploaded** — they stay as base64 dataURLs in local history; Firestore receives only photo metadata
(`fotosLocalOnly: true`). `storage.rules` exists but is unused in this version.

## Page architecture

Each `*.html` page pairs with exactly one ES module in `js/` (e.g. `checklist.html` →
[js/checklist.js](js/checklist.js)), loaded via `<script type="module">`. Every page module follows
the same top-level pattern:

```js
const { profile } = await requireAuth();   // redirects to login.html if not signed in; {supervisor:true} gates supervisor pages
bindShell(profile);                          // fills user chip, wires logout/footer, kicks off syncPendingVisits()
// ...page-specific logic
```

Shared layers:
- [js/ui.js](js/ui.js) — DOM helpers (`$`/`$$`), `showToast`, `requireAuth`, `bindShell`,
  `fileToDataUrl` (client-side image downscale), `renderVisitCard`, and `escapeHtml`. **Always
  `escapeHtml()` user/data values when building innerHTML** — that's the established convention.
- [js/firebase-service.js](js/firebase-service.js) — all auth + data access.
- [js/data.js](js/data.js) — static seed data (34 postos `P001`–`P034`, 12 técnicos with
  `slug@postos.local` emails, checklist definitions) **and** the access-control predicates.
  `getChecklistForPosto(codigo)` returns the per-posto checklist: the rack-grouped
  `checklistRibeiraoPreto` for `P001`, otherwise the standard `checklistBase` (10 items). Each item
  carries its own `opcoes` (answer set + tone); [js/checklist.js](js/checklist.js) renders the wizard
  dynamically from that (variable buttons per item, e.g. OK/Não Conforme/N/A or No ar/Standby).

The flow: `login → index → scanner → posto → chamado|checklist → (posto) `; `historico`, `senha`,
`configuracoes` (supervisor), and `dashboard` are reached separately.

## Access control (duplicated — keep both sides in sync)

Three levels: `supervisor`, `nivel1` (only posto `P001` Ribeirão Preto), `nivel2` (all postos). The
same rules are enforced in **two places that must agree**:

- Client: `canAccessPosto` / `resolveTecnicoNivel` / `withAccessProfile` in [js/data.js](js/data.js).
- Server: [firestore.rules](firestore.rules).

The nivel1 technician emails and the `supervisor@postos.local` email are **hardcoded in both**
`data.js` (`TECNICOS_NIVEL_1`) and `firestore.rules`. Change one, change the other. Firestore
collections: `postos`, `tecnicos` (doc ideally keyed by Auth UID), `visitas`.

## Deployment & auto-update

The web app is hosted on **GitHub Pages**, not Firebase Hosting — despite the `hosting` block in
`firebase.json`, the actual CI deploy is [.github/workflows/pages.yml](.github/workflows/pages.yml)
(`build:web` → upload `www/`). Firebase project `cheklist-ecb1a` provides **only Auth + Firestore**.

- The Android APK is a thin Capacitor shell: `capacitor.config.json` sets `server.url` to the
  published Pages login URL, so the installed app loads the remote web build at runtime.
- [js/register-sw.js](js/register-sw.js) polls `app-version.json` every 2 minutes; when the version
  string changes it clears caches and reloads. **Result: pushing to `main` updates installed apps
  without reinstalling the APK.** A new APK is only needed for native changes (permissions, package,
  Capacitor plugins).
- [.github/workflows/android-apk.yml](.github/workflows/android-apk.yml) builds a debug APK on every
  push to `main` and publishes it to the `apk-latest` GitHub Release.

## Gotchas

- **Edit source in the repo root.** `www/` is generated by `build:web` and git-ignored — never edit
  it directly. The `uploads/` directory is stray untracked duplicates; ignore it. `android/` is
  generated by Capacitor and git-ignored.
- **Service worker cache is manual.** [service-worker.js](service-worker.js) lists every cached asset
  in `APP_SHELL` and is versioned by `CACHE_NAME` (currently `inspecao-postos-v19`). When you add a
  new HTML/JS/CSS file, add it to `APP_SHELL`; bumping `CACHE_NAME` forces old caches to clear.
- New app files also need to be added to the copy list in [tools/build-web.mjs](tools/build-web.mjs)
  or they won't reach `www/` (and thus GitHub Pages / the APK).
