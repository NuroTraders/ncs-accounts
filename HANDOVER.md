# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v8.8** (service worker cache `ncs-v16`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

## 0. Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js`, and this `HANDOVER.md`. Never work from an older copy.
2. Read sections 2 and 4 before changing anything.
3. Make one feature per version. Do not refactor unrelated code.
4. At the end: bump the version (section 4, rule 1), update section 7 (session log), and hand back all changed files, including this one.

## 1. Files
| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS and JS in one file, about 100 KB) |
| `sw.js` | Offline cache. Network-first. Cache name `ncs-vN` |
| `manifest.webmanifest` | PWA install info |
| `config.js` | Optional sync preset. Currently empty on purpose. Sync URL and key are set in Settings |
| `SolaimanLipi-*.ttf` | Bengali font (Normal, Bold, Thin). Must sit next to `index.html`. Used first when the language is Bengali |
| icons and logos | `icon-*.png`, `logo-*.png` |
| Google Apps Script | Lives in the owner's Google Sheet, not in this folder. It stores the whole app state as one blob |

## 2. Architecture
- **State:** one object `S`, saved to `localStorage` key `ncs_accounts_v2` by `save()`.
- **Collections** (arrays of objects with a numeric `id`): `entries`, `products`, `bills`, `moves`, `cust`, `ltx`. The list is `COLS`. Anything in `COLS` is stamped with `u` (last changed time) and merged by `mergeById` (newest `u` wins).
- **Other synced keys:** `days`, `names`, `parties`, `log`, `users`, `start`.
- **Local-only keys (never synced):** the `LOCAL` array: theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince.
- **Sync:** Google Apps Script web app. `pull()` and `push()` send the whole state as one text blob with a revision number. A conflict triggers `mergeState`. Because it is a blob, **new collections sync automatically once they are in `COLS`** and no script change is needed.
- **Navigation:** `TABS` (tabs per role), `TL` (labels), `ICO` (icons), `go(view)` shows `#v<Name>`. Views are `.wrap.view` divs: vAcc, vHome, vPos, vProd, vMore, vLed, vMgmt (admin only: staff, settings, change log, version history, Force logout all, Upcoming Features).
- **Roles:** admin, accountant, keeper, cashier (`role()`, `isA()`, `lEd()`). PINs are hashed. Staff are managed in the Staff dialog.
- **Helpers to reuse:** `ask(title, bodyHtml, onOk, okText, wide)` (return `false` from onOk to keep the dialog open), `dlg(...)` (same, with optional hidden OK button), `toast(t)`, `lg(action, detail)` (writes the Change Log), `esc()`, `tk()` (৳ amount), `n()` (number), `sd(iso)` (dd.mm.yyyy), `t12(HH:MM)`, `iso(Date)`, `dlFile(name, text)` (download).
- **Force logout all:** synced counter `S.rebootN` (+ `S.rebootAt`), merged with max in `mergeState`. Each session remembers the counter at login (`LRN`, and `rn` in the stored session); a 4-second interval locks any session whose `LRN` is lower; `resume()` rejects old sessions. A counter is used instead of timestamps so device clock differences cannot cause login loops.
- **Cash adjust:** hold or right-click `#cashp` (touch long-press) opens `cashAdjust()` (note and coin counter). It adds an `Adjustment` entry with `act` = counted cash, `cnt` = denominations. Admin and accountant only. The optional actual-cash field of the entry form is hidden (`#fx` still exists for old data).
- **Upcoming Features** live in the `UPC` array in the ledger module and show in the Management tab. Keep it in sync with section 6 below.
- **Language:** the older screens use the `tx()` dictionary. The ledger and version screens use `lb(english, bangla)`.
- **Ledger module** sits at the end of the script, headed `customer ledger + version history`. It uses function declarations and `var` so it can be called before it is defined.

## 3. Data model
- **`cust`**: `{id, name, phone, fb? (Facebook link or username), img? (200px JPEG data URL), note, del? (1 = archived), dby?, dts?}`. Delete is allowed only at balance 0 and is admin-only; restore from the Archive chip.
- **`ltx`** (ledger transaction): `{id, c (customer id), dir ('in' = পেলাম, 'out' = দিলাম), amt, parts[] or null, d (YYYY-MM-DD, '' = unknown), d2 (range end), t (HH:MM, recorded automatically), m (Cash/bKash/Bank/Other), who, note, by, eb? (last editor), void?, vr (void reason), vb (voided by), fix? (id of the entry it corrected)}`
- **Customer balance** = sum of `in` minus sum of `out` over non-void entries. It is calculated, never stored. Positive means the customer gets money (we owe). Negative means the customer owes us.
- **`entries`** (daily accounts) are separate: cash is calculated from them by `cash()` and `calc()`.

## 4. Rules (do not break)
1. **Every release:** bump `APP_VERSION`, add a `VERS` entry (newest first), bump the cache name in `sw.js`, and add a line to section 7 here.
2. **New synced data goes into `COLS`.** Always call `save()` after changing `S`. Do not write to `localStorage` directly.
3. **Never hard-delete money records.** Use `void` (with reason and who) or `del`. Cashiers can add and view only. A cashier correction voids the old entry and adds a new one.
4. **Ledger is separate from the cash drawer.** A ledger entry must not change the daily cash balance unless a future feature explicitly links them.
5. **Permissions:** the ledger is visible to admin, accountant and cashier (not keeper). Stock manager (`keeper`) is purchase-only in POS and sees all products with buy and sell price. Accountant sees accounts, ledger, products (read-only, with buying cost) and cash. Only admin and accountant can edit entries in place, print statements and export CSV. **Customer profile edit and delete are admin-only.** Voided entries are hidden from the Ledger and Statement tabs and shown in the Void data tab (admin and accountant see it; only admin restores). Admin and accountant can adjust actual cash. Management tab is admin-only.
6. **Escape all user text** with `esc()` before putting it in HTML.
7. **CSS clash:** the app has global `table`, `th:nth-child(-n+3)` and `td:first-child` rules. A new table needs its own class overriding them (see `.lt`).
8. **Dates:** store ISO `YYYY-MM-DD`. Show with `sd()`. Ledger entries get date and time automatically. A previous date is entered manually.
9. **Secrets:** never put the sync key, PINs or the owner's Sheet URL in the files or in this note.
10. **Before handing back:** extract the last `<script>` block and run `node --check`. Run a logic test for any calculation changed. State plainly what was and was not tested in a browser.
11. Class names are global: before adding a CSS class, search the file for it (the POS owns `.lt`, `.tile`, `.line`, `.cart`, `.tot`, `.sb`).
12. Dark mode must not use green for accents; light mode keeps the green ItemPOS look. Use tokens only.
13. **Scope trap:** `dlg`, `toast`, `C`, `prods`, `stockMap` live inside the POS closure and are NOT global. Code outside the POS (ledger module, drawer) must use `ask`, `ldlg`, `ltoast`. (v8.0 to v8.6 shipped a ledger entry dialog that called the private `dlg` and silently failed; fixed in v8.7.) Test new code paths in jsdom, not just `node --check`.
14. **Parallel work / merging:** if both profiles built from the same version, do not overwrite: three-way merge with `git merge-file mine base theirs`, resolve conflicts (usually `APP_VERSION` and the `VERS` line), renumber, and record the merge in section 7. The owner's deployed file may have CRLF line endings; normalise before diffing.
15. Capitalise the first letter of every visible label ("Last 7 days", "Sales", "We owe"). Write "Bkash" (not bKash) in the UI; `mN()` normalises old stored data.
16. Shop name is `shopN()` (EN: Nur Computer & Stationery, BN: নুর কম্পিউটার এন্ড স্টেশনারী). Never type it by hand. Keep the shop name spelling used in the UI. Keep Bengali labels for পেলাম / দিলাম.

## 5. Known quirks
- The "Start fresh" action erases daily accounts but **not** the ledger.
- The Change Log keeps only the last 500 lines. Customer Activity reads from it and matches by customer name, so renaming a customer hides older activity lines.
- The sample button "Load Riyad notes" appears only when there are no customers (admin). Remove it once real data is entered.
- Admin has 6 bottom tabs. Check small-phone fit when adding more.
- `.g>.pp` CSS rule is duplicated in the old accounts form (harmless).
- Customer balance for the sample matches the notebook: ৳32,650 (the 260 for Nasir is inside the 23,560 payment).

## 6. Roadmap (what to build, change or remove next)
**Confirmed spec for v8.9 (wallets), decided with the owner**
- Wallets are balances **calculated from entries** (like cash), never typed: `bk` Bkash personal, `ng` Nagad, `rk` Rocket, `bka` Bkash Agent, `gp` GP recharge, `robi` Robi recharge, `cir` Circkle recharge (spelling confirmed). Entry gets a wallet key `w`. Opening balance per wallet set once by admin (`S.wallets`).
- UI: an **MFS card** (Bkash, Nagad, Rocket, Bkash Agent) and a **Recharge card** (GP, Robi, Circkle) to the left of the Cash Balance card. Hover (long-press on phone) shows an overview; click shows each wallet's balance.
- **Purchase / Expense** categories (cash goes down, wallet goes up): Bk In - Personal (bk), Nagad In - Personal (ng), Rocket In - Personal (rk), Bkash Cash Out (bka), Recharge Balance - DSR GP (gp), Recharge Balance - DSR Robi (robi), Recharge Balance - DSR Circkle (cir), Bkash B2B Balance Receive (bka; the agent balance is received from the Bkash correspondent DSO and **paid from cash**).
- **Sale** categories (wallet goes down, cash goes up): Bk Sent - Personal (bk), Nagad Sent - Personal (ng), Rocket Sent - Personal (rk), Bkash Cash IN (bka), Recharge - GP (gp), Recharge - Robi (robi), Recharge - Circkle (cir).
- A wallet balance must **never go below zero**: block the entry, and block void or edit of an older entry if a later balance would go negative. Check in time order (`sorted()`).
- Sales whose payment is Mobile Banking add to a chosen wallet (wallet picker).

**Confirmed spec for v9.0 (ledger and sales linked to cash flow)**
- A ledger entry with method Cash moves the Cash Balance (in = up, out = down) through a linked cash entry (field `lk` = ltx id); void or edit keeps both in sync. Method Bkash/Nagad/Rocket moves that wallet. Bank does nothing.
- **Due sales post to the customer ledger automatically** (customer picker on Accounts entries; owner said yes).
- Everything entered before the link exists gets a "Check" tag and stays out of the cash flow until admin links or accepts it.


**Phase 1 (next)**
1. **Dashboard theme refresh (started in v8.2: CSS layer only).** The owner picked the Dabang direction; the Home view is done in v8.6 (soft gradient wash, balance hero card, pastel tiles, 7-day Sell/Buy bar chart, sales-by-payment donut). Remaining: Nagad-style quick-action icon grid on Home for cashiers; restyle POS and Accounts tables; restyle the Ledger view. Original brief: The owner shared four references: a light card dashboard with soft gradient and sidebar (Dabang), an orange mobile-banking home (Nagad), a blue wallet-card style, and a cream/yellow with black pill navigation style. Restyle through CSS variables first (`:root` colour tokens), then layout. Keep dark mode and the green brand colour unless told otherwise. After Home (done): Ledger, then Accounts and POS.
2. **Security options in the app:** change sync key from Settings AND the matching Apps Script change (store the key in Script Properties and accept a "rotate key" request) so the key is not hard-coded. Add an admin "change my PIN" if missing.
3. **Ledger search** inside a customer's entries (amount, name, note) and filters (direction, method, date).
4. **Statement sharing:** PDF or image for WhatsApp.

**Phase 1b**
4b. Five-colour chart palette for dark and light (top-selling items, monthly trends) when charts are added. Monospace SKU/barcode text on product cards. Pending/processing blue (#3B82F6) for supplier orders when that feature exists.

**Known limits (v8.7)**
- imo and Facebook cannot be opened from a phone number (no public link exists); only Call, SMS and WhatsApp work from the number. Facebook uses a link the staff pastes.
- Many JS-built strings and error messages are still English only. Translate by adding keys to `BN` (leading labels before numbers such as "Stock 5" translate through `trp()`).
- Currency symbol is ৳ through `tk()`; some table cells show plain numbers.
- Stock manager not seeing other devices' products is most likely sync not configured on that device (sync settings are per device); the Products page shows a warning (`synNote()`).

**Phase 2**
5. Optional "Ledger" sheet in Google Sheets for reading entries outside the app (add to the Apps Script `doPost`).
6. Reminders and due dates per customer; a "who owes whom" summary on Home.
7. Optional link from a ledger entry to the daily cash entry ("also record in cash").
8. Backup and restore (JSON export and import).
9. Sub-accounts or linked customers (for example Nasir under Riyad's notes).
10. Attachments (receipt photos). Careful: the sync blob has a size limit, so store small compressed images or links only.

**Phase 3 / cleanup**
11. Remove the sample import button after real use.
12. Consider splitting `index.html` into modules only if the owner asks. It is single-file for easy hosting.
13. Add an automated smoke test page.

## 7. Session log (append newest on top)
- **v8.8, 2026-10-16:** Management tab (`vMgmt`, admin only; `TABS.admin` now has 7 tabs, check small phones): staff and roles, settings, change log, version history, Force logout all, Upcoming Features with .txt export. Old Staff and Settings buttons are hidden by CSS (`#stf,#set`) and opened from Management. Force logout via `S.rebootN`. `cashAdjust()` on the Cash Balance card; actual-cash field hidden from the entry form. Customer profile edit/delete admin-only, Archive chip (admin), Void data tab (admin and accountant, admin restores); Ledger and Statement show active entries only. Capital first letters fixed; Bkash spelling. Tested in jsdom for all roles (Management buttons, cash adjust with denominations, void and restore, archive and restore, delete blocked at non-zero balance, force logout and re-login, resume rejection, Bengali). Not checked in a real browser. Note: wallets (v8.9) and ledger-to-cash linking (v9.0) are NOT built yet; see section 6.
- **v8.7, 2026-10-16:** **Merge of two parallel builds** (both had been called v8.6): the other profile's Dabang Home view (v8.6 below, kept as is) merged with this profile's stock manager / accountant / ledger / Bengali / font work. Merge was a clean three-way merge (one conflict, the VERS line). Contents from this side: Stock manager purchase-only (`setMode`/`renderCart` force purchase, body class `kp`), "Cost not set" label and `synNote()`; accountant tabs acc, led, prod, more with `canCost` and body class `ro`; ledger photo, Call/SMS/WhatsApp/Facebook links (`lLinks`, `lNum`), card grid `ledList`, hover card `#lhp`, long-press / right-click summary `ledSum`, totals and filters (`LS`); `ldlg` and `ltoast`; Bengali dictionary additions including Home chart labels, `trp()`, placeholder translation, SolaimanLipi font, `SHOP_EN/SHOP_BN/shopN()`. **Bug fixed:** ledger entry dialog (click a ledger row) and the new summary dialog called the POS-private `dlg`; and the ledger used the POS-private `toast`. Tested in jsdom for all four roles (tabs, ledger flows, void, cashier correction, auto date and time, Bengali mode): no uncaught errors. Still not checked in a real browser on phone and PC.
- **v8.6, 2026-10-15:** Home view restyled in the Dabang direction (owner's pick). `body:has(#vHome.on)` paints a soft gradient wash when Home is open (token `--dhg`); green gradient hero card shows cash balance, date and user; stat tiles pastel via t1–t4 and soft. New charts: 7-day Sell & Buy bar chart (`hChart`; classes dchart/dcol/dbars/dbs/dbb) and a sales-by-payment donut (`hPay`; dwrap/dhole/dleg, conic-gradient, zero state when no sales). Chart tokens `--ch1..--ch4` per theme (dark: #10B981, #3B82F6, #F59E0B, #FF9A3D — no green except inflow). Chart "Sell" includes all payment methods; donut splits Cash / Digital / Due over the selected period. Home-only `d*` classes checked for clashes (rule 11). Scope: Home view only; Ledger, Accounts and POS untouched. `APP_VERSION` 8.6, VERS entry added, `sw.js` cache `ncs-v14`. Not browser-tested: the owner should check light + dark, phone + PC, and the chart with real data.
- **v8.5, 2026-10-15:** Bottom bar restored on phones (drawer stays). Customer profile card `ledPC()` with pastel tiles. **Dark mode palette replaced (no green):** bg #0B0F19, card #151B2C, hover/soft #1F2942, border #222E4A, accent #FF7A00, text #F8FAFC / #94A3B8, pos #10B981, neg #EF4444, warn/low-stock #F59E0B, pending blue #3B82F6 (not yet used). Tokens live in the dark blocks of THEME v8.3. Bug fixed: ledger table now uses class `ltb` because `.lt` belongs to the POS (line total).
- **v8.4, 2026-10-15:** Phone drawer menu (Figma Light 02): `#mb` hamburger in `.top`, `#dr` drawer built from `TABS[role()]`, tile colours cycle through 6 hues, active tile #46C1BF. Bottom bar is hidden under 900px. Not yet checked in a real browser.
- **v8.3, 2026-10-15:** Theme layer v8.2 replaced by "THEME v8.3 ItemPOS" (end of `<style>`), built from the owner's Figma values: page #F8F9FD, sidebar white with 2px #F6F6F6 border, active item bg #E9F9F0 + 6px green gradient bar, green #2CC56F to #BEDC7C, card radius 14 and shadow `0 6px 9px -5px rgba(186,186,186,.15)`, pastel tiles #FFF5E0 / #E0F8EA / #FCEAE4 / #EFE6F6, status pills #E6F6E9 and orange #FF9A00, font Inter. Not yet checked in a real browser. The owner's other references (navy Glamstitch, blue wallet, cream/black) were not applied; a Settings theme switch is a possible later feature.
- **v8.2, 2026-10-15:** Theme layer added at the end of `<style>` (block `THEME v8.2`). Colour tokens `--bg1..3, --t1..4, --g1/--g2, --sh`. PC (min-width 900px): sidebar nav. Under 900px: floating bottom bar. CSS only, no logic changed. **Not yet viewed in a real browser; the owner should check and report spacing or contrast problems.**
- **v8.1, 2026-10-15:** Ledger date and time recorded automatically; previous date via checkbox; time shown in rows, details and CSV; this handover note added.
- **v8.0, 2026-10-15:** Customer Ledger (cust and ltx collections, profile tabs, voids, statements, CSV), role-based tabs, version history screen with export. Earlier versions (v1 to v7) were not recorded.