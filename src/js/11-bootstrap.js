// Expose to window for v10 Sync engine and database
window.save = save;
window.persist = persist;
window.render = render;
window.homeUI = homeUI;
window.redrawActiveView = typeof redrawActiveView === 'function' ? redrawActiveView : null;
window.calc = typeof calc === 'function' ? calc : null;
window.animateCounts = typeof animateCounts === 'function' ? animateCounts : null;
window.POS = POS;
window.ledUI = ledUI;
window.setSt = setSt;
window.S = S;
window.NcsDB = NcsDB;

applyLang();
start();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
