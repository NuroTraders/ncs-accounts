function renderAccPresets(){
  const el=$('accPresets');
  if(!el)return;
  const list=getPresets();
  el.innerHTML=list.map(p=>`<button type="button" class="svc-chip" data-acc-preset="${p.id}"><span>${p.icon||'⚡'}</span> <b>${S.lang==='bn'?(p.bn||p.name):p.name}</b> <small>${tk(p.price)}</small></button>`).join('');
}
function render(){try{renderWalletCards()}catch(e){}try{applyCardSettings()}catch(e){}try{renderAccPresets()}catch(e){}
  if(cur>todayIso())cur=todayIso();
  if(cur<NCS_MIN_DATE)cur=NCS_MIN_DATE;
  $('title').innerHTML=label(cur);
  var pEl=$('pick');if(pEl){pEl.value=cur;pEl.min=NCS_MIN_DATE;pEl.max=todayIso();}
  var pdBtn=$('pd'),ndBtn=$('nd');
  if(pdBtn){var atMin=cur<=NCS_MIN_DATE;pdBtn.disabled=atMin;pdBtn.style.opacity=atMin?'0.35':'';pdBtn.style.pointerEvents=atMin?'none':'';}
  if(ndBtn){var atMax=cur>=todayIso();ndBtn.disabled=atMax;ndBtn.style.opacity=atMax?'0.35':'';ndBtn.style.pointerEvents=atMax?'none':'';}
  const m=calc(),all=sorted(),day=all.filter(e=>e.d===cur),act=day.filter(e=>!e.void),f=flt(),tv0=f?all.filter(e=>match(e,f)):day,tv=tv0.filter(e=>!e.void),vd=lEd()?tv0.filter(e=>e.void):[];
  if(ACC_D!==cur+'|'+(f?JSON.stringify(f):'')){ACC_D=cur+'|'+(f?JSON.stringify(f):'');ACC_N=150}
  const sum=(ty)=>act.filter(e=>e.type===ty&&!isWalletTransfer(e)),tot=a=>a.reduce((s,e)=>s+e.amt,0);
  const split=a=>{const c=tot(a.filter(e=>e.pay==='Cash')),g=tot(a.filter(e=>e.pay==='Mobile Banking'||e.pay==='Bank')),u=tot(a.filter(e=>e.pay==='Due'));return `Cash ${n(c)} · Digital ${n(g)} · Due ${n(u)}`};
  const sl=sum('Sale'),pu=sum('Purchase');
  const pend=act.reduce((s,e)=>s+(m[e.id].df!=null&&!e.adj?m[e.id].df:0),0);
  let open=+S.start||0;all.forEach(e=>{if(!e.void&&e.d<cur)open+=cash(e)});
  const close=act.length?m[act[act.length-1].id].bal:open,adjT=act.filter(e=>e.type==='Adjustment').reduce((s,e)=>s+e.amt,0);
  $('stats').innerHTML=`<div class="stat"><small>Total Sell</small><b>${tk(tot(sl))}</b><i>${split(sl)}</i></div><div class="stat"><small>Total Buy</small><b>${tk(tot(pu))}</b><i>${split(pu)}</i></div><div class="stat"><small>Difference (pending)</small><b class="${dc(pend)}">${dif(pend)}</b><i>Counted vs account</i></div><div class="stat main"><small>Cash Balance</small><b>${tk(close)}</b><i>Account balance now</i></div>`;
  $('cashp').innerHTML=`<div><small>Opening Cash</small><b>${tk(open)}</b></div><span class="ar">→</span><div><small>Closing Cash</small><b>${tk(close)}</b></div><div class="sp"><small>Adjustments today</small><b class="${dc(adjT)}">${dif(adjT)}</b></div>${(isA()||role()==='accountant')?'<div style="width:100%;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="ghost" data-cadj="1">'+lb('Count and adjust cash','নগদ গণনা ও সমন্বয়')+'</button><button type="button" class="ghost" data-chist="1">'+lb('Cash count history','নগদ গণনার ইতিহাস')+'</button><button type="button" class="ghost" data-discq="1">High-discount reviews ('+S.bills.filter(function(b){return b.discountReview&&b.discountReview.state==='pending'&&!b.removed}).length+')</button></div>':''}`;
  avBar(vd);
  if(AV&&lEd())$('tbl').innerHTML=avTable(vd,f);
  else if(!tv.length)$('tbl').innerHTML='<div class="empty">No entries for this date</div>';
  else $('tbl').innerHTML='<table><thead><tr><th>Sl</th><th>Time</th><th>Description</th><th>Sell</th><th>Buy</th><th>Previous Cash</th><th>Cash Balance</th><th>Actual Cash</th><th>Difference</th><th></th></tr></thead><tbody>'+tv.slice(0,ACC_N).map((e,i)=>{
    const r=m[e.id],v=e.void,inn=e.type==='Sale'||e.type==='Deposit'||(e.type==='Adjustment'&&e.amt>0)||(e.type==='Ledger'&&e.ld==='in'),amt=Math.abs(e.amt),wo=e.type==='Ledger'&&!!e.w;
    const isCol=!v&&isWalletCollision(e.id);
    const colBadge=isCol?`<span class="b v" style="background:var(--neg);color:#fff" title="${lb('Wallet deficit after adjustment under review','ওয়ালেট ঘাটতি: রিভিউ প্রয়োজন')}">${lb('Deficit Review','ঘাটতি রিভিউ')}</span>`:'';
    const badge=(e.type!=='Sale'&&e.type!=='Purchase'?`<span class="b o">${e.type==='Adjustment'?'Adjustment':e.type==='Deposit'?'Deposit':e.type==='Ledger'?'Ledger':'Withdrawal'}</span>`:'')+(e.pay!=='Cash'&&(e.type==='Sale'||e.type==='Purchase')?`<span class="b">${e.pay}</span>`:'')+(v?'<span class="b v">Void</span>':'')+(!v&&likelyDupEntry(e)?'<span class="b ctag">Possible duplicate</span>':'')+(!v&&lEd()&&entChk(e)?'<span class="b ctag">Check</span>':'')+colBadge;
    const sub=v?`Reason: ${esc(e.vr)}`:(f?sd(e.d)+' · ':'')+esc(e.cat)+(e.party?' · '+esc(e.party)+(e.phone?' ('+esc(e.phone)+')':''):'')+(wo?' · '+esc(wN(e.w))+' '+(inn?'+':'−')+n(amt):'')+(e.by?' · '+esc(e.by):'');
    const dfc=!v&&r.df!=null?`<span class="${dc(r.df)}">${dif(r.df)}</span>${e.adj?' <span class="b">Adjusted</span>':''}`:'–';
    const isDS=e.type==='Sale'&&e.pay==='Due'&&!e.cu,dupAct=(!v&&isA()&&likelyDupEntry(e)?'<button class="lnk" data-a="dd" data-i="'+e.id+'">Dismiss duplicate</button>':''),ck0=(!v&&isA()&&entChk(e))?(isDS?`<button class="lnk" data-a="lc" data-i="${e.id}">Link customer</button>`:'')+`<button class="lnk" data-a="ok" data-i="${e.id}">Accept</button>`:'',acts=dupAct+ck0+((v||f||!isA()||closed()||e.lk)?'':`<button class="lnk" data-a="e" data-i="${e.id}">Edit</button><button class="lnk" data-a="v" data-i="${e.id}">Void</button>`+(r.df&&!e.adj?`<button class="lnk adj" data-a="a" data-i="${e.id}">Adjust</button>`:''));
    return `<tr class="${v?'void':''}"><td>${i+1}</td><td>${t12(e.t)}</td><td class="d">${badge}${esc(e.desc)}<small>${sub}</small></td><td>${inn&&!wo?money(amt):'–'}</td><td>${!inn&&!wo?money(amt):'–'}</td><td>${v||!r.p?'–':n(r.p)}</td><td class="cb">${v?'–':n(r.bal)}</td><td>${!v&&e.act!=null?n(e.act):'–'}</td><td>${dfc}</td><td>${acts}${attBtn('e'+e.id)}</td></tr>`}).join('')+'</tbody></table>'+(tv.length>ACC_N?'<div class="pgmore" data-amore="1" role="button" tabindex="0">'+lb('Show more','আরও দেখুন')+' ('+(tv.length-ACC_N)+')</div>':'');
  preview();dayBar();try{chkBar();if(!$('pcu').hidden)cuOpts()}catch(e){}
}

function cats(){const c=CATS[$('fy').value];$('fc').innerHTML=c?c.map(x=>`<option value="${x}">${x}</option>`).join(''):'<option value="">—</option>';$('fc').disabled=!c;
  const nc=['Sale','Purchase'].includes($('fy').value);$('fp').disabled=!nc;
  var ed0=editing?S.entries.find(function(x){return x.id===editing}):null;
  var keepDue=!!(ed0&&ed0.type==='Purchase'&&ed0.pay==='Due'&&$('fy').value==='Purchase');
  var pays=nc?['Cash','Mobile Banking','Bank']:['Cash'];
  if(nc&&($('fy').value==='Sale'||keepDue))pays.push('Due');
  var old=$('fp').value;
  $('fp').innerHTML=pays.map(function(p){return '<option>'+p+'</option>'}).join('');
  $('fp').value=pays.indexOf(old)>=0?old:(keepDue?'Due':'Cash');
  $('fa').min=$('fy').value==='Adjustment'?'':'0';party()}
function party(){wltForm();const ty=$('fy').value,d=$('fp').value==='Due'&&['Sale','Purchase'].includes(ty),cu=d&&ty==='Sale';$('pcu').hidden=!cu;if(cu)cuOpts();const nw=d&&(!cu||$('fcu').value==='__new');$('ppn').hidden=$('ppt').hidden=!nw;$('fpn').required=nw;$('fpl').textContent=ty==='Purchase'?'Supplier name':'Customer name';const L=ty==='Purchase'?(S.parties.Purchase||{}):{};$('pl').innerHTML=Object.keys(L).map(k=>`<option value="${esc(k)}">`).join('')}
$('fpn').addEventListener('input',()=>{const L=S.parties[$('fy').value]||{},v=$('fpn').value.trim();if(v in L&&!$('fph').value)$('fph').value=L[v]});
function preview(){
  const t=$('ft').value||'00:00',p=prevFor(cur,t),ty=$('fy').value,a=+$('fa').value||0,pay=$('fp').value;
  const eff=cash({type:ty,pay,amt:a}),bal=p+eff;
  let h=`<span>Previous <b>${n(p)}</b></span><span>Cash Balance <b class="${bal<0?'neg':''}">${n(bal)}</b></span>`;
  if(bal<0)h+='<span class="warn">Balance would be negative</span>';
  $('prev').innerHTML=h;
}
function reset(){editing=null;$('form').reset();$('fy').value='Sale';cats();const x=new Date();$('ft').value=String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0');$('go').textContent='Add entry';$('cancel').style.display='none';$('sg').hidden=true}

$('form').addEventListener('submit',ev=>{ev.preventDefault();
  if(cur>todayIso()){Sound.buzz();ltoast(lb('Cannot add entry to a future date','ভবিষ্যতের তারিখে এন্ট্রি দেওয়া যাবে না'));return}
  if(cur<NCS_MIN_DATE){Sound.buzz();ltoast(lb('Cannot add entry before November 2020','নভেম্বর ২০২০ এর পূর্বে এন্ট্রি দেওয়া যাবে না'));return}
  const o={d:cur,t:$('ft').value,type:$('fy').value,desc:$('fd').value.trim(),cat:$('fc').value,pay:$('fp').value,amt:+$('fa').value,act:editing?(S.entries.find(x=>x.id===editing)||{}).act||null:null,party:$('fpn').value.trim(),phone:$('fph').value.trim()};
  if(!o.t||!o.desc||isNaN(o.amt)){Sound.buzz();return}
  if(WLTC[o.type]&&WLTC[o.type][o.cat]){o.pay='Cash';o.w=''}else o.w=(o.type==='Sale'&&o.pay==='Mobile Banking')?$('fw').value:'';
  {const wf=wltEff(o),old=editing?S.entries.find(x=>x.id===editing):null,wo=old?wltEff(old):null,only=[wf&&wf.w,wo&&wo.w].filter(Boolean);
   if(only.length){const wc=checkWalletLimit(Object.assign({id:editing||Date.now()},o),editing,only);if(!wc.ok){Sound.buzz();ltoast(lb('Not saved: ','সংরক্ষণ হয়নি: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হয়ে যাবে।'));return}}}
  if(closed()||!isA())return;o.cu='';if(o.pay==='Due'&&o.type==='Sale'&&dueCust(o,editing)===false){Sound.buzz();return}
  if(o.pay==='Due'&&['Sale','Purchase'].includes(o.type)){(S.parties[o.type]=S.parties[o.type]||{})[o.party]=o.phone}else{o.party='';o.phone=''}
  if(closed()||!isA())return;snap();remember(o,!editing);if(editing){const e=S.entries.find(e=>e.id===editing);lg('Edit entry',`${e.type} ${e.amt} "${e.desc}" → ${o.type} ${o.amt} "${o.desc}"`);Object.assign(e,o)}else{o.by=U.name;S.entries.push({id:Date.now(),...o});lg('Add entry',`${o.type} ${o.amt} "${o.desc}"`)}
  if(save()){Sound.chaChing();saveCheck()}reset();render();$('fd').focus()});
['ft','fy','fp','fa'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='fy'){cats();$('sg').hidden=true}if(id==='fp')party();preview()}));
$('cancel').onclick=()=>{reset();render()};

function remember(o,inc){if(o.type==='Adjustment')return;const L=S.names[o.type]=S.names[o.type]||{};
  const k=Object.keys(L).find(x=>x.toLowerCase()===o.desc.toLowerCase())||o.desc;const r=L[k]=L[k]||{n:0};if(inc||!r.n)r.n++;r.cat=o.cat}
let sgl=[],sgi=-1;
function sug(){const q=$('fd').value.trim().toLowerCase(),L=S.names[$('fy').value]||{};
  sgl=Object.keys(L).filter(k=>k.toLowerCase().includes(q)).sort((a,b)=>(a.toLowerCase().startsWith(q)?0:1)-(b.toLowerCase().startsWith(q)?0:1)||L[b].n-L[a].n).slice(0,6);
  if(!q||!sgl.length||(sgl.length===1&&sgl[0].toLowerCase()===q)){$('sg').hidden=true;return}
  sgi=-1;$('sg').innerHTML=sgl.map((k,i)=>`<div class="si" data-i="${i}"><span>${esc(k)}</span><span><small>${esc(L[k].cat||'')}</small><button type="button" class="x" data-x="${i}" aria-label="Forget">×</button></span></div>`).join('');$('sg').hidden=false}
function pickName(i){const k=sgl[i],r=(S.names[$('fy').value]||{})[k];$('fd').value=k;
  if(r&&r.cat&&[...$('fc').options].some(o=>o.value===r.cat))$('fc').value=r.cat;$('sg').hidden=true;$('fa').focus();preview()}
$('fd').addEventListener('input',sug);
$('fd').addEventListener('keydown',ev=>{if($('sg').hidden)return;const k=ev.key,items=$('sg').children;
  if(k==='ArrowDown'||k==='ArrowUp'){ev.preventDefault();sgi=(sgi+(k==='ArrowDown'?1:-1)+items.length)%items.length;[...items].forEach((x,i)=>x.classList.toggle('on',i===sgi))}
  else if(k==='Enter'&&sgi>=0){ev.preventDefault();pickName(sgi)}else if(k==='Escape')$('sg').hidden=true});
$('sg').addEventListener('mousedown',ev=>ev.preventDefault());
$('sg').addEventListener('click',ev=>{const x=ev.target.closest('.x'),it=ev.target.closest('.si');if(x){const k=sgl[+x.dataset.x];delete S.names[$('fy').value][k];save();sug()}else if(it)pickName(+it.dataset.i)});
$('fd').addEventListener('blur',()=>setTimeout(()=>$('sg').hidden=true,120));
if($('accPresets')){$('accPresets').addEventListener('click',e=>{const b=e.target.closest('[data-acc-preset]');if(!b)return;const p=getPresets().find(x=>x.id===b.dataset.accPreset);if(p){$('fy').value='Sale';cats();const title=S.lang==='bn'?(p.bn||p.name):p.name;$('fd').value=title;if(p.cat&&Array.from($('fc').options).some(o=>o.value===p.cat))$('fc').value=p.cat;$('fp').value='Cash';$('fa').value=p.price;preview();$('fa').focus();$('fa').select();toast((S.lang==='bn'?'নির্বাচিত: ':'Selected ')+title);try{Sound.tick()}catch(x){}}});}
function ask(title,body,onOk,okText,wide){try{Sound.tick()}catch(e){}$('ov').firstElementChild.classList.toggle('w',!!wide);$('ok').style.display='';$('ob').onclick=null;$('ob').oninput=null;$('ob').onchange=null;$('ot').textContent=title;$('ob').innerHTML=body;$('ok').textContent=okText||'Confirm';$('ov').hidden=false;
  $('ok').onclick=async()=>{if(await onOk()!==false)$('ov').hidden=true};const f=$('ob').querySelector('input,select');if(f)f.focus()}
$('oc').onclick=()=>$('ov').hidden=true;
$('tbl').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const e=S.entries.find(x=>x.id==b.dataset.i);
  if(b.dataset.a==='dd'){e.dupDismissed=1;lg('Dismiss duplicate warning',e.desc||e.id);save();render()}
  if(b.dataset.a==='e'){editing=e.id;$('ft').value=e.t;$('fy').value=e.type;cats();$('fd').value=e.desc;$('fc').value=e.cat;$('fp').value=e.pay;$('fa').value=e.amt;party();if(e.w)$('fw').value=e.w;editCu(e);$('fpn').value=e.party||'';$('fph').value=e.phone||'';$('go').textContent='Save changes';$('cancel').style.display='';preview();$('form').scrollIntoView({behavior:document.documentElement.dataset.rm?'auto':'smooth',block:'center'})}
  if(b.dataset.a==='v')ask('Void entry',`<div class="f"><label>Reason (required)</label><input id="vr" maxlength="100"></div>`,()=>{const r=$('vr').value.trim();if(!r)return false;if(wltVoidBlocked(e))return false;snap();e.void=1;e.vr=r;e.vb=U.name;lg('Void entry',`${e.type} ${e.amt} "${e.desc}" — ${r}`);save();render()},'Void');
  if(b.dataset.a==='a'){const df=calc()[e.id].df;ask('Adjust cash',`<div class="f"><label>Account will change by <b>${dif(df)}</b> to match counted cash</label><select id="ar"><option>${df>0?'Extra cash':'Cash short'}</option><option>Other</option></select></div>`,()=>{snap();S.entries.push({id:Date.now(),d:e.d,t:e.t,type:'Adjustment',desc:'Cash adjustment · '+$('ar').value,cat:'',pay:'Cash',amt:df});e.adj=1;lg('Cash adjust',`${dif(df)} on "${e.desc}"`);save();render()},'Adjust')}});

$('pick').onchange=e=>{
  if(e.target.value){
    var v=e.target.value;
    if(v>todayIso()){
      ltoast(lb('Future dates are not allowed','ভবিষ্যতের তারিখ নির্বাচন করা যাবে না'));
      cur=todayIso();
    }else if(v<NCS_MIN_DATE){
      ltoast(lb('Date cannot be before November 2020','নভেম্বর ২০২০ এর আগের তারিখ গ্রহণযোগ্য নয়'));
      cur=NCS_MIN_DATE;
    }else{
      cur=v;
    }
    reset();render();
  }
};
 const shift=k=>{
   if(k>0&&cur>=todayIso()){ltoast(lb('Cannot advance to future date','ভবিষ্যতের তারিখে যাওয়া যাবে না'));return}
   if(k<0&&cur<=NCS_MIN_DATE){ltoast(lb('Cannot go before November 2020','নভেম্বর ২০২০ এর পূর্বে যাওয়া যাবে না'));return}
   const x=new Date(cur+'T00:00:00');x.setDate(x.getDate()+k);
   const tg=iso(x);
   if(tg>todayIso())cur=todayIso();
   else if(tg<NCS_MIN_DATE)cur=NCS_MIN_DATE;
   else cur=tg;
   reset();render();
 };
$('pd').onclick=()=>shift(-1);$('nd').onclick=()=>shift(1);$('today').onclick=()=>{cur=todayIso();reset();render()};

function applyTheme(){
  var m=S.theme||'auto';
  if(m!=='auto'&&m!=='light'&&m!=='dark')m='auto';
  S.theme=m;
  if(m==='light'||m==='dark')document.documentElement.dataset.theme=m;
  else delete document.documentElement.dataset.theme;
  var btn=$('themeBtn');
  if(btn){
    btn.dataset.mode=m;
    var tLab=m==='auto'?lb('Auto (system)','অটো (সিস্টেম)'):m==='light'?lb('Light','লাইট'):lb('Dark','ডার্ক');
    btn.setAttribute('aria-label',lb('Theme: ','থিম: ')+tLab);
    btn.title=lb('Theme: ','থিম: ')+tLab;
  }
}
$('themeBtn').onclick=function(){
  var cur=S.theme||'auto';
  var next=cur==='auto'?'light':cur==='light'?'dark':'auto';
  S.theme=next;
  save();
  applyTheme();
};
 $('set').onclick=()=>ask('Settings',`<div class="f"><label>Starting cash</label><input id="s1" type="number" min="0" step="any" value="${S.start||0}"></div><div class="f"><label class="tg" style="justify-content:space-between"><span>Sound effects <small class="mut">(tick, cha-ching, buzz, chime)</small></span><input type="checkbox" id="snd" ${S.sound?'checked':''}></label><button type="button" class="ghost" id="sndTest" style="margin-top:6px;height:32px;font-size:13px">▶ Test sound</button></div><div class="f"><label>Reason for changing opening cash (required when changed)</label><input id="s1r" maxlength="160"></div><div class="f"><label>Google Sheet sync URL</label><input id="s4" value="${esc(S.sync?S.sync.url:'')}"></div><div class="f"><label>Sync key</label><input id="s5" type="password" value="${esc(S.sync?S.sync.key:'')}"></div><button type="button" class="ghost" id="setpin">Change admin PIN</button> <button type="button" class="ghost" id="ssu">Secure sync setup</button> <button type="button" class="ghost" id="sfr" style="color:var(--neg)">Start fresh (carry forward balances)</button> <button type="button" class="ghost" id="backupJson">Download data backup</button> <button type="button" class="ghost" id="restoreJson">Restore from backup</button><p class="mut" style="font-size:12.5px;margin:8px 0 0">${lb('Backups are files you download; the app does not back up by itself. Data lives in this browser, and in the Google Sheet only if sync is on. Keep a recent download off this device (for example in Drive).','ব্যাকআপ হলো ডাউনলোড করা ফাইল; অ্যাপ নিজে ব্যাকআপ নেয় না। তথ্য এই ব্রাউজারে থাকে, আর সিঙ্ক চালু থাকলে গুগল শিটে। সাম্প্রতিক একটি ডাউনলোড এই ডিভাইসের বাইরে রাখুন (যেমন ড্রাইভে)।')} ${S.lastBackup?lb('Last download from this device: ','এই ডিভাইস থেকে শেষ ডাউনলোড: ')+sd(iso(new Date(S.lastBackup))):lb('No backup downloaded from this device yet.','এই ডিভাইস থেকে এখনো ব্যাকআপ ডাউনলোড হয়নি।')}</p>`,()=>{const before={start:S.start,sync:S.sync,sound:S.sound},raw=$('s1').value.trim(),start=raw===''?NaN:Number(raw),old=+S.start||0,reason=$('s1r').value.trim();if(!Number.isFinite(start)||start<0)return false;if(start!==old){if(!reason){$('s1r').style.borderColor='var(--neg)';return false}lg('Opening cash changed',old+' → '+start+' · '+reason);S.start=start}S.sync=$('s4').value.trim()&&$('s5').value.trim()?{url:$('s4').value.trim(),key:$('s5').value.trim()}:null;S.sound=!!$('snd').checked;if(!save()){Object.assign(S,before);if(start!==old)S.log.shift();return false}pull();applyTheme();render()},'Save');
 $('ob').addEventListener('click', async e => {
    if (e.target.id === 'backupJson') {
      const backup = { app: 'NCS Daily Accounts', version: APP_VERSION, exportedAt: new Date().toISOString(), state: stateOut() };
      ask(lb('Backup options', 'ব্যাকআপ অপশন'), '<div class="f"><label>' + lb('Backup format', 'ব্যাকআপের ধরন') + '</label><select id="bkFmt"><option value="plain">' + lb('Standard JSON (unencrypted)', 'সাধারণ JSON (লক ছাড়া)') + '</option><option value="enc">' + lb('Password-protected (AES-GCM encrypted)', 'পাসওয়ার্ড দিয়ে সুরক্ষিত (AES এনক্রিপ্টেড)') + '</option></select></div><div class="f" id="bkPassBox" hidden><label>' + lb('Encryption password', 'পাসওয়ার্ড দিন') + '</label><input type="password" id="bkPass" placeholder="4+ characters" autocomplete="new-password"></div>', async () => {
        const fmt = $('bkFmt').value;
        const pass = $('bkPass').value.trim();
        if (fmt === 'enc') {
          if (!pass || pass.length < 4) {
            Sound.buzz();
            alert(lb('Password must be at least 4 characters', 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'));
            return false;
          }
          const encPayload = await encryptBackup(JSON.stringify(backup), pass);
          dlFile('NCS_Backup_Encrypted_' + iso(new Date()) + '.json', JSON.stringify(encPayload, null, 2));
        } else {
          dlFile('NCS_Backup_' + iso(new Date()) + '.json', JSON.stringify(backup, null, 2));
        }
        S.lastBackup = Date.now();
        save();
      }, lb('Download', 'ডাউনলোড'));
      setTimeout(() => {
        const fmtSel = $('bkFmt'), box = $('bkPassBox');
        if (fmtSel && box) fmtSel.onchange = () => { box.hidden = fmtSel.value !== 'enc'; };
      }, 50);
    } else if (e.target.id === 'restoreJson') {
      const fi = document.createElement('input');
      fi.type = 'file';
      fi.accept = '.json';
      fi.onchange = ev => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            let data = JSON.parse(reader.result);
            if (data && data.encrypted && data.alg === 'AES-GCM-256') {
              ask(lb('Encrypted backup', 'এনক্রিপ্টেড ব্যাকআপ'), '<p>' + lb('This backup is password-protected. Enter the password to unlock:', 'এই ব্যাকআপটি পাসওয়ার্ড দিয়ে লক করা। আনলক করতে পাসওয়ার্ড দিন:') + '</p><div class="f"><label>' + lb('Password', 'পাসওয়ার্ড') + '</label><input type="password" id="rstPass" autocomplete="current-password"></div>', async () => {
                const pass = $('rstPass').value;
                try {
                  const decStr = await decryptBackup(data, pass);
                  const decData = JSON.parse(decStr);
                  executeRestore(decData);
                } catch (err) {
                  Sound.buzz();
                  alert(lb('Decryption failed! Incorrect password or corrupted file.', 'আনলক ব্যর্থ হয়েছে! ভুল পাসওয়ার্ড বা ত্রুটিপূর্ণ ফাইল।'));
                }
              }, lb('Unlock & Restore', 'আনলক ও রিস্টোর'));
              return;
            }
            executeRestore(data);
          } catch (err) {
            Sound.buzz();
            alert(lb('Invalid backup file format.', 'অকার্যকর ব্যাকআপ ফাইল।'));
          }
        };
        reader.readAsText(file);
      };
      fi.click();
    }
  });

  function executeRestore(raw) {
    const st = raw.state || raw;
    if (!st || !Array.isArray(st.entries) || !Array.isArray(st.products)) {
      alert(lb('Invalid state: missing required collections.', 'ভুল ফরম্যাট: প্রয়োজনীয় তথ্য নেই।'));
      return;
    }
    ask(lb('Confirm restore', 'রিস্টোর নিশ্চিতকরণ'), '<p><b>' + lb('Warning: Current data will be replaced!', 'সতর্কতা: বর্তমান ডেটা পরিবর্তিত হবে!') + '</b></p><p>' + lb('Found:', 'পাওয়া গেছে:') + ' ' + st.entries.length + ' ' + lb('entries', 'টি এন্ট্রি') + ', ' + st.products.length + ' ' + lb('products', 'টি পণ্য') + ', ' + (st.cust ? st.cust.length : 0) + ' ' + lb('parties', 'টি পক্ষ') + '.</p>', () => {
      snap();
      S = st;
      ensureCols();
      primeLH();
      save();
      lg('Restore JSON backup', 'Entries: ' + st.entries.length);
      alert(lb('Data restored successfully! The page will now reload.', 'ডেটা সফলভাবে রিস্টোর হয়েছে! পেজ রিলোড হচ্ছে।'));
      setTimeout(() => location.reload(), 300);
    }, lb('Proceed & Replace', 'প্রতিস্থাপন করুন'));
  }

$('csv').onclick=async()=>{const m=calc(),q=csvCell;
  const rows=[['Date','Time','Type','Description','Category','Payment','Amount','Previous Cash','Cash Balance','Actual Cash','Difference','Status','Party','Phone'].join(',')];
   sorted().forEach(e=>{const r=m[e.id]||{};rows.push([q(e.d),q(e.t),q(e.type),q(e.desc),q(e.cat),q(e.pay),e.amt,r.p??'',r.bal??'',e.act??'',r.df??'',q(e.void?'Void: '+e.vr:'Active'),q(e.party),q(e.phone)].join(','))});
  await dlFile('NCS_Daily_Accounts.csv',rows.join('\n'))};

S.users=S.users||null;S.days=S.days||{};S.log=S.log||[];
let U=null,it,exp=0;const SESS='ncs_session_v1';
const isA=()=>!!U&&U.role==='admin',closed=()=>!!(S.days[cur]&&S.days[cur].closed);
const stamp=()=>{const x=new Date();return x.getDate()+'.'+String(x.getMonth()+1).padStart(2,'0')+'.'+x.getFullYear()+' '+t12(String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0'))};
function lg(a,d){S.log.unshift({i:Date.now()+Math.random(),ts:stamp(),u:U?U.name:'—',a,d});S.log=S.log.slice(0,500)}
const rnd=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(x=>x.toString(36).padStart(2,'0')).join('');
const uid=()=>Date.now()*1000+(typeof crypto!=='undefined'&&crypto.getRandomValues?(crypto.getRandomValues(new Uint32Array(1))[0]%1000):Math.floor(Math.random()*1000));
const PIN_ITER=210000;
async function H(p,salt,iterations=PIN_ITER){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']),bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations,hash:'SHA-256'},key,256);return[...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function legacyH(p,salt,forceFallback=false){const b=new TextEncoder().encode(salt+':'+p);try{if(forceFallback)throw new Error('legacy fallback');const d=await crypto.subtle.digest('SHA-256',b);return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;b.forEach(c=>h=(h*33^c)>>>0);return'x'+h}}
const mk=async p=>{const s=rnd(16);return{s,h:await H(p,s),alg:'pbkdf2-sha256',i:PIN_ITER}};
const ck=async(o,p)=>o&&o.alg==='pbkdf2-sha256'&&Number.isInteger(o.i)&&o.i>=100000&&o.i<=1000000?o.h===await H(p,o.s,o.i):!!o&&o.alg!=='pbkdf2-sha256'&&o.h===await legacyH(p,o.s,String(o.h).startsWith('x'));

function lockUI(mode,msg){
  const lk=$('lk');lk.hidden=false;
  const F=(id,l,t)=>`<div class="f"><label>${l}</label><input id="${id}" type="${t||'password'}" ${t?'':'inputmode="numeric" '}autocomplete="off"></div>`;
  let h,btn='Unlock',title='Sign in';
  if(mode==='connect'){title='Connect to shop';btn='Connect';h='<p>Enter the shop passphrase to connect this device. You only need to do this once.</p>'+F('pw','Shop passphrase','password')}
  else if(mode==='first'){title='Create admin PIN';btn='Create';h=F('p1','Admin PIN (6+ digits)')+F('p2','Confirm PIN')}
  else if(mode==='recover'){title='Reset admin PIN';btn='Reset';h=F('rc','Recovery code','text')+F('p1','New PIN (6+ digits)')+F('p2','Confirm PIN')}
  else if(mode==='code'){title='Recovery code';btn='Continue';h=`<p>Write this code down. It is the only way to reset the admin PIN.</p><h2 style="letter-spacing:.15em;text-align:center">${msg}</h2>`}
  else h=`<div class="f"><label>User</label><select id="lu"><option value="admin">Admin</option>${S.users.staff.filter(x=>x.on).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>`+F('p1','PIN');
  lk.innerHTML=`<div class="dlg"><div style="text-align:center;margin-bottom:8px"><img class="lg-b" src="logo-full-black.png" style="height:96px" alt=""><img class="lg-w" src="logo-full-white.png" style="height:96px" alt=""></div><h3>${title}</h3>${h}<div id="le" class="neg"></div><div class="oa">${mode==='login'?'<button class="ghost" id="fg">Forgot admin PIN</button>':''}<button class="go" id="lgo">${btn}</button></div></div>`;
  const err=t=>{try{Sound.buzz()}catch(e){}$('le').textContent=t},v=id=>$(id)?$(id).value:'';
  if($('p1'))$('p1').focus();else if($('rc'))$('rc').focus();else if($('pw'))$('pw').focus();
  if($('fg'))$('fg').onclick=()=>lockUI('recover');
  const go=async()=>{
    if(mode==='connect'){try{const c=await decCfg(ENC,v('pw'));S.sync={url:c.url,key:c.key};persist();return start()}catch(e){return err('Wrong passphrase')}}
    if(mode==='code'){startSess();return enter()}
    if(mode==='first'||mode==='recover'){const a=v('p1');if(!/^\d{6,}$/.test(a)||a!==v('p2'))return err('PINs must match and be 6+ digits');
      if(mode==='first'){const oldUsers=S.users,c=rnd(3).toUpperCase();S.users={admin:await mk(a),staff:[],rec:await mk(c)};U={name:'Admin',role:'admin',id:'admin'};lg('Admin created','');if(!save()){S.users=oldUsers;S.log.shift();U=null;return err('Could not save locally.')}return lockUI('code',c)}
      if(!(await ck(S.users.rec,v('rc').trim().toUpperCase())))return err('Wrong recovery code');
      const oldAdmin=S.users.admin,oldRec=S.users.rec;S.users.admin=await mk(a);const c=rnd(3).toUpperCase();S.users.rec=await mk(c);U={name:'Admin',role:'admin',id:'admin'};lg('Admin PIN reset','Recovery code rotated');if(!save()){S.users.admin=oldAdmin;S.users.rec=oldRec;S.log.shift();U=null;return err('Could not save locally.')}return lockUI('code',c)}
    const L=S.lockout||{n:0,until:0};if(Date.now()<L.until)return err('Too many attempts. Try again in a minute.');
    const id=v('lu'),st=S.users.staff.find(x=>x.id==id),o=id==='admin'?S.users.admin:st;
    if(o&&await ck(o,v('p1'))){const migrated=o.alg!=='pbkdf2-sha256';if(migrated)Object.assign(o,await mk(v('p1')));S.lockout={n:0,until:0};U={name:id==='admin'?'Admin':st.name,role:id==='admin'?'admin':(st.role||'cashier'),id};lg('Login',migrated?'Legacy PIN hash upgraded':'');save();startSess();enter()}
    else{L.n++;if(L.n>=5){L.until=Date.now()+60000;L.n=0}S.lockout=L;save();err('Wrong PIN')}
  };
  $('lgo').onclick=go;lk.onkeydown=e=>{if(e.key==='Enter')go()}
}
function enter(){LRN=S.rebootN||0;$('lk').hidden=true;$('lk').innerHTML='';$('set').hidden=$('und').hidden=!isA();$('rpb').hidden=!(isA()||role()==='accountant');if($('stf'))$('stf').hidden=!isA();if($('logb'))$('logb').hidden=!(isA()||role()==='accountant');$('who').textContent=isA()?'Admin':U.name+' · '+role();reset();render();bump();pull();buildTabs();updateSndBtn()}
function lock(){try{localStorage.removeItem(SESS)}catch(e){}U=null;$('tabs').hidden=true;$('ov').hidden=true;if(S.users)lockUI('login')}
const bump=()=>{};setInterval(()=>{if(U&&Date.now()>exp)lock()},60000);
['click','keydown','touchstart'].forEach(e=>document.addEventListener(e,bump));
$('lockb').onclick=lock;

function dayBar(){$('und').disabled=!UN||closed();const d=S.days[cur]||{},c=!!d.closed;
  $('daybar').innerHTML=`<label class="tg"><input type="checkbox" id="tp" ${d.prep?'checked':''} ${c||!isA()?'disabled':''}>Prepared${d.prep?' · '+esc(d.prep.by):''}</label><label class="tg"><input type="checkbox" id="tc" ${d.chk?'checked':''} ${c||!isA()?'disabled':''}>Checked${d.chk?' · '+esc(d.chk.by):''}</label><span class="sp"><span class="b${c?' v':''}">${c?'Closed':'Open'}</span>${isA()?(c?'<button class="ghost" id="reo">Reopen</button>':'<button class="ghost" id="cls">Close Day</button>'):''}</span>`;
  $('fsec').hidden=c||!isA();$('cn').hidden=!c;
  $('pf').innerHTML=`<div>Prepared by: ${d.prep?'☑ '+esc(d.prep.by)+' ('+d.prep.ts+')':'☐ ____________'}</div><div>Checked by: ${d.chk?'☑ '+esc(d.chk.by)+' ('+d.chk.ts+')':'☐ ____________'}</div>`}
$('daybar').addEventListener('change',e=>{const D=S.days[cur]=S.days[cur]||{},k=e.target.id==='tp'?'prep':'chk';D[k]=e.target.checked?{by:U.name,ts:stamp()}:null;lg((e.target.checked?'Ticked ':'Unticked ')+(k==='prep'?'Prepared':'Checked'),label(cur));save();dayBar()});
$('daybar').addEventListener('click',e=>{const b=e.target.id;
  if(b==='cls'){if(!(S.days[cur]&&S.days[cur].prep))return ask('Close Day','<p>Tick "Prepared" before closing the day.</p>',()=>{},'OK');
    ask('Close Day',`<p>Lock ${label(cur)}? Entries cannot be changed until an admin reopens it.</p>`,()=>{S.days[cur].closed={by:U.name,ts:stamp()};lg('Close day',label(cur));save();{const x=new Date(cur+'T00:00:00');x.setDate(x.getDate()+1);cur=iso(x)}reset();render()},'Close Day')}
  if(b==='reo')ask('Reopen day','<div class="f"><label>Reason (required)</label><input id="rr" maxlength="100"></div><div class="f"><label>Admin PIN</label><input id="rp" type="password" inputmode="numeric" autocomplete="off"></div>',async()=>{
    const r=$('rr').value.trim();if(!r||!(await ck(S.users.admin,$('rp').value))){$('rp').value='';$('rp').placeholder='Reason or PIN is wrong';return false}
    delete S.days[cur].closed;lg('Reopen day',label(cur)+' — '+r);save();render()},'Reopen')});

function staffUI(){ask('Staff',S.users.staff.map(x=>`<div class="sr"><span>${esc(x.name)} <small class="mut">· ${x.role||'cashier'}</small>${x.on?'':' <span class="b v">Off</span>'}</span><span><button class="lnk" data-s="o" data-i="${x.id}">Role</button><button class="lnk" data-s="t" data-i="${x.id}">${x.on?'Deactivate':'Activate'}</button><button class="lnk" data-s="r" data-i="${x.id}">Reset PIN</button></span></div>`).join('')+'<div class="f" style="margin-top:12px"><label>New staff name</label><input id="sn" maxlength="40"></div><div class="f"><label>Role</label><select id="sr"><option value="cashier">Cashier (POS and ledger entry)</option><option value="keeper">Stock manager (Products and More only)</option><option value="accountant">Accountant (accounts, ledger, stock and cash; read-only)</option></select></div><div class="f"><label>PIN (6+ digits)</label><input id="sp" type="password" inputmode="numeric" autocomplete="off"></div>',async()=>{
  const nm=$('sn').value.trim(),p=$('sp').value;if(!nm&&!p)return;if(!nm||!/^\d{6,}$/.test(p))return false;
  S.users.staff.push({id:Date.now(),name:nm,on:1,role:$('sr').value,...await mk(p)});lg('Add staff',nm);save()},'Add staff')}
 $('ob').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;const x=S.users.staff.find(y=>y.id==b.dataset.i);
  if(b.dataset.s==='o'){x.role={cashier:'keeper',keeper:'accountant'}[x.role||'cashier']||'cashier';lg('Change role',x.name+' → '+x.role);save();staffUI()}
  else if(b.dataset.s==='t'){x.on=!x.on;lg((x.on?'Activate':'Deactivate')+' staff',x.name);save();staffUI()}
   else ask('Reset PIN — '+x.name,'<div class="f"><label>New PIN (6+ digits)</label><input id="np" type="password" inputmode="numeric" autocomplete="off"></div>',async()=>{if(!/^\d{6,}$/.test($('np').value))return false;Object.assign(x,await mk($('np').value));lg('Reset staff PIN',x.name);save();setTimeout(staffUI,0)},'Reset')});
if($('stf'))$('stf').onclick=staffUI;
function showChangeLog(){ask('Change Log','<div class="lg">'+(S.log.length?S.log.slice(0,100).map(l=>`<div><b>${esc(l.a)}</b> <small>${esc(l.ts)} · ${esc(l.u)}</small><br>${esc(l.d)}</div>`).join(''):'No changes yet')+'</div>',()=>{},'Close',1)}
window.showChangeLog=showChangeLog;
if($('logb'))$('logb').onclick=showChangeLog;
$('prt').onclick=()=>{lg('Print',label(cur));save();try{window.print()}catch(e){}};
applyTheme();
const sd=d=>d.slice(8)+'.'+d.slice(5,7)+'.'+d.slice(0,4);
function flt(){const f={q:$('sq').value.trim().toLowerCase(),t:$('sty').value,p:$('spy').value,a:$('sfa').value,b:$('sfb').value};return(f.q||f.t||f.p||f.a||f.b)?f:null}
function likelyDupEntry(e){if(e.void||e.dupDismissed)return false;return S.entries.some(function(x){return x.id!==e.id&&!x.void&&!x.removed&&!x.dupDismissed&&x.type===e.type&&x.amt===e.amt&&(x.cu&&e.cu?x.cu===e.cu:(x.party||'').toLowerCase()===(e.party||'').toLowerCase())&&Math.abs(Date.parse((x.d||'')+'T00:00:00')-Date.parse((e.d||'')+'T00:00:00'))<=86400000})}
const match=(e,f)=>(!f.q||(e.desc+' '+e.cat+' '+(e.party||'')).toLowerCase().includes(f.q))&&(!f.t||(f.t==='Check'?entChk(e):e.type===f.t))&&(!f.p||e.pay===f.p)&&(!f.a||e.d>=f.a)&&(!f.b||e.d<=f.b);
$('fb').addEventListener('input',render);
$('sclr').onclick=()=>{['sq','sty','spy','sfa','sfb'].forEach(i=>$(i).value='');render()};

let UN=null;
const snap=()=>{UN={u:U.name,d:JSON.stringify({entries:S.entries,days:S.days,names:S.names})}};
$('und').onclick=()=>{if(!UN||closed()||(!isA()&&UN.u!==U.name))return;const o=JSON.parse(UN.d),current=S.entries,before=wltRun().b;S.entries=o.entries;const after=wltRun().b,failed=Object.keys(after).find(k=>after[k]<0&&(before[k]>=0||after[k]<before[k]));if(failed){S.entries=current;ltoast('Undo blocked: '+WLT[failed]+' would become negative');return}S.days=o.days;S.names=o.names;UN=null;lg('Undo','Last action reverted');save();reset();render()};

const DEN=[1000,500,200,100,50,20,10,5,2,1];
const cct=()=>[...$('ob').querySelectorAll('[data-d]')].reduce((a,i)=>a+(+i.value||0)*i.dataset.d,0);
if($('cnt'))$('cnt').onclick=()=>ask('Cash Counter','<div class="cc">'+DEN.map(d=>`<label>৳${d}</label><input type="number" min="0" inputmode="numeric" data-d="${d}" placeholder="0"><b>0</b>`).join('')+'</div><div class="ct"><span>Total</span><b id="ctt">৳0</b></div>',()=>{$('fx').value=cct();preview()},'Use total');
$('ob').addEventListener('input',e=>{if(!e.target.dataset.d)return;e.target.nextElementSibling.textContent=n((+e.target.value||0)*e.target.dataset.d);$('ctt').textContent=tk(cct())});

let RP='day',RR=null;
function rng(p){const x=new Date(cur+'T00:00:00');let a=new Date(x),b=new Date(x);if(p==='week'){a.setDate(x.getDate()-(x.getDay()+1)%7);b=new Date(a);b.setDate(a.getDate()+6)}else if(p==='month'){a=new Date(x.getFullYear(),x.getMonth(),1);b=new Date(x.getFullYear(),x.getMonth()+1,0)}return[iso(a),iso(b)]}
function repHTML(p){const[a,b]=rng(p),all=sorted().filter(e=>!e.void),R=all.filter(e=>e.d>=a&&e.d<=b);
  let o=+S.start||0;all.forEach(e=>{if(e.d<a)o+=cash(e)});let c=o;R.forEach(e=>c+=cash(e));
  const T=y=>R.filter(e=>e.type===y&&!isWalletTransfer(e)),sm=l=>l.reduce((q,e)=>q+e.amt,0),sl=sm(T('Sale')),pu=sm(T('Purchase'));
  const L=[['Total Sell',sl],['Total Buy',pu],['Net (Sell − Buy)',sl-pu],['Owner Deposit',sm(T('Deposit'))],['Owner Withdrawal',sm(T('Withdrawal'))],['Adjustments',sm(T('Adjustment'))],['Ledger cash (received − given)',R.filter(e=>e.type==='Ledger').reduce((q,e)=>q+cash(e),0)],['Opening Cash',o],['Closing Cash',c]];
  const G=y=>{const m={};T(y).forEach(e=>{const k=e.cat||'Other';m[k]=(m[k]||0)+e.amt});return Object.entries(m).sort((x,z)=>z[1]-x[1])};
  const gs=G('Sale'),gp=G('Purchase');RR={a,b,L,gs,gp};
  const tb=r=>'<table class="rt">'+r.map(x=>`<tr><td>${esc(x[0])}</td><td>${n(x[1])}</td></tr>`).join('')+'</table>';
  return `<p><b>${sd(a)}${a===b?'':' – '+sd(b)}</b></p>`+tb(L)+'<p><b>Sales by category</b></p>'+tb(gs.length?gs:[['—',0]])+'<p><b>Expenses by category</b></p>'+tb(gp.length?gp:[['—',0]])}
$('rpb').onclick=()=>{ask('Reports',`<div class="f"><select id="rpd"><option value="day">Day</option><option value="week">Week (Sat–Fri)</option><option value="month">Month</option></select></div><div id="rbody">${repHTML(RP)}</div><div class="oa"><button class="ghost" id="rpr">Print</button><button class="ghost" id="rcv">Export CSV</button></div>`,()=>{},'Close',1);$('rpd').value=RP};
$('ob').addEventListener('change',e=>{if(e.target.id==='rpd'){RP=e.target.value;$('rbody').innerHTML=repHTML(RP)}});
$('ob').addEventListener('click',async e=>{
  if(e.target.id==='rpr'){$('rpt').innerHTML='<div class="pt"><h2>Nur Computer &amp; Stationery</h2></div>'+repHTML(RP);document.body.classList.add('pr');try{window.print()}catch(x){}setTimeout(()=>document.body.classList.remove('pr'),800)}
  if(e.target.id==='rcv'){const r=[['Report',sd(RR.a)+' - '+sd(RR.b)],...RR.L,['Sales by category',''],...RR.gs,['Expenses by category',''],...RR.gp];
    await dlFile('NCS_Report_'+RR.a+'.csv',r.map(x=>csvCell(x[0])+','+x[1]).join('\n'))}});

S.lang=S.lang||'en';
const BN={'Daily Accounts':'দৈনিক হিসাব','Nur Computer & Stationery':'নুর কম্পিউটার এন্ড স্টেশনারী','Today':'আজ','Settings':'সেটিংস','Lock':'লক','Total Sell':'মোট বিক্রয়','Total Buy':'মোট ক্রয়','Difference (pending)':'পার্থক্য (বাকি)','Counted vs account':'গণনা বনাম হিসাব','Cash Balance':'ক্যাশ ব্যালেন্স','Account balance now':'বর্তমান হিসাবের ব্যালেন্স','Opening Cash':'প্রারম্ভিক ক্যাশ','Closing Cash':'সমাপনী ক্যাশ','Adjustments today':'আজকের সমন্বয়','Prepared':'প্রস্তুতকারী','Checked':'যাচাইকারী','Open':'খোলা','Closed':'বন্ধ','Close Day':'দিন বন্ধ করুন','Reopen':'পুনরায় খুলুন','Sl':'ক্র.','Time':'সময়','Description':'বিবরণ','Sell':'বিক্রয়','Buy':'ক্রয়','Previous Cash':'পূর্বের ক্যাশ','Actual Cash':'প্রকৃত ক্যাশ','Difference':'পার্থক্য','Type':'ধরন','Category':'ক্যাটাগরি','Payment method':'পেমেন্ট পদ্ধতি','Amount':'পরিমাণ','Actual cash (optional)':'গণনা করা প্রকৃত ক্যাশ (ঐচ্ছিক)','Count':'গণনা','Add entry':'এন্ট্রি যোগ করুন','Save changes':'পরিবর্তন সংরক্ষণ','Cancel edit':'সম্পাদনা বাতিল','Staff':'কর্মী','Change Log':'পরিবর্তন লগ','Print':'প্রিন্ট','Export CSV':'CSV এক্সপোর্ট','Reports':'রিপোর্ট','Undo':'পূর্বাবস্থা','Edit':'সম্পাদনা','Void':'বাতিল','Adjust':'সমন্বয়','Adjusted':'সমন্বিত','Sale':'বিক্রয়','Purchase / Expense':'ক্রয় / খরচ','Owner Deposit':'মালিকের জমা','Owner Withdrawal':'মালিকের উত্তোলন','Cash Adjustment (±)':'ক্যাশ সমন্বয় (±)','Cash':'নগদ','Mobile Banking':'মোবাইল ব্যাংকিং','Bank':'ব্যাংক','Due':'বাকি','All types':'সব ধরন','All payments':'সব পেমেন্ট','Clear':'মুছুন','No entries for this date':'এই তারিখে কোনো এন্ট্রি নেই','Previous':'পূর্বের','Sign in':'সাইন ইন','User':'ব্যবহারকারী','Unlock':'আনলক','Admin':'অ্যাডমিন','Close':'বন্ধ করুন','Cancel':'বাতিল','Confirm':'নিশ্চিত করুন','Day':'দিন','Week (Sat–Fri)':'সপ্তাহ (শনি–শুক্র)','Month':'মাস','Net (Sell − Buy)':'নিট (বিক্রয় − ক্রয়)','Adjustments':'সমন্বয়','Sales by category':'ক্যাটাগরি অনুযায়ী বিক্রয়','Expenses by category':'ক্যাটাগরি অনুযায়ী খরচ','Total':'মোট','Use total':'মোট ব্যবহার করুন','Cash Counter':'ক্যাশ কাউন্টার','Home':'হোম','Products':'পণ্য','POS':'পস','Accounts':'হিসাব','More':'আরও','New sale':'নতুন বিক্রয়','New purchase':'নতুন ক্রয়','Recent bills':'সাম্প্রতিক বিল','Overview':'সারসংক্ষেপ','Customer name':'গ্রাহকের নাম','Supplier name':'সরবরাহকারীর নাম','Phone (optional)':'ফোন (ঐচ্ছিক)','PIN':'পিন','Forgot admin PIN':'অ্যাডমিন পিন ভুলে গেছেন','DAILY ACCOUNTS':'দৈনিক হিসাব','Sync: Off':'সিঙ্ক: বন্ধ','Sync: Synced':'সিঙ্ক: সম্পন্ন','Sync: Pending':'সিঙ্ক: অপেক্ষমাণ','Sync: Offline':'সিঙ্ক: অফলাইন','Sync: Conflict':'সিঙ্ক: দ্বন্দ্ব','Ledger':'খাতা','Today\'s bills':'আজকের বিল','Point of sale':'বিক্রয় কেন্দ্র','Purchase':'ক্রয়','Held':'হোল্ড','Bills':'বিল','Drawer':'ক্যাশ ড্রয়ার','Scan':'স্ক্যান','Sale cart':'বিক্রয় কার্ট','Purchase cart':'ক্রয় কার্ট','Subtotal':'উপমোট','Discount':'ছাড়','Hold bill':'বিল হোল্ড','+ Custom item':'+ নিজের আইটেম','Charge':'বিল নিন','Stock and prices':'স্টক ও দাম','+ New product':'+ নতুন পণ্য','All':'সব','Low stock':'কম স্টক','Out of stock':'স্টক শেষ','Settings and tools':'সেটিংস ও টুলস','Scan barcode':'বারকোড স্ক্যান','This day is closed. An admin can reopen it to add or change entries.':'এই দিনটি বন্ধ। অ্যাডমিন আবার খুলে দিলে এন্ট্রি যোগ বা পরিবর্তন করা যাবে।','Balance would be negative':'ব্যালেন্স ঋণাত্মক হয়ে যাবে','Reason (required)':'কারণ (আবশ্যক)','Account will change by':'হিসাব পরিবর্তিত হবে','to match counted cash':'গণনা করা নগদের সাথে মেলাতে','Other':'অন্যান্য','Starting cash':'শুরুর নগদ','Day starts (Day/Night theme)':'দিন শুরু (দিন/রাত থিম)','Night starts':'রাত শুরু','Google Sheet sync URL':'গুগল শিট সিঙ্ক ইউআরএল','Sync key':'সিঙ্ক কী','Secure sync setup':'নিরাপদ সিঙ্ক সেটআপ','Start fresh (carry forward balances)':'নতুন করে শুরু','Admin PIN':'অ্যাডমিন পিন','Off':'বন্ধ','Role':'ভূমিকা','Reset PIN':'পিন রিসেট','New staff name':'নতুন স্টাফের নাম','Cashier (POS and ledger entry)':'ক্যাশিয়ার (বিক্রয় ও খাতা এন্ট্রি)','Stock manager (Products and More only)':'স্টক ম্যানেজার','Accountant (accounts, ledger, stock and cash; read-only)':'হিসাবরক্ষক','PIN (4+ digits)':'পিন (৪+ সংখ্যা)','New PIN (4+ digits)':'নতুন পিন (৪+ সংখ্যা)','Use Sheet data':'শিটের তথ্য নিন','Keep this device':'এই ডিভাইস রাখুন','Shop passphrase':'দোকানের পাসফ্রেজ','Web app URL':'ওয়েব অ্যাপ ইউআরএল','Repeat passphrase':'পাসফ্রেজ আবার দিন','Copy':'কপি','VOID':'বাতিল','No bills yet':'এখনো কোনো বিল নেই','Long-press or right-click a product to edit it.':'পণ্য এডিট করতে চেপে ধরুন বা রাইট-ক্লিক করুন।','No products yet. Use Add Product, scan a barcode, or use Custom item.':'এখনো কোনো পণ্য নেই।','Cart is empty':'কার্ট খালি','Camera':'ক্যামেরা','Gallery':'গ্যালারি','Name':'নাম','Barcode (optional)':'বারকোড (ঐচ্ছিক)','Buying cost':'ক্রয়মূল্য','Selling price':'বিক্রয়মূল্য','Opening stock':'শুরুর স্টক','Delete product':'পণ্য মছুন','Item name':'আইটেমের নাম','Price':'দাম','Exact':'সঠিক','Short by':'কম আছে','Share':'শেয়ার','Sales':'বিক্রয়','Purchases':'ক্রয়','Receipt':'রসিদ','No bills today':'আজ কোনো বিল নেই','Resume':'চালু করুন','Delete':'মুছুন','No held bills':'কোনো হোল্ড বিল নেই','Add stock':'স্টক যোগ','No products found':'কোনো পণ্য পাওয়া যায়নি','Quantity':'পরিমাণ','How did it come?':'কীভাবে এলো?','Bought':'কেনা','Brought in':'নিয়ে আসা','Date':'তারিখ','Void entry':'এন্ট্রি বাতিল','Adjust cash':'নগদ সমন্বয়','Reopen day':'দিন আবার খুলুন','Sync conflict':'সিঙ্ক দ্বন্দ্ব','Start fresh':'নতুন করে শুরু','Reconnect sync':'সিঙ্ক আবার যুক্ত করুন','Custom item':'নিজের আইটেম','Day closed':'দিন বন্ধ','Held bills':'হোল্ড বিল','Drawer notes and coins':'ড্রয়ারের নোট ও কয়েন','Set drawer counts':'ড্রয়ার গণনা দিন','Search products':'পণ্য খুঁজুন','Saved':'সংরক্ষিত','Copied':'কপি হয়েছে','Voided':'বাতিল হয়েছে','Bill held':'বিল হোল্ড হয়েছে','Stock added':'স্টক যোগ হয়েছে','Search or scan barcode':'খুঁজুন বা বারকোড স্ক্যান করুন','Stock':'স্টক','Cost not set':'ক্রয়মূল্য দেওয়া নেই','Version history':'সংস্করণ ইতিহাস','Units in stock':'মোট ইউনিট','Low or out of stock':'কম বা শেষ স্টক','Stock value (cost)':'স্টকের মূল্য (ক্রয়)','Manage':'ব্যবস্থাপনা','Customer':'কাস্টমার','Check':'যাচাই','Needs check':'যাচাই দরকার','Ledger cash / wallet':'খাতা ক্যাশ / ওয়ালেট','Link customer':'কাস্টমার যুক্ত করুন','Accept':'গ্রহণ','Ledger cash (received − given)':'খাতার ক্যাশ (পেলাম − দিলাম)','Product Name/ID/Barcode':'পণ্যের নাম/আইডি/বারকোড','Add Product':'পণ্য যোগ করুন','Browse products / Add to bill':'পণ্য দেখুন / বিলে যোগ করুন','Cash in':'নগদ এসেছে','Cash out':'নগদ গেছে','Net':'নিট','Entries':'এন্ট্রি','No cash movements today':'আজ কোনো নগদ লেনদেন নেই','Who owes whom':'কার কাছে পাওনা / দেনা','They owe us':'আমরা পাব','We owe':'আমরা দেব','parties':'পক্ষ','Net receivable':'নিট পাওনা','Net payable':'নিট দেনা','Open Ledger':'খাতা খুলুন','Change admin PIN':'অ্যাডমিন পিন পরিবর্তন','Current PIN':'বর্তমান পিন','New PIN (6+ digits)':'নতুন পিন (৬+ সংখ্যা)','Confirm new PIN':'নতুন পিন নিশ্চিত করুন','Wrong PIN':'ভুল পিন','Could not save. Try again.':'সংরক্ষণ হয়নি। আবার চেষ্টা করুন।','Admin PIN changed':'অ্যাডমিন পিন পরিবর্তন হয়েছে','Run self test':'সেলফ টেস্ট','Check calculations, storage and key modules':'হিসাব, স্টোরেজ ও মূল মডিউল পরীক্ষা','Request void':'বাতিলের অনুরোধ','Void request':'বাতিলের অনুরোধ','Review void request':'বাতিলের অনুরোধ দেখুন','Void requested — awaiting Admin':'বাতিলের অনুরোধ অপেক্ষমাণ','A void request is already pending':'বাতিলের অনুরোধ অপেক্ষমাণ','Admin must approve this request before the entry is voided.':'অ্যাডমিন অনুমোদন করার আগে এন্ট্রি বাতিল হবে না।','Request':'অনুরোধ','Reason to reject':'প্রত্যাখ্যানের কারণ','Reject':'প্রত্যাখ্যান','Approve':'অনুমোদন','Reject flag':'চিহ্ন প্রত্যাখ্যান','Flag for Admin check':'অ্যাডমিন যাচাইয়ের জন্য চিহ্নিত করুন','Sound effects':'সাউন্ড ইফেক্ট','Test sound':'সাউন্ড পরীক্ষা'};
var SHOP_EN='Nur Computer & Stationery',SHOP_BN='নুর কম্পিউটার এন্ড স্টেশনারী';function shopN(){return S.lang==='bn'?SHOP_BN:SHOP_EN}
const orig=new WeakMap();
function trp(q){var t=q.trim();if(BN[t])return q.replace(t,BN[t]);var m=t.match(/^([A-Za-z][A-Za-z\/ ]*?)(\s+[0-9৳#−+(\-].*)$/);return m&&BN[m[1]]?q.replace(m[1],BN[m[1]]):q}
BN['Admin PIN (6+ digits)']='অ্যাডমিন পিন (৬+ সংখ্যা)';BN['New PIN (6+ digits)']='নতুন পিন (৬+ সংখ্যা)';BN['PIN (6+ digits)']='পিন (৬+ সংখ্যা)';BN['Confirm PIN']='পিন নিশ্চিত করুন';BN['PINs must match and be 6+ digits']='পিন মিলতে হবে এবং কমপক্ষে ৬ সংখ্যা হতে হবে';
Object.assign(BN,{
  'Task Schedule':'কাজের সময়সূচী','Tasks':'কাজের তালিকা','New Task':'নতুন কাজ','Workflow & Task Management':'কাজের অগ্রগতি ও সময়সূচী',
  'Board':'বোর্ড','List':'তালিকা','Total Tasks':'মোট কাজ','Active Tasks (excluding Done)':'চলমান কাজসমূহ',
  'All Stages':'সব ধাপ','All Priorities':'সব অগ্রাধিকার','All Staff':'সকল কর্মী','Under Review':'পর্যালোচনায়',
  'In Progress':'চলমান','Pending':'অমীমাংসিত','Completed':'সম্পন্ন','Cancelled':'বাতিল',
  'Deadline':'শেষ সময়সীমা','Taking Date':'গ্রহণের তারিখ','Progress':'অগ্রগতি','Priority':'অগ্রাধিকার',
  'Assign To':'দায়িত্বপ্রাপ্ত কর্মী','Task Title *':'কাজের শিরোনাম *','Create New Task':'নতুন কাজ তৈরি',
  'Edit Task':'কাজ সম্পাদনা','Task Details':'কাজের বিস্তারিত','Overdue':'সময় পার'
});
function tx(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let x;while(x=w.nextNode()){if(!orig.has(x))orig.set(x,x.nodeValue);const o=orig.get(x);
  x.nodeValue=S.lang==='bn'?o.split(' · ').map(trp).join(' · '):o}
  document.querySelectorAll('[placeholder]').forEach(e=>{if(e.id==='fd'||e.id==='sq')return;if(e.dataset.ph===undefined)e.dataset.ph=e.getAttribute('placeholder');const v=e.dataset.ph;e.setAttribute('placeholder',S.lang==='bn'&&BN[v]?BN[v]:v)})}
new MutationObserver(()=>tx(document.body)).observe(document.body,{childList:true,subtree:true});
function applyLang(){const b=S.lang==='bn';document.documentElement.lang=b?'bn':'en';$('lang').textContent=b?'English':'বাংলা';setRefreshLabel();$('fd').placeholder=b?'পণ্য বা খরচের নাম লিখুন':'Type product or cost name';$('sq').placeholder=b?'বিবরণ বা ক্যাটাগরি খুঁজুন':'Search description or category';tx(document.body);if(typeof clkTick==='function')clkTick();if(U)render();try{updateMoreTab()}catch(e){}}
$('lang').onclick=()=>{S.lang=S.lang==='bn'?'en':'bn';save();applyLang()};

async function dlFile(name,data){try{if(typeof claude!=='undefined'){const dl=await claude.use('downloads');if(dl)return dl.save({filename:name,data})}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},1000)}catch(e){try{window.open('data:text/plain;charset=utf-8,'+encodeURIComponent(data),'_blank')}catch(x){}}}
const LOCAL=['theme','dayStart','dayEnd','lang','lockout','sync','snaps','logSent','synced','posSince','motion','sound','lastBackup','cardSettings'];
const syncUrl=()=>(window.NCS_CONFIG&&(window.NCS_CONFIG.API_URL||window.NCS_CONFIG.url))||(S.sync&&S.sync.url)||'';
const syncKey=()=>(window.NCS_CONFIG&&(window.NCS_CONFIG.API_TOKEN||window.NCS_CONFIG.key))||(S.sync&&S.sync.key)||'';
const SY=()=>!!(syncUrl()&&syncKey());
const isDirty=()=>(S.rev||0)!==(S.synced||0);
let st='off',tm,busy=false;
function setSt(x){st=x;var c=x==='ok'?'ok':x==='pend'?'pend':(x==='offl'||x==='conf')?'bad':'off',lab={off:'Off',ok:'Synced',pend:'Pending',offl:'Offline',conf:'Conflict'}[x];
  var labBn={off:'বন্ধ',ok:'সিঙ্ক সম্পন্ন',pend:'অপেক্ষমাণ',offl:'অফলাইন',conf:'দ্বন্দ্ব'}[x]||lab;
  var txt=S.lang==='bn'?labBn:lab;
  var syncEl=$('sync'), topSync=$('topSync');
  if(syncEl){
    var descEl = syncEl.querySelector ? syncEl.querySelector('.more-item-text small') : null;
    if(descEl){
      descEl.textContent = txt;
    } else {
      syncEl.innerHTML='<i class="sdot '+c+'" aria-hidden="true"></i>'+txt;
    }
    syncEl.setAttribute('aria-label',lb('Sync status: ','সিঙ্ক অবস্থা: ')+txt);
    syncEl.title=c==='ok'?'All changes are synced':c==='pend'?'Saving changes…':x==='conf'?'Sync conflict — tap to resolve':c==='bad'?'Offline — will sync when back online':'Sync is not set up on this device';
  }
  if(topSync){
    topSync.innerHTML='<i class="sdot '+c+'" aria-hidden="true"></i><span>'+txt+'</span>';
    topSync.className='top-sync-pill top-sync-'+c;
    topSync.title=syncEl?syncEl.title:'';
  }
}
let isManualSyncing = false;
async function triggerSync(){
  if(isManualSyncing || busy) return;
  if(st === 'conf'){
    ask('Sync conflict', '<p>This device and the Google Sheet both have new changes. Choose which to keep.</p><div class="oa" style="justify-content:flex-start"><button class="ghost" id="scp">Use Sheet data</button><button class="ghost" id="scf">Keep this device</button></div>', ()=>{}, 'Close');
    return;
  }
  if(!SY()){
    if($('set')) $('set').onclick();
    return;
  }
  isManualSyncing = true;
  setSt('pend');
  if(typeof ltoast === 'function') ltoast(lb('Syncing with Google…', 'গুগলের সাথে সিঙ্ক হচ্ছে…'));
  try{
    await push(true);
    await pull(true);
  }catch(err){
    console.error('Manual sync failed:', err);
    setSt('offl');
  }finally{
    isManualSyncing = false;
  }
}

if(typeof document!=='undefined'){
  document.addEventListener('click',function(e){
    var b=e.target.closest('#topSync');
    if(!b)return;
    triggerSync();
  });
}

function schedule(){
  if(!SY())return;setSt('pend');clearTimeout(tm);tm=setTimeout(()=>push(),600);
}

const HEAD=['Date','Time','Type','Description','Category','Payment','Amount','Previous Cash','Cash Balance','Actual Cash','Difference','Status','Entered by','Party','Phone'];
function rowsOut(){const m=calc();return sorted().map(e=>{const r=m[e.id]||{};return[e.d,e.t,e.type,e.desc,e.cat||'',e.pay,e.amt,r.p??'',r.bal??'',e.act??'',r.df??'',e.void?'Void: '+e.vr:'Active',e.by||'',e.party||'',e.phone||'']})}
function stateOut(){const o={};for(const k in S)if(!LOCAL.includes(k))o[k]=S[k];return o}
const getRemote=async()=>{
  const u=syncUrl(),k=syncKey();
  const sep=u.includes('?')?'&':'?';
  return (await fetch(`${u}${sep}action=pull&key=${encodeURIComponent(k)}&token=${encodeURIComponent(k)}&_t=${Date.now()}`)).json();
};

async function push(force,tries){
  tries=tries||0;
  if(!SY()||!U||busy)return;busy=true;
  try{
    const sn=Object.keys(S.days||{}).filter(d=>S.days[d]&&S.days[d].closed&&!(S.snaps||[]).includes(d));
    const nl=(S.log||[]).filter(l=>l.i>(S.logSent||0)).reverse();
    const rev=S.rev||1;
    const u=syncUrl(),k=syncKey();
    const r=await(await fetch(u,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        key:k,
        token:k,
        base:S.synced||0,
        force:!!force,
        rev:rev,
        state:JSON.stringify(stateOut()),
        head:HEAD,
        rows:rowsOut(),
        log:nl.map(l=>[l.ts,l.u,l.a,l.d]),
        snaps:sn
      })
    })).json();
    if(r.conflict){busy=false;if(tries<4&&await mergeRemote())return push(force,tries+1);setSt('conf');return}
    if(r.ok===false){busy=false;return badKey()}if(!r.ok)throw 0;
    S.synced=rev;S.snaps=[...(S.snaps||[]),...sn];if(S.log&&S.log.length)S.logSent=Math.max(...S.log.map(l=>l.i));persist();setSt(isDirty()?'pend':'ok');if(!isDirty()){try{Sound.chime()}catch(e){}}if(isDirty())schedule()
  }catch(e){setSt('offl')}
  busy=false}
function applyRemote(r){const k={};LOCAL.forEach(x=>{if(x in S)k[x]=S[x]});S=Object.assign({},JSON.parse(r.state),k,{rev:r.rev,synced:r.rev});window.S=S;ensureCols();primeLH();persist();if(U){if(CUR==='acc')reset();redrawActiveView()}setSt('ok');try{Sound.chime()}catch(e){}}
async function importPos(){
  if(!SY())return;
  try{
    const u=syncUrl(),k=syncKey();
    const sep=u.includes('?')?'&':'?';
    const r=await(await fetch(`${u}${sep}action=inbox&key=${encodeURIComponent(k)}&token=${encodeURIComponent(k)}&since=${S.posSince||0}`)).json();
    if(!r.ok||!r.rows||!r.rows.length)return;
    let c=0,mx=S.posSince||0;
    r.rows.forEach(x=>{mx=Math.max(mx,x.seq);const b=x.bill;if(b.voidOf){const w=S.entries.find(e=>e.id===b.voidOf);if(w&&!w.void){w.void=1;w.vr='POS void: '+b.reason;c++}return}if(S.entries.some(e=>e.id===b.id))return;
      let d=b.d;if(S.days[d]&&S.days[d].closed)d=iso(new Date());
      S.entries.push({id:b.id,d,t:b.t,type:b.mode==='purchase'?'Purchase':'Sale',desc:String(b.desc).slice(0,200),cat:'POS',pay:b.pay,amt:b.total,by:b.user,party:b.party||'',phone:b.phone||'',pos:1,act:null});c++});
    S.posSince=mx;if(c){lg('POS import',c+' bill(s)');save()}else persist();if(U)render()
  }catch(e){}}

async function pull(force){
  if(!SY()||busy)return;
  try{const r=await getRemote();if(r.ok===false)return badKey();if(!r.ok)throw 0;
    if(r.rev>(S.synced||0)){if(isDirty()){if(mergeRemoteFrom(r))push();else setSt('conf');return}applyRemote(r)}
    else if(isDirty()||(!r.rev&&S.entries.length))push();else setSt('ok');importPos();importCatalog()
  }catch(e){setSt('offl')}}
if($('sync')) $('sync').onclick = triggerSync;
$('ob').addEventListener('click',e=>{if(e.target.id!=='sfr')return;
  ask('Start fresh','<p>Daily entries and bills are cleared from the active day view. Cash and wallets carry forward, ledger history and stock are retained, and an Admin reconciliation item is created.</p><div class="f"><label>Admin PIN</label><input id="sfp" type="password" inputmode="numeric" autocomplete="off"></div>',async()=>{
    if(!(await ck(S.users.admin,$('sfp').value))){$('sfp').value='';$('sfp').placeholder='Wrong PIN';return false}
    snap();var carry=cashBook(),wallet=calcWallets(),batch=Date.now();S.history=S.history||[];S.history.unshift({id:batch,type:'Start fresh archive',at:batch,by:U.name,entries:S.entries.slice(),days:S.days||{},names:S.names||{}});S.start=carry;S.entries=[];S.days={};S.names={};S.wallets=Object.assign({u:batch},wallet);S.walletDates=[];S.pending=S.pending||[];S.pending.unshift({id:batch,type:'Start fresh',state:'pending',at:batch,by:U.name,reason:'Verify carried cash, wallet, ledger and stock balances',details:{cash:carry,wallets:wallet,archivedEntries:S.history[0].entries.length}});S.epoch=batch;lg('Start fresh','Archived '+S.history[0].entries.length+' daily entries; carried cash '+carry+' and wallets forward; bills, ledger and stock retained. Admin check queued.');save();reset();render()},'Carry forward')});
$('ob').addEventListener('click',async e=>{
  if(e.target.id==='scp'){try{const r=await getRemote();if(r.ok&&r.rev)applyRemote(r)}catch(x){setSt('offl')}$('ov').hidden=true}
  if(e.target.id==='scf'){$('ov').hidden=true;await push(true)}});
setInterval(()=>{if(U&&!document.hidden)pull()},15000);
addEventListener('online',()=>{if(U)pull()});
document.addEventListener('visibilitychange',()=>{if(U&&!document.hidden)pull()});
setSt(SY()?(isDirty()?'pend':'ok'):'off');
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))),ub=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
async function kdf(pw,salt,n){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:n,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encCfg(o,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),n=600000,k=await kdf(pw,salt,n);return{s:b64(salt),i:b64(iv),c:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(o)))),n}}
async function decCfg(e,pw){const k=await kdf(pw,ub(e.s),e.n);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(e.i)},k,ub(e.c))))}
function badKey(){setSt('offl');if(!ENC||!U)return;ask('Reconnect sync','<p>The sync key changed. Enter the shop passphrase to reconnect.</p><div class="f"><label>Shop passphrase</label><input id="rcp" type="password" autocomplete="off"></div>',async()=>{try{const c=await decCfg(ENC,$('rcp').value);S.sync={url:c.url,key:c.key};persist();pull()}catch(e){$('rcp').value='';$('rcp').placeholder='Wrong passphrase';return false}},'Reconnect')}
$('ob').addEventListener('click',e=>{if(e.target.id!=='ssu')return;
  ask('Secure sync setup',`<p>Creates an encrypted config.js that is safe in a public repository.</p><div class="f"><label>Web app URL</label><input id="g1" value="${esc(S.sync?S.sync.url:'')}"></div><div class="f"><label>Sync key (the key in your Apps Script)</label><input id="g2" type="password"></div><div class="f"><label>Shop passphrase (12+ characters)</label><input id="g3" type="password"></div><div class="f"><label>Repeat passphrase</label><input id="g4" type="password"></div>`,async()=>{
    const u=$('g1').value.trim(),k=$('g2').value.trim(),p=$('g3').value;
    if(!/^https:\/\//.test(u)||!k||p.length<12||p!==$('g4').value){$('g4').value='';$('g4').placeholder='Check URL, key, and matching passphrase (12+)';return false}
    const en=await encCfg({url:u,key:k},p);await decCfg(en,p);S.sync={url:u,key:k};persist();
    const txt='// Encrypted sync setup. Safe to keep in a public repository.\nwindow.NCS_CONFIG = '+JSON.stringify({enc:en})+';\n';
    setTimeout(()=>ask('Your new config.js',`<p>Copy all of this and paste it into config.js on GitHub (replace everything), then commit.</p><textarea id="cfo" readonly rows="7" style="width:100%;font:12px monospace;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--ink);padding:8px">${esc(txt)}</textarea><div class="oa"><button class="ghost" id="cfc">Copy</button></div>`,()=>{},'Done'),0);pull()},'Generate')});
$('ob').addEventListener('click',async e=>{if(e.target.id!=='cfc')return;const t=$('cfo');t.select();try{await navigator.clipboard.writeText(t.value)}catch(x){document.execCommand('copy')}e.target.textContent='Copied'});
function startSess(){exp=Date.now()+864e5;const r=U.role==='admin'?S.users.admin:S.users.staff.find(x=>x.id==U.id);try{localStorage.setItem(SESS,JSON.stringify({u:U,exp,h:r.h,rn:S.rebootN||0}))}catch(e){}}
function resume(){try{const q=JSON.parse(localStorage.getItem(SESS)||'null');if(!q||Date.now()>q.exp||(q.rn||0)<(S.rebootN||0))return false;
  const r=q.u.role==='admin'?S.users.admin:S.users.staff.find(x=>x.id==q.u.id&&x.on);
  if(!r||r.h!==q.h)return false;U=q.u;exp=q.exp;
  try{enter()}catch(e){console.error('Session enter failed',e)}
  return true}catch(e){console.error('Session restore failed',e);return false}}
async function start(){if(ENC&&!SY()){lockUI('connect');return}if(!S.users&&SY()){try{const r=await getRemote();if(r.ok&&r.rev&&r.state)applyRemote(r)}catch(e){}}if(S.users&&resume())return;S.users?lockUI('login'):lockUI('first')}
