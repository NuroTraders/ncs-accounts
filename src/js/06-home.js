/* ---------- home ---------- */
const PER=[['today','Today'],['yest','Yesterday'],['7','7 days'],['30','1 month'],['90','3 months'],['180','6 months'],['all','Overall']];let HP='today';
function prange(p){const t=new Date(),a=new Date();if(p==='today')return[iso(t),iso(t)];if(p==='yest'){a.setDate(a.getDate()-1);return[iso(a),iso(a)]}if(p==='all')return['0000','9999'];a.setDate(a.getDate()-(+p-1));return[iso(a),iso(t)]}
function homeUI(){try{renderWalletCards()}catch(e){}try{applyCardSettings()}catch(e){}
  $('hTitle').textContent=lb('Hello, ','হ্যালো, ')+(U?U.name:'');
  $('hQa').querySelectorAll('[data-q]').forEach(function(b){var k=b.dataset.q,l=k==='sale'?lb('New sale','নতুন বিক্রয়'):k==='purchase'?lb('New purchase','নতুন ক্রয়'):k==='acc'?lb('Accounts','হিসাব'):lb("Today's bills",'আজকের বিল');b.querySelector('.qal').textContent=l});
  $('hTabs').innerHTML=PER.map(([k,l])=>`<button data-p="${k}" class="${HP===k?'on':''}">${l}</button>`).join('');
  const[a,b]=prange(HP),E=S.entries.filter(e=>!e.void&&!e.removed&&e.d>=a&&e.d<=b),B=S.bills.filter(x=>!x.void&&!x.removed&&!x.test&&x.d>=a&&x.d<=b);
  const sm=(t,f)=>E.filter(e=>e.type===t&&!isWalletTransfer(e)&&(!f||f(e))).reduce((s,e)=>s+e.amt,0),m=calc(),act=sorted().filter(e=>!e.void),cb=act.length?m[act[act.length-1].id].bal:(+S.start||0);
  const C=(l,v,c,num)=>`<div class="stat ${c||''}"><small>${l}</small><b${num!=null?' class="cnt" data-to="'+num+'"':''}>${v}</b></div>`;
  $('hHero').innerHTML=`<div class="dclk" id="hClk" aria-label="${lb('Current time','বর্তমান সময়')}"><b id="hClkT"></b><small id="hClkD"></small></div><small>Cash Balance</small><b class="cnt" data-to="${cb}">${tk(cb)}</b><i>${sd(iso(new Date()))} · ${esc(U?U.name:'')}</i>`;clkTick();
  var sellT=sm('Sale'),buyT=sm('Purchase');$('hStats').innerHTML=C('Total Sell',tk(sellT),'t3',sellT)+C('Total Buy',tk(buyT),'t2',buyT)+C('Bills',B.length,'t4')+C('To receive (Due)',tk(sm('Sale',e=>e.pay==='Due')),'t1')+C('To give (Due)',tk(sm('Purchase',e=>e.pay==='Due')),'sf');
  if(canCost()){try{var smap=(POS&&typeof POS.stockMap==='function')?POS.stockMap():{},sv=S.products.filter(function(p){return!p.del}).reduce(function(s,p){return s+Math.max(0,smap[p.id]||0)*(+p.buy||0)},0);$('hStats').insertAdjacentHTML('beforeend',C('Stock value (cost)',tk(sv),'sf'))}catch(e){}}
  var todayE=S.entries.filter(function(e){return!e.void&&!e.removed&&e.d===iso(new Date())}),inT=0,outT=0;
  todayE.forEach(function(e){var c=cash(e);if(c>0)inT+=c;else if(c<0)outT+=-c});
  var netT=inT-outT;
  $('hToday').innerHTML=(todayE.length
    ?'<span class="tpill pos"><small>'+lb('Cash in','নগদ এসেছে')+'</small><b>'+tk(inT)+'</b></span>'
     +'<span class="tpill neg"><small>'+lb('Cash out','নগদ গেছে')+'</small><b>'+tk(outT)+'</b></span>'
     +'<span class="tpill net"><small>'+lb('Net','নিট')+'</small><b>'+(netT>0?'+':netT<0?'−':'')+tk(Math.abs(netT))+'</b></span>'
     +'<span class="tpill"><small>'+lb('Entries','এন্ট্রি')+'</small><b>'+todayE.length+'</b></span>'
    :'<span class="tpill mut">'+lb('No cash movements today','আজ কোনো নগদ লেনদেন নেই')+'</span>');
  (function(){
    var canOpen=isA()||role()==='accountant'||role()==='cashier';
    var custAll=S.cust.filter(function(c){return!c.del});
    if(!custAll.length||!canOpen){$('hOwe').hidden=true;$('hOwe').innerHTML='';return}
    var recv=0,pay=0,recvN=0,payN=0;
    custAll.forEach(function(c){var s=lStat(c);if(s.b<0){recv+=-s.b;recvN++}else if(s.b>0){pay+=s.b;payN++}});
    var net=recv-pay,netLabel=recv>=pay?lb('Net receivable','নিট পাওনা'):lb('Net payable','নিট দেনা');
    $('hOwe').hidden=false;
    $('hOwe').innerHTML='<div class="howe-head"><h3 class="dchh" style="padding:0;margin:0;font-size:15px">'+lb('Who owes whom','কার কাছে পাওনা / দেনা')+'</h3><button class="ghost" data-q="owe-led">'+lb('Open Ledger','খাতা খুলুন')+' →</button></div>'
      +'<div class="howe-body">'
      +'<div class="howe-box recv"><small>'+lb('They owe us','আমরা পাব')+'</small><b>'+tk(recv)+'</b><i>'+recvN+' '+lb('parties','পক্ষ')+'</i></div>'
      +'<div class="howe-box pay"><small>'+lb('We owe','আমরা দেব')+'</small><b>'+tk(pay)+'</b><i>'+payN+' '+lb('parties','পক্ষ')+'</i></div>'
      +'</div>'
      +'<div class="howe-foot"><span>'+netLabel+': <b>'+tk(Math.abs(net))+'</b></span><span>'+(recvN+payN)+' '+lb('parties','পক্ষ')+'</span></div>';
  })();
  const ds=[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-6+i);return iso(x)});
  const dv=d=>S.entries.reduce((o,e)=>{if(!e.void&&!e.removed&&!isWalletTransfer(e)&&e.d===d){if(e.type==='Sale')o.s+=e.amt;else if(e.type==='Purchase')o.b+=e.amt}return o},{s:0,b:0});
  const rows=ds.map(d=>({d:d,...dv(d)})),mx=Math.max(1,...rows.map(r=>Math.max(r.s,r.b)));
  $('hChart').innerHTML=rows.map(r=>`<div class="dcol" title="${r.d} · Sell ${n(r.s)} · Buy ${n(r.b)}"><div class="dbars"><div class="dbs" style="height:${Math.ceil(r.s/mx*100)}%"></div><div class="dbb" style="height:${Math.ceil(r.b/mx*100)}%"></div></div><small>${r.d.slice(8)}</small></div>`).join('');
  const sE=E.filter(e=>e.type==='Sale'&&!isWalletTransfer(e)),pt=sE.reduce((s,e)=>s+e.amt,0),pay={Cash:0,Digital:0,Due:0};
  sE.forEach(e=>{pay[e.pay==='Cash'?'Cash':(e.pay==='Due'?'Due':'Digital')]+=e.amt});
  const segs=[['Cash',pay.Cash,'--ch1'],['Digital',pay.Digital,'--ch2'],['Due',pay.Due,'--ch3']];
  let stops='',acc=0;segs.forEach(([k,v,c])=>{if(v>0)stops+=`var(${c}) ${acc/pt*100}% ${(acc+v)/pt*100}%,`;acc+=v});
  $('hPay').innerHTML=`<div class="dwrap${pt>0?'':' zero'}"${pt>0?` style="background:conic-gradient(${stops.slice(0,-1)})"`:''}><div class="dhole"><b>${tk(pt)}</b><small>Sales</small></div></div><div class="dleg">${segs.map(([k,v,c])=>`<div><i style="background:var(${c})"></i>${k}<b>${tk(v)}</b></div>`).join('')}</div>`;
  $('hRecent').innerHTML=S.bills.filter(b=>!b.removed&&!b.test).slice(0,6).map(x=>`<div class="hrow"><span>#${esc(x.no)} · ${sd(x.d)} ${t12(x.t)} · ${esc(x.pay)}${x.void?' · <b class="bad">VOID</b>':''}<br><small class="mut">${esc(x.user)}</small></span><b>${tk(x.total)}</b></div>`).join('')||'<div class="empty">No bills yet</div>';try{animateCounts()}catch(e){}}
$('hTabs').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){HP=b.dataset.p;homeUI()}});
$('hQa').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;const q=b.dataset.q;
  if(q==='sale'||q==='purchase'){POS.setMode(q);go('pos')}else if(q==='acc')go('acc');else{go('pos');POS.bills()}});
$('hOwe').addEventListener('click',e=>{if(e.target.closest('[data-q="owe-led"]'))go('led')});

