const { app, BrowserWindow, Menu, dialog, shell, protocol, net, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { pathToFileURL } = require('url');

// The app files live in "www". Packaged: resources/www. Dev: ../www
const WWW = app.isPackaged ? path.join(process.resourcesPath, 'www') : path.join(__dirname, '..', 'www');

// Serve the app from app://ncs/ (a secure origin: camera, clipboard and fetch behave like on https)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 600,
    backgroundColor: '#F7F7F5',
    title: 'NCS Accounts',
    icon: path.join(WWW, 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL('app://ncs/index.html');

  // Links to other sites (WhatsApp, Facebook...) open in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://ncs/')) {
      e.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  win.on('closed', () => { win = null; });
}

function buildMenu() {
  const template = [
    { label: 'File', submenu: [{ role: 'quit', label: 'Exit' }] },
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'togglefullscreen' }, { type: 'separator' },
      { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }
    ] },
    { label: 'Help', submenu: [
      { label: 'Check for updates', click: () => checkUpdates(true) },
      { label: 'Version ' + app.getVersion(), enabled: false }
    ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

let manualCheck = false;
function checkUpdates(manual) {
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox({ message: 'Updates only work in the installed app.' });
    return;
  }
  manualCheck = !!manual;
  autoUpdater.checkForUpdates().catch(() => {
    if (manual) dialog.showMessageBox({ type: 'warning', message: 'Could not check for updates. Check your internet connection.' });
  });
}

function setupUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // if you pick "Later", it installs when you close the app
  autoUpdater.on('update-available', (i) => {
    if (manualCheck) dialog.showMessageBox({ message: 'Version ' + i.version + ' found. Downloading now.' });
  });
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) dialog.showMessageBox({ message: 'You have the latest version (' + app.getVersion() + ').' });
    manualCheck = false;
  });
  autoUpdater.on('update-downloaded', (i) => {
    dialog.showMessageBox(win || undefined, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 1,
      cancelId: 1,
      title: 'Update ready',
      message: 'Version ' + i.version + ' is ready to install.',
      detail: 'Pick "Later" if you are in the middle of work. It installs automatically when you close the app.'
    }).then((r) => { if (r.response === 0) autoUpdater.quitAndInstall(); });
  });
  autoUpdater.on('error', (e) => {
    console.log('Updater error:', e && e.message);
    if (manualCheck) dialog.showMessageBox({ type: 'warning', message: 'Update check failed: ' + (e && e.message ? e.message : e) });
    manualCheck = false;
  });
  setTimeout(() => checkUpdates(false), 10 * 1000);
  setInterval(() => checkUpdates(false), 4 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.ncs.accounts');

  protocol.handle('app', (request) => {
    const u = new URL(request.url);
    let p = decodeURIComponent(u.pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(WWW, p));
    if (!file.startsWith(WWW)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });

  // Camera (barcode scan) and clipboard only; everything else denied
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(['media', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission));
  });

  buildMenu();
  createWindow();
  setupUpdater();

  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
