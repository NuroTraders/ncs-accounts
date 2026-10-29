/* ---------- POS module ---------- */
const POS=(()=>{
const DK='ncs_dev_v1';let D=null;try{D=JSON.parse(localStorage.getItem(DK))}catch(e){}
D=D||{dev:String.fromCharCode(65+Math.floor(Math.random()*26)),seq:0,held:[]};D.held=D.held||[];
const dsave=()=>{try{localStorage.setItem(DK,JSON.stringify(D))}catch(e){}};
const nowT=()=>{const x=new Date();return String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0')};
let C={mode:'sale',lines:[],disc:0};
const dlg=(title,body,onOk,okText,hideOk)=>{ask(title,body,onOk,okText);$('ok').style.display=hideOk?'none':''};
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
const prods=()=>S.products.filter(p=>!p.del);
const stockMap=()=>{const vb=new Set(S.bills.filter(b=>b.void).map(b=>b.id)),m={};S.moves.forEach(v=>{if(v.adminRejected||v.adminCheck&&!v.adminChecked||v.ref&&vb.has(v.ref))return;m[v.pid]=(m[v.pid]||0)+v.q});return m};
const imgH=p=>p.img?`<img class="pimg" src="${esc(p.img)}" alt="">`:`<div class="pimg">${esc((p.name||'?').trim().slice(0,1).toUpperCase())}</div>`;
const sub=()=>C.lines.reduce((s,l)=>s+l.price*l.qty,0),total=()=>Math.max(0,Math.round((sub()-(+C.disc||0))*100)/100);
const bizDate=()=>{const x=new Date();let d=iso(x);while(S.days[d]&&S.days[d].closed){x.setDate(x.getDate()+1);d=iso(x)}return d};

const r2=x=>Math.round(x*100)/100;
function discPct(){const s=sub();return s?r2((+C.disc||0)/s*100):0}
function discFix(){const s=sub();if(C.dm==='p'){C.dpct=Math.min(100,Math.max(0,+C.dpct||0));C.disc=Math.min(s,Math.round(s*C.dpct)/100)}else if((+C.disc||0)>s)C.disc=s}
function discNote(){const p=discPct(),el=$('dcn');if(p>5){el.hidden=false;el.textContent=lb('Over 5%: this bill will be flagged for Admin review.','৫% এর বেশি: বিলটি অ্যাডমিন পর্যালোচনার জন্য চিহ্নিত হবে।')}else el.hidden=true}
function discShow(){if(document.activeElement!==$('dc'))$('dc').value=C.disc||'';if(document.activeElement!==$('dp'))$('dp').value=C.dm==='p'?(C.dpct||''):(discPct()||'');discNote()}
function topSellers(){const from=iso(new Date(Date.now()-30*864e5)),c={};S.bills.filter(b=>!b.void&&!b.removed&&!b.test&&b.mode==='sale'&&b.d>=from).forEach(b=>b.lines.forEach(l=>{if(l.pid)c[l.pid]=(c[l.pid]||0)+l.qty}));
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id])=>S.products.find(p=>p.id==id)).filter(p=>p&&!p.del)}
function renderPosPresets(){
  const el=$('posPresets');
  if(!el)return;
  const list=getPresets();
  el.innerHTML=list.map(p=>`<button type="button" class="svc-chip" data-preset="${p.id}"><span>${p.icon||'⚡'}</span> <b>${S.lang==='bn'?(p.bn||p.name):p.name}</b> <small>${tk(p.price)}</small></button>`).join('');
}
function renderGrid(){renderPosPresets();const q=$('q').value.trim().toLowerCase(),sm=stockMap();
  const L=prods().filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).toLowerCase().includes(q)||(p.barcode||'').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,80);
  $('grid').innerHTML=L.length?L.map(p=>{const s=sm[p.id]||0;return `<button class="tile" data-p="${p.id}">${imgH(p)}<div class="sb${s<=0?' low':''}">${s}</div><span>${esc(p.name)}</span><small>${tk(p.price)}</small></button>`}).join('')+(canCost()?'<div class="mut" style="grid-column:1/-1">Long-press or right-click a product to edit it.</div>':''):'<div class="empty" style="grid-column:1/-1">No products yet. Use Add Product, scan a barcode, or use Custom item.</div>';
  const T=C.mode==='sale'?topSellers():[];$('top7').style.display=T.length?'flex':'none';$('top7').innerHTML=T.map(p=>`<button data-p="${p.id}">${imgH(p)}${esc(p.name)}</button>`).join('')}
function slideInLast(){if(document.documentElement.dataset.rm)return;var rows=$('lines').children;if(!rows.length)return;var el=rows[rows.length-1];el.classList.add('slidein');setTimeout(function(){el.classList.remove('slidein')},260)}
function removeLineAnimated(i){var rows=$('lines').children,row=rows[i];if(!row||document.documentElement.dataset.rm){C.lines.splice(i,1);renderCart();return}row.classList.add('slideout');setTimeout(function(){C.lines.splice(i,1);renderCart()},200)}
function addLine(p){const pm=C.mode==='purchase',l=p.id&&C.lines.find(x=>x.pid===p.id);if(l){l.qty++;renderCart()}else{C.lines.push({pid:p.id||null,name:p.name,price:pm?(+p.buy||+p.price||0):(+p.price||0),cost:+p.buy||0,qty:1});renderCart();slideInLast()}}
function renderCart(){if(role()==='keeper')C.mode='purchase';const pm=C.mode==='purchase',sm=stockMap();
  $('ct').textContent=pm?'Purchase cart':'Sale cart';$('mS').classList.toggle('on',!pm);$('mP').classList.toggle('on',pm);$('bHeld').textContent='Held'+(D.held.length?' ('+D.held.length+')':'');
  $('lines').innerHTML=C.lines.length?C.lines.map((l,i)=>{const s=l.pid?(sm[l.pid]||0):null;return `<div class="line"><div>${esc(l.name)}${s!==null?`<small class="${!pm&&l.qty>s?'bad':''}">Stock ${s}</small>`:''}</div><input type="number" inputmode="decimal" min="0" data-pr="${i}" value="${l.price}"><div class="qty"><button data-a="m" data-i="${i}">−</button><b>${l.qty}</b><button data-a="p" data-i="${i}">+</button></div><div class="lt">${n(l.price*l.qty)}</div><button class="x" data-a="x" data-i="${i}">×</button></div>`}).join(''):'<div class="empty">Cart is empty</div>';
  discFix();$('st').textContent=n(sub());$('tt').textContent=tk(total());discShow();
  const t=pm?'Pay ':'Charge ',c=C.lines.reduce((s,l)=>s+l.qty,0);$('bPay').textContent=t+tk(total());$('bPay').disabled=!c;$('fab').textContent=c?t+tk(total())+' · '+c+' item'+(c>1?'s':''):'Cart is empty';$('fab').disabled=!c;
  const bClr=$('bClearCart');if(bClr){bClr.style.display=c?'':'none';bClr.onclick=()=>{if(confirm(lb('Clear cart?','কার্ট খালি করবেন?'))){C.lines=[];renderCart();}};}
  const badge=$('cartCountBadge');if(badge){badge.style.display=c?'':'none';badge.textContent=c+(S.lang==='bn'?' টি পণ্য':(' item'+(c>1?'s':'')))}}
const byId=id=>S.products.find(p=>p.id==id);
$('grid').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b)addLine(byId(b.dataset.p))});
$('top7').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b)addLine(byId(b.dataset.p))});
if($('posPresets')){$('posPresets').addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;const p=getPresets().find(x=>x.id===b.dataset.preset);if(p){const title=S.lang==='bn'?(p.bn||p.name):p.name;addLine({name:title,price:p.price,buy:0});toast((S.lang==='bn'?'যোগ হয়েছে: ':'Added ')+title);try{Sound.tick()}catch(x){}}});}
$('grid').addEventListener('contextmenu',e=>{const b=e.target.closest('[data-p]');if(b&&canCost()){e.preventDefault();pForm(byId(b.dataset.p))}});
$('lines').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const i=+b.dataset.i,l=C.lines[i];
  if(b.dataset.a==='p'){l.qty++;renderCart()}
  else if(b.dataset.a==='m'){if(--l.qty<1)removeLineAnimated(i);else renderCart()}
  else removeLineAnimated(i)});
$('lines').addEventListener('change',e=>{if(e.target.dataset.pr!=null){C.lines[+e.target.dataset.pr].price=+e.target.value||0;renderCart()}});
$('dc').addEventListener('input',()=>{C.dm='a';C.disc=Math.max(0,+$('dc').value||0);renderCart()});
$('dc').addEventListener('change',discShow);
$('dp').addEventListener('input',()=>{C.dm='p';C.dpct=Math.min(100,Math.max(0,+$('dp').value||0));renderCart()});
$('dp').addEventListener('change',discShow);
const bump=d=>{const cu=C.dm==='p'?(+C.dpct||0):discPct();C.dm='p';C.dpct=Math.min(100,Math.max(0,r2(cu+d)));renderCart()};
$('dpm').onclick=()=>bump(-1);$('dpp').onclick=()=>bump(1);
const setMode=m=>{if(role()==='keeper')m='purchase';C.mode=m;renderGrid();renderCart()};
$('mS').onclick=()=>setMode('sale');$('mP').onclick=()=>setMode('purchase');
$('q').addEventListener('input',()=>{renderGrid();if($('q').value.trim())$('productPanel').open=true});
$('q').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const v=$('q').value.trim();if(!v)return;handleCode(v,true);$('q').value='';renderGrid()});
function handleCode(code,typed){const P=prods(),p=P.find(x=>x.barcode&&x.barcode===code)||P.find(x=>String(x.id)===code);
  if(p){addLine(p);toast('Added '+p.name);return}
  if(typed){const m=prods().filter(x=>x.name.toLowerCase().includes(code.toLowerCase()));if(m.length===1){addLine(m[0]);return}if(m.length>1||!/^\d{6,}$/.test(code))return}
  pForm(null,code)}

let pimg='';
function shrink(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,160/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(imgCap(c,.6))};im.src=r.result};r.readAsDataURL(file)}
function pForm(p,code){pimg=p?p.img||'':'';const e=!!p,sm=stockMap();
  dlg(e?'Edit product':'New product',`<div class="pf1"><div id="pfp">${imgH({img:pimg,name:p?p.name:'?'})}</div><button type="button" class="ghost" data-cam="1">Camera</button><button type="button" class="ghost" data-gal="1">Gallery</button><input id="pi1" type="file" accept="image/*" capture="environment" hidden><input id="pi2" type="file" accept="image/*" hidden></div>
  <div class="f"><label>Name</label><input id="np1" value="${esc(p?p.name:'')}"></div><div class="f"><label>Barcode (optional)</label><input id="np2" value="${esc(p?p.barcode||'':code||'')}"></div>
  ${canCost()?`<div class="f"><label>Buying cost</label><input id="np4" type="number" inputmode="decimal" min="0" value="${p?p.buy||'':''}"></div>`:''}
  <div class="f"><label>Selling price</label><input id="np3" type="number" inputmode="decimal" min="0" value="${p?p.price:''}"></div>
  ${e?`<div class="mut">Stock now: ${sm[p.id]||0}</div>`:'<div class="f"><label>Opening stock</label><input id="np5" type="number" inputmode="decimal" min="0"></div>'}
  ${e?'<button type="button" class="ghost" id="npd" style="color:var(--neg);margin-top:8px">Delete product</button>':''}`,()=>{
    const nm=$('np1').value.trim();if(!nm)return false;const o={name:nm,barcode:$('np2').value.trim(),price:+$('np3').value||0,img:pimg};if(canCost())o.buy=+$('np4').value||0;
    if(e){Object.assign(p,o)}else{const q={id:Date.now(),buy:0,...o};S.products.push(q);const st=+($('np5')&&$('np5').value)||0;if(st>0)S.moves.push({id:'o'+q.id,pid:q.id,q:st,ref:'',t:'open',d:iso(new Date())});p=q;lg('Add product',nm)}
    save();renderGrid();if(!e&&CUR==='pos')addLine(p);if(CUR==='prod')prodUI()},e||CUR==='prod'?'Save':'Save and add');
  const show=d=>{pimg=d;$('pfp').innerHTML=imgH({img:d,name:$('np1').value||'?'})};
  $('ob').onclick=ev=>{const t=ev.target.closest('button');if(!t)return;if(t.dataset.cam)$('pi1').click();if(t.dataset.gal)$('pi2').click();
    if(t.id==='npd'){p.del=1;lg('Delete product',p.name);save();renderGrid();$('ov').hidden=true}};
  $('ob').onchange=ev=>{if(ev.target.type==='file'&&ev.target.files[0])shrink(ev.target.files[0],show)}}
$('bNew').onclick=()=>pForm(null,'');
$('bCustom').onclick=()=>dlg('Custom item',`<div class="f"><label>Item name</label><input id="ci1"></div><div class="f"><label>Price</label><input id="ci2" type="number" inputmode="decimal" min="0"></div>`,()=>{const nm=$('ci1').value.trim();if(!nm)return false;addLine({name:nm,price:+$('ci2').value||0})},'Add');

let stream=null,scanning=false;
function stopScan(){scanning=false;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('sc').hidden=true}
$('scx').onclick=stopScan;
$('bScan').onclick=async()=>{
  if(!('BarcodeDetector' in window))return dlg('Scan barcode','<p>Camera scanning needs Chrome on Android. You can also use a USB or Bluetooth barcode scanner, or type the code in the search box.</p>',()=>{},'OK');
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){return dlg('Scan barcode','<p>Camera access was blocked. Allow the camera for this site and try again.</p>',()=>{},'OK')}
  $('sc').hidden=false;const v=$('vid');v.srcObject=stream;await v.play();scanning=true;const det=new BarcodeDetector();
  const loop=async()=>{if(!scanning)return;try{const r=await det.detect(v);if(r.length){const c=r[0].rawValue;stopScan();handleCode(c);return}}catch(e){}requestAnimationFrame(loop)};loop()};

const split=x=>{const o={};x=Math.round(x);DEN.forEach(d=>{const c=Math.floor(x/d);if(c){o[d]=c;x-=c*d}});return o};
const sumD=o=>DEN.reduce((s,d)=>s+d*(o[d]||0),0),txtD=o=>DEN.filter(d=>o[d]).map(d=>o[d]+'×'+d).join('  ')||'—';
function checkout(){const T=total();if(!C.lines.length)return;
  const pm=C.mode==='purchase',ck={pay:'Cash',rec:{},party:'',phone:'',cu:''};
  const draw=()=>{const rec=sumD(ck.rec),ch=rec-T,cash=ck.pay==='Cash';
    $('ob').innerHTML=(bizDate()!==iso(new Date())?`<div class="mut" style="margin-bottom:8px">Today is closed. This bill will be saved under ${sd(bizDate())}.</div>`:'')+`<div class="tot big"><span>${pm?'To pay':'Total'}</span><b>${tk(T)}</b></div><div class="chips">${(pm?['Cash','Mobile Banking','Bank']:['Cash','Mobile Banking','Bank','Due']).map(x=>`<button data-pay="${x}" class="${ck.pay===x?'on':''}">${x}</button>`).join('')}</div>`+
    (ck.pay==='Mobile Banking'&&!pm?`<div class="f"><label>${lb('Received into wallet','যে ওয়ালেটে এসেছে')}</label><div class="chips">${WLT_MFS.map(k=>`<button data-w="${k}" class="${(ck.w||'bk')===k?'on':''}">${wN(k)}</button>`).join('')}</div></div>`:'')+(ck.pay==='Due'&&!pm?`<div class="f"><label>${lb('Customer','কাস্টমার')}</label><select id="cpc">${cuOptHtml(ck.cu)}</select></div>`:'')+(ck.pay==='Due'&&(pm||ck.cu==='__new')?`<div class="f"><label>${pm?'Supplier name':'Customer name'}</label><input id="cpn" value="${esc(ck.party)}"></div><div class="f"><label>Phone (optional)</label><input id="cph" value="${esc(ck.phone)}"></div>`:'')+
    (cash?`<label>${pm?'Notes and coins paid out':'Notes and coins received'} <button class="ghost pbtn" data-exact="1">Exact</button></label>`+DEN.map(d=>`<div class="dn"><span>${d}</span><button data-m="${d}">−</button><b>${ck.rec[d]||0}</b><button data-pl="${d}">+</button></div>`).join('')+
      `<div class="prow"><span>${pm?'Paid':'Received'}</span><b>${tk(rec)}</b></div>`+(ch>=0?`<div class="prow"><span>${pm?'Change from supplier':'Change to give'}</span><b class="ok">${tk(ch)}</b></div>${ch?`<div class="mut">${txtD(split(ch))}</div>`:''}`:`<div class="prow bad"><span>Short by</span><b>${tk(-ch)}</b></div>`):'');
    ck.ok=cash?rec>=T:true};
  dlg(pm?'Pay supplier':'Charge',' ',async()=>{if(ck.pay==='Due'&&!pm){if(posCust(ck)===false)return false}else if(ck.pay==='Due'&&!ck.party.trim())return false;if(ck.pay==='Cash'&&!ck.ok)return false;finishBill(ck);toast('Saved')},pm?'Confirm payment':'Confirm sale');
  draw();
  $('ob').onchange=e=>{if(e.target.id==='cpc'){ck.cu=e.target.value;draw()}};
  $('ob').oninput=e=>{if(e.target.id==='cpn')ck.party=e.target.value;if(e.target.id==='cph')ck.phone=e.target.value};
  $('ob').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
    if(d.pay){ck.pay=d.pay;if(d.pay==='Mobile Banking'&&!ck.w)ck.w='bk'}if(d.w)ck.w=d.w;if(d.pl)ck.rec[d.pl]=(ck.rec[d.pl]||0)+1;if(d.m)ck.rec[d.m]=Math.max(0,(ck.rec[d.m]||0)-1);if(d.exact)ck.rec=split(T);draw()}}
function finishBill(ck){const pm=C.mode==='purchase',T=total(),rec=ck.pay==='Cash'?ck.rec:{},chg=ck.pay==='Cash'?split(sumD(ck.rec)-T):{};
  D.seq++;dsave();const no=D.dev+D.seq,items=C.lines.map(l=>l.qty+'× '+l.name).join(', '),id=uid();
  const party=ck.pay==='Due'?ck.party.trim():'',phone=ck.pay==='Due'?ck.phone.trim():'',ty=pm?'Purchase':'Sale',gross=sub(),disc=+C.disc||0,discPct=gross?disc/gross*100:0;
  const b={id,no,d:bizDate(),t:nowT(),ts:Date.now(),user:U.name,mode:C.mode,desc:'POS #'+no+': '+items,lines:C.lines,subtotal:gross,disc:disc,discPct:discPct,...(discPct>5?{discountReview:{state:'pending',pct:discPct,by:U.name,at:Date.now(),note:'Discount exceeds 5% of bill subtotal'}}:{}),total:T,pay:ck.pay,party,phone,rec,chg,...(ck.pay==='Mobile Banking'&&!pm?{w:ck.w||'bk'}:{}),...(ck.cuId&&!pm?{cu:ck.cuId}:{})};
  S.bills.unshift(b);S.entries.push({id,d:b.d,t:b.t,type:ty,desc:b.desc.slice(0,200),cat:'POS',pay:ck.pay,amt:T,by:U.name,party,phone,pos:1,act:null,...(b.w?{w:b.w}:{}),...(b.cu?{cu:b.cu}:{})});
  C.lines.forEach((l,i)=>{if(l.pid)S.moves.push({id:id+'-'+i,pid:l.pid,q:(pm?1:-1)*l.qty,ref:id,t:pm?'in':'sale',d:b.d})});
  if(party)(S.parties[ty]=S.parties[ty]||{})[party]=phone;
  lg('POS bill','#'+no+' '+tk(T)+' '+ck.pay);save();Sound.chaChing();saveCheck();C.lines=[];C.disc=0;C.dpct=0;C.dm='a';renderGrid();renderCart()}
$('bPay').onclick=checkout;$('fab').onclick=checkout;

function rtext(b){const W=32,ln=(a,c)=>(a.length>W-c.length-1?a.slice(0,W-c.length-1):a).padEnd(W-c.length)+c,dt=sd(b.d)+' '+t12(b.t);
  return [(S.lang==='bn'?SHOP_BN:SHOP_EN.toUpperCase()),(b.mode==='purchase'?'Purchase':'Bill')+' #'+b.no,dt,'Cashier: '+b.user,'-'.repeat(W),...b.lines.map(l=>ln(l.qty+'x '+l.name,n(l.price*l.qty))),'-'.repeat(W),...(b.disc?[ln('Discount','-'+n(b.disc))]:[]),ln('TOTAL',n(b.total)),'Paid by '+b.pay+(b.party?' ('+b.party+')':''),b.void?'*** VOID ***':'','Thank you'].filter(x=>x!=='').join('\n')}
async function printThermalEscPos(text) {
  if (typeof navigator !== 'undefined' && navigator.serial) {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      const enc = new TextEncoder();
      const initCmd = new Uint8Array([0x1B, 0x40]);
      const kickCmd = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
      const cutCmd = new Uint8Array([0x1D, 0x56, 0x41, 0x03]);
      await writer.write(initCmd);
      await writer.write(enc.encode(text + '\n\n\n'));
      await writer.write(kickCmd);
      await writer.write(cutCmd);
      writer.releaseLock();
      await port.close();
      toast(lb('Printed via USB Thermal', 'ইউএসবি থার্মাল প্রিন্ট সম্পন্ন'));
      return true;
    } catch (e) {
      if (e.name !== 'NotFoundError') console.warn('Serial print error:', e);
    }
  }
  if (typeof navigator !== 'undefined' && navigator.bluetooth) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      if (device && device.gatt) {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        const enc = new TextEncoder();
        await char.writeValue(enc.encode(text + '\n\n\n'));
        toast(lb('Printed via Bluetooth', 'ব্লুটুথ প্রিন্ট সম্পন্ন'));
        return true;
      }
    } catch (e) {
      if (e.name !== 'NotFoundError') console.warn('Bluetooth print error:', e);
    }
  }
  return false;
}

function receipt(b){const t=rtext(b);dlg('Receipt','<pre style="font:13px monospace;white-space:pre-wrap;margin:0 0 10px">'+esc(t)+'</pre><div class="chips"><button data-sh="1">Share</button><button data-cp="1">Copy</button><button data-pt="1">Print</button><button data-esc="1">⚡ Thermal ESC/POS</button></div>',()=>{},'Close',true);
  $('ob').onclick=async e=>{const x=e.target.closest('button');if(!x)return;
    if(x.dataset.sh){try{await navigator.share({text:t})}catch(err){}}
    if(x.dataset.cp){try{await navigator.clipboard.writeText(t);toast('Copied')}catch(err){}}
    if(x.dataset.pt){$('rcp').textContent=t;document.body.classList.add('pr');try{window.print()}catch(err){}setTimeout(()=>document.body.classList.remove('pr'),800)}
    if(x.dataset.esc){
      const ok = await printThermalEscPos(t);
      if(!ok){
        $('rcp').textContent=t;document.body.classList.add('pr');try{window.print()}catch(err){}setTimeout(()=>document.body.classList.remove('pr'),800);
      }
    }
  };
}
function voidBill(b){
  if(S.days[b.d]&&S.days[b.d].closed)return dlg('Day closed','<p>That day is closed. Reopen it in Accounts before voiding the bill.</p>',()=>{},'OK');
  dlg('Void bill #'+b.no,'<div class="f"><label>Reason (required)</label><input id="vr"></div><p class="mut">The matching accounts entry is voided and stock is restored. If the reason is exactly "test", the bill goes to the Test section (admin only) and is excluded from all totals.</p>',()=>{const r=$('vr').value.trim();if(!r)return false;{const e0=S.entries.find(x=>x.id===b.id);if(e0&&wltVoidBlocked(e0))return false}b.void=1;b.vr=r;const e=S.entries.find(x=>x.id===b.id);if(e){e.void=1;e.vr='POS void: '+r}if(/^test$/i.test(r)){b.test=1;if(e)e.test=1}lg('POS void','#'+b.no+' — '+r);save();toast('Voided');renderGrid();setTimeout(billsUI,0)},'Void bill')}
function removeBillPermanently(b){
  if(!isA())return;
  if(!b.void)return dlg('Not voided','<p>Void the bill first, then remove it permanently.</p>',()=>{},'OK');
  dlg('Remove permanently · #'+b.no,'<p class="mut">This hides the bill and its accounts entry everywhere, including Test. It cannot be undone from the app. Existing totals already excluded it (it is voided).</p><div class="f"><label>Reason (required)</label><input id="rrr" maxlength="160"></div>',()=>{const r=$('rrr').value.trim();if(!r)return false;b.removed=1;b.removedReason=r;b.removedBy=U.name;b.removedAt=Date.now();const e=S.entries.find(x=>x.id===b.id);if(e){e.removed=1;e.removedReason=r;e.removedBy=U.name;e.removedAt=Date.now()}lg('POS remove','#'+b.no+' — '+r);save();toast('Removed');setTimeout(billsUI,0)},'Remove permanently')}
function billsUI(){const L=S.bills.filter(b=>!b.removed&&(isA()||role()==='accountant'||b.user===U.name));
  const normal=L.filter(b=>!b.test), test=L.filter(b=>b.test);
  const A=normal.filter(b=>!b.void), sum=m=>A.filter(b=>b.mode===m).reduce((s,b)=>s+b.total,0);
  const row=b=>`<div class="prow"><span>#${esc(b.no)} · ${t12(b.t)} · ${esc(b.pay)}${b.void?' · <b class="bad">VOID</b>':''}${b.discountReview&&b.discountReview.state==='pending'?' · <b class="warn">HIGH DISCOUNT · '+n(b.discountReview.pct)+'%</b>':''}${!b.void&&S.bills.some(function(x){return x.id!==b.id&&!x.void&&!x.removed&&!x.test&&x.mode===b.mode&&x.total===b.total&&x.party===b.party&&Math.abs((x.ts||0)-(b.ts||0))<86400000})?' · <b class="warn">POSSIBLE DUPLICATE</b>':''}<br><small class="mut">${esc(b.user)}${b.mode==='purchase'?' · Purchase':''}${b.test?' · Test':''}</small><br><button class="ghost pbtn" data-rc="${b.id}">Receipt</button> <button class="ghost pbtn" data-ph="${b.id}">${lb('Photo','ছবি')} (${attN('e'+b.id)})</button>${b.discountReview&&b.discountReview.state==='pending'&&(isA()||role()==='accountant')?'<button class="ghost pbtn" data-dr="'+b.id+'">Review discount</button>':''}${isA()&&!b.void?` <button class="ghost pbtn" data-vd="${b.id}">Void</button>`:''}${isA()&&b.void?` <button class="ghost pbtn" data-rm="${b.id}">Remove</button>`:''}</span><b>${tk(b.total)}</b></div>`;
  const testHTML=(isA()&&test.length)?'<div class="testGroup"><h4>Test ('+test.length+')</h4>'+test.map(row).join('')+'</div>':'';
  dlg("Bills and review flags",`<div class="prow"><span>Sales</span><b>${tk(sum('sale'))}</b></div><div class="prow"><span>Purchases</span><b>${tk(sum('purchase'))}</b></div>`+(normal.length?normal.map(row).join(''):'<div class="empty">No bills found</div>')+testHTML,()=>{},'Close',true);
  $('ob').onclick=e=>{const r=e.target.closest('[data-rc]'),v=e.target.closest('[data-vd]'),d=e.target.closest('[data-dr]'),m=e.target.closest('[data-rm]');var ph=e.target.closest('[data-ph]');if(ph)return attUI('e'+ph.dataset.ph);if(r)receipt(S.bills.find(b=>b.id==r.dataset.rc));if(v)voidBill(S.bills.find(b=>b.id==v.dataset.vd));if(m)removeBillPermanently(S.bills.find(b=>b.id==m.dataset.rm));if(d){var bill=S.bills.find(b=>b.id==d.dataset.dr);dlg('High discount review · #'+bill.no,'<p>'+n(bill.discountReview.pct)+'% · '+tk(bill.disc)+' discount on '+tk(bill.subtotal)+'</p>',()=>{bill.discountReview.state='reviewed';bill.discountReview.reviewedBy=U.name;bill.discountReview.reviewedAt=Date.now();lg('Discount reviewed','#'+bill.no+' by '+U.name);save();setTimeout(billsUI,0)},'Mark reviewed')}}}
$('bBills').onclick=billsUI;

$('bHold').onclick=()=>{if(!C.lines.length)return;D.held.unshift({id:Date.now(),mode:C.mode,lines:C.lines,disc:C.disc,t:nowT()});C.lines=[];C.disc=0;C.dpct=0;C.dm='a';dsave();renderCart();toast('Bill held')};
function heldUI(){dlg('Held bills',D.held.length?D.held.map(h=>`<div class="prow"><span>${t12(h.t)} · ${h.lines.reduce((s,l)=>s+l.qty,0)} items · ${tk(h.lines.reduce((s,l)=>s+l.price*l.qty,0))}${h.mode==='purchase'?' · Purchase':''}</span><span><button class="ghost pbtn" data-rs="${h.id}">Resume</button> <button class="ghost pbtn" data-dh="${h.id}">Delete</button></span></div>`).join(''):'<div class="empty">No held bills</div>',()=>{},'Close',true);
  $('ob').onclick=e=>{const r=e.target.closest('[data-rs]'),d=e.target.closest('[data-dh]');
    if(r){const h=D.held.find(x=>x.id==r.dataset.rs);if(C.lines.length)D.held.unshift({id:Date.now(),mode:C.mode,lines:C.lines,disc:C.disc,t:nowT()});D.held=D.held.filter(x=>x.id!==h.id);C={mode:h.mode,lines:h.lines,disc:h.disc};dsave();renderGrid();renderCart();$('ov').hidden=true}
    if(d){D.held=D.held.filter(x=>x.id!=d.dataset.dh);dsave();heldUI()}}}
$('bHeld').onclick=heldUI;

function drawerCounts(){const base=S.drawerBase||{c:{},ts:0},o={...base.c};S.bills.forEach(b=>{if(b.void||b.removed||(b.ts||0)<=base.ts)return;const s=b.mode==='purchase'?-1:1;DEN.forEach(d=>{o[d]=(o[d]||0)+s*((b.rec[d]||0)-(b.chg[d]||0))})});DEN.forEach(d=>{o[d]=Math.max(0,o[d]||0)});return o}
$('bDrawer').onclick=()=>{const o=drawerCounts();
  dlg('Drawer notes and coins',DEN.map(d=>`<div class="prow"><span>${d}</span><b>${o[d]}</b><span class="mut">${tk(d*o[d])}</span></div>`).join('')+`<div class="prow"><b>Total</b><b>${tk(sumD(o))}</b></div>`+(isA()?'<p class="mut">Set the counts to your real notes to start or correct.</p>':''),()=>{
    if(!isA())return;dlg('Set drawer counts',DEN.map(d=>`<div class="dn"><span>${d}</span><span></span><input type="number" min="0" inputmode="numeric" data-dd="${d}" value="${o[d]}"><span></span></div>`).join(''),()=>{const c={};DEN.forEach(d=>{c[d]=Math.max(0,+$('ob').querySelector('[data-dd="'+d+'"]').value||0)});S.drawerBase={c,ts:Date.now()};lg('Drawer set','');save()},'Save');return false},isA()?'Set counts':'Close')};
let PF='all',PLN=60;const LOW=5;
function prodUI(){const sm=stockMap(),q=($('pdq').value||'').trim().toLowerCase(),A=prods(),cost=canCost(),st=A.map(p=>({p,s:sm[p.id]||0}));
  const units=st.reduce((a,x)=>a+Math.max(0,x.s),0),vc=st.reduce((a,x)=>a+Math.max(0,x.s)*(+x.p.buy||0),0),vs=st.reduce((a,x)=>a+Math.max(0,x.s)*(+x.p.price||0),0);
  const C=(l,v)=>`<div class="stat"><small>${l}</small><b>${v}</b></div>`;
  $('pdS').innerHTML=synNote()+C('Products',A.length)+C('Units in stock',n(units))+C('Low or out of stock',st.filter(x=>x.s<=LOW).length)+(cost?C('Stock value (cost)',tk(vc))+C('Stock value (selling)',tk(vs))+C('Expected profit',tk(vs-vc)):'');
  $('pdF').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.f===PF));
  const L=st.filter(x=>(!q||x.p.name.toLowerCase().includes(q)||(x.p.barcode||'').includes(q))&&(PF==='all'||(PF==='out'?x.s<=0:x.s<=LOW))).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  $('pdL').innerHTML=L.length?L.slice(0,PLN).map(({p,s})=>`<div class="prd"><div>${imgH(p)}</div><div><b>${esc(p.name)}</b><div class="mut">${p.barcode?esc(p.barcode)+' · ':''}Stock <b class="${s<=0?'bad':''}">${s}</b></div><div class="mut">${cost?(p.buy?'Buy '+tk(p.buy):'<b style="color:var(--warn)">Cost not set</b>')+' · ':''}Sell ${tk(p.price)}</div></div><div class="pa"><button class="ghost pbtn" data-ad="${p.id}">Add stock</button>${(isA()||role()==='keeper')?'<button class="ghost pbtn" data-fq="'+p.id+'">Set stock</button>':''}<button class="ghost pbtn" data-ed="${p.id}">Edit</button></div></div>`).join('')+(L.length>PLN?'<div class="pgmore" data-pmore="1" role="button" tabindex="0">'+lb('Show more','আরও দেখুন')+' ('+(L.length-PLN)+')</div>':''):'<div class="empty">No products found</div>'}
function addStock(p){dlg('Add stock · '+p.name,`<div class="f"><label>Quantity</label><input id="as1" type="number" inputmode="decimal" min="0"></div>${canCost()?`<div class="f"><label>Buying cost</label><input id="as2" type="number" inputmode="decimal" min="0" value="${p.buy||''}"></div>`:''}<div class="f"><label>Selling price</label><input id="as3" type="number" inputmode="decimal" min="0" value="${p.price}"></div><div class="f"><label>How did it come?</label><select id="as4"><option value="bought">Bought</option><option value="brought">Brought in</option></select></div><div class="f"><label>Date</label><input id="as5" type="date" min="${NCS_MIN_DATE}" max="${todayIso()}" value="${todayIso()}"></div><p class="mut">This records stock only. To record paying a supplier, use POS and Purchase, which adds stock too.</p>`,()=>{
  const q=+$('as1').value;if(!(q>0))return false;if(canCost()&&$('as2').value!=='')p.buy=+$('as2').value||0;p.price=+$('as3').value||p.price;
  const sDate=$('as5').value||todayIso();
  if(sDate>todayIso()){ltoast(lb('Cannot add stock for a future date','ভবিষ্যতের তারিখে স্টক যোগ করা যাবে না'));return false}
  if(sDate<NCS_MIN_DATE){ltoast(lb('Cannot add stock before November 2020','নভেম্বর ২০২০ এর পূর্বে স্টক যোগ করা যাবে না'));return false}
  S.moves.push({id:'s'+Date.now()+'-'+p.id,pid:p.id,q,ref:'',t:'in',how:$('as4').value,d:sDate});lg('Add stock',p.name+' +'+q+' ('+$('as4').value+')');save();toast('Stock added');prodUI()},'Add stock')}
function forceStock(p){if(!(isA()||role()==='keeper')||!p)return;if(S.moves.some(v=>v.pid===p.id&&v.adminCheck&&!v.adminChecked&&!v.adminRejected)){toast('This product already has a stock change awaiting review');return}var old=stockMap()[p.id]||0;dlg('Set stock quantity · '+p.name,'<div class="f"><label>New quantity</label><input id="fq" type="number" min="0" step="any" value="'+old+'"></div><div class="f"><label>Reason (required)</label><input id="fqr" maxlength="160"></div><p class="mut">This is recorded and sent to Admin for review.</p>',()=>{var q=+$('fq').value,why=$('fqr').value.trim();if(!isFinite(q)||q<0||!why)return false;if(q===old)return false;S.moves.push({id:'force-'+Date.now()+'-'+p.id,pid:p.id,q:q-old,old:old,target:q,ref:'',t:'force',d:iso(new Date()),reason:why,by:U.name,adminCheck:1});lg('Force stock quantity',p.name+' '+old+' → '+q+' — '+why);save();prodUI();toast('Submitted for Admin review')},'Set quantity')}
$('pdL').addEventListener('click',e=>{const a=e.target.closest('[data-ad]'),b=e.target.closest('[data-ed]'),f=e.target.closest('[data-fq]');if(a)addStock(byId(a.dataset.ad));if(b)pForm(byId(b.dataset.ed));if(f)forceStock(byId(f.dataset.fq))});
$('pdNew').onclick=()=>pForm(null,'');$('pdq').addEventListener('input',()=>{PLN=60;prodUI()});$('pdL').addEventListener('click',e=>{if(e.target.closest('[data-pmore]')){PLN+=60;prodUI()}});
$('pdF').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(b){PF=b.dataset.f;PLN=60;prodUI()}});
return{refresh(){try{$('q').value=''}catch(e){}renderGrid();renderCart();if(CUR==='prod')prodUI()},setMode,bills:billsUI,prodUI,stock:pid=>stockMap()[pid]||0,stockMap:stockMap}
})();
$('q').addEventListener('focus',()=>{});
/* ---------- customer ledger + version history (v8) ---------- */
var APP_VERSION='9.7',LC=null,LT='led',LQ='',LF='',LE='',LK='';
var VERS=[
 {v:'9.5',d:'2026-10-16',t:'Party, balance carry-forward and review controls',by:'Other Claude profile (model not recorded)',n:['Party details and kinds','Start fresh carries cash and wallets','POS discounts over 5% flagged','Exact stock overrides','Energetic sync status']},
 {v:'9.4',d:'2026-10-16',t:'Sync status dot',n:['Sync dot']},
 {v:'9.3',d:'2026-10-16',t:'No due purchases',n:['Purchases cannot be saved as Due']},
 {v:'9.2',d:'2026-10-16',t:'Bkash Personal or Agent in the ledger',n:['Ledger method Bkash is Personal or Agent']},
 {v:'9.1',d:'2026-10-16',t:'Today on Accounts, Bug Fixing and Upcoming cards',n:['Accounts opens on Today']},
 {v:'9.0',d:'2026-10-16',t:'Ledger linked to cash flow',n:['Ledger entries move cash and wallets','Due sales post to customer ledger automatically']},
 {v:'8.9.1',d:'2026-10-16',t:'Fixes',by:'Claude Sonnet 5.5 · owner\'s Claude account',n:['Fixed refresh logout']},
 {v:'8.9',d:'2026-10-16',t:'Wallets',by:'Claude Sonnet 5.5 · owner\'s Claude account',n:['Wallet cards','No-below-zero','Wallet categories']},
 {v:'8.8.1',d:'2026-10-16',t:'Version history cleanup',n:['Version history rebuilt']},
 {v:'8.8',d:'2026-10-16',t:'Management tab and cash adjustment',n:['Management tab']},
 {v:'8.7',d:'2026-10-16',t:'Merged build: roles, ledger extras, Bengali',n:['Merged two parallel builds']},
 {v:'8.6',d:'2026-10-15',t:'Dabang-style Home',n:['Dabang Home']},
 {v:'8.5',d:'2026-10-15',t:'Customer card and navy dark mode',n:['Customer card']},
 {v:'8.4',d:'2026-10-15',t:'Phone drawer menu',n:['Drawer menu']},
 {v:'8.3',d:'2026-10-15',t:'ItemPOS look',n:['ItemPOS theme']},
 {v:'8.2',d:'2026-10-15',t:'Dashboard theme layer',n:['Theme tokens']},
 {v:'8.1',d:'2026-10-15',t:'Ledger date and time',n:['Ledger auto date/time']},
 {v:'8.0',d:'2026-10-15',t:'Customer Ledger',n:['Customer ledger']},
 {v:'7',d:'2026-10-14',t:'One role-based app',n:['One app']},
 {v:'6',d:'2026-10-09',t:'Separate POS app',n:['POS app']},
 {v:'5',d:'2026-10-09',t:'Backup, install and security',n:['Sync']},
 {v:'4',d:'2026-10-09',t:'Logins, controls and reports',n:['Logins']},
 {v:'3',d:'2026-10-08',t:'Accounts app: new interface',n:['Interface']},
 {v:'2',d:'2026-10-08',t:'First web tracker',n:['Web tracker']},
 {v:'1',d:'2026-10-08',t:'Excel daily accounts sheet',n:['Excel sheet']}
];
function ldlg(t,b,f,o,h){ask(t,b,f,o);$('ok').style.display=h?'none':''}
function ltoast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1800)}
function nowT(){var x=new Date();return String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0')}
function lb(a,b){return S.lang==='bn'?b:a}
function bd(s){return String(s).replace(/[০-৯]/g,function(c){return '০১২৩৪৫৬৭৮৯'.indexOf(c)})}
function parseAmt(v){var p=bd(v).replace(/[,\s]/g,'').split('+').filter(function(x){return x!==''}).map(Number);return(!p.length||p.some(function(x){return!(x>0)}))?null:p}
function lEd(){return isA()||role()==='accountant'}
function cname(){var c=S.cust.find(function(x){return x.id===LC});return c?c.name:''}
function lSort(a){return[...a].sort(function(p,q){return(p.d||'9999').localeCompare(q.d||'9999')||p.id-q.id})}
function lSubAccounts(cId){
  return S.cust.filter(function(x){return !x.del && x.parentId===cId});
}
function lCombinedBal(cId){
  var direct = lBal(cId);
  var subs = lSubAccounts(cId);
  return r2(direct + subs.reduce(function(sum, sub){return sum + lBal(sub.id)}, 0));
}
function lBal(c){return r2(S.ltx.filter(function(x){return x.c===c&&!x.void}).reduce(function(s,x){return s+(x.dir==='in'?x.amt:-x.amt)},0))}
function dr(x){return x.d?sd(x.d)+(x.d2?' – '+sd(x.d2):''):lb('Date unknown','তারিখ নেই')}
function kindLabel(k){if(k==='Borrower'||k==='Lender'||k==='Borrower/Lender')return 'Borrower/Lender';return k||'Customer'}
function kindMatch(c,kind){if(!kind)return true;return kindLabel(c.kind)===kind}
function ledRows(all,a,b){var bal=0,r=[];all.forEach(function(x){if(!x.void)bal=r2(bal+(x.dir==='in'?x.amt:-x.amt));var k=x.d||'9999';if((!a||k>=a)&&(!b||k<=b))r.push([x,bal])});return r}
function ledTable(rows,ob){
  if(LPGC!==LC){LPGC=LC;LPGN=80}
  var a=rows.filter(function(r){return!r[0].void}),ti=a.filter(function(r){return r[0].dir==='in'}).reduce(function(s,r){return s+r[0].amt},0),to=a.filter(function(r){return r[0].dir==='out'}).reduce(function(s,r){return s+r[0].amt},0);
  return '<div class="card scroll"><table class="ltb"><thead><tr><th>'+lb('Date','তারিখ')+'</th><th>'+lb('Details','বিবরণ')+'</th><th>পেলাম</th><th>দিলাম</th><th>'+lb('Balance','ব্যালেন্স')+'</th></tr></thead><tbody>'+
  (ob!=null?'<tr><td colspan="4">'+lb('Opening balance','শুরুর ব্যালেন্স')+'</td><td class="cb">'+n(ob)+'</td></tr>':'')+
  (rows.length?(rows.length>LPGN?'<tr class="lmr"><td colspan="5" data-lm="1" role="button" tabindex="0" class="pgmore">'+lb('Show earlier entries','আগের এন্ট্রি দেখুন')+' ('+(rows.length-LPGN)+')</td></tr>':'')+rows.slice(-LPGN).map(function(r){var x=r[0];return '<tr class="'+(x.void?'void':'')+'" data-a="tx" data-id="'+x.id+'"><td>'+dr(x)+(x.t?'<small style="display:block;color:var(--mut);font-size:12px">'+t12(x.t)+'</small>':'')+'</td><td class="d">'+(x.void?'<span class="b v">VOID</span>':'')+(possibleDupLedger(x)?'<span class="b ctag">Possible duplicate</span>':'')+(ledChk(x)&&lEd()?'<span class="b ctag">'+lb('Check','যাচাই')+'</span>':'')+(x.flag&&x.flag.state==='pending'?'<span class="b ctag">'+lb('Flagged','চিহ্নিত')+'</span>':'')+(x.prop&&x.prop.state==='pending'?'<span class="b ctag">'+lb('Edit pending','সম্পাদনা অপেক্ষমাণ')+'</span>':'')+(x.voidReq&&x.voidReq.state==='pending'?'<span class="b ctag">'+lb('Void pending','বাতিল অপেক্ষমাণ')+'</span>':'')+esc(x.who||'')+(x.m?' <small>'+esc(mL(x.m))+'</small>':'')+(x.parts?'<small>'+x.parts.map(n).join(' + ')+'</small>':'')+(x.note?'<small>'+esc(x.note)+'</small>':'')+'</td><td class="pos">'+(x.dir==='in'?n(x.amt):'')+'</td><td class="neg">'+(x.dir==='out'?n(x.amt):'')+'</td><td class="cb">'+n(r[1])+'</td></tr>'}).join(''):'<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--mut)">'+lb('No entries','কোনো এন্ট্রি নেই')+'</td></tr>')+
  '</tbody><tfoot><tr><td colspan="2">'+lb('Total','মোট')+'</td><td class="pos">'+n(ti)+'</td><td class="neg">'+n(to)+'</td><td class="cb">'+n((ob||0)+ti-to)+'</td></tr></tfoot></table></div>'}
function ledProfile(){
  var c=S.cust.find(function(x){return x.id===LC}),b=lBal(c.id);
  var subs=lSubAccounts(c.id),isParent=subs.length>0,combinedBal=isParent?lCombinedBal(c.id):b;
  var allTxCustIds=(window._incSubsStatement&&isParent)?[c.id].concat(subs.map(function(s){return s.id})):[c.id];
  var all=lSort(S.ltx.filter(function(x){return allTxCustIds.includes(x.c)})),act=all.filter(function(x){return!x.void}),
  ti=act.filter(function(x){return x.dir==='in'}).reduce(function(s,x){return s+x.amt},0),to=act.filter(function(x){return x.dir==='out'}).reduce(function(s,x){return s+x.amt},0),
  T=[['led',lb('Ledger','খাতা')],['stm',lb('Statement','স্টেটমেন্ট')],['note',lb('Notes','নোট')],['act',lb('Activity','লগ')]].concat(isA()||role()==='accountant'?[['void',lb('Void data','বাতিল তথ্য')+' ('+all.filter(function(x){return x.void}).length+')']]:[]),body='';
  var subAccsCard = isParent ? ('<div class="card" style="padding:12px;margin:10px 0;border-left:3px solid var(--acc)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>'+lb('Group Sub-accounts','গ্রুপ সাব-অ্যাকাউন্ট')+' ('+subs.length+')</b><span class="mut" style="font-size:12.5px">'+lb('Combined Group Due: ','গ্রুপের মোট বকেয়া: ')+'<b class="'+(combinedBal>0?'warn':combinedBal<0?'pos':'zero')+'">'+tk(Math.abs(combinedBal))+'</b></span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">'+subs.map(function(s){var sb=lBal(s.id);return '<div class="card" style="padding:8px 10px;background:var(--bg);display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:13.5px">'+esc(s.name)+'</b><small style="display:block;color:var(--mut);font-size:11px">'+(s.phone?esc(s.phone):kindLabel(s.kind))+'</small></div><div style="text-align:right"><b class="'+(sb>0?'warn':sb<0?'pos':'zero')+'">'+tk(Math.abs(sb))+'</b><button type="button" class="ghost" data-a="opensub" data-id="'+s.id+'" style="margin-left:6px;padding:2px 8px;font-size:11.5px">'+lb('View','দেখুন')+'</button></div></div>'}).join('')+'</div></div>') : '';
  if(LT==='led')body=subAccsCard+ledFilt()+ledTable(ledFlt(ledRows(act,'','')),null);
  else if(LT==='stm'){
    var ob=LF?all.filter(function(x){return!x.void&&(x.d||'9999')<LF}).reduce(function(s,x){return s+(x.dir==='in'?x.amt:-x.amt)},0):null;
    var incSubsToggle=isParent?'<label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" data-a="incsubs" style="width:auto;height:auto" '+(window._incSubsStatement?'checked':'')+'> '+lb('Combined Group Statement (All sub-accounts)','গ্রুপ স্টেটমেন্ট (সব সাব-অ্যাকাউন্টসহ)')+'</label>':'';
    body='<div class="card noprint" style="padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:end"><div><label>'+lb('From','থেকে')+'</label><input id="lsa" type="date" value="'+LF+'"></div><div><label>'+lb('To','পর্যন্ত')+'</label><input id="lse" type="date" value="'+LE+'"></div><button class="ghost" data-a="print">'+lb('Print / Save PDF','প্রিন্ট / পিডিএফ')+'</button><button class="ghost" data-a="img">'+lb('Share image','ছবি শেয়ার')+'</button><button class="ghost" data-a="csv">CSV</button>'+incSubsToggle+'</div><div class="lph"><h2>'+esc(shopN())+'</h2><div>'+esc(c.name)+' · '+esc(c.phone||'')+(window._incSubsStatement&&isParent?' · ['+lb('Combined Group Statement','সম্মিলিত গ্রুপ স্টেটমেন্ট')+']':'')+' · '+(LF?sd(LF):'…')+' – '+(LE?sd(LE):sd(iso(new Date())))+'</div></div>'+ledTable(ledRows(act,LF,LE),ob)}
  else if(LT==='void')body=ledVoidTab(all);else if(LT==='note')body='<div class="card" style="padding:14px"><textarea id="lnt" rows="6" style="width:100%;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;color:inherit">'+esc(c.note||'')+'</textarea><div style="margin-top:10px"><button class="go" data-a="savenote">'+lb('Save','সংরক্ষণ')+'</button></div></div>';
  else{var L=S.log.filter(function(l){return String(l.a).indexOf('Ledger')===0&&String(l.d).indexOf(c.name+' ·')===0});body='<div class="card lg" style="padding:6px 14px">'+(L.length?L.map(function(l){return '<div><b>'+esc(l.a)+'</b> <small>'+esc(l.ts)+' · '+esc(l.u)+'</small><br>'+esc(l.d)+'</div>'}).join(''):'<div class="mut">'+lb('No activity yet','কোনো কার্যক্রম নেই')+'</div>')+'</div>'}
  var moreMenuHtml='<div class="led-more-wrap" style="position:relative;display:inline-block">'
    +'<button type="button" class="ghost" data-a="ledmore" aria-label="'+lb('More actions','আরও অপশন')+'" style="font-weight:700;padding:0 12px">⋯ '+lb('More','আরও')+'</button>'
    +'<div id="ledMoreMenu" class="sg" style="right:0;left:auto;min-width:180px;display:none;position:absolute;z-index:20">'
    +'<div class="si" data-a="borrow"><span>+ '+lb('Borrow','হাওলাত আনলাম')+'</span></div>'
    +'<div class="si" data-a="lend"><span>+ '+lb('Lend','হাওলাত দিলাম')+'</span></div>'
    +(lEd()?'<div class="si" data-a="due"><span>'+lb('Due date','নির্ধারিত তারিখ')+'</span></div>':'')
    +(isA()?'<div class="si" data-a="editc"><span>'+lb('Edit party','সম্পাদনা')+'</span></div>':'')
    +'</div></div>';
  return '<header class="noprint"><div><button class="ghost" data-a="back">‹ '+lb('All customers','সব কাস্টমার')+'</button></div><div class="nav" style="display:flex;gap:6px;align-items:center"><button class="go" data-a="in">+ পেলাম</button><button class="go" data-a="out" style="background:var(--neg)">+ দিলাম</button>'+moreMenuHtml+'</div></header>'+ledPC(c,b,act)+ledChkBar(c)+ledDueBar(c)+
  '<div class="lst noprint"><div class="stat main"><small>'+lb('Balance','ব্যালেন্স')+'</small><b class="'+(b>0?'warn':b<0?'pos':'zero')+'">'+tk(Math.abs(b))+'</b><i>'+(b===0?lb('Settled','মিটে গেছে'):b>0?esc(c.name)+' '+lb('gets (we owe)','পাবে (আমরা দেব)'):esc(c.name)+' '+lb('owes us','দেবে (আমরা পাব)'))+'</i></div>'
  +(isParent?'<div class="stat main" style="border-left:2px solid var(--acc)"><small>'+lb('Combined Group Due','গ্রুপের মোট বকেয়া')+'</small><b class="'+(combinedBal>0?'warn':combinedBal<0?'pos':'zero')+'">'+tk(Math.abs(combinedBal))+'</b><i>'+subs.length+' '+lb('sub-accounts linked','টি সাব-অ্যাকাউন্ট যুক্ত')+'</i></div>':'')
  +'<div class="stat"><small>পেলাম</small><b class="pos">'+tk(ti)+'</b></div><div class="stat"><small>দিলাম</small><b class="neg">'+tk(to)+'</b></div></div>'+
  '<div class="ptabs noprint">'+T.map(function(t){return '<button data-a="tab" data-t="'+t[0]+'" class="'+(LT===t[0]?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+body}
var LS='all',LI=null,LP=0,LPAL=['#DCD8F0','#D4F8FC','#FFE9BC','#B1F1CC','#F8D4C8'];
function lAv(c,k){return c.img?'<img class="'+k+'" src="'+esc(c.img)+'" alt="">':'<div class="'+k+'" style="background:'+LPAL[c.id%5]+'">'+esc((c.name||'?').trim().slice(0,1).toUpperCase())+'</div>'}
function lShrink(f,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var k=Math.min(1,200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(imgCap(c,.7))};im.src=r.result};r.readAsDataURL(f)}
function lNum(p){var d=bd(p||'').replace(/\D/g,'');if(!d)return'';if(d.indexOf('880')===0)return d;if(d[0]==='0')return'88'+d;return'880'+d}
function dueNoticeText(c,amt){
  var s=shopN(),a=Math.abs(amt);
  return 'নমস্কার/সালাম '+c.name+', '+s+'-এ আপনার বকেয়া হিসাবের পরিমাণ ৳'+n(a)+'। অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হলো। ধন্যবাদ।';
}
function lLinks(c){
  var n=lNum(c.phone),f=(c.fb||'').trim(),h=f?(/^https?:\/\//i.test(f)?f:'https://facebook.com/'+encodeURIComponent(f.replace(/^@/,''))):'';
  var b=lBal(c.id);
  var dueMsg=(b<0)?encodeURIComponent(dueNoticeText(c,b)):'';
  var waHref=n?('https://wa.me/'+n+(dueMsg?'?text='+dueMsg:'')):'';
  var smsHref=n?('sms:+'+n+(dueMsg?(navigator.userAgent&&/iPhone|iPad|iPod/i.test(navigator.userAgent)?'&body=':'?body=')+dueMsg:'')):'';
  var hasDue=(b<0&&n);
  if(!n&&!h)return'';
  return'<div class="lcl">'+(n?'<a class="lk" href="tel:+'+n+'">'+lb('Call','কল')+'</a>'+
    (hasDue?'<a class="lk" href="'+smsHref+'" title="'+lb('Send SMS due reminder','বকেয়া তাগাদা SMS')+'">'+lb('SMS due','বকেয়া SMS')+'</a>':'<a class="lk" href="sms:+'+n+'">SMS</a>')+
    (hasDue?'<a class="lk" target="_blank" rel="noopener" href="'+waHref+'" title="'+lb('Send WhatsApp due reminder','বকেয়া তাগাদা WhatsApp')+'">'+lb('WhatsApp due','বকেয়া WhatsApp')+'</a>':'<a class="lk" target="_blank" rel="noopener" href="https://wa.me/'+n+'">WhatsApp</a>'):'')+
    (h?'<a class="lk" target="_blank" rel="noopener" href="'+esc(h)+'">Facebook</a>':'')+'</div>'
}
function possibleDupLedger(x){if(x.dupDismissed||x.void)return false;return S.ltx.some(function(y){return y.id!==x.id&&!y.void&&!y.dupDismissed&&y.c===x.c&&y.dir===x.dir&&y.amt===x.amt&&Math.abs((y.id||0)-(x.id||0))<86400000})}
function lStat(c){var a=S.ltx.filter(function(x){return x.c===c.id&&!x.void}),ti=0,to=0;a.forEach(function(x){if(x.dir==='in')ti+=x.amt;else to+=x.amt});return{ti:ti,to:to,b:ti-to,n:a.length,l:a.slice().sort(function(p,q){return q.id-p.id})[0]||null}}
function ledSum(c){var s=lStat(c),b=s.b;return'<div class="lsh">'+lAv(c,'lav')+'<div><b>'+esc(c.name)+'</b><small>'+esc(c.phone||'–')+'</small></div></div><div class="lss"><div><small>পেলাম</small><b class="pos">'+tk(s.ti)+'</b></div><div><small>দিলাম</small><b class="neg">'+tk(s.to)+'</b></div><div><small>'+lb('Balance','ব্যালেন্স')+'</small><b>'+(b===0?lb('Settled','মিটেছে'):tk(Math.abs(b))+' '+(b>0?lb('we owe','আমরা দেব'):lb('they owe','আমরা পাব')))+'</b></div></div><small class="mut">'+s.n+' '+lb('entries','এন্ট্রি')+(s.l?' · '+lb('last','শেষ')+': '+(s.l.d?sd(s.l.d):'?')+(s.l.t?' '+t12(s.l.t):''):'')+'</small><div class="lsb"><button class="ghost" data-k="o" data-id="'+c.id+'">'+lb('Open','খুলুন')+'</button>'+(isA()?'<button class="ghost" data-k="e" data-id="'+c.id+'">'+lb('Edit','সম্পাদনা')+'</button>':'')+'</div>'+lLinks(c)}
function lAct(e,close){var b=e.target.closest('[data-k]');if(!b)return;var id=+b.dataset.id;close();if(b.dataset.k==='o'){LC=id;LT='led';LF=LE='';ledUI();scrollTo(0,0)}else if(b.dataset.k==='e')ledCust(id)}
function ledList(){
  var q=LQ.toLowerCase(),all=S.cust.filter(function(c){return!c.del&&kindMatch(c,LK)}),rec=0,pay=0,ti=0,to=0,nd=0,np=0,rows=all.map(function(c){var s=lStat(c);ti+=s.ti;to+=s.to;if(s.b<0){rec-=s.b;nd++}else if(s.b>0){pay+=s.b;np++}return{c:c,s:s}}),
  cs=rows.filter(function(r){return(r.c.name+' '+(r.c.phone||'')).toLowerCase().includes(q)&&(LS==='all'||(LS==='they'&&r.s.b<0)||(LS==='we'&&r.s.b>0)||(LS==='ok'&&r.s.b===0)||(LS==='chk'&&lChkN(r.c)>0)||(LS==='flag'&&ledFlagN(r.c)>0)||(LS==='due'&&!!dueState(r.c)))}).sort(function(a,b){return LS==='all'?a.c.name.localeCompare(b.c.name):Math.abs(b.s.b)-Math.abs(a.s.b)}),
  F=[['all',lb('All','সব')],['they',lb('They owe','পাবো')],['we',lb('We owe','দেবো')],['ok',lb('Settled','মিটেছে')]].concat(lEd()?[['chk',lb('Check','যাচাই')+' ('+all.filter(function(c){return lChkN(c)>0}).length+')']]:[]).concat(lEd()?[['flag',lb('Flagged','চিহ্নিত')+' ('+all.filter(function(c){return ledFlagN(c)>0}).length+')'],['due',lb('Due','তারিখ')+' ('+all.filter(function(c){return dueState(c)}).length+')']]:[]).concat(isA()?[['arc',lb('Archive','আর্কাইভ')+' ('+S.cust.filter(function(c){return c.del}).length+')']]:[]),
  KT=[['','All kinds'],['Customer','Customer'],['Investor','Investor'],['Supplier','Supplier'],['Borrower/Lender','Borrower/Lender']],
  T=function(k,h,v,m){return'<div class="stat '+k+'"><small>'+h+'</small><b>'+v+'</b><i>'+m+'</i></div>'};
  return'<header><div><div class="shop">'+lb('Customer ledger','কাস্টমার খাতা')+'</div><h1>'+lb('Customers','কাস্টমার')+'</h1></div><button class="go" data-a="newc">+ '+lb('Customer','কাস্টমার')+'</button></header>'+
  '<div class="lsm">'+T('d1',lb('Total dues (they owe us)','মোট পাওনা'),tk(rec),nd+' '+lb('parties','পক্ষ'))+T('d2',lb('Total payable (we owe)','মোট দেনা'),tk(pay),np+' '+lb('parties','পক্ষ'))+T('d3',lb('Net position','নিট অবস্থা'),tk(Math.abs(rec-pay)),rec>=pay?lb('Net receivable','নিট পাওনা'):lb('Net payable','নিট দেনা'))+T('d4',lb('Borrow / Lend net','Borrow / Lend'),tk(Math.abs(S.ltx.filter(function(x){return!x.void&&x.btype}).reduce(function(a,x){return a+(x.dir==='in'?x.amt:-x.amt)},0))),S.ltx.filter(function(x){return!x.void&&x.btype==='Borrow'}).length+' Borrow · '+S.ltx.filter(function(x){return!x.void&&x.btype==='Lend'}).length+' Lend')+'</div>'+ledTopBar()+ledDueTop()+
  '<div class="ptabs kindTabs">'+KT.map(function(f){return'<button data-a="kind" data-f="'+f[0]+'" class="'+(LK===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'+
  '<input id="lq" value="'+esc(LQ)+'" placeholder="'+lb('Search name or phone','নাম বা ফোন খুঁজুন')+'" style="margin-bottom:10px"><div class="ptabs">'+F.map(function(f){return'<button data-a="flt" data-f="'+f[0]+'" class="'+(LS===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'+
  (LS==='arc'&&isA()?ledArch():cs.length?'<div class="lcg">'+cs.map(function(r){var c=r.c,s=r.s,b=s.b;var subCnt=lSubAccounts(c.id).length,pCust=c.parentId?S.cust.find(function(x){return !x.del&&x.id===c.parentId}):null;var parentLabel=pCust?'<small class="mut" style="display:block;font-size:11px">↳ '+lb('Parent: ','অভিভাবক: ')+esc(pCust.name)+'</small>':'';var groupBadge=subCnt>0?'<span class="b o" style="font-size:10.5px;margin-left:4px">'+subCnt+' '+lb('sub-accounts','সাব-অ্যাকাউন্ট')+'</span>':'';return'<div class="card lcc" data-a="open" data-id="'+c.id+'">'+lAv(c,'lav')+'<div class="lci"><b>'+esc(c.name)+'</b>'+groupBadge+parentLabel+'<small>'+esc(c.phone||'')+(c.kind?' · '+esc(kindLabel(c.kind)):'')+(dueState(c)?' · '+lb('Due ','তারিখ ')+sd(c.due):'')+'</small></div><div class="lcb '+(b>0?'warn':b<0?'pos':'zero')+'">'+(b===0?'–':tk(Math.abs(b)))+'<small>'+(b>0?lb('We owe','আমরা দেব'):b<0?lb('They owe','আমরা পাব'):lb('Settled','মিটেছে'))+'</small></div></div>'}).join('')+'</div>':'<div class="card"><div class="empty">'+lb('No parties found','কোনো পক্ষ পাওয়া যায়নি')+'</div></div>')}
function ledPC(c,b,act){
  var l=act.slice().sort(function(p,q){return q.id-p.id})[0]||null,sn=new Date(c.id),
  pCust=c.parentId?S.cust.find(function(x){return !x.del&&x.id===c.parentId}):null,
  parentBadge=pCust?'<div style="margin-top:4px"><span class="b o" role="button" tabindex="0" data-a="openparent" data-id="'+pCust.id+'" style="cursor:pointer;font-size:12px">↳ '+lb('Parent: ','অভিভাবক: ')+esc(pCust.name)+' ('+tk(Math.abs(lBal(pCust.id)))+')</span></div>':'',
  tl=function(k,p,h,v){return'<div class="pt2 '+k+'"><span class="pti"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg></span><div><b>'+h+'</b><small>'+v+'</small></div></div>'};
  return'<div class="card pc noprint"><div class="pci">'+lAv(c,'pav')+'<div class="pn">'+esc(c.name)+'</div>'+parentBadge+'<div class="pph">'+esc(c.phone||lb('No phone','ফোন নেই'))+'</div>'+lLinks(c)+(c.kind||c.addr||c.rel?'<div class="mut" style="margin-top:8px;font-size:12px">'+[kindLabel(c.kind),c.addr,c.rel].filter(Boolean).map(esc).join(' · ')+'</div>':'')+'</div><div class="pct">'+
  tl('a','<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',lb('Phone','ফোন'),esc(c.phone||'–'))+
  tl('b','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',lb('Last entry','শেষ এন্ট্রি'),l?tk(l.amt)+' · '+(l.d?sd(l.d):'?')+(l.t?' '+t12(l.t):''):'–')+
  tl('c','<path d="M4 7h16M4 12h16M4 17h10"/>',lb('Balance','ব্যালেন্স'),b===0?lb('Settled','মিটে গেছে'):tk(Math.abs(b))+' '+(b>0?lb('we owe','আমরা দেব'):lb('they owe','আমরা পাব')))+
  tl('d','<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',lb('Since','থেকে'),isNaN(sn)?'–':sd(iso(sn)))+'</div></div>'}
function ledCust(id){
  var c=id?S.cust.find(function(x){return x.id===id}):null;LI=c&&c.img?c.img:null;
  var curKind=kindLabel(c&&c.kind);
  var pv=function(){var nm=($('lcn')&&$('lcn').value)||(c&&c.name)||'?';$('lcpv').innerHTML=LI?'<img class="lav" src="'+esc(LI)+'" alt="">':'<div class="lav" style="background:'+LPAL[(c?c.id:0)%5]+'">'+esc(nm.trim().slice(0,1).toUpperCase())+'</div>'};
  var parents = S.cust.filter(function(x){ return !x.del && (!c || (x.id !== c.id && x.parentId !== c.id)); });
  var parentOpts = '<option value="">-- '+lb('None (Standalone Account)','কোনোটি নয় (স্বতন্ত্র অ্যাকাউন্ট)')+' --</option>' +
    parents.map(function(p){ return '<option value="'+p.id+'"'+(c&&c.parentId===p.id?' selected':'')+'>'+esc(p.name)+' ('+esc(kindLabel(p.kind))+')</option>'; }).join('');
  ask(c?lb('Edit party','পক্ষ সম্পাদনা'):lb('New party','নতুন পক্ষ'),'<div class="pf1"><span id="lcpv"></span><button type="button" class="ghost" data-lc="cam">'+lb('Camera','ক্যামেরা')+'</button><button type="button" class="ghost" data-lc="gal">'+lb('Gallery','গ্যালারি')+'</button><button type="button" class="ghost" data-lc="rm">'+lb('Remove','সরান')+'</button><input id="lci1" type="file" accept="image/*" capture="environment" hidden><input id="lci2" type="file" accept="image/*" hidden></div><div class="f"><label>'+lb('Name','নাম')+'</label><input id="lcn" maxlength="60" value="'+esc(c?c.name:'')+'"></div><div class="f"><label>'+lb('Kind','ধরন')+'</label><select id="lck">'+['Customer','Investor','Supplier','Borrower/Lender'].map(function(k){return'<option'+(curKind===k?' selected':'')+'>'+k+'</option>'}).join('')+'</select></div><div class="f"><label>'+lb('Parent account (Optional for group / family / branches)','মূল অভিভাবক অ্যাকাউন্ট (গ্রুপ / পরিবার / ব্রাঞ্চের জন্য ঐচ্ছিক)')+'</label><select id="lcParent">'+parentOpts+'</select></div><div class="f"><label>'+lb('Phone (optional)','ফোন (ঐচ্ছিক)')+'</label><input id="lcp" type="tel" maxlength="20" value="'+esc(c?c.phone||'':'')+'"></div><div class="f"><label>'+lb('Address','ঠিকানা')+'</label><input id="lca" maxlength="180" value="'+esc(c?c.addr||'':'')+'"></div><div class="f"><label>'+lb('Relationship','সম্পর্ক')+'</label><input id="lcr" maxlength="80" value="'+esc(c?c.rel||'':'')+'"></div><div class="f"><label>'+lb('Facebook link or username (optional)','ফেসবুক লিংক বা ইউজারনেম (ঐচ্ছিক)')+'</label><input id="lcf" maxlength="120" value="'+esc(c?c.fb||'':'')+'"></div>'+(c&&isA()?'<div class="f"><button type="button" class="ghost" data-lc="del" style="color:var(--neg)">'+lb('Archive party','পক্ষ আর্কাইভ করুন')+'</button></div>':''),function(){
    var nm=$('lcn').value.trim();if(!nm){$('lcn').style.borderColor='var(--neg)';return false}
    if(S.cust.some(function(x){return!x.del&&(!c||x.id!==c.id)&&x.name.toLowerCase()===nm.toLowerCase()})){ltoast(lb('Name already exists','এই নামে আছে'));return false}
    var pid=$('lcParent')?(+$('lcParent').value||null):null;
    var o={name:nm,kind:$('lck').value,parentId:pid,phone:$('lcp').value.trim(),addr:$('lca').value.trim(),rel:$('lcr').value.trim(),fb:$('lcf').value.trim(),img:LI||''};
    if(c){Object.assign(c,o);lg('Ledger party','Edited '+nm)}else{var k=Object.assign({id:Date.now(),note:''},o);S.cust.push(k);LC=k.id;LT='led';lg('Ledger party','Added '+nm+' ('+o.kind+')')}
    save();ledUI()},lb('Save','সংরক্ষণ'));
  pv();$('lcn').oninput=pv;
  $('ob').onclick=function(e){var b=e.target.closest('[data-lc]');if(!b)return;var k=b.dataset.lc;if(k==='cam')$('lci1').click();else if(k==='gal')$('lci2').click();else if(k==='del'){$('ov').hidden=true;ledDel(c.id)}else{LI=null;pv()}};
  $('ob').onchange=function(e){var f=e.target.files&&e.target.files[0];if(f)lShrink(f,function(d){LI=d;pv()})}}
