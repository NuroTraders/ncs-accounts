/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NCS Accounts — Sync Engine v2 (Model B: Delta + Structured Mirror)
 * ═══════════════════════════════════════════════════════════════════════════
 *  - Implements delta push/pull using per-row 'u' timestamps.
 *  - Timezone-aware schema normalization (UTC+6 Bangladesh standard).
 *  - Automatic self-healing of empty dates/times from row IDs and timestamps.
 *  - Instant reactive redraw across all open tabs (Home, Accounts, POS, Ledger).
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  if (window.NCS_CONFIG && window.NCS_CONFIG.SYNC_MODE !== 'v2') {
    console.log('[Sync] Option 1 (Whole State sync) active. Delta sync engine idle.');
    window.NcsSync = {
      isIdle: true,
      push: function(force) { if (typeof window.push === 'function') return window.push(force); },
      pull: function(force) { if (typeof window.pull === 'function') return window.pull(force); },
      schedulePush: function() { if (typeof window.schedule === 'function') return window.schedule(); }
    };
    return;
  }

  const SYNC_KEY = 'ncs_sync_v10';
  const API_URL = (window.NCS_CONFIG && (window.NCS_CONFIG.API_URL || window.NCS_CONFIG.url)) || '';
  const API_TOKEN = (window.NCS_CONFIG && (window.NCS_CONFIG.API_TOKEN || window.NCS_CONFIG.key)) || '';
  
  let isPushing = false;
  let isPulling = false;
  let pushTimer = null;
  let pullInterval = null;

  // Map of S keys to server schema keys
  const TABLES = {
    entries: 'entries',
    bills: 'bills',
    products: 'products',
    moves: 'moves',
    cust: 'parties',
    ltx: 'ledger',
    walletDates: 'wallets',
    counts: 'counts',
    pending: 'pending',
    days: 'days',
    history: 'history',
    atts: 'atts'
  };

  // Cursor state (local only)
  let syncState = {
    clientId: '',
    lastPushU: {},
    lastPullU: 0,
    schema: 3
  };

  function log(tag, msg, meta) {
    if (window.NcsDiag) window.NcsDiag.log(tag, msg, meta);
    else console.log(`[Sync] ${tag}: ${msg}`, meta || '');
  }
  
  function logErr(tag, msg, meta) {
    if (window.NcsDiag) window.NcsDiag.err(tag, msg, meta);
    else console.error(`[Sync] ${tag}: ${msg}`, meta || '');
  }

  function updateStatus(status) {
    if (typeof window.setSt === 'function') {
      window.setSt(status);
    }
  }

  // Load state from localStorage
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SYNC_KEY));
      if (saved) {
        syncState = Object.assign(syncState, saved);
        // Force a one-time full sync (since=0) when upgrading to schema 3 to normalize all dates
        if (!syncState.schema || syncState.schema < 3) {
          syncState.lastPullU = 0;
          syncState.schema = 3;
        }
      }
    } catch(e) {}
    
    if (!syncState.clientId) {
      syncState.clientId = 'cl_' + Math.random().toString(36).substr(2, 9);
    }
    syncState.schema = 3;
    
    Object.keys(TABLES).forEach(k => {
      if (syncState.lastPushU[k] === undefined) syncState.lastPushU[k] = 0;
    });
    
    saveState();
  }

  function saveState() {
    localStorage.setItem(SYNC_KEY, JSON.stringify(syncState));
  }

  // Timezone helper: converts timestamp or date string to Bangladesh YYYY-MM-DD
  function toBdDate(val) {
    if (!val) return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    try {
      let ms = 0;
      if (typeof val === 'number') ms = val;
      else if (/^\d{13}$/.test(s)) ms = +s;
      else {
        const parsed = new Date(s).getTime();
        if (!isNaN(parsed)) ms = parsed;
      }
      if (ms > 0) {
        // Add 6 hours to convert UTC to Bangladesh GMT+6
        const bd = new Date(ms + (6 * 3600 * 1000));
        return bd.toISOString().slice(0, 10);
      }
    } catch(e){}
    return s.slice(0, 10);
  }

  function toBdTime(val) {
    if (!val) return '';
    const s = String(val).trim();
    if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, '0');
    try {
      let ms = 0;
      if (typeof val === 'number') ms = val;
      else if (/^\d{13}$/.test(s)) ms = +s;
      else {
        const parsed = new Date(s).getTime();
        if (!isNaN(parsed)) ms = parsed;
      }
      if (ms > 0) {
        const bd = new Date(ms + (6 * 3600 * 1000));
        return String(bd.getUTCHours()).padStart(2, '0') + ':' + String(bd.getUTCMinutes()).padStart(2, '0');
      }
    } catch(e){}
    return '12:00';
  }

  // Backfill missing 'u', 'v', 'removed', and repair empty dates locally
  function backfill() {
    let maxU = 0;
    let changed = false;

    Object.keys(TABLES).forEach(sKey => {
      if (!window.S[sKey] || !Array.isArray(window.S[sKey])) return;
      
      window.S[sKey].forEach(row => {
        if (row.u === undefined) {
          row.u = row.at || (row.date ? new Date(row.date).getTime() : 0) || 0;
          changed = true;
        }
        if (row.v === undefined) { row.v = 0; changed = true; }
        if (row.removed === undefined) { row.removed = 0; changed = true; }
        if (row.u > maxU) maxU = row.u;

        // Repair entries with missing dates
        if (sKey === 'entries') {
          if (!row.d || row.d === '') {
            const ts = (typeof row.id === 'number' && row.id > 1600000000000) ? row.id : (row.at || row.u || Date.now());
            row.d = toBdDate(ts);
            if (!row.t || row.t === '') row.t = toBdTime(ts);
            changed = true;
          }
          if (!row.pay) {
            row.pay = row.wallet || (row.cash ? 'Cash' : 'Cash');
            changed = true;
          }
        }
      });
    });

    if (window.S._lastU === undefined || window.S._lastU < maxU) {
      window.S._lastU = maxU;
      changed = true;
    }

    if (changed) {
      log('state', 'Self-healed local fields & backfilled u/v');
      if (typeof window.persist === 'function') window.persist();
      else if (typeof window.save === 'function') window.save();
    }
  }

  // Generate a monotonic 'u' timestamp strictly greater than all known local and server timestamps
  function nextU() {
    const now = Date.now();
    let maxKnown = Math.max(now, (window.S && window.S._lastU) || 0, syncState.lastPullU || 0);
    Object.keys(syncState.lastPushU || {}).forEach(k => {
      const v = syncState.lastPushU[k];
      if (typeof v === 'number' && v > maxKnown) maxKnown = v;
    });
    const newU = maxKnown + 1;
    if (window.S) window.S._lastU = newU;
    return newU;
  }

  // ─── DUAL SCHEMA TRANSLATORS ────────────────────────────────────────────────

  function formatRowForServer(table, r) {
    if (!r) return r;
    if (table === 'entries') {
      const dVal = r.d || toBdDate(r.date || r.id || r.at);
      const tVal = r.t || toBdTime(r.at || r.id);
      const payVal = r.pay || (r.wallet ? r.wallet : 'Cash');
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        t: tVal,
        pay: payVal,
        wallet: r.w || (payVal !== 'Cash' ? payVal : ''),
        cash: (payVal === 'Cash' ? r.amt : ''),
        by: r.by || r.user || 'Admin',
        at: r.at || (typeof r.id === 'number' && r.id > 1600000000000 ? r.id : Date.now())
      });
    }
    if (table === 'bills') {
      const dVal = r.d || toBdDate(r.date || r.ts || r.id);
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        total: r.total || 0,
        paid: r.rec !== undefined ? r.rec : (r.total || 0),
        method: r.pay || 'Cash',
        cust: r.party || '',
        items: typeof r.lines === 'object' ? JSON.stringify(r.lines) : (r.items || ''),
        by: r.user || r.by || 'Admin',
        at: r.ts || r.u || (typeof r.id === 'number' && r.id > 1600000000000 ? r.id : Date.now())
      });
    }
    if (table === 'products') {
      return Object.assign({}, r, {
        barcode: r.code || r.barcode || '',
        price: r.sell !== undefined ? r.sell : r.price,
        cost: r.buy !== undefined ? r.buy : r.cost,
        category: r.cat || r.category || ''
      });
    }
    if (table === 'cust') {
      return Object.assign({}, r, {
        address: r.area || r.address || '',
        opening: r.op !== undefined ? r.op : r.opening
      });
    }
    if (table === 'ltx') {
      const dVal = r.d || toBdDate(r.date || r.at || r.id);
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        partyId: r.cId || r.partyId || '',
        kind: r.type || r.kind || '',
        note: r.note || '',
        linkEntryId: r.link || r.linkEntryId || '',
        by: r.by || 'Admin',
        at: r.at || r.u || (typeof r.id === 'number' && r.id > 1600000000000 ? r.id : Date.now())
      });
    }
    return r;
  }

  function normalizeRemoteRow(table, rRow, localRow) {
    if (table === 'entries') {
      // 1. Resolve date (d)
      let d = rRow.d;
      if (!d && rRow.date) {
        d = toBdDate(rRow.date);
      }
      if (!d && localRow && localRow.d) d = localRow.d;
      if (!d) {
        const ts = (typeof rRow.id === 'number' && rRow.id > 1600000000000) ? rRow.id : (rRow.at || rRow.u);
        d = toBdDate(ts);
      }
      if (!d) d = toBdDate(Date.now());

      // 2. Resolve time (t)
      let t = rRow.t;
      if (!t && localRow && localRow.t) t = localRow.t;
      if (!t) {
        const ts = (typeof rRow.id === 'number' && rRow.id > 1600000000000) ? rRow.id : rRow.at;
        t = toBdTime(ts);
      }
      if (!t) t = '12:00';

      // 3. Resolve payment method
      let pay = rRow.pay;
      if (!pay && rRow.wallet) pay = rRow.wallet;
      else if (!pay && rRow.cash !== undefined && rRow.cash !== '') pay = 'Cash';
      else if (!pay && localRow && localRow.pay) pay = localRow.pay;
      else if (!pay) pay = 'Cash';

      // 4. Resolve category (infer if missing)
      let cat = (rRow.cat !== undefined && rRow.cat !== '') ? rRow.cat : (localRow ? localRow.cat : (rRow.category || ''));
      if (!cat && rRow.desc) {
        const descLower = String(rRow.desc).toLowerCase();
        if (descLower.includes('bk in') || descLower.includes('bkin')) cat = 'Bk In - Personal';
        else if (descLower.includes('nagad in')) cat = 'Nagad In - Personal';
        else if (descLower.includes('rocket in')) cat = 'Rocket In - Personal';
        else if (descLower.includes('cash out')) cat = 'Bkash Cash Out';
        else if (descLower.includes('recharge') || descLower.includes('rc')) {
          if (descLower.includes('gp')) cat = rRow.type === 'Sale' ? 'Recharge - GP' : 'Recharge Balance - DSR GP';
          else if (descLower.includes('robi')) cat = rRow.type === 'Sale' ? 'Recharge - Robi' : 'Recharge Balance - DSR Robi';
          else if (descLower.includes('cir')) cat = rRow.type === 'Sale' ? 'Recharge - Circkle' : 'Recharge Balance - DSR Circkle';
        }
      }

      let amt = +(rRow.amt !== undefined && rRow.amt !== '' ? rRow.amt : (localRow ? localRow.amt : 0));
      let type = rRow.type || (localRow ? localRow.type : 'Sale');
      let desc = (rRow.desc !== undefined && rRow.desc !== '') ? rRow.desc : (localRow ? localRow.desc : '');
      let party = (rRow.party !== undefined && rRow.party !== '') ? rRow.party : (localRow ? localRow.party : '');
      let phone = (rRow.phone !== undefined && rRow.phone !== '') ? rRow.phone : (localRow ? localRow.phone : '');
      let by = rRow.by || rRow.user || (localRow ? localRow.by : 'Admin');
      let voidVal = rRow.void !== undefined ? rRow.void : (localRow ? localRow.void : 0);
      let removedVal = rRow.removed !== undefined ? rRow.removed : (localRow ? localRow.removed : 0);

      return Object.assign({}, localRow || {}, rRow, {
        d: d,
        t: t,
        pay: pay,
        cat: cat,
        amt: amt,
        type: type,
        desc: desc,
        party: party,
        phone: phone,
        by: by,
        void: voidVal,
        removed: removedVal
      });
    }
    if (table === 'bills') {
      let d = rRow.d || toBdDate(rRow.date || (localRow ? localRow.d : ''));
      let pay = rRow.pay || rRow.method || (localRow ? localRow.pay : 'Cash');
      let lines = localRow ? localRow.lines : [];
      if (rRow.items && typeof rRow.items === 'string' && rRow.items.startsWith('[')) {
        try { lines = JSON.parse(rRow.items); } catch(e){}
      }
      return Object.assign({}, localRow || {}, rRow, {
        d: d,
        pay: pay,
        lines: lines,
        total: +(rRow.total || (localRow ? localRow.total : 0))
      });
    }
    if (table === 'products') {
      return Object.assign({}, localRow || {}, rRow, {
        name: rRow.name || (localRow ? localRow.name : ''),
        buy: +(rRow.buy !== undefined && rRow.buy !== '' ? rRow.buy : (rRow.cost !== undefined && rRow.cost !== '' ? rRow.cost : (localRow ? localRow.buy : 0))),
        sell: +(rRow.sell !== undefined && rRow.sell !== '' ? rRow.sell : (rRow.price !== undefined && rRow.price !== '' ? rRow.price : (localRow ? localRow.sell : 0))),
        code: rRow.code || rRow.barcode || (localRow ? localRow.code : ''),
        cat: rRow.cat || rRow.category || (localRow ? localRow.cat : '')
      });
    }
    if (table === 'cust') {
      return Object.assign({}, localRow || {}, rRow, {
        name: rRow.name || (localRow ? localRow.name : ''),
        kind: rRow.kind || (localRow ? localRow.kind : ''),
        phone: rRow.phone || (localRow ? localRow.phone : ''),
        area: rRow.area || rRow.address || (localRow ? localRow.area : ''),
        op: +(rRow.op !== undefined && rRow.op !== '' ? rRow.op : (rRow.opening !== undefined && rRow.opening !== '' ? rRow.opening : (localRow ? localRow.op : 0)))
      });
    }
    if (table === 'ltx') {
      let d = rRow.d || toBdDate(rRow.date || (localRow ? localRow.d : ''));
      return Object.assign({}, localRow || {}, rRow, {
        d: d,
        cId: rRow.cId || rRow.partyId || (localRow ? localRow.cId : ''),
        type: rRow.type || rRow.kind || (localRow ? localRow.type : ''),
        amt: +(rRow.amt || (localRow ? localRow.amt : 0)),
        note: rRow.note !== undefined ? rRow.note : (localRow ? localRow.note : ''),
        link: rRow.link || rRow.linkEntryId || (localRow ? localRow.link : '')
      });
    }
    return Object.assign({}, localRow || {}, rRow);
  }

  // ─── PUSH ──────────────────────────────────────────────────────────────────
  
  function push(force = false) {
    if (isPushing || !navigator.onLine) return;
    if (!API_URL || API_URL.indexOf('PASTE_YOUR') !== -1) return;
    
    const changes = {};
    let hasChanges = false;

    Object.keys(TABLES).forEach(sKey => {
      if (!window.S[sKey] || !Array.isArray(window.S[sKey])) return;
      
      const lastU = force ? 0 : (syncState.lastPushU[sKey] || 0);
      const delta = window.S[sKey].filter(row => (row.u || 0) > lastU);
      
      if (delta.length > 0) {
        changes[sKey] = delta.map(r => formatRowForServer(sKey, r));
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    isPushing = true;
    updateStatus('pend');
    log('sync', 'Pushing changes', { tables: Object.keys(changes) });

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'push',
        token: API_TOKEN,
        schema: 2,
        since: syncState.lastPullU,
        changes: changes
      })
    })
    .then(res => res.json())
    .then(res => {
      if (res.ok) {
        Object.keys(res.acks || {}).forEach(sKey => {
          syncState.lastPushU[sKey] = res.serverU;
        });
        saveState();
        log('sync', 'Push successful', { serverU: res.serverU });
        updateStatus('ok');
        
        // Immediately pull after push to confirm server state and sync any concurrent changes
        setTimeout(() => pull(), 200);
        
        if (res.conflicts && res.conflicts.length > 0) {
          pull();
        }
      } else {
        logErr('sync', 'Push failed', res);
        updateStatus('offl');
      }
    })
    .catch(err => {
      logErr('sync', 'Push network error', err);
      updateStatus('offl');
    })
    .finally(() => { isPushing = false; });
  }

  // ─── PULL ──────────────────────────────────────────────────────────────────

  function pull(force = false) {
    if (isPulling || !navigator.onLine) return;
    if (!API_URL || API_URL.indexOf('PASTE_YOUR') !== -1) return;
    
    isPulling = true;
    updateStatus('pend');

    // If local entries are empty or force is specified, pull all historical data from since=0
    const hasLocalEntries = window.S && Array.isArray(window.S.entries) && window.S.entries.length > 0;
    const sinceU = (force || !hasLocalEntries) ? 0 : (syncState.lastPullU || 0);
    
    // Add cache buster to pull URL to bypass mobile browser aggressive caching
    const url = `${API_URL}?action=pull&token=${API_TOKEN}&since=${sinceU}&_t=${Date.now()}`;
    
    fetch(url)
    .then(res => res.json())
    .then(res => {
      if (res.ok && res.changes) {
        let applied = 0;
        
        Object.keys(res.changes).forEach(sKey => {
          const remoteRows = res.changes[sKey];
          if (!remoteRows || remoteRows.length === 0) return;
          if (!window.S[sKey]) window.S[sKey] = [];

          const localMap = {};
          window.S[sKey].forEach((r, i) => { localMap[r.id] = i; });

          remoteRows.forEach(rRow => {
            const localIdx = localMap[rRow.id];
            if (localIdx === undefined) {
              const normalized = normalizeRemoteRow(sKey, rRow, null);
              window.S[sKey].push(normalized);
              applied++;
            } else {
              const localRow = window.S[sKey][localIdx];
              // Update if remote is newer OR if local has missing critical fields
              if ((rRow.u || 0) > (localRow.u || 0) || !localRow.d || force) {
                window.S[sKey][localIdx] = normalizeRemoteRow(sKey, rRow, localRow);
                applied++;
              }
            }
          });
        });

        // Always update cursor to server timestamp
        if (res.serverU) {
          syncState.lastPullU = res.serverU;
          saveState();
        }

        if (applied > 0 || force) {
          log('sync', 'Pull applied changes', { applied });
          
          if (typeof window.persist === 'function') window.persist();
          else if (typeof window.save === 'function') window.save();

          // Trigger universal UI redraw across all tabs
          try {
            if (typeof window.redrawActiveView === 'function') window.redrawActiveView();
            if (typeof window.homeUI === 'function') window.homeUI();
            if (typeof window.render === 'function') window.render();
            if (typeof window.calc === 'function') window.calc();
            if (typeof window.animateCounts === 'function') window.animateCounts();
          } catch(uiErr) {
            console.warn('UI redraw warning after pull:', uiErr);
          }

          if (force && typeof window.ltoast === 'function') {
            window.ltoast(window.lb ? window.lb('✅ Cloud sync complete (' + applied + ' updated)', '✅ ক্লাউড সিঙ্ক সম্পন্ন (' + applied + ' আপডেট)') : '✅ Cloud sync complete');
          }
        }
        updateStatus('ok');
      }
    })
    .catch(err => {
      updateStatus('offl');
      logErr('sync', 'Pull network error', err);
    })
    .finally(() => { isPulling = false; });
  }

  // ─── SCHEDULER ─────────────────────────────────────────────────────────────

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), 400); // 400ms debounce for near-instant sync
  }

  function start() {
    if (!API_URL || API_URL.indexOf('PASTE_YOUR') !== -1) {
      console.warn('Sync v2: API_URL not configured. Sync disabled.');
      return;
    }

    loadState();
    
    // Wait for S and dependencies to be defined
    const initInterval = setInterval(() => {
      if (window.S && window.save) {
        clearInterval(initInterval);
        
        backfill();
        
        // Wrap window.save for transparent auto-sync trigger
        if (!window._syncWrapped) {
          const originalSave = window.save;
          window.save = function() {
            const result = originalSave.apply(this, arguments);
            schedulePush();
            return result;
          };
          window._syncWrapped = true;
        }
        
        // Initial push to send any local un-synced data
        push();
        
        // Initial pull (pulls with since=0 if local is empty)
        pull();
        updateStatus('ok');
        
        // Fast background polling (every 3s for near-instant cross-device sync)
        if (pullInterval) clearInterval(pullInterval);
        pullInterval = setInterval(() => pull(), 3000);
        
        // Lifecycle and Mobile wakeup listeners
        window.addEventListener('online', () => pull());
        window.addEventListener('focus', () => pull());
        document.addEventListener('visibilitychange', function() {
          if (!document.hidden) pull();
        });
        
        log('sync', 'Sync v2 started successfully');
      }
    }, 500);
  }

  // Public API
  window.NcsSync = {
    start: start,
    push: push,
    pull: pull,
    schedulePush: schedulePush,
    nextU: nextU
  };

  // Auto-start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
