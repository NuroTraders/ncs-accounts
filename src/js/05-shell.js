/* ---------- shell ---------- */
const ICO={
  mgmt:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  led:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  home:'<path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V9.5z"/><path d="M9 21.5V12h6v9.5"/>',
  pos:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  acc:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 2v4M16 2v4"/>',
  prod:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  more:'<circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>'
};
const TABS={
  admin:['home','led','pos','acc','more'],
  keeper:['pos','more'],
  accountant:['acc','led','pos','more'],
  cashier:['pos','led','more']
};
const TL={home:'Overview',led:'Ledger',pos:'Counter',acc:'Accounts',more:'More'};
const TL_BN={home:'ওভারভিউ',led:'খতিয়ান',pos:'কাউন্টার',acc:'হিসাব',more:'আরও'};
let CUR=null;
const role=()=>!U?'':U.role==='admin'?'admin':U.role==='accountant'?'accountant':U.role==='keeper'?'keeper':'cashier',canCost=()=>isA()||role()==='keeper'||role()==='accountant';

function isCounterStock(){var s=$('posStockWrap');return s&&s.style.display!=='none'}
function switchCounterView(mode){
  var isStock = mode==='stock';
  var bBill = $('cViewBill'), bStock = $('cViewStock');
  var wBill = $('posBillWrap'), wStock = $('posStockWrap');
  var bSeg = $('posBillSeg'), bNav = $('posBillNav'), sNav = $('posStockNav');
  if(bBill)bBill.classList.toggle('on', !isStock);
  if(bStock)bStock.classList.toggle('on', isStock);
  if(wBill)wBill.style.display = isStock ? 'none' : '';
  if(wStock)wStock.style.display = isStock ? '' : 'none';
  if(bSeg)bSeg.style.display = isStock ? 'none' : '';
  if(bNav)bNav.style.display = isStock ? 'none' : '';
  if(sNav)sNav.style.display = isStock ? '' : 'none';
  if(isStock){if(typeof POS!=='undefined'&&POS.prodUI)POS.prodUI();}
  else{if(typeof POS!=='undefined'&&POS.refresh)POS.refresh();}
}
if($('cViewBill'))$('cViewBill').onclick=function(){switchCounterView('bill')};
if($('cViewStock'))$('cViewStock').onclick=function(){switchCounterView('stock')};

function buildTabs(){
  const T=TABS[role()];
  $('tabs').innerHTML=T.map(k=>`<button data-v="${k}" title="${TL[k]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg><span class="t-lbl">${(S.lang==='bn'&&TL_BN[k])?TL_BN[k]:TL[k]}</span></button>`).join('');
  $('tabs').hidden=false;
  $('tsub').textContent=(U.name.toLowerCase()===role()?'':U.name+' · ')+role();
  let saved=CUR;
  try{if(!saved)saved=sessionStorage.getItem('ncs_active_view_v1_'+role())}catch(e){}
  go(saved&&T.includes(saved)?saved:T[0])
}

function go(v){
  if(v==='prod'){go('pos');switchCounterView('stock');return}
  if(v==='mgmt'){go('more');return}
  try{Sound.tick()}catch(e){}
  CUR=v;
  try{sessionStorage.setItem('ncs_active_view_v1_'+role(),v)}catch(e){}
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='v'+v[0].toUpperCase()+v.slice(1)));
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='home'){homeUI();try{applyCardSettings()}catch(e){}}
  if(v==='pos'){
    if(role()==='keeper'){$('posViewSeg').style.display='none';switchCounterView('stock')}
    else {$('posViewSeg').style.display=''}
    POS.refresh();
    if(isCounterStock())POS.prodUI();
  }
  if(v==='acc'){AV=false;cur=iso(new Date());reset();render();try{applyCardSettings()}catch(e){}}
  if(v==='led')ledUI();
  if(v==='more')updateMoreTab();
  document.body.classList.toggle('kp',role()==='keeper');
  document.body.classList.toggle('ro',role()==='accountant');
  clkVis();
  scrollTo(0,0)
}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(b.dataset.v)});
var sndBtn=document.createElement('button');sndBtn.className='more-item';sndBtn.id='sndBtn';
var secCardBtn=document.createElement('button');secCardBtn.className='more-item';secCardBtn.id='secCardBtn';
var bugBtn=document.createElement('button');bugBtn.className='more-item';bugBtn.id='bugBtn';

function makeMoreItem(btn, iconSvg, title, subtitle){
  btn.className = 'more-item';
  btn.innerHTML = '<div class="more-item-left"><span class="more-item-icon">' + iconSvg + '</span><div class="more-item-text"><b>' + title + '</b><small>' + subtitle + '</small></div></div><span class="more-item-arrow">›</span>';
}

bugBtn.onclick = function() {
  if (!window.NcsDiag) return alert(lb('Diagnostics engine not loaded', 'ডায়াগনস্টিক ইঞ্জিন লোড হয়নি'));

  var html = '' +
    '<div class="f"><label>' + lb('What were you doing?', 'আপনি কী করছিলেন?') + '</label>' +
      '<select id="bugAct" style="font-weight:600">' +
        '<option value="POS Sale">' + lb('POS Sale / Billing', 'পিওএস বিক্রি / বিল তৈরি') + '</option>' +
        '<option value="Adding Entry">' + lb('Adding Accounts Entry', 'হিসাব এন্ট্রি যোগ') + '</option>' +
        '<option value="Customer Ledger">' + lb('Customer / Party Ledger', 'খতিয়ান ও পার্টি ব্যালেন্স') + '</option>' +
        '<option value="Wallets & MFS">' + lb('Wallets & MFS / Recharge', 'ওয়ালেট / এমএফএস / রিচার্জ') + '</option>' +
        '<option value="Cloud Sync">' + lb('Cloud Sync / Google Sheets', 'ক্লাউড সিঙ্ক / গুগল শিট') + '</option>' +
        '<option value="General / Other">' + lb('General / Other issue', 'সাধারণ / অন্যান্য সমস্যা') + '</option>' +
      '</select>' +
    '</div>' +
    '<div class="f"><label>' + lb('What happened?', 'কী সমস্যা হয়েছে?') + ' <small class="mut">(' + lb('describe briefly', 'সংক্ষেপে লিখুন') + ')</small></label>' +
      '<textarea id="bugDesc" rows="3" placeholder="' + lb('Example: Could not save bill, balance mismatch, etc...', 'যেমন: বিল সেভ হয়নি, ব্যালেন্স মিলছে না ইত্যাদি...') + '" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);color:var(--ink);box-sizing:border-box"></textarea>' +
    '</div>' +
    '<div style="margin:12px 0 6px">' +
      '<button type="button" class="go" id="bugWa" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#ffffff;font-size:14px;border-radius:10px;height:42px">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.08 7.41 8.84 7.67C8.61 7.93 7.96 8.54 7.96 9.77C7.96 11 8.86 12.19 9 12.37C9.14 12.55 10.8 15.11 13.34 16.21C13.94 16.47 14.41 16.63 14.77 16.74C15.38 16.94 15.93 16.91 16.37 16.85C16.86 16.77 17.88 16.23 18.09 15.63C18.3 15.03 18.3 14.52 18.23 14.41C18.17 14.3 18.02 14.24 17.8 14.13C17.58 14.02 16.5 13.49 16.3 13.41C16.09 13.34 15.94 13.3 15.79 13.52C15.64 13.74 15.22 14.24 15.09 14.38C14.96 14.53 14.83 14.55 14.61 14.44C14.39 14.33 13.68 14.1 12.83 13.34C12.17 12.75 11.73 12.02 11.6 11.8C11.47 11.58 11.59 11.46 11.7 11.35C11.8 11.25 11.92 11.09 12.04 10.96C12.15 10.82 12.19 10.72 12.26 10.57C12.33 10.42 12.3 10.29 12.24 10.18C12.19 10.07 11.74 8.97 11.56 8.52C11.38 8.08 11.2 8.14 11.06 8.14H10.63C10.46 8.14 10.18 8.21 9.95 8.47L9.53 7.34Z"/></svg>' +
        '<b>' + lb('Send via WhatsApp (+8801765420566)', 'হোয়াটসঅ্যাপে পাঠান (+৮৮০১৭৬৫৪২০৫৬৬)') + '</b>' +
      '</button>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:8px">' +
      '<button type="button" class="ghost" id="bugCopy" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;font-size:13px">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '<span>' + lb('Copy Details', 'কপি করুন') + '</span>' +
      '</button>' +
      '<button type="button" class="ghost" id="bugDl" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;font-size:13px">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' +
        '<span>' + lb('Download Log', 'লগ ফাইল') + '</span>' +
      '</button>' +
    '</div>' +
    '<div id="bugStatus" class="mut" style="font-size:12px;text-align:center;min-height:18px"></div>' +
    '<p class="mut" style="font-size:11.5px;margin:4px 0 0;text-align:center">' + lb('Attaches technical log & system state (No customer passwords or private PINs).', 'কারিগরি ডায়াগনস্টিক তথ্য সংযুক্ত থাকবে (কোনো পাসওয়ার্ড বা পিন ছাড়া)।') + '</p>';

  ask(lb('Bug Report & Help', 'সহায়তা ও সমস্যা রিপোর্ট'), html, function() {
    return true;
  }, lb('Close', 'বন্ধ করুন'));

  var waBtn = $('bugWa');
  if (waBtn) {
    waBtn.onclick = function() {
      var act = $('bugAct') ? $('bugAct').value : 'General';
      var desc = $('bugDesc') ? $('bugDesc').value.trim() : '';
      var lastErr = (window.NcsDiag && window.NcsDiag.getLastError) ? window.NcsDiag.getLastError() : null;
      var role = isA() ? 'Admin' : (isK() ? 'Keeper' : 'Staff');
      var now = new Date();
      var timeStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      
      var msg = '🚨 *NCS Accounts Bug Report*\n' +
        '• *Version:* v' + (window.APP_VERSION || '10.1.1') + '\n' +
        '• *Time:* ' + timeStr + '\n' +
        '• *User:* ' + role + '\n' +
        '• *Activity:* ' + act + '\n' +
        '• *Issue:* ' + (desc || 'Issue reported during operation') + '\n';
      
      if (lastErr) {
        msg += '• *Last Error:* ' + (lastErr.msg || 'Error') + (lastErr.meta && lastErr.meta.file ? ' (' + String(lastErr.meta.file).split('/').pop() + ':' + lastErr.meta.line + ')' : '') + '\n';
      }
      
      var waUrl = 'https://wa.me/8801765420566?text=' + encodeURIComponent(msg);
      window.open(waUrl, '_blank');
      var st = $('bugStatus');
      if (st) st.innerHTML = '<span style="color:#25D366">✓ ' + lb('Opened WhatsApp with bug report!', 'হোয়াটসঅ্যাপ চালু করা হয়েছে!') + '</span>';
    };
  }

  var copyBtn = $('bugCopy');
  if (copyBtn) {
    copyBtn.onclick = async function() {
      var act = $('bugAct') ? $('bugAct').value : 'General';
      var desc = $('bugDesc') ? $('bugDesc').value.trim() : '';
      var report = window.NcsDiag.makeReport(desc, act);
      var fullTxt = report.text + '\n\n--- JSON DATA ---\n' + JSON.stringify(report, null, 2);
      
      var success = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullTxt);
          success = true;
        }
      } catch(e){}
      if (!success) {
        try {
          var ta = document.createElement('textarea');
          ta.value = fullTxt;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          success = true;
        } catch(e){}
      }
      var st = $('bugStatus');
      if (st) {
        if (success) {
          st.innerHTML = '<span style="color:var(--acc);font-weight:600">✓ ' + lb('Full diagnostic report copied to clipboard!', 'পূর্ণ ডায়াগনস্টিক রিপোর্ট ক্লিপবোর্ডে কপি করা হয়েছে!') + '</span>';
        } else {
          st.innerHTML = '<span style="color:var(--neg)">' + lb('Could not access clipboard automatically. Please download log.', 'ক্লিপবোর্ড কপি ব্যর্থ হয়েছে। লগ ফাইল ডাউনলোড করুন।') + '</span>';
        }
      }
    };
  }

  var dlBtn = $('bugDl');
  if (dlBtn) {
    dlBtn.onclick = function() {
      var act = $('bugAct') ? $('bugAct').value : 'General';
      var desc = $('bugDesc') ? $('bugDesc').value.trim() : '';
      var report = window.NcsDiag.makeReport(desc, act);
      var filename = 'NCS_Bug_Report_' + Date.now() + '.txt';
      dlFile(filename, report.text + '\n\n--- JSON ---\n' + JSON.stringify(report, null, 2));
      var st = $('bugStatus');
      if (st) st.innerHTML = '<span style="color:var(--acc)">✓ ' + lb('Downloading bug report file...', 'লগ ফাইল ডাউনলোড হচ্ছে...') + '</span>';
    };
  }
};

var prsSettingBtn = document.createElement('button');
prsSettingBtn.className = 'more-item';
prsSettingBtn.id = 'prsSettingBtn';
prsSettingBtn.onclick = function() { if (isA()) openPresetSettings(); };

$('topR').append($('sync'));$('moreList').append($('lang'),sndBtn,secCardBtn,prsSettingBtn,bugBtn,$('set'),$('lockb'));
function updateSndBtn(){
  makeMoreItem(sndBtn, '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>', lb('Sound Effects','সাউন্ড ইফেক্ট'), S.sound ? lb('Enabled (ON)','চালু আছে') : lb('Disabled (OFF)','বন্ধ আছে'));
}
sndBtn.onclick=function(){S.sound=!S.sound;save();updateSndBtn();if(S.sound){try{Sound.test()}catch(e){}}};
secCardBtn.onclick=function(){if(isA())openCardSectionSettings()};
function updateMoreTab(){
  updateSndBtn();
  makeMoreItem(bugBtn, '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>', lb('Bug Report & Support','সহায়তা ও সমস্যা রিপোর্ট'), lb('WhatsApp support (+8801765420566)','হোয়াটসঅ্যাপ হেল্পলাইন'));
  makeMoreItem($('lang'), '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20"/></svg>', lb('Language','ভাষা পরিবর্তন'), S.lang==='bn' ? 'বাংলা (Bangla)' : 'English');
  makeMoreItem($('set'), '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', lb('System Settings','সিস্টেম সেটিংস'), lb('Sync passphrase, security & cash','সিঙ্ক, নিরাপত্তা ও পিন'));
  makeMoreItem($('lockb'), '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', lb('Lock Application','অ্যাপ লক করুন'), lb('Lock current session','সেশন লক করুন'));

  if(secCardBtn){
    secCardBtn.style.display=isA()?'':'none';
    makeMoreItem(secCardBtn, '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>', lb('Section & Cards','সেকশন ও কার্ড সমন্বয়'), lb('Dashboard section visibility','সেকশন দৃশ্যমানতা'));
  }
  if(prsSettingBtn){
    prsSettingBtn.style.display=isA()?'':'none';
    makeMoreItem(prsSettingBtn, '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', lb('Counter Presets','কাউন্টার সার্ভিস প্রিসেট'), lb('Configure 1-tap service chips','প্রিসেট চিপস কনফিগার'));
  }
  var hub=$('moreAdminHub');
  if(hub){
    if(isA()){
      hub.style.display='';
      if(typeof mgmtUI==='function')mgmtUI();
    } else {
      hub.style.display='none';
    }
  }
}

function openPresetSettings() {
  const getPrsList = () => (S.presets && Array.isArray(S.presets) && S.presets.length) ? S.presets : JSON.parse(JSON.stringify(DEFAULT_PRESETS));
  
  const showMain = () => {
    const list = getPrsList();
    const html = '<div style="max-height:55vh;overflow-y:auto;padding-right:4px">' +
      list.map((p, idx) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">${p.icon || '⚡'}</span>
            <div>
              <b style="font-size:14px">${esc(p.name)}</b> <small style="color:var(--mut)">(${esc(p.bn || p.name)})</small>
              <div style="font-size:12px;color:var(--acc);font-weight:700">${tk(p.price)} <span style="color:var(--mut);font-weight:normal">· ${esc(p.cat || 'Service')}</span></div>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="ghost" data-ep="${idx}" style="height:32px;padding:0 10px;font-size:12px">${lb('Edit', 'এডিট')}</button>
            <button type="button" class="ghost" data-dp="${idx}" style="height:32px;padding:0 8px;font-size:12px;color:var(--neg)">×</button>
          </div>
        </div>
      `).join('') +
      '</div>' +
      '<div class="oa" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="go" id="addPrsBtn">+ ' + lb('New preset', 'নতুন প্রিসেট') + '</button>' +
        '<button type="button" class="ghost" id="rstPrsBtn">' + lb('Reset defaults', 'ডিফল্ট রিসেট') + '</button>' +
      '</div>';

    ask(lb('Counter Service Presets', 'কাউন্টার সার্ভিস প্রিসেট সেটিংস'), html, () => {}, 'Close');

    const dlgBody = $('ob');
    dlgBody.onclick = (e) => {
      const editBtn = e.target.closest('[data-ep]');
      if (editBtn) {
        const idx = +editBtn.dataset.ep;
        showEdit(list[idx], idx);
        return;
      }
      const delBtn = e.target.closest('[data-dp]');
      if (delBtn) {
        const idx = +delBtn.dataset.dp;
        if (confirm(lb('Delete this preset?', 'এই প্রিসেটটি মুছে ফেলবেন?'))) {
          list.splice(idx, 1);
          S.presets = list;
          save();
          showMain();
          if (typeof renderPosPresets === 'function') renderPosPresets();
          if (typeof renderAccPresets === 'function') renderAccPresets();
        }
        return;
      }
      if (e.target.id === 'addPrsBtn') {
        showEdit(null, -1);
        return;
      }
      if (e.target.id === 'rstPrsBtn') {
        if (confirm(lb('Reset presets to default list?', 'সব প্রিসেট ডিফল্ট অবস্থায় ফিরিয়ে নেবেন?'))) {
          S.presets = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
          save();
          showMain();
          if (typeof renderPosPresets === 'function') renderPosPresets();
          if (typeof renderAccPresets === 'function') renderAccPresets();
        }
        return;
      }
    };
  };

  const showEdit = (p, idx) => {
    const isNew = idx === -1;
    const body = `
      <div class="f"><label>${lb('English Name', 'ইংরেজি নাম')}</label><input id="prsN" value="${esc(p ? p.name : '')}" required></div>
      <div class="f"><label>${lb('Bengali Name', 'বাংলা নাম')}</label><input id="prsBn" value="${esc(p ? (p.bn || '') : '')}"></div>
      <div class="f"><label>${lb('Price (৳)', 'দাম (৳)')}</label><input id="prsP" type="number" inputmode="decimal" min="0" value="${p ? p.price : 10}" required></div>
      <div class="f"><label>${lb('Category', 'ক্যাটাগরি')}</label><input id="prsC" value="${esc(p ? (p.cat || '') : '')}"></div>
      <div class="f"><label>${lb('Icon (Emoji)', 'আইকন (ইমোজি)')}</label><input id="prsI" value="${esc(p ? (p.icon || '⚡') : '⚡')}" maxlength="4"></div>
    `;
    ask(isNew ? lb('New Counter Service', 'নতুন কাউন্টার সার্ভিস') : lb('Edit Counter Service', 'কাউন্টার সার্ভিস এডিট'), body, () => {
      const nm = $('prsN').value.trim();
      const pr = +$('prsP').value || 0;
      if (!nm) return false;
      const list = getPrsList();
      const item = {
        id: p ? p.id : ('p_' + Date.now()),
        name: nm,
        bn: $('prsBn').value.trim() || nm,
        price: pr,
        cat: $('prsC').value.trim() || nm,
        icon: $('prsI').value.trim() || '⚡'
      };
      if (isNew) {
        list.push(item);
      } else {
        list[idx] = item;
      }
      S.presets = list;
      save();
      setTimeout(showMain, 50);
      if (typeof renderPosPresets === 'function') renderPosPresets();
      if (typeof renderAccPresets === 'function') renderAccPresets();
    }, isNew ? lb('Add', 'যোগ করুন') : lb('Save', 'সংরক্ষণ'));
  };

  showMain();
}
function redrawActiveView(){if(CUR==='home'){homeUI();try{applyCardSettings()}catch(e){}}else if(CUR==='pos'){POS.refresh();if(isCounterStock())POS.prodUI();}else if(CUR==='acc'){render();try{applyCardSettings()}catch(e){}}else if(CUR==='led')ledUI();else if(CUR==='more')updateMoreTab()}
function refreshCurrentView(){
  if(!U||!CUR)return;
  var svg=$('refresh').querySelector('svg');
  if(svg){svg.classList.add('spin');setTimeout(function(){svg.classList.remove('spin')},650)}
  redrawActiveView();
  if(SY())pull(true);
}
$('refresh').onclick=refreshCurrentView;
function setRefreshLabel(){var t=lb('Refresh current view','বর্তমান ট্যাব রিফ্রেশ করুন');$('refresh').title=t;$('refresh').setAttribute('aria-label',t)}

