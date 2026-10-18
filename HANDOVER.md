# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v9.20** (service worker cache `ncs-v40`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

## 0. Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js`, and this `HANDOVER.md`. Never work from an older copy.
2. Read sections 2 and 4 before changing anything.
3. Make one feature per version. Do not refactor unrelated code.
4. At the end: bump the version (section 4, rule 1), update section 7 (session log), and hand back all changed files. **Always deliver complete files, never patches.** If the files are too large to send in one message, split them and reassemble — do not send deltas.
5. **Bug fix command:** every bug you fix must be written into section 8 with date and time (HH:MM, Bangladesh time, UTC+6), version, what was wrong, the cause and the fix. The same entry must also go into the in-app `BUGS` array.

## 1. Files
| File | Purpose |
|---|---|
| `index.html` | The whole app (single file) |
| `sw.js` | Offline cache. Network-first. Cache name `ncs-vN` |
| `manifest.webmanifest` | PWA install info |
| `config.js` | Optional sync preset. Empty on purpose |
| `SolaimanLipi-*.ttf` | Bengali font |
| icons and logos | `icon-*.png`, `logo-*.png` |
| Google Apps Script | Lives in the owner's Google Sheet |

## 2. Architecture
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **Collections:** `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts`. Stamped with `u`, merged by `mergeById`.
- **Other synced keys:** `days`, `names`, `parties`, `log`, `users`, `start`, `walletDates`; `pending` and `history` merged by id.
- **Local-only keys:** theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince, lastBackup.
- **Sync (v9.20):** Google Apps Script blob. Conflict → `mergeState`.
- **Sync status:** single dot, periodic blink (green 6s, yellow 3s, red 2s). Off = static outline.
- **Theme (v9.20):** three modes — `auto` (OS default), `light`, `dark`. Icon button `#themeBtn` in top bar cycles Auto → Light → Dark → Auto. Day/Night removed.
- **Tab transitions (v9.20):** `.view.on` fades in (220ms). Skipped under OS reduced motion.
- **Refresh (v9.20):** two-arrow SVG spins once on tap.
- **Storage warning (v9.20):** only shows on genuine `localStorage.setItem` failure. Dismiss hides it (`style.display='none'`).
- **Reduced motion (v9.20):** auto from OS `prefers-reduced-motion`; no manual toggle.
- **Keeper tabs (v9.20):** Products and More only. POS, Accounts, Ledger hidden.
- **Party kinds (v9.20):** Customer, Investor, Supplier, Borrower/Lender. Kind tabs filter the Ledger list. Legacy Lender/Borrower are treated as Borrower/Lender.
- **Wallet openings (v9.20):** `S.walletDates` array of date-anchored openings (`{d, by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev, discrepancy}`). `S.wallets` is the base opening. `wltRun` resets the wallet balance at each date anchor. Setting an opening for a past date requires Admin PIN and logs a `walletAdjust` entry. Admin sees a discrepancy report if the entered amount differs from the carried-forward balance.
- **Cash adjustment (v9.20):** past-date targets require Admin PIN; Adjustment entries carry `pinBy` and `pinAt`. Present-day adjustments still roll to `nextOpenDay` without PIN.
- **POS void (v9.20):** reason matching `/^test$/i` marks the bill `test:1` and the entry `test:1`; these appear in a "Test" section (admin only) and are excluded from every total. Admin can also "Remove permanently" a voided bill: `b.removed=1`, `e.removed=1`. Removed bills are hidden everywhere.
- **Borrower/Lender transactions (v9.20):** identical rules to Customer — any In/Out with any method (Cash, MFS, Recharge). No special direction.
- **Other architecture:** unchanged from v9.19. See rules 4, 5, 13, 20 for the traps.

## 3. Data model
- **`cust`:** `{id, name, phone, fb?, img?, note, kind?, addr?, rel?, due?, dueNote?, del?, delReason?, dby?, dts?}`. `kind` ∈ Customer, Investor, Supplier, Borrower/Lender (legacy `Lender`/`Borrower` map to Borrower/Lender at read time). `due`/`dueNote` shown as party reminder.
- **`ltx`:** `{id, c, dir, btype?, amt, parts?, d, d2, t, m, who, note, by, eb?, void?, vr, vb, fix?, dupDismissed?, flag?, prop?, voidReq?, l9?, lnk?, le?, ok?, okb?, src?}`.
- **`ltx.flag`:** `{state: pending|cleared|rejected, by, at, reason, cb?, ca?, rb?, ra?, rr?}`.
- **`ltx.prop`:** `{state: pending|approved|rejected, by, at, reason, to, rb?, ra?, rr?}`.
- **`ltx.voidReq`:** `{state: pending|approved|rejected, by, at, reason, rb?, ra?, rr?, vb2?}`.
- **`atts`:** `{id, ref, d, by, at, del?, db?, dt?}`. ref = `'e'+entryId` or `'l'+ltxId`.
- **`walletDates` (v9.20):** `[{d: 'YYYY-MM-DD', by, at, reason, bk, ng, rk, bka, gp, robi, cir, prev: {...}, discrepancy: {...}, pinBy?, pinAt?}]`. Most recent entry ≤ a given date is the active opening. `prev` and `discrepancy` are snapshots of the computed balance at `d` before the override and the difference (so an admin can review a chain of adjustments).
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
- Sync key transport still in GET URLs.
- Bills imported from external POS inbox carry no wallet.
- Sync dot: single dot, periodic blink (v9.20).
- Cashier flags; accountant proposes; admin approves (v9.10–9.16).
- Restore (v9.11) not a full remote rollback.
- Photos live in the synced blob (v9.14); Sheet size tolerance unknown.
- **Wallet opening anchors (v9.20):** the first anchor may be a migration of `S.wallets`. Later anchors override the running balance at their date. Any discrepancy is logged with a snapshot of the computed value.
- **POS Test/Removed (v9.20):** test bills are visible only in the POS Bills dialog filter "Test". Removed bills are hidden everywhere; not even in Test.

## 6. Roadmap

**v9.20 owner feedback round 2: DONE.** POS search no longer prefills stale values. POS voids matching `test` go to a Test section; admin can also permanently remove a voided bill. Refresh no longer logs the session out even if the UI throws during `enter()`. Keeper tabs reduced to Products + More. Party kinds reworked to Customer / Investor / Supplier / Borrower-Lender with kind tabs in the ledger. Wallet openings are date-anchored with admin PIN + discrepancy logging. Past-date cash adjustments require admin PIN.

**v9.19 storage notice, sync dot, theme, transitions, refresh: DONE.**
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
7. Five-colour chart palette (Phase 1b).

**Verification still missing**
- Real multi-device sync against production Apps Script.
- Canvas image compression, camera, statement image, Bengali text in real browser.
- Apps Script / Sheet blob tolerance with `atts`.
- iOS Safari layout, animation, reduced-motion.

**Known limits (v8.7)**
- imo/Facebook links from phone unavailable.
- Some strings English-only.
- Currency via `tk()`.

**Phase 1b**
- Five-colour chart palette. Monospace SKU. Pending blue.

**Phase 2**
- Ledger sheet in Sheets. Sub-accounts.

**Phase 3**
- Split into modules only if asked. Automated smoke test.

## 7. Session log (append newest on top)
- **v9.20, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** Owner feedback round 2 — four bugs and five feature requests. (1) **POS search stale prefill** — `POS.refresh()` now clears `#q.value` (browser autofill or a saved search could prefill it with "Accountant" or any other form value; clearing on every refresh removes that class of bug entirely). (2) **Void test/remove** — `voidBill`'s onOk marks `b.test=1, e.test=1` when reason matches `/^test$/i`. New `removeBillPermanently(b)` requires a reason (admin only), sets `b.removed=1, e.removed=1`; a `removeBill` Change Log entry is written. `billsUI` filters `!b.removed` from the main list and shows a "Test" section for admins. `cash()` and totals never count flagged bills because they are also voided. (3) **Refresh logout fix** — `resume()` now wraps `enter()` in its own try/catch that logs the error to the console but still returns `true` (session valid). This means a UI error no longer ejects the user to the login screen; they see whatever broken view and can report it. (4) **Keeper tabs** — `TABS.keeper=['prod','more']` (POS, Accounts and Ledger removed). (5) **Party kinds** — `ledCust` now offers four kinds only: Customer, Investor, Supplier, Borrower/Lender. Legacy `Lender` / `Borrower` / `Other` continue to display but are grouped under Borrower/Lender via `kindMatch()`. The `ledList` header has a kind filter tab strip (`LK` variable). (6) **Wallet openings date-anchored** — new synced array `S.walletDates`; new helpers `wOpenAt(k, d)`, `walletAdjust()`, `walletAdjustmentReport()`. `wltRun` resets the wallet balance when it crosses each anchor date. Setting an anchor for a past date requires the admin PIN and writes a `walletAdjust` entry with `prev` and `discrepancy` snapshots. `openWltSettings` becomes a management dialog showing anchor history and an "Add opening for a date" form. **Backward compatibility:** if `S.walletDates` is missing but `S.wallets` exists, a single anchor is created at the earliest entry date on first run (idempotent via `S.walletMigrated`). (7) **Past-date adjustments require PIN** — `cashAdjust` checks `td < today` and asks for the admin PIN; approved adjustments store `pinBy`, `pinAt` on the entry. Present-day adjustments still roll to `nextOpenDay` with no PIN. (8) **Borrower/Lender transaction rules** — unchanged logic; with kinds reworked, the customer-style In/Out + any method (Cash, MFS, Recharge) works for these parties exactly as it does for customers. No new validation. `sw.js` cache `ncs-v40`. Not tested in a real browser, against production Apps Script, or multi-device. Because the file was too large to send in one message, `index.html` is delivered in three consecutive messages to be concatenated in order.

- **v9.19, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** Seven owner-reported issues. Storage popup only on real failures; `Dismiss` uses `style.display='none'`. Sync dot single with periodic blink. Motion button removed. Theme = three modes, single icon button in top bar. Tab transitions (220ms). Refresh icon + spin. Self test uses `eval('typeof '+n)`. Review queue Open lands on the correct day. `sw.js` cache `ncs-v39`.
- **v9.18, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Home dashboard (today cash strip, who-owes-whom card, stock value tile). Sample "Load Riyad notes" removed. `sw.js` cache `ncs-v38`.
- **v9.17, 2026-10-18 (Claude Sonnet 5.5):** Change admin PIN, Run self test, VERS.by backfill. `sw.js` cache `ncs-v37`.
- **v9.16, 2026-10-18 (Claude Sonnet 5.5):** Complete admin review queue. `sw.js` cache `ncs-v36`.
- **v9.15, 2026-10-18 (Claude Sonnet 5.5):** Docs/metadata cleanup. `sw.js` cache `ncs-v35`.
- **v9.14, 2026-10-18 (Claude Sonnet 5.5):** Optional receipt photos.
- **v9.13, 2026-10-18 (Claude Sonnet 5.5):** Reduced motion support.
- **v9.12, 2026-10-18 (Claude Sonnet 5.5):** Dashboard clock.
- **v9.11, 2026-10-18 (Claude Sonnet 5.5):** JSON backup restore.
- **v9.10, 2026-10-18 (Claude Sonnet 5.5):** Ledger search, flags, statement, due dates.
- **v9.9, 2026-10-18 (Manus):** Bill-first POS.
- **v9.8, 2026-10-18 (Manus):** Nav/refresh/visual fixes.
- **v9.7, 2026-10-17 (Claude Sonnet 5.5):** Discount percent, speed, model notes.
- **v9.6, 2026-10-17:** Audit hardening.
- **v9.5, 2026-10-16:** Party, carry-forward, review.
- **v9.4 through v8.0:** Historical.

## 8. Bug fix history (newest on top)
Format: `YYYY-MM-DD HH:MM (UTC+6) · version · who · what was wrong · cause · fix`. Times before this rule was made were recorded as `--:--`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · POS search pre-filled with stale content (e.g. "Accountant") on entering the POS tab · `#q` value was never cleared on refresh and could retain browser autofill or a previously typed value · `POS.refresh()` clears `$('q').value` on every enter.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Refresh made the admin log out (same symptom as v8.9.1) · any throw inside `enter()` after `resume()` restored a valid session caused the outer catch to return `false` · `resume()` wraps `enter()` in a nested try/catch that logs the error but still returns `true` so the login screen is not shown; the broken view is visible for reporting.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Voids from POS could not be fully removed and had no test-only pathway · the void flow only set the `void` flag with a reason · `voidBill` now auto-marks `test` reasons; admin gets `removeBillPermanently` with a reason; bills UI shows a "Test" section for admins.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Keeper had too many tabs · `TABS.keeper` included POS which is not part of the keeper workflow · reduced to `['prod','more']`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Wallet opening balances could only be set once and always applied from the beginning · `S.wallets` was a single fixed value · new `S.walletDates` array; `wltRun` resets at each anchor date; management dialog adds/removes anchors with admin PIN on past dates.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Cash adjustments on a past date could be made without PIN or audit · `cashAdjust` posted to `nextOpenDay` without re-verification · past-date targets now require Admin PIN; the `Adjustment` entry stores `pinBy` and `pinAt`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Party kinds did not map to the four groups the owner wanted (Customer, Investor, Supplier, Borrower/Lender) · `cust.kind` was free text with no filter · dropdown restricted to four kinds; `Lender`/`Borrower` treated as `Borrower/Lender`; kind filter tabs in `ledList`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Storage warning card appeared on every entry save and could not be dismissed · `persist()` called `storageNotice()` on every save; the box's inline `display:flex` overrode the `hidden` attribute · `storageNotice` only on real failures; `Dismiss` uses `style.display='none'`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Self test reported false failures for const-bound helpers · `typeof window[name]` cannot see `const` bindings · use `eval('typeof '+name)`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Review queue Open for a reconciliation item jumped to today · `go('acc')` reset `cur` to today internally · call `go('acc')` first, then set `cur`.
- 2026-10-18 --:-- (UTC+6) · v9.18 · Claude Sonnet 5.5 · owner's Claude account · Sample "Load Riyad notes" could appear when the customer list was momentarily empty · button lived in the empty-customers card · removed from the empty-customers card.
- 2026-10-18 --:-- (UTC+6) · v9.16 · Claude Sonnet 5.5 · owner's Claude account · Accountant voids applied directly while edits required approval · v9.10 added proposal flow for edits but not voids · voids become approval requests.
- 2026-10-18 --:-- (UTC+6) · v9.15 · Claude Sonnet 5.5 · owner's Claude account · Upcoming Features card listed v9.8 below v9.5 · v9.8 updated its Planned entry in place · splice out old 9.8, unshift new Done 9.8.
- 2026-10-18 00:56 (UTC+6) · v9.9 · product catalog always visible, competed with cart · fixed two-column workspace · full-width cart, collapsed disclosure.
- 2026-10-18 00:56 (UTC+6) · v9.9 · product ID did not work in search · filtering only checked name/barcode · include ID.
- 2026-10-18 00:32 (UTC+6) · v9.8 · POS/Ledger scaling differed · no explicit reset · normal scale.
- 2026-10-18 00:32 (UTC+6) · v9.8 · Sync showed unwanted outline · inherited border · borderless.
- 2026-10-18 00:32 (UTC+6) · v9.8 · full-page refresh returned to default tab · active view in memory only · sessionStorage per role.
- 2026-10-18 00:32 (UTC+6) · v9.8 · storage warning offered a JSON download · handler serialized state · Dismiss instead.
- 2026-10-17 07:25 (UTC+6) · v9.6 · opening cash could be changed silently · Settings assigned `S.start` directly · require reason, log old/new.
- 2026-10-17 07:25 (UTC+6) · v9.6 · wallet transfers inflated Sell/Buy · categories stored as Sale/Purchase · exclude exact WLTC categories.
- 2026-10-17 07:25 (UTC+6) · v9.6 · Undo could restore entries that made a wallet negative · no balance check · compare pre/post.
- 2026-10-17 07:25 (UTC+6) · v9.6 · stock overrides applied before review · stockMap included pending · exclude pending, approve/reject.
- 2026-10-17 07:25 (UTC+6) · v9.6 · PINs used single SHA-256 and 4 digits · not a KDF · PBKDF2 6+ digits, legacy upgrade, rotate recovery.
- 2026-10-17 07:25 (UTC+6) · v9.6 · local save failures silent · persist swallowed errors · show warning, preserve unreadable data.
- 2026-10-17 07:25 (UTC+6) · v9.6 · product image and CSV could inject markup/formula · raw src and unquoted cells · escape and neutralize.
- 2026-10-16 21:20 (UTC+6) · v9.5 · Start fresh left stale opening cash after sync · higher-epoch branch missed `S.start` · copy remote `S.start`, merge history/pending by id.
- 2026-10-16 21:11 (UTC+6) · v9.5 · patch draft failed parsing · arrow matcher emitted as function declaration · restored arrow, balanced braces.
- 2026-10-16 18:37 (UTC+6) · v9.1 · Accounts tab stayed on previous date · startup used last entry date · reset `cur` at startup and in `go('acc')`.
- 2026-10-16 --:-- · v9.0 · shop name appeared on phone bottom tab · global `.tabs::before` rule · limited to `@media (min-width:900px)`.
- 2026-10-16 --:-- · v8.9.1 · refresh logged every role out · `renderWalletCards()` referenced lists declared after `start()` · lists moved above `start()`; wrapped in try/catch; `resume()` logs.
- 2026-10-16 --:-- · v8.7 · ledger entry dialog did nothing · called POS-private `dlg` and `toast` · switched to `ask`, `ldlg`, `ltoast`.
- 2026-10-15 --:-- · v8.5 · ledger table styled like POS line total · `.lt` belongs to POS · ledger uses `.ltb`.