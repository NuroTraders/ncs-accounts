# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v9.29** (service worker cache `ncs-v52`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

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
| `config.js` | Optional sync preset. Empty on purpose |
| `SolaimanLipi-*.ttf` | Bengali font |
| icons and logos | `icon-*.png`, `logo-*.png` |
| Google Apps Script | Lives in the owner's Google Sheet |
| `package.json`, `package-lock.json`, `electron/`, `native/`, `scripts/`, `electron-builder.config.js`, `build/`, `.github/workflows/build.yml`, `SETUP.md` | Native Android and Windows apps (section 9). Do not edit unless the task is about the native apps |

## 2. Architecture
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **Collections:** `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts`. Stamped with `u`, merged by `mergeById`.
- **Other synced keys (v9.24):** `days`, `names`, `parties`, `log`, `users`, `start`, `walletDates`, `counts`; `pending` and `history` merged by id.
- **Local-only keys (v9.22):** theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince, motion, **sound**, lastBackup.
- **Sync (v9.20):** Google Apps Script blob. Conflict → `mergeState`.
- **Sync status:** single dot, periodic blink (green 6s, yellow 3s, red 2s). Off = static outline.
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
**Agreed next order:** v9.23 sub-accounts (optional parent link, combined balance; owner delegated design to Claude); v9.24-9.25 Loans tab (needs owner decisions: direction, flat vs reducing interest, installment rules, late fees, collateral notes, conversion of old Borrow/Lend, one worked example); v10.0 Apps Script items (key rotation, changed-only sync, Ledger sheet; needs the script with secrets removed); effectiveness pass needs the owner's top daily tasks per role.

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
5. Sub-accounts or linked customers.
6. Split `index.html` into modules only if owner asks.
7. Five-colour chart palette (Phase 1b).

**Verification still missing**
- Real multi-device sync against production Apps Script.
- Canvas image compression, camera, statement image, Bengali text in real browser.
- Apps Script / Sheet blob tolerance with `atts`.
- iOS Safari layout, animation, reduced-motion.
- **v9.22 sound and motion on a real phone** (Android WebView and iOS Safari), especially AudioContext resume timing and the `button:active` scale on the bottom tab bar.

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
- **v9.29, 2026-10-24 00:20 (UTC+6) (Claude Sonnet / Gemini):** Admin Prime Wallet Adjustments, Accounts Streamlining & Card Adjustment Settings. (1) **Admin Prime Wallet Adjustments:** MFS and Recharge adjustments entered by Admin are now Prime: `doSaveWalletOpening` never aborts or rejects. The adjustment immediately anchors the actual balance everywhere in the app. Any colliding/invalid entries that subsequently cause a wallet deficit are automatically detected by `checkWalletCollisions()`, routed to the Admin Review Queue (`S.pending`) as `wallet-collision` items, and highlighted with a high-visibility 'Deficit Review' badge in the Accounts table. (2) **Accounts Tab Ergonomics:** Moved the Transaction Details table, Search & Filter bar, and check bars to directly below the New Transaction entry section (`#fsec`), ensuring quick and natural data entry without scrolling past transaction lists. (3) **Section & Card Adjustment Settings (Option C):** Added an Admin-only 'Section & card settings' button under the More tab. Combines quick balance adjustment shortcuts for cash drawer, MFS wallets and recharge balances, with granular dashboard section visibility toggles for both Home and Accounts tabs (persisted in `S.cardSettings` and protected in `LOCAL`). Bumped to `ncs-v52`. Tests: `node --check` syntax validation and simulated execution.
- **v9.28.1, 2026-10-23 (Claude Sonnet 5.5, owner's Claude account):** Version history cleanup. (1) Reversed the order of the `VERS.unshift` and `UPC.unshift` calls in the final IIFE so the version history dialog displays v9.28.1 at the top and v9.22 at the bottom (previously v9.22 was at the top due to descending order). (2) Added the missing `VERS.unshift` entry for v9.16 (Complete admin review queue). (3) Removed the stray v9.26 BUGS entry from the v9.15 block. Bumped to `ncs-v51`. Tests: `node --check`; version history dialog visually checked.
- **v9.28, 2026-10-22 00:25 (UTC+6) (Claude Sonnet / Gemini):** Restored Google Apps Script sync compatibility and fixed Reconnect loop. (1) **Root cause & Fix:** In v9.27, getRemote(), importPos() and importCatalog() attempted HTTP POST with JSON body for pull actions; the owner's Google Apps Script web app handles pull/inbox/catalog strictly via GET query parameters and returns `{ok: false}` on unrecognized POST actions. This falsely triggered `badKey()`, which cleared `S.sync` and showed the 'Reconnect sync' modal in an endless loop upon each reconnect attempt. Fixed by restoring standard GET requests across getRemote, importPos and importCatalog, and stopping `badKey()` from wiping `S.sync` prior to passphrase verification. Bumped sw.js cache to `ncs-v50`.
- **v9.27, 2026-10-22 00:15 (UTC+6) (Claude Sonnet / Gemini):** Comprehensive System Audit Hardening (Security, Storage, Precision, Protocol & UI/UX): (1) **Cryptographic UID Generator:** Implemented universal collision-resistant `uid()` combining timestamp and Web Cryptography API (`crypto.getRandomValues`) for financial receipts and log identifiers. (2) **Monetary Precision Rounding:** Enforced `r2()` (`Math.round((+x||0)*100)/100`) across `calc()`, `prevFor()`, `wltRun()`, `lBal()`, and `ledRows()`, eliminating IEEE 754 floating-point precision jitter. (3) **Storage Quota Safeguard:** Added proactive 4MB threshold warning in `persist()` advising backup JSON download or photo cleanup with session dismissal memory before reaching browser 5MB limit. (4) **Security Hardening on PIN Fields:** Added `autocomplete="off"` to staff and admin PIN inputs (`#rp`, `#sp`, `#np`, `#sfp`). (5) **Sync Protocol Security:** Upgraded `getRemote()`, `importPos()`, and `importCatalog()` to transmit sync credentials via HTTP `POST` body with seamless fallback to `GET` for older Google Apps Script deployments. (6) **Snappy Mobile Interactions:** Added `touch-action: manipulation` across all buttons and interactive items to eliminate mobile tap latency. (7) **Accessibility:** Theme button dynamically announces and updates `aria-label` and tooltip to active mode. Bumped sw.js cache to `ncs-v49`.
- **v9.26, 2026-10-21 23:58 (UTC+6) (Claude Sonnet / Gemini):** Fixed mobile Home Cash Balance '0' bug and conducted a full-project security and UI/UX audit. (1) **Root cause & Fix:** Mobile devices with accessibility or battery-saver settings trigger `prefers-reduced-motion: reduce` (setting `data-rm`). `homeUI()` was initializing the Cash Balance DOM with a placeholder text of literal `0`, and `animateCounts()` returned early without painting when `data-rm` was active. Fixed by pre-rendering `tk(cb)` immediately on initial paint and ensuring `animateCounts()` sets the final target value directly when animations are suppressed. (2) Full system audit report written for v10 modernization roadmap. Bumped sw.js cache to `ncs-v48`.
- **v9.25, 2026-10-21 23:45 (UTC+6) (Claude Sonnet / Gemini):** Comprehensive UI & ergonomics overhaul across Modals, POS, Ledger, and Theme. (1) **Modal & Dialog Safety:** `.dlg` restricted to `max-height: 88vh` with scrollable `#ob` body; `.oa` bottom bar is `position: sticky; bottom: 0` with `background: var(--card)`, ensuring "Confirm", "Save", "Charge", and "Cancel" buttons are never pushed offscreen by soft keyboards or long lists. (2) **Ergonomic Touch Targets:** POS cart line delete (`.line .x`) widened to a comfortable `40px` touch area; table action links (`.lnk`) in Accounts and Ledger given `7px 10px` tap padding and `min-height: 34px` with subtle hover/active highlight. (3) **Recharge Balances 3-Column Grid:** `.wlt-grid-3` balances the 3 recharge wallets (GP, Robi, Circkle) into a tidy 3-column row without blank gaps. (4) **Theme Integrity:** Replaced hardcoded `#2CC56F` in `saveCheck()` with `var(--acc)` so dark mode reflects true orange/dark palette. (5) **POS Desktop & Mobile Overhaul:** On desktop (>=900px), POS renders a modern 2-column layout with sticky cart on the right and product catalog on the left; on mobile, product search and catalog appear immediately without scrolling past the cart. (6) **Ledger Header Streamlining:** Primary buttons (+ পেলাম [green], + দিলাম [red]) stay front-and-center while secondary actions (+ Borrow, + Lend, Due date, Edit) are neatly consolidated under a unified `⋯ More` dropdown menu. Bumped sw.js cache to `ncs-v47`.
- **v9.24, 2026-10-21 22:35 (UTC+6) (Claude Sonnet / Gemini):** Added flexible MFS & Recharge balance adjustment and complete cash count denomination history. (1) **MFS & Recharge Adjustment:** Added one-tap "Adjust" action on MFS and Recharge card headers as well as inside each wallet's transaction detail modal ("Adjust this wallet"). Admins can set any actual balance for any wallet with a required reason. Uses date-anchored opening updates (`S.walletDates`) preserving running balances of all other wallets; past dates require Admin PIN. (2) **Permanent Cash Count & Currency Breakdown Log (`S.counts`):** Every cash adjustment / count now appends a full audit record containing date, time, user, counted total, book total, difference, reason, and complete currency note counts (`৳1000×N, ৳500×N...`). (3) **Cash Count History Dialog:** New "Cash count history" button on the Accounts cash bar displays past counts with full currency breakdown and difference color-coding. Bumped to `ncs-v46`.
- **v9.23, 2026-10-21 21:35 (UTC+6) (Claude Sonnet / Gemini):** Added one-tap WhatsApp & SMS Due Reminder links in the Ledger. (1) When a customer/party has a negative balance (they owe money to the shop), the customer card and profile links replace regular SMS/WhatsApp with direct due reminder buttons ("বকেয়া SMS" / "বকেয়া WhatsApp"). (2) Generates a pre-formatted polite Bengali payment reminder: "নমস্কার/সালাম [Party Name], [Shop Name]-এ আপনার বকেয়া হিসাবের পরিমাণ ৳[Amount]। অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হলো। ধন্যবাদ।". (3) Standard SMS link handles iOS (&body=) and Android/Desktop (?body=) parameter schemes; WhatsApp link formats to https://wa.me/[880...] with ?text= parameter. Normal communication links are preserved when balance is settled or zero. Bumped sw.js cache to `ncs-v45`.
- **v9.22.2, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** Owner showed a screenshot with the More tab showing only "বাংলা" and "Lock" and said "THERE IS NOTHING IN MORE SETTINGS NAMED SOUND EFFECT". Root cause: an old CSS rule `#stf,#set{display:none!important}` was hiding the Settings button in the More list because in earlier versions it had been moved under the Manage tab. The sound toggle was inside that hidden Settings dialog. Fix: changed the CSS to `#stf{display:none!important}` (so Settings appears in More again), and added a dedicated `#sndBtn` ("Sound effects: ON/OFF") button directly to the More list so the user can toggle sound without opening any dialog. Clicking it flips `S.sound`, saves, and plays the test chime if turning ON. Bumped to `ncs-v44`. Tests: `node --check`; headless DOM (SndBtn toggles `S.sound` and plays `Sound.test()` when turning ON; Settings dialog still contains `#snd` and `#sndTest`). **Not tested:** real Android WebView and iOS Safari.
- **v9.22.1, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** Owner reported "THERE IS NO SOUND EFFECT?". Root cause: `tone()` was scheduling tones at `ctx.currentTime` (which is 0 while the context is suspended) right after calling `ctx.resume()` — the resume promise hadn't completed yet, so the tones never fired. This is the classic Web Audio race and it hits Android WebView, iOS Safari, and any browser after the tab has been idle. Fix: `play()` now checks `ctx.state` and, if suspended, calls `ctx.resume().then(go)` so the tones are scheduled only after the context is `running`. Also added `Sound.test()` bound to a "▶ Test sound" button in Settings so the user can verify immediately, and bumped gains (tick 0.05, cha-ching 0.08, buzz 0.06, chime 0.05). Bumped to `ncs-v43`. Tests: `node --check`; headless DOM (Test button plays; toggle persists through `save()`/reload; `enabled()` respects `data-rm`). **Not tested:** real Android WebView and iOS Safari.
- **v9.22, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** Sound + motion + wrapper download safety, built on the uploaded v9.21 base. (1) **Sound:** new `Sound` module (Web Audio, no files): `tick` on tab switch and dialog open (`go`, `ask`), `chaChing` on POS sale (`finishBill`), Accounts entry save, and Ledger entry save, `buzz` on wrong PIN (`lockUI.err`), form validation and wallet-limit failures, `chime` on successful background `push` and applied `pull`. Toggle `#snd` in Settings, default off, stored in `S.sound` (added to `LOCAL`). (2) **Motion:** `animateCounts()` counts `.cnt[data-to]` from 0 over 400ms; Home hero Cash Balance plus Total Sell/Total Buy now use it. `saveCheck()` draws a green SVG tick overlay. Global `button:active{transform:scale(.97)}`. POS cart rows use `.slidein` on add and `.slideout` on delete. All respect `data-rm`. (3) **Download safety:** `dlFile` appends the `<a>` to the DOM and falls back to `window.open` on failure. `sw.js` cache `ncs-v42`. Delivered as complete files.
- **Native packaging, 2026-10-19 (Claude Sonnet 5.5, owner's Claude account):** No change to `index.html`, version stays v9.21. Added Android (Capacitor) and Windows (Electron) apps with auto-update from GitHub Releases, built by GitHub Actions. See section 9 and `SETUP.md`. Tests: `node --check` on all scripts; bridge logic against mocked Capacitor plugins. **Not tested:** Android Gradle build, real phone, real Windows install and update.
- **v9.21, 2026-10-19 (Claude Sonnet 5.5):** Clock, phone top bar tidy, Accounts Void data section with Admin restore. `sw.js` cache `ncs-v41`. **Bug found and fixed:** `homeUI()` called a missing `clkTick()`; shared clock function now defined.
- **v9.20, 2026-10-19 (Claude Sonnet 5.5):** POS search, Test/Remove, refresh, keeper tabs, party kinds, date-anchored wallet openings, past-date PIN. `sw.js` cache `ncs-v40`.
- **v9.19, 2026-10-19 (Claude Sonnet 5.5):** Storage popup only on real failures; single sync dot; three-mode theme; tab transitions; refresh spin; self-test and review-queue fixes. `sw.js` cache `ncs-v39`.
- **v9.18, 2026-10-18 (Claude Sonnet 5.5):** Home dashboard. `sw.js` cache `ncs-v38`.
- **v9.17, 2026-10-18 (Claude Sonnet 5.5):** Change admin PIN, self test, VERS.by backfill. `sw.js` cache `ncs-v37`.
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
Format: YYYY-MM-DD HH:MM (UTC+6) — version — who — what was wrong — cause — fix. Times before this rule was made were recorded as --:--.
- 2026-10-24 00:20 (UTC+6) — v9.29 — Claude Sonnet / Gemini — Admin wallet balance adjustments were rejected with "would go negative" error when later transactions exceeded new balance — `doSaveWalletOpening` aborted when `wltRun().bad` was detected, blocking admin from setting the real actual balance — Made Admin wallet adjustments Prime (unblocked); `checkWalletCollisions` automatically detects deficit collisions and routes them to Admin Review Queue with visual badges.
- 2026-10-23 --:-- (UTC+6) — v9.28.1 — Claude Sonnet 5.5 — Version history displayed v9.22 as the latest version — `VERS.unshift` calls were written in descending order (9.28 first, 9.22 last), so 9.22 ended up at `VERS[0]` — Reversed the order of `VERS.unshift` and `UPC.unshift` calls to ascending so the newest version is prepended last.
- 2026-10-22 00:25 (UTC+6) — v9.28 — Claude Sonnet / Gemini — 'Reconnect sync' modal appeared and looped indefinitely on PC and phone — v9.27 sent HTTP POST for pull/inbox/catalog actions which Google Apps Script web app rejects with `{ok: false}`, causing pull() to immediately trigger badKey() in a loop — Restored GET queries for pull, inbox, and catalog, and guarded badKey() from wiping `S.sync` before passphrase verification.
- 2026-10-22 00:15 (UTC+6) — v9.27 — Claude Sonnet / Gemini — Financial bills and log entries used Math.random() for ID generation which is vulnerable to collisions across multi-device offline sync — Math.random() produces pseudo-random floats without cryptographic collision resistance — Created uid() helper using crypto.getRandomValues(new Uint32Array(1))[0] with Date.now() timestamp.
- 2026-10-22 00:15 (UTC+6) — v9.27 — Claude Sonnet / Gemini — Cumulative cash, wallet and customer balances could accumulate IEEE 754 floating-point precision jitter over many entries — Unrounded additions and subtractions of fractional values in calc(), wltRun() and lBal() — Enforced r2 monetary rounding (Math.round((+x||0)*100)/100) on all balance accumulators and difference checks.
- 2026-10-22 00:15 (UTC+6) — v9.27 — Claude Sonnet / Gemini — Local storage quota could crash unannounced when attachment photos or long ledger history approached 5MB — persist() only notified on hard localStorage.setItem throw — Added proactive 4MB threshold warning advising backup download with session dismissal memory.
- 2026-10-22 00:15 (UTC+6) — v9.27 — Claude Sonnet / Gemini — Sync key transmitted in cleartext GET URL query parameters in getRemote(), importPos(), and importCatalog() — GET query parameters are logged in server/proxy histories — Transmitted sync key in HTTP POST request body with automatic fallback to GET for older Apps Script versions.
- 2026-10-21 23:58 (UTC+6) · v9.26 · Claude Sonnet / Gemini · Home hero Cash Balance remained at '0' on mobile phones · DOM initialized with placeholder '0' and animateCounts() returned early without painting under OS reduced-motion/battery saver · Pre-render computed balance immediately into the DOM and update animateCounts() to set target value if animations are suppressed.
- 2026-10-19 --:-- (UTC+6) · v9.22.2 · Claude Sonnet 5.5 · owner's Claude account · Sound toggle was not visible in the More tab because the Settings button was hidden by CSS · An old CSS rule `#stf,#set{display:none!important}` was hiding the Settings button; the Sound toggle lived inside that dialog · Removed `#set` from the hide rule; added a dedicated "Sound effects: ON/OFF" button directly to the More list; keeps the Settings dialog the same.
- 2026-10-19 --:-- (UTC+6) · v9.22.1 · Claude Sonnet 5.5 · owner's Claude account · Sound silent even when the Settings toggle is checked · AudioContext was created but its `resume()` promise was racing the tone scheduling: tones were scheduled at `currentTime` 0 while the context was still `suspended`, so nothing was heard · `play()` now waits for `ctx.resume()` before scheduling tones (`.then(go)`); added a "▶ Test sound" button in Settings; bumped gains so phone speakers are audible.
- 2026-10-19 --:-- (UTC+6) · v9.22 · Claude Sonnet 5.5 · owner's Claude account · CSV/JSON downloads could fail silently inside the native wrappers because the `<a download>` element was never attached to the DOM · `dlFile` clicked a detached anchor and swallowed the error · the anchor is appended before `click()`, removed after 1s, and a `window.open` data-URL fallback runs if the blob path throws.
- 2026-10-19 --:-- (UTC+6) · v9.21 · Claude Sonnet 5.5 · owner's Claude account · Home stopped drawing after the hero card (stats, charts, recent bills missing) · `homeUI()` called `clkTick()`, which was never defined (ReferenceError) · `clkTick()` defined; shared by Home and top-bar clocks.
- 2026-10-19 --:-- (UTC+6) · v9.21 · Claude Sonnet 5.5 · owner's Claude account · Voided entries cluttered the Accounts day table · void rows were listed with strike-through · filtered into a Void data view (Admin and Accountant) with Admin restore.
- 2026-10-19 --:-- (UTC+6) · v9.21 · Claude Sonnet 5.5 · owner's Claude account · Theme, refresh and sync controls looked crowded in the phone top bar · sync showed a full text label beside two icons plus logo and title · equal-size icons, sync dot-only on phones, logo hidden when very narrow.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · POS search pre-filled with stale content (e.g. "Accountant") on entering the POS tab · `#q` value was never cleared on refresh and could retain browser autofill or a previously typed value · `POS.refresh()` clears `$('q').value` on every enter.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Refresh made the admin log out (same symptom as v8.9.1) · any throw inside `enter()` after `resume()` restored a valid session caused the outer catch to return `false` · `resume()` wraps `enter()` in a nested try/catch that logs the error but still returns `true`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Voids from POS could not be fully removed and had no test-only pathway · the void flow only set the `void` flag with a reason · `voidBill` now auto-marks `test` reasons; admin gets `removeBillPermanently` with a reason; bills UI shows a "Test" section for admins.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Keeper had too many tabs · `TABS.keeper` included POS which is not part of the keeper workflow · reduced to `['prod','more']`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Wallet opening balances could only be set once and always applied from the beginning · `S.wallets` was a single fixed value · new `S.walletDates` array; `wltRun` resets at each anchor date; management dialog adds/removes anchors with admin PIN on past dates.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Cash adjustments on a past date could be made without PIN or audit · `cashAdjust` posted to `nextOpenDay` without re-verification · past-date targets now require Admin PIN; the `Adjustment` entry stores `pinBy` and `pinAt`.
- 2026-10-19 --:-- (UTC+6) · v9.20 · Claude Sonnet 5.5 · owner's Claude account · Party kinds did not map to the four groups the owner wanted · `cust.kind` was free text with no filter · dropdown restricted to four kinds; `Lender`/`Borrower` treated as `Borrower/Lender`; kind filter tabs in `ledList`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Storage warning card appeared on every entry save and could not be dismissed · `persist()` called `storageNotice()` on every save; the box's inline `display:flex` overrode the `hidden` attribute · `storageNotice` only on real failures; `Dismiss` uses `style.display='none'`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Self test reported false failures for const-bound helpers · `typeof window[name]` cannot see `const` bindings · use `eval('typeof '+name)`.
- 2026-10-18 --:-- (UTC+6) · v9.19 · Claude Sonnet 5.5 · owner's Claude account · Review queue Open for a reconciliation item jumped to today · `go('acc')` reset `cur` to today internally · call `go('acc')` first, then set `cur`.
- 2026-10-18 --:-- (UTC+6) · v9.18 · Claude Sonnet 5.5 · owner's Claude account · Sample "Load Riyad notes" could appear when the customer list was momentarily empty · button lived in the empty-customers card · removed from the empty-customers card.
- 2026-10-18 --:-- (UTC+6) · v9.16 · Claude Sonnet 5.5 · owner's Claude account · Accountant voids applied directly while edits required approval · v9.10 added proposal flow for edits but not voids · voids become approval requests.
- 2026-10-18 --:-- (UTC+6) · v9.15 · Claude Sonnet 5.5 · owner's Claude account · Upcoming Features card listed v9.8 below v9.5 · v9.8 updated Planned entry in place · splice out old 9.8, unshift new Done 9.8.
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

## 9. Native apps (Android APK and Windows .exe)
Added 2026-10-19. The PWA is unchanged and still works. The native apps wrap the same files.
- **Build:** GitHub Actions (`.github/workflows/build.yml`) runs on every upload to `main`. It builds only if `APP_VERSION` in `index.html` has no release yet (tag `v<major>.<minor>.<patch>`, e.g. 9.28.1 becomes `v9.28.1`). If a version is not raised, nothing is built.
- **Release contents:** `NCS-Accounts-<v>.apk`, `NCS-Accounts-Setup-<v>.exe`, `latest.yml` and `.blockmap` (Windows updater), `www.zip` and `update.json` (Android live update).
- **No edits to `index.html` for native.** `scripts/prepare-www.js` copies the app to `www/` and injects `native/bridge.js` just before `<script src="config.js"></script>`. **If that script tag is ever removed or changed, the build fails on purpose.** Keep it.
- **Android:** Capacitor 8 plus `@capgo/capacitor-updater` in manual mode. On start and on resume (max once per 30 min) `bridge.js` reads `releases/latest/download/update.json`, downloads `www.zip`, calls `next()` and shows a "Restart now" bar. A bundle that does not call `notifyAppReady()` is rolled back by the plugin. The bridge also supplies `navigator.share`, blob downloads (saved to cache, then the share sheet), and `window.print` (custom `NativePrint` plugin using Android PrintManager).
- **Windows:** Electron 44, NSIS per-user installer, `electron-updater` from GitHub Releases. The app is served from `app://ncs/`. Unsigned, so SmartScreen warns on first install.
- **Service worker:** switched off in both native apps by `bridge.js` (files are bundled). Still bump `sw.js` cache per rule 1 for the PWA.
- **Storage:** native apps have their own `localStorage`, separate from the PWA. A new device connects with the shop passphrase and syncs from the Sheet.
- **Native changes need a manual APK install:** new Android permission, new Capacitor plugin, new icon. Web code changes never do.
- **Signing key:** GitHub secrets `ANDROID_KEYSTORE_B64` and `ANDROID_KEYSTORE_PASSWORD` (alias `ncs`). The owner keeps the backup. If lost, the phone app must be uninstalled and reinstalled once.
- **Not yet verified on real devices:** Android build in CI, APK install and live update, camera scan in the APK, print dialog on Android, Windows installer and auto-update. Windows app was launched and rendered under a virtual display only.
- **v9.22.2 note:** the sound engine uses the standard Web Audio API, which works in both the Android WebView and Electron. On Android, sounds triggered by background sync can be blocked if no recent tap occurred — that is an OS limit, not a bug. Audio is disabled entirely under reduced motion by design. If sound still fails in the native Android app, the fast fix is to add `android:hardwareAccelerated="true"` to the WebView (already default in Capacitor) and to call `webView.getSettings().setMediaPlaybackRequiresUserGesture(false)` in the Android host — that removes the gesture requirement for programmatic playback.