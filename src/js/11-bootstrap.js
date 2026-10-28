// Expose to window for v10 Sync engine and database
window.save = save;
window.render = render;
window.homeUI = homeUI;
window.POS = POS;
window.ledUI = ledUI;
window.setSt = setSt;
window.S = S;
window.NcsDB = NcsDB;

applyLang();
start();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
