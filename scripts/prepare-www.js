// Builds the "www" folder used by BOTH native apps (Android via Capacitor, Windows via Electron).
// Your PWA files in the repo root are never modified. Run: node scripts/prepare-www.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// ---- 1. Read the app version from index.html (the LAST assignment wins, like in the app) ----
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const all = [...html.matchAll(/APP_VERSION\s*=\s*'([^']+)'/g)];
if (!all.length) throw new Error("Could not find APP_VERSION='x.y' in index.html");
const appVersion = all[all.length - 1][1];
const cleanVersion = appVersion.replace(/-.*$/, '');
const parts = cleanVersion.split('.').map(Number);
while (parts.length < 3) parts.push(0);
const version = parts.join('.');                       // e.g. 10.0.0
const versionCode = parts[0] * 10000 + parts[1] * 100 + parts[2]; // Android versionCode, e.g. 100000

// ---- 2. Which GitHub repo hosts the releases ----
let repo = process.env.GITHUB_REPOSITORY || '';
if (!repo && pkg.repository) {
  const u = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url || '';
  const m = u.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  if (m) repo = m[1];
}

// ---- 3. Copy web files ----
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
const keep = /^(index\.html|config\.js|diag\.js|sync\.js|manifest\.webmanifest|icon-.*\.png|logo-.*\.png|.*\.(ttf|woff2))$/i;
for (const f of fs.readdirSync(root)) {
  if (keep.test(f) && fs.statSync(path.join(root, f)).isFile()) fs.copyFileSync(path.join(root, f), path.join(www, f));
}

// ---- 4. Native bridge + inject it into the COPY of index.html ----
let bridge = fs.readFileSync(path.join(root, 'native', 'bridge.js'), 'utf8');
bridge = bridge.replace(/__REPO__/g, repo).replace(/__VERSION__/g, version);
fs.writeFileSync(path.join(www, 'native-bridge.js'), bridge);

const tag = '<script src="config.js"></script>';
if (!html.includes(tag)) throw new Error('index.html no longer contains ' + tag + ' - update scripts/prepare-www.js');
fs.writeFileSync(path.join(www, 'index.html'), html.replace(tag, '<script src="native-bridge.js"></script>' + tag));

// ---- 5. Report ----
console.log('appVersion=' + appVersion);
console.log('version=' + version);
console.log('versionCode=' + versionCode);
console.log('repo=' + (repo || '(none - Android live updates disabled)'));
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nversionCode=${versionCode}\n`);
}
fs.writeFileSync(path.join(root, '.native-version.json'), JSON.stringify({ version, versionCode, repo }));
