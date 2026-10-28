function ledUI(){if(!U)return;var v=$('vLed');if(LC&&!S.cust.find(function(c){return c.id===LC}))LC=null;v.innerHTML=LC?ledProfile():ledList()}
function ledForm(dir,eid,fix){
  var ed=eid?S.ltx.find(function(t){return t.id===eid}):null,x=ed||{dir:dir,d:iso(new Date())},
  po=[...new Set(S.ltx.filter(function(t){return t.c===LC&&t.who}).map(function(t){return t.who}))],am=x.amt?(x.parts?x.parts.join('+'):x.amt):'';
  if(ed&&ed.src){ltoast(lb('This due sale was posted from Accounts or POS. Change it there.','এটি অ্যাকাউন্টস বা POS থেকে এসেছে।'));return}
  var lkSh=lEd()&&(!ed||ed.l9),lkOn=ed?!!ed.lnk:true;
  ask(lb('Entry','এন্ট্রি'),'<div class="f"><label>'+lb('Type','ধরন')+'</label><select id="lfd"><option value="in">পেলাম · Received</option><option value="out">দিলাম · Given</option><option value="borrow">Borrow · received, we owe</option><option value="lend">Lend · given, they owe</option></select></div><div class="f"><label>'+lb('Amount (e.g. 3060+5000+500)','টাকা (যেমন ৩০৬০+৫০০০+৫০০)')+'</label><input id="lfa" inputmode="tel" autocomplete="off" value="'+esc(am)+'"><small id="lfp" class="mut"></small></div><div class="f"><div class="mut">'+lb('Date and time recorded automatically: ','তারিখ ও সময় স্বয়ংক্রিয়: ')+'<b>'+sd(iso(new Date()))+' '+t12(nowT())+'</b></div><label style="margin-top:8px"><input id="lfx" type="checkbox" style="width:auto;height:auto" '+(ed?'checked':'')+'> '+lb('Use a different (previous) date','আগের তারিখ দিন')+'</label></div><div id="lfb" '+(ed?'':'hidden')+'><div class="f"><label>'+lb('Date','তারিখ')+'</label><input id="lfs" type="date" value="'+(x.d||'')+'"></div><div class="f"><label>'+lb('To date (optional)','শেষ তারিখ (ঐচ্ছিক)')+'</label><input id="lfe" type="date" value="'+(x.d2||'')+'"></div><div class="f"><label><input id="lfu" type="checkbox" style="width:auto;height:auto" '+(ed&&!ed.d?'checked':'')+'> '+lb('Date unknown','তারিখ জানা নেই')+'</label></div></div><div class="f"><label>'+lb('Method','মাধ্যম')+'</label><select id="lfm">'+['Cash','Bkash Personal','Bkash Agent','Nagad','Rocket','Bank','Other'].map(function(m){return '<option'+(mN(x.m)===m?' selected':'')+'>'+m+'</option>'}).join('')+'</select></div>'+(lkSh?'<div class="f"><label><input id="lfk2" type="checkbox" style="width:auto;height:auto" '+(lkOn?'checked':'')+'> '+lb('Also record in cash / wallet','ক্যাশ / ওয়ালেটেও লিখুন')+'</label></div>':'')+'<div class="f"><small id="lfk" class="mut"></small></div><div class="f"><label>'+lb('Paid to / received from','কাকে / কার কাছ থেকে')+'</label><input id="lfw" list="lfl" maxlength="60" value="'+esc(x.who||'')+'"><datalist id="lfl">'+po.map(function(p){return '<option value="'+esc(p)+'">'}).join('')+'</datalist></div><div class="f"><label>'+lb('Note','নোট')+'</label><input id="lfn" maxlength="200" value="'+esc(x.note||'')+'"></div>'+(ed&&role()==='accountant'&&!fix?'<div class="f"><label>'+lb('Reason for edit (sent to Admin)','সম্পাদনার কারণ')+'</label><input id="lfr" maxlength="160"></div>':''),function(){
    var p=parseAmt($('lfa').value);if(!p){Sound.buzz();$('lfa').style.borderColor='var(--neg)';return false}
    var mn=$('lfx').checked,d=mn?($('lfu').checked?'':$('lfs').value):(ed?ed.d:iso(new Date())),e2=mn?$('lfe').value:(ed?ed.d2||'':''),o={t:(ed&&!fix)?ed.t:nowT(),dir:($('lfd').value==='borrow'?'in':$('lfd').value==='lend'?'out':$('lfd').value),btype:($('lfd').value==='borrow'?'Borrow':$('lfd').value==='lend'?'Lend':''),amt:p.reduce(function(a,b){return a+b},0),parts:p.length>1?p:null,d:d,d2:d&&e2>d?e2:'',m:$('lfm').value,who:$('lfw').value.trim(),note:$('lfn').value.trim()},cn=cname();
    var cb=$('lfk2'),mv=ledMove(o),want=cb?cb.checked:(ed?!!ed.lnk:true),legacy=!!ed&&!ed.l9,ofl={},eligible=!!mv&&!!o.d&&want;
    if(!ed)ofl={l9:1,lnk:eligible?1:0,le:S.epoch||0};
    else if(fix||!lEd()){if(!legacy)ofl={l9:1,lnk:(mv&&o.d)?1:0,le:S.epoch||0}}
    else if(!legacy)ofl={lnk:eligible?1:0,le:S.epoch||0};
    var le0=ed?S.entries.find(function(x){return x.id===LKid(ed)}):null;
    if(le0&&S.days[le0.d]&&S.days[le0.d].closed){ltoast(lb('That day is closed. Reopen it first.','ওই দিন বন্ধ।'));return false}
    var will=ofl.lnk!==undefined?!!ofl.lnk:(ed?ledLive(ed):false);
    if(will&&mv&&mv.w){var hy=ledEntry({id:ed?ed.id:0,c:LC,dir:o.dir,amt:o.amt,d:o.d,t:o.t,m:o.m,by:U.name}),wc=checkWalletLimit(Object.assign({id:Date.now()+3e13},hy),le0?le0.id:null,[mv.w]);if(!wc.ok){Sound.buzz();ltoast(lb('Not saved: ','সংরক্ষণ হয়নি: ')+wc.wallet+lb(' would go below zero.',' ঋণাত্মক হবে।'));return false}}
    if(ed&&role()==='accountant'&&!fix){var why=$('lfr')?$('lfr').value.trim():'';if(!why){$('lfr').style.borderColor='var(--neg)';return false}ed.prop={state:'pending',by:U.name,at:Date.now(),reason:why,to:Object.assign({},o,ofl)};lg('Ledger edit proposed',cn+' · '+tk(o.amt)+' — '+why);save();ledUI();ltoast(lb('Sent for Admin review','অ্যাডমিন পর্যালোচনায় পাঠানো হয়েছে'));return}else if(ed&&lEd()&&!fix){Object.assign(ed,o,ofl,{eb:U.name});lg('Ledger edit',cn+' · '+tk(o.amt))}
    else{if(ed){ed.void=1;ed.vr='Corrected';ed.vb=U.name}S.ltx.push(Object.assign({id:Date.now(),c:LC,by:U.name},o,ofl,ed?{fix:ed.id}:{}));lg('Ledger '+(ed?'correction':o.dir==='in'?'received':'given'),cn+' · '+tk(o.amt))}
    save();Sound.chaChing();saveCheck();ledUI();if(will&&mv&&!mv.w&&cashBook()<0)ltoast(lb('Warning: cash balance is below zero','সতর্কতা: ক্যাশ ব্যালেন্স ঋণাত্মক'))},lb('Save','সংরক্ষণ'));
  $('lfd').value=x.btype==='Borrow'?'borrow':x.btype==='Lend'?'lend':x.dir;var pv=function(){var p=parseAmt($('lfa').value),s=p?p.reduce(function(a,b){return a+b},0):0;$('lfp').textContent=p?'= '+tk(s):'';lkHint(s,ed)};$('ob').oninput=pv;$('ob').onchange=function(){$('lfb').hidden=!$('lfx').checked;pv()};pv()}
function ledVoid(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||t.src)return;
  ask(lb('Void this entry?','এন্ট্রি বাতিল করবেন?'),'<div class="f"><label>'+lb('Reason','কারণ')+'</label><input id="lvr" maxlength="120"></div>',function(){var r=$('lvr').value.trim();if(!r){$('lvr').style.borderColor='var(--neg)';return false}if(ledVoidBlocked(t))return false;t.void=1;t.vr=r;t.vb=U.name;lg('Ledger void',cname()+' · '+tk(t.amt)+' · '+r);save();ledUI()},lb('Void','বাতিল'))}
function ledVoidReq(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||t.void||t.src)return;
  if(t.voidReq&&t.voidReq.state==='pending'){ltoast(lb('A void request is already pending','বাতিলের অনুরোধ অপেক্ষমাণ'));return}
  if(ledVoidBlocked(t))return;
  ask(lb('Request void','বাতিলের অনুরোধ'),'<div class="f"><label>'+lb('Reason (required)','কারণ (আবশ্যক)')+'</label><input id="lvr" maxlength="120"></div><p class="mut" style="font-size:13px">'+lb('Admin must approve this request before the entry is voided.','অ্যাডমিন অনুমোদনের আগে বাতিল হবে না।')+'</p>',function(){var r=$('lvr').value.trim();if(!r){$('lvr').style.borderColor='var(--neg)';return false}t.voidReq={state:'pending',by:U.name,at:Date.now(),reason:r};lg('Ledger void requested',cname()+' · '+tk(t.amt)+' — '+r);save();ledUI();ltoast(lb('Sent for Admin review','অ্যাডমিন পর্যালোচনায় পাঠানো হয়েছে'))},lb('Request','অনুরোধ'))}
function ledVoidReqReview(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA()||!t.voidReq||t.voidReq.state!=='pending')return;
  if(ledVoidBlocked(t))return;
  var q=t.voidReq;
  ask(lb('Void request','বাতিলের অনুরোধ'),'<p class="mut">'+esc(q.by)+' · '+esc(q.reason)+'</p><p>'+tk(t.amt)+' · '+dr(t)+'</p><div class="f" style="margin-top:10px"><label>'+lb('Reason to reject','প্রত্যাখ্যানের কারণ')+'</label><input id="lvr2" maxlength="160"></div><button type="button" class="ghost" id="lvrj" style="color:var(--neg)">'+lb('Reject','প্রত্যাখ্যান')+'</button>',function(){
      t.void=1;t.vr=q.reason;t.vb=q.by;t.vb2=U.name;
      t.voidReq.state='approved';t.voidReq.rb=U.name;t.voidReq.ra=Date.now();
      lg('Ledger void approved',cname()+' · '+tk(t.amt)+' · by '+q.by);
      save();ledUI();
    },lb('Approve','অনুমোদন'));
  $('ob').onclick=function(e){if(e.target.id!=='lvrj')return;var w=$('lvr2').value.trim();if(!w){$('lvr2').style.borderColor='var(--neg)';return}t.voidReq.state='rejected';t.voidReq.rb=U.name;t.voidReq.ra=Date.now();t.voidReq.rr=w;lg('Ledger void rejected',cname()+' · '+tk(t.amt)+' — '+w);save();$('ov').hidden=true;ledUI()}}
function ledFlagReject(id){var t=S.ltx.find(function(x){return x.id===id});if(!t||!isA()||!t.flag||t.flag.state!=='pending')return;
 ask(lb('Reject flag','চিহ্ন প্রত্যাখ্যান'),'<div class="f"><label>'+lb('Reason (required)','কারণ (আবশ্যক)')+'</label><input id="lfr2" maxlength="160"></div>',function(){var r=$('lfr2').value.trim();if(!r){$('lfr2').style.borderColor='var(--neg)';return false}t.flag.state='rejected';t.flag.rb=U.name;t.flag.ra=Date.now();t.flag.rr=r;lg('Ledger flag rejected',cname()+' · '+tk(t.amt)+' — '+r);save();ledUI()},lb('Reject','প্রত্যাখ্যান'))}
function ledTx(id){var t=S.ltx.find(function(x){return x.id===id});if(!t)return;
  var row=function(a,b){return b?'<div class="f"><label>'+a+'</label><div>'+b+'</div></div>':''},
  mv=ledMove(t),live=ledLive(t),chk=ledChk(t)&&lEd(),
  cf=(live&&mv)?row(lb('Cash flow','ক্যাশ ফ্লো'),esc(mv.w?wN(mv.w):lb('Cash balance','ক্যাশ ব্যালেন্স'))+' '+(t.dir==='in'?'+':'−')+tk(t.amt)+(t.void?' ('+lb('reversed','উল্টানো')+')':'')):'',
  btn=function(k,l,st){return'<button class="ghost" data-k="'+k+'"'+(st?' style="'+st+'"':'')+'>'+l+'</button>'};
  var foot='';
  if(!t.void&&!t.src){
    if(t.voidReq&&t.voidReq.state==='pending'){foot+=(isA()?btn('vr',lb('Review void request','বাতিলের অনুরোধ দেখুন')):'<span class="mut" style="padding:4px 8px">'+lb('Void requested — awaiting Admin','বাতিলের অনুরোধ অপেক্ষমাণ')+'</span>')}
    else{if(lEd())foot+=btn('e',lb('Edit','সম্পাদনা'));if(isA())foot+=btn('v',lb('Void','বাতিল'),'color:var(--neg)');else if(role()==='accountant')foot+=btn('vrq',lb('Request void','বাতিলের অনুরোধ'),'color:var(--neg)')}
    foot+=btn('at',lb('Photo','ছবি')+' ('+attN('l'+t.id)+')');
    if(!isA())foot+=btn('fl',lb('Flag for Admin check','চিহ্নিত করুন'));
    if(isA()&&t.flag&&t.flag.state==='pending'){foot+=btn('fc',lb('Clear flag','চিহ্ন সরান'));foot+=btn('fr',lb('Reject flag','প্রত্যাখ্যান'),'color:var(--neg)')}
    if(isA()&&t.prop&&t.prop.state==='pending')foot+=btn('pr',lb('Review proposed edit','সম্পাদনা দেখুন'));
    if(chk&&isA()){if(mv&&t.d)foot+=btn('l',lb('Link to cash flow','ক্যাশে যুক্ত করুন'));foot+=btn('a',lb('Accept as is','গ্রহণ'))}
    if(possibleDupLedger(t)&&isA())foot+=btn('dd','Dismiss duplicate');
  }
  var flagRow=(t.flag?row(lb('Flag','চিহ্ন'),esc(t.flag.reason)+' · '+esc(t.flag.by)+' ('+t.flag.state+')'+(t.flag.rr?' · '+lb('Rejected','প্রত্যাখ্যাত')+': '+esc(t.flag.rr):'')):'');
  var propRow=(t.prop?row(lb('Proposed edit','প্রস্তাবিত সম্পাদনা'),esc(t.prop.reason)+' · '+esc(t.prop.by)+' ('+t.prop.state+')'+(t.prop.rr?' · '+lb('Rejected','প্রত্যাখ্যাত')+': '+esc(t.prop.rr):'')):'');
  var voidReqRow=(t.voidReq?row(lb('Void request','বাতিলের অনুরোধ'),esc(t.voidReq.reason)+' · '+esc(t.voidReq.by)+' ('+t.voidReq.state+')'+(t.voidReq.rr?' · '+lb('Rejected','প্রত্যাখ্যাত')+': '+esc(t.voidReq.rr):'')):'');
  ldlg(t.btype||(t.dir==='in'?'পেলাম · Received':'দিলাম · Given'),
    row(lb('Amount','টাকা'),'<b>'+tk(t.amt)+'</b>'+(t.parts?' = '+t.parts.map(n).join(' + '):''))
    +row(lb('Date','তারিখ'),dr(t)+(t.t?' · '+t12(t.t):''))
    +row(lb('Method','মাধ্যম'),esc(mL(t.m)))
    +row(lb('Party','পক্ষ'),esc(t.who))
    +row(lb('Note','নোট'),esc(t.note))
    +row(lb('Entered by','এন্ট্রি করেছেন'),esc(t.by))
    +row(lb('Last edited by','সম্পাদনা করেছেন'),esc(t.eb))
    +flagRow+propRow+voidReqRow+cf
    +(t.src?'<div class="mut" style="margin-top:8px">'+lb('Due sale posted automatically.','স্বয়ংক্রিয়ভাবে এসেছে।')+'</div>':'')
    +(chk?'<div class="mut" style="margin-top:8px"><span class="b ctag">'+lb('Check','যাচাই')+'</span></div>':'')
    +(t.void?row('VOID',esc(t.vr)+' · '+esc(t.vb)):(foot?'<div class="foot" style="justify-content:flex-start">'+foot+'</div>':'')),
    function(){},lb('Close','বন্ধ'),1);
  $('ob').onclick=function(e){var b=e.target.closest('[data-k]');if(!b)return;$('ov').hidden=true;var k=b.dataset.k;
    if(k==='dd'){t.dupDismissed=1;save();ledUI()}
    else if(k==='e')ledForm(t.dir,t.id);
    else if(k==='f')ledForm(t.dir,t.id,1);
    else if(k==='l')ledLink(t.id);
    else if(k==='a')ledAccept(t.id);
    else if(k==='at')attUI('l'+t.id);
    else if(k==='fl')ledFlag(t.id);
    else if(k==='fc')ledFlagClear(t.id);
    else if(k==='fr')ledFlagReject(t.id);
    else if(k==='pr')ledPropReview(t.id);
    else if(k==='vr')ledVoidReqReview(t.id);
    else if(k==='vrq')ledVoidReq(t.id);
    else if(k==='v')ledVoid(t.id);
  };
}
var VMON={en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],bn:['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে']};
var VHG=[{f:function(v){return v.v.split('.')[0]==='9'},e:'Version 9 · Cash flow linked',b:'ভার্সন ৯ · ক্যাশ ফ্লো সংযুক্ত'},{f:function(v){return v.v.split('.')[0]==='8'},e:'Version 8 · Role-based app',b:'ভার্সন ৮ · রোল-ভিত্তিক অ্যাপ'},{f:function(v){var m=v.v.split('.')[0];return m!=='8'&&m!=='9'},e:'Versions 1 to 7 · Foundations',b:'ভার্সন ১ থেকে ৭ · ভিত্তি'}];
function vhDate(d){var p=String(d).split('-');if(p.length<3)return esc(d);return(+p[2])+' '+VMON[S.lang==='bn'?'bn':'en'][+p[1]-1]+' '+p[0]}
function verTxt(){var o='NCS Daily Accounts - Version history\n\n';VHG.forEach(function(g){var L=VERS.filter(g.f);if(!L.length)return;o+='== '+g.e+' ==\n\n';L.forEach(function(v){o+='v'+v.v+' ('+v.d+') '+(v.t||'')+'\n'+(v.by?'  Built by: '+v.by+'\n':'')+v.n.map(function(x){return'  - '+x}).join('\n')+'\n\n'})});return o+'Versions 1 to 7 were rebuilt from the project history.\n'}
function vhHTML(){return'<div class="vhbar"><small class="mut">'+VERS.length+' '+lb('versions','সংস্করণ')+' · '+lb('latest','সর্বশেষ')+' v'+esc(VERS[0].v)+'</small><button class="ghost" data-vh="all" style="height:32px;font-size:13px">'+lb('Expand all','সব খুলুন')+'</button></div>'+
  VHG.map(function(g,gi){var L=VERS.filter(g.f);if(!L.length)return'';
    return'<div class="vhg'+(gi===0?' on':'')+'"><button class="vhgh" data-vg="1"><b>'+lb(g.e,g.b)+'</b><small>'+vhDate(L[L.length-1].d)+' – '+vhDate(L[0].d)+' · '+L.length+'</small><i class="vhc">▾</i></button><div class="vhgb">'+
    L.map(function(v){var top=v===VERS[0];return'<div class="vhv'+(top?' on':'')+'"><button class="vhh" data-vv="1"><span class="vhn">v'+esc(v.v)+'</span><span class="vht">'+esc(v.t||'')+'</span>'+(top?'<span class="b">'+lb('Latest','সর্বশেষ')+'</span>':'')+'<span class="vhd">'+vhDate(v.d)+'</span><i class="vhc">▾</i></button><div class="vhx"><ul>'+v.n.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul>'+(v.by?'<div class="vhby">'+lb('Built by','তৈরি করেছে')+': '+esc(v.by)+'</div>':'')+'</div></div>'}).join('')+'</div></div>'}).join('')+
  '<div class="vhnote">'+lb('Versions 1 to 7 were rebuilt from the project history.','ভার্সন ১ থেকে ৭ প্রকল্পের ইতিহাস থেকে।')+'</div>'}
function verUI(){ask(lb('Version history','সংস্করণ ইতিহাস')+' · v'+APP_VERSION,'<div class="vhw">'+vhHTML()+'</div>',function(){dlFile('NCS_Version_History.txt',verTxt());return false},lb('Export .txt','এক্সপোর্ট .txt'),1);
  $('ob').onclick=function(e){var h=e.target.closest('[data-vv]'),g=e.target.closest('[data-vg]'),a=e.target.closest('[data-vh]');
    if(h)h.parentNode.classList.toggle('on');else if(g)g.parentNode.classList.toggle('on');
    else if(a){var all=a.dataset.vh==='all';$('ob').querySelectorAll('.vhg,.vhv').forEach(function(x){x.classList.toggle('on',all)});a.dataset.vh=all?'none':'all';a.textContent=all?lb('Collapse all','সব বন্ধ করুন'):lb('Expand all','সব খুলুন')}}}
(function(){
  var v=$('vLed');
  v.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,id=+b.dataset.id;if(a==='open'&&Date.now()-LP<700)return;
    if(a==='open'||a==='opensub'||a==='openparent'){LC=id;LT='led';LF=LE='';ledUI();scrollTo(0,0)}else if(a==='back'){LC=null;ledUI()}else if(a==='incsubs'){window._incSubsStatement=!window._incSubsStatement;ledUI()}else if(a==='ledmore'){var mm=$('ledMoreMenu');if(mm)mm.style.display=(mm.style.display==='none'||!mm.style.display)?'block':'none';e.stopPropagation();return;}else if(a==='newc')ledCust();else if(a==='editc'){var mm=$('ledMoreMenu');if(mm)mm.style.display='none';ledCust(LC);}else if(a==='due'){var mm=$('ledMoreMenu');if(mm)mm.style.display='none';ledDue(LC);}else if(a==='kind'){LK=b.dataset.f;ledUI()}else if(a==='flt'){LS=b.dataset.f;ledUI()}else if(a==='restore')ledRestore(id);else if(a==='crestore'){var cc=S.cust.find(function(x){return x.id===id});if(cc){cc.del=0;cc.dby='';cc.delReason='';lg('Ledger party','Restored '+cc.name);save();ledUI()}}
    else if(a==='in'||a==='out'||a==='borrow'||a==='lend')ledForm(a);else if(a==='tab'){LT=b.dataset.t;ledUI()}else if(a==='tx')ledTx(id);else if(a==='accall')ledAcceptAll(LC);
    else if(a==='savenote'){var c=S.cust.find(function(x){return x.id===LC});c.note=$('lnt').value;lg('Ledger note',c.name+' · note updated');save();ltoast(lb('Saved','সংরক্ষিত'))}
    else if(a==='fltclr'){LFQ=LFD=LFM=LFA=LFB='';ledUI()}else if(a==='img')ledImg();else if(a==='due')ledDue(LC);else if(a==='print'){document.body.classList.add('lp');lg('Ledger print',cname());save();window.print()}
    else if(a==='csv'){var q=csvCell,all=lSort(S.ltx.filter(function(x){return x.c===LC&&!x.void})),rows=[['Date','Time','Type','Party','Method','Received','Given','Balance','Status','Note'].map(q).join(',')];
      ledRows(all,LF,LE).forEach(function(r){var x=r[0];rows.push([q(x.d?x.d+(x.d2?' to '+x.d2:''):'unknown'),q(x.t||''),q(x.dir==='in'?'Received':'Given'),q(x.who),q(mN(x.m)||''),x.dir==='in'?x.amt:'',x.dir==='out'?x.amt:'',r[1],q(x.void?'VOID: '+x.vr:'Active'),q(x.note)].join(','))});dlFile('Ledger_'+cname()+'.csv',rows.join('\n'))}});
  v.addEventListener('input',function(e){if(e.target.id==='lq'){LQ=e.target.value;ledUI();var i=$('lq');i.focus();i.setSelectionRange(99,99)}});
  v.addEventListener('change',function(e){if(e.target.id==='lsa'||e.target.id==='lse'){LF=$('lsa').value;LE=$('lse').value;ledUI()}});
  window.addEventListener('afterprint',function(){document.body.classList.remove('lp')});
  })();
(function(){
  var v=$('vLed'),hp=document.createElement('div'),HT,HH,TP;hp.id='lhp';hp.className='card';hp.hidden=true;document.body.appendChild(hp);
  function hide(){clearTimeout(HT);hp.hidden=true}
  function dlgFor(id){var c=S.cust.find(function(x){return x.id===id});if(!c)return;hide();ldlg(lb('Party summary','পক্ষ সারাংশ'),ledSum(c),function(){},lb('Close','বন্ধ'),1);$('ob').onclick=function(e){lAct(e,function(){$('ov').hidden=true})}}
  v.addEventListener('mouseover',function(e){if(!matchMedia('(hover:hover)').matches)return;var el=e.target.closest('.lcc');if(!el)return;clearTimeout(HH);clearTimeout(HT);HT=setTimeout(function(){var c=S.cust.find(function(x){return x.id===+el.dataset.id});if(!c)return;hp.innerHTML=ledSum(c);hp.hidden=false;var r=el.getBoundingClientRect();hp.style.left=Math.max(8,Math.min(r.left,innerWidth-300))+'px';hp.style.top=(r.bottom+6+250>innerHeight?Math.max(8,r.top-256):r.bottom+6)+'px'},350)});
  v.addEventListener('mouseout',function(e){if(e.target.closest('.lcc')){clearTimeout(HT);HH=setTimeout(hide,250)}});
  hp.addEventListener('mouseenter',function(){clearTimeout(HH)});hp.addEventListener('mouseleave',function(){HH=setTimeout(hide,200)});hp.addEventListener('click',function(e){lAct(e,hide)});
  v.addEventListener('touchstart',function(e){var el=e.target.closest('.lcc');if(!el)return;TP=setTimeout(function(){LP=Date.now();dlgFor(+el.dataset.id)},550)},{passive:true});
  ['touchend','touchmove','touchcancel'].forEach(function(t){v.addEventListener(t,function(){clearTimeout(TP)},{passive:true})});
  v.addEventListener('contextmenu',function(e){var el=e.target.closest('.lcc');if(!el)return;e.preventDefault();if(Date.now()-LP<900)return;LP=Date.now();dlgFor(+el.dataset.id)});
  document.addEventListener('scroll',hide,{passive:true});
  document.addEventListener('click',function(e){var mm=$('ledMoreMenu');if(mm&&!e.target.closest('.led-more-wrap'))mm.style.display='none';});
})();
function synNote(){return SY()?'':'<div class="card" style="grid-column:1/-1;padding:12px;border-color:var(--warn)"><b>'+lb('Sync is off on this device','এই ডিভাইসে সিঙ্ক বন্ধ')+'</b><br><small>'+lb('Products added on other devices will not appear here until sync is set up.','অন্য ডিভাইসের পণ্য দেখা যাবে না যতক্ষণ সিঙ্ক না হয়।')+'</small></div>'}

var LRN;
var BUGS=[
 {d:'2026-10-16 21:20',v:'9.5',w:'Other Claude profile',a:'Start fresh left stale opening cash after sync',b:'Merge branch did not copy remote S.start',c:'Copy remote S.start when R.epoch newer'},
 {d:'2026-10-16 21:11',v:'9.5',w:'Other Claude profile',a:'Initial v9.5 patch draft failed parsing',b:'Arrow matcher emitted as function declaration',c:'Restored arrow form, balanced braces'},
 {d:'2026-10-16 18:37',v:'9.1',w:'Other Claude profile',a:'Accounts tab stayed on previous date',b:'Startup used last entry date',c:'cur reset at startup and in go(\'acc\')'},
 {d:'2026-10-16 --:--',v:'9.0',w:'Other Claude profile',a:'Shop name on phone bottom tab',b:'Global .tabs::before rule',c:'Limited to @media min-width 900'},
 {d:'2026-10-16 --:--',v:'8.9.1',w:'Claude Sonnet 5.5',a:'Refresh logged every role out',b:'renderWalletCards used lists declared after start()',c:'Moved lists above start(); wrapped in try/catch'},
 {d:'2026-10-16 --:--',v:'8.7',w:'Claude Sonnet 5.5',a:'Ledger dialog did nothing',b:'Called POS-private dlg and toast',c:'Use ask, ldlg, ltoast'},
 {d:'2026-10-15 --:--',v:'8.5',w:'Claude Sonnet 5.5',a:'Ledger table styled like POS total',b:'.lt belongs to POS',c:'Ledger uses .ltb'}
];
function bugTxt(){return'NCS Daily Accounts - Bug Fixing\n\n'+BUGS.map(function(x){return x.d+' · v'+x.v+' · '+x.w+'\n  Wrong: '+x.a+'\n  Cause: '+x.b+'\n  Fix: '+x.c}).join('\n\n')+'\n'}
function bcard(id,title,exp,body){return'<div class="card bcd" data-bc="'+id+'"><button class="bch" aria-expanded="false" data-bt="'+id+'"><h3 class="mgh" style="margin:0">'+title+'</h3><span class="bcx">'+exp+'<i class="vhc">&#9662;</i></span></button><div class="bcb">'+body+'</div></div>'}
function bugBody(){return BUGS.map(function(x){return'<div class="upg"><div><b>v'+esc(x.v)+'</b> <span class="b o">'+esc(x.d)+'</span> <span class="mut">'+esc(x.w)+'</span></div><div class="upi">'+lb('Wrong','সমস্যা')+': '+esc(x.a)+'</div><div class="upi">'+lb('Cause','কারণ')+': '+esc(x.b)+'</div><div class="upi">'+lb('Fix','সমাধান')+': '+esc(x.c)+'</div></div>'}).join('')}
(function(){var st=document.createElement('style');st.textContent='.bcd{padding:16px}.bch{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;background:none;border:0;color:var(--ink);cursor:pointer;padding:0;font:inherit;text-align:left;height:auto}.bcx{display:flex;align-items:center;gap:10px}.bcb{display:none;margin-top:6px}.bcd.on .bcb{display:block}.bcd.pv:not(.on) .bcb{display:block;max-height:150px;overflow:hidden;opacity:.85}.bcd.on .bch .vhc{transform:rotate(180deg)}';document.head.appendChild(st)})();
var UPC=[{v:'Later',s:'Planned',t:['Sync key rotation (needs Apps Script)','Send only changed records (needs Apps Script)','Effectiveness pass','Ledger sheet in Google Sheets','Sub-accounts or linked customers']}];
function upcTxt(){return'NCS Daily Accounts - Upcoming Features\n\n'+UPC.map(function(g){return g.v+' ('+g.s+')\n'+g.t.map(function(x){return'  - '+x}).join('\n')}).join('\n\n')+'\n'}
