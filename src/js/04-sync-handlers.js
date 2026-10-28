/* ---------- merge ---------- */
function mergeById(L,R){const m=new Map();(R||[]).forEach(x=>m.set(x.id,x));(L||[]).forEach(x=>{const o=m.get(x.id);if(!o||(x.u||0)>(o.u||0))m.set(x.id,x)});return[...m.values()]}
function mergeState(R){
  const re=R.epoch||0,le=S.epoch||0;S.pending=S.pending||[];
  if(re>le){[...COLS,'days','names','parties','log','walletDates','counts'].forEach(k=>{if(R[k]!==undefined)S[k]=R[k]});S.epoch=re;S.drawerBase=R.drawerBase||null;if(R.start!==undefined)S.start=R.start}
  else if(re===le){
    COLS.forEach(k=>{S[k]=mergeById(S[k],R[k])});
    const d={...(R.days||{})};Object.keys(S.days||{}).forEach(k=>{const a=S.days[k],b=d[k]||{},o={prep:a.prep||b.prep||null,chk:a.chk||b.chk||null};const cl=a.closed||b.closed;if(cl)o.closed=cl;d[k]=o});S.days=d;
    ['names','parties'].forEach(k=>{const o={...(R[k]||{})};Object.keys(S[k]||{}).forEach(t=>{o[t]={...(o[t]||{}),...S[k][t]}});S[k]=o});
    if(R.drawerBase&&(!S.drawerBase||R.drawerBase.ts>S.drawerBase.ts))S.drawerBase=R.drawerBase;
    if(Array.isArray(R.walletDates)){var wm={};(S.walletDates||[]).forEach(function(x){wm[x.d]=x});R.walletDates.forEach(function(x){wm[x.d]=x});S.walletDates=Object.keys(wm).sort().map(function(k){return wm[k]})}
    if(Array.isArray(R.counts)){var cm=new Map();(S.counts||[]).concat(R.counts||[]).forEach(function(x){cm.set(x.id,x)});S.counts=[...cm.values()].sort(function(a,b){return (b.at||b.id)-(a.at||a.id)});S.counts=S.counts.slice(0,500);}
  }
  const lm=new Map();(S.log||[]).concat(R.log||[]).forEach(l=>lm.set(l.i,l));S.log=[...lm.values()].sort((a,b)=>b.i-a.i).slice(0,500);
  if(R.users&&(!S.users||(R.users.u||0)>(S.users.u||0)))S.users=R.users;
  if(!S.start)S.start=R.start||0;
  if(R.wallets&&(R.wallets.u||0)>((S.wallets&&S.wallets.u)||0))S.wallets=R.wallets;
    /* Merge wManual: propagate remote manual balances */
    if(R.wManual&&typeof R.wManual==='object'){S.wManual=S.wManual||{};Object.keys(R.wManual).forEach(function(k){if(R.wManual[k]!=null)S.wManual[k]=R.wManual[k]})}
  S.rebootN=Math.max(S.rebootN||0,R.rebootN||0);S.rebootAt=Math.max(S.rebootAt||0,R.rebootAt||0);
  if(R.catImported)S.catImported=1;var pm=new Map();(S.pending||[]).concat(R.pending||[]).forEach(function(x){pm.set(x.id,x)});S.pending=[...pm.values()];var hm=new Map();(S.history||[]).concat(R.history||[]).forEach(function(x){hm.set(x.id,x)});S.history=[...hm.values()];
}
function checkMergedMismatches(){S.pending=S.pending||[];var seen={};S.pending.forEach(function(x){if(x.type==='sync-mismatch'&&x.state==='pending')seen[x.reason]=1});var add=function(reason,details){if(seen[reason])return;S.pending.unshift({id:uid(),type:'sync-mismatch',state:'pending',at:Date.now(),reason:reason,details:details})};S.entries.forEach(function(e){if(e.type==='Sale'&&e.pay==='Due'&&e.cu&&!S.ltx.some(function(t){return t.src===e.id&&!t.void===!e.void}))add('Due sale/customer ledger mismatch',{entry:e.id,customer:e.cu})});S.ltx.forEach(function(t){if(t.lnk&&(t.le||0)===(S.epoch||0)&&!t.src&&!S.entries.some(function(e){return e.lk===t.id&&!e.void===!t.void}))add('Linked ledger/cash mismatch',{ledger:t.id,customer:t.c})});var w=checkWalletLimit();if(!w.ok)add('Wallet balance would be negative',{wallet:w.wallet,balance:w.bal})}
function mergeRemoteFrom(r){if(!r||!r.ok||!r.state)return false;try{mergeState(JSON.parse(r.state));checkMergedMismatches();ensureCols();S.synced=r.rev;S.rev=r.rev+1;primeLH();persist();if(U){render();try{homeUI()}catch(e){}POS.refresh();if(CUR==='led')ledUI()}return true}catch(e){return false}}
const mergeRemote=async()=>{try{return mergeRemoteFrom(await getRemote())}catch(e){return false}};
async function importCatalog(){if(S.catImported||S.products.length||!SY())return;
  try{const r=await(await fetch(S.sync.url+(S.sync.url.includes('?')?'&':'?')+'action=catalog&key='+encodeURIComponent(S.sync.key))).json();
    if(r.ok&&r.items&&r.items.length){r.items.filter(p=>!p.del).forEach(p=>S.products.push({id:p.id,name:p.name,barcode:p.barcode||'',buy:0,price:+p.price||0,img:''}));S.catImported=1;save();if(U)POS.refresh()}
    else{S.catImported=1;persist()}}catch(e){}}

