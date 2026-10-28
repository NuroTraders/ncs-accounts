/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NCS Accounts — Sync Engine v2 (Model B: Delta + Structured Mirror)
 * ═══════════════════════════════════════════════════════════════════════════
 *  - Implements delta push/pull using per-row 'u' timestamps.
 *  - Bidirectional schema normalization between client model and Sheet columns.
 *  - Integrates with window.NcsDiag for logging.
 *  - Requires window.NCS_CONFIG, window.S, and window.save()
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const SYNC_KEY = 'ncs_sync_v10';
  const API_URL = window.NCS_CONFIG ? window.NCS_CONFIG.API_URL : '';
  const API_TOKEN = window.NCS_CONFIG ? window.NCS_CONFIG.API_TOKEN : '';
  
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
    schema: 2
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
      if (saved) syncState = Object.assign(syncState, saved);
    } catch(e) {}
    
    if (!syncState.clientId) {
      syncState.clientId = 'cl_' + Math.random().toString(36).substr(2, 9);
    }
    
    Object.keys(TABLES).forEach(k => {
      if (syncState.lastPushU[k] === undefined) syncState.lastPushU[k] = 0;
    });
    
    saveState();
  }

  function saveState() {
    localStorage.setItem(SYNC_KEY, JSON.stringify(syncState));
  }

  // Backfill missing 'u', 'v', 'removed' fields
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
      });
    });

    if (window.S._lastU === undefined || window.S._lastU < maxU) {
      window.S._lastU = maxU;
      changed = true;
    }

    if (changed) {
      log('state', 'Backfilled missing u/v/removed fields');
      if (typeof window.persist === 'function') window.persist();
      else if (typeof window.save === 'function') window.save();
    }
  }

  // Generate a monotonic 'u' timestamp
  function nextU() {
    const now = Date.now();
    if (!window.S._lastU) window.S._lastU = 0;
    const newU = Math.max(now, window.S._lastU + 1);
    window.S._lastU = newU;
    return newU;
  }

  // ─── DUAL SCHEMA TRANSLATORS ────────────────────────────────────────────────

  function formatRowForServer(table, r) {
    if (!r) return r;
    if (table === 'entries') {
      const dVal = r.d || (r.date ? (String(r.date).includes('T') ? String(r.date).slice(0, 10) : String(r.date)) : '');
      const tVal = r.t || (r.at ? new Date(+r.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}) : '');
      const payVal = r.pay || (r.wallet ? r.wallet : (r.cash ? 'Cash' : 'Cash'));
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        t: tVal,
        pay: payVal,
        wallet: r.w || (payVal !== 'Cash' ? payVal : ''),
        cash: (payVal === 'Cash' ? r.amt : ''),
        by: r.by || r.user || 'Admin',
        at: r.at || r.u || Date.now()
      });
    }
    if (table === 'bills') {
      const dVal = r.d || (r.date ? String(r.date).slice(0, 10) : '');
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        total: r.total || 0,
        paid: r.rec !== undefined ? r.rec : (r.total || 0),
        method: r.pay || 'Cash',
        cust: r.party || '',
        items: typeof r.lines === 'object' ? JSON.stringify(r.lines) : (r.items || ''),
        by: r.user || r.by || 'Admin',
        at: r.ts || r.u || Date.now()
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
      const dVal = r.d || (r.date ? String(r.date).slice(0, 10) : '');
      return Object.assign({}, r, {
        d: dVal,
        date: dVal,
        partyId: r.cId || r.partyId || '',
        kind: r.type || r.kind || '',
        note: r.note || '',
        linkEntryId: r.link || r.linkEntryId || '',
        by: r.by || 'Admin',
        at: r.at || r.u || Date.now()
      });
    }
    return r;
  }

  function normalizeRemoteRow(table, rRow, localRow) {
    if (table === 'entries') {
      let d = rRow.d;
      if (!d && rRow.date) {
        const s = String(rRow.date);
        d = s.includes('T') ? s.slice(0, 10) : s.slice(0, 10);
      }
      if (!d && localRow && localRow.d) d = localRow.d;
      if (!d && rRow.u) {
        try {
          const dt = new Date(+rRow.u);
          if (!isNaN(dt.getTime())) d = dt.toISOString().slice(0, 10);
        } catch(e){}
      }
      if (!d) d = new Date().toISOString().slice(0, 10);

      let t = rRow.t;
      if (!t && localRow && localRow.t) t = localRow.t;
      if (!t && rRow.at) {
        try {
          const dt = new Date(+rRow.at);
          if (!isNaN(dt.getTime())) t = dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});
        } catch(e){}
      }
      if (!t) t = '12:00';

      let pay = rRow.pay;
      if (!pay && rRow.wallet) pay = rRow.wallet;
      else if (!pay && rRow.cash !== undefined && rRow.cash !== '') pay = 'Cash';
      else if (!pay && localRow && localRow.pay) pay = localRow.pay;
      else if (!pay) pay = 'Cash';

      let cat = (rRow.cat !== undefined && rRow.cat !== '') ? rRow.cat : (localRow ? localRow.cat : (rRow.category || ''));
      let amt = +(rRow.amt !== undefined && rRow.amt !== '' ? rRow.amt : (localRow ? localRow.amt : 0));
      let type = rRow.type || (localRow ? localRow.type : 'Sale');
      let desc = (rRow.desc !== undefined && rRow.desc !== '') ? rRow.desc : (localRow ? localRow.desc : '');
      let party = (rRow.party !== undefined && rRow.party !== '') ? rRow.party : (localRow ? localRow.party : '');
      let phone = (rRow.phone !== undefined && rRow.phone !== '') ? rRow.phone : (localRow ? localRow.phone : '');
      let by = rRow.by || rRow.user || (localRow ? localRow.by : 'Admin');
      let voidVal = rRow.void !== undefined ? rRow.void : (localRow ? localRow.void : 0);

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
        void: voidVal
      });
    }
    if (table === 'bills') {
      let d = rRow.d || (rRow.date ? String(rRow.date).slice(0, 10) : (localRow ? localRow.d : ''));
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
      let d = rRow.d || (rRow.date ? String(rRow.date).slice(0, 10) : (localRow ? localRow.d : ''));
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
    
    const changes = {};
    let hasChanges = false;

    Object.keys(TABLES).forEach(sKey => {
      if (!window.S[sKey] || !Array.isArray(window.S[sKey])) return;
      
      const lastU = force ? 0 : syncState.lastPushU[sKey];
      const delta = window.S[sKey].filter(row => (row.u || 0) > lastU);
      
      if (delta.length > 0) {
        changes[sKey] = delta.map(r => formatRowForServer(sKey, r));
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    isPushing = true;
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
        
        if (res.conflicts && res.conflicts.length > 0) {
          pull();
        }
      } else {
        logErr('sync', 'Push failed', res);
      }
    })
    .catch(err => logErr('sync', 'Push network error', err))
    .finally(() => { isPushing = false; });
  }

  // ─── PULL ──────────────────────────────────────────────────────────────────

  function pull() {
    if (isPulling || !navigator.onLine) return;
    
    isPulling = true;
    
    const url = `${API_URL}?action=pull&token=${API_TOKEN}&since=${syncState.lastPullU}`;
    
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
              // Update if remote is newer OR if local is missing critical fields (d, t, pay)
              if ((rRow.u || 0) > (localRow.u || 0) || !localRow.d) {
                window.S[sKey][localIdx] = normalizeRemoteRow(sKey, rRow, localRow);
                applied++;
              }
            }
          });
        });

        if (applied > 0) {
          log('sync', 'Pull applied changes', { applied });
          syncState.lastPullU = res.serverU;
          saveState();
          
          if (typeof window.persist === 'function') window.persist();
          else if (typeof window.save === 'function') window.save();

          if (typeof window.redrawActiveView === 'function') {
            window.redrawActiveView();
          } else {
            if (typeof window.render === 'function') window.render();
            if (typeof window.homeUI === 'function') window.homeUI();
          }
          if (typeof window.animateCounts === 'function') {
            window.animateCounts();
          }
        } else {
          syncState.lastPullU = res.serverU;
          saveState();
        }
        updateStatus('ok');
      }
    })
    .catch(err => { updateStatus('offl'); logErr('sync', 'Pull network error', err); })
    .finally(() => { isPulling = false; });
  }

  // ─── SCHEDULER ─────────────────────────────────────────────────────────────

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), 1500); // 1.5 second debounce for responsive sync
  }

  function start() {
    if (!API_URL || API_URL.indexOf('PASTE_YOUR') !== -1) {
      console.warn('Sync v2: API_URL not configured. Sync disabled.');
      return;
    }

    loadState();
    
    // Wait for S to be defined
    const initInterval = setInterval(() => {
      if (window.S && window.save) {
        clearInterval(initInterval);
        
        backfill();
        
        // Wrap window.save if external callers use it
        if (!window._syncWrapped) {
          const originalSave = window.save;
          window.save = function() {
            const result = originalSave.apply(this, arguments);
            if (window.NCS_CONFIG && window.NCS_CONFIG.SYNC_MODE === 'v2') {
              schedulePush();
            }
            return result;
          };
          window._syncWrapped = true;
        }
        
        // Initial push to send any local un-synced data
        push();
        
        // Initial pull
        pull();
        updateStatus('ok');
        
        // Fast background polling (every 10s)
        if (pullInterval) clearInterval(pullInterval);
        pullInterval = setInterval(pull, 10000);
        
        // Lifecycle and Mobile wakeup listeners
        window.addEventListener('online', pull);
        window.addEventListener('focus', pull);
        document.addEventListener('visibilitychange', function() {
          if (!document.hidden) pull();
        });
        
        log('sync', 'Sync v2 started');
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
