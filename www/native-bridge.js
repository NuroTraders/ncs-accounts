/* NCS native bridge. Injected at build time into the native copies of index.html only.
   The PWA in the repo root never loads this file.
   - Both apps: turns the service worker off (the app files are bundled, so it is not needed).
   - Android: share, file save, print, and live updates from GitHub Releases. */
(function () {
  'use strict';
  var REPO = '';
  var NATIVE_VERSION = '10.1.2';

  var cap = window.Capacitor;
  var isAndroid = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var isElectron = /Electron\//.test(navigator.userAgent);
  if (!isAndroid && !isElectron) return;
  window.NCS_NATIVE = isAndroid ? 'android' : 'electron';

  // ---- Service worker is not used in native apps ----
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register = function () { return Promise.resolve(); };
      if (navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations()
          .then(function (rs) { rs.forEach(function (r) { r.unregister(); }); })
          .catch(function () {});
      }
    }
  } catch (e) {}

  if (!isAndroid) return; // Windows needs nothing else: Electron handles print, downloads and updates itself.

  var P = cap.Plugins || {};

  // ---- Tiny notice bar (own styles, does not touch the app's CSS) ----
  function notice(text, btnText, onBtn) {
    try {
      var old = document.getElementById('ncs-native-notice');
      if (old) old.remove();
      var d = document.createElement('div');
      d.id = 'ncs-native-notice';
      d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 72px);z-index:2147483647;' +
        'background:#2F5D3A;color:#fff;border-radius:12px;padding:10px 14px;font:14px/1.4 system-ui,sans-serif;' +
        'display:flex;gap:10px;align-items:center;box-shadow:0 4px 18px rgba(0,0,0,.3)';
      var s = document.createElement('span');
      s.style.flex = '1';
      s.textContent = text;
      d.appendChild(s);
      if (btnText) {
        var b = document.createElement('button');
        b.textContent = btnText;
        b.style.cssText = 'background:#fff;color:#2F5D3A;border:0;border-radius:8px;padding:6px 12px;font-weight:600';
        b.onclick = function () { d.remove(); if (onBtn) onBtn(); };
        d.appendChild(b);
      }
      var x = document.createElement('button');
      x.textContent = '\u00D7';
      x.setAttribute('aria-label', 'Close');
      x.style.cssText = 'background:transparent;color:#fff;border:0;font-size:20px;padding:0 4px';
      x.onclick = function () { d.remove(); };
      d.appendChild(x);
      document.body.appendChild(d);
      if (!btnText) setTimeout(function () { if (d.parentNode) d.remove(); }, 4000);
    } catch (e) {}
  }

  // ---- Save or share a file (replaces blob downloads, which Android WebView ignores) ----
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(blob);
    });
  }
  function saveAndShare(name, blob) {
    if (!P.Filesystem || !P.Share) { notice('Saving files is not available.'); return Promise.resolve(); }
    var safe = String(name || 'file').replace(/[\\/:*?"<>|]+/g, '_');
    return blobToBase64(blob).then(function (b64) {
      return P.Filesystem.writeFile({ path: safe, data: b64, directory: 'CACHE' });
    }).then(function (r) {
      return P.Share.share({ title: safe, url: r.uri, dialogTitle: 'Save or share' });
    }).catch(function (e) {
      if (e && /cancel/i.test(String(e.message || e))) return;
      notice('Could not save file: ' + (e && e.message ? e.message : e));
    });
  }

  // Remember blobs created for downloads
  var blobs = {};
  var origCreate = URL.createObjectURL;
  URL.createObjectURL = function (obj) {
    var u = origCreate.call(URL, obj);
    if (obj instanceof Blob) blobs[u] = obj;
    return u;
  };
  var origRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = function (u) { setTimeout(function () { delete blobs[u]; }, 60000); return origRevoke.call(URL, u); };

  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var a = this;
    if (a.hasAttribute('download') && blobs[a.href]) {
      saveAndShare(a.getAttribute('download'), blobs[a.href]);
      return;
    }
    return origClick.apply(this, arguments);
  };

  // ---- Share ----
  try {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true, writable: true,
      value: function (d) { return !!d && (!d.files || d.files.length > 0); }
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true, writable: true,
      value: function (d) {
        d = d || {};
        if (d.files && d.files.length) return saveAndShare(d.files[0].name, d.files[0]);
        if (!P.Share) return Promise.reject(new Error('Share not available'));
        return P.Share.share({ title: d.title, text: d.text, url: d.url, dialogTitle: 'Share' });
      }
    });
  } catch (e) {}

  // ---- Print (Android print dialog; you can pick "Save as PDF") ----
  window.print = function () {
    if (P.NativePrint) {
      P.NativePrint.print({ name: 'NCS Accounts' }).catch(function (e) { notice('Print failed: ' + (e && e.message ? e.message : e)); });
    } else {
      notice('Printing is not available on this device.');
    }
  };

  // ---- Live updates from GitHub Releases ----
  var U = P.CapacitorUpdater;
  var checking = false, lastCheck = 0, pendingVersion = '';

  function num(v) { return String(v).split('.').map(function (x) { return parseInt(x, 10) || 0; }); }
  function newer(a, b) {
    var x = num(a), y = num(b);
    for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
    return false;
  }
  function getJson(url) {
    if (P.CapacitorHttp && P.CapacitorHttp.get) {
      return P.CapacitorHttp.get({ url: url, headers: { 'Cache-Control': 'no-cache' } }).then(function (r) {
        if (r.status !== 200) throw new Error('HTTP ' + r.status);
        return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      });
    }
    return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function checkForUpdate(force) {
    if (!U || !REPO || checking) return;
    if (!force && Date.now() - lastCheck < 30 * 60 * 1000) return;
    checking = true; lastCheck = Date.now();
    getJson('https://github.com/' + REPO + '/releases/latest/download/update.json')
      .then(function (meta) {
        if (!meta || !meta.version || !meta.url) return;
        return U.current().then(function (cur) {
          var curVer = cur && cur.bundle && cur.bundle.version && cur.bundle.version !== 'builtin' ? cur.bundle.version : NATIVE_VERSION;
          if (!newer(meta.version, curVer) || pendingVersion === meta.version) return;
          return U.download({ url: meta.url, version: meta.version }).then(function (b) {
            pendingVersion = meta.version;
            return U.next({ id: b.id }).then(function () {
              notice('Update ' + meta.version + ' is ready.', 'Restart now', function () { U.set({ id: b.id }); });
            });
          });
        });
      })
      .catch(function (e) { console.log('NCS update check failed', e); })
      .then(function () { checking = false; });
  }

  if (U) {
    // Confirms this version started fine. If a new version fails to start, the plugin rolls back automatically.
    U.notifyAppReady().catch(function () {});
    setTimeout(function () { checkForUpdate(true); }, 6000);
    if (P.App && P.App.addListener) P.App.addListener('resume', function () { checkForUpdate(false); });
  }
  window.NCS_checkUpdate = function () { checkForUpdate(true); };
})();
