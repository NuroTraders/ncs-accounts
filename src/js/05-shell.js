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
bugBtn.innerHTML = '<span style="display:flex;align-items:center;gap:10px"><span>🐞</span><b>' + lb('Report a Bug / Help', 'সমস্যা রিপোর্ট / সহায়তা') + '</b></span>';

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
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.08 7.41 8.84 7.67C8.61 7.93 7.96 8.54 7.96 9.77C7.96 11 8.86 12.19 9 12.37C9.14 12.55 10.8 15.11 13.34 16.21C13.94 16.47 14.41 16.63 14.77 16.74C15.38 16.94 15.93 16.91 16.37 16.85C16.86 16.77 17.88 16.23 18.09 15.63C18.3 15.03 18.3 14.52 18.23 14.41C18.17 14.3 18.02 14.24 17.8 14.13C17.58 14.02 16.5 13.49 16.3 13.41C16.09 13.34 15.94 13.3 15.79 13.52C15.64 13.74 15.22 14.24 15.09 14.38C14.96 14.53 14.83 14.55 14.61 14.44C14.39 14.33 13.68 14.1 12.83 13.34C12.17 12.75 11.73 12.02 11.6 11.8C11.47 11.58 11.59 11.46 11.7 11.35C11.8 11.25 11.92 11.09 12.04 10.96C12.15 10.82 12.19 10.72 12.26 10.57C12.33 10.42 12.3 10.29 12.24 10.18C12.19 10.07 11.74 8.97 11.56 8.52C11.38 8.08 11.2 8.14 11.06 8.14H10.63C10.46 8.14 10.18 8.21 9.95 8.47L9.53 7.34Z"/></svg>' +
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

  ask(lb('🐞 Bug Report & Help', '🐞 সমস্যা রিপোর্ট ও সহায়তা'), html, function() {
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
  if(SY())pull(true);
}
$('refresh').onclick=refreshCurrentView;
function setRefreshLabel(){var t=lb('Refresh current view','বর্তমান ট্যাব রিফ্রেশ করুন');$('refresh').title=t;$('refresh').setAttribute('aria-label',t)}

