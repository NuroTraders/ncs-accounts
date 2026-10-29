function mgmtUI(){
  if(!isA())return;
  var v=$('moreAdminHub')||$('vMore');
  var B=function(k,l,d,iconSvg){
    return '<button type="button" class="more-item" data-m="'+k+'">' +
      '<div class="more-item-left"><span class="more-item-icon">'+iconSvg+'</span><div class="more-item-text"><b>'+l+'</b><small>'+d+'</small></div></div>' +
      '<span class="more-item-arrow">›</span></button>';
  };
  var sc=st==='ok'?'ok':st==='pend'?'pend':(st==='offl'||st==='conf')?'bad':'off';

  var icStaff='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var icRep='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
  var icRev='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  var icWlt='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="15" r="1.5"/></svg>';
  var icLog='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
  var icVer='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var icTest='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
  var icReboot='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>';

  var rqN = reviewQueueCount();
  v.innerHTML =
    '<div class="card more-card"><h3 class="more-sec-title">'+lb('Staff & Operations','কর্মী ও প্রশাসন')+'</h3><div class="more-grid">' +
    B('staff', lb('Staff and roles','কর্মী ও ভূমিকা'), lb('Add staff, roles & PINs','কর্মী যোগ ও অনুমতি'), icStaff) +
    B('reports', lb('Reports Hub','রিপোর্ট হাব'), lb('Statements, day/week/month & CSV','স্টেটমেন্ট ও রিপোর্ট'), icRep) +
    B('reviewq', lb('Review Queue','রিভিউ কিউ') + (rqN ? ' ('+rqN+')' : ''), lb('Reconciliation, stock & voids','যাচাই ও অনুমোদন'), icRev) +
    '</div></div>' +
    '<div class="card more-card"><h3 class="more-sec-title">'+lb('System, Audit & Security','সিস্টেম, অডিট ও লগ')+'</h3><div class="more-grid">' +
    B('wlt', lb('Wallet Openings History','ওয়ালেট শুরুর ইতিহাস'), lb('Date-anchored openings','তারিখভিত্তিক ওপেনিং'), icWlt) +
    B('log', lb('Change Log','পরিবর্তন লগ'), lb('Audit trail of changes','কে কী কখন বদলেছে'), icLog) +
    B('ver', lb('Version History','সংস্করণ ইতিহাস'), 'v' + APP_VERSION, icVer) +
    B('selftest', lb('Run Self-Test','সেলফ টেস্ট'), lb('Check arithmetic & storage','হিসাব ও স্টোরেজ পরীক্ষা'), icTest) +
    B('reboot', lb('Force Logout All','সবাইকে লগআউট'), lb('Invalidate active sessions','সেশন বাতিল করুন'), icReboot) +
    '</div>' +
    '<div class="mut" style="margin-top:12px;font-size:12.5px;display:flex;align-items:center;gap:8px"><i class="sdot '+sc+'" aria-hidden="true"></i>' +
    (SY()?lb('Synced','সিঙ্ক হয়েছে'):lb('Off','বন্ধ'))+' · '+lb('Staff','কর্মী')+': '+(S.users&&S.users.staff?S.users.staff.length:0)+' · '+lb('Products','পণ্য')+': '+S.products.filter(function(p){return!p.del}).length+' · '+lb('Parties','পক্ষ')+': '+S.cust.filter(function(c){return!c.del}).length +
    '</div></div>';
}
function reviewQueueCount(){
  var p=(S.pending||[]).filter(function(x){return x.state==='pending'}).length;
  var s=S.moves.filter(function(x){return x.adminCheck&&!x.adminChecked&&!x.adminRejected}).length;
  var f=S.ltx.filter(function(t){return !t.void&&t.flag&&t.flag.state==='pending'}).length;
  var e=S.ltx.filter(function(t){return !t.void&&t.prop&&t.prop.state==='pending'}).length;
  var v=S.ltx.filter(function(t){return !t.void&&t.voidReq&&t.voidReq.state==='pending'}).length;
  return p+s+f+e+v;
}
function reviewQueue(){
  if(!isA())return;
  var P=(S.pending||[]).filter(function(x){return x.state==='pending'});
  var W=P.filter(function(x){return x.type==='wallet-collision'});
  var P_other=P.filter(function(x){return x.type!=='wallet-collision'});
  var M=S.moves.filter(function(x){return x.adminCheck&&!x.adminChecked&&!x.adminRejected});
  var F=S.ltx.filter(function(t){return !t.void&&t.flag&&t.flag.state==='pending'});
  var E=S.ltx.filter(function(t){return !t.void&&t.prop&&t.prop.state==='pending'});
  var V=S.ltx.filter(function(t){return !t.void&&t.voidReq&&t.voidReq.state==='pending'});
  var total=P.length+M.length+F.length+E.length+V.length;
  var sec=function(label,items){return items.length?'<h4 style="margin:12px 0 6px;font-size:13.5px;color:var(--mut);font-weight:600">'+label+' ('+items.length+')</h4>'+items:''};
  var html=
    sec(lb('Wallet collision / Deficits','ওয়ালেট ঘাটতি ও অসংগতি'), W.map(function(x){
      var open=(x.details&&x.details.entry)?'<button class="ghost pbtn" data-rq-open="'+x.id+'">'+lb('Open','দেখুন')+'</button> ':'';
      return '<div class="prow"><span><b>'+esc(x.details.walletName||wN(x.details.wallet)||'Wallet')+'</b> · '+esc(x.reason)+'<small class="mut" style="display:block">Entry #'+x.details.entry+' · '+esc(x.details.desc||'')+' · '+tk(x.details.amt||0)+' ('+sd(x.details.date||'')+')</small></span><span>'+open+'<button class="ghost pbtn" data-pr="'+x.id+'">'+lb('Checked','গৃহীত')+'</button></span></div>';
    }).join(''))
    +sec('Reconciliation', P_other.map(function(x){var open=(x.details&&(x.details.entry||x.details.customer||x.details.ledger))?'<button class="ghost pbtn" data-rq-open="'+x.id+'">Open</button> ':'';return '<div class="prow"><span>'+esc(x.type)+' · '+esc(x.reason)+'<small class="mut" style="display:block">'+esc(JSON.stringify(x.details||{}))+'</small></span><span>'+open+'<button class="ghost pbtn" data-pr="'+x.id+'">Checked</button></span></div>'}).join(''))
    +sec('Stock overrides', M.map(function(x){var cur=POS.stock(x.pid),tg=Number.isFinite(Number(x.target))?Number(x.target):cur+(+x.q||0);return '<div class="prow"><span>Stock · '+esc(((S.products||[]).find(function(p){return p.id===x.pid})||{}).name||'Product')+' · '+n(cur)+' → '+n(tg)+' · '+esc(x.reason||'')+'</span><span><button class="ghost pbtn" data-sm="'+x.id+'">Approve</button> <button class="ghost pbtn" data-sr="'+x.id+'">Reject</button></span></div>'}).join(''))
    +sec('Cashier flags', F.map(function(t){return '<div class="prow"><span>'+esc(cN(t.c))+' · '+tk(t.amt)+' · '+dr(t)+'<small class="mut" style="display:block">'+esc(t.flag.reason||'')+' · '+esc(t.flag.by||'')+'</small></span><span><button class="ghost pbtn" data-rq-flag="'+t.id+'">Open</button> <button class="ghost pbtn" data-fc="'+t.id+'">Checked</button> <button class="ghost pbtn" data-fr="'+t.id+'">Reject</button></span></div>'}).join(''))
    +sec('Edit proposals', E.map(function(t){return '<div class="prow"><span>'+esc(cN(t.c))+' · '+tk(t.amt)+' · '+dr(t)+'<small class="mut" style="display:block">'+esc(t.prop.reason||'')+' · '+esc(t.prop.by||'')+'</small></span><span><button class="ghost pbtn" data-rq-prop="'+t.id+'">Review</button></span></div>'}).join(''))
    +sec('Void requests', V.map(function(t){return '<div class="prow"><span>'+esc(cN(t.c))+' · '+tk(t.amt)+' · '+dr(t)+'<small class="mut" style="display:block">'+esc(t.voidReq.reason||'')+' · '+esc(t.voidReq.by||'')+'</small></span><span><button class="ghost pbtn" data-rq-void="'+t.id+'">Review</button></span></div>'}).join(''))
    +(total?'':'<div class="empty">No pending items</div>');
  ask('Admin review queue'+(total?' ('+total+')':''),html,function(){},'Close',1);
  $('ob').onclick=function(e){
    var b;
    if(b=e.target.closest('[data-pr]')){var q=P.find(function(x){return x.id==b.dataset.pr});if(q){q.state='checked';q.checkedBy=U.name;save();reviewQueue()}return}
    if(b=e.target.closest('[data-sm]')){var z=S.moves.find(function(x){return x.id==b.dataset.sm});if(z){var cs=POS.stock(z.pid),tg=Number.isFinite(Number(z.target))?Number(z.target):cs+(+z.q||0);z.target=tg;z.old=cs;z.q=tg-cs;z.adminChecked=1;z.checkedBy=U.name;z.checkedAt=Date.now();lg('Approve stock override',((S.products||[]).find(function(p){return p.id===z.pid})||{}).name+' · '+cs+' → '+tg);save();POS.prodUI();reviewQueue()}return}
    if(b=e.target.closest('[data-sr]')){var z=S.moves.find(function(x){return x.id==b.dataset.sr});if(z){z.adminRejected=1;z.adminRejectedBy=U.name;z.adminRejectedAt=Date.now();lg('Reject stock override',((S.products||[]).find(function(p){return p.id===z.pid})||{}).name+' · '+(z.reason||''));save();POS.prodUI();reviewQueue()}return}
    if(b=e.target.closest('[data-fc]')){$('ov').hidden=true;var t=S.ltx.find(function(x){return x.id==b.dataset.fc});if(t)ledFlagClear(t.id);return}
    if(b=e.target.closest('[data-fr]')){$('ov').hidden=true;var t=S.ltx.find(function(x){return x.id==b.dataset.fr});if(t)ledFlagReject(t.id);return}
    if(b=e.target.closest('[data-rq-flag]')){$('ov').hidden=true;var t=S.ltx.find(function(x){return x.id==b.dataset.rqFlag});if(t){LC=t.c;LT='led';go('led');setTimeout(function(){ledTx(t.id)},50)}return}
    if(b=e.target.closest('[data-rq-prop]')){$('ov').hidden=true;ledPropReview(b.dataset.rqProp);return}
    if(b=e.target.closest('[data-rq-void]')){$('ov').hidden=true;ledVoidReqReview(b.dataset.rqVoid);return}
    if(b=e.target.closest('[data-rq-open]')){$('ov').hidden=true;var q=P.find(function(x){return x.id==b.dataset.rqOpen});
      if(q&&q.details){
        if(q.details.entry){var en=S.entries.find(function(en){return en.id===q.details.entry});if(en){go('acc');cur=en.d;reset();render();return}}
        if(q.details.customer){LC=q.details.customer;go('led');return}
        if(q.details.ledger){var t=S.ltx.find(function(x){return x.id===q.details.ledger});if(t){LC=t.c;LT='led';go('led');setTimeout(function(){ledTx(t.id)},50);return}}
      }return}
  };
}
function rebootAsk(){ask(lb('Force logout all?','সবাইকে লগআউট করবেন?'),'<p>'+lb('Everyone, including you, will have to log in again.','সবাইকে লগইন করতে হবে।')+'</p>',async function(){S.rebootN=(S.rebootN||0)+1;S.rebootAt=Date.now();lg('Force logout all','By '+U.name);save();try{await push()}catch(e){}lock()},lb('Force logout','লগআউট করুন'))}
(function(){
  document.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;var k=b.dataset.m;
    if(k==='staff')staffUI();else if(k==='set')$('set').onclick();else if(k==='reports')$('rpb').onclick();else if(k==='log')showChangeLog();else if(k==='ver')verUI();else if(k==='reboot')rebootAsk();else if(k==='wlt')openWltSettings();else if(k==='reviewq')reviewQueue();else if(k==='selftest')selfTest();});
  document.addEventListener('click',function(e){if(e.target.closest('[data-m]'))return;var h=e.target.closest('[data-bt]');if(!h)return;var c=h.closest('.bcd'),o=c.classList.toggle('on');h.setAttribute('aria-expanded',o)});
  if(window.matchMedia&&matchMedia('(hover:hover)').matches){document.addEventListener('mouseover',function(e){var c=e.target.closest('.bcd');if(c)c.classList.add('pv')});document.addEventListener('mouseout',function(e){var c=e.target.closest('.bcd');if(c&&!c.contains(e.relatedTarget))c.classList.remove('pv')})}
  setInterval(function(){if(U&&(S.rebootN||0)>(LRN||0))lock()},4000);
  $('cashp').addEventListener('click',function(e){if(e.target.closest('[data-cadj]'))cashAdjust();if(e.target.closest('[data-chist]'))cashCountHistory();if(e.target.closest('[data-discq]'))POS.bills()});
})();
function cashBook(){var a=sorted().filter(function(e){return!e.void}),m=calc();return a.length?m[a[a.length-1].id].bal:(+S.start||0)}
function nextOpenDay(){var x=new Date(),d=iso(x);while(S.days[d]&&S.days[d].closed){x.setDate(x.getDate()+1);d=iso(x)}return d}
function cashAdjust(){
  try{
  if(!(isA()||role()==='accountant'))return;
  var today=iso(new Date()),td=nextOpenDay(),book=cashBook(),isPastTarget=(td<today);
  var buildForm='<div class="ct" style="margin:0 0 10px"><span>'+lb('Cash in book','খাতায় নগদ')+'</span><b>'+tk(book)+'</b></div>'+(td!==today?'<p class="mut" style="font-size:13px">'+lb('Today is closed, so this adjustment is posted to ','আজ বন্ধ, সমন্বয় যাবে ')+sd(td)+'.</p>':'')+'<div class="cc">'+DEN.map(function(d){return'<label>৳'+d+'</label><input type="number" min="0" inputmode="numeric" data-d="'+d+'" placeholder="0"><b>0</b>'}).join('')+'</div><div class="ct"><span>'+lb('Counted','গণনা')+'</span><b id="ctt">৳0</b></div><div class="ct"><span>'+lb('Difference','পার্থক্য')+'</span><b id="cdf">–</b></div><div class="f" style="margin-top:12px"><label>'+lb('Reason','কারণ')+'</label><select id="car"><option value="Extra cash">'+lb('Extra cash','অতিরিক্ত নগদ')+'</option><option value="Cash short">'+lb('Cash short','নগদ কম')+'</option><option value="Other">'+lb('Other','অন্যান্য')+'</option></select></div>';
  ask(lb('Adjust actual cash','প্রকৃত নগদ সমন্বয়'),buildForm,function(){
    var c=cct(),df=c-book;if(!df){ltoast(lb('No difference to adjust','পার্থক্য নেই'));return false}
    var cn={};DEN.forEach(function(d){var q=+(($('ob').querySelector('[data-d="'+d+'"]')||{}).value)||0;if(q)cn[d]=q});
    var reason=$('car').value;
    var finish=function(pinBy){
      snap();
      var nowTs=Date.now(),tStr=nowT();
      S.entries.push({id:nowTs,d:td,t:tStr,type:'Adjustment',desc:'Cash adjustment · '+reason+' (counted)'+(pinBy?' · PIN':''),cat:'',pay:'Cash',amt:df,act:c,adj:1,cnt:cn,by:U.name,pinBy:pinBy||'',pinAt:pinBy?nowTs:0});
      S.counts=S.counts||[];
      S.counts.unshift({id:nowTs,d:td,t:tStr,at:nowTs,by:U.name,total:c,book:book,diff:df,reason:reason,den:cn,pinBy:pinBy||''});
      S.counts=S.counts.slice(0,500);
      lg('Cash adjust',(df>0?'+':'')+df+' · counted '+c+(pinBy?' · PIN':''));
      save();cur=td;reset();render();ltoast(lb('Cash adjusted','নগদ সমন্বয় হয়েছে'))
    };
    if(isPastTarget){
      setTimeout(function(){
        ask(lb('Admin PIN required','অ্যাডমিন পিন প্রয়োজন'),'<p class="mut">'+lb('You are adjusting for a past date.','আপনি আগের তারিখের সমন্বয় করছেন।')+'</p><div class="f"><label>Admin PIN</label><input id="cad_pin" type="password" inputmode="numeric" autocomplete="off"></div>',async function(){if(!(await ck(S.users.admin,$('cad_pin').value))){$('cad_pin').value='';$('cad_pin').placeholder=lb('Wrong PIN','ভুল পিন');return false}finish(U.name)},lb('Confirm','নিশ্চিত'));$('cad_pin').focus();
      },50);
      return;
    }
    finish('');
  },lb('Adjust','সমন্বয়'),1);
  $('ob').oninput=function(){var df=cct()-book;$('cdf').textContent=cct()?(df>0?'+':'')+n(df):'–';$('cdf').className=df>0?'pos':df<0?'neg':''}
  }catch(e){ltoast('Cash adjust error: '+e.message)}}
function ledArch(){var a=S.cust.filter(function(c){return c.del});return a.length?'<div class="lcg">'+a.map(function(c){return'<div class="card" style="display:flex;align-items:center;gap:12px;padding:14px">'+lAv(c,'lav')+'<div class="lci"><b>'+esc(c.name)+'</b><small>'+lb('Archived by','আর্কাইভ করেছেন')+' '+esc(c.dby||'?')+' · '+esc(c.delReason||'')+' · '+tk(lStat(c).b)+'</small></div><button class="ghost" data-a="crestore" data-id="'+c.id+'">'+lb('Restore','ফিরান')+'</button></div>'}).join('')+'</div>':'<div class="card"><div class="empty">'+lb('Archive is empty','আর্কাইভ খালি')+'</div></div>'}
function ledDel(id){var c=S.cust.find(function(x){return x.id===id});if(!c||!isA())return;ask('Archive party','<p>Open balance and all ledger entries will be retained. Only an Admin can restore.</p><div class="f"><label>Reason (required)</label><input id="arcReason" maxlength="160"></div>',function(){var why=$('arcReason').value.trim();if(!why)return false;c.del=1;c.dby=U.name;c.dts=Date.now();c.delReason=why;lg('Archive party',c.name+' — '+why+' · balance '+lStat(c).b);if(LC===id)LC=null;save();ledUI()},'Archive')}
function ledRestore(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||t.src||ledRestoreBlocked(t))return;
  if(S.ltx.some(function(x){return x.fix===id&&!x.void})){ltoast(lb('Already replaced by a correction.','সংশোধিত এন্ট্রি আছে।'));return}
  t.void=0;t.vr='';t.vb='';lg('Ledger restore',cname()+' · '+tk(t.amt));save();ledUI()}
function ledVoidTab(all){var V=all.filter(function(x){return x.void});
  return'<div class="card scroll"><table class="ltb"><thead><tr><th>'+lb('Date','তারিখ')+'</th><th>'+lb('Details','বিবরণ')+'</th><th>'+lb('Amount','টাকা')+'</th><th>'+lb('Reason','কারণ')+'</th><th></th></tr></thead><tbody>'+
  (V.length?V.map(function(x){return'<tr><td>'+dr(x)+(x.t?'<small style="display:block;color:var(--mut);font-size:12px">'+t12(x.t)+'</small>':'')+'</td><td class="d">'+(x.dir==='in'?'পেলাম':'দিলাম')+' · '+esc(x.who||'')+'<small>'+esc(mL(x.m))+' · '+lb('By','এন্ট্রি')+' '+esc(x.by||'?')+'</small></td><td class="'+(x.dir==='in'?'pos':'neg')+'">'+n(x.amt)+'</td><td class="d">'+esc(x.vr||'')+'<small>'+esc(x.vb||'')+'</small></td><td>'+(isA()&&!x.src?'<button class="ghost" data-a="restore" data-id="'+x.id+'">'+lb('Restore','ফিরান')+'</button>':'')+'</td></tr>'}).join(''):'<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--mut)">'+lb('No void entries','কোনো বাতিল এন্ট্রি নেই')+'</td></tr>')+'</tbody></table></div>'}
function mN(m){return(m==='bKash'||m==='Bkash')?'Bkash Personal':m}
function mL(m){return m==='Due sale'?lb('Due sale','বাকি বিক্রি'):mN(m)}

/* ---------- wallets (manual balance sheet) ---------- */
if(!S.wallets)S.wallets={};
/* S.wManual stores manually-set balances per wallet key.
   These are the SINGLE SOURCE OF TRUTH displayed on wallet cards.
   They are not computed from transactions — admin sets them directly. */
if(!S.wManual)S.wManual={};
function wN(k){return lb(WLT[k],WLT_BN[k])}
function wOpen(k){return+((S.wallets||{})[k])||0}
/* Manual balance: always read from S.wManual[k], fallback to 0 */
function wManBal(k){return r2(+(S.wManual&&S.wManual[k]!=null?S.wManual[k]:0))}
/* calcWallets: return manual balances for all wallets */
function calcWallets(){var b={};Object.keys(WLT).forEach(function(k){b[k]=wManBal(k)});return b}
function wOpenAt(k,d){var anchors=(S.walletDates||[]).filter(function(a){return a.d<=d}).sort(function(a,b){return a.d.localeCompare(b.d)});if(!anchors.length)return wOpen(k);var last=anchors[anchors.length-1];if(last[k]!=null)return+last[k]||0;return wOpen(k)}
function wltEff(e){if(e.void||e.removed)return null;var m=WLTC[e.type];if(m&&m[e.cat])return{w:m[e.cat],d:e.type==='Purchase'?1:-1};if(e.type==='Ledger')return(e.w&&WLT[e.w])?{w:e.w,d:e.ld==='in'?1:-1}:null;if(e.type==='Sale'&&e.pay==='Mobile Banking'&&e.w&&WLT[e.w])return{w:e.w,d:1};return null}
function wltRun(extra,ex,only){
  var L=S.entries.filter(function(e){return e.id!==ex&&wltEff(e)});if(extra)L.push(extra);
  L.sort(function(a,b){var x=(a.d||'')+(a.t||''),y=(b.d||'')+(b.t||'');return x<y?-1:x>y?1:a.id-b.id});
  var b={},bad=null;Object.keys(WLT).forEach(function(k){b[k]=wOpen(k)});
  var anchors=(S.walletDates||[]).slice().sort(function(a,c){return a.d.localeCompare(c.d)}),ai=0;
  L.forEach(function(e){var d=e.d||'';while(ai<anchors.length&&anchors[ai].d<=d){var a=anchors[ai];Object.keys(WLT).forEach(function(k){if(a[k]!=null)b[k]=+a[k]||0});ai++}
    var f=wltEff(e);if(!f)return;b[f.w]=r2(b[f.w]+f.d*(+e.amt||0));if(b[f.w]<0&&!bad&&(!only||only.indexOf(f.w)>=0))bad={w:f.w,bal:b[f.w]}});
  while(ai<anchors.length){var a=anchors[ai];Object.keys(WLT).forEach(function(k){if(a[k]!=null)b[k]=+a[k]||0});ai++}
  return{b:b,bad:bad}}
function checkWalletLimit(extra,ex,only){var r=wltRun(extra,ex,only);return r.bad?{ok:false,wallet:WLT[r.bad.w],bal:r.bad.bal}:{ok:true}}
function wltVoidBlocked(e){var f=wltEff(e);if(!f||f.d<0)return false;var r=checkWalletLimit(null,e.id,[f.w]);if(r.ok)return false;ltoast(lb('Cannot void: later entries would take ','বাতিল হবে না: ')+(r.wallet||'')+lb(' below zero.',' ঋণাত্মক হবে।'));return true}
function wltForm(){var ty=$('fy').value,wc=!!(WLTC[ty]&&WLTC[ty][$('fc').value]);
  if(wc){$('fp').value='Cash';$('fp').disabled=true}else $('fp').disabled=!(ty==='Sale'||ty==='Purchase');
  $('fwb').hidden=!(ty==='Sale'&&$('fp').value==='Mobile Banking'&&!wc)}
function renderWalletCards(){
  var b=calcWallets(),mk=function(k){return'<div class="wlt-item'+(b[k]<0?' neg':'')+'" data-w="'+k+'"><div class="wname">'+esc(wN(k))+'</div><div class="wbal">'+tk(b[k])+'</div></div>'},
  sum=function(a){return a.reduce(function(s,k){return s+b[k]},0)},
  h='<div class="wlt-card"><div class="wlt-title"><span>'+lb('Mobile financial services','মোবাইল ফিন্যান্সিয়াল সার্ভিস')+(isA()?' <button type="button" class="lnk adj" style="font-size:12px;font-weight:600;padding:0 4px" data-wadj="mfs">'+lb('Adjust','সমন্বয়')+'</button>':'')+'</span><b>'+tk(sum(WLT_MFS))+'</b></div><div class="wlt-grid">'+WLT_MFS.map(mk).join('')+'</div></div><div class="wlt-card"><div class="wlt-title"><span>'+lb('Recharge balances','রিচার্জ ব্যালেন্স')+(isA()?' <button type="button" class="lnk adj" style="font-size:12px;font-weight:600;padding:0 4px" data-wadj="rcr">'+lb('Adjust','সমন্বয়')+'</button>':'')+'</span><b>'+tk(sum(WLT_RCR))+'</b></div><div class="wlt-grid wlt-grid-3">'+WLT_RCR.map(mk).join('')+'</div></div>';
  ['wltWrap','wltWrapH'].forEach(function(id){var el=$(id);if(el)el.innerHTML=h})}
function wltRows(key,lim){
  var L=sorted().filter(function(e){var f=wltEff(e);return f&&f.w===key}).reverse();if(lim)L=L.slice(0,lim);
  return L.map(function(e){var f=wltEff(e),sg=f.d>0?'+':'−';return{d:sd(e.d)+' '+(e.t?t12(e.t):''),c:(e.cat==='POS'||e.type==='Ledger')?(e.desc||'POS').slice(0,40):e.cat,a:sg+n(e.amt),p:f.d>0}})}
function showWltDetail(key){
  var b=calcWallets(),rows=wltRows(key,0).map(function(r){return'<tr><td>'+esc(r.d)+'</td><td class="d">'+esc(r.c)+'</td><td class="'+(r.p?'pos':'neg')+'">'+r.a+'</td></tr>'}).join('');
  ldlg(wN(key),'<div style="text-align:center;margin-bottom:12px"><div class="mut">'+lb('Current balance','বর্তমান ব্যালেন্স')+'</div><div style="font-size:24px;font-weight:700">'+tk(b[key])+'</div><div class="mut" style="font-size:12.5px">'+lb('Base opening','বেস ওপেনিং')+' '+tk(wOpen(key))+'</div>'+(isA()?'<div style="margin-top:6px"><button type="button" class="ghost" style="height:30px;font-size:12px" id="wltAdjBtn" data-k="'+key+'">'+lb('Adjust this wallet','এই ওয়ালেট সমন্বয় করুন')+'</button></div>':'')+'</div><div class="scroll" style="max-height:46vh;overflow:auto"><table class="ltb" style="min-width:0"><thead><tr><th>'+lb('Date','তারিখ')+'</th><th>'+lb('Category','ক্যাটাগরি')+'</th><th>'+lb('Amount','টাকা')+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--mut)">'+lb('No transactions','কোনো লেনদেন নেই')+'</td></tr>')+'</tbody></table></div>',function(){},lb('Close','বন্ধ'),1)}
function adjustSingleWallet(targetKey){
  if(!isA())return;
  if(!S.wManual)S.wManual={};
  var curr=wManBal(targetKey);
  ask(lb('Set balance: ','ব্যালেন্স নির্ধারণ: ')+wN(targetKey),
    '<div class="f"><label>'+lb('Current balance','বর্তমান ব্যালেন্স')+'</label>'
    +'<input type="text" readonly value="'+tk(curr)+'" style="font-weight:600"></div>'
    +'<div class="f"><label>'+lb('New balance','নতুন ব্যালেন্স')+'</label>'
    +'<input id="swa_v" type="number" inputmode="decimal" min="0" step="any" value="'+curr+'" required></div>'
    +'<div class="f"><label>'+lb('Reason (required)','কারণ (আবশ্যক)')+'</label>'
    +'<input id="swa_r" maxlength="120" placeholder="'+lb('e.g. counted actual balance','যেমন: গণনা করে প্রকৃত ব্যালেন্স')+'" autocomplete="off"></div>'
    +'<button type="button" class="ghost" id="swa_zero" style="margin-top:4px;color:var(--neg);font-size:12px;height:28px">🔴 '+lb('Reset to zero','শূন্যে রিসেট করুন')+'</button>'
    ,function(){
      var r=$('swa_r').value.trim(),nv=+$('swa_v').value;
      if(!r||isNaN(nv)||nv<0){if(!r)$('swa_r').style.borderColor='var(--neg)';return false}
      S.wManual[targetKey]=r2(nv);
      lg('Wallet set (manual)',wN(targetKey)+' → '+tk(nv)+' · '+r);
      save();
      renderWalletCards();
      if(CUR==='acc')render();
      ltoast(lb('Balance saved','ব্যালেন্স সংরক্ষিত')+': '+wN(targetKey)+' = '+tk(nv));
    },lb('Save','সংরক্ষণ'),1);
  /* Reset to zero button */
  setTimeout(function(){
    var z=$('swa_zero');
    if(z)z.onclick=function(){
      if(!confirm(lb('Reset ','রিসেট করবেন? ')+wN(targetKey)+lb(' to zero?',' শূন্যে?')))return;
      S.wManual[targetKey]=0;
      lg('Wallet reset to zero',wN(targetKey));
      save();
      renderWalletCards();
      if(CUR==='acc')render();
      ltoast(lb('Reset to zero','শূন্যে রিসেট')+': '+wN(targetKey));
      var ov=$('ov');if(ov)ov.hidden=true;
    };
  },50);
}

function cashCountHistory(){
  var list=S.counts||[];
  var h='<div class="mut" style="font-size:12.5px;margin-bottom:8px">'+lb('History of counted cash and currency note breakdowns.','প্রতিটি নগদ গণনার হিসাব ও নোটের বিস্তারিত ইতিহাস।')+'</div>';
  if(!list.length){
    h+='<div class="empty">'+lb('No cash counts recorded yet','এখনো কোনো নগদ গণনা সংরক্ষিত নেই')+'</div>';
  } else {
    h+='<div style="max-height:56vh;overflow:auto;display:grid;gap:8px">';
    list.slice(0,100).forEach(function(item){
      var denTxt=item.den?DEN.filter(function(d){return item.den[d]}).map(function(d){return '৳'+d+'×'+item.den[d]}).join('  '):'';
      var df=item.diff!=null?item.diff:(item.total-item.book);
      var dfClass=df>0?'pos':df<0?'neg':'zero';
      h+='<div class="card" style="padding:10px 12px;margin:0;font-size:13px;border-left:4px solid var(--acc)">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;font-weight:600">'
        +'<span>'+sd(item.d||'')+(item.t?' '+t12(item.t):'')+' · '+esc(item.by||'?')+'</span>'
        +'<b style="font-size:15px">'+tk(item.total||0)+'</b>'
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;color:var(--mut);font-size:12px;margin-top:2px">'
        +'<span>'+lb('Book: ','খাতায়: ')+tk(item.book||0)+' · '+lb('Diff: ','পার্থক্য: ')+'<span class="'+dfClass+'">'+dif(df)+'</span></span>'
        +(item.pinBy?'<span class="warn">PIN: '+esc(item.pinBy)+'</span>':'')
        +'</div>'
        +(item.reason?'<div class="mut" style="font-size:12px;margin-top:2px">'+lb('Reason: ','কারণ: ')+esc(item.reason)+'</div>':'')
        +(denTxt?'<div style="margin-top:4px;padding:4px 6px;background:var(--soft);border-radius:6px;font-family:monospace;font-size:11.5px">'+esc(denTxt)+'</div>':'')
        +'</div>';
    });
    h+='</div>';
  }
  ask(lb('Cash Count & Denominations History','নগদ গণনা ও নোটের ইতিহাস'),h,function(){},lb('Close','বন্ধ'),1);
}

function openWltSettings(){
  if(!isA())return;
  var hist=(S.walletDates||[]).slice().sort(function(a,b){return b.d.localeCompare(a.d)});
  var histHTML=hist.length?hist.map(function(a){
    var disc=Object.keys(a.discrepancy||{}).filter(function(k){return Math.abs(a.discrepancy[k])>0.5});
    var discTxt=disc.length?'<div class="waDisc">'+lb('Differs from running balance: ','চলমান ব্যালেন্সের সাথে পার্থক্য: ')+disc.map(function(k){return wN(k)+' '+dif(a.discrepancy[k])}).join(', ')+'</div>':'';
    return '<div class="waRow'+(disc.length?' disc':'')+'"><b class="d">'+sd(a.d)+'</b><small>'+lb('Set by','সেট করেছেন')+': '+esc(a.by||'?')+(a.reason?' · '+esc(a.reason):'')+(a.pinBy?' · PIN: '+esc(a.pinBy):'')+'</small><div class="waGrid">'+Object.keys(WLT).map(function(k){return'<span>'+esc(wN(k))+' <b>'+tk(a[k]||0)+'</b></span>'}).join('')+'</div>'+discTxt+'</div>';
  }).join(''):'<div class="empty" style="padding:16px">'+lb('No dated openings yet','এখনো কোনো তারিখভিত্তিক ওপেনিং নেই')+'</div>';
  ask(lb('Wallet opening history','ওয়ালেট শুরুর ইতিহাস'),
    '<div class="mut" style="font-size:12.5px;margin-bottom:8px">'+lb('Balances reset at each date shown. Setting a past date requires Admin PIN. If your amount differs from the carried-forward balance, it is recorded as a discrepancy.','প্রতিটি তারিখে ব্যালেন্স রিসেট হয়। আগের তারিখে অ্যাডমিন পিন লাগবে। আপনার পরিমাণ যদি চলমান ব্যালেন্সের সাথে না মেলে, তাহলে পার্থক্য হিসেবে সংরক্ষিত হবে।')+'</div>'
    +'<div class="waList">'+histHTML+'</div>'
    +'<button class="ghost" id="waAdd" style="margin-top:10px">+ '+lb('Add dated opening','তারিখভিত্তিক ওপেনিং যোগ করুন')+'</button>'
    ,function(){},lb('Close','বন্ধ'),1);
  $('ob').onclick=function(e){
    if(e.target.id==='waAdd'){$('ov').hidden=true;setTimeout(function(){walletAdjust();},50)}
    var wb=e.target.closest('#wltAdjBtn');
    if(wb){$('ov').hidden=true;setTimeout(function(){adjustSingleWallet(wb.dataset.k);},50)}
  };
  $('ob').onchange=null;$('ob').oninput=null;
}
function balanceAtDate(d){
  var bal={};Object.keys(WLT).forEach(function(k){bal[k]=wOpen(k)});
  var anchors=(S.walletDates||[]).filter(function(a){return a.d<=d}).sort(function(a,b){return a.d.localeCompare(b.d)}),ai=0;
  sorted().forEach(function(e){if(e.void||e.removed)return;if((e.d||'')>d)return;
    while(ai<anchors.length&&anchors[ai].d<=e.d){var a=anchors[ai];Object.keys(WLT).forEach(function(k){if(a[k]!=null)bal[k]=+a[k]||0});ai++}
    var f=wltEff(e);if(!f)return;bal[f.w]+=f.d*(+e.amt||0)});
  while(ai<anchors.length){var a=anchors[ai];Object.keys(WLT).forEach(function(k){if(a[k]!=null)bal[k]=+a[k]||0});ai++}
  return bal;
}
function walletAdjust(){
  if(!isA())return;
  if(!S.wManual)S.wManual={};
  var h='<div class="mut" style="font-size:12.5px;margin-bottom:10px">'+lb('Set the actual balance for each wallet. These values are stored directly and displayed as-is.','প্রতিটি ওয়ালেটের প্রকৃত ব্যালেন্স সরাসরি এখানে লিখুন।')+'</div>'
    +'<div class="f"><label>'+lb('Reason (required)','কারণ (আবশ্যক)')+'</label><input id="wa_r" maxlength="120" autocomplete="off"></div>'
    +Object.keys(WLT).map(function(k){return'<div class="f"><label>'+esc(wN(k))+'</label><input class="wa-k" data-k="'+k+'" type="number" inputmode="decimal" min="0" step="any" value="'+wManBal(k)+'"></div>'}).join('');
  ask(lb('Set all wallet balances','সব ওয়ালেট ব্যালেন্স নির্ধারণ'),h,function(){
    var r=$('wa_r').value.trim();
    if(!r){$('wa_r').style.borderColor='var(--neg)';return false}
    var changed=[];
    document.querySelectorAll('.wa-k').forEach(function(i){
      var k=i.dataset.k,nv=r2(Math.max(0,+i.value||0));
      if(nv!==wManBal(k))changed.push(wN(k)+': '+tk(wManBal(k))+'→'+tk(nv));
      S.wManual[k]=nv;
    });
    lg('Wallet balances set (manual)',r+(changed.length?' · '+changed.join(', '):''));
    save();
    renderWalletCards();
    if(CUR==='acc')render();
    ltoast(lb('All wallet balances saved','সব ওয়ালেট ব্যালেন্স সংরক্ষিত'));
  },lb('Save','সংরক্ষণ'),1);
}
async function askPinForWallet(d,r,vals){
  ask(lb('Admin PIN required','অ্যাডমিন পিন প্রয়োজন'),
    '<p class="mut">'+lb('You are adding an opening for a past date.','আপনি আগের তারিখের ওপেনিং যোগ করছেন।')+'</p>'
    +'<div class="f"><label>Admin PIN</label><input id="wa_pin" type="password" inputmode="numeric" autocomplete="off"></div>'
    ,async function(){
      if(!(await ck(S.users.admin,$('wa_pin').value))){$('wa_pin').value='';$('wa_pin').placeholder=lb('Wrong PIN','ভুল পিন');return false}
      doSaveWalletOpening(d,r,vals,U.name);
    },lb('Confirm','নিশ্চিত'));
  $('wa_pin').focus();
}

function checkWalletCollisions(){
  S.pending=S.pending||[];
  var L=S.entries.filter(function(e){return !e.void&&!e.removed&&wltEff(e)});
  L.sort(function(a,b){var x=(a.d||'')+(a.t||''),y=(b.d||'')+(b.t||'');return x<y?-1:x>y?1:a.id-b.id});
  var b={};Object.keys(WLT).forEach(function(k){b[k]=wOpen(k)});
  var anchors=(S.walletDates||[]).slice().sort(function(a,c){return a.d.localeCompare(c.d)}),ai=0;
  var collisions=[];
  L.forEach(function(e){
    var d=e.d||'';
    while(ai<anchors.length&&anchors[ai].d<=d){
      var a=anchors[ai];
      Object.keys(WLT).forEach(function(k){if(a[k]!=null)b[k]=+a[k]||0});
      ai++;
    }
    var f=wltEff(e);if(!f)return;
    b[f.w]=r2(b[f.w]+f.d*(+e.amt||0));
    if(b[f.w]<0){
      collisions.push({entry:e,wallet:f.w,deficit:r2(-b[f.w])});
      var exists=S.pending.some(function(p){return p.type==='wallet-collision'&&p.details&&p.details.entry===e.id&&p.state==='pending'});
      if(!exists){
        S.pending.unshift({
          id:uid(),
          type:'wallet-collision',
          state:'pending',
          at:Date.now(),
          reason:lb('Wallet deficit after admin adjust: ','অ্যাডমিন সমন্বয়ের পর ওয়ালেট ঘাটতি: ')+wN(f.w)+' ('+tk(b[f.w])+')',
          details:{entry:e.id,date:e.d,wallet:f.w,walletName:WLT[f.w],amt:e.amt,desc:e.desc||e.cat,deficit:r2(-b[f.w])}
        });
      }
    }
  });
  var colIds=new Set(collisions.map(function(c){return c.entry.id}));
  S.pending.forEach(function(p){
    if(p.type==='wallet-collision'&&p.state==='pending'&&p.details&&p.details.entry){
      if(!colIds.has(p.details.entry)){
        p.state='cleared';
        p.clearedAt=Date.now();
      }
    }
  });
  return collisions;
}

function isWalletCollision(eid){
  return (S.pending||[]).some(function(p){
    return p.type==='wallet-collision'&&p.details&&p.details.entry===eid&&p.state==='pending';
  });
}

function doSaveWalletOpening(d,r,vals,pinBy){
  /* Compute prev WITHOUT the anchor for this exact date so discrepancy
     reflects deviation from the pure transaction-based running balance,
     not from a previously-saved (now-being-replaced) anchor. */
  var _saved=S.walletDates;
  S.walletDates=(S.walletDates||[]).filter(function(a){return a.d!==d});
  var prev=balanceAtDate(d),disc={};
  S.walletDates=_saved;
  Object.keys(WLT).forEach(function(k){disc[k]=vals[k]-(+prev[k]||0)});
  var anchor={d:d,by:U.name,at:Date.now(),reason:r,prev:prev,discrepancy:disc,pinBy:pinBy||'',pinAt:pinBy?Date.now():0};
  Object.keys(WLT).forEach(function(k){anchor[k]=vals[k]});
  var old=(S.walletDates||[]).filter(function(a){return a.d!==d});
  S.walletDates=[...old,anchor].sort(function(a,b){return a.d.localeCompare(b.d)});
  var collisions=checkWalletCollisions();
  var anyDisc=Object.keys(disc).some(function(k){return Math.abs(disc[k])>0.5});
  lg('Wallet adjustment (prime)',d+' · '+r+(pinBy?' · PIN':'')+(collisions.length?' · '+collisions.length+' collision(s)':'')+(anyDisc?' · discrepancy':''));
  save();
  if(collisions.length){
    ltoast(lb('Adjustment applied (Prime). ','সমন্বয় কার্যকর হয়েছে (প্রাইম)। ')+collisions.length+lb(' collision(s) queued for review','টি লেনদেন রিভিউ কিউতে রাখা হয়েছে'));
  } else {
    ltoast(lb('Opening saved','ওপেনিং সংরক্ষিত')+(anyDisc?' · '+lb('differs from running balance','পার্থক্য আছে'):''));
  }
  renderWalletCards();
  if(CUR==='acc')render();
  setTimeout(openWltSettings,50);
}

function getCardSettings(){
  var def={hHero:1,hStats:1,hToday:1,hOwe:1,hWlt:1,hQa:1,hCharts:1,hRecent:1,accStats:1,accCash:1,accWlt:1,accFilter:1};
  return Object.assign({},def,S.cardSettings||{});
}

function applyCardSettings(){
  var cs=getCardSettings();
  var hHero=$('hHero'),hStats=$('hStats'),hToday=$('hToday'),hWltH=$('wltWrapH'),hQa=$('hQa'),dg=document.querySelector('.dgrid'),hRec=$('hRecent');
  if(hHero)hHero.style.display=cs.hHero?'':'none';
  if(hStats)hStats.style.display=cs.hStats?'':'none';
  if(hToday)hToday.style.display=cs.hToday?'':'none';
  if(hWltH)hWltH.style.display=cs.hWlt?'':'none';
  if(hQa)hQa.style.display=cs.hQa?'':'none';
  if(dg)dg.style.display=cs.hCharts?'':'none';
  if(hRec){
    hRec.style.display=cs.hRecent?'':'none';
    var prevH3=hRec.previousElementSibling;
    if(prevH3&&prevH3.tagName==='H3')prevH3.style.display=cs.hRecent?'':'none';
  }
  var st=$('stats'),cp=$('cashp'),wltA=$('wltWrap'),fb=$('fb');
  if(st)st.style.display=cs.accStats?'':'none';
  if(cp)cp.style.display=cs.accCash?'':'none';
  if(wltA)wltA.style.display=cs.accWlt?'':'none';
  if(fb)fb.style.display=cs.accFilter?'':'none';
}

function openCardSectionSettings(){
  if(!isA())return;
  var cs=getCardSettings(),b=calcWallets(),cashB=cashBook();
  var wltBtn=function(k){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:var(--soft);border-radius:8px">'
      +'<div><b>'+esc(wN(k))+'</b> <span class="mut" style="font-size:13px">'+tk(b[k]||0)+'</span></div>'
      +'<button type="button" class="ghost" style="height:28px;font-size:12px;padding:0 8px" data-scw="'+k+'">'+lb('Adjust','সমন্বয়')+'</button>'
      +'</div>';
  };
  var tg=function(id,label,checked){
    return '<label class="tg" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13.5px">'
      +'<span>'+label+'</span>'
      +'<input type="checkbox" id="cs_'+id+'" '+(checked?'checked':'')+'>'
      +'</label>';
  };
  var h='<div style="max-height:68vh;overflow:auto;display:grid;gap:14px">'
    +'<div class="card" style="margin:0;padding:12px">'
    +'<h4 style="margin:0 0 8px;font-size:14px;color:var(--acc);display:flex;align-items:center;gap:6px">'
    +'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
    +lb('Quick balance adjustments','দ্রুত ব্যালেন্স সমন্বয় (প্রাইম)')+'</h4>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:var(--soft);border-radius:8px;margin-bottom:8px">'
    +'<div><b>'+lb('Cash drawer','ক্যাশ ড্রয়ার')+'</b> <span class="mut" style="font-size:13px">'+tk(cashB)+'</span></div>'
    +'<button type="button" class="ghost" style="height:28px;font-size:12px;padding:0 8px" id="sc_cashAdj">'+lb('Count & adjust','গণনা ও সমন্বয়')+'</button>'
    +'</div>'
    +'<div style="font-size:12px;font-weight:600;color:var(--mut);margin:8px 0 4px">'+lb('MFS Wallets','এমএফএস ওয়ালেট')+'</div>'
    +'<div style="display:grid;gap:6px">'+WLT_MFS.map(wltBtn).join('')+'</div>'
    +'<div style="font-size:12px;font-weight:600;color:var(--mut);margin:10px 0 4px">'+lb('Recharge balances','রিচার্জ ব্যালেন্স')+'</div>'
    +'<div style="display:grid;gap:6px">'+WLT_RCR.map(wltBtn).join('')+'</div>'
    +'<div style="margin-top:10px;display:flex;justify-content:flex-end">'
    +'<button type="button" class="ghost" id="sc_wltHist" style="font-size:12px;height:30px">📜 '+lb('Full wallet opening history','ওয়ালেট ওপেনিং ইতিহাস')+'</button>'
    +'</div>'
    +'</div>'
    +'<div class="card" style="margin:0;padding:12px">'
    +'<h4 style="margin:0 0 8px;font-size:14px;color:var(--acc);display:flex;align-items:center;gap:6px">'
    +'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
    +lb('Dashboard section visibility','ড্যাশবোর্ড সেকশন দৃশ্যমানতা')+'</h4>'
    +'<div style="font-weight:600;font-size:12.5px;color:var(--mut);margin-bottom:4px">'+lb('Home tab sections','হোম ট্যাব সেকশনসমূহ')+'</div>'
    +tg('hHero', lb('Cash Balance Hero Banner','ক্যাশ ব্যালেন্স হিরো ব্যানার'), cs.hHero)
    +tg('hStats', lb('Stats Summary (Total Sell, Buy, Due)','সারসংক্ষেপ পরিসংখ্যান'), cs.hStats)
    +tg('hToday', lb("Today's Cash Flow Strip",'আজকের ক্যাশ ফ্লো স্ট্রিপ'), cs.hToday)
    +tg('hOwe', lb('Net Receivable / Payable (Due Summary)','বকেয়া দেওয়া-নেওয়ার হিসাব'), cs.hOwe)
    +tg('hWlt', lb('MFS & Recharge Wallet Cards','এমএফএস ও রিচার্জ ওয়ালেট কার্ড'), cs.hWlt)
    +tg('hQa', lb('Quick Action Buttons (New Sale, etc.)','কুইক অ্যাকশন বাটন'), cs.hQa)
    +tg('hCharts', lb('7-Day Sell/Buy & Payment Charts','৭ দিনের চার্ট ও গ্রাফ'), cs.hCharts)
    +tg('hRecent', lb('Recent POS Bills Card','সাম্প্রতিক বিলসমূহ'), cs.hRecent)
    +'<div style="font-weight:600;font-size:12.5px;color:var(--mut);margin:12px 0 4px">'+lb('Accounts tab sections','অ্যাকাউন্টস ট্যাব সেকশনসমূহ')+'</div>'
    +tg('accStats', lb('Accounts Stats Summary','অ্যাকাউন্টস পরিসংখ্যান'), cs.accStats)
    +tg('accCash', lb('Opening & Closing Cash Panel','ক্যাশ ড্রয়ার প্যানেল ও সমন্বয় বাটন'), cs.accCash)
    +tg('accWlt', lb('Accounts MFS & Recharge Wallets','অ্যাকাউন্টস ওয়ালেট কার্ড'), cs.accWlt)
    +tg('accFilter', lb('Search & Filter Controls','অনুসন্ধান ও ফিল্টার বার'), cs.accFilter)
    +'<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">'
    +'<button type="button" class="ghost" id="sc_resetAll" style="font-size:12px;height:30px">'+lb('Show all sections','সব সেকশন দেখান')+'</button>'
    +'</div>'
    +'</div>'
    +'</div>';
  ask(lb('Section & Card Settings','সেকশন ও কার্ড সমন্বয় সেটিংস'),h,function(){
    var newCs={
      hHero:$('cs_hHero')?$('cs_hHero').checked:true,
      hStats:$('cs_hStats')?$('cs_hStats').checked:true,
      hToday:$('cs_hToday')?$('cs_hToday').checked:true,
      hOwe:$('cs_hOwe')?$('cs_hOwe').checked:true,
      hWlt:$('cs_hWlt')?$('cs_hWlt').checked:true,
      hQa:$('cs_hQa')?$('cs_hQa').checked:true,
      hCharts:$('cs_hCharts')?$('cs_hCharts').checked:true,
      hRecent:$('cs_hRecent')?$('cs_hRecent').checked:true,
      accStats:$('cs_accStats')?$('cs_accStats').checked:true,
      accCash:$('cs_accCash')?$('cs_accCash').checked:true,
      accWlt:$('cs_accWlt')?$('cs_accWlt').checked:true,
      accFilter:$('cs_accFilter')?$('cs_accFilter').checked:true
    };
    S.cardSettings=newCs;
    save();
    applyCardSettings();
    if(CUR==='home')homeUI();
    if(CUR==='acc')render();
    ltoast(lb('Card & section settings saved','কার্ড ও সেকশন সেটিংস সংরক্ষিত'));
  },lb('Save settings','সংরক্ষণ'),1);
  var ob=$('ob');
  ob.onclick=function(e){
    var wBtn=e.target.closest('[data-scw]');
    if(wBtn){$('ov').hidden=true;setTimeout(function(){adjustSingleWallet(wBtn.dataset.scw);},50);return}
    if(e.target.closest('#sc_cashAdj')){$('ov').hidden=true;setTimeout(function(){cashAdjust();},50);return}
    if(e.target.closest('#sc_wltHist')){$('ov').hidden=true;setTimeout(function(){openWltSettings();},50);return}
    if(e.target.closest('#sc_resetAll')){
      ['cs_hHero','cs_hStats','cs_hToday','cs_hOwe','cs_hWlt','cs_hQa','cs_hCharts','cs_hRecent','cs_accStats','cs_accCash','cs_accWlt','cs_accFilter'].forEach(function(id){
        var el=$(id);if(el)el.checked=true;
      });
      return;
    }
  };
}
(function(){
  var hp=document.createElement('div'),HT,HH;hp.id='whp';hp.className='card';hp.hidden=true;document.body.appendChild(hp);
  function hide(){clearTimeout(HT);hp.hidden=true}
  document.addEventListener('mouseover',function(e){if(!matchMedia('(hover:hover)').matches)return;var el=e.target.closest&&e.target.closest('.wlt-item');if(!el)return;clearTimeout(HH);clearTimeout(HT);
    HT=setTimeout(function(){var k=el.dataset.w,b=calcWallets(),r=wltRows(k,5);hp.innerHTML='<b>'+esc(wN(k))+'</b> <span class="mut">'+tk(b[k])+'</span>'+(r.length?r.map(function(x){return'<div class="whr"><span>'+esc(x.d)+' · '+esc(x.c)+'</span><b class="'+(x.p?'pos':'neg')+'">'+x.a+'</b></div>'}).join(''):'<div class="mut" style="margin-top:6px">'+lb('No transactions','কোনো লেনদেন নেই')+'</div>')+'<div class="mut" style="font-size:12px;margin-top:6px">'+lb('Click for all','সব দেখতে ক্লিক')+'</div>';
      hp.hidden=false;var q=el.getBoundingClientRect();hp.style.left=Math.max(8,Math.min(q.left,innerWidth-270))+'px';hp.style.top=(q.bottom+6+210>innerHeight?Math.max(8,q.top-216):q.bottom+6)+'px'},300)});
  document.addEventListener('mouseout',function(e){if(e.target.closest&&e.target.closest('.wlt-item')){clearTimeout(HT);HH=setTimeout(hide,200)}});
  document.addEventListener('click',function(e){
    var adjBtn=e.target.closest&&e.target.closest('[data-wadj]');
    if(adjBtn){
      e.stopPropagation();
      var kind=adjBtn.dataset.wadj,keys=(kind==='mfs'?WLT_MFS:WLT_RCR);
      ldlg(lb('Adjust balance','ব্যালেন্স সমন্বয়'),'<div class="mut" style="margin-bottom:10px">'+lb('Select which wallet to adjust:','কোন ওয়ালেট সমন্বয় করবেন নির্বাচন করুন:')+'</div><div style="display:grid;gap:8px">'+keys.map(function(k){return '<button type="button" class="ghost" style="text-align:left;padding:10px 14px;display:flex;justify-content:space-between" data-pickw="'+k+'"><b>'+esc(wN(k))+'</b><span>'+tk(calcWallets()[k]||0)+'</span></button>'}).join('')+'</div>',function(){},lb('Close','বন্ধ'),1);
      $('ob').onclick=function(ev){var pb=ev.target.closest('[data-pickw]');if(pb){$('ov').hidden=true;setTimeout(function(){adjustSingleWallet(pb.dataset.pickw);},50)}};
      return;
    }
    var el=e.target.closest&&e.target.closest('.wlt-item');if(el){hide();showWltDetail(el.dataset.w)}
  });
  document.addEventListener('scroll',hide,{passive:true});
  $('fc').addEventListener('input',function(){party();preview()});
  renderWalletCards()})();

/* ---------- ledger linked to cash flow ---------- */
function DLid(e){return e.id+2e13}
function LKid(t){return t.id+1e13}
function cN(id){var c=S.cust.find(function(x){return x.id===id});return c?c.name:'?'}
function ledLive(t){return!!t.lnk&&(t.le||0)===(S.epoch||0)}
function ledMove(t){var m=mN(t.m);if(m==='Cash')return{pay:'Cash',w:''};var w={'Bkash Personal':'bk','Bkash Agent':'bka',Nagad:'ng',Rocket:'rk'}[m];return w?{pay:'Mobile Banking',w:w}:null}
function ledDay(t){var d=t.d;return(d&&!(S.days[d]&&S.days[d].closed))?d:nextOpenDay()}
function ledEntry(t){var mv=ledMove(t)||{pay:'Cash',w:''};
  return{d:ledDay(t),t:t.t||nowT(),type:'Ledger',desc:'Ledger '+(t.dir==='in'?'received':'given')+' · '+cN(t.c),cat:'Ledger',pay:mv.pay,amt:+t.amt||0,ld:t.dir,w:mv.w,lk:t.id,od:t.d||'',by:t.by||''}}
function ledChk(t){return!t.void&&!t.l9&&!t.ok}
function entChk(e){return !e.void&&!e.ok&&((e.type==='Sale'&&e.pay==='Due'&&!e.cu)||(e.type==='Purchase'&&e.pay==='Due'))}
function lChkN(c){return S.ltx.filter(function(t){return t.c===c.id&&ledChk(t)}).length}
function ledReconcile(){
  var em={},tm={};S.entries.forEach(function(e){em[e.id]=e});S.ltx.forEach(function(t){tm[t.id]=t});
  S.entries.slice().forEach(function(e){
    var q=e.type==='Sale'&&e.pay==='Due'&&!!e.cu,id=DLid(e),t=tm[id];
    if(!q&&!t)return;
    if(q&&!t){t={id:id,c:e.cu,dir:'out',amt:e.amt,parts:null,d:e.d,d2:'',t:e.t||'',m:'Due sale',who:'',note:String(e.desc||'').slice(0,200),by:e.by||'',src:e.id,l9:1,lnk:0};
      if(e.void){t.void=1;t.vr='Sale voided';t.vb='System'}S.ltx.push(t);tm[id]=t;return}
    if(!t)return;
    var sv=!q||!!e.void;
    if(q){var w={c:e.cu,amt:e.amt,d:e.d,t:e.t||'',note:String(e.desc||'').slice(0,200)};Object.keys(w).forEach(function(k){if(t[k]!==w[k])t[k]=w[k]})}
    if(!!t.void!==sv){if(sv){t.void=1;t.vr=q?'Sale voided':'Sale changed';t.vb='System'}else{t.void=0;t.vr='';t.vb=''}}
  });
  S.ltx.slice().forEach(function(t){
    if(t.src)return;
    if(!!t.lnk&&(t.le||0)!==(S.epoch||0))return;
    var id=LKid(t),e=em[id],mv=ledMove(t),want=!!t.lnk&&!!mv&&!t.void&&!!t.d;
    if(!e){if(!want)return;e=Object.assign({id:id},ledEntry(t));S.entries.push(e);em[id]=e;return}
    if(S.days[e.d]&&S.days[e.d].closed)return;
    if(want){var f=ledEntry(t);if(e.od===(t.d||''))f.d=e.d;Object.keys(f).forEach(function(k){if(e[k]!==f[k])e[k]=f[k]});if(e.void){e.void=0;e.vr=''}}
    else if(!e.void){e.void=1;e.vr=t.void?'Ledger entry voided':(t.lnk?'Method changed':'Unlinked')}
  });
}
function cuOptHtml(val){var L=S.cust.filter(function(c){return!c.del}).sort(function(a,b){return a.name.localeCompare(b.name)});
  return'<option value="">'+lb('Select party','পক্ষ বাছুন')+'</option>'+L.map(function(c){return'<option value="'+c.id+'"'+(String(val)===String(c.id)?' selected':'')+'>'+esc(c.name)+(c.kind?' ('+kindLabel(c.kind)+')':'')+'</option>'}).join('')+'<option value="__new"'+(val==='__new'?' selected':'')+'>+ '+lb('New party','নতুন পক্ষ')+'</option>'}
function cuOpts(){var s=$('fcu'),v=s.value,sig=cuOptHtml('');if(s.dataset.sig!==sig){s.innerHTML=cuOptHtml(v);s.dataset.sig=sig}}
function guessCu(e){if(e.cu)return String(e.cu);var n=String(e.party||'').toLowerCase(),c=n?S.cust.find(function(x){return!x.del&&x.name.toLowerCase()===n}):null;return c?String(c.id):''}
function editCu(e){if($('pcu').hidden)return;var g=guessCu(e),s=$('fcu');if(g&&[].some.call(s.options,function(o){return o.value===g}))s.value=g;party()}
function custNew(nm,ph,why){var c=S.cust.find(function(x){return!x.del&&x.name.toLowerCase()===nm.toLowerCase()});if(!c){c={id:Date.now(),name:nm,phone:ph||'',fb:'',img:'',note:'',kind:'Customer'};S.cust.push(c);lg('Ledger party','Added '+nm+' ('+why+')')}return c}
function dueCust(o,editId){var v=$('fcu').value,old=editId?S.entries.find(function(x){return x.id===editId}):null,c=null;
  if(v==='__new'){var nm=(o.party||'').trim();if(!nm){ltoast(lb('Enter the party name','পক্ষের নাম লিখুন'));return false}c=custNew(nm,o.phone,'due sale')}
  else if(v)c=S.cust.find(function(x){return x.id===+v});
  if(!c){if(old&&old.type==='Sale'&&old.pay==='Due'&&!old.cu)return true;ltoast(lb('Select a party for a due sale','বাকি বিক্রির জন্য পক্ষ বাছুন'));return false}
  o.cu=c.id;o.party=c.name;o.phone=c.phone||o.phone||'';return true}
function posCust(ck){var v=ck.cu,c=null;
  if(v==='__new'){var nm=(ck.party||'').trim();if(!nm){ltoast(lb('Enter the party name','পক্ষের নাম লিখুন'));return false}c=custNew(nm,ck.phone,'POS due sale')}
  else if(v)c=S.cust.find(function(x){return x.id===+v});
  if(!c){ltoast(lb('Select a party for a due sale','বাকি বিক্রির জন্য পক্ষ বাছুন'));return false}
  ck.cuId=c.id;ck.party=c.name;ck.phone=c.phone||ck.phone||'';return true}
function lkHint(s,ed){var el=$('lfk');if(!el)return;var m=ledMove({m:$('lfm').value}),cb=$('lfk2'),unk=$('lfx').checked&&$('lfu').checked,up=$('lfd').value==='in',x;
  if(ed&&!ed.l9)x=lb('Old entry: use Link in the entry details.','পুরোনো এন্ট্রি: বিস্তারিত থেকে লিংক করুন।');
  else if(!m)x=lb('Bank / Other: no change to cash or wallets.','ব্যাংক/অন্যান্য: ক্যাশ বদলাবে না।');
  else if(unk)x=lb('No date, so cash and wallets will not change.','তারিখ নেই, ক্যাশ বদলাবে না।');
  else if(cb&&!cb.checked)x=lb('Not recorded in cash / wallet.','ক্যাশে লেখা হবে না।');
  else x=(m.w?wN(m.w):lb('Cash balance','ক্যাশ ব্যালেন্স'))+' '+(up?lb('goes up by ','বাড়বে '):lb('goes down by ','কমবে '))+(s?tk(s):'');
  el.textContent=x}
function ledVoidBlocked(t){var e=S.entries.find(function(x){return x.id===LKid(t)});if(!e||e.void||!ledLive(t))return false;
  if(S.days[e.d]&&S.days[e.d].closed){ltoast(lb('That day is closed.','দিন বন্ধ।'));return true}
  return wltVoidBlocked(e)}
function ledRestoreBlocked(t){if(!ledLive(t))return false;var mv=ledMove(t);if(!mv||!t.d)return false;var e=S.entries.find(function(x){return x.id===LKid(t)});
  if(e&&S.days[e.d]&&S.days[e.d].closed){ltoast(lb('That day is closed.','দিন বন্ধ।'));return true}
  if(mv.w){var wc=checkWalletLimit(Object.assign({id:LKid(t)},ledEntry(t)),LKid(t),[mv.w]);if(!wc.ok){ltoast(lb('Cannot restore: ','ফেরানো যাবে না: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হবে।'));return true}}
  return false}
function ledLink(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA())return;var mv=ledMove(t);
  if(!mv){ltoast(lb('Bank and Other do not move cash.','ব্যাংক/অন্যান্য ক্যাশ বদলায় না।'));return}
  if(!t.d){ltoast(lb('Set the date first.','আগে তারিখ দিন।'));return}
  var f=ledEntry(t),what=mv.w?wN(mv.w):lb('Cash balance','ক্যাশ ব্যালেন্স'),ef=(t.dir==='in'?'+':'−')+tk(t.amt);
  if(mv.w){var wc=checkWalletLimit(Object.assign({id:LKid(t)},f),null,[mv.w]);if(!wc.ok){ltoast(lb('Cannot link: ','যুক্ত করা যাবে না: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হবে।'));return}}
  ask(lb('Link to cash flow?','ক্যাশে যুক্ত করবেন?'),'<p><b>'+esc(what)+' '+ef+'</b><br>'+lb('Posted on ','তারিখ ')+sd(f.d)+'</p>',function(){t.lnk=1;t.le=S.epoch||0;t.ok=1;t.okb=U.name;lg('Ledger link',cN(t.c)+' · '+tk(t.amt));save();ledUI()},lb('Link','যুক্ত করুন'))}
function ledAccept(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA())return;t.ok=1;t.okb=U.name;lg('Ledger accept',cN(t.c)+' · '+tk(t.amt));save();ledUI()}
function ledAcceptAll(cid){if(!isA())return;var L=S.ltx.filter(function(t){return t.c===cid&&ledChk(t)});if(!L.length)return;
  ask(lb('Accept all?','সব গ্রহণ করবেন?'),'<p>'+L.length+' '+lb('older entries stay out of cash flow.','পুরোনো এন্ট্রি ক্যাশের বাইরে থাকবে।')+'</p>',function(){L.forEach(function(t){t.ok=1;t.okb=U.name});lg('Ledger accept',cN(cid)+' · '+L.length+' entries');save();ledUI()},lb('Accept all','সব গ্রহণ'))}
function entLink(id){var e=S.entries.find(function(x){return x.id===id});if(!e||!isA()||e.type!=='Sale'||e.pay!=='Due'||!entChk(e))return;
  ask(lb('Link to party ledger','পক্ষের খাতায় যুক্ত করুন'),'<p>'+esc(e.desc)+' · <b>'+tk(e.amt)+'</b> · '+sd(e.d)+'</p><div class="f"><label>'+lb('Party','পক্ষ')+'</label><select id="elc">'+cuOptHtml(guessCu(e))+'</select></div><div id="eln" hidden><div class="f"><label>'+lb('Name','নাম')+'</label><input id="eln1" maxlength="60" value="'+esc(e.party||'')+'"></div><div class="f"><label>'+lb('Phone (optional)','ফোন (ঐচ্ছিক)')+'</label><input id="eln2" type="tel" maxlength="20" value="'+esc(e.phone||'')+'"></div></div>',function(){
    var v=$('elc').value,c=null;
    if(v==='__new'){var nm=$('eln1').value.trim();if(!nm){$('eln1').style.borderColor='var(--neg)';return false}c=custNew(nm,$('eln2').value.trim(),'due sale')}
    else if(v)c=S.cust.find(function(x){return x.id===+v});
    if(!c){ltoast(lb('Select a party','পক্ষ বাছুন'));return false}
    e.cu=c.id;e.party=c.name;e.phone=c.phone||e.phone||'';lg('Link due sale',c.name+' · '+tk(e.amt));save();render()},lb('Link','যুক্ত করুন'));
  $('ob').onchange=function(ev){if(ev.target.id==='elc')$('eln').hidden=ev.target.value!=='__new'};$('eln').hidden=$('elc').value!=='__new'}
function entAccept(id){var e=S.entries.find(function(x){return x.id===id});if(!e||!isA())return;e.ok=1;lg('Accept entry',(e.party||e.desc||'?')+' · '+tk(e.amt));save();render()}
function ledChkBar(c){if(!lEd())return'';var n=lChkN(c);if(!n)return'';return'<div class="card cbn noprint"><span><b>'+lb('Check','যাচাই')+'</b> · '+n+' '+lb('older entries','পুরোনো এন্ট্রি')+'</span>'+(isA()?'<button class="ghost" data-a="accall">'+lb('Accept all','সব গ্রহণ')+'</button>':'')+'</div>'}
function ledTopBar(){if(!lEd())return'';var a=S.ltx.filter(ledChk).length,b=S.entries.filter(entChk).length;if(!a&&!b)return'';return'<div class="card cbn"><span><b>'+lb('Check','যাচাই')+'</b> · '+(a?a+' '+lb('ledger','খাতা'):'')+(a&&b?' · ':'')+(b?b+' '+lb('accounts','হিসাব'):'')+'</span>'+(a?'<button class="ghost" data-a="flt" data-f="chk">'+lb('Show','দেখান')+'</button>':'')+'</div>'}
function chkBar(){var el=$('chkBar');if(!el)return;if(!(U&&lEd())){el.hidden=true;el.innerHTML='';return}
  var ds=S.entries.filter(function(e){return entChk(e)&&e.type==='Sale'}).length,dp=S.entries.filter(function(e){return entChk(e)&&e.type==='Purchase'}).length;
  if(!ds&&!dp){el.hidden=true;el.innerHTML='';return}
  var parts=[];if(ds)parts.push(ds+' '+lb('due sale(s)','বাকি বিক্রি'));if(dp)parts.push(dp+' '+lb('old due purchase(s)','পুরোনো বাকি ক্রয়'));
  el.hidden=false;el.innerHTML='<span><b>'+lb('Check','যাচাই')+'</b> · '+parts.join(' · ')+'</span><button class="ghost" data-ck="show">'+lb('Show','দেখান')+'</button>'}
(function(){
  $('fcu').addEventListener('change',function(){party();preview()});
  $('tbl').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var a=b.dataset.a;if(a==='lc')entLink(+b.dataset.i);else if(a==='ok')entAccept(+b.dataset.i)});
  $('chkBar').addEventListener('click',function(ev){if(ev.target.closest('[data-ck]')){$('sty').value='Check';render()}});
})();
(function(){
  $('tbl').addEventListener('click',function(e){if(e.target.closest('[data-amore]')){ACC_N+=150;render()}});
  $('vLed').addEventListener('click',function(e){if(e.target.closest('[data-lm]')){LPGN+=100;ledUI()}});
})();
(function(){
  var COL=['#9E68DF','#2F7BD8','#EDBF47','#E8743B','#2CC56F','#46C1BF'],
  mb=document.createElement('button');mb.id='mb';mb.className='ic';mb.setAttribute('aria-label','Menu');
  mb.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  $('top').insertBefore(mb,$('top').firstChild);
  var dr=document.createElement('div');dr.id='dr';dr.className='dr';dr.hidden=true;
  dr.innerHTML='<div class="drb"></div><aside class="drp"><div class="drh"><b id="drn"></b><button class="ic" id="drx" aria-label="Close">✕</button></div><div class="drg" id="drg"></div></aside>';
  document.body.appendChild(dr);
  function close(){dr.hidden=true}
  function open(){if(!U)return;var T=TABS[role()];
    $('drg').innerHTML=T.map(function(k,i){return '<button class="drt'+(CUR===k?' on':'')+'" data-v="'+k+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:'+COL[i%COL.length]+'">'+ICO[k]+'</svg>'+TL[k]+'</button>'}).join('');$('drn').textContent=shopN();dr.hidden=false}
  mb.onclick=open;$('drx').onclick=close;dr.querySelector('.drb').onclick=close;
  $('drg').addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(!b)return;close();go(b.dataset.v)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
})();

/* v9.13 reduced motion: auto-detect from OS only */
var MQM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
function applyMotion(){var on=!!(MQM&&MQM.matches),r=document.documentElement;if(on)r.dataset.rm='1';else delete r.dataset.rm}
(function(){if(MQM){if(MQM.addEventListener)MQM.addEventListener('change',applyMotion);else if(MQM.addListener)MQM.addListener(applyMotion)}
  applyMotion();
  var M="Claude Sonnet 5.5 · owner's Claude account";APP_VERSION='9.13';
  VERS.unshift({v:'9.13',d:'2026-10-18',t:'Reduced motion',by:M,n:['Sync indicator stops pulsing when the device asks for reduced motion','Automatic from OS setting']});
})();

/* v9.14 attachments */
var ATT_MAX=3,ATT_CH=70000,ATT_TOTAL=1.5e6;
function attList(ref){return(S.atts||[]).filter(function(a){return a.ref===ref&&!a.del})}
function attN(ref){return attList(ref).length}
function attBtn(ref){var c=attN(ref);return'<button class="lnk" data-a="at" data-r="'+ref+'">'+lb('Photo','ছবি')+(c?' ('+c+')':'')+'</button>'}
function attShrink(f){return new Promise(function(res,rej){var r=new FileReader();r.onerror=rej;r.onload=function(){var im=new Image();im.onerror=function(){rej(new Error('Not an image'))};im.onload=function(){var side=1000,q=.7;for(var i=0;i<9;i++){var k=Math.min(1,side/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);var u=c.toDataURL('image/jpeg',q);if(u.length<=ATT_CH)return res(u);if(q>.4)q-=.1;else side=Math.round(side*.8)}rej(new Error('Too large'))};im.src=r.result};r.readAsDataURL(f)})}
function attAdd(ref,u){if(!/^data:image\/jpeg;base64,/.test(u)||u.length>ATT_CH*1.05)return lb('Photo is too large','ছবি বড়');
 if(attN(ref)>=ATT_MAX)return lb('Up to 3 photos per record','সর্বোচ্চ ৩টি');
 if((S.atts||[]).reduce(function(s,a){return s+(a.del?0:a.d.length)},0)+u.length>ATT_TOTAL)return lb('Photo storage is full','জায়গা ভরে গেছে');
 S.atts=S.atts||[];S.atts.push({id:uid(),ref:ref,d:u,by:U?U.name:'',at:Date.now()});lg('Receipt photo added',ref);save();if(CUR==='acc')render();return true}
function attUI(ref){var L=attList(ref);
 ldlg(lb('Receipt photos','রসিদের ছবি'),'<div class="mut" style="margin-bottom:8px">'+lb('Optional. Up to 3 photos.','ঐচ্ছিক। সর্বোচ্চ ৩টি।')+'</div><div class="atg">'+(L.length?L.map(function(a){return'<div class="atc"><img src="'+esc(a.d)+'" data-z="1" alt=""><small>'+esc(a.by||'')+' · '+sd(iso(new Date(a.at)))+'</small>'+(isA()?'<button type="button" class="lnk" data-rm="'+a.id+'">'+lb('Remove','সরান')+'</button>':'')+'</div>'}).join(''):'<div class="empty">'+lb('No photos','ছবি নেই')+'</div>')+'</div>'+(L.length<ATT_MAX?'<div class="chips" style="margin-top:10px"><button type="button" data-cam="1">'+lb('Camera','ক্যামেরা')+'</button><button type="button" data-gal="1">'+lb('Gallery','গ্যালারি')+'</button></div><input id="ati1" type="file" accept="image/*" capture="environment" hidden><input id="ati2" type="file" accept="image/*" hidden>':''),function(){},lb('Close','বন্ধ'),1);
 $('ob').onclick=function(e){var t=e.target.closest('button,img');if(!t)return;if(t.dataset.cam)$('ati1').click();else if(t.dataset.gal)$('ati2').click();else if(t.dataset.z)t.parentNode.classList.toggle('z');
  else if(t.dataset.rm&&isA()){var a=S.atts.find(function(x){return String(x.id)===t.dataset.rm});if(a){a.del=1;a.db=U.name;a.dt=Date.now();lg('Receipt photo removed',ref);save();if(CUR==='acc')render();attUI(ref)}}};
 $('ob').onchange=function(e){var f=e.target.files&&e.target.files[0];if(!f)return;attShrink(f).then(function(u){var m=attAdd(ref,u);if(m!==true){ltoast(m);return}ltoast(lb('Photo added','ছবি যোগ'));attUI(ref)}).catch(function(){ltoast(lb('Could not read this photo','পড়া যায়নি'))})}}
$('tbl').addEventListener('click',function(e){var b=e.target.closest('[data-a="at"]');if(b)attUI(b.dataset.r)});
$('ob').addEventListener('click',function(e){if(e.target.id==='backupJson'){S.lastBackup=Date.now();persist()}});
(function(){var M="Claude Sonnet 5.5 · owner's Claude account";APP_VERSION='9.14';
 VERS.unshift({v:'9.14',d:'2026-10-18',t:'Optional receipt photos and backup note',by:M,n:['Optional receipt photos (max 3 per record)','Settings shows last backup timestamp']});
})();

/* v9.15 cleanup */
(function(){var M="Claude Sonnet 5.5 · owner's Claude account";APP_VERSION='9.15';
 VERS.unshift({v:'9.15',d:'2026-10-18',t:'Documentation and metadata cleanup',by:M,n:['Section 3 lists v9.10 fields','Section 6 marks done','Bug format moved to section 8 top','VERS.by backfilled for v9.5']});
 BUGS.unshift({d:'2026-10-18 --:--',v:'9.15',w:M,a:'Upcoming Features listed v9.8 below v9.5',b:'v9.8 updated Planned entry in place',c:'Splice old 9.8, unshift new Done 9.8'});})();

/* v9.16 review queue completion */
(function(){var M="Claude Sonnet 5.5 · owner's Claude account";
 VERS.unshift({v:'9.16',d:'2026-10-18',t:'Complete admin review queue',by:M,n:['Review queue dialog (Admin only)','Stock override approve/reject','Cashier flag / edit proposal / void request review']});
})();
function ledFlag(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||t.void)return;
 ask(lb('Flag for Admin check','অ্যাডমিন যাচাইয়ের জন্য চিহ্নিত করুন'),'<p class="mut">'+tk(t.amt)+' · '+dr(t)+'</p><div class="f"><label>'+lb('Reason (required)','কারণ (আবশ্যক)')+'</label><input id="lfgr" maxlength="160"></div>',function(){var r=$('lfgr').value.trim();if(!r){$('lfgr').style.borderColor='var(--neg)';return false}t.flag={state:'pending',by:U.name,at:Date.now(),reason:r};lg('Ledger flag',cname()+' · '+tk(t.amt)+' — '+r);save();ledUI()},lb('Flag','চিহ্নিত'))}
function ledFlagClear(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA()||!t.flag)return;t.flag.state='cleared';t.flag.cb=U.name;t.flag.ca=Date.now();lg('Ledger flag cleared',cname()+' · '+tk(t.amt));save();ledUI()}
function ledPropReview(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA()||!t.prop||t.prop.state!=='pending')return;var p=t.prop,to=p.to,
 r=function(l,a,b){return'<div class="prow"><span>'+l+'</span><span>'+esc(a)+' → <b>'+esc(b)+'</b></span></div>'},L=[];
 if(t.amt!==to.amt)L.push(r(lb('Amount','টাকা'),n(t.amt),n(to.amt)));if(t.dir!==to.dir)L.push(r(lb('Type','ধরন'),t.dir,to.dir));
 ask(lb('Review proposed edit','প্রস্তাবিত সম্পাদনা'),'<p class="mut">'+esc(p.by)+' · '+esc(p.reason)+'</p>'+(L.join('')||'<div class="mut">'+lb('No visible change','পরিবর্তন নেই')+'</div>')+'<div class="f" style="margin-top:10px"><label>'+lb('Reason to reject','প্রত্যাখ্যানের কারণ')+'</label><input id="lpr" maxlength="160"></div><button type="button" class="ghost" id="lprj" style="color:var(--neg)">'+lb('Reject','প্রত্যাখ্যান')+'</button>',function(){
  var m=Object.assign({},t,to),mv=ledMove(m);if(to.lnk&&mv&&mv.w){var wc=checkWalletLimit(Object.assign({id:LKid(t)},ledEntry(m)),LKid(t),[mv.w]);if(!wc.ok){ltoast(lb('Cannot approve: ','অনুমোদন যাবে না: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হবে।'));return false}}
  Object.assign(t,to,{eb:p.by});t.prop={state:'approved',by:p.by,at:p.at,reason:p.reason,rb:U.name,ra:Date.now()};lg('Ledger edit approved',cname()+' · '+tk(t.amt)+' · by '+p.by);save();ledUI()},lb('Approve','অনুমোদন'));
 $('ob').onclick=function(e){if(e.target.id!=='lprj')return;var w=$('lpr').value.trim();if(!w){$('lpr').style.borderColor='var(--neg)';return}t.prop.state='rejected';t.prop.rb=U.name;t.prop.ra=Date.now();t.prop.rr=w;lg('Ledger edit rejected',cname()+' · '+tk(t.amt)+' — '+w);save();$('ov').hidden=true;ledUI()}}
function dueState(c){if(!c.due||c.del||!lBal(c.id))return'';var t=iso(new Date()),s=new Date();s.setDate(s.getDate()+3);return c.due<t?'over':c.due<=iso(s)?'soon':''}
function dueTxt(c){var s=dueState(c);return sd(c.due)+(s==='over'?' · '+lb('Overdue','মেয়াদ পার'):s==='soon'?' · '+lb('Due soon','শীঘ্রই')+'':'')}
function ledDue(id){var c=S.cust.find(function(x){return x.id===id});if(!c||!lEd())return;
 ask(lb('Due date and reminder','নির্ধারিত তারিখ'),'<div class="f"><label>'+lb('Due date','তারিখ')+'</label><input id="cdd" type="date" value="'+esc(c.due||'')+'"></div><div class="f"><label>'+lb('Reminder note (optional)','নোট (ঐচ্ছিক)')+'</label><input id="cdn" maxlength="120" value="'+esc(c.dueNote||'')+'"></div>',function(){c.due=$('cdd').value;c.dueNote=$('cdn').value.trim();lg('Ledger due date',c.name+' · '+(c.due?sd(c.due):'cleared'));save();ledUI()},lb('Save','সংরক্ষণ'))}
function ledDueBar(c){if(!c.due)return'';var b=lBal(c.id);return'<div class="card cbn noprint"><span><b>'+lb('Due date','নির্ধারিত তারিখ')+'</b> · '+esc(dueTxt(c))+(b?' · '+tk(Math.abs(b)):'')+(c.dueNote?' · '+esc(c.dueNote):'')+'</span></div>'}
function ledDueTop(){var L=S.cust.filter(function(c){return dueState(c)}).sort(function(a,b){return a.due.localeCompare(b.due)});if(!L.length)return'';
 return'<div class="card cbn"><span><b>'+lb('Reminders','রিমাইন্ডার')+'</b> · '+L.length+'</span>'+L.slice(0,6).map(function(c){var b=lBal(c.id);return'<button class="ghost" data-a="open" data-id="'+c.id+'">'+esc(c.name)+' · '+esc(dueTxt(c))+' · '+tk(Math.abs(b))+'</button>'}).join('')+'</div>'}
async function ledImg(){var c=S.cust.find(function(x){return x.id===LC});if(!c)return;try{
 var all=lSort(S.ltx.filter(function(x){return x.c===LC&&!x.void})),rows=ledRows(all,LF,LE),ob=LF?all.filter(function(x){return(x.d||'9999')<LF}).reduce(function(s,x){return s+(x.dir==='in'?x.amt:-x.amt)},0):null;
 if(document.fonts&&document.fonts.ready)await document.fonts.ready;
 var W=760,H=170+(rows.length+(ob!=null?1:0)+1)*30+20,cv=document.createElement('canvas'),F='SolaimanLipi, Inter, sans-serif';cv.width=W;cv.height=H;var g=cv.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,W,H);g.fillStyle='#111';g.font='700 22px '+F;g.fillText(shopN(),24,38);g.font='16px '+F;g.fillText(c.name+(c.phone?' · '+c.phone:''),24,66);g.fillStyle='#666';g.fillText((LF?sd(LF):'…')+' – '+(LE?sd(LE):sd(iso(new Date()))),24,90);
 var y=128,T=function(a,b,d,e,f,col){g.textAlign='left';g.fillStyle=col||'#111';g.fillText(String(a).slice(0,12),24,y);g.fillText(String(b).slice(0,34),140,y);g.textAlign='right';g.fillStyle=col||'#1E7A47';g.fillText(d,520,y);g.fillStyle=col||'#C23B3B';g.fillText(e,620,y);g.fillStyle=col||'#111';g.fillText(f,736,y);y+=30};
 g.font='600 14px '+F;T('Date','Details','পেলাম','দিলাম','Balance','#111');g.font='14px '+F;
 if(ob!=null)T('','Opening balance','','',n(ob));var ti=0,to=0,last=ob||0;
 rows.forEach(function(r){var x=r[0];if(x.dir==='in')ti+=x.amt;else to+=x.amt;last=r[1];T(x.d?sd(x.d):'?',(x.who||'')+(x.note?' · '+x.note:''),x.dir==='in'?n(x.amt):'',x.dir==='out'?n(x.amt):'',n(r[1]))});
 g.font='600 14px '+F;T('','Total',n(ti),n(to),n(last));
 var b=await new Promise(function(r){cv.toBlob(r,'image/png')}),fn='Statement_'+c.name.replace(/[^\w\u0980-\u09FF]+/g,'_')+'.png',f=new File([b],fn,{type:'image/png'});lg('Ledger share image',c.name);save();
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:c.name})}catch(e){}}
 else{var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fn;a.click();ltoast(lb('Image saved','ছবি সেভ হয়েছে'))}
 }catch(e){ltoast('Image error: '+e.message)}}
var LFQ='',LFD='',LFM='',LFA='',LFB='',LFC=null;
function ledFilt(){if(LFC!==LC){LFC=LC;LFQ=LFD=LFM=LFA=LFB=''}
 var o=function(v,l,s){return'<option value="'+v+'"'+(s===v?' selected':'')+'>'+l+'</option>'};
 return'<section class="card fb noprint"><input data-lf="q" value="'+esc(LFQ)+'" placeholder="'+lb('Search name, note, amount','খুঁজুন')+'"><select data-lf="d">'+o('',lb('All directions','সব'),LFD)+o('in','পেলাম',LFD)+o('out','দিলাম',LFD)+'</select><select data-lf="m">'+o('',lb('All methods','সব'),LFM)+['Cash','Bkash Personal','Bkash Agent','Nagad','Rocket','Bank','Other','Due sale'].map(function(m){return o(m,mL(m),LFM)}).join('')+'</select><input data-lf="a" type="date" title="From" value="'+LFA+'"><input data-lf="b" type="date" title="To" value="'+LFB+'"><button class="ghost" data-a="fltclr">'+lb('Clear','মুছুন')+'</button></section>'}
function ledFlt(rows){var q=LFQ.trim().toLowerCase().replace(/,/g,'');return rows.filter(function(r){var x=r[0],k=x.d||'9999';return(!q||((x.who||'')+' '+(x.note||'')+' '+x.amt+' '+(x.parts||[]).join(' ')).toLowerCase().includes(q))&&(!LFD||x.dir===LFD)&&(!LFM||mN(x.m)===LFM)&&(!(LFA||LFB)||x.d)&&(!LFA||k>=LFA)&&(!LFB||k<=LFB)})}
$('vLed').addEventListener('input',function(e){var k=e.target.dataset&&e.target.dataset.lf;if(!k)return;var p=e.target.selectionStart,v=e.target.value;if(k==='q')LFQ=v;else if(k==='d')LFD=v;else if(k==='m')LFM=v;else if(k==='a')LFA=v;else LFB=v;ledUI();var i=$('vLed').querySelector('[data-lf="'+k+'"]');if(i){i.focus();if(k==='q')i.setSelectionRange(p,p)}});
function ledFlagN(c){return S.ltx.filter(function(t){return t.c===c.id&&!t.void&&((t.flag&&t.flag.state==='pending')||(t.prop&&t.prop.state==='pending')||(t.voidReq&&t.voidReq.state==='pending'))}).length}

/* v9.17 PIN change + self test + by backfill */
function changeAdminPin(){
  if(!U||!isA())return;
  ask(lb('Change admin PIN','অ্যাডমিন পিন পরিবর্তন'),
    '<div class="f"><label>'+lb('Current PIN','বর্তমান')+'</label><input id="pin0" type="password" inputmode="numeric" autocomplete="off"></div>'
    +'<div class="f"><label>'+lb('New PIN (6+ digits)','নতুন পিন (৬+)')+'</label><input id="pin1" type="password" inputmode="numeric" autocomplete="off"></div>'
    +'<div class="f"><label>'+lb('Confirm new PIN','নিশ্চিত')+'</label><input id="pin2" type="password" inputmode="numeric" autocomplete="off"></div>',
    async function(){
      var cur=$('pin0').value,nu=$('pin1').value,cf=$('pin2').value;
      if(!/^\d{6,}$/.test(nu)||nu!==cf){$('pin2').style.borderColor='var(--neg)';return false}
      if(!(await ck(S.users.admin,cur))){$('pin0').value='';$('pin0').style.borderColor='var(--neg)';$('pin0').placeholder=lb('Wrong PIN','ভুল পিন');return false}
      var old=S.users.admin;S.users.admin=await mk(nu);
      lg('Admin PIN changed','');
      if(!save()){S.users.admin=old;S.log.shift();ltoast(lb('Could not save.','সংরক্ষণ হয়নি'));return false}
      ltoast(lb('Admin PIN changed','পরিবর্তন হয়েছে'));
    },lb('Save','সংরক্ষণ'));
  $('pin0').focus();
}
function selfTest(){
  if(!U||!isA())return;
  var r=[],ok=function(name,fn){try{var v=fn();r.push({n:name,p:true,v:v})}catch(e){r.push({n:name,p:false,e:e.message||String(e)})}};
  ok('Core functions',function(){var f=['calc','calcWallets','save','cash','wltEff','sorted','mN','n','tk','esc','ledReconcile','ledVoidReq','ledVoidReqReview','ledFlagReject','reviewQueue','reviewQueueCount','bugTxt','upcTxt','verTxt','mk','ck','H','walletAdjust','doSaveWalletOpening','checkWalletCollisions','openCardSectionSettings'];var miss=f.filter(function(nm){try{return eval('typeof '+nm)!=='function'}catch(e){return true}});if(miss.length)throw new Error('missing: '+miss.join(', '));return f.length+' checked'});
  ok('n() and tk()',function(){if(n(1234)!=='1,234')throw new Error('n wrong');if(tk(100)!=='৳100')throw new Error('tk wrong');return 'ok'});
  ok('mN(Bkash)',function(){if(mN('Bkash')!=='Bkash Personal')throw new Error('wrong');return 'ok'});
  ok('calc()',function(){var m=calc();if(!m||typeof m!=='object')throw new Error('not object');return Object.keys(m).length+' rows'});
  ok('calcWallets()',function(){var w=calcWallets();if(!w||typeof w!=='object')throw new Error('not object');return Object.keys(w).length+' wallets'});
  ok('sorted()',function(){var a=sorted();if(!Array.isArray(a))throw new Error('not array');return a.length+' entries'});
  ok('cash Sale Cash 100',function(){if(cash({type:'Sale',pay:'Cash',amt:100})!==100)throw new Error('wrong');return 'ok'});
  ok('cash Purchase Cash 100',function(){if(cash({type:'Purchase',pay:'Cash',amt:100})!==-100)throw new Error('wrong');return 'ok'});
  ok('wltEff Sale Mobile Banking',function(){var e=wltEff({void:0,type:'Sale',pay:'Mobile Banking',w:'bk',amt:100});if(!e||e.w!=='bk'||e.d!==1)throw new Error('wrong');return 'ok'});
  ok('ledReconcile()',function(){ledReconcile();return 'ran'});
  ok('COLS shape',function(){COLS.forEach(function(c){if(!Array.isArray(S[c]))throw new Error(c+' not array')});return COLS.length+' collections'});
  ok('S.start is number',function(){if(typeof S.start!=='number')throw new Error('not number');return n(S.start)});
  ok('S.walletDates array',function(){if(!Array.isArray(S.walletDates))throw new Error('not array');return S.walletDates.length+' anchors'});
  ok('S.counts array',function(){if(!Array.isArray(S.counts))throw new Error('not array');return S.counts.length+' counts'});
  ok('S.history / S.pending arrays',function(){if(S.history!==undefined&&!Array.isArray(S.history))throw new Error('history');if(S.pending!==undefined&&!Array.isArray(S.pending))throw new Error('pending');return 'ok'});
  ok('localStorage roundtrip',function(){var raw=localStorage.getItem(KEY);if(!raw)throw new Error('empty');var p=JSON.parse(raw);if(!p.rev&&p.rev!==0)throw new Error('no rev');return 'rev='+p.rev});
  ok('IndexedDB engine',function(){if(!window.NcsDB||!window.NcsDB.isSupported())return 'IndexedDB unavailable, fallback active';return 'IndexedDB active'});
  ok('PBKDF2 available',function(){if(!window.crypto||!crypto.subtle)throw new Error('no subtle');return 'ok'});
  ok('VERS / UPC / BUGS arrays',function(){if(!Array.isArray(VERS)||!VERS.length)throw new Error('VERS');if(!Array.isArray(UPC)||!UPC.length)throw new Error('UPC');if(!Array.isArray(BUGS)||!BUGS.length)throw new Error('BUGS');return VERS.length+'/'+UPC.length+'/'+BUGS.length});
  ok('All v9 VERS have by',function(){var miss=VERS.filter(function(v){return /^9(\.|$)/.test(v.v)&&!v.by});if(miss.length)throw new Error(miss.map(function(v){return v.v}).join(', '));return 'ok'});
  ok('serviceWorker',function(){return navigator.serviceWorker?'present':'unavailable'});
  ok('Sound module',function(){if(typeof Sound!=='object')throw new Error('missing');if(typeof Sound.chaChing!=='function')throw new Error('chaChing missing');return 'ok'});
  var pass=r.filter(function(x){return x.p}).length,tot=r.length;
  var html='<div style="max-height:55vh;overflow:auto;font-size:13px"><div style="margin-bottom:10px;font-weight:600">'+(pass===tot?'✅ ':'⚠ ')+pass+'/'+tot+' passed</div>'
    +r.map(function(x){return'<div style="padding:6px 0;border-bottom:1px solid var(--line)"><b class="'+(x.p?'ok':'neg')+'">'+(x.p?'PASS':'FAIL')+'</b> '+esc(x.n)+(x.p?' · <span class="mut">'+esc(String(x.v))+'</span>':' · <span class="neg">'+esc(x.e)+'</span>')+'</div>'}).join('')+'</div>';
  ask('Self test',html,function(){},'Close',1);
}
(function(){
  $('ob').addEventListener('click',function(e){if(e.target.id!=='setpin')return;$('ov').hidden=true;setTimeout(changeAdminPin,50)});
  var M="Claude Sonnet 5.5 · owner's Claude account";
  APP_VERSION='9.17';
  var backfilled=0;
  ['9.0','9.1','9.2','9.3','9.4'].forEach(function(v){var e=VERS.find(function(x){return x.v===v});if(e&&!e.by){e.by='Other Claude profile (model not recorded)';backfilled++}});
  VERS.unshift({v:'9.17',d:'2026-10-18',t:'Admin PIN change, self test and by backfill',by:M,n:['Change admin PIN from Settings','Run self test in Management','VERS.by backfilled for v9.0 to v9.4']});
})();

/* v9.18 Home dashboard + sample removal */
(function(){var M="Claude Sonnet 5.5 · owner's Claude account";APP_VERSION='9.18';
 VERS.unshift({v:'9.18',d:'2026-10-18',t:'Home dashboard: cash strip, owed summary, stock value',by:M,n:['Home today-cash strip','Home who-owes-whom card','Home stock value tile','Sample Load Riyad notes button removed']});
 BUGS.unshift({d:'2026-10-18 --:--',v:'9.18',w:M,a:'Sample "Load Riyad notes" could appear when customer list momentarily empty',b:'Button lived in empty-customers card',c:'Removed the button'});})();

/* v9.19 storage notice, sync dot, theme, transitions, refresh + bug fixes */
(function(){
  var M="Claude Sonnet 5.5 · owner's Claude account";
  APP_VERSION='9.19';
  VERS.unshift({v:'9.19',d:'2026-10-19',t:'Storage notice, sync dot, theme, transitions and refresh',by:M,n:['Storage warning only on real save failures; Dismiss works','Sync indicator single dot with calm periodic pulse; Motion button removed','Three-mode theme (Auto / Light / Dark) as a single top-bar icon','Tab fade-in animation','Refresh icon + spin animation','Self test and review-queue Open bug fixes']});
  BUGS.unshift(
    {d:'2026-10-18 --:--',v:'9.19',w:M,a:'Storage warning appeared on every save and could not be dismissed (blocked POS Charge)',b:'persist() called storageNotice() on every save and the box inline display:flex overrode the hidden attribute; Dismiss set hidden which had no effect',c:'storageNotice only on real failures; hidden state uses style.display; Dismiss sets display:none'},
    {d:'2026-10-18 --:--',v:'9.19',w:M,a:'Self test reported false failures for const-bound helpers',b:'selfTest used typeof window[name] which cannot see const bindings',c:'Use eval("typeof "+name)'},
    {d:'2026-10-18 --:--',v:'9.19',w:M,a:'Review queue Open for reconciliation item landed on today instead of entry date',b:'go(\'acc\') reset cur to today',c:'Call go(\'acc\') first then set cur and render'}
  );
})();

/* v9.20 owner feedback round 2 */
(function(){
  var M="Claude Sonnet 5.5 · owner's Claude account";
  APP_VERSION='9.20';
  VERS.unshift({v:'9.20',d:'2026-10-19',t:'Owner feedback round 2: wallets anchored to dates, POS void Test section, keeper tabs, party kinds',by:M,n:['Wallet openings are date-anchored: S.walletDates stores date-based anchors that reset the balance on their date; past dates require Admin PIN and log any discrepancy from the carried-forward balance','Management > Wallet openings shows full anchor history and lets you add dated openings','Cash adjustments for a past date require Admin PIN; those Adjustment entries store pinBy and pinAt','POS voids with reason exactly "test" go to a Test section (admin only) and are excluded from all totals; admin can also permanently remove a voided bill with a reason','Keeper tab list reduced to Products + More only','Party kinds are Customer / Investor / Supplier / Borrower-Lender with kind filter tabs in the Ledger; legacy Lender/Borrower treated as Borrower/Lender','POS search input cleared on every enter (no stale prefill)','Refresh no longer logs the session out when the UI throws inside enter()']});
  BUGS.unshift(
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'POS search pre-filled with stale content (e.g. "Accountant")',b:'#q value was never cleared on refresh',c:'POS.refresh() clears #q on every enter'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Refresh made the admin log out (same symptom as v8.9.1)',b:'Any throw inside enter() after resume() restored a valid session caused the outer catch to return false',c:'resume() wraps enter() in try/catch that logs the error but still returns true'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Voids could not be fully removed and had no test-only pathway',b:'void flow only set the flag',c:'voidBill auto-marks "test" reasons; admin gets removeBillPermanently with a reason'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Keeper had too many tabs (POS was in the list)',b:'TABS.keeper included POS',c:'Reduced to [prod, more]'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Wallet openings could only be set once and always applied from the beginning',b:'S.wallets was a single fixed value',c:'S.walletDates array; wltRun resets at each anchor; management dialog adds/removes anchors; past dates require Admin PIN'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Cash adjustments on a past date could be made without PIN or audit',b:'cashAdjust posted to nextOpenDay without re-verification',c:'Past-date targets require Admin PIN; Adjustment entry stores pinBy and pinAt'},
    {d:'2026-10-19 --:--',v:'9.20',w:M,a:'Party kinds did not map to the four groups the owner wanted',b:'cust.kind was free text with no filter',c:'Dropdown restricted to 4 kinds; Lender/Borrower treated as Borrower/Lender; kind filter tabs in ledList'}
  );
})();

/* ---------- v9.21: clock, Accounts void section ---------- */
/* ---------- v11.0: Desktop Watch, Weather, Bengali Calendar & Clock ---------- */
function getWeatherIcon(code){
  if(code===0)return'☀️';
  if(code===1||code===2)return'🌤️';
  if(code===3)return'☁️';
  if(code>=45&&code<=48)return'🌫️';
  if(code>=51&&code<=67)return'🌧️';
  if(code>=71&&code<=77)return'❄️';
  if(code>=80&&code<=82)return'🌦️';
  if(code>=95)return'⛈️';
  return'☀️';
}

function renderWeather(cur){
  var iconEl=$('hwIcon'),tempEl=$('hwTemp');
  if(!iconEl||!tempEl||!cur)return;
  var temp=Math.round(cur.temperature_2m);
  iconEl.textContent=getWeatherIcon(cur.weather_code);
  tempEl.textContent=S.lang==='bn'?(toBnNum(temp)+'°সে'):(temp+'°C');
}

function fetchDhakaWeather(){
  try{
    var cached=sessionStorage.getItem('ncs_weather_v1');
    if(cached){
      var parsed=JSON.parse(cached);
      if(Date.now()-parsed.ts<1800000){
        renderWeather(parsed.data);
        return;
      }
    }
  }catch(e){}
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return;
  try{
    fetch('https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current=temperature_2m,weather_code&timezone=Asia%2FDhaka')
      .then(function(r){return r.json()})
      .then(function(data){
        if(data&&data.current){
          try{sessionStorage.setItem('ncs_weather_v1',JSON.stringify({ts:Date.now(),data:data.current}))}catch(e){}
          renderWeather(data.current);
        }
      })
      .catch(function(){});
  }catch(e){}
}

function updateLiveWatch(now){
  var h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
  var h12=((h+11)%12+1);
  var ampmEn=h<12?'AM':'PM';
  var ampmBn=h<6?'রাত':h<12?'সকাল':h<15?'দুপুর':h<18?'বিকাল':'রাত';
  var isBn=S.lang==='bn';
  
  var timeStr=isBn
    ?(toBnNum(h12)+':'+toBnNum(String(m).padStart(2,'0'))+':'+toBnNum(String(s).padStart(2,'0'))+' '+ampmBn)
    :(String(h12)+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' '+ampmEn);
    
  var timeEl=$('hwTime');
  if(timeEl&&timeEl.textContent!==timeStr)timeEl.textContent=timeStr;
  
  var dow=now.getDay();
  var dColor=DAY_COLORS[dow];
  var dayName=isBn?DAY_NAMES_BN[dow]:DAY_NAMES_EN[dow];
  
  var dayEl=$('hwDay');
  if(dayEl){
    if(dayEl.textContent!==dayName)dayEl.textContent=dayName;
    dayEl.style.color=dColor;
    dayEl.style.backgroundColor=dColor+'18';
    dayEl.style.borderColor=dColor+'44';
  }
  
  var dateEl=$('hwDate');
  if(dateEl){
    var gDate=isBn
      ?(toBnNum(now.getDate())+' '+(['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'][now.getMonth()])+' '+toBnNum(now.getFullYear()))
      :(now.getDate()+' '+(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()])+' '+now.getFullYear());
    if(dateEl.textContent!==gDate)dateEl.textContent=gDate;
  }
  
  var bngEl=$('hwBng');
  if(bngEl){
    var bnDate=getBengaliDate(now);
    if(bngEl.textContent!==bnDate.text)bngEl.textContent=bnDate.text;
  }

  /* Bismillah banner & Shop name text */
  var bisEl=$('bismillahText');
  if(bisEl){
    var bisStr=isBn?'বিসমিল্লাহির রাহমানির রাহীম':'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';
    if(bisEl.textContent!==bisStr)bisEl.textContent=bisStr;
  }
  var snEl=$('shopNameTitle');
  if(snEl){
    var snStr=isBn?SHOP_BN:SHOP_EN;
    if(snEl.textContent!==snStr)snEl.textContent=snStr;
  }
}

function clkTick(){
  var x=new Date();
  updateLiveWatch(x);
  var isBn=S.lang==='bn';
  var h=x.getHours(),m=x.getMinutes();
  var h12=((h+11)%12+1);
  var ampmEn=h<12?'AM':'PM';
  var ampmBn=h<6?'রাত':h<12?'সকাল':h<15?'দুপুর':h<18?'বিকাল':'রাত';
  var T=isBn?(toBnNum(h12)+':'+toBnNum(String(m).padStart(2,'0'))+' '+ampmBn):t12(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'));
  var D='';
  try{D=x.toLocaleDateString(isBn?'bn-BD':'en-GB',{weekday:'short',day:'2-digit',month:'short'})}catch(e){D=sd(iso(x))}
  [['hClkT',T],['hClkD',D],['tclkT',T],['tclkD',D]].forEach(function(p){var el=$(p[0]);if(el&&el.textContent!==p[1])el.textContent=p[1]});
}
function clkVis(){var el=$('tclk');if(!el)return;var on=!!U&&CUR!=='home'&&(isA()||CUR===TABS[role()][0]);el.hidden=!on;if(on)clkTick()}
setInterval(function(){
  if(typeof document!=='undefined'&&document.hidden)return;
  clkTick();
},1000);
setTimeout(fetchDhakaWeather,600);
setInterval(fetchDhakaWeather,1800000);
function avBar(vd){var el=$('avBar');if(!el)return;if(!lEd()){el.innerHTML='';return}
  if(!vd.length&&!AV){el.innerHTML='';return}
  el.innerHTML='<div class="avbar"><span class="mut">'+(AV?lb('Showing voided entries only','শুধু বাতিল এন্ট্রি দেখানো হচ্ছে'):'')+'</span><button type="button" class="ghost'+(AV?' on':'')+'" data-av="1">'+(AV?'‹ '+lb('Back to entries','এন্ট্রিতে ফিরুন'):lb('Void data','বাতিল তথ্য')+' ('+vd.length+')')+'</button></div>'}
function avTable(vd,f){
  if(!vd.length)return'<div class="empty">'+lb('No void entries','কোনো বাতিল এন্ট্রি নেই')+'</div>';
  return'<table class="ltb"><thead><tr><th>'+lb('Time','সময়')+'</th><th>'+lb('Details','বিবরণ')+'</th><th>'+lb('Amount','টাকা')+'</th><th>'+lb('Reason','কারণ')+'</th><th></th></tr></thead><tbody>'+vd.slice(0,ACC_N).map(function(e){
    var act=isA()?((e.pos||e.lk||e.type==='Ledger')?'<small class="mut">'+(e.pos?lb('Restore from POS Bills','POS বিল থেকে ফেরান'):lb('Restore from Ledger','খাতা থেকে ফেরান'))+'</small>':'<button class="ghost pbtn" data-a="rs" data-i="'+e.id+'">'+lb('Restore','ফিরান')+'</button>'):'';
    return'<tr class="void"><td>'+(f?sd(e.d)+' ':'')+t12(e.t)+'</td><td class="d"><span class="b v">'+lb('Void','বাতিল')+'</span><span class="b o">'+esc(e.type)+'</span>'+esc(e.desc)+'<small>'+esc(e.cat||'')+(e.by?' · '+lb('By','এন্ট্রি')+' '+esc(e.by):'')+'</small></td><td>'+n(Math.abs(e.amt))+'</td><td class="d">'+esc(e.vr||'')+'<small>'+esc(e.vb||'')+'</small></td><td>'+act+attBtn('e'+e.id)+'</td></tr>'}).join('')+'</tbody></table>'}
function restoreEntry(id){var e=S.entries.find(function(x){return x.id===id});if(!e||!isA()||!e.void)return;
  if(e.pos||e.lk||e.type==='Ledger'){ltoast(lb('Restore this from POS Bills or the Ledger.','এটি POS বিল বা খাতা থেকে ফেরান।'));return}
  if(S.days[e.d]&&S.days[e.d].closed){ltoast(lb('That day is closed. Reopen it first.','ওই দিন বন্ধ। আগে দিনটি খুলুন।'));return}
  var c=Object.assign({},e,{void:0}),wf=wltEff(c);
  if(wf&&wf.d<0){var wc=checkWalletLimit(c,e.id,[wf.w]);if(!wc.ok){ltoast(lb('Cannot restore: ','ফেরানো যাবে না: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হয়ে যাবে।'));return}}
  ask(lb('Restore this entry?','এন্ট্রি ফিরিয়ে আনবেন?'),'<p>'+esc(e.desc)+' · <b>'+tk(Math.abs(e.amt))+'</b> · '+sd(e.d)+'</p><p class="mut" style="font-size:13px">'+lb('It returns to the day table and counts in totals and cash again.','এটি আবার দিনের তালিকায় আসবে এবং হিসাবে ধরা হবে।')+'</p>',function(){
    snap();e.void=0;e.vr='';e.vb='';e.rb=U.name;lg('Restore entry',e.type+' '+e.amt+' "'+e.desc+'"');save();render()},lb('Restore','ফিরান'))}
(function(){
  $('avBar').addEventListener('click',function(e){if(e.target.closest('[data-av]')){AV=!AV;ACC_N=150;render()}});
  $('tbl').addEventListener('click',function(e){var b=e.target.closest('[data-a="rs"]');if(b)restoreEntry(+b.dataset.i)});
})();

/* ---------- v9.21 release notes ---------- */
(function(){
  var M="Claude Sonnet 5.5 · owner's Claude account";
  APP_VERSION='9.21';
  VERS.unshift({v:'9.21',d:'2026-10-19',t:'Clock on every main tab, tidier phone top bar, Accounts void section',by:M,n:['Clock in the top bar: Admin sees it on every tab, other roles on their main (first) tab; Home keeps its large clock','Phone top bar tidied: theme, refresh and sync icons are equal-sized and evenly spaced; sync shows only its coloured dot on phones (status label kept for screen readers and on larger screens); the logo hides on very narrow screens','Voided entries no longer appear in the Accounts day table: Admin and Accountant open them from Void data (count shown), and Admin can restore an entry (blocked for POS bills, ledger-linked entries, closed days and wallet-negative cases)','Fixed: Home stopped drawing after the clock because its clock function was missing']});
  BUGS.unshift(
    {d:'2026-10-19 --:--',v:'9.21',w:M,a:'Home dashboard stopped rendering after the hero card (stats, charts and recent bills missing) and could look like a refresh logout',b:'homeUI() called clkTick(), which was never defined (ReferenceError mid-render)',c:'clkTick() is now defined; one shared function updates the Home and top-bar clocks'},
    {d:'2026-10-19 --:--',v:'9.21',w:M,a:'Voided entries cluttered the Accounts day table',b:'The day table listed void rows with a strike-through',c:'Voids are filtered out and shown in a separate Void data view for Admin and Accountant, with Admin restore'},
    {d:'2026-10-19 --:--',v:'9.21',w:M,a:'Theme, refresh and sync controls looked crowded and uneven in the phone top bar',b:'Sync showed a full text label next to two icon buttons beside the logo and shop name',c:'Equal-size icon buttons; sync is dot-only on phones; logo hidden on very narrow screens'});
  UPC.unshift({v:'9.21',s:'Done',t:['Clock on every main tab (Admin on every tab)','Phone top bar tidy-up','Voided Accounts entries moved to a Void data section with Admin restore']});
  var lt=UPC.find(function(x){return x.v==='Later'});if(lt){lt.t=['Sync key rotation (needs Apps Script)','Send only changed records (needs Apps Script)','Effectiveness pass (needs owner input)','Ledger sheet in Google Sheets (needs Apps Script)']}
  UPC.splice(UPC.indexOf(lt),0,{v:'9.22',s:'Planned',t:['Sub-accounts / linked customers: optional parent link, combined balance on the parent profile']},{v:'9.23',s:'Planned',t:['Loans tab: installments, monthly interest, due dates, payments linked to cash and wallets (design needs owner decisions)']})
})();

/* ---------- v9.22: sound engine, motion & wrapper download safety ---------- */
