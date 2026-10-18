# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v9.19** (service worker cache `ncs-v39`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

## 0. Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js`, and this `HANDOVER.md`. Never work from an older copy.
2. Read sections 2 and 4 before changing anything.
3. Make one feature per version. Do not refactor unrelated code.
4. At the end: bump the version (section 4, rule 1), update section 7 (session log), and hand back all changed files, including this one. **Always deliver complete files, not patches. The owner asked for this explicitly.**
5. **Bug fix command:** every bug you fix must be written into section 8 with date and time (HH:MM, Bangladesh time, UTC+6), version, what was wrong, the cause and the fix. The same entry must also go into the in-app `BUGS` array.

## 1. Files
| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS and JS in one file, about 100 KB) |
| `sw.js` | Offline cache. Network-first. Cache name `ncs-vN` |
| `manifest.webmanifest` | PWA install info |
| `config.js` | Optional sync preset. Currently empty on purpose |
| `SolaimanLipi-*.ttf` | Bengali font. Must sit next to `index.html` |
| icons and logos | `icon-*.png`, `logo-*.png` |
| Google Apps Script | Lives in the owner's Google Sheet, not in this folder |

## 2. Architecture
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **Collections:** `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts`. The list is `COLS`. Stamped with `u` and merged by `mergeById`.
- **Other synced keys:** `days`, `names`, `parties`, `log`, `users`, `start`; `pending` and `history` merged by id.
- **Local-only keys:** theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince, motion, lastBackup.
- **Sync:** Google Apps Script. One text blob with a revision number. `mergeState` on conflict.
- **Sync status (v9.19):** `#sync` in the top bar shows a single dot (10px circle) plus a text label. The dot blinks briefly every few seconds (green 6s, yellow 3s, red 2s). No expanding ring. `off` is a static outline.
- **Theme (v9.19):** three modes only — `auto` (OS default), `light`, `dark`. Single top-bar icon button (`#themeBtn`) cycles Auto → Light → Dark → Auto. Icons: half-filled circle (auto), sun (light), moon (dark). Day/Night mode is removed.
- **Storage warning (v9.19):** only appears when `localStorage.setItem` actually fails. Informational messages (backup reminders, recovery-copy notices) are no longer shown as popups.
- **Reduced motion (v9.13, extended v9.19):** automatic from OS `prefers-reduced-motion`; no manual button. Animations shorten when OS setting is on.
- **Tab transitions (v9.19):** `.view.on` fades in (opacity 0→1, translateY 6px→0) over 220ms. Skipped when OS prefers reduced motion.
- **Refresh button (v9.19):** icon is a clean two-arrow circular refresh; SVG rotates once (650ms) on tap.
- **Audit hardening (v9.6):** opening cash reason + log; wallet-transfer categories excluded from Sell/Buy totals; PBKDF2 PINs with 6+ digits; local-save warnings.
- **Navigation:** `TABS` (per role), `TL`, `ICO`, `go(view)`. Views are `.wrap.view` divs.
- **POS workflow (v9.9):** full-width cart; product catalog collapsed behind `#productPanel`; search on Name/ID/Barcode.
- **Roles:** admin, accountant, keeper, cashier. Cashier can flag ledger entries but not edit or void. Accountant edits and voids become proposals; only Admin approves both. One review queue (`reviewQueue`, `reviewQueueCount`).
- **Helpers:** global `ask`, `lg`, `ltoast`, `esc`, `tk`, `n`, `sd`, `t12`, `iso`, `dlFile`. POS-private: `dlg`, `toast`, `stockMap`. `POS.stockMap()` is exposed (v9.18).
- **Force logout all:** `S.rebootN` counter.
- **Cash adjust:** visible button on Cash card (`cashAdjust`).
- **Wallets:** seven balances from `WLTC`. `wltEff`, `wltRun`, `checkWalletLimit`.
- **Ledger linked to cash flow:** `ledReconcile` inside `save()`.
- **Check tag:** `ledChk`, `entChk`.
- **Upcoming Features:** `UPC` array.
- **Language:** `tx()` for older screens, `lb()` for ledger/version.

## 3. Data model
- **`cust`:** name, phone, fb, img, note, kind, addr, rel, due, dueNote, del, delReason.
- **`ltx`:** id, c, dir, btype, amt, parts, d, d2, t, m, who, note, by, eb, void, vr, vb, fix, dupDismissed, flag, prop, voidReq.
- **`ltx.flag`:** state pending/cleared/rejected, by, at, reason, cb, ca, rb, ra, rr.
- **`ltx.prop`:** state pending/approved/rejected, by, at, reason, to, rb, ra, rr.
- **`ltx.voidReq`:** state pending/approved/rejected, by, at, reason, rb, ra, rr, vb2.
- **`atts`:** id, ref, d, by, at, del, db, dt.
- **Party balance:** sum of in − out over non-void. Positive = we owe.
- **`entries`:** daily accounts. `cash()` and `calc()`.
- **Stock override:** `adminCheck`, `adminChecked`, `adminRejected`, `target`.

## 4. Rules (do not break)
1. **Every release:** bump `APP_VERSION`, add `VERS` entry, bump `sw.js` cache, add section 7 line, sync `UPC`/`BUGS`.
2. **Synced data into `COLS`.** Always `save()`.
3. **Never hard-delete money records.**
4. **Ledger ↔ cash only through `ledReconcile()`.**
5. **Permissions:** ledger = admin, accountant, cashier. Cashier = add+flag. Accountant = propose (edit or void). Admin = approve/reject. Management tab = admin. Party edit/archive = admin.
6. **Escape all user text** with `esc()`.
7. **CSS clash awareness** (`.lt` belongs to POS).
8. **Dates ISO**, shown with `sd()`.
9. **Secrets** never in files.
10. **`node --check` before handback.**
11. Search for existing classes.
12. Dark mode: no green accents. Tokens only.
13. **Scope trap:** POS-private `dlg`, `toast`, `stockMap` are NOT global. `POS.stockMap()` exposed.
14. **Parallel merge:** three-way; conflicts in `APP_VERSION`, `VERS`, `UPC`, `sw.js` cache.
15. Capitalise labels. "Bkash" not bKash.
16. Shop name is `shopN()`.
17. `n()` is formatter, not parser.
18. Wallet category names are stored values.
19. Wallet limit checks in `checkWalletLimit`.
20. Startup order: `applyLang();start();` at bottom.
21. No module-level `var` in `save()`/`render()` paths.
22. Ledger-linked entries read-only in Accounts.
23. Purchases never saved as Due.
24. Sync dot colours fixed: green/yellow/red/hollow.
25. Record who built it (`by`/`w`).
26. Measure before optimising.
27. Long lists use paging.
28. VERS.by backfill (DONE for v9.0–v9.4 in v9.17).
29. **Theme has exactly three modes (v9.19):** `auto`, `light`, `dark`. Day/Night is removed. Set via the top-bar `#themeBtn` cycle. `applyTheme()` reads `S.theme` and normalises anything unexpected to `auto`.

## 5. Known quirks
- Start fresh carries balances forward, retains party ledger/stock, queues an Admin reconciliation item.
- Bkash Personal moves `bk`, Bkash Agent moves `bka`.
- Due purchases impossible for new entries (v9.3); old ones get Check tag.
- Change Log keeps 500 lines.
- Admin has 6 bottom tabs.
- Sample "Load Riyad notes" removed in v9.18; `ledSample()` unreachable.
- v9.6 excludes wallet-transfer categories from Sell/Buy.
- v9.6 Undo checks wallet balances.
- Exact stock overrides excluded from stock totals while pending.
- **Sync key transport still in GET URLs.**
- Bills imported from external POS inbox carry no wallet.
- Entries before v8.9 with pay Mobile Banking have no `w`.
- **Sync indicator (v9.19):** single dot, periodic blink; OS-level `prefers-reduced-motion` disables blink.
- Cashiers flag; accountant proposes; admin approves.
- Restore (v9.11) not a full remote rollback.
- Photo attachments (v9.14) live in synced blob; Sheet limit unknown.

## 6. Roadmap

**v9.19 storage notice, sync dot, theme, transitions, refresh: DONE.** (1) Storage popup fixed: only shows on real save failures; Dismiss uses `style.display='none'`; backup reminders removed. (2) Sync dot single, periodic blink. (3) Motion button removed; OS auto-detect kept. (4) Theme = three modes with single top-bar icon. Day/Night removed. (5) Tab transitions via CSS. (6) Refresh icon + spin. (7) Self test `eval('typeof '+n)` fix. (8) Review queue Open day fix.

**v9.18 Home dashboard: DONE.**

**v9.17 admin PIN change, self test, by backfill: DONE.**

**v9.16 review queue complete: DONE.**

**v9.15 docs cleanup: DONE.**

**v9.14 receipt photos: DONE.**

**v9.13 reduced motion: DONE.**

**v9.12 dashboard clock: DONE.**

**v9.11 restore: DONE.**

**v9.10 ledger search, flags, statement, due dates: DONE.**

**v9.9 POS bill-first: DONE.**

**v9.8 nav/refresh/visual: DONE.**

**v9.7 discount percent/speed: DONE.**

**v9.6 audit hardening: DONE.**

**v9.5 party/carry-forward: DONE.**

**v9.3 no due purchases: DONE.**

**v9.0 ledger-cash link: DONE.**

**v8.9 wallets: DONE.**

**Still open (next)**
1. Sync key rotation (needs Apps Script).
2. Send only changed records (needs Apps Script).
3. Effectiveness pass (owner to specify which taps per role).
4. Optional Ledger sheet in Google Sheets (Apps Script).
5. Sub-accounts or linked customers.
6. Split `index.html` into modules only if owner asks.
7. Five-colour chart palette (Phase 1b) — v9.8 scope is done.

**Verification still missing**
- Real multi-device sync against production Apps Script.
- Canvas image compression, camera, statement image, Bengali text in real browser.
- Apps Script / Sheet blob tolerance with `atts`.
- iOS Safari layout, animation, reduced-motion.

**Known limits (v8.7)**
- imo/Facebook links from phone unavailable.
- Some strings English-only.
- Currency symbol via `tk()`.
- Per-device sync settings.

**Phase 1b**
- Five-colour chart palette. Monospace SKU/barcode. Pending blue for supplier orders.

**Phase 2**
- Optional Ledger sheet in Google Sheets.
- Sub-accounts or linked customers.

**Phase 3**
- Split `index.html` only if owner asks.
- Automated smoke-test page.

## 7. Session log (append newest on top)
- **v9.19, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Seven owner-reported issues plus two bugs found in review. (1) Storage warning card no longer shown on every save: `persist` only calls `storageNotice` on actual `localStorage.setItem` failure, and the box uses `style.display` for hide/show instead of the `hidden` attribute (which had been overridden by inline `display:flex`). Dismiss sets `display:none` instead of `hidden=true`. `recoveryNotice` variable removed entirely. Backup reminder message removed (owner said backup is available from Management). (2) Sync status indicator simplified to a single dot with a periodic opacity blink: `.sdot` no longer has a `:after` expanding ring; `@keyframes sdotPulse` gives one brief dip every few seconds. Colour and label unchanged. (3) Motion button removed (`applyMotion` no longer checks `S.motion`; the button and its click handler are gone; the label in `#moreList` and the `BN['Motion: Auto'/'Reduced']` entries are gone). OS `prefers-reduced-motion` still detected via `matchMedia` and applied to `data-rm`, so `.view.on` animations and the sync pulse stop. (4) Theme system reduced to three modes: `auto`, `light`, `dark`. Day/Night removed from `applyTheme` and from the click handler. Old `S.theme='daynight'` values are normalised to `auto` on first apply. (5) Single theme button (`#themeBtn`) added to `#topR` in the top bar; shows the current mode's icon (half-circle for auto, sun for light, moon for dark). Click cycles auto → light → dark → auto. The old theme button inside `.nav` and its `#theme` entry in `moreList` are removed; the old `MODES` array is removed. (6) Tab transitions: `.view.on{animation:viewIn .22s ease}` with `@keyframes viewIn` (fade + 6px slide-up). Skipped under `data-rm`. (7) Refresh: cleaner two-arrow SVG; `refreshCurrentView` adds `.spin` to the SVG on click and removes it after 650ms. `@keyframes spinRefresh` rotates once. Skipped under `data-rm`. (8) `selfTest` "Core functions" check now uses `eval('typeof '+n)` instead of `typeof window[n]`, so it can see `const` bindings (previously ~8 false FAILs). (9) `reviewQueue` Open for a reconciliation item with `details.entry` now calls `go('acc')` first, then sets `cur`, then `reset();render()` — previously `go('acc')` reset `cur` to today and the Open landed on the wrong day. `sw.js` cache `ncs-v39`. Not tested in a real browser, against production Apps Script, or multi-device.
- **v9.18, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Home dashboard + sample removal. (1) `#hToday` strip (cash in/out/net/count, cash-only). (2) `#hOwe` card via `lStat` per party. (3) Stock value tile via exposed `POS.stockMap()`. (4) Sample "Load Riyad notes" removed from `ledList` (function remains defined but unreachable). `sw.js` cache `ncs-v38`. Tested in jsdom.
- **v9.17, 2026-10-18 (Claude Sonnet 5.5):** Change admin PIN, Run self test, VERS.by backfill for v9.0–v9.4. `sw.js` cache `ncs-v37`. Not tested in a real browser.
- **v9.16, 2026-10-18 (Claude Sonnet 5.5):** Complete admin review queue. Cashier flags can be rejected; accountant voids become approval requests (`ledVoidReq`, `ledVoidReqReview`); `ledTx` shows correct per-role actions. `sw.js` cache `ncs-v36`.
- **v9.15, 2026-10-18 (Claude Sonnet 5.5):** Documentation and metadata cleanup. `sw.js` cache `ncs-v35`.
- **v9.14, 2026-10-18 (Claude Sonnet 5.5):** Optional receipt photos (`atts`); manual backup note in Settings.
- **v9.13, 2026-10-18 (Claude Sonnet 5.5):** Reduced motion support.
- **v9.12, 2026-10-18 (Claude Sonnet 5.5):** Dashboard clock.
- **v9.11, 2026-10-18 (Claude Sonnet 5.5):** JSON backup restore.
- **v9.10, 2026-10-18 (Claude Sonnet 5.5):** Ledger search, flags, statement image, due dates.
- **v9.9, 2026-10-18 (Manus):** Bill-first POS.
- **v9.8, 2026-10-18 (Manus):** Navigation, refresh and visual fixes.
- **v9.7, 2026-10-17 (Claude Sonnet 5.5):** Discount percent, speed, model notes.
- **v9.6, 2026-10-17:** Audit hardening.
- **v9.5, 2026-10-16:** Party, carry-forward, review.
- **v9.4 through v8.0:** Historical (see prior handovers in this section).

## 8. Bug fix history (every profile must append here, newest on top)
Format: `YYYY-MM-DD HH:MM (UTC+6) · version · who · what was wrong · cause · fix`. Times before this rule was made were not recorded and are shown as `--:--`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Storage warning card appeared on every entry save and could not be dismissed (blocking the POS Charge button on mobile) · `persist()` called `storageNotice()` on every successful save with an empty message, and the notice box had inline `display:flex` which overrode the `hidden` attribute; `Dismiss` also set `hidden`, which had no effect · `storageNotice` is only called on genuine save failures; hidden state now uses `style.display`; `Dismiss` sets `display:none`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Self test reported false failures for const-bound helpers · `selfTest` used `typeof window[name]`, which cannot see `const` bindings inside a classic `<script>` · use `eval("typeof " + name)` so the check runs in the current lexical scope.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Review queue Open for a reconciliation item jumped to Accounts on today instead of the entry's date · the handler set `cur` before `go('acc')`, but `go('acc')` resets `cur` to today internally · call `go('acc')` first, then set `cur` and render.
- 2026-10-18 --:-- (UTC+6) · v9.18 · Claude Sonnet 5.5 · owner's Claude account · Sample "Load Riyad notes" button could still appear when the customer list was momentarily empty · button lived in the empty-customers card and only required the list to be empty · removed the button from the empty-customers card.
- 2026-10-18 --:-- (UTC+6) · v9.16 · Claude Sonnet 5.5 · owner's Claude account · Accountant voids applied directly while edits required approval · v9.10 added the proposal flow for edits but not voids · accountant voids now create a pending request; Admin approves or rejects with a reason.
- 2026-10-18 --:-- (UTC+6) · v9.15 · Claude Sonnet 5.5 · owner's Claude account · Upcoming Features card listed v9.8 below v9.5 · v9.8 build updated its existing Planned entry in place · splice the old 9.8 entry out and unshift a fresh Done 9.8.
- 2026-10-18 00:56 (UTC+6) · v9.9 · POS product catalog remained always visible and competed with the bill/cart · products and bill shared a fixed two-column workspace · full-width cart, collapsed disclosure.
- 2026-10-18 00:56 (UTC+6) · v9.9 · product ID did not work in POS search · filtering checked only name/barcode · include product ID.
- 2026-10-18 00:32 (UTC+6) · v9.8 · POS/Ledger scaling differed from other tabs · no explicit reset · normal scale on those views.
- 2026-10-18 00:32 (UTC+6) · v9.8 · Sync showed an unwanted outline · inherited ghost-button border · remove the resting outline.
- 2026-10-18 00:32 (UTC+6) · v9.8 · full-page refresh returned to the role's default tab · active view lived only in memory · sessionStorage per role.
- 2026-10-18 00:32 (UTC+6) · v9.8 · "Download current data" in the storage warning created an unwanted JSON download · click handler serialized app data · replace with Dismiss.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Opening cash could be changed with no reason, shifting every historical balance · Settings assigned `S.start` directly · require a reason and log old/new values.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Wallet top-ups/cash-outs inflated Sell/Buy totals · wallet categories are stored as Sale/Purchase · exclude exact `WLTC` categories from operational totals.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Undo could restore entries that made a wallet negative · Undo restored its snapshot without wallet check · compare pre/post balances.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Exact stock overrides affected stock before Admin review · `stockMap` included pending movements · exclude pending/rejected; approve/reject actions; recalculate target on approve.
- 2026-10-17 07:25 (UTC+6) · v9.6 · PINs used one-round SHA-256 and 4 digits · not a password-hardening KDF; recovery not rotated · PBKDF2-SHA-256 + 6+ digits; legacy upgrade; rotate recovery.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Local storage failures were silent and invalid JSON could be replaced by seed · `persist()` swallowed write errors · show a save warning, preserve unreadable data.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Product image attributes and CSV exports could interpret user text as markup or spreadsheet formulas · image `src` interpolated raw; CSV only escaped quotes · escape image source, neutralize formula-leading text.
- 2026-10-16 21:20 (UTC+6) · v9.5 · Start fresh left stale opening cash on other devices after sync · higher-epoch branch did not copy remote `S.start` · copy remote `S.start`; merge `history` and `pending` by id.
- 2026-10-16 21:11 (UTC+6) · v9.5 · Initial v9.5 patch draft failed JavaScript parsing · arrow matcher emitted as function declaration + extra brace · restored arrow form, balanced braces, `node --check` and jsdom verified.
- 2026-10-16 18:37 (UTC+6) · v9.1 · this profile · Accounts tab stayed on the previous date instead of Today · startup used the last entry date and `go('acc')` only called `render()` · `cur` reset at startup and in `go('acc')`.
- 2026-10-16 --:-- · v9.0 · this profile · Shop name appeared on the phone bottom tab bar · global `.tabs::before` rule · moved into `@media (min-width:900px)`.
- 2026-10-16 --:-- · v8.9.1 · this profile · Refresh logged every role out · `renderWalletCards()` used lists declared after `start()` · lists moved above `start()`; wallet cards wrapped in try/catch; `resume()` logs failures.
- 2026-10-16 --:-- · v8.7 · this profile · Ledger entry dialog and summary silently did nothing · called POS-private `dlg` and `toast` · switched to `ask`, `ldlg`, `ltoast`.
- 2026-10-15 --:-- · v8.5 · other profile · Ledger table styled like the POS line total · `.lt` belongs to the POS · ledger table uses `.ltb`.