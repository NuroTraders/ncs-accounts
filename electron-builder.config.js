// Windows installer settings. The GitHub repo is taken from the build environment (GitHub Actions sets it),
// so the installed app knows where to look for updates.
const repo = (process.env.GITHUB_REPOSITORY || '').split('/');
const publish = repo.length === 2 && repo[0] && repo[1]
  ? [{ provider: 'github', owner: repo[0], repo: repo[1] }]
  : [{ provider: 'github' }];

module.exports = {
  appId: 'com.ncs.accounts',
  productName: 'NCS Accounts',
  copyright: 'Nur Computer & Stationery',
  directories: { output: 'dist', buildResources: 'build' },
  files: [
    'electron/**/*',
    'package.json',
    '!node_modules/@capacitor/**',
    '!node_modules/@capgo/**'
  ],
  extraResources: [{ from: 'www', to: 'www' }],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'build/icon.png'
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'NCS Accounts',
    deleteAppDataOnUninstall: false,
    artifactName: 'NCS-Accounts-Setup-${version}.${ext}'
  },
  publish
};
