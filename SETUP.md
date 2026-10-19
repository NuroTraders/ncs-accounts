# NCS Accounts: Android + Windows apps (one-time setup)

You do this once. After that, every update is just "upload files to GitHub".

## 1. Put the project in your GitHub repository
1. Unzip `ncs-native-project.zip` on your PC.
2. Open your repository on github.com, then **Add file → Upload files**.
3. Drag in everything from the unzipped folder (all files and the folders `.github`, `electron`, `native`, `scripts`, `build`). Click **Commit changes**.
   - GitHub accepts up to 100 files per upload. This project is under that.
   - If the hidden `.github` folder does not upload, use **Add file → Create new file**, type `.github/workflows/build.yml` as the name, and paste the contents of that file.
4. The repository must be **Public** (the apps download updates from its Releases page). Your `config.js` is encrypted, so this is safe.

## 2. Allow the build to publish releases
Repository **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**.

## 3. (Nothing to do) Build runs on GitHub's servers
No Android Studio, no Node.js, nothing to install on your PC.

## 4. Add the signing key (so the phone app can always update)
Open `PRIVATE-signing-secrets.txt`. In the repository go to **Settings → Secrets and variables → Actions → New repository secret** and create two secrets:
- Name `ANDROID_KEYSTORE_PASSWORD`, value from the file.
- Name `ANDROID_KEYSTORE_B64`, value is the long line from the file.

Keep `PRIVATE-signing-secrets.txt` backed up. Never upload it to GitHub.

## 5. Build
Open the **Actions** tab, pick **Build NCS apps**, press **Run workflow**. It takes about 10 to 20 minutes.
When it is green, open the **Releases** page on the right side of the repository. You will see:
- `NCS-Accounts-<version>.apk` (phone)
- `NCS-Accounts-Setup-<version>.exe` (PC)

## 6. Install
- **Phone:** open the Releases page in the phone browser, download the `.apk`, tap it. Android will ask to allow "install unknown apps" for your browser. Allow it once.
- **PC:** run the Setup `.exe`. Windows may show "Windows protected your PC": click **More info → Run anyway** (the app is not code-signed, which costs money).

## 7. First start on each device
The native apps have their own storage, separate from the PWA. Open the app, enter the **shop passphrase**, and it syncs from your Google Sheet.
Before switching a device over, open the old PWA and let it sync (or take a JSON backup) so nothing is left only on that device.

## 8. Releasing an update (every time)
1. Change the app as usual. **Raise `APP_VERSION` in `index.html`** (your handover rules already require this).
2. Upload the changed files to the repository (same as before).
3. The build starts by itself and creates a new release.
4. Devices update on their own:
   - **Phone:** the new version downloads quietly in the background. A green bar appears: tap **Restart now**, or it applies the next time the app is closed and reopened.
   - **PC:** a dialog says "Update ready". Pick **Restart now** or **Later** (it then installs when you close the app). Help menu → Check for updates also works.

If `APP_VERSION` is not raised, the build says "Nothing to build" and does nothing. That is on purpose.

You only need to install a new `.apk` by hand if the native part changes (new permission, new plugin). That is rare, and the handover notes will say so.

## Files in this project
| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `config.js`, fonts, icons | Your PWA (unchanged, still works on the web) |
| `native/bridge.js` | Makes share, save-file, print and live updates work on Android; turns the service worker off in native apps |
| `scripts/prepare-www.js` | Copies the app into `www/` for both native apps and adds the bridge (your `index.html` is never edited) |
| `scripts/android-setup.js` | Creates the Android project and applies camera permission, signing, icons, print support |
| `electron/main.js` | Windows app window and auto-updater |
| `electron-builder.config.js` | Windows installer settings |
| `.github/workflows/build.yml` | The cloud build |
