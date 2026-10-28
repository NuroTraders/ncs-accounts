# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v10.1.0** (service worker cache `ncs-v54`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

## 🚨 IMMEDIATE ACTION REQUIRED FOR ANTIGRAVITY
Before starting the Beta Test, you must verify and fix three critical items:
1. **Auto-Sync Wrapper:** Verify `sync.js` contains a wrapper for `window.save`. When a user saves an entry, it must automatically trigger `schedulePush()` in `sync.js`. If it only syncs on manual refresh, the beta test will fail.
2. **Config Cleanup:** Check `config.js`. The owner's previous file had a duplicate `window.NCS_CONFIG` block containing an encrypted `"enc"` object. Ensure `config.js` ONLY contains one object with `SYNC_MODE`, `API_URL`, `API_TOKEN`, and `BETA`.
3. **Roadmap Versioning:** Section 6 has been updated to reflect `v10.x` instead of `v9.x` for future features.

## 0. Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js`, and this `HANDOVER.md`. Never work from an older copy.
2. Read sections 2 and 4 before changing anything.
3. Make one feature per version. Do not refactor unrelated code.
4. At the end: bump the version (section 4, rule 1), update section 7 (session log), and hand back all changed files. **Always deliver complete files, never patches.**
5. **Bug fix command:** every bug you fix must be written into section 8 with date and time (HH:MM, Bangladesh time, UTC+6), version, what was wrong, the cause and the fix. The same entry must also go into the in-app `BUGS` array.

## 1. Files
| File | Purpose |
|---|---|
| `index.html` | The whole app (single file) |
| `sw.js` | Offline cache. Network-first. Cache name `ncs-vN` |
| `manifest.webmanifest` | PWA install info |
| `config.js` | v10 sync config (`SYNC_MODE: 'v2'`, `API_URL`, `API_TOKEN`, `BETA: true`) |
| `diag.js` | Diagnostics engine: rolling 200-event buffer (`ncs_diag_v1`) & bug report exporter |
| `sync.js` | Delta sync engine (Model B: push/pull delta with monotonic `u` timestamps) |
| `SolaimanLipi-*.ttf` | Bengali font |
| icons and logos | `icon-*.png`, `logo-*.png` |
| Google Apps Script | Lives in the owner's Google Sheet (`Code.gs` Web App with 12 structured sheets) |
| `package.json`, `package-lock.json`, `electron/`, `native/`, `scripts/`, `electron-builder.config.js`, `build/`, `.github/workflows/build.yml`, `SETUP.md` | Native Android and Windows apps (section 9). Do not edit unless the task is about the native apps |

## 2. Architecture
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **Collections:** `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts`. Stamped with `u`, merged by `mergeById`.
- **Other synced keys (v9.24):** `days`, `names`, `parties`, `log`, `users`, `start`, `walletDates`, `counts`; `pending` and `history` merged by id.
- **Local-only keys (v9.22):** theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince, motion, **sound**, lastBackup.
- **Sync (v10.0 Model B):** Google Apps Script delta sync with 12 structured mirror sheets (`_Meta`, `_Blob`, `Entries`, `Bills`, `Products`, `Moves`, `Parties`, `Ledger`, `Wallets`, `Counts`, `Pending`, `Days`, `History`, `Atts`). Push and pull only transmit rows with monotonic `u` timestamp higher than local cursor. Conflict resolution is last-write-wins (higher `u`). Fallback hourly backup saved to `_Blob`. Managed by `sync.js` and `window.NcsSync`.
- **Auto-Sync Hook (v10.0):** `sync.js` wraps `window.save` inside its `start()` function. Whenever the app calls `save()`, `sync.js` intercepts it and calls `schedulePush()` to automatically push deltas to Google Sheets.
- **Sync status:** single dot with label: green = `Synced` (ok), yellow = `Pending` (pend), red = `Offline` (offl) / `Conflict` (conf), outline = `Off` (off). In v10, `sync.js` updates status on push, pull and network failure. Clicking the sync pill or header refresh triggers immediate delta sync.
- **Diagnostics & Bug Reporter (v10.0):** `diag.js` captures JS uncaught errors, unhandled rejections, and rolling 200-event buffer in `localStorage` (`ncs_diag_v1`). A "🐞 Report a Bug (Beta)" button in the More tab exports a non-PII diagnostic report for WhatsApp sharing or download.
- **Theme (v9.20):** three modes — `auto` (OS default), `light`, `dark`. Icon button `#themeBtn` in top bar cycles Auto → Light → Dark → Auto. Day/Night removed.
- **Tab transitions (v9.20):** `.view.on` fades in (220ms). Skipped under OS reduced motion.
- **Refresh (v9.20):** two-arrow SVG spins once on tap.
- **Storage warning (v9.27):** 4MB pre-warning advisory shown on save failure or threshold exceed. Dismiss hides it (`style.display='none'`).
- **Reduced motion (v9.20):** auto from OS `prefers-reduced-motion`; no manual toggle. **v9.22 also silences the sound engine under reduced motion.**
- **Keeper tabs (v9.20):** Products and More only. POS, Accounts, Ledger hidden.
- **Party kinds (v9.20):** Customer, Investor, Supplier, Borrower/Lender. Kind tabs filter the Ledger list. Legacy Lender/Borrower are treated as Borrower/Lender.
- **Wallet openings (v9.20, adjust v9.24):** `S.walletDates` array of date-anchored openings (`{d, by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev, discrepancy}`). `S.wallets` is the base opening. `wltRun` resets the wallet balance at each date anchor. Setting an opening for a past date requires Admin PIN and logs a `walletAdjust` entry. Admin sees a discrepancy report if the entered amount differs from the carried-forward balance. **v9.24 adds individual MFS/Recharge wallet adjustment** (`adjustSingleWallet`) accessible from the wallet cards and detail modals.
- **Cash adjustment (v9.20, history v9.24):** past-date targets require Admin PIN; Adjustment entries carry `pinBy` and `pinAt`. Present-day adjustments still roll to `nextOpenDay` without PIN. **v9.24 adds permanent `S.counts` history** with currency note denominations, book total, difference, and reason, accessible via `cashCountHistory()`.
- **POS void (v9.20):** reason matching `/^test$/i` marks the bill `test:1` and the entry `test:1`; these appear in a "Test" section (admin only) and are excluded from every total. Admin can also "Remove permanently" a voided bill: `b.removed=1`, `e.removed=1`. Removed bills are hidden everywhere.
- **Borrower/Lender transactions (v9.20):** identical rules to Customer — any In/Out with any method (Cash, MFS, Recharge). No special direction.
- **Sound engine (v9.22.2):** `var Sound` module using Web Audio. `Sound.tick` (tab/dialog), `Sound.chaChing` (sale/entry save), `Sound.buzz` (errors), `Sound.chime` (background sync), `Sound.test` (Settings "Test sound" button). `enabled()` requires `S.sound` and no `data-rm`. AudioContext is created/resumed on the first pointerdown/keydown/touchstart. **`play()` waits for `ctx.resume()` before scheduling tones** — that's the v9.22.1 fix. Default off; toggle in Settings (admin-only, like the rest of Settings). A "▶ Test sound" button sits right under the toggle.
- **Sound toggle in More tab (v9.22.2):** a new button `#sndBtn` was appended to the More list, directly above the Settings and Lock buttons. It reads "Sound effects: ON/OFF". Clicking it flips `S.sound`, saves, and plays the test chime if turning ON. The Settings button is also no longer hidden in the More list (the old `#stf,#set{display:none!important}` rule was rewritten to just `#stf{display:none!important}`).
- **Motion (v9.22):** `animateCounts()` counts `.cnt` elements from 0 to `data-to` over 400ms (Home hero + Total Sell/Buy). Under `data-rm`, it skips animation and sets the final value immediately. `saveCheck()` shows a green SVG tick overlay. `button:active` scales to 0.97. POS cart rows use `.slidein` / `.slideout`. All are no-ops under `data-rm` or missing elements.
- **Download safety (v9.22):** `dlFile` appends the `<a>` to the DOM before clicking (some wrappers require it) and falls back to a `window.open` data URL if the blob download throws.
- **Due reminders (v9.23):** `dueNoticeText()` generates a polite Bengali reminder. `lLinks()` detects negative balance and swaps normal SMS/WhatsApp links for "বকেয়া SMS" / "বকেয়া WhatsApp" prefilled links.
- **UI/UX Overhaul (v9.25):** Modal `.dlg` capped at 88vh with `.oa` sticky bottom actions. Touch targets `.lnk` (min-height 34px) and POS cart `.x` (40px) enlarged. POS 2-column layout on desktop (sticky cart) and search-first on mobile. Ledger header consolidated with `⋯ More` dropdown for secondary actions.
- **System Audit (v9.27):** Cryptographic `uid()` for ID generation. `r2()` rounding applied to `calc()`, `prevFor()`, `lBal()`, `ledRows()`, `wltRun()`. `autocomplete="off"` on PIN fields. `touch-action: manipulation` on buttons. Theme button `aria-label` dynamic update.
- **Sync restore (v9.28):** GET protocol restored for `getRemote()`, `importPos()`, `importCatalog()`. `badKey()` no longer wipes `S.sync` prematurely.

## 3. Data model
- **`cust`:** `{id, name, phone, fb?, img?, note, kind?, addr?, rel?, due?, dueNote?, del?, delReason?, dby?, dts?}`. `kind` ∈ Customer, Investor, Supplier, Borrower/Lender (legacy `Lender`/`Borrower` map to Borrower/Lender at read time). `due`/`dueNote` shown as party reminder.
- **`ltx`:** `{id, c, dir, btype?, amt, parts?, d, d2, t, m, who, note, by, eb?, void?, vr, vb, fix?, dupDismissed?, flag?, prop?, voidReq?, l9?, lnk?, le?, ok?, okb?, src?}`.
- **`ltx.flag`:** `{state: pending|cleared|rejected, by, at, reason, cb?, ca?, rb?, ra?, rr?}`.
- **`ltx.prop`:** `{state: pending|approved|rejected, by, at, reason, to, rb?, ra?, rr?}`.
- **`ltx.voidReq`:** `{state: pending|approved|rejected, by, at, reason, rb?, ra?, rr?, vb2?}`.
- **`atts`:** `{id, ref, d, by, at, del?, db?, dt?}`. ref = `'e'+entryId` or `'l'+ltxId`.
- **`walletDates` (v9.20):** `[{d: 'YYYY-MM-DD', by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev: {...}, discrepancy: {...}, pinBy?, pinAt?}]`. Most recent entry ≤ a given date is the active opening.
- **`counts` (v9.24):** `[{id, d, t, at, by, total, book, diff, reason, den: {1000: N, 500: N, ...}, pinBy?}]`. Permanent cash count history.
- **`entries`:** daily accounts; `cash()` and `calc()`.
- **POS bill flags (v9.20):** `b.test = 1` for reason=`test`; `b.removed = 1` for admin-permanent-removal; corresponding entry also flagged.
- **Party balance:** sum of `in` − `out` over non-void entries.
- **Stock override:** unchanged (`adminCheck`, `adminChecked`, `adminRejected`, `target`).

## 4. Rules (do not break)
1. **Every release:** bump `APP_VERSION`, add `VERS`, bump `sw.js` cache, add section 7 line, sync `UPC`/`BUGS`. **Deliver complete files, not patches.**
2. **Synced data into `COLS`.** Always `save()`.
3. **Never hard-delete money records.** Use `void` with reason; use `removed` flag for POS permanent removal; use `del` for parties. No physical deletion.
4. **Ledger ↔ cash only through `ledReconcile()`.**
5. **Permissions:** ledger = admin, accountant, cashier. Cashier = add + flag. Accountant = propose (edit or void). Admin = approve/reject. Management = admin. Party edit/archive = admin. **Keeper sees Products and More only (v9.20).**
6. **Escape all user text** with `esc()`.
7. **CSS clash awareness** (`.lt` belongs to POS).
8. **Dates ISO**, shown with `sd()`.
9. **Secrets** never in files.
10. **`node --check` before handback.**
11. Search for existing classes before adding.
12. Dark mode uses tokens only; no green accents.
13. **Scope trap:** POS-private `dlg`, `toast`, `stockMap` are NOT global. `POS.stockMap()` is exposed on the POS return object.
14. **Parallel merge:** three-way; conflicts in `APP_VERSION`, `VERS`, `UPC`, `sw.js` cache.
15. Capitalise labels. "Bkash" not bKash.
16. Shop name is `shopN()`.
17. `n()` is a formatter, not a parser.
18. Wallet category names are stored values.
19. Wallet limit checks in `checkWalletLimit`.
20. Startup order: `applyLang();start();` at bottom.
21. No module-level `var` in `save()`/`render()` paths.
22. Ledger-linked entries read-only in Accounts.
23. Purchases never saved as Due.
24. Sync dot colours fixed.
25. Record who built it (`by`/`w`).
26. Measure before optimising.
27. Long lists use paging.
28. VERS.by backfill (DONE for v9.0–v9.4 in v9.17).
29. Theme has exactly three modes (v9.20).
30. **Wallet openings are date-anchored (v9.20).** Setting an opening for a past date requires Admin PIN. Never write directly to `S.wallets` when a dated entry is the right tool. Show the discrepancy in the Management opening-history list.
31. **POS void reasons matching `/^test$/i` go to the Test section (v9.20).** Test bills are excluded from all totals. `removed` is admin-only, requires a reason, and can never be undone from the UI.
32. **Sound is a local device preference (v9.22).** Stored in `S.sound`, listed in `LOCAL`, never synced. The sound engine is a no-op when `S.sound` is falsy or `document.documentElement.dataset.rm` is set. Do not call `Sound.*` outside guarded sites; wrap in `try/catch` where it is a fire-and-forget call.
33. **Motion helpers respect `data-rm` (v9.22).** `animateCounts`, `saveCheck`, `slideInLast`, `removeLineAnimated` and the global `button:active` scale all turn off under reduced motion. Keep the `.cnt` / `data-to` convention if you add more count-ups.
34. **`play()` must await `ctx.resume()` (v9.22.1).** Never schedule tones before the AudioContext is `running`. `play()` and `Sound.test()` both use `.then(go)` after `resume()`. This is the fix that made sound audible on Android WebView and iOS Safari.
35. **Sound is OFF by default.** The user has to tick "Sound effects" in Settings (admin-only) or use the new `#sndBtn` toggle on the More tab. Don't change the default without owner approval. The "▶ Test sound" button is the fastest way to verify.
36. **VERS order is ascending (v9.28.1).** Do not prepend versions in descending order. `VERS.unshift` from oldest to newest in the same IIFE ensures the latest version ends up at `VERS[0]`.
37. **v10 Auto-Sync (v10.0.0-beta).** `sync.js` MUST wrap `window.save` inside its `start()` method so that every `save()` call triggers `schedulePush()`. Do not rely on manual refresh buttons for sync.

## 5. Known quirks
- Start fresh carries balances forward; queues a reconciliation item.
- Bkash Personal moves `bk`; Bkash Agent moves `bka`.
- Due purchases impossible for new entries (v9.3); old ones flagged.
- Change Log keeps 500 lines.
- Admin has 6 bottom tabs. Keeper now has 2 (v9.20).
- Sample "Load Riyad notes" removed (v9.18).
- Wallet-transfer categories excluded from Sell/Buy totals (v9.6).
- Undo checks wallet balances (v9.6).
- Stock overrides excluded while pending (v9.6).
- Sync key transport still in GET URLs (accepted limitation, POST causes loop).
- Bills imported from external POS inbox carry no wallet.
- Sync dot: single dot, periodic blink (v9.20).
- Cashier flags; accountant proposes; admin approves (v9.10–9.16).
- Restore (v9.11) not a full remote rollback.
- Photos live in the synced blob (v9.14); Sheet size tolerance unknown.
- **Wallet opening anchors (v9.20):** the first anchor may be a migration of `S.wallets`. Later anchors override the running balance at their date. Any discrepancy is logged with a snapshot of the computed value.
- **POS Test/Removed (v9.20):** test bills are visible only in the POS Bills dialog filter "Test". Removed bills are hidden everywhere; not even in Test.
- **Sound default (v9.22):** off. The toggle lives in Settings, which is admin-only, so non-admin users cannot turn sound on from the UI. AudioContext is created lazily on the first tap.
- **Motion (v9.22):** the count-up uses `requestAnimationFrame` and re-runs every time Home is drawn (including period tab changes). The checkmark overlay is pointer-events:none and self-removes.
- **iOS Safari sound (v9.22.1):** iOS may require the AudioContext to be created synchronously inside a real user gesture. If no sound plays even after the Resume-fix, ask the user to tap the "Test sound" button — that qualifies as a gesture. If it still fails, the browser is blocking audio and this is out of our control.
- **Reduced motion still silences sound (v9.22.1):** if the OS has "reduce motion" on, `Sound.enabled()` returns false. The Test button bypasses this by design (it's a user-requested sound).
- **More tab layout (v9.22.2):** the More tab now shows 4 buttons: বাংলা, Sound effects: ON/OFF, Settings, Lock. The Settings button is no longer hidden.
- **Storage quota safeguard (v9.27):** `persist()` shows a 4MB threshold warning; `window._storageWarnDismissed` is in-memory only and resets on page reload.

## 6. Roadmap
**v10.0.0-beta: DONE (Current Beta).** Model B: Delta Sync Engine with Google Apps Script backend, 12 structured sheets mirror, per-row monotonic u timestamp conflict resolution, diagnostics rolling logger (`diag.js`), bug report exporter in More tab, and live UI sync indicator hooks.

**v9.29: DONE.** Admin Prime MFS & Recharge adjustments, Accounts table layout repositioning & More tab Section & Card settings.
**v9.28.1: DONE.** Version history cleanup.
**v9.28: DONE.** Sync GET restore + Reconnect fix.
**v9.27: DONE.** System audit hardening.
**v9.26: DONE.** Mobile Home Cash Balance bug fixed.
**v9.25: DONE.** Comprehensive UI & ergonomics overhaul.
**v9.24: DONE.** MFS & Recharge balance quick adjustment.
**v9.23: DONE.** WhatsApp & SMS Due Reminders in Ledger.
**v9.22.2: DONE.** Sound toggle visible in More + Settings unhidden.
**v9.22.1: DONE.** Sound resume race fixed + Test button + louder gains.
**v9.22: DONE.** Sound engine, count-up, save checkmark, tap feedback, POS cart slide in/out, wrapper download fallback.

**v10.1.0: DONE.** Sub-accounts (optional parent link, combined family/group balance, parent breakdown, group statement), IndexedDB dual-storage engine, AES-GCM-256 encrypted backups, ESC/POS direct thermal printing, and modular source build engine.
**v10.0.0-beta: DONE.** Model B Delta Sync Engine, 12 Structured Sheets & Diagnostics Logger.
**v9.29: DONE.** Admin Prime Wallet Adjustments & Section Settings.

**Agreed next order (Post Beta):**
- **v10.2.0:** Loans tab (needs owner decisions: direction, flat vs reducing interest, installment rules, late fees, collateral notes, conversion of old Borrow/Lend, one worked example).
- **v10.3.0:** Apps Script items (key rotation, changed-only sync, Ledger sheet; needs the script with secrets removed).
- **Effectiveness pass** needs the owner's top daily tasks per role.

**v9.21: DONE.** Clock, phone top-bar tidy, Accounts Void data section with Admin restore.
**v9.20: DONE.** Owner feedback round 2: POS search, Test/Remove, refresh fix, keeper tabs, party kinds, date-anchored wallet openings, past-date PIN.
**v9.19: DONE.** Storage notice, single sync dot, three-mode theme, transitions, refresh.
**v9.18: DONE.** Home dashboard.
**v9.17: DONE.** Admin PIN change, self test, by backfill.
**v9.16: DONE.** Review queue complete.
**v9.15: DONE.** Docs cleanup.
**v9.14: DONE.** Receipt photos.
**v9.13: DONE.** Reduced motion.
**v9.12: DONE.** Dashboard clock.
**v9.11: DONE.** Restore.
**v9.10: DONE.** Ledger search, flags, statement, due dates.
**v9.9: DONE.** Bill-first POS.
**v9.8: DONE.** Nav/refresh/visual.
**v9.7: DONE.** Discount percent/speed.
**v9.6: DONE.** Audit hardening.
**v9.5: DONE.** Party/carry-forward.
**v9.3: DONE.** No due purchases.
**v9.0: DONE.** Ledger-cash link.
**v8.9: DONE.** Wallets.

**Still open (next)**
1. Sync key rotation (needs Apps Script).
2. Send only changed records (needs Apps Script).
3. Effectiveness pass (owner to specify which taps per role).
4. Optional Ledger sheet in Google Sheets (Apps Script).
5. Five-colour chart palette (Phase 1b).

**Verification still missing**
- Real multi-device sync against production Apps Script (The current Beta test).
- Canvas image compression, camera, statement image, Bengali text in real browser.
- Apps Script / Sheet blob tolerance with `atts`.
- iOS Safari layout, animation, reduced-motion.
- **v9.22 sound and motion on a real phone** (Android WebView and iOS Safari), especially AudioContext resume timing and the `button:active` scale on the bottom tab bar.

**Known limits (v8.7)**
- imo/Facebook links from phone unavailable.
- Some strings English-only.
- Currency via `tk()`.

## 7. Session log (append newest on top)
- **v10.1.0, 2026-10-29 00:45 (UTC+6) (Antigravity):** Sub-Accounts, Combined Group Ledger & Modernization Release (Phase 2 & v10.1.0). (1) **Sub-Accounts Architecture:** Added hierarchical customer/party relationship model (`parentId` on party records). Added `lSubAccounts(cId)` and `lCombinedBal(cId)` calculators. (2) **Party Management & Form:** Added Parent Account dropdown selector in `ledCust()` with cycle prevention, allowing any party (family member, branch, corporate sub-unit) to be linked to a primary parent account. (3) **Profile & Rollup Statement:** Added dedicated Sub-Account summary list on parent profiles with individual dues, quick navigation, combined family balance indicator, and a Group Statement toggle (`window._incSubsStatement`) allowing single-click merged PDF/statement generation covering parent and all children. Sub-account profiles display a parent attribution link. (4) **Ledger Search & Cards:** Added `↳ Parent: [Name]` and child count pills directly on Ledger party cards. (5) **Modular Build Integration:** Tested and verified build pipeline with zero-dependency Node compiler (`npm run build`) and native packager (`npm run prepare-www`). Bumped PWA service worker cache to `ncs-v54` and native version to 10.1.0 (`versionCode 100100`). All syntax validations passed.
- **v10.0.0-beta, 2026-10-29 00:15 (UTC+6) (Antigravity):** Storage Hardening (IndexedDB), AES-GCM Encrypted Backups & Direct Thermal ESC/POS (Phases 3, 4 & 5). (1) **IndexedDB Engine (`NcsDB`):** Implemented native browser IndexedDB dual-storage adapter (`ncs_idb_v1`) in `src/js/01-core.js`. Saves asynchronously in background with high-capacity storage, eliminating the 5MB browser storage crash limit while preserving instant synchronous boots from `localStorage`. Added IndexedDB check to in-app `selfTest()`. (2) **Encrypted Backups (AES-GCM-256):** Added Web Crypto PBKDF2 + AES-GCM 256-bit password-protected backup export option in Accounts settings, and implemented decryption-on-restore with confirmation safeguard. (3) **Direct ESC/POS Thermal Printing:** Added Web Serial and Web Bluetooth raw ESC/POS command streaming in POS receipts with automatic paper cutting and cash drawer kick codes (`ESC p 0 25 250`), with automatic fallback to standard print. Verified with clean AST compilation and `prepare-www`.
- **v10.0.0-beta, 2026-10-28 23:35 (UTC+6) (Antigravity):** Architecture Modernization (Phase 0 & Phase 1). (1) **Baseline Snapshot:** Created `_backup_v10_baseline/` containing exact pre-modernization state (`index.html`, `config.js`, `sync.js`, `diag.js`, `sw.js`, `package.json`, `HANDOVER.md`). (2) **Modular Architecture:** Extracted 332KB monolithic `index.html` into structured, maintainable modules under `src/`: `src/template.html`, `src/styles/main.css`, `src/markup/app.html`, and 11 focused JavaScript modules under `src/js/` (`01-core.js` through `11-bootstrap.js`). (3) **Zero-Dependency Build Engine (`scripts/build.js`):** Built-in Node compiler with built-in AST syntax validator (`vm.Script`) and watch mode support (`npm run watch`), compiling `/src` into root `index.html` in ~11ms. (4) **Pipeline Compatibility:** Updated `package.json` with `npm run build` and wired `npm run prepare-www` to build from `src/` automatically, maintaining 100% compatibility with Electron and Capacitor Android workflows. Verified with clean syntax and prepare-www test executions.
- **v10.0.0-beta, 2026-10-28 01:30 (UTC+6) (Antigravity):** Handover Document update and Beta Verification. (1) Added Immediate Action Required block to enforce Auto-Sync wrapper check, `config.js` duplicate cleanup, and v10 Roadmap versioning. (2) Added Rule 37 enforcing `window.save` wrapper inside `sync.js`. (3) Fixed version numbers in Roadmap section (v9.23 -> v10.1.0, v9.24 -> v10.2.0).
- **v10.0.0-beta, 2026-10-28 00:30 (UTC+6) (Antigravity):** Model B Delta Sync Architecture & Structured Google Sheets Mirror. (1) **Delta Sync Engine (`sync.js`):** Upgraded from v1 whole-blob sync to v10 delta sync against Google Apps Script backend (`Code.gs`). Client-side engine backfills missing `u` timestamps, pushes only changed rows, pulls delta rows using monotonic `u` timestamps with last-write-wins conflict resolution. (2) **Structured Sheet Mirror:** Backend creates and updates 12 structured sheets (`_Meta`, `_Blob`, `Entries`, `Bills`, `Products`, `Moves`, `Parties`, `Ledger`, `Wallets`, `Counts`, `Pending`, `Days`, `History`, `Atts`). (3) **Diagnostics Engine (`diag.js`):** In-memory and localStorage rolling 200-event log buffer (`ncs_diag_v1`) capturing JS uncaught errors, network events, and app state size. Integrated '🐞 Report a Bug (Beta)' button into More tab for exporting diagnostic text/JSON. (4) **Sync UI Hook:** Fixed UI status pill (`setSt()`) so `sync.js` drives live green 'Synced', yellow 'Pending', and red 'Offline' states; clicking the sync pill or header refresh forces an immediate delta push/pull. (5) **Syntax & Build Fixes:** Fixed corrupted string concatenation backtick on line 830 in `staffUI`; updated `scripts/prepare-www.js` to bundle `diag.js`, `sync.js`, and support semver `10.0.0`; bumped service worker cache to `ncs-v53`.
- **v9.29, 2026-10-24 00:20 (UTC+6) (Claude Sonnet / Gemini):** Admin Prime Wallet Adjustments, Accounts Streamlining & Card Adjustment Settings. (1) **Admin Prime Wallet Adjustments:** MFS and Recharge adjustments entered by Admin are now Prime: `doSaveWalletOpening` never aborts or rejects. The adjustment immediately anchors the actual balance everywhere in the app. Any colliding/invalid entries that subsequently cause a wallet deficit are automatically detected by `checkWalletCollisions()`, routed to the Admin Review Queue (`S.pending`) as `wallet-collision` items, and highlighted with a high-visibility 'Deficit Review' badge in the Accounts table. (2) **Accounts Tab Ergonomics:** Moved the Transaction Details table, Search & Filter bar, and check bars to directly below the New Transaction entry section (`#fsec`), ensuring quick and natural data entry without scrolling past transaction lists. (3) **Section & Card Adjustment Settings (Option C):** Added an Admin-only 'Section & card settings' button under the More tab. Combines quick balance adjustment shortcuts for cash drawer, MFS wallets and recharge balances, with granular dashboard section visibility toggles for both Home and Accounts tabs (persisted in `S.cardSettings` and protected in `LOCAL`). Bumped to `ncs-v52`. Tests: `node --check` syntax validation and simulated execution.

## 8. Bug fix history (newest on top)
Format: YYYY-MM-DD HH:MM (UTC+6) — version — who — what was wrong — cause — fix. Times before this rule was made were recorded as --:--.
- 2026-10-28 01:30 (UTC+6) — v10.0.0-beta — Antigravity / Claude — Handover document had outdated roadmap versions and lacked the explicit auto-sync verification check — v10 release requires strict verification of the `window.save` wrapper to avoid silent sync failures — Updated roadmap to v10.x; added Rule 37 and Immediate Action checklist.
- 2026-10-28 00:25 (UTC+6) — v10.0.0-beta — Antigravity / Claude — Sync pill in top navigation remained stuck on "Pending" with yellow dot and manual clicks did nothing — sync.js never notified setSt() of success/failure, isDirty() remained true because S.synced was bypassed in v2, and sync button / refresh handlers returned early without calling NcsSync — Wired sync.js directly to setSt() on push/pull success and failure; updated isDirty() for v2; delegated manual sync and refresh clicks directly to NcsSync.push(true) and pull().
- 2026-10-27 23:50 (UTC+6) — v10.0.0-beta — Antigravity / Claude — SyntaxError: Invalid or unexpected token at index.html:830 during app boot — A corrupted backtick character was present instead of a single quote after .join('')+'<div...>` on line 830, caused by clipboard formatting — Replaced the stray backtick with a standard single quote before ,async()=>.
- 2026-10-24 23:28 (UTC+6) — v9.29 — Antigravity / Claude — Adjusting Bkash Personal balance incorrectly inflated Nagad balance instead — Anchors stored the already-transaction-processed balance for all wallets at date d; wltRun then applied the anchor as a reset and added all transactions on top again, double-counting them — Nagad transactions appeared twice — Wallet cards are now a pure manual balance sheet: S.wManual stores each wallet balance directly; calcWallets() reads S.wManual; adjustSingleWallet saves only to S.wManual[key]; a Reset to Zero button is included; no transaction computation or anchor system involved.
- 2026-10-24 23:15 (UTC+6) — v9.29 — Antigravity / Claude — Adjusting wallet balance multiple times adds previous amounts on top of each other and the wrong total persists — doSaveWalletOpening always appended a new anchor to S.walletDates without removing an existing anchor for the same date; wltRun and balanceAtDate then applied both anchors sequentially, causing old adjustments to compound with new ones — doSaveWalletOpening now removes any existing anchor for the same date before inserting the new one, so each date can only have one anchor.

## 9. Native apps (Android APK and Windows .exe)
Added 2026-10-19. The PWA is unchanged and still works. The native apps wrap the same files.
- **Build:** GitHub Actions (`.github/workflows/build.yml`) runs on every upload to `main`. It builds only if `APP_VERSION` in `index.html` has no release yet (tag `v<major>.<minor>.<patch>`, e.g. 9.28.1 becomes `v9.28.1`). If a version is not raised, nothing is built.
- **Release contents:** `NCS-Accounts-<v>.apk`, `NCS-Accounts-Setup-<v>.exe`, `latest.yml` and `.blockmap` (Windows updater), `www.zip` and `update.json` (Android live update).
- **No edits to `index.html` for native.** `scripts/prepare-www.js` copies the app to `www/` and injects `native/bridge.js` just before `<script src="config.js"></script>`. **If that script tag is ever removed or changed, the build fails on purpose.** Keep it. In Option A, `.github/workflows/build.yml` runs `npm run prepare-www` which executes `node scripts/build.js && node scripts/prepare-www.js`, compiling `/src` into `index.html` and `www/` automatically.
- **Android:** Capacitor 8 plus `@capgo/capacitor-updater` in manual mode. On start and on resume (max once per 30 min) `bridge.js` reads `releases/latest/download/update.json`, downloads `www.zip`, calls `next()` and shows a "Restart now" bar. A bundle that does not call `notifyAppReady()` is rolled back by the plugin. The bridge also supplies `navigator.share`, blob downloads (saved to cache, then the share sheet), and `window.print` (custom `NativePrint` plugin using Android PrintManager).
- **Windows:** Electron 44, NSIS per-user installer, `electron-updater` from GitHub Releases. The app is served from `app://ncs/`. Unsigned, so SmartScreen warns on first install.
- **Service worker:** switched off in both native apps by `bridge.js` (files are bundled). Still bump `sw.js` cache per rule 1 for the PWA.
- **Storage:** native apps have their own `localStorage`, separate from the PWA. A new device connects with the shop passphrase and syncs from the Sheet.
- **Native changes need a manual APK install:** new Android permission, new Capacitor plugin, new icon. Web code changes never do.
- **Signing key:** GitHub secrets `ANDROID_KEYSTORE_B64` and `ANDROID_KEYSTORE_PASSWORD` (alias `ncs`). The owner keeps the backup. If lost, the phone app must be uninstalled and reinstalled once.
- **Not yet verified on real devices:** Android build in CI, APK install and live update, camera scan in the APK, print dialog on Android, Windows installer and auto-update. Windows app was launched and rendered under a virtual display only.
- **v9.22.2 note:** the sound engine uses the standard Web Audio API, which works in both the Android WebView and Electron. On Android, sounds triggered by background sync can be blocked if no recent tap occurred — that is an OS limit, not a bug. Audio is disabled entirely under reduced motion by design. If sound still fails in the native Android app, the fast fix is to add `android:hardwareAccelerated="true"` to the WebView (already default in Capacitor) and to call `webView.getSettings().setMediaPlaybackRequiresUserGesture(false)` in the Android host — that removes the gesture requirement for programmatic playback.