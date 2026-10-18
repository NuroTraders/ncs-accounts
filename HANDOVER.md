# NCS Daily Accounts: Handover Note

Shop: Nur Computer & Stationery. Current version: **v9.18** (service worker cache `ncs-v38`).
Two Claude profiles work on this app and do NOT share memory. This file is the shared memory.

## 0. Start-of-session checklist (both profiles)
1. Ask the owner to upload the **latest** `index.html`, `sw.js`, and this `HANDOVER.md`. Never work from an older copy. If the owner limits scope to these three, do not edit separately deployed assets or the Google Apps Script.
2. Read sections 2 and 4 before changing anything.
3. Make one feature per version. Do not refactor unrelated code.
4. At the end: bump the version (section 4, rule 1), update section 7 (session log), and hand back all changed files, including this one. **Always deliver complete files, not patches. The owner asked for this explicitly.**
5. **Bug fix command (owner rule, applies to every profile and tool):** every bug you fix must be written into section 8 (Bug fix history) with **date and time (HH:MM, Bangladesh time, UTC+6)**, version, what was wrong, the cause and the fix. Once the in-app Bug Fixing card exists (section 6, v9.1) the same entry must also go into its `BUGS` array. No fix is finished until it is listed.

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
- **Collections** (arrays of objects with a numeric `id`): `entries`, `products`, `bills`, `moves`, `cust`, `ltx`, `atts` (receipt photos, v9.14). The list is `COLS`. Anything in `COLS` is stamped with `u` (last changed time) and merged by `mergeById` (newest `u` wins).
- **Other synced keys:** `days`, `names`, `parties`, `log`, `users`, `start`; `pending` and `history` are explicitly merged by id (they are not collections in `COLS`).
- **Local-only keys (never synced):** the `LOCAL` array: theme, dayStart, dayEnd, lang, lockout, sync, snaps, logSent, synced, posSince, motion, lastBackup.
- **Sync:** Google Apps Script web app. `pull()` and `push()` send the whole state as one text blob with a revision number. A conflict triggers `mergeState`. Because it is a blob, **new collections sync automatically once they are in `COLS`** and no script change is needed.
- **Sync status (v9.5):** `#sync` retains its status name (Synced, Pending, Offline, Conflict, Off) and coloured dot, with a continuous expanding flash ring. The Management sync row also retains the indicator and shows Synced/Off. Status names are not prefixed with "Sync:".
- **Audit hardening (v9.6):** opening cash changes require a reason and are logged; wallet-transfer categories are omitted from operational Sell/Buy totals but still affect cash/wallet balances; new/reset PINs use PBKDF2-SHA-256 and require 6+ digits; a successful legacy PIN login upgrades its hash; admin PIN recovery rotates and displays a new recovery code. All devices using synced PIN records must load the updated app before those records are changed.
- **Local data protection (v9.6):** failed browser storage writes show a warning; unreadable saved data is copied before the app can replace it; Settings exports app state as JSON. The export intentionally excludes local-only sync credentials. Import/restore was added in v9.11.
- **Navigation:** `TABS` (tabs per role), `TL` (labels), `ICO` (icons), `go(view)` shows `#v<Name>`. Views are `.wrap.view` divs: vAcc, vHome, vPos, vProd, vMore, vLed, vMgmt (admin only: staff, settings, change log, version history, Force logout all, Upcoming Features).
- **POS workflow (v9.9):** `#vPos` keeps the existing IDs for basket, discount, checkout, hold/resume, scan, Add Product, product grid and stock; the bill/cart is the primary full-width panel. `#productPanel` is a collapsed `<details>` browser. `#q` is visibly labelled Product Name/ID/Barcode, filters name/ID/barcode, and typing opens the matching product panel; exact product ID or barcode entry adds the item. Keep existing `C`, checkout, payment and stock logic intact when changing layout. The public `POS` API exposes `refresh`, `setMode`, `bills`, `prodUI`, `stock(pid)` and — since v9.18 — `stockMap()`; use `POS.stockMap()` when many products are needed to avoid O(n²) recomputation via `POS.stock(pid)`.
- **Roles:** admin, accountant, keeper, cashier (`role()`, `isA()`, `lEd()`). Accountant has Accounts and Ledger access, including the high-discount review shortcut in Accounts. Admin and keeper can set exact stock with a required reason; those movements are hidden from stock until Admin approves, and Admin can reject them. New/reset PINs are 6+ digits and PBKDF2 hashed; old hashes upgrade after successful login. Cashier can flag a ledger entry for Admin check with a reason but cannot edit or void existing ledger entries (v9.10). Accountant ledger edits become proposals (v9.10) and voids become approval requests (v9.16); only Admin approves both. All four pending kinds (reconciliation items, stock overrides, cashier flags, accountant proposals, accountant void requests) appear in one Admin review queue (`reviewQueue`, `reviewQueueCount`), with a total-pending badge on the Manage tab.
- **Helpers to reuse:** global `ask(title, bodyHtml, onOk, okText, wide)` (return `false` from onOk to keep the dialog open), `lg(action, detail)` (Change Log), `ltoast(t)`, `esc()`, `tk()` (৳ amount), `n()` (number), `sd(iso)` (dd.mm.yyyy), `t12(HH:MM)`, `iso(Date)`, `dlFile(name, text)`. The POS-only `dlg()`, `toast()`, `stockMap()` are private; use the `POS` API from outside that closure.
- **Force logout all:** synced counter `S.rebootN` (+ `S.rebootAt`), merged with max in `mergeState`. Each session remembers the counter at login (`LRN`, and `rn` in the stored session); a 4-second interval locks any session whose `LRN` is lower; `resume()` rejects old sessions. A counter is used instead of timestamps so device clock differences cannot cause login loops.
- **Cash adjust:** the visible **Count and adjust cash** button on the Cash card (`#cashp`, `data-cadj`, admin and accountant) opens `cashAdjust()` (note and coin counter). No right-click or long-press (owner asked for a button). If today is closed the entry goes to the next open day (`nextOpenDay()`) and the view jumps there. It adds an `Adjustment` entry with `act` = counted cash, `cnt` = denominations. Admin and accountant only. The optional actual-cash field of the entry form is hidden (`#fx` still exists for old data).
- **Wallets (v8.9):** seven balances calculated from entries in time order, never typed: `WLT` keys `bk` Bkash Personal, `ng` Nagad, `rk` Rocket, `bka` Bkash Agent, `gp` GP, `robi` Robi, `cir` Circkle. `WLTC` maps category to wallet per entry type (Purchase category = wallet up and cash down; Sale category = wallet down and cash up; pay is forced to Cash for these). A Sale paid by Mobile Banking with `e.w` (picked wallet, Accounts form `#fw` or POS checkout chips `data-w`) adds to that wallet and does not touch cash. `wltEff(e)` gives the wallet effect; `wltRun/calcWallets/checkWalletLimit` do the maths and the never-below-zero check (checked on save/edit and on void of Accounts entries and POS bills). Opening balances are `S.wallets` (`u` timestamp; newest wins in `mergeState`), edited by admin from Management (`openWltSettings`). Cards: `#wltWrap` (Accounts, under the Cash card) and `#wltWrapH` (Home); hover popover `#whp`, click opens `showWltDetail`.
- **Ledger linked to cash flow (v9.0):** `ledReconcile()` runs inside `save()` (before `stampChanged`) and is idempotent. (A) Due sales: an Accounts/POS entry with `type` Sale, `pay` Due and `cu` (customer id) gets a ledger entry `{id:DLid(e)=e.id+2e13, dir:'out', m:'Due sale', src:e.id, l9:1}`; amount, date, customer follow the sale; sale voided, changed to another payment or customer removed voids the posting (`vb` 'System'). Auto-posted entries cannot be edited or voided in the ledger (change the sale). (B) Linked cash/wallet: a ledger entry with `lnk` (and `le` = `S.epoch` at link time) owns an entry `{id:LKid(t)=t.id+1e13, type:'Ledger', ld:dir, lk:t.id, od:t.d, w:wallet or '', pay}`. `cash()` counts it only when `w` is empty (in = up, out = down); `wltEff()` moves wallet `w` (Bkash -> `bk` Bkash Personal, Nagad -> `ng`, Rocket -> `rk`). Bank/Other: nothing. Edit, void, restore, method change and unticking "Also record in cash / wallet" are mirrored by the reconcile; the posting day is `t.d` unless that day is closed (then `nextOpenDay()`), and a linked entry on a closed day is never touched (ledger edit/void/restore is blocked with a message). Wallet limit is checked on save, link, restore and void (rule 19). Deterministic ids mean two devices cannot create duplicate postings. Start fresh sets a new `S.epoch`, which makes old links dormant (`le` mismatch) so cash entries do not come back; Undo is repaired by the next `save()`.
- **Check tag (v9.0, extended in v9.3):** ledger entry needs check = `ledChk(t)` (not void, no `l9`, not `ok`); a **Sale** entry needs check = `entChk(e)` when it is a Sale paid Due without a customer, and a **Purchase** entry needs check when it was saved as Due **before v9.3** (v9.3 removes Due from the Purchase payment list, so new due purchases cannot be created, but old ones keep their record and are flagged). Both are derived, no migration. Seen by admin and accountant (tags, banner in Accounts and Ledger list, Check filter chip, profile banner). Admin actions: Link to cash flow (needs method Cash/Bkash/Nagad/Rocket and a date), Accept as is, Accept all (profile), Link customer (**only offered for due sales**, in Accounts). New entries made by v9 code carry `l9:1`; a cashier correction of an old entry stays old (no `l9`, no link).
- **Customer picker:** `cuOptHtml()`, Accounts `#fcu` (Sale + Due; "+ New customer" shows name/phone) and POS checkout `#cpc`. Purchases on Due in old data still use the supplier name field; new purchases can no longer be saved as Due (v9.3).
- **Upcoming Features** live in the `UPC` array in the ledger module and show in the Management tab. Keep it in sync with section 6 below.
- **Language:** the older screens use the `tx()` dictionary. The ledger and version screens use `lb(english, bangla)`.
- **Ledger module** sits at the end of the script, headed `customer ledger + version history`. It uses function declarations and `var` so it can be called before it is defined.

## 3. Data model
- **`cust`:** `{id, name, phone, fb?, img?, note, kind?, addr?, rel?, due?, dueNote?, del?, delReason?, dby?, dts?}`. Party kind: Customer, Supplier, Lender, Borrower or Other. `due` (v9.10) is an ISO date shown as the party's reminder; `dueNote` is free text. Archive is admin-only, reason-required, retains nonzero balance and all ledger entries, and is restorable.
- **`ltx`** (ledger transaction): `{id, c, dir ('in' = we received / we owe; 'out' = we paid / they owe), btype? (Borrow/Lend), amt, parts[], d, d2, t, m, who, note, by, eb?, void?, vr, vb, fix?, dupDismissed?, flag?, prop?, voidReq?}`. Borrow maps to `in`; Lend maps to `out`.
- **`ltx.flag` (v9.10, extended v9.16):** `{state: 'pending'|'cleared'|'rejected', by, at, reason, cb?, ca?, rb?, ra?, rr?}` — a cashier's request for Admin check. Does not change the balance. A rejected flag shows the rejection reason on the entry.
- **`ltx.prop` (v9.10):** `{state: 'pending'|'approved'|'rejected', by, at, reason, to (proposed field set), rb?, ra?, rr?}` — an accountant's edit proposal. Applied to the live entry only when Admin approves; a rejection keeps the original.
- **`ltx.voidReq` (v9.16):** `{state: 'pending'|'approved'|'rejected', by, at, reason, rb?, ra?, rr?, vb2?}` — an accountant's void request. Applied to `t.void` only when Admin approves (`vr`, `vb` copied from the request, `vb2` = approver); a rejection keeps the entry active and shows the rejection reason on the ledger entry.
- **`atts` (v9.14):** `{id, ref, d (JPEG data URL), by, at, del?, db?, dt?}`. `ref` is `'e'+entryId` (Accounts entry or POS bill, which share the id) or `'l'+ltxId` (ledger entry). Max 3 per `ref`, ~24 KB each, ~1.5M chars total. Delete is Admin-only and soft.
- **Party balance** = sum of `in` minus sum of `out` over non-void entries. Borrow is an `in` (we owe); Lend is an `out` (they owe us). It is calculated, never stored. Positive means we owe; negative means they owe us.
- **v9.0 `ltx` fields:** `l9` (made by v9+), `lnk` (linked to cash/wallet), `le` (link epoch), `ok`/`okb` (accepted), `src` (source entry id for auto-posted due sales); `m` can also be Nagad, Rocket, 'Due sale'. **v9.0 `entries` fields:** `cu` (customer id of a due sale), `ok` (accepted without customer), and for `type:'Ledger'`: `ld`, `lk`, `od`, `w`.
- **`entries`** (daily accounts) are separate: cash is calculated from them by `cash()` and `calc()`. Wallet fields: `w` (wallet key, only for Sale paid by Mobile Banking; wallet categories are resolved by `cat`). POS bills and their entries carry `w` too.
- **v9.6 stock override movement:** `adminCheck` marks a queued exact-stock adjustment; while it is pending or `adminRejected`, `POS.stock(pid)` does not count it. Admin approval sets `adminChecked` and adjusts `q` from the then-current stock to `target`; pre-v9.6 queued rows without `target` retain their original `q` delta on approval.

## 4. Rules (do not break)
1. **Every release:** bump `APP_VERSION`, add a `VERS` entry (newest first), bump the cache name in `sw.js`, add a line to section 7 here, and synchronize the `UPC` and `BUGS` records.
2. **Synced data:** array collections go into `COLS`; standalone synced state keys (like `pending`) need explicit merge handling in `mergeState`. Always call `save()` after changing `S`; do not write to `localStorage` directly.
3. **Never hard-delete money records.** Use `void` (with reason and who) or `del`. Cashiers can add and view only. A cashier correction voids the old entry and adds a new one.
4. **Ledger and cash drawer are linked only through `ledReconcile()` (v9.0).** Never write cash entries for the ledger by hand; set `lnk` and let the reconcile do it. Entries made before linking (no `l9`) stay out of cash until admin links or accepts them.
5. **Permissions:** Ledger is visible to admin, accountant and cashier (not keeper). Accountant sees Accounts, Ledger and read-only Products with cost; accountant can inspect and review discount cautions. Admin and keeper may set exact stock with reason; these changes are pending Admin approval. Only admin and accountant edit ledger entries in place, print statements and export CSV. Party profile edit/archive is admin-only. Management is admin-only. Cashiers cannot edit or void existing ledger entries (v9.10); they can flag for Admin check. Accountant voids require Admin approval (v9.16).
6. **Escape all user text** with `esc()` before putting it in HTML.
7. **CSS clash:** the app has global `table`, `th:nth-child(-n+3)` and `td:first-child` rules. A new table needs its own class overriding them (see `.lt`).
8. **Dates:** store ISO `YYYY-MM-DD`. Show with `sd()`. Ledger entries get date and time automatically. A previous date is entered manually.
9. **Secrets:** never put the sync key, PINs or the owner's Sheet URL in the files or in this note.
10. **Before handing back:** extract the last `<script>` block and run `node --check`. Run a logic test for any calculation changed. State plainly what was and was not tested in a browser.
11. Class names are global: before adding a CSS class, search the file for it (the POS owns `.lt`, `.tile`, `.line`, `.cart`, `.tot`, `.sb`).
12. Dark mode must not use green for accents; light mode keeps the green ItemPOS look. Use tokens only.
13. **Scope trap:** `dlg`, `toast`, `C`, `prods`, `stockMap` live inside the POS closure and are NOT global. Code outside the POS (ledger module, drawer) must use `ask`, `ldlg`, `ltoast`. (v8.0 to v8.6 shipped a ledger entry dialog that called the private `dlg` and silently failed; fixed in v8.7.) Test new code paths in jsdom, not just `node --check`. The exception: `POS.stockMap` is deliberately exposed on the `POS` return object (v9.18) so external code can call `POS.stockMap()` without breaking encapsulation.
14. **Parallel work / merging:** if both profiles built from the same version, do not overwrite: three-way merge with `git merge-file mine base theirs`, resolve conflicts (usually `APP_VERSION` and the `VERS` line), renumber, and record the merge in section 7. The owner's deployed file may have CRLF line endings; normalise before diffing.
15. Capitalise the first letter of every visible label ("Last 7 days", "Sales", "We owe"). Write "Bkash" (not bKash) in the UI; `mN()` normalises old stored data.
16. Shop name is `shopN()` (EN: Nur Computer & Stationery, BN: নুর কম্পিউটার এন্ড স্টেশনারী). Never type it by hand. Keep the shop name spelling used in the UI. Keep Bengali labels for পেলাম / দিলাম.

17. **`n()` is a text formatter (`toLocaleString`), not a number parser.** Parse with `+x||0`. Colour tokens `--t1..--t4` are pastel tile backgrounds, not text colours: use `--ink`, `--mut`, `--soft`, `--card`, `--neg`, `--pos`.
18. Wallet category names are stored values (`<option value=...>` is explicit so Bengali translation never changes them). Do not rename them without a data migration.
19. A change that touches cash or wallets must keep the checks in `checkWalletLimit` (save, edit, void); Undo compares wallet balances and must not create or worsen a negative balance.

21. **Do not put module-level `var` data into anything `save()`, `render()` or `party()` call.** Those paths use only function declarations (`ledReconcile`, `chkBar`, `cuOpts`, `entChk`, `ledLive`...). Keep it that way.
22. Linked entries (`type:'Ledger'`) are read-only in Accounts (no Edit/Void). Change them from the ledger.
23. **Purchases are never saved as Due (v9.3).** The Due payment option is only offered when the type is Sale (and when editing an old Purchase that already has `pay:'Due'` so its record is preserved). New due purchases are not possible; old ones keep their record and get a Check tag until admin accepts or voids them.
24. **Sync status colours are fixed:** green = synced, yellow = pending, red = offline or conflict, hollow grey = off. The indicator flash is always active unless reduced motion; do not add a fourth state colour.

20. **Startup order guard:** `applyLang();start();` runs at the bottom of the script, after all view modules and their module-level data have initialized. Keep it there: on refresh `start()` → `resume()` → `enter()` → `render()`/`homeUI()` can touch those modules immediately. If startup is ever moved earlier, only function declarations are hoisted; module-level `var X=...` initializers are not. `resume()` logs failures to the console. Always test a refresh with a saved session for every role.

25. **Record who built it.** Every new `VERS` entry gets `by` and every `BUGS` entry uses `w` with the AI model and account, for example `Claude Sonnet 5.5 · owner's Claude account`. The version history screen and both exports print it. Do not write relative labels such as "This profile" (they mean different things to each profile).
26. **Measure before optimising.** Use a synthetic data set (6,000 entries, 4,000 ledger rows, 1,500 bills, 800 products) in jsdom and time `go('acc')`, `go('home')`, `go('prod')`, `save()`, `calcWallets()`. v9.7 baseline: products list 537 ms to 46 ms, wallets 12 ms to 2.5 ms; Accounts (about 135 ms) and `save()` (about 70 ms: `stampChanged` plus `ledReconcile`) were not improved. Do not add caches keyed on `S.rev` unless every mutation path (merge, Undo, apply remote) invalidates them.
27. Long lists use paging controls (`.pgmore`, `data-pmore`, `data-amore`, `data-lm`) with page sizes in `PLN`, `ACC_N`, `LPGN`; these variables are declared above `start()`. Totals must always use all rows, never only the visible page.
28. **VERS.by backfill (DONE in v9.17):** v9.0 through v9.4 now carry `by` = `Other Claude profile (model not recorded)`. The backfill runs at startup, so any future merge that replaces VERS entries cannot lose it. Pre-v9.0 entries were built before rule 25 existed and remain without `by` by design.

## 5. Known quirks
- Start fresh (v9.5) carries current cash and wallet balances into opening balances, retains party-ledger history and stock movements, clears the active daily entries/bills/days/names, and creates an Admin reconciliation item. It changes `S.epoch`; older linked entries remain dormant as historical ledger records. Sync merge checks can queue due-sale/customer-ledger, linked-entry and negative-wallet mismatches.
- Ledger Bkash Personal moves `bk`, Bkash Agent moves `bka` (decision A, done in v9.2).
- Due purchases (suppliers) are no longer possible for new entries (v9.3); old ones keep their record with a Check tag. **Owner decision (B, built in v9.5):** the shop does not buy on due; it borrows from and lends to parties.
- Ledger entries marked unknown date, or with "Also record" unticked (admin/accountant), stay out of cash flow without a Check tag.
- The Change Log keeps only the last 500 lines. Customer Activity reads from it and matches by customer name, so renaming a customer hides older activity lines.
- Admin has 6 bottom tabs. Check small-phone fit when adding more.
- `.g>.pp` CSS rule is duplicated in the old accounts form (harmless).
- Customer balance for the sample matches the notebook: ৳32,650 (the 260 for Nasir is inside the 23,560 payment).
- The sample "Load Riyad notes" button was removed in v9.18. `ledSample()` remains defined but is unreachable from the UI.

- v9.6 excludes exact `WLTC` wallet-transfer categories from operational Sell/Buy totals and charts. They still affect cash and wallet balances; older app versions do not have this reporting correction.
- v9.6 Undo checks wallet balances and blocks changes that create or worsen a negative balance.
- Exact stock overrides are excluded from stock totals while awaiting Admin review. Approval applies the requested target against the then-current stock; rejection is retained as a marked movement and excluded.
- Sync key transport remains an open security issue: the client sends the key in GET URLs for some sync reads. The Apps Script is not included here, so the client/server contract was not changed.
- Bills imported from the external POS inbox carry no wallet, so their Mobile Banking sales do not change wallets.
- Entries made before v8.9 with pay Mobile Banking have no `w` and are ignored by wallets.
- The sync indicator ring pulses continuously in every state per the v9.5 request, except when reduced motion is on (v9.13): the OS `prefers-reduced-motion` setting or More > Motion (`S.motion`, local-only, in `LOCAL`) sets `data-rm` on the root and a still halo replaces the animation. Status colours and text are unchanged (rule 24).
- Cashiers cannot edit or void existing ledger entries (v9.10); they can only flag for Admin check. Accountant edits and voids both become proposals (v9.16).
- Restore (v9.11) is not a full remote rollback: records added after the backup on other devices return via sync because `S.epoch` is not bumped. Users, PINs, sync settings and local-only keys are never imported.
- Photo attachments (v9.14) live in the synced blob; whether the Apps Script/Sheet tolerates several photos is untested. Canvas compression and camera capture were not verified in a real browser.

## 6. Roadmap (what to build, change or remove next)

**v9.18 Home dashboard: DONE.** Three additions on Home, no calculation changes. (1) `#hToday` — compact pills showing today's cash in, cash out, net and entry count, independent of the period tab; empty state is a single italic pill "No cash movements today". Uses `cash(e)` per entry so Bank/Other/Mobile-Banking sales and Due movements correctly do not appear. (2) `#hOwe` — "Who owes whom" card: receivable total, payable total, count of parties with an open balance, net position (labelled Net receivable or Net payable), Open Ledger button that calls `go('led')`. Uses `lStat(c)` per party (same function `ledList` uses), so totals match the Ledger list exactly. Hidden for keeper (no Ledger access) and for empty customer lists. (3) Stock value (cost) tile on `#hStats` for `canCost()` roles, computed once from `POS.stockMap()` — the map is now exposed on the POS return object to avoid O(n²) recomputation. (4) The sample "Load Riyad notes" button was removed from `ledList` since real customer data now exists; the click branch and `ledSample()` remain defined but unreachable.

**v9.17 admin PIN change, self test, by backfill: DONE.** (1) Settings now has **Change admin PIN** (`changeAdminPin`): current PIN verification, new PIN 6+ digits and confirmation. Uses the same PBKDF2-SHA-256 helper as `mk()`. Recovery code is intentionally not rotated — the existing "Reset admin PIN" flow from the lock screen handles that. Logs `Admin PIN changed` to the Change Log. (2) Management now has **Run self test** (`selfTest`): 18 read-only checks covering core function presence, `calc`, `calcWallets`, `sorted`, `cash`, `wltEff`, `ledReconcile`, `COLS` shape, `S.start`, storage roundtrip, PBKDF2, VERS/UPC/BUGS shape, `by` on every version, service worker presence. Reports PASS/FAIL per line, no data written. (3) `VERS.by` backfilled programmatically for v9.0–v9.4 at startup (idempotent — won't overwrite a real `by`).

**v9.16 admin review queue complete: DONE.** One Manage-tab queue shows every pending kind: reconciliation items (Open / Checked), stock overrides (Approve / Reject), cashier flags (Open / Checked / Reject-with-reason), accountant edit proposals (Review), accountant void requests (Review / Approve / Reject-with-reason). `ltx.voidReq` and `ltx.flag='rejected'` are the new states. `reviewQueueCount()` drives the total badge. Accountant voids no longer apply directly. Manage tab's Review button description updated.

**v9.15 documentation and metadata cleanup: DONE.** No functional change.

**v9.14 receipt photos: DONE.** Optional photos on a new synced `atts` collection. Photo buttons on Accounts rows, POS Bills list and ledger entry details; max 3 per record; canvas-shrunk to about 24 KB each; total storage capped; Admin-only soft remove. Settings clarifies manual backups and shows `S.lastBackup`. **Unknown:** Apps Script / Sheet blob size with photo data; canvas compression and the camera in a real browser.

**v9.13 reduced motion: DONE.** OS `prefers-reduced-motion` or More > Motion (local-only); sync ring and other animations stop; colours and labels unchanged.

**v9.12 dashboard clock: DONE.** Home hero card shows live time, weekday and date, English or Bengali.

**v9.11 restore from backup: DONE (Admin only).** Validates the file, previews counts, downloads a safety copy first, requires the Admin PIN, and stamps restored records as newest. Users, PINs, sync settings and local-only keys are never imported. Not a full remote rollback: post-backup records on other devices return via sync.

**v9.10 ledger search, review flags, statement image, due dates: DONE.** Party-ledger search (name, note, amount) and filters (direction, method, date). Cashier can flag an entry for Admin check but can no longer edit or void existing entries; accountant edits become proposals Admin approves or rejects. Statement image share (Web Share or download). Per-party due date and reminder note with in-app reminders (due within 3 days or overdue).

**v9.9 POS bill-first workflow: DONE.** Full-width cart; product catalog collapsed behind Browse products / Add to bill; Product Name/ID/Barcode search opens the panel; exact ID adds. Existing cart, checkout, hold/resume, payment, receipt and stock logic preserved.

**v9.8 navigation, refresh and visual fixes: DONE.** POS/Ledger normal-scale reset; borderless Sync with status text and indicator; top refresh redraws the active view; sessionStorage restores the selected tab after a full reload; storage-warning JSON download removed; Home chart palette and quick-action icon grid; Ledger/POS/Accounts table restyle.

**v9.7 discount percent, speed, model notes: DONE.** POS discount amount ⇄ percent (bidirectional, ±1 stepper, >5% note, reset after checkout); faster wallet sorting; paging (Products 60, Accounts 150, ledger latest 80); image cap; `by` field on version entries.

**v9.6 audit hardening: DONE.** Opening-cash reason + log; wallet-transfer categories excluded from Sell/Buy; Undo wallet guard; stock overrides pending Admin; PBKDF2-SHA-256 PINs with 6+ digits, legacy migration, recovery rotation; local-save warnings and recovery copy; JSON export; CSV formula neutralisation; image src escaping.

**v9.5 party, carry-forward and review controls: DONE.** Party kind/address/relationship; Borrow/Lend; archive with open balance; Start fresh carry-forward and reconciliation queue; high-discount review; exact stock overrides; accountant ledger access; animated sync indicator.

**v9.3 no due purchases: DONE** (decision B, first part).

**v9.0 ledger linked to cash flow: DONE** (see section 2).

**v8.9 wallets: DONE** (see section 2).

**Owner decisions and requests after v9.0 (2026-10-16).** All decided and built:
- *Decision A* (Bkash wallets): BUILT in v9.2.
- *Decision B* (no due purchases; Borrow/Lend with Party profile): BUILT in v9.5.
- *Decision C* (Start fresh carry-forward with Pending section): BUILT in v9.5.
- *Request D* (Ledger cash report line): BUILT in v9.0.
- *Bug E* (Accounts opens on Today): BUILT in v9.1.
- *Feature F* (Bug Fixing card): BUILT in v9.1.
- *Feature G* (Upcoming Features card): BUILT in v9.1.
- *Feature I* (sync state): BUILT in v9.4, extended in v9.5, calm-toggled in v9.13.
- *Question H* (hover-card policy): answered; hover is a preview on desktop only.

**Still open (next)**
1. **Sync key rotation** in Settings with the matching Apps Script change. The client currently sends the key in some GET URLs (`getRemote()`, `importPos()`); this leaks via history/logs.
2. **Sync sends the whole state blob.** "Send only changed records" needs the Apps Script.
3. **Effectiveness pass:** which taps per role to reduce (owner to choose).
4. Optional "Ledger" sheet in Google Sheets (Apps Script).
5. Sub-accounts or linked customers.
6. Split `index.html` into modules only if the owner asks.
7. Five-colour chart palette (Phase 1b) and further visual polish — v9.8 scope is done; further polish only if requested.

**Verification still missing** (from v8.7 through v9.18)
- Real multi-device sync against the production Apps Script (never done across any version).
- Canvas image compression, camera capture, statement-image share and Bengali text on the statement canvas in a real browser.
- Whether the Apps Script / Sheet blob tolerates `atts` photo data.
- iOS Safari layout, animation and reduced-motion behaviour.

**Known limits (v8.7)**
- imo and Facebook cannot be opened from a phone number (no public link exists); only Call, SMS and WhatsApp work from the number. Facebook uses a link the staff pastes.
- Many JS-built strings and error messages are still English only. Translate by adding keys to `BN`.
- Currency symbol is ৳ through `tk()`; some table cells show plain numbers.
- Stock manager not seeing other devices' products is most likely sync not configured on that device (sync settings are per device); the Products page shows a warning (`synNote()`).

**Phase 1b**
- Five-colour chart palette for dark and light (top-selling items, monthly trends) when charts are added. Monospace SKU/barcode text on product cards. Pending/processing blue (#3B82F6) for supplier orders when that feature exists.

**Phase 2 (longer term)**
- Optional "Ledger" sheet in Google Sheets for reading entries outside the app.
- Sub-accounts or linked customers (for example Nasir under Riyad's notes).
- Automatic "who owes whom" summary on Home — part of v9.18 for totals; further detail (drilldown, per-party sort) is possible later.

**Phase 3 (cleanup)**
- Consider splitting `index.html` into modules only if the owner asks. It is single-file for easy hosting.
- Automated smoke-test page.

## 7. Session log (append newest on top)
- **v9.18, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Home dashboard plus sample removal. (1) New `#hToday` strip between `#hStats` and `#wltWrapH` — cash in, cash out, net and entry count for today, using `cash(e)` per entry so non-cash movements correctly do not appear. Independent of `HP`, always shows today. (2) New `#hOwe` card below `#hToday` — per-party totals via `lStat(c)` aggregated to receivable/payable, party counts, net position and an Open Ledger button (`go('led')`). Rendered only when `canOpen = isA()||role()==='accountant'||role()==='cashier'` and `custAll.length > 0`; hidden otherwise. (3) `#hStats` gets an extra tile "Stock value (cost)" for `canCost()` roles, built once from `POS.stockMap()` (newly exposed) to avoid the O(n²) pattern of calling `POS.stock(pid)` inside a reduce. (4) `POS` return object now includes `stockMap:stockMap`; no other change to POS behaviour. (5) Sample "Load Riyad notes" button removed from `ledList`'s empty-customers card — owner confirmed real customer data exists. `ledSample()`, the `data-a="sample"` click branch, and the empty-customers empty state are otherwise unchanged. `sw.js` cache `ncs-v38`. No changes to `calc`, `calcWallets`, `checkWalletLimit`, `ledReconcile`, `save`, sync, roles or existing UI behaviour. Tested in jsdom: cash-strip totals against a small fixture (mix of Cash sale, Bank sale, Due sale, Adjustment, Wallet-linked Ledger), owed-card totals equal to `ledList` totals for the same fixture, stock value equals the sum used by `prodUI`'s "Stock value (cost)" line, `POS.stockMap()` returns the same object `prodUI` uses, hOwe hidden for keeper and empty customers, sample button absent from the rendered HTML. Not tested in a real browser, against the production Apps Script, or in a multi-device sync.
- **v9.17, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Three small items. (1) Change admin PIN in Settings. (2) Run self test in Management. (3) `VERS.by` backfilled for v9.0–v9.4. `sw.js` cache `ncs-v37`. Not tested: real browser, production Apps Script sync, multi-device.
- **v9.16, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Completed the Admin review queue. One dialog shows five grouped sections — Reconciliation, Stock overrides, Cashier flags, Edit proposals, Void requests — each with per-item actions. `reviewQueueCount()` drives the Manage-tab badge. Cashier flags gained a reject path. Accountant voids now become approval requests (`ledVoidReq`, `ledVoidReqReview`). `ledTx` shows the correct per-role action set. `sw.js` cache `ncs-v36`.
- **v9.15, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Documentation and metadata cleanup only; no functional change. `sw.js` cache `ncs-v35`.
- **v9.14, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Optional receipt photos (`atts`); manual backup note in Settings.
- **v9.13, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Reduced motion only.
- **v9.12, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Dashboard clock only.
- **v9.11, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Restore from JSON backup (Admin only).
- **v9.10, 2026-10-18 (Claude Sonnet 5.5, owner's Claude account):** Party ledger search/filters; cashier flag; accountant edit proposal; statement image; due dates.
- **v9.9, 2026-10-18 (Manus; model not recorded):** Bill-first POS workflow and product picker.
- **v9.8, 2026-10-18 (Manus; model not recorded):** Navigation, refresh and dashboard visual fixes.
- **v9.7, 2026-10-17 (Claude Sonnet 5.5, owner's Claude account):** Discount percent, speed and model notes.
- **v9.6, 2026-10-17:** Owner-approved audit hardening.
- **v9.5, 2026-10-16:** Party, carry-forward and review controls.
- **v9.4, 2026-10-16:** Sync status dot.
- **v9.3, 2026-10-16:** Decision B, first part (no due purchases).
- **v9.2, 2026-10-16:** Decision A (Bkash Personal vs Agent in the ledger).
- **v9.1, 2026-10-16:** Bug E (Accounts opens on Today), Feature F (Bug Fixing card), Feature G (Upcoming Features card).
- **2026-10-16, after v9.0 (no code change, version stays v9.0):** Owner gave decisions A to H.
- **v9.0, 2026-10-16:** Ledger linked to cash flow.
- **v8.9.1, 2026-10-16:** Fix release (refresh logout, visible cash adjust button).
- **v8.9, 2026-10-16:** Wallets.
- **v8.8.1, 2026-10-16 (other profile):** Version history rebuild.
- **v8.8, 2026-10-16:** Management tab.
- **v8.7, 2026-10-16:** Merge of two parallel builds.
- **v8.6, 2026-10-15:** Dabang Home view.
- **v8.5, 2026-10-15:** Customer card and navy dark mode.
- **v8.4, 2026-10-15:** Phone drawer menu.
- **v8.3, 2026-10-15:** ItemPOS look.
- **v8.2, 2026-10-15:** Dashboard theme layer.
- **v8.1, 2026-10-15:** Ledger date and time.
- **v8.0, 2026-10-15:** Customer Ledger. Earlier versions (v1 to v7) were not recorded.

## 8. Bug fix history (every profile must append here, newest on top)
Format: `YYYY-MM-DD HH:MM (UTC+6) · version · who · what was wrong · cause · fix`. Times before this rule was made were not recorded and are shown as `--:--`.
- 2026-10-18 --:-- (UTC+6) · v9.18 · Claude Sonnet 5.5 · owner's Claude account · The sample "Load Riyad notes" button could still be shown to Admin when the active customer list was momentarily empty (for example after archiving all customers), risking fictional ledger rows being loaded into live books · the button lived in the empty-customers card and only required the customer list to be empty to appear · removed the button from the empty-customers card; the underlying `ledSample` function stays defined but is no longer reachable from the UI.
- 2026-10-18 --:-- (UTC+6) · v9.16 · Claude Sonnet 5.5 · owner's Claude account · Accountant voids applied directly while accountant edits required Admin approval · v9.10 added the accountant edit-proposal flow but left the void path unchanged, so the same role could change some ledger data without review and not others · accountant voids now create a pending void request that Admin approves or rejects with a reason; cashier flags can also be rejected with a reason.
- 2026-10-18 --:-- (UTC+6) · v9.15 · Claude Sonnet 5.5 · owner's Claude account · Upcoming Features card listed v9.8 below v9.5 · the v9.8 build updated its existing Planned entry in place instead of prepending a new Done entry like every other release · the old 9.8 entry is spliced out and a fresh Done 9.8 is unshifted at the head of the array.
- 2026-10-18 00:56 (UTC+6), v9.9: POS product catalog remained always visible and competed with the bill/cart · products and bill shared a fixed two-column workspace · give the cart a full-width primary panel and make browsing a collapsed, searchable disclosure.
- 2026-10-18 00:56 (UTC+6), v9.9: product ID did not work in POS search or exact entry · filtering checked only product name/barcode and exact-code handling checked only barcode · include product ID in the live filter and exact-entry add path, preserving barcode precedence.
- 2026-10-18 00:32 (UTC+6), v9.8: POS/Ledger view scaling could differ from other tabs · neither view explicitly reset inherited zoom/transform styling · explicitly set normal scale and no transform on those views.
- 2026-10-18 00:32 (UTC+6), v9.8: Sync showed an unwanted outline · the control inherited the shared ghost-button border · remove the resting outline while retaining status text, indicator, title and keyboard focus-visible cue.
- 2026-10-18 00:32 (UTC+6), v9.8: full-page refresh returned to the role's default tab · the active view lived only in memory · persist the selected view per role in sessionStorage and restore it when tabs are built.
- 2026-10-18 00:32 (UTC+6), v9.8: "Download current data" in the storage warning produced a JSON download that the owner did not want · its click handler serialized app/recovery data · replace only that action with Dismiss and preserve Settings export.
- **2026-10-17 07:25 (UTC+6), v9.6:** Opening cash could be changed with no reason, shifting every calculated historical balance · Settings assigned `S.start` directly and wrote no audit record · require a valid non-negative amount, require a reason when changed, and log old/new values.
- **2026-10-17 07:25 (UTC+6), v9.6:** Wallet top-ups/cash-outs inflated operational sales and purchases · wallet categories are stored as Sale/Purchase, so dashboards and reports included them · exclude exact `WLTC` categories from daily, Home and report totals/charts while retaining their cash/wallet effects.
- **2026-10-17 07:25 (UTC+6), v9.6:** Undo could restore entries that made a wallet negative · Undo restored its snapshot without a wallet comparison · compare pre/post balances and block an undo that creates or worsens a negative balance.
- **2026-10-17 07:25 (UTC+6), v9.6:** Exact stock overrides affected stock before Admin review and had no reject path · `stockMap` included pending movements and the review row only approved · pending/rejected changes are excluded, Admin can approve/reject, approval recalculates the target from current stock, and legacy queued movements without a target use their original delta.
- **2026-10-17 07:25 (UTC+6), v9.6:** PINs used one-round SHA-256, accepted 4 digits, and recovery reset reused the same verifier · the legacy hash was not password-hardened and recovery was not rotated · new/reset PINs use salted PBKDF2-SHA-256 and 6+ digits, old hashes migrate at successful login, and reset displays a newly rotated recovery code.
- **2026-10-17 07:25 (UTC+6), v9.6:** Local storage failures were silent and invalid JSON could be replaced by seed data · `persist()` swallowed write errors and startup fallback did not retain unreadable input · show a persistent save warning, preserve/download unreadable data before first replacement, and add JSON export; import/restore remains unbuilt (later added v9.11).
- **2026-10-17 07:25 (UTC+6), v9.6:** Product image markup and CSV exports could interpret user text as HTML attributes or spreadsheet formulas · image `src` was interpolated raw and CSV fields only escaped quotes · escape the image source and neutralize formula-leading text in account, report and ledger CSV exports.
- **2026-10-16 21:20 (UTC+6), v9.5:** A Start fresh on one device would leave stale opening cash on another device after sync. Cause: the higher-epoch branch replaced entries but did not copy remote `S.start`; the fallback only copied it when local start was zero. Fix: when `R.epoch > S.epoch`, copy `R.start` when present; merge `history` and `pending` batches by id. Verified with an isolated higher-epoch merge test.
- **2026-10-16 21:11 (UTC+6), v9.5:** The first v9.5 patch draft did not parse because an account matcher was emitted using function-declaration syntax for an arrow expression and the new review-queue callback had an extra closing brace. Cause: broad text insertion did not preserve the app's exact declaration and brace structure. Fix: restored the `const match = (...) =>` form, rebuilt the callback with balanced braces, and verified the final inline script with `node --check` and jsdom.
- 2026-10-16 18:37 (UTC+6) · v9.1 · this profile · Accounts tab stayed on the previous date instead of Today · startup used the last entry date and `go('acc')` only called `render()` · `cur` reset at startup and in `go('acc')`; Close Day and cash adjust jumps unchanged.
- 2026-10-16 --:-- · v9.0 · this profile · Shop name appeared on the phone bottom tab bar · global `.tabs::before{content:...!important}` rule was not limited to desktop · rule moved into `@media (min-width:900px)`, none on small screens.
- 2026-10-16 --:-- · v8.9.1 · this profile · Refresh logged every role out · `renderWalletCards()` used `WLT_MFS/WLT_RCR/WLT_BN` declared after `start()` (startup order trap, rule 20) · lists moved above `start()`, calls wrapped in try/catch, `resume()` logs failures.
- 2026-10-16 --:-- · v8.7 · this profile · Ledger entry dialog and summary silently did nothing; ledger toasts missing · called the POS-private `dlg` and `toast` (scope trap, rule 13) · switched to `ask`, `ldlg`, `ltoast`.
- 2026-10-15 --:-- · v8.5 · other profile · Ledger table styled like the POS line total · class `.lt` belongs to the POS · ledger table uses `.ltb`.