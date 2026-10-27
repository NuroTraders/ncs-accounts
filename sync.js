/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NCS Accounts — Sync Engine v2 (Model B: Delta + Structured Mirror)
 * ═══════════════════════════════════════════════════════════════════════════
 *  - Implements delta push/pull using per-row 'u' timestamps.
 *  - Backfills existing data on first run.
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
      if (window.save) window.save();
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
        changes[sKey] = delta;
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    isPushing = true;
    log('sync', 'Pushing changes', { tables: Object.keys(changes) });

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps script prefers text/plain for CORS
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
        // Update lastPushU for accepted tables
        Object.keys(res.acks).forEach(sKey => {
          syncState.lastPushU[sKey] = res.serverU;
        });
        saveState();
        log('sync', 'Push successful', { serverU: res.serverU });
        
        // If there are conflicts, pull them immediately
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

          // Create a map of local rows by ID
          const localMap = {};
          window.S[sKey].forEach((r, i) => { localMap[r.id] = i; });

          remoteRows.forEach(rRow => {
            const localIdx = localMap[rRow.id];
            if (localIdx === undefined) {
              // New row from server
              window.S[sKey].push(rRow);
              applied++;
            } else {
              // Conflict resolution: higher 'u' wins
              const localRow = window.S[sKey][localIdx];
              if ((rRow.u || 0) > (localRow.u || 0)) {
                window.S[sKey][localIdx] = rRow;
                applied++;
              }
            }
          });
        });

        if (applied > 0) {
          log('sync', 'Pull applied changes', { applied });
          syncState.lastPullU = res.serverU;
          saveState();
          
          if (window.save) window.save();
          if (window.render) window.render();
          if (window.homeUI) window.homeUI(); // Refresh UI if available
        } else {
          syncState.lastPullU = res.serverU;
          saveState();
        }
      }
    })
    .catch(err => logErr('sync', 'Pull network error', err))
    .finally(() => { isPulling = false; });
  }

  // ─── SCHEDULER ─────────────────────────────────────────────────────────────

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), 2000); // 2 second debounce
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
            
            // ✨ FIX: Wrap window.save so it triggers the sync engine automatically
            if (!window._syncWrapped) {
                const originalSave = window.save;
                window.save = function() {
                    const result = originalSave.apply(this, arguments);
                    if (window.NCS_CONFIG && window.NCS_CONFIG.SYNC_MODE === 'v2') {
                        schedulePush(); // This tells sync.js to push the changes!
                    }
                    return result;
                };
                window._syncWrapped = true;
            }
            
            // Initial pull
            pull();
        
        // Set up polling
        if (pullInterval) clearInterval(pullInterval);
        pullInterval = setInterval(pull, 30000); // Every 30s
        
        // Listeners
        window.addEventListener('online', pull);
        window.addEventListener('focus', pull);
        
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