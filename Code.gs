/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NCS Daily Accounts — Google Sheet Sync Backend (Option 1: Whole State + Mirror)
 * ═══════════════════════════════════════════════════════════════════════════
 *  - Stores full, uncorrupted state in the 'State' sheet (fast read/write in ~200ms).
 *  - Formats and writes human-readable rows to 'Entries' sheet with all 15 columns.
 *  - Automatically creates 'Backup <YYYY-MM-DD>' sheets on day closing.
 *  - Supports POS bill inbox and product catalog import.
 *  - Dual auth parameter support: handles both 'token' and 'key'.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const KEY = 'ncs_7Kp9mQ2xR8vL4nJ6wT1yB3cD5fG0hS3a';
const CH = 40000;

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(n) {
  const s = SpreadsheetApp.getActive();
  return s.getSheetByName(n) || s.insertSheet(n);
}

function read_() {
  const sh = sheet_('State');
  const rev = +sh.getRange('B1').getValue() || 0;
  const n = sh.getLastRow();
  const state = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(r => r[0]).join('') : '';
  return { rev: rev, state: state };
}

function write_(sh, rev, state) {
  sh.clear();
  sh.getRange('A1').setValue('State (do not edit)');
  sh.getRange('B1').setValue(rev);
  const parts = [];
  for (let i = 0; i < state.length; i += CH) {
    parts.push([state.slice(i, i + CH)]);
  }
  if (parts.length) {
    sh.getRange(2, 1, parts.length, 1).setValues(parts);
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const token = p.token || p.key || '';
  if (token !== KEY) return out_({ ok: false, error: 'auth' });
  
  const action = p.action || 'pull';
  
  if (action === 'ping') {
    const sh = sheet_('State');
    const rev = +sh.getRange('B1').getValue() || 0;
    return out_({ ok: true, rev: rev });
  }
  
  if (action === 'inbox') {
    const since = +(p.since || 0);
    const sh = sheet_('POS_Inbox');
    if (!sh.getLastRow()) return out_({ ok: true, rows: [] });
    const rows = sh.getDataRange().getValues().slice(1)
      .filter(r => +r[0] > since)
      .map(r => ({ seq: +r[0], bill: JSON.parse(r[1]) }));
    return out_({ ok: true, rows: rows });
  }
  
  if (action === 'catalog') {
    const sh = sheet_('Products');
    if (!sh.getLastRow()) return out_({ ok: true, items: [] });
    const rows = sh.getDataRange().getValues().slice(1).map(r => ({
      id: r[0], name: r[1], barcode: r[2], price: +r[3] || 0, del: !!r[4]
    }));
    return out_({ ok: true, items: rows });
  }
  
  // Default: pull full state
  const data = read_();
  return out_({ ok: true, rev: data.rev, state: data.state });
}

function doPost(e) {
  let d = {};
  try {
    d = JSON.parse(e.postData.contents);
  } catch (x) {
    return out_({ ok: false, error: 'bad_json' });
  }
  
  const token = d.token || d.key || '';
  if (token !== KEY) return out_({ ok: false, error: 'auth' });
  
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const cur = read_();
    if (!d.force && cur.rev > 0 && cur.rev !== (d.base || 0)) {
      return out_({ ok: false, conflict: true, rev: cur.rev });
    }
    
    // 1. Write full state blob
    if (d.state) {
      write_(sheet_('State'), d.rev, d.state);
    }
    
    // 2. Write human-readable Entries sheet
    const H = d.head || [
      'Date', 'Time', 'Type', 'Description', 'Category', 'Payment',
      'Amount', 'Previous Cash', 'Cash Balance', 'Actual Cash', 'Difference',
      'Status', 'Entered by', 'Party', 'Phone'
    ];
    const en = sheet_('Entries');
    en.clear();
    en.getRange(1, 1, 1, H.length).setValues([H]).setFontWeight('bold');
    en.setFrozenRows(1);
    if (d.rows && d.rows.length) {
      en.getRange(2, 1, d.rows.length, H.length).setValues(d.rows);
    }
    
    // 3. Write Log sheet
    if (d.log && d.log.length) {
      const lg = sheet_('Log');
      if (!lg.getLastRow()) lg.appendRow(['Time', 'User', 'Action', 'Detail']);
      lg.getRange(lg.getLastRow() + 1, 1, d.log.length, 4).setValues(d.log);
    }
    
    // 4. Write closed day backups
    if (d.snaps && Array.isArray(d.snaps) && d.state) {
      d.snaps.forEach(day => {
        write_(sheet_('Backup ' + day), d.rev, d.state);
      });
    }
    
    return out_({ ok: true, rev: d.rev });
  } finally {
    lock.releaseLock();
  }
}
