
const KEY='ncs_accounts_v2',$=id=>document.getElementById(id);
const E=(id,t,type,desc,cat,amt,x)=>({id,d:'2026-10-08',t,type,desc,cat,pay:'Cash',amt,...x});
const seed=()=>({start:0,theme:'auto',dayStart:'06:00',dayEnd:'18:00',sound:false,entries:[
 E(1,'20:30','Sale','Sales till 8:30 PM','Printing',55100),
 E(2,'20:30','Purchase','Purchases till 8:30 PM','Stock',27560,{act:36550,adj:1}),
 E(3,'20:30','Adjustment','Cash adjustment · Extra cash','',9010),
 E(4,'21:46','Sale','Sales till 9:46 PM','Stationery',37500),
 E(5,'21:46','Purchase','Purchases till 9:46 PM','Stock',24360,{act:49750}),
 E(6,'23:47','Sale','Sales till 11:47 PM','Computer Service',4610),
 E(7,'23:47','Purchase','Tea & snacks','Other',10,{act:55280})]});
 let S,rawStorageAtLoad=null,storageLoadError=null,recoveryBackupKey='',recoveryRaw=null;
 try{rawStorageAtLoad=localStorage.getItem(KEY);S=rawStorageAtLoad?JSON.parse(rawStorageAtLoad):seed()}
 catch(e){storageLoadError=e;recoveryRaw=rawStorageAtLoad;S=seed()}
S.names=S.names||{};S.parties=S.parties||{};
if(!Array.isArray(S.walletDates))S.walletDates=[];
if(!Array.isArray(S.counts))S.counts=[];
const ENC=(window.NCS_CONFIG||{}).enc;
if(!S.sync&&window.NCS_CONFIG&&/^https:\/\//.test(NCS_CONFIG.url||'')&&NCS_CONFIG.key)S.sync={url:NCS_CONFIG.url,key:NCS_CONFIG.key};
const LH=new Map(),sig=x=>JSON.stringify(x,(k,v)=>k==='u'?undefined:v),COLS=['entries','products','bills','moves','cust','ltx','atts'];
function ensureCols(){COLS.forEach(c=>{S[c]=S[c]||[]});S.days=S.days||{};S.log=S.log||[]}
function primeLH(){LH.clear();COLS.forEach(c=>S[c].forEach(x=>LH.set(c+x.id,sig(x))));if(S.users)LH.set('users',sig(S.users))}
function stampChanged(){
  const now = (window.NcsSync && typeof window.NcsSync.nextU === 'function') ? window.NcsSync.nextU() : Math.max(Date.now(), (S._lastU||0)+1);
  if (S._lastU === undefined || S._lastU < now) S._lastU = now;
  COLS.forEach(c=>S[c].forEach(x=>{
    const k=c+x.id,j=sig(x);
    if(LH.get(k)!==j){
      x.u=now;
      LH.set(k,j);
    }
  }));
  if(S.users){
    const j=sig(S.users);
    if(LH.get('users')!==j){
      S.users.u=now;
      LH.set('users',j);
    }
  }
}
ensureCols();primeLH();

const NcsDB = (function() {
  const DB_NAME = 'ncs_idb_v1';
  const STORE_NAME = 'state';
  let dbPromise = null;

  function isSupported() {
    try {
      return typeof window !== 'undefined' && !!window.indexedDB;
    } catch (e) {
      return false;
    }
  }

  function getDB() {
    if (!isSupported()) return Promise.resolve(null);
    if (!dbPromise) {
      dbPromise = new Promise(function(resolve) {
        try {
          const req = window.indexedDB.open(DB_NAME, 1);
          req.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };
          req.onsuccess = function(e) { resolve(e.target.result); };
          req.onerror = function() { resolve(null); };
        } catch (err) {
          resolve(null);
        }
      });
    }
    return dbPromise;
  }

  return {
    isSupported: isSupported,
    get: function(key) {
      return getDB().then(function(db) {
        if (!db) return null;
        return new Promise(function(resolve) {
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = function() { resolve(req.result || null); };
            req.onerror = function() { resolve(null); };
          } catch (e) {
            resolve(null);
          }
        });
      });
    },
    set: function(key, val) {
      return getDB().then(function(db) {
        if (!db) return false;
        return new Promise(function(resolve) {
          try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(val, key);
            req.onsuccess = function() { resolve(true); };
            req.onerror = function() { resolve(false); };
          } catch (e) {
            resolve(false);
          }
        });
      });
    }
  };
})();

// Background check to synchronize from IndexedDB if it has a newer revision
if (typeof window !== 'undefined' && NcsDB.isSupported()) {
  NcsDB.get(KEY).then(function(idbState) {
    if (idbState && idbState.rev && (!S || !S.rev || idbState.rev > S.rev)) {
      console.log('IndexedDB has newer state (rev ' + idbState.rev + ' > ' + (S ? S.rev : 0) + '), updating active state...');
      S = idbState;
      window.S = S;
      ensureCols();
      primeLH();
      if (typeof redrawActiveView === 'function') redrawActiveView();
    } else if (S) {
      NcsDB.set(KEY, S);
    }
  }).catch(function(err) {
    console.warn('IndexedDB initial sync warning:', err);
  });
}

function storageNotice(message){
  let box=document.getElementById('ncsStorageNotice');
  if(!message){if(box)box.style.display='none';return}
  if(!box){
    box=document.createElement('div');
    box.id='ncsStorageNotice';
    box.setAttribute('role','alert');
    box.style.cssText='position:fixed;left:12px;right:12px;bottom:86px;z-index:1000;padding:12px 14px;border:1px solid var(--warn);border-radius:12px;background:var(--card);color:var(--ink);box-shadow:0 6px 24px rgba(0,0,0,.22);display:none;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap';
    const text=document.createElement('span');text.dataset.storageMessage='1';
    const button=document.createElement('button');button.type='button';button.className='ghost';button.setAttribute('aria-label','Dismiss');button.textContent='Dismiss';
    button.onclick=function(){box.style.display='none';window._storageWarnDismissed=true};
    box.append(text,button);document.body.appendChild(box);
  }
  box.querySelector('[data-storage-message]').textContent=message;
  box.style.display='flex';
}

const persist=()=>{
  try{
    if(storageLoadError){
      if(rawStorageAtLoad===null)throw new Error('Could not preserve the unreadable saved data');
      recoveryBackupKey=KEY+'_recovery_'+Date.now();
      localStorage.setItem(recoveryBackupKey,rawStorageAtLoad);
      recoveryRaw=rawStorageAtLoad;
      storageLoadError=null;
    }
    const sStr=JSON.stringify(S);
    if(sStr.length>4000000&&!window._storageWarnDismissed){
      storageNotice(lb('Storage advisory: Data size is high ('+Math.round(sStr.length/1024)+' KB). Saved securely in browser IndexedDB. Consider exporting a backup JSON soon.','স্টোরেজ নোটিশ: ডেটার আকার ('+Math.round(sStr.length/1024)+' KB)। ব্রাউজারের IndexedDB ডেটাবেসে নিরাপদে জমা হচ্ছে।'));
    }
    let lsOk=true;
    try {
      localStorage.setItem(KEY,sStr);
    } catch(lsErr) {
      lsOk=false;
      console.warn('localStorage.setItem quota reached, persisting to IndexedDB...', lsErr);
    }
    if (NcsDB.isSupported()) {
      NcsDB.set(KEY, S);
    }
    return lsOk || NcsDB.isSupported();
  }catch(e){
    console.error('Local save failed',e);
    if (NcsDB.isSupported()) {
      NcsDB.set(KEY, S);
      return true;
    }
    storageNotice('Could not save to this device. Free browser storage and try again.');
    return false;
  }
};
 
const save=()=>{
    S.rev=(S.rev||0)+1;
    try{ledReconcile()}catch(e){console.error('Ledger link failed',e)}
    stampChanged();
    const ok=persist();
    if(ok)schedule();
    return ok;
};

const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
let cur=iso(new Date()),editing=null;
const n=v=>Number(v).toLocaleString('en-US'),tk=v=>'৳'+n(v);
const money=v=>v?n(v):'–',dif=v=>v===0?'0':(v>0?'+':'−')+n(Math.abs(v)),dc=v=>v>0?'pos':v<0?'neg':'zero';
const t12=t=>{const h=+t.slice(0,2);return ((h+11)%12+1)+':'+t.slice(3,5)+' '+(h<12?'AM':'PM')};
const r2=x=>Math.round((+x||0)*100)/100;
const label=d=>{const x=new Date(d+'T00:00:00');return x.getDate()+'.'+String(x.getMonth()+1).padStart(2,'0')+'.'+x.getFullYear()+' – '+x.toLocaleDateString(S.lang==='bn'?'bn-BD':'en-US',{weekday:'long'})};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const csvCell=s=>{const v=String(s??''),safe=/^[\s\u0000-\u001f]*[=+\-@]/.test(v)?"'"+v:v;return'"'+safe.replace(/"/g,'""')+'"'}
const sorted=()=>[...S.entries].filter(e=>!e.removed).sort((a,b)=>{const x=a.d+a.t,y=b.d+b.t;return x<y?-1:x>y?1:a.id-b.id});
const cash=e=>(e.void||e.removed)?0:e.type==='Sale'?(e.pay==='Cash'?e.amt:0):e.type==='Purchase'?(e.pay==='Cash'?-e.amt:0):e.type==='Ledger'?(e.w?0:(e.ld==='in'?e.amt:-e.amt)):e.type==='Deposit'?e.amt:e.type==='Withdrawal'?-e.amt:e.amt;


async function encryptBackup(dataStr, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(dataStr));
  return {
    app: 'NCS Daily Accounts',
    encrypted: true,
    alg: 'AES-GCM-256',
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

async function decryptBackup(encObj, password) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(encObj.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(encObj.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const data = new Uint8Array(encObj.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
