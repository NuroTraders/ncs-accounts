// Creates (or refreshes) the Android project and applies the NCS customisations.
// Safe to run many times. Run after: node scripts/prepare-www.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const run = (c) => execSync(c, { cwd: root, stdio: 'inherit' });
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), s); };

function patch(file, find, replace, already) {
  let s = read(file);
  if (already && s.includes(already)) return;            // already patched
  if (!s.includes(find)) throw new Error(`android-setup: could not find expected text in ${file}:\n${find}\nThe Capacitor template changed - update scripts/android-setup.js`);
  write(file, s.replace(find, replace));
}
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); } else fs.copyFileSync(a, b);
  }
}

if (!fs.existsSync(path.join(root, 'android'))) run('npx cap add android');
run('npx cap sync android');

const M = 'android/app/src/main/AndroidManifest.xml';
patch(M,
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.INTERNET" />\n' +
  '    <uses-permission android:name="android.permission.CAMERA" />\n' +
  '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n' +
  '    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
  'android.permission.CAMERA');

const G = 'android/app/build.gradle';
patch(G, 'versionCode 1', 'versionCode (System.getenv("VERSION_CODE") ?: "1").toInteger()', 'VERSION_CODE');
patch(G, 'versionName "1.0"', 'versionName (System.getenv("VERSION_NAME") ?: "1.0")', 'VERSION_NAME');
patch(G, '    buildTypes {',
`    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_PATH")) {
                storeFile file(System.getenv("KEYSTORE_PATH"))
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }
    }
    buildTypes {`, 'signingConfigs');
patch(G, '        release {\n            minifyEnabled false',
`        release {
            if (System.getenv("KEYSTORE_PATH")) {
                signingConfig signingConfigs.release
            }
            minifyEnabled false`, 'signingConfig signingConfigs.release');

const J = 'android/app/src/main/java/com/ncs/accounts/';
fs.copyFileSync(path.join(root, 'native/android-java/MainActivity.java'), path.join(root, J + 'MainActivity.java'));
fs.copyFileSync(path.join(root, 'native/android-java/NativePrintPlugin.java'), path.join(root, J + 'NativePrintPlugin.java'));

copyDir(path.join(root, 'native/android-res'), path.join(root, 'android/app/src/main/res'));
write('android/app/src/main/res/values/ic_launcher_background.xml',
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2F5D3A</color>\n</resources>\n');
patch('android/app/src/main/res/values/styles.xml',
  '<item name="android:background">@drawable/splash</item>',
  '<item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">#2F5D3A</item>',
  'windowSplashScreenBackground');

console.log('Android project ready.');
