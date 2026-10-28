/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NCS Accounts — Diagnostics Engine (Beta)
 * ═══════════════════════════════════════════════════════════════════════════
 *  - Rolling buffer of last 200 events (localStorage: ncs_diag_v1)
 *  - Captures JS errors and unhandled promise rejections
 *  - Exposes window.NcsDiag for the app to use
 *  - Generates a report for WhatsApp sharing (manual only)
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const MAX_EVENTS = 200;
  const KEY = 'ncs_diag_v1';
  const VERSION = (window.APP_VERSION || '10.1.1');

  // Helper: get current client ID if sync is initialized
  function getClientId() {
    try {
      const sync = JSON.parse(localStorage.getItem('ncs_sync_v10') || '{}');
      return sync.clientId ? sync.clientId.slice(-6) : 'unknown';
    } catch(e) { return 'unknown'; }
  }

  // Helper: safe stringify to avoid circular reference crashes
  function safeStr(obj) {
    if (!obj) return '';
    try { return JSON.stringify(obj); } 
    catch(e) { return '[unserializable]'; }
  }

  // Load existing buffer
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e) { return []; }
  }

  // Save buffer
  function save(events) {
    try { localStorage.setItem(KEY, JSON.stringify(events)); } catch(e) {}
  }

  // Push an event to the buffer
  function push(lvl, tag, msg, meta) {
    const events = load();
    events.push({
      t: Date.now(),
      lvl: lvl,
      tag: tag,
      msg: String(msg || ''),
      meta: meta || null,
      v: VERSION
    });
    // Keep only the newest MAX_EVENTS
    if (events.length > MAX_EVENTS) events.shift();
    save(events);
  }

  // Global error catchers (automated)
  window.addEventListener('error', function(e) {
    push('error', 'ui', e.message || 'Unknown error', {
      file: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error ? e.error.stack : null
    });
  });

  window.addEventListener('unhandledrejection', function(e) {
    push('error', 'ui', 'Unhandled Promise Rejection', {
      reason: String(e.reason || ''),
      stack: e.reason && e.reason.stack ? e.reason.stack : null
    });
  });

  // Public API
  window.NcsDiag = {
    
    // Logging methods for the app to call
    log: function(tag, msg, meta) { push('info', tag, msg, meta); },
    warn: function(tag, msg, meta) { push('warn', tag, msg, meta); },
    err: function(tag, msg, meta) { push('error', tag, msg, meta); },

    // Clear the log
    clear: function() { save([]); },

    // Get raw array of events
    getEvents: function() { return load(); },

    // Get the most recent error event if any
    getLastError: function() {
      const events = load();
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].lvl === 'error') return events[i];
      }
      return null;
    },

    // Generate a full report payload for the UI to share
    makeReport: function(description, activity) {
      const events = load();
      
      // Count severities
      let errCount = 0, warnCount = 0;
      events.forEach(function(e) {
        if (e.lvl === 'error') errCount++;
        if (e.lvl === 'warn') warnCount++;
      });

      // Get sync status safely
      let syncStatus = 'unknown';
      let stateSize = 0;
      try {
        const syncData = JSON.parse(localStorage.getItem('ncs_sync_v10') || '{}');
        syncStatus = syncData.lastPullU ? 'active' : 'idle';
        const stateData = localStorage.getItem('ncs_accounts_v2');
        stateSize = stateData ? stateData.length : 0;
      } catch(e) {}

      const meta = {
        version: VERSION,
        clientId: getClientId(),
        device: navigator.userAgent,
        time: new Date().toISOString(),
        activity: activity || 'Not specified',
        description: description || 'No description provided',
        errorCount: errCount,
        warnCount: warnCount,
        syncStatus: syncStatus,
        stateSizeBytes: stateSize
      };

      // Human-readable text version
      let txt = "=== NCS ACCOUNTS BETA REPORT ===\n";
      for (const k in meta) txt += `${k}: ${meta[k]}\n`;
      txt += "\n=== EVENT LOG (Last 200) ===\n";
      
      events.forEach(function(e) {
        const timeStr = new Date(e.t).toLocaleTimeString();
        txt += `[${timeStr}] [${e.lvl.toUpperCase()}] [${e.tag}] ${e.msg}\n`;
        if (e.meta) txt += `   ↳ Meta: ${safeStr(e.meta)}\n`;
      });

      return {
        meta: meta,
        events: events,
        text: txt
      };
    }
  };

})();