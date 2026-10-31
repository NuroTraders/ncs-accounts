# NCS Daily Accounts: Engineering Handover

| | |
|---|---|
| **Shop** | Nur Computer & Stationery |
| **Current version** | **v11.3.0** (`versionCode 110300`) |
| **Service worker cache** | `ncs-v69` |
| **Last entry** | 2026-10-30 20:00 (UTC+6) |
| **Contributors** | Claude profiles, Antigravity, Manus |

Two Claude profiles work on this app and **do not share memory**. This file is their shared memory.
Section numbers are referenced by the rules below. Do not renumber them.

**Contents:** Priority Actions · 0 Session Protocol · 1 Files · 2 Architecture · 3 Data Model · 4 Rules · 5 Known Quirks · 6 Roadmap · 7 Session Log · 8 Bug Fix History · 9 Native Apps

---

## Priority Actions (Beta Test Gate)

Verify these before starting or continuing the Beta Test.

| # | Check | Requirement | Status |
|---|---|---|---|
| 1 | **Auto-sync on save** | Every `save()` must trigger `schedulePush()`. Syncing only on manual refresh fails the beta. Since v10.1.2, `save()` in `src/js/01-core.js` calls `window.NcsSync.schedulePush()` directly. | Verify |
| 2 | **`config.js` cleanup** | One object only, containing `SYNC_MODE`, `API_URL`, `API_TOKEN`, `BETA`. Remove any duplicate `window.NCS_CONFIG` block holding an encrypted `"enc"` object. | Verify |
| 3 | **Roadmap versioning** | Future features use `v10.x`, not `v9.x`. | Done |

---

## 0. Session Protocol

### 0.1 Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js` and this `HANDOVER.md`. Never work from an older copy.
2. Read Sections 2 and 4 before changing anything.
3. One feature per version. Do not refactor unrelated code.

### 0.2 Version Release Contract (modular source)
- The single source of truth for the version is `APP_VERSION` in `src/js/10-sound-clock.js`.
- Add a `VERS.unshift` entry in ascending order (Rule 36).
- Add a `UPC.unshift` entry, moving the state `Planned` to `Done`.
- Bump the service worker cache in `sw.js`: `ncs-vN` to `ncs-v(N+1)`.
- Bump `package.json` and `.native-version.json`.
- Compile with `npm run build` or `npm run prepare-www` and verify with the AST syntax validator.
- Add a Section 7 entry.
- Deliver complete runnable files, never patches.

### 0.3 Bug Fix Contract
Every fix follows the strict six-field schema:

```js
{ d: 'YYYY-MM-DD HH:MM (UTC+6)', v: 'VERSION', w: 'AUTHOR', a: 'SYMPTOM', b: 'CAUSE', c: 'FIX' }
```

Prepend it to **Section 8** of this document **and** to the in-app `BUGS` array.

### 0.4 Bug Reporting and Support Dispatch
- The in-app Bug Reporter (More tab) sends a structured summary to the developer WhatsApp `+8801765420566`: device, role, timestamp and `getLastError()`.
- `diag.js` keeps a rolling 200-event buffer in `localStorage` key `ncs_diag_v1`.

### 0.5 Main Push and Commit Contract (permanent)
At the completion of any task, feature or fix, always end the handover with these exact GitHub Desktop steps:

```
🚀 What to do next:
Open GitHub Desktop.
You will see the [count] changed files listed on the left panel.
Enter your commit summary (e.g. feat: <concise summary of changes>).
Click "Commit to main" and then "Push origin".
```

---

## 1. Files

| File | Purpose |
|---|---|
| `index.html` | The whole app, compiled from `src/` |
| `sw.js` | Offline cache, network-first. Cache name `ncs-vN` |
| `manifest.webmanifest` | PWA install information |
| `config.js` | Sync config: `SYNC_MODE: 'v2'`, `API_URL`, `API_TOKEN`, `BETA: true` |
| `diag.js` | Diagnostics engine: rolling 200-event buffer (`ncs_diag_v1`) and bug report exporter |
| `sync.js` | Sync engine. Whole-state sync (`stateOut()` / `mergeState()`) since v10.2.0 |
| `SolaimanLipi-*.ttf` | Bengali font |
| `icon-*.png`, `logo-*.png` | Icons and logos |
| Google Apps Script | `Code.gs` Web App inside the owner's Google Sheet. Stores full state in the `State` sheet (40,000-character chunks), readable rows in `Entries`, and daily `Backup <date>` snapshots |
| `src/` | Modular source: `template.html`, `styles/main.css`, `markup/app.html`, and 11 modules `js/01-core.js` to `js/11-bootstrap.js` |
| `scripts/build.js` | Zero-dependency compiler with built-in AST validator (`vm.Script`) and watch mode |
| `package.json`, `package-lock.json`, `electron/`, `native/`, `scripts/`, `electron-builder.config.js`, `build/`, `.github/workflows/build.yml`, `SETUP.md` | Native Android and Windows apps (Section 9). Do not edit unless the task concerns the native apps |

---

## 2. Architecture

### 2.1 State and storage
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **IndexedDB (v10.0):** `NcsDB` adapter (`ncs_idb_v1`) saves asynchronously in the background, removing the 5 MB limit while keeping instant synchronous boots from `localStorage`.
- **Collections:** `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts`. Stamped with `u`, merged by `mergeById`.
- **Other synced keys (v9.24):** `days`, `names`, `parties`, `log`, `users`, `start`, `walletDates`, `counts`. `pending` and `history` merge by id.
- **Local-only keys (v9.22):** `theme`, `dayStart`, `dayEnd`, `lang`, `lockout`, `sync`, `snaps`, `logSent`, `synced`, `posSince`, `motion`, `sound`, `lastBackup`.
- **Storage warning (v9.27):** a 4 MB advisory appears on save failure or when the threshold is exceeded. Dismiss hides it (`style.display='none'`); `window._storageWarnDismissed` is in memory only.
- **Encrypted backups (v10.0):** password-protected AES-GCM-256 export (PBKDF2) in Accounts settings, with decryption on restore behind a confirmation safeguard.

### 2.2 Sync
- **Current engine (v10.2.0):** whole-state sync. `stateOut()` and `mergeState()` move 100% of state as one atomic payload (`entries`, `bills`, `products`, `moves`, `cust`, `ltx`, `atts`, `wManual`, `start`, `days`, `users`, `walletDates`, `counts`, `names`, `parties`, `pending`, `history`, `epoch`, `rebootN`, `drawerBase`). Fields critical to balances (`ld`, `act`, `cat`, `pay`, `w`, `cu`, `adj`, `void`, `vr`, `vb`) travel verbatim in JSON.
- **Backend:** `Code.gs` round trip is about 200 ms.
- **Timing:** active-tab poll is 15 s and sleeps on a hidden tab (v10.2.0). Push debounce is 400 ms with an automatic pull 200 ms after a successful push (v10.1.5). A `visibilitychange` listener pulls when the app regains focus.
- **Echo-storm guard:** `primeLH()` runs after every remote merge (`applyRemote`, `mergeRemoteFrom`). `window.S` is re-bound after each remote update.
- **Auto-sync hook:** `save()` calls `NcsSync.schedulePush()` (Rule 37).
- **Conflict resolution:** last-write-wins by the higher `u`. `nextU()` strictly exceeds all local and server-acknowledged timestamps. Dates normalise to UTC+6 via `toBdDate` and `toBdTime`.
- **Hourly fallback backup** is saved to `_Blob`.
- **Status pill:** single dot with label. Green `Synced`, yellow `Pending`, red `Offline` / `Conflict`, outline `Off`. `sync.js` drives it on push, pull and network failure. Clicking the pill or header refresh forces an immediate sync.
- *Superseded:* the v10.0 to v10.1.x "Model B" delta engine with 12 structured mirror sheets was replaced in v10.2.0 (see Sections 7 and 8).

### 2.3 Diagnostics and bug reporting
- `diag.js` captures uncaught errors, unhandled rejections and network events in the rolling `ncs_diag_v1` buffer.
- **Legacy reporter (More tab):** WhatsApp dispatch and full diagnostic clipboard copy, with a log download fallback.
- **Tab bug reports v12 (v11.1.0):** a floating `#tabBugFab` button on every tab, hidden on the lock screen. It auto-detects the active tab and captures role, staff name, date, time and version. Two fields: *Bugs / Errors* and *Requirements / Solution*. Each report becomes a Markdown file stored in `S.bugReportsV12`. Admins inspect, filter, resolve, copy, delete and bulk-export (`NCS_All_Bug_Reports_v12.md`) from the More tab.

### 2.4 Interface and interaction
- **Theme (v9.20):** three modes, `auto` (OS), `light`, `dark`. `#themeBtn` cycles Auto, Light, Dark. Day/Night is removed. Light and dark use design tokens (v10.4.0): slate `#F8FAFC` / obsidian `#0B0F19` surfaces, emerald brand, forest cash-in, crimson cash-out, amber warnings, and a five-colour chart palette (`--ch1` to `--ch5`).
- **Header (v11.2 to v11.3):** three-column grid. Left, shop mark and role pill. Centre, Bismillah, live clock, weekday, Gregorian and Bengali date, plus Dhaka weather. Right, a 44 px prayer icon (hover preview, click opens the schedule dialog), theme, refresh and the sync pill (`#topSync`). Transparent theme-aware surface with a subtle divider.
- **Navigation (v10.4.2 to v10.4.4):** five tabs, `Overview`, `Ledger`, `Counter`, `Accounts`, `More`, with bilingual labels. Desktop (≥900 px) uses a vertically centred floating dock that expands on hover from 54 px to 190 px. Products and Stock live inside Counter; Management is merged into More.
- **Transitions and motion (v9.20 to v9.22):** `.view.on` fades in (220 ms). `animateCounts()` counts `.cnt` elements from 0 to `data-to` over 400 ms. `saveCheck()` shows a green SVG tick. `button:active` scales to 0.97. POS cart rows use `.slidein` / `.slideout`. Everything is a no-op under `data-rm` (reduced motion, taken from the OS; no manual toggle).
- **Refresh:** the two-arrow SVG spins once on tap.
- **Modals and touch (v9.25):** `.dlg` capped at 88vh with sticky `.oa` actions. `.lnk` min-height 34 px, POS cart `.x` 40 px. POS is two-column on desktop with a sticky cart and search-first on mobile. Ledger header uses a `⋯ More` dropdown.
- **Counter presets (v10.3.0):** `DEFAULT_PRESETS` / `getPresets()` give 1-tap service chips in POS (`.svc-presets`) and Accounts (`#accPresets`). Admin customises them in More. Stored in `S.presets`.
- **Accounts layout (v9.29):** the Transaction Details table, Search and Filter bar and check bars sit directly below the New Transaction section (`#fsec`).
- **Section and card settings (v9.29):** admin-only More button for quick balance shortcuts and per-section visibility toggles for Home and Accounts (`S.cardSettings`, protected in `LOCAL`).
- **More tab (v10.4.2 and later):** Wallets and MFS quick view, Staff and Roles, Reports Hub, Counter presets, Section and card settings, Sound toggle, Theme switcher, Bug reporters, Version History, Change Log, Self-Test and Force Logout.
- **Download safety (v9.22):** `dlFile` appends the `<a>` to the DOM before clicking and falls back to a `window.open` data URL.
- **System audit (v9.27):** cryptographic `uid()`. `r2()` rounding in `calc()`, `prevFor()`, `lBal()`, `ledRows()`, `wltRun()`. `autocomplete="off"` on PIN fields. `touch-action: manipulation` on buttons. Dynamic theme-button `aria-label`.

### 2.5 Wallets and cash
- **Wallet balances (v9.29):** wallet cards are a pure manual balance sheet. `S.wManual` stores each balance directly, `calcWallets()` reads it, and `adjustSingleWallet` writes only to `S.wManual[key]`. A Reset to Zero button is included.
- **Admin Prime adjustments (v9.29):** `doSaveWalletOpening` never aborts. The adjustment anchors the actual balance everywhere. Resulting deficits are caught by `checkWalletCollisions()`, queued in `S.pending` as `wallet-collision` items, and flagged with a "Deficit Review" badge.
- **Date-anchored openings (v9.20):** `S.walletDates` holds `{d, by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev, discrepancy}`. `S.wallets` is the base opening. A past-date opening requires the Admin PIN and logs a `walletAdjust` entry. Each date may hold only one anchor (v9.29).
- **Cash adjustment (v9.20, history v9.24):** past-date targets require the Admin PIN; adjustment entries carry `pinBy` and `pinAt`. Present-day adjustments roll to `nextOpenDay` without a PIN. `S.counts` keeps permanent history (note denominations, book total, difference, reason) via `cashCountHistory()`.

### 2.6 POS and ledger
- **POS void (v9.20):** a reason matching `/^test$/i` marks the bill and entry `test:1`. These appear in an admin-only "Test" section and are excluded from every total. Admin can "Remove permanently" a voided bill (`b.removed=1`, `e.removed=1`); removed bills are hidden everywhere.
- **Borrower/Lender transactions (v9.20):** identical to Customer. Any In/Out with any method (Cash, MFS, Recharge); no special direction.
- **Sub-accounts (v10.1.0):** optional `parentId` on parties. `lSubAccounts(cId)` and `lCombinedBal(cId)` give combined group balance. The party form has a cycle-safe Parent Account selector, and parent profiles list sub-accounts with a Group Statement toggle (`window._incSubsStatement`).
- **Thermal printing (v10.0):** Web Serial / Web Bluetooth ESC/POS streaming with auto paper cut and drawer kick (`ESC p 0 25 250`), falling back to standard print.
- **Due reminders (v9.23):** `dueNoticeText()` writes a polite Bengali reminder. `lLinks()` swaps SMS/WhatsApp links for "বকেয়া SMS" / "বকেয়া WhatsApp" when the balance is negative.

### 2.7 Sound
- `var Sound` (Web Audio): `tick` (tab/dialog), `chaChing` (sale/entry save), `buzz` (errors), `chime` (background sync), `test` (Settings button).
- `enabled()` requires `S.sound` and no `data-rm`. The AudioContext is created or resumed on the first `pointerdown`, `keydown` or `touchstart`. `play()` waits for `ctx.resume()` before scheduling tones (v9.22.1).
- Default **off**. Toggle in Settings (admin-only) and via `#sndBtn` in More ("Sound effects: ON/OFF"), which plays the test chime when turned on.

### 2.8 Sync restore (v9.28)
GET protocol restored for `getRemote()`, `importPos()` and `importCatalog()`. `badKey()` no longer wipes `S.sync` prematurely.

---

## 3. Data Model

| Structure | Shape |
|---|---|
| `cust` | `{id, name, phone, fb?, img?, note, kind?, addr?, rel?, due?, dueNote?, del?, delReason?, dby?, dts?}`. `kind` is Customer, Investor, Supplier or Borrower/Lender (legacy `Lender` / `Borrower` map to Borrower/Lender at read time). `due` / `dueNote` show as a party reminder |
| `ltx` | `{id, c, dir, btype?, amt, parts?, d, d2, t, m, who, note, by, eb?, void?, vr, vb, fix?, dupDismissed?, flag?, prop?, voidReq?, l9?, lnk?, le?, ok?, okb?, src?}` |
| `ltx.flag` | `{state: pending\|cleared\|rejected, by, at, reason, cb?, ca?, rb?, ra?, rr?}` |
| `ltx.prop` | `{state: pending\|approved\|rejected, by, at, reason, to, rb?, ra?, rr?}` |
| `ltx.voidReq` | `{state: pending\|approved\|rejected, by, at, reason, rb?, ra?, rr?, vb2?}` |
| `atts` | `{id, ref, d, by, at, del?, db?, dt?}`. `ref` is `'e'+entryId` or `'l'+ltxId` |
| `walletDates` | `[{d: 'YYYY-MM-DD', by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev: {...}, discrepancy: {...}, pinBy?, pinAt?}]`. The most recent entry on or before a date is the active opening |
| `counts` | `[{id, d, t, at, by, total, book, diff, reason, den: {1000: N, 500: N, ...}, pinBy?}]` |
| `entries` | Daily accounts, read by `cash()` and `calc()` |
| POS bill flags | `b.test = 1` (reason `test`); `b.removed = 1` (admin permanent removal); the matching entry is flagged too |
| Party balance | Sum of `in` minus `out` over non-void entries |
| Stock override | `adminCheck`, `adminChecked`, `adminRejected`, `target` |

---

## 4. Rules (do not break)

### Release and delivery
1. **Every release** follows Section 0.2: bump `APP_VERSION`, add `VERS` (ascending) and `UPC`, bump `sw.js`, `package.json` and `.native-version.json`, add a Section 7 entry, run `npm run prepare-www`. **Deliver complete files, not patches.**
10. Run `node --check` before handback.
14. **Parallel merge** is three-way. Expect conflicts in `APP_VERSION`, `VERS`, `UPC` and the `sw.js` cache.
25. Record who built it (`by` / `w`).
28. `VERS.by` backfill is done for v9.0 to v9.4 (v9.17).
36. **`VERS` order is ascending (v9.28.1).** Do not prepend in descending order. `VERS.unshift` from oldest to newest in the same IIFE leaves the latest at `VERS[0]`.
39. **Two-Tree Synchronization and Compilation Contract (v10.4.0).** Develop only in `NCS WORK - STATION/ncs-accounts-main/src/`. Compile and verify every change with `npm run prepare-www`. Then mirror all modified files (`src/`, `index.html`, `www/`, `HANDOVER.md`, `package.json`, `.native-version.json`, `sw.js`) to the local clone `C:\Users\User\OneDrive\Documents\GitHub\ncs-accounts`. Never edit a single file in the GitHub clone in isolation. Bundles, documentation and source move together as one atomic commit.

### Data integrity
2. Synced data goes into `COLS`. Always `save()`.
3. **Never hard-delete money records.** Use `void` with a reason, `removed` for POS permanent removal, `del` for parties.
4. Ledger and cash connect only through `ledReconcile()`.
8. Dates are ISO and shown with `sd()`.
17. `n()` is a formatter, not a parser.
18. Wallet category names are stored values.
19. Wallet limit checks live in `checkWalletLimit`.
22. Ledger-linked entries are read-only in Accounts.
23. Purchases are never saved as Due.
30. **Wallet openings are date-anchored (v9.20).** A past-date opening needs the Admin PIN. Never write directly to `S.wallets` when a dated entry is the right tool. Show the discrepancy in the Management opening-history list.
31. **POS void reasons matching `/^test$/i` go to the Test section (v9.20).** Test bills are excluded from all totals. `removed` is admin-only, needs a reason, and can never be undone from the UI.

### Access and security
5. **Permissions:** ledger is for admin, accountant and cashier. Cashier adds and flags. Accountant proposes (edit or void). Admin approves or rejects. Management is admin. Party edit and archive are admin. **Keeper sees Products and More only (v9.20).**
6. Escape all user text with `esc()`.
9. Secrets never go in files.

### Code and interface
7. CSS clash awareness: `.lt` belongs to POS.
11. Search for existing classes before adding.
12. Dark mode uses tokens only. Never hard-code colours. (v10.4.0 introduced the emerald brand tokens.)
13. **Scope trap:** POS-private `dlg`, `toast` and `stockMap` are not global. `POS.stockMap()` is exposed on the POS return object.
15. Capitalise labels: "Bkash", not "bKash".
16. The shop name comes from `shopN()`.
20. Startup order: `applyLang();start();` at the bottom.
21. No module-level `var` in `save()` / `render()` paths.
24. Sync dot colours are fixed.
26. Measure before optimising.
27. Long lists use paging.
29. Theme has exactly three modes (v9.20).

### Sound and motion
32. **Sound is a local device preference (v9.22).** Stored in `S.sound`, listed in `LOCAL`, never synced. The engine is a no-op when `S.sound` is falsy or `document.documentElement.dataset.rm` is set. Do not call `Sound.*` outside guarded sites; wrap fire-and-forget calls in `try/catch`.
33. **Motion helpers respect `data-rm` (v9.22).** `animateCounts`, `saveCheck`, `slideInLast`, `removeLineAnimated` and the global `button:active` scale all turn off under reduced motion. Keep the `.cnt` / `data-to` convention for new count-ups.
34. **`play()` must await `ctx.resume()` (v9.22.1).** Never schedule tones before the AudioContext is `running`. This fix made sound audible on Android WebView and iOS Safari.
35. **Sound is off by default.** Do not change the default without owner approval. The "▶ Test sound" button is the fastest check.

### Sync and support
37. **Auto-Sync (v10.0.0-beta).** Every `save()` MUST trigger `schedulePush()`. Do not rely on manual refresh buttons.
38. **Bug Reporting and Support Dispatch (v10.1.1).** The More-tab Bug Report modal gives 1-tap WhatsApp dispatch to `+8801765420566` with pre-filled version, timestamp, role, activity, issue description and `getLastError()`. It also offers one-click clipboard copy of the full diagnostic payload and a log download fallback.

---

## 5. Known Quirks

### Accounts and data
- **Start fresh** carries balances forward and queues a reconciliation item.
- Bkash Personal moves `bk`; Bkash Agent moves `bka`.
- Due purchases are impossible for new entries (v9.3); old ones are flagged.
- Wallet-transfer categories are excluded from Sell/Buy totals (v9.6).
- Undo checks wallet balances (v9.6).
- Stock overrides are excluded while pending (v9.6).
- Change Log keeps 500 lines.
- Bills imported from an external POS inbox carry no wallet.
- Sample "Load Riyad notes" was removed (v9.18).
- **Wallet opening anchors (v9.20):** the first anchor may be a migration of `S.wallets`. Later anchors override the running balance at their date. Any discrepancy is logged with a snapshot of the computed value.
- **POS Test / Removed (v9.20):** test bills appear only in the POS Bills dialog filter "Test". Removed bills are hidden everywhere, even from Test.

### Roles and navigation
- Cashier flags, accountant proposes, admin approves (v9.10 to v9.16).
- Admin had 6 bottom tabs and Keeper 2 (v9.20). Navigation was restructured to 5 tabs in v10.4.2; verify role visibility against the current build.

### Sync and storage
- Sync key transport is still in GET URLs (accepted limitation; POST causes a loop).
- Restore (v9.11) is not a full remote rollback.
- Photos live in the synced blob (v9.14); Sheet size tolerance is unknown.
- Sync dot is a single dot with a periodic blink (v9.20).
- Storage quota: `persist()` shows the 4 MB warning; the dismissal resets on page reload (v9.27).

### Sound and motion
- **Sound default (v9.22):** off. The toggle lives in admin-only Settings, so non-admins cannot enable it from Settings (More has `#sndBtn`). The AudioContext is created lazily on the first tap.
- **iOS Safari (v9.22.1):** the AudioContext may need to be created synchronously inside a real gesture. If nothing plays after the resume fix, ask the user to tap "Test sound". If it still fails, the browser is blocking audio.
- **Reduced motion still silences sound (v9.22.1):** `Sound.enabled()` returns false when the OS has "reduce motion" on. The Test button bypasses this by design.
- **Count-up (v9.22):** uses `requestAnimationFrame` and re-runs every time Home is drawn, including period tab changes. The checkmark overlay is `pointer-events:none` and removes itself.
- **More tab (v9.22.2):** four buttons: বাংলা, Sound effects ON/OFF, Settings, Lock. Settings is no longer hidden.

---

## 6. Roadmap

### 6.1 Planned
Version numbers are assigned at release. The numbers v10.4 to v10.7 originally earmarked here were used by shipped work.

| Feature | Description |
|---|---|
| **Today's Estimated Gross Profit card** (Home) | Live profit from (Selling Price − Cost Price) for items sold today |
| **Low-Stock and Out-of-Stock alert chip** (Home) | 1-tap chip for items at or below the minimum threshold |
| **Thermal Due Payment Receipt** (ESC/POS) | 1-tap print slip for ledger due collections |
| **Security and Ledger Sheet** | Sync key rotation with encrypted config, plus a dedicated Ledger sheet in Google Sheets |

### 6.2 Still open
1. Sync key rotation (needs Apps Script).
2. Send only changed records (needs Apps Script; delta sync shipped in v10.0.0-beta and was replaced by whole-state sync in v10.2.0).
3. Effectiveness pass (owner to specify which taps per role).
4. Optional Ledger sheet in Google Sheets (Apps Script).

The five-colour chart palette (formerly Phase 1b) was delivered in v10.4.0.

### 6.3 Shipped

| Version | Delivered |
|---|---|
| **v11.3.0** | Refined header: weather in the centre cluster, 44 px prayer icon, framed shop mark |
| v11.2.0 | Executive 3-column header, prayer widget, unclipped shop icon |
| v11.1.0 | Contextual in-tab Bug and Requirement reporting (v12) |
| v10.4.4 | Vertically centred floating tab dock |
| v10.4.3 | Counter top-cart layout, collapsible icon rail, minimalist More tab |
| v10.4.2 | 5-tab architecture, unified Counter and More hubs |
| v10.4.1 | Dead settings and hidden-field cleanup |
| v10.4.0 | Enterprise design system (light and dark), five-colour chart palette, Rule 39 |
| v10.3.0 | Counter speed presets (1-tap service chips, admin customiser) |
| v10.2.0 | Whole-state sync restoration, balance integrity, 200 ms backend |
| v10.1.5 | Instant sync timing (400 ms debounce, post-push pull) |
| v10.1.4 | Sync schema v3 and cache busting |
| v10.1.3 | Multi-device realtime sync and UTC+6 normalisation |
| v10.1.2 | Mobile realtime sync, bidirectional schema, auto-push fix |
| v10.1.1 | 1-tap WhatsApp bug reporter and formalised rules contract |
| v10.1.0 | Sub-accounts, IndexedDB, AES-GCM-256 backups, ESC/POS printing, modular build engine |
| v10.0.0-beta | Delta sync engine, 12 structured sheets, diagnostics logger, bug exporter, live sync indicator |
| v9.29 | Admin Prime MFS and Recharge adjustments, Accounts repositioning, Section and card settings |
| v9.28.1 | Version history cleanup |
| v9.28 | Sync GET restore and reconnect fix |
| v9.27 | System audit hardening |
| v9.26 | Mobile Home Cash Balance bug fixed |
| v9.25 | Comprehensive UI and ergonomics overhaul |
| v9.24 | MFS and Recharge balance quick adjustment |
| v9.23 | WhatsApp and SMS due reminders in Ledger |
| v9.22.2 | Sound toggle visible in More, Settings unhidden |
| v9.22.1 | Sound resume race fixed, Test button, louder gains |
| v9.22 | Sound engine, count-up, save checkmark, tap feedback, POS cart animation, download fallback |
| v9.21 | Clock, phone top-bar tidy, Accounts Void data section with Admin restore |
| v9.20 | POS search, Test/Remove, refresh fix, keeper tabs, party kinds, date-anchored wallet openings, past-date PIN |
| v9.19 | Storage notice, single sync dot, three-mode theme, transitions, refresh |
| v9.18 | Home dashboard |
| v9.17 | Admin PIN change, self-test, `by` backfill |
| v9.16 | Review queue complete |
| v9.15 | Docs cleanup |
| v9.14 | Receipt photos |
| v9.13 | Reduced motion |
| v9.12 | Dashboard clock |
| v9.11 | Restore |
| v9.10 | Ledger search, flags, statement, due dates |
| v9.9 | Bill-first POS |
| v9.8 | Nav, refresh, visual |
| v9.7 | Discount percent and speed |
| v9.6 | Audit hardening |
| v9.5 | Party carry-forward |
| v9.3 | No due purchases |
| v9.0 | Ledger-cash link |
| v8.9 | Wallets |

### 6.4 Verification still missing
- Real multi-device sync against the production Apps Script (the current Beta test).
- Canvas image compression, camera, statement image, and Bengali text in a real browser.
- Apps Script / Sheet blob tolerance with `atts`.
- iOS Safari layout, animation and reduced motion.
- **v9.22 sound and motion on a real phone** (Android WebView and iOS Safari): AudioContext resume timing and the `button:active` scale on the bottom tab bar.

**Known limits (v8.7):** imo and Facebook links from a phone are unavailable. Some strings are English-only. Currency goes through `tk()`.

---

## 7. Session Log
*Newest first. Each entry is a version, a timestamp (UTC+6) and an author.*

### v11.3.0 · 2026-10-30 20:00 · Manus
**Refined Overview header redesign.**
- Moved Dhaka weather into the centred Bismillah, live clock, weekday, Gregorian and Bengali date group. Shop identity stays as the left anchor; theme, refresh and the sync pill stay on the right.
- Simplified the prayer UI to a 44 px icon-only button with a descriptive accessible label, keyboard-focus and desktop-hover preview, and the existing click-to-open schedule modal.
- Replaced the solid desktop header surface with a theme-token border and restrained elevation. Added a theme-aware framed shop mark and accent-coloured shop name, keeping the source logo unclipped.
- Mobile breakpoint behaviour and legacy diagnostic / WhatsApp bug reporting unchanged.
- Version 11.3.0 (`versionCode 110300`), cache `ncs-v69`. Compiled and AST-validated with `npm run prepare-www`; mirrored to the GitHub clone per Rule 39.

### v11.2.0 · 2026-10-30 19:10 · Antigravity
**Executive header redesign, prayer integration and corner-clipping fix.**
- Removed `border-radius: 10px` on `.top-brand img`, which clipped the monitor graphic; added crisp containment and a soft shadow.
- Rebuilt `#top` as a 3-column grid: Brand and role pill, centred Bismillah / live clock / calendar, and Weather / prayer pill / tools / live sync.
- Scaled the shop name and clock to a balanced 24 px bold weight.
- Moved the prayer schedule from Overview into the header widget `#hdrPrayerWrap` (active or next prayer with countdown, 6-prayer hover preview, full schedule dialog with alarm test). Removed the static 6-box card from `#vHome`.
- Added `#topSync` at the far right for 1-click sync checks on every tab.
- Version 11.2.0 (`versionCode 110200`), cache `ncs-v68`, compiled and mirrored per Rule 39.

### v11.1.0 · 2026-10-30 11:35 · Antigravity
**Bug Report System v12: contextual in-tab reporting.**
- Floating `[ 🪲 Bug ]` pill (`#tabBugFab`) on all tabs, hidden on the lock screen (`#lk`).
- Dialog auto-detects the active tab and captures role, staff name, date, time and version. Two fields: *Bugs / Errors* and *Requirements / Solution*.
- Each report generates a Markdown file in `S.bugReportsV12`, saved to local storage and IndexedDB, pushed to cloud sync, with a 1-tap `.md` download.
- Admin hub in More: tab filters, Open/Resolved toggle, per-report download and clipboard copy, delete, and bulk `📦 Download All (.md)`.
- Legacy WhatsApp / diagnostic reporter unchanged.
- Version 11.1.0 (`versionCode 110100`), cache `ncs-v67`, built with `npm run prepare-www`.

### v10.4.4 · 2026-10-29 21:15 · Antigravity
**Vertically centred floating tab dock and minimal card design.**
- Replaced the full-height sidebar with a floating dock (`top: 50%; transform: translateY(-50%)`) on displays ≥900 px.
- 54 px pill dock, 18 px radius, shadow `0 4px 20px rgba(0,0,0,.08)`, border `1px solid var(--line)`. Hover expands to 190 px with bilingual labels.
- Desktop body `padding-left: 84px` keeps the header and views aligned.
- Version 10.4.4 (`versionCode 100404`), cache `ncs-v66`, mirrored per Rule 39.

### v10.4.3 · 2026-10-29 21:05 · Antigravity
**Counter top-cart layout, collapsible icon sidebar, minimalist UI.**
- Counter cart (`#posCartTop`) sits above search, presets and catalog, so the workflow fits without zooming to 74%.
- Desktop rail shrank to 68 px icons and expands to 220 px on hover.
- Counter header rebuilt (`.counter-title-group` / `.counter-actions-group`) to stop jumping between views; emojis removed from the toggle.
- More tab: removed MFS and Recharge cards; minimal cards with SVG icons, subtext and chevrons. Unified 1.8 px stroke icon set.
- Version 10.4.3 (`versionCode 100403`), cache `ncs-v65`, mirrored per Rule 39.

### v10.4.2 · 2026-10-29 20:20 · Antigravity
**5-tab architecture and unified More hub (owner's layout blueprint).**
- Bottom navigation reduced from 7 to 5 tabs: `Overview` (`home`), `Ledger` (`led`), `Counter` (`pos`), `Accounts` (`acc`), `More` (`more`), with bilingual labels (ওভারভিউ, খতিয়ান, কাউন্টার, হিসাব, আরও). Tab width rose from about 14% to 20%.
- Counter (`#vPos`) merges POS and Stock with a `[ 🛒 Billing | 📦 Stock ]` header toggle, sticky cart, presets (`#posPresets`), barcode scan, search and charge.
- More (`#vMore`) absorbs the Management tab: Wallets and MFS (`#wltWrapM`), Staff and Roles (`staffUI`), Reports Hub (`#rpb`), presets customiser (`openPresetSettings`), Section and card settings, Sound, Theme, Bug report, Version History, Change Log, Self-Test, Force Logout.
- Retired `#vMgmt` and `#vProd`, giving a 1-to-1 mapping between view IDs and tabs.
- Version 10.4.2 (`versionCode 100402`), cache `ncs-v64`, mirrored per Rule 39.

### v10.4.1 · 2026-10-29 19:15 · Antigravity
**Phase 1 safe cleanup.**
- Removed dead `#s2` / `#s3` (Day/Night) inputs from Settings.
- Removed the permanently hidden `#fx` inline actual-cash input and `#cnt` from the Accounts form; cash counting stays in the "Count and adjust cash" modal.
- Removed redundant `#stf` and `#logb` from the Accounts footer and the dead `#stf{display:none!important}` rule; added `showChangeLog()`; Staff and Change Log stay in Management.
- Removed static `bcard('upc')` and duplicate `bcard('bug')` cards from `vMgmt`.
- Version 10.4.1 (`versionCode 100401`), cache `ncs-v63`, mirrored per Rule 39.

### v10.4.0 · 2026-10-29 17:35 · Antigravity
**Enterprise design system, five-colour chart palette, Rule 39.**
- Light: `#F8FAFC` background, white cards, `#E2E8F0` borders, shadow `0 1px 3px rgba(15,23,42,0.08)`. Dark: obsidian `#0B0F19`, cards `#131B2E`, borders `#1E293B`.
- Tokens: emerald brand (`#0F766E` light, `#10B981` dark), Cash In (`#15803D` / `#34D399`), Cash Out and Due (`#DC2626` / `#F87171`), warnings (`#D97706` / `#FBBF24`).
- Chart tokens `--ch1` to `--ch5` unify the donut, category bar and 7-day Sell and Buy charts.
- Tinted financial pills with `color-mix()` borders; `font-variant-numeric: tabular-nums` on tables, headers and money; 12 px card radii.
- Added Rule 39. Version 10.4.0 (`versionCode 100400`), cache `ncs-v62`, compiled with `npm run prepare-www`.

### v10.3.0 · 2026-10-29 14:25 · Antigravity
**Counter speed presets (1-tap services for POS and Accounts).**
- `DEFAULT_PRESETS` and `getPresets()` in `src/js/01-core.js`: Photocopy ৳5, Computer Print ৳10, Color Print ৳20, Photo Print ৳30, Lamination ৳30, Online Application ৳50, Document Scan ৳10. Customisations persist across devices in `S.presets`.
- POS: `.svc-presets` chip bar above the catalog. Accounts: `#accPresets` in `#fsec` pre-fills Description, Category, Amount, Payment (Cash) and Type (Sale), then focuses Amount.
- Admin customiser "⚡ Counter service presets" in More: edit, add, delete, reset to defaults.
- Version 10.3.0 (`versionCode 100300`), `VERS` / `UPC` updated, cache `ncs-v61`, asset tags `?v=10.3.0`.

### v10.2.0 · 2026-10-29 13:55 · Antigravity and Claude Sonnet
**Whole-state sync restoration and absolute balance integrity.**
- Replaced the Model B delta mirror with whole-state sync (`stateOut()` / `mergeState()`); all state travels as one atomic payload.
- Removed the lossy column-mapping layer so balance-critical fields travel verbatim in JSON.
- Echo-storm fix: `primeLH()` after every remote merge; removed the `if (!r.u || r.v === 1 || r.removed === 1) r.u = now;` loop from `save()`.
- `Code.gs` stores state in the `State` sheet in 40,000-character chunks (about 200 ms), with human-readable rows in `Entries` and daily `Backup <date>` sheets.
- `window.S = S` bound on remote update and IndexedDB resolve; active-tab poll 15 s, sleeping on a hidden tab.
- Version 10.2.0 (`versionCode 100200`), cache `ncs-v60`.

### v10.1.5 · 2026-10-29 12:45 · Antigravity
**Instant sync acceleration.** Push debounce 1500 ms to 400 ms; background poll 10 s to 3 s (later set to 15 s in v10.2.0); automatic `pull()` 200 ms after a successful push. Version 10.1.5 (`versionCode 100105`), cache `ncs-v59`, asset tags `?v=10.1.5`.

### v10.1.4 · 2026-10-29 12:15 · Antigravity
**Sync schema v3, monotonic `nextU` hardening, PWA cache busting.** Existing clients reset `lastPullU=0` on boot for a full re-pull with UTC+6 normalisation. `nextU()` strictly exceeds local and server-acknowledged timestamps (`res.serverU`). `stampChanged()` and `save()` use `nextU()`. Added `?v=10.1.4` to `diag.js` and `sync.js`, a `_t` timestamp on pull GETs, and a sync-completion toast. Version 10.1.4 (`versionCode 100104`), cache `ncs-v58`.

### v10.1.3 · 2026-10-29 02:20 · Antigravity
**Multi-device realtime sync and UTC+6 fix.** Added `toBdDate` / `toBdTime`; repaired all 184 historical server entries (dates, times, payment cash fields); `pull()` falls back to `since=0` on empty local stores or manual refresh (`pull(true)`); universal redraw (`homeUI`, `render`, POS, Ledger) with `animateCounts` on pull. Version 10.1.3 (`versionCode 100103`), cache `ncs-v57`.

### v10.1.2 · 2026-10-29 01:55 · Antigravity
**Mobile realtime sync, bidirectional schema, auto-push fix.** `save()` in `src/js/01-core.js` calls `window.NcsSync.schedulePush()` directly. `formatRowForServer` and `normalizeRemoteRow` bridge sheet headers (`date`, `wallet`, `cash`) and app fields (`d`, `t`, `pay`, `cat`). Added `visibilitychange` wake-up and immediate redraw via `window.redrawActiveView()`, `calc()` and `animateCounts()`. Version 10.1.2 (`versionCode 100102`), cache `ncs-v56`.

### v10.1.1 · 2026-10-29 01:15 · Antigravity
**1-tap WhatsApp bug reporter and formalised rules.** Upgraded the More-tab reporter (`src/js/05-shell.js`) to dispatch to `+8801765420566` with version, local timestamp, role, activity, description and last error. Added `getLastError()` to `diag.js`, clipboard copy with textarea fallback, and log download. Formalised the `VERS`, `BUGS` and `UPC` contracts in Sections 0 and 4. Version 10.1.1 (`versionCode 100101`), cache `ncs-v55`.

### v10.1.0 · 2026-10-29 00:45 · Antigravity
**Sub-accounts, combined group ledger and modernisation.**
- `parentId` on party records; `lSubAccounts(cId)` and `lCombinedBal(cId)`.
- Parent Account selector in `ledCust()` with cycle prevention; parent profiles show sub-account dues, quick navigation, combined balance and a Group Statement toggle (`window._incSubsStatement`); sub-accounts link back to the parent; Ledger cards show `↳ Parent: [Name]` and child-count pills.
- Verified `npm run build` and `npm run prepare-www`. Version 10.1.0 (`versionCode 100100`), cache `ncs-v54`.

### v10.0.0-beta · 2026-10-29 00:15 · Antigravity
**Storage hardening, encrypted backups and direct ESC/POS printing (Phases 3 to 5).** `NcsDB` IndexedDB adapter (`ncs_idb_v1`) with an IndexedDB `selfTest()` check; AES-GCM-256 / PBKDF2 backups with decrypt-on-restore; Web Serial and Web Bluetooth ESC/POS with paper cut and drawer kick (`ESC p 0 25 250`).

### v10.0.0-beta · 2026-10-28 23:35 · Antigravity
**Architecture modernisation (Phases 0 and 1).** Baseline snapshot in `_backup_v10_baseline/`. Split the 332 KB `index.html` into `src/` (`template.html`, `styles/main.css`, `markup/app.html`, 11 modules). Built `scripts/build.js` (compiles in about 11 ms, AST validator, `npm run watch`). `npm run prepare-www` now builds from `src/`, keeping Electron and Capacitor workflows compatible.

### v10.0.0-beta · 2026-10-28 01:30 · Antigravity
**Handover update and beta verification.** Added the Immediate Action block, Rule 37 and corrected roadmap versions (v9.23 to v10.1.0, v9.24 to v10.2.0).

### v10.0.0-beta · 2026-10-28 00:30 · Antigravity
**Model B delta sync and structured Sheets mirror (superseded in v10.2.0).** Delta sync against `Code.gs` with monotonic `u` timestamps; 12 mirror sheets (`_Meta`, `_Blob`, `Entries`, `Bills`, `Products`, `Moves`, `Parties`, `Ledger`, `Wallets`, `Counts`, `Pending`, `Days`, `History`, `Atts`); `diag.js` logger and "🐞 Report a Bug (Beta)"; `setSt()` driven by `sync.js`; fixed the corrupted backtick on line 830 in `staffUI`; `prepare-www.js` bundles `diag.js` and `sync.js` and supports semver 10.0.0; cache `ncs-v53`.

### v9.29 · 2026-10-24 00:20 · Claude Sonnet and Gemini
**Admin Prime wallet adjustments, Accounts streamlining and card adjustment settings.** Prime MFS and Recharge adjustments (`doSaveWalletOpening` never rejects; `checkWalletCollisions()` queues `wallet-collision` items with a "Deficit Review" badge). Transaction Details, Search and Filter and check bars moved below `#fsec`. Admin-only Section and card settings (`S.cardSettings`, protected in `LOCAL`). Cache `ncs-v52`. Tests: `node --check` and simulated execution.

---

## 8. Bug Fix History
*Newest first. Canonical single-line format: `YYYY-MM-DD HH:MM (UTC+6) — version — who — what was wrong — cause — fix`. Entries made before this rule are recorded as `--:--`.*

### v11.3.0 · 2026-10-30 20:00 · Manus
- **Symptom:** header weather and date stayed small and separated, prayer details took too much right-zone space, and the header felt heavy.
- **Cause:** weather was a separate right-side chip, prayer name and time were always visible, and the desktop header used a solid card background.
- **Fix:** moved weather into the centred date and time cluster; reduced prayer to a 44 px accessible icon with hover/focus preview and modal; replaced the solid background with a transparent theme-aware surface, divider and elevation; added a framed, accent-coloured shop mark.

### v11.2.0 · 2026-10-30 19:10 · Antigravity
- **Symptom:** shop monitor icon top corners clipped; prayer times dominated the Overview tab; header lacked unified centre alignment.
- **Cause:** `border-radius: 10px` clipped the monitor casing; prayer times were a large static 6-box card in `vHome`; Bismillah sat in a detached top strip.
- **Fix:** removed the radius from `top-brand img`; made prayer times an interactive header widget with hover preview and modal; rebuilt the top header as a 3-column grid with centred Bismillah, clock and date and a rightmost live sync pill.

### v10.4.1 · 2026-10-29 19:15 · Antigravity
- **Symptom:** unused Day/Night inputs in Settings and a permanently hidden actual-cash input in the Accounts form created confusion and dead code.
- **Cause:** legacy `dayStart` / `dayEnd` outlived the v9.20 three-mode theme overhaul; hidden `#fx` was superseded by the cash adjust modal.
- **Fix:** removed `#s2` and `#s3` from Settings, removed hidden `#fx` and `#cnt` from the Accounts form, and decoupled Staff and Change Log from the Accounts footer.

### v10.4.0 · 2026-10-29 17:20 · Antigravity
- **Symptom:** Home cash balance, sales and bills showed 0 for today, and click handlers were duplicated.
- **Cause:** GPT-OSS 120B commit `ed82eee` changed `e.d>=a&&e.d<=b` to strict `e.d>a&&e.d<b` (making single-day ranges impossible), changed role `accountant` to `accountor`, and moved click listeners inside `homeUI()`.
- **Fix:** restored inclusive date inequalities and the `accountant` role, moved listeners outside `homeUI()`, and synchronised the verified build to GitHub.

### v10.2.0 · 2026-10-29 13:55 · Antigravity and Claude Sonnet
- **Symptom:** sync was slow and balances shifted between desktop and mobile.
- **Cause:** (1) Model B delta sync dropped non-array state (`S.wManual`, `S.start`, `S.days`, `S.users`); (2) Sheet columns stripped dynamic properties (`ld`, `act`, `w`, `cu`, `adj`, `void`), flipping cash arithmetic; (3) an empty string from the Sheet broke the `act===null` check; (4) no `primeLH()` on pull caused an echo storm where every save re-pushed all rows; (5) `save()` re-stamped `removed===1` rows forever; (6) 12-sheet reads and writes took 3 to 5 s per GAS execution.
- **Fix:** restored whole-state sync (`stateOut()` / `mergeState()`); `Code.gs` stores full state JSON in the `State` sheet with readable rows in `Entries` (about 200 ms); removed `removed===1` re-stamping; bound `window.S` dynamically; set active-tab poll to 15 s.

### v10.1.5 · 2026-10-29 12:45 · Antigravity
- **Symptom:** entries saved on one device took up to 17 s to appear on another.
- **Cause:** 10 s pull poll, 1.5 s push debounce, and no pull after a successful push (worst case 1.5 s + 3 to 5 s GAS push + 10 s poll).
- **Fix:** poll 10 s to 3 s, debounce 1500 ms to 400 ms, automatic pull 200 ms after every successful push (worst case about 5 s, GAS-limited).

### v10.1.4 · 2026-10-29 12:15 · Antigravity
- **Symptom:** mobile PWA still showed "No entries for this date" and failed to sync new transactions after an update.
- **Cause:** (1) `syncState.lastPullU` was ahead of server timestamps, so pulls skipped entries; (2) `save()` did not stamp edited rows with `nextU()`, so they were filtered from push; (3) the service worker served a stale `sync.js` from the HTTP disk cache; (4) `nextU` ignored server ack timestamps, risking ignored rows under clock drift.
- **Fix:** sync schema v3 forces a one-time full sync (`since=0`) with date re-normalisation; `nextU` strictly exceeds all local and server timestamps; `stampChanged()` and `save()` use `nextU()`; added `?v=10.1.4` cache busting, cache `ncs-v58` and a sync-completion toast.

### v10.1.3 · 2026-10-29 02:20 · Antigravity
- **Symptom:** entries and Cash Balance added on the desktop PWA did not appear on the PC app, mobile PWA or APK.
- **Cause:** (1) server mirror date conversion to a UTC string shifted GMT+6 early-morning entries to the previous day; (2) 182 historical entries had empty dates; (3) delta pull used the server timestamp instead of the entry timestamp; (4) empty local stores on mobile did not trigger a full-history fetch.
- **Fix:** UTC+6 conversion in `toBdDate` / `toBdTime`; repaired all 184 server entries; pull falls back to `since=0` on empty stores and manual refresh; universal redraw across Home, Accounts, POS and Ledger on pull.

### v10.1.2 · 2026-10-29 01:55 · Antigravity
- **Symptom:** mobile did not sync realtime data, new entries, Cash Balance or Cash Flow.
- **Cause:** `save()` in `01-core.js` shadowed `window.save`, so `schedulePush()` never fired; Apps Script mirror headers stripped `d`, `t`, `pay`, `cat`, so `calc()` and `homeUI()` filtered out undated entries.
- **Fix:** `save()` calls `window.NcsSync.schedulePush()` directly; bidirectional schema normalisation in `sync.js` preserves `d`, `t`, `pay`, `cat`; added `visibilitychange` wake-up and active-view re-rendering.

### v10.0.0-beta · 2026-10-28 01:30 · Antigravity and Claude
- **Symptom:** the handover had outdated roadmap versions and no explicit auto-sync verification check.
- **Cause:** the v10 release requires strict verification of the `window.save` wrapper to avoid silent sync failures.
- **Fix:** roadmap updated to v10.x; added Rule 37 and the Immediate Action checklist.

### v10.0.0-beta · 2026-10-28 00:25 · Antigravity and Claude
- **Symptom:** the sync pill stayed on "Pending" (yellow) and manual clicks did nothing.
- **Cause:** `sync.js` never notified `setSt()` of success or failure; `isDirty()` stayed true because `S.synced` was bypassed in v2; sync button and refresh handlers returned early without calling `NcsSync`.
- **Fix:** wired `sync.js` to `setSt()` on push and pull success and failure; updated `isDirty()` for v2; delegated manual sync and refresh clicks to `NcsSync.push(true)` and `pull()`.

### v10.0.0-beta · 2026-10-27 23:50 · Antigravity and Claude
- **Symptom:** `SyntaxError: Invalid or unexpected token` at `index.html:830` during boot.
- **Cause:** a corrupted backtick (clipboard formatting) replaced a single quote after `.join('')+'<div...>` on line 830.
- **Fix:** replaced the stray backtick with a standard single quote before `,async()=>`.

### v9.29 · 2026-10-24 23:28 · Antigravity and Claude
- **Symptom:** adjusting the Bkash Personal balance inflated the Nagad balance.
- **Cause:** anchors stored the already-transaction-processed balance for every wallet at date `d`; `wltRun` applied the anchor as a reset and then added all transactions again, double-counting them.
- **Fix:** wallet cards are now a pure manual balance sheet. `S.wManual` stores each balance, `calcWallets()` reads it, `adjustSingleWallet` writes only to `S.wManual[key]`, and a Reset to Zero button was added. No anchor or transaction computation is involved.

### v9.29 · 2026-10-24 23:15 · Antigravity and Claude
- **Symptom:** adjusting a wallet balance repeatedly stacked previous amounts and persisted a wrong total.
- **Cause:** `doSaveWalletOpening` always appended a new anchor to `S.walletDates` without removing an existing anchor for the same date, so `wltRun` and `balanceAtDate` applied both.
- **Fix:** `doSaveWalletOpening` removes any existing anchor for the same date before inserting the new one, so each date holds exactly one anchor.

---

## 9. Native Apps (Android APK and Windows .exe)
*Added 2026-10-19. The PWA is unchanged and still works. The native apps wrap the same files.*

### Build and release
- **CI:** `.github/workflows/build.yml` runs on every upload to `main`. It builds only if `APP_VERSION` has no release yet (tag `v<major>.<minor>.<patch>`, e.g. 9.28.1 becomes `v9.28.1`). If the version is not raised, nothing is built.
- **Release contents:** `NCS-Accounts-<v>.apk`, `NCS-Accounts-Setup-<v>.exe`, `latest.yml` and `.blockmap` (Windows updater), `www.zip` and `update.json` (Android live update).
- **No edits to `index.html` for native.** `scripts/prepare-www.js` copies the app to `www/` and injects `native/bridge.js` just before `<script src="config.js"></script>`. **If that tag is removed or changed, the build fails on purpose. Keep it.** The workflow runs `npm run prepare-www` (`node scripts/build.js && node scripts/prepare-www.js`), compiling `/src` into `index.html` and `www/`.

### Platforms
| | Android | Windows |
|---|---|---|
| **Stack** | Capacitor 8 + `@capgo/capacitor-updater` (manual mode) | Electron 44, NSIS per-user installer, `electron-updater` from GitHub Releases |
| **Updates** | On start and on resume (max once per 30 min), `bridge.js` reads `releases/latest/download/update.json`, downloads `www.zip`, calls `next()` and shows a "Restart now" bar. A bundle that never calls `notifyAppReady()` is rolled back by the plugin | From GitHub Releases |
| **Extras** | `bridge.js` supplies `navigator.share`, blob downloads (cache, then share sheet) and `window.print` (custom `NativePrint` plugin using Android PrintManager) | App is served from `app://ncs/`. Unsigned, so SmartScreen warns on first install |

### Operations
- **Service worker:** switched off in both native apps by `bridge.js` (files are bundled). Still bump the `sw.js` cache per Rule 1 for the PWA.
- **Storage:** native apps have their own `localStorage`, separate from the PWA. A new device connects with the shop passphrase and syncs from the Sheet.
- **Manual APK install is needed for:** a new Android permission, a new Capacitor plugin, or a new icon. Web code changes never need it.
- **Signing key:** GitHub secrets `ANDROID_KEYSTORE_B64` and `ANDROID_KEYSTORE_PASSWORD` (alias `ncs`). The owner keeps the backup. If it is lost, the phone app must be uninstalled and reinstalled once.
- **Not yet verified on real devices:** Android build in CI, APK install and live update, camera scan in the APK, print dialog on Android, Windows installer and auto-update. The Windows app was launched and rendered only under a virtual display.
- **Sound (v9.22.2):** uses the standard Web Audio API, which works in the Android WebView and Electron. On Android, sounds triggered by background sync can be blocked if no recent tap occurred; that is an OS limit, not a bug. Audio is disabled entirely under reduced motion by design. If sound still fails in the native Android app, add `android:hardwareAccelerated="true"` to the WebView (already the Capacitor default) and call `webView.getSettings().setMediaPlaybackRequiresUserGesture(false)` in the Android host to remove the gesture requirement for programmatic playback.
