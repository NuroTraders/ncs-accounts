/* ---------- shell ---------- */
const ICO={mgmt:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',led:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 8h4M17 12h4"/>',home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',pos:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',acc:'<path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z"/><path d="M9 8h6M9 12h6"/>',prod:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'};
const TABS={admin:['home','pos','prod','acc','led','mgmt','more'],keeper:['prod','more'],accountant:['acc','led','prod','more'],cashier:['pos','led','more']},TL={home:'Home',pos:'POS',prod:'Products',acc:'Accounts',led:'Ledger',mgmt:'Manage',more:'More'};
let CUR=null;
const role=()=>!U?'':U.role==='admin'?'admin':U.role==='accountant'?'accountant':U.role==='keeper'?'keeper':'cashier',canCost=()=>isA()||role()==='keeper'||role()==='accountant';
function buildTabs(){const T=TABS[role()];$('tabs').innerHTML=T.map(k=>`<button data-v="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg>${TL[k]}</button>`).join('');$('tabs').hidden=false;$('tsub').textContent=(U.name.toLowerCase()===role()?'':U.name+' · ')+role();let saved=CUR;try{if(!saved)saved=sessionStorage.getItem('ncs_active_view_v1_'+role())}catch(e){}go(saved&&T.includes(saved)?saved:T[0])}
function go(v){try{Sound.tick()}catch(e){}CUR=v;try{sessionStorage.setItem('ncs_active_view_v1_'+role(),v)}catch(e){}document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='v'+v[0].toUpperCase()+v.slice(1)));document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='home'){homeUI();try{applyCardSettings()}catch(e){}}if(v==='pos')POS.refresh();if(v==='prod')POS.prodUI();if(v==='acc'){AV=false;cur=iso(new Date());reset();render();try{applyCardSettings()}catch(e){}}if(v==='led')ledUI();if(v==='mgmt')mgmtUI();if(v==='more')updateMoreTab();document.body.classList.toggle('kp',role()==='keeper');document.body.classList.toggle('ro',role()==='accountant');clkVis();scrollTo(0,0)}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(b.dataset.v)});
var sndBtn=document.createElement('button');sndBtn.className='ghost';sndBtn.id='sndBtn';sndBtn.style.height='48px';sndBtn.style.textAlign='left';sndBtn.style.fontSize='15px';sndBtn.style.borderRadius='14px';
var secCardBtn=document.createElement('button');secCardBtn.className='ghost';secCardBtn.id='secCardBtn';secCardBtn.style.height='48px';secCardBtn.style.textAlign='left';secCardBtn.style.fontSize='15px';secCardBtn.style.borderRadius='14px';
var bugBtn = document.createElement('button');
bugBtn.className = 'ghost';
bugBtn.id = 'bugBtn';
bugBtn.style.height = '48px';
bugBtn.style.textAlign = 'left';
bugBtn.style.fontSize = '15px';
bugBtn.style.borderRadius = '14px';
bugBtn.textContent = '🐞 Report a Bug (Beta)';
bugBtn.onclick = function() {
  if (!window.NcsDiag) return alert('Diagnostics not loaded');
  ask('Report a Bug', '<div class="f"><label>What happened?</label><textarea id="bugDesc" rows="3" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--bg);color:var(--ink)"></textarea></div><div class="f"><label>What were you doing?</label><select id="bugAct"><option>General</option><option>Adding Entry</option><option>POS Bill</option><option>Ledger</option><option>Sync</option><option>Wallet</option></select></div><p class="mut">This will attach your last 200 app events (no PII, no PINs).</p>', function() {
    const desc = $('bugDesc').value;
    const act = $('bugAct').value;
    const report = window.NcsDiag.makeReport(desc, act);
    const filename = 'NCS_Bug_Report_' + Date.now() + '.txt';
    dlFile(filename, report.text + '\n\n--- JSON ---\n' + JSON.stringify(report, null, 2));
    if (navigator.share) {
       navigator.share({title: 'NCS Bug Report', text: report.text}).catch(()=>{});
    }
  }, 'Export');
};

$('topR').append($('sync'));$('moreList').append($('lang'),sndBtn,secCardBtn,bugBtn,$('set'),$('lockb'));
function updateSndBtn(){var b=$('sndBtn');if(b)b.textContent='Sound effects: '+(S.sound?'ON':'OFF');}
sndBtn.onclick=function(){S.sound=!S.sound;save();updateSndBtn();if(S.sound){try{Sound.test()}catch(e){}}};
secCardBtn.onclick=function(){if(isA())openCardSectionSettings()};
function updateMoreTab(){
  updateSndBtn();
  if(secCardBtn){
    secCardBtn.style.display=isA()?'':'none';
    secCardBtn.innerHTML='<span style="display:flex;align-items:center;gap:10px"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg><b>'+lb('Section & card settings','সেকশন ও কার্ড সমন্বয় সেটিংস')+'</b></span>';
  }
}
function redrawActiveView(){if(CUR==='home'){homeUI();try{applyCardSettings()}catch(e){}}else if(CUR==='pos')POS.refresh();else if(CUR==='prod')POS.prodUI();else if(CUR==='acc'){render();try{applyCardSettings()}catch(e){}}else if(CUR==='led')ledUI();else if(CUR==='mgmt')mgmtUI()}
function refreshCurrentView(){
  if(!U||!CUR)return;
  var svg=$('refresh').querySelector('svg');
  if(svg){svg.classList.add('spin');setTimeout(function(){svg.classList.remove('spin')},650)}
  redrawActiveView();
  if(SY())pull();
}
$('refresh').onclick=refreshCurrentView;
function setRefreshLabel(){var t=lb('Refresh current view','বর্তমান ট্যাব রিফ্রেশ করুন');$('refresh').title=t;$('refresh').setAttribute('aria-label',t)}

