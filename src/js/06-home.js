/* ---------- 06-home: Dashboard Overview, Icon Filters & Salat Module ---------- */

const PER = [
  ['today', '📅', 'Today', 'আজ'],
  ['yest', '⏪', 'Yesterday', 'গতকাল'],
  ['7', '7️⃣', '7 Days', '৭ দিন'],
  ['30', '🗓️', '1 Month', '১ মাস'],
  ['90', '📊', '3 Months', '৩ মাস'],
  ['180', '📈', '6 Months', '৬ মাস'],
  ['all', '🌐', 'Overall', 'সর্বমোট'],
  ['custom', '📆', 'Custom', 'কাস্টম']
];
let HP = 'today', HCA = '', HCB = '';

function prange(p){
  const t = new Date(), a = new Date();
  if(p === 'today') return [iso(t), iso(t)];
  if(p === 'yest'){ a.setDate(a.getDate() - 1); return [iso(a), iso(a)]; }
  if(p === 'all') return [NCS_MIN_DATE, '9999'];
  if(p === 'custom') return [HCA || NCS_MIN_DATE, HCB || todayIso()];
  a.setDate(a.getDate() - (+p - 1));
  return [iso(a), iso(t)];
}

/* ---------- Salat Times & Alarm Engine ---------- */
let salatTimingsCache = null;
const salatAlertedToday = {};

function fetchDhakaSalat(callback){
  const today = todayIso();
  try{
    const cached = sessionStorage.getItem('ncs_salat_v1');
    if(cached){
      const parsed = JSON.parse(cached);
      if(parsed && parsed.date === today && parsed.timings){
        salatTimingsCache = parsed.timings;
        updateHeaderSalat(parsed.timings);
        if(callback) callback(parsed.timings);
        return;
      }
    }
  }catch(e){}

  if(typeof navigator !== 'undefined' && navigator.onLine === false){
    if(callback) callback(null);
    return;
  }

  fetch('https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1')
    .then(r => r.json())
    .then(data => {
      if(data && data.data && data.data.timings){
        salatTimingsCache = data.data.timings;
        try{
          sessionStorage.setItem('ncs_salat_v1', JSON.stringify({ date: today, timings: data.data.timings }));
        }catch(e){}
        updateHeaderSalat(data.data.timings);
        if(callback) callback(data.data.timings);
      }
    })
    .catch(() => {
      if(callback) callback(null);
    });
}

function updateHeaderSalat(timings){
  if(!timings) return;
  const isBn = S.lang === 'bn';
  const now = new Date();
  const curMins = now.getHours() * 60 + now.getMinutes();

  const prayerList = [
    { id: 'Fajr', en: 'Fajr', bn: 'ফজর', t: timings.Fajr, icon: '🌅' },
    { id: 'Sunrise', en: 'Sunrise', bn: 'সূর্যোদয়', t: timings.Sunrise, icon: '☀️', isSun: true },
    { id: 'Dhuhr', en: 'Dhuhr', bn: 'যোহর', t: timings.Dhuhr, icon: '☀️' },
    { id: 'Asr', en: 'Asr', bn: 'আসর', t: timings.Asr, icon: '🌤️' },
    { id: 'Maghrib', en: 'Maghrib', bn: 'মাগরিব', t: timings.Maghrib, icon: '🌇' },
    { id: 'Isha', en: 'Isha', bn: 'ইশা', t: timings.Isha, icon: '🌙' }
  ];

  /* Find next prayer */
  let nextP = null;
  let minDiff = Infinity;
  prayerList.forEach(p => {
    if(!p.t) return;
    const [h, m] = p.t.split(':').map(Number);
    const pMins = h * 60 + m;
    let diff = pMins - curMins;
    if(diff < 0) diff += 24 * 60;
    if(diff < minDiff){
      minDiff = diff;
      nextP = { ...p, diffMins: diff };
    }
  });

  const hpName = $('hpName'), hpTime = $('hpTime');
  if(hpName && nextP) hpName.textContent = isBn ? nextP.bn : nextP.en;
  if(hpTime && nextP) hpTime.textContent = t12(nextP.t);

  const popover = $('hdrPrayerPopover');
  if(popover){
    const diffH = nextP ? Math.floor(nextP.diffMins / 60) : 0;
    const diffM = nextP ? (nextP.diffMins % 60) : 0;
    const diffStr = isBn
      ? (diffH > 0 ? toBnNum(diffH) + ' ঘণ্টা ' : '') + toBnNum(diffM) + ' মিনিট বাকি'
      : (diffH > 0 ? diffH + 'h ' : '') + diffM + 'm left';

    popover.innerHTML = '' +
      '<div class="hp-pop-head">' +
        '<b>' + (isBn ? 'নামাজের সময়সূচী' : 'Prayer Times') + '</b>' +
        '<small class="mut">Dhaka · ' + (nextP ? (isBn ? nextP.bn : nextP.en) + ' (' + diffStr + ')' : '') + '</small>' +
      '</div>' +
      '<div class="hp-pop-grid">' +
        prayerList.map(p => {
          const isNext = nextP && nextP.id === p.id;
          return '<div class="hp-pop-item' + (isNext ? ' on' : '') + '">' +
            '<span>' + p.icon + ' ' + (isBn ? p.bn : p.en) + '</span>' +
            '<b>' + t12(p.t) + '</b>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="hp-pop-foot">' +
        '<small class="mut">' + (isBn ? 'সম্পূর্ণ সময়সূচী দেখতে ক্লিক করুন' : 'Click to view full prayer card & test alarm') + '</small>' +
      '</div>';
  }
}

function openFullSalatModal(){
  fetchDhakaSalat(timings => {
    if(!timings){
      if(typeof ltoast === 'function') ltoast(lb('Prayer timings unavailable offline', 'নামাজের সময়সূচী অফলাইনে পাওয়া যায়নি'));
      return;
    }
    const isBn = S.lang === 'bn';
    const now = new Date();
    const curMins = now.getHours() * 60 + now.getMinutes();

    const prayerList = [
      { id: 'Fajr', en: 'Fajr', bn: 'ফজর', t: timings.Fajr, icon: '🌅' },
      { id: 'Sunrise', en: 'Sunrise', bn: 'সূর্যোদয়', t: timings.Sunrise, icon: '☀️', isSun: true },
      { id: 'Dhuhr', en: 'Dhuhr', bn: 'যোহর', t: timings.Dhuhr, icon: '☀️' },
      { id: 'Asr', en: 'Asr', bn: 'আসর', t: timings.Asr, icon: '🌤️' },
      { id: 'Maghrib', en: 'Maghrib', bn: 'মাগরিব', t: timings.Maghrib, icon: '🌇' },
      { id: 'Isha', en: 'Isha', bn: 'ইশা', t: timings.Isha, icon: '🌙' }
    ];

    let nextP = null;
    let minDiff = Infinity;
    prayerList.forEach(p => {
      if(!p.t) return;
      const [h, m] = p.t.split(':').map(Number);
      const pMins = h * 60 + m;
      let diff = pMins - curMins;
      if(diff < 0) diff += 24 * 60;
      if(diff < minDiff){
        minDiff = diff;
        nextP = { ...p, diffMins: diff };
      }
    });

    const diffH = nextP ? Math.floor(nextP.diffMins / 60) : 0;
    const diffM = nextP ? (nextP.diffMins % 60) : 0;
    const diffStr = isBn
      ? (diffH > 0 ? toBnNum(diffH) + ' ঘণ্টা ' : '') + toBnNum(diffM) + ' মিনিট বাকি'
      : (diffH > 0 ? diffH + 'h ' : '') + diffM + 'm left';

    const bodyHtml = '' +
      '<div style="margin-bottom:12px">' +
        '<div style="font-size:12.5px;color:var(--mut);margin-bottom:8px">' +
          (nextP ? ('▸ ' + (isBn ? 'পরবর্তী নামাজ: ' : 'Next Prayer: ') + '<b style="color:var(--acc)">' + (isBn ? nextP.bn : nextP.en) + '</b> (' + diffStr + ')') : '') +
        '</div>' +
        '<div class="salat-grid">' +
          prayerList.map(p => {
            const isNext = nextP && nextP.id === p.id;
            const tFormatted = t12(p.t);
            return '' +
              '<div class="salat-box' + (isNext ? ' salat-box-active' : '') + (p.isSun ? ' salat-box-sun' : '') + '">' +
                '<div class="sb-icon">' + p.icon + '</div>' +
                '<div class="sb-name">' + (isBn ? p.bn : p.en) + '</div>' +
                '<b class="sb-time">' + (isBn ? toBnNum(tFormatted) : tFormatted) + '</b>' +
                (isNext ? '<span class="sb-badge">' + (isBn ? 'পরবর্তী' : 'NEXT') + '</span>' : '') +
              '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:10px;margin-top:10px">' +
        '<small class="mut">' + (isBn ? 'প্রতি ওয়াক্তে স্বয়ংক্রিয় আযান/অ্যালার্ম বাজবে' : 'Automatic prayer chime plays on arrival') + '</small>' +
        '<button type="button" class="ghost" id="btnTestSalatAlarmModal" style="height:30px;padding:0 10px;font-size:12px">🔔 ' + (isBn ? 'অ্যালার্ম পরীক্ষা' : 'Test Sound') + '</button>' +
      '</div>';

    ask(lb('🕌 Salat Times — Dhaka (UTC+6)', '🕌 নামাজের সময়সূচী — ঢাকা'), bodyHtml, function(){ return true; }, lb('Close', 'বন্ধ করুন'), true);

    const testBtn = $('btnTestSalatAlarmModal');
    if(testBtn){
      testBtn.onclick = function(){
        const pName = isBn ? (nextP ? nextP.bn : 'আসর') : (nextP ? nextP.en : 'Asr');
        showSalatAlarmToast(pName, nextP ? t12(nextP.t) : '3:45 PM');
      };
    }
  });
}

if(typeof document !== 'undefined'){
  document.addEventListener('click', function(e){
    var b = e.target.closest('#hdrPrayerBtn');
    if(b) openFullSalatModal();
  });
}

fetchDhakaSalat();
setInterval(function(){ fetchDhakaSalat(); }, 60000);

function showSalatAlarmToast(prayerName, timeFormatted){
  try{ Sound.chime(); }catch(e){}
  
  let wrap = $('salatAlarmWrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'salatAlarmWrap';
    wrap.className = 'salat-alarm-wrap';
    document.body.appendChild(wrap);
  }
  wrap.hidden = false;

  const isBn = S.lang === 'bn';
  const toast = document.createElement('div');
  toast.className = 'salat-alert-toast';
  toast.innerHTML = '' +
    '<div class="sat-icon">🕌</div>' +
    '<div class="sat-content">' +
      '<b>' + prayerName + ' · ' + (isBn ? 'নামাজের সময় হয়েছে' : 'Prayer Time') + '</b>' +
      '<small>' + (timeFormatted || '') + ' — ' + (isBn ? 'হাইয়া আলাস সালাহ (নামাজের জন্য এসো)' : 'Hayya alas-Salah (Come to Prayer)') + '</small>' +
    '</div>' +
    '<button type="button" class="sat-x" aria-label="Dismiss">✕</button>';

  toast.querySelector('.sat-x').onclick = function(){
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  };

  wrap.appendChild(toast);

  /* Auto-dismiss after 6 seconds */
  setTimeout(() => {
    if(toast && toast.parentNode){
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 350);
    }
  }, 6000);
}

function checkSalatAlarm(){
  if(!salatTimingsCache) return;
  const now = new Date();
  const nowH = String(now.getHours()).padStart(2, '0');
  const nowM = String(now.getMinutes()).padStart(2, '0');
  const curTime = nowH + ':' + nowM;
  const today = todayIso();

  const prayers = [
    { id: 'Fajr', en: 'Fajr', bn: 'ফজর', t: salatTimingsCache.Fajr },
    { id: 'Dhuhr', en: 'Dhuhr', bn: 'যোহর', t: salatTimingsCache.Dhuhr },
    { id: 'Asr', en: 'Asr', bn: 'আসর', t: salatTimingsCache.Asr },
    { id: 'Maghrib', en: 'Maghrib', bn: 'মাগরিব', t: salatTimingsCache.Maghrib },
    { id: 'Isha', en: 'Isha', bn: 'ইশা', t: salatTimingsCache.Isha }
  ];

  prayers.forEach(p => {
    if(!p.t) return;
    const alertKey = today + '_' + p.id;
    if(p.t === curTime && !salatAlertedToday[alertKey]){
      salatAlertedToday[alertKey] = true;
      const isBn = S.lang === 'bn';
      showSalatAlarmToast(isBn ? p.bn : p.en, t12(p.t));
    }
  });
}
setInterval(checkSalatAlarm, 20000);

function renderSalatCard(){
  const el = $('hSalat');
  if(el) el.style.display = 'none';
  fetchDhakaSalat();
}

/* ---------- Main Dashboard Render ---------- */
function homeUI(){
  try{ renderWalletCards(); }catch(e){}
  try{ applyCardSettings(); }catch(e){}

  $('hTitle').textContent = lb('Hello, ', 'হ্যালো, ') + (U ? U.name : '');
  $('hQa').querySelectorAll('[data-q]').forEach(function(b){
    var k = b.dataset.q;
    var l = k === 'sale' ? lb('New sale', 'নতুন বিক্রয়') : k === 'purchase' ? lb('New purchase', 'নতুন ক্রয়') : k === 'acc' ? lb('Accounts', 'হিসাব') : lb("Today's bills", 'আজকের বিল');
    b.querySelector('.qal').textContent = l;
  });

  /* Icon-based Filter Tabs */
  $('hTabs').innerHTML = PER.map(([k, ic, en, bn]) =>
    `<button type="button" data-p="${k}" class="${HP===k?'on':''}" title="${S.lang==='bn'?bn:en}">
      <span class="ptab-ic">${ic}</span>
      <span class="ptab-txt">${S.lang==='bn'?bn:en}</span>
    </button>`
  ).join('');

  /* Custom Date Range Picker Container */
  var cBar = $('hCustomBar');
  if(cBar){
    if(HP === 'custom'){
      cBar.hidden = false;
      cBar.innerHTML = '' +
        '<div class="hcr-wrap">' +
          '<div class="hcr-inputs">' +
            '<div class="hcr-item"><label>' + lb('From Date', 'শুরুর দিন') + '</label><input id="hcaInp" type="date" min="' + NCS_MIN_DATE + '" max="' + todayIso() + '" value="' + (HCA || NCS_MIN_DATE) + '"></div>' +
            '<div class="hcr-item"><label>' + lb('To Date', 'শেষ দিন') + '</label><input id="hcbInp" type="date" min="' + NCS_MIN_DATE + '" max="' + todayIso() + '" value="' + (HCB || todayIso()) + '"></div>' +
          '</div>' +
          '<button type="button" class="go" id="hcrGo" style="height:36px;padding:0 16px;font-size:13px;align-self:flex-end">' + lb('Apply Filter', 'ফিল্টার করুন') + '</button>' +
        '</div>';
      var bGo = $('hcrGo');
      if(bGo){
        bGo.onclick = function(){
          var aVal = $('hcaInp') ? $('hcaInp').value : '';
          var bVal = $('hcbInp') ? $('hcbInp').value : '';
          if(aVal && bVal && aVal > bVal){
            Sound.buzz();
            ltoast(lb('Start date cannot be after end date', 'শুরুর দিন শেষের দিনের পরে হতে পারে না'));
            return;
          }
          HCA = aVal;
          HCB = bVal;
          homeUI();
        };
      }
    } else {
      cBar.hidden = true;
      cBar.innerHTML = '';
    }
  }

  const [a, b] = prange(HP);
  const E = S.entries.filter(e => !e.void && !e.removed && e.d >= a && e.d <= b);
  const B = S.bills.filter(x => !x.void && !x.removed && !x.test && x.d >= a && x.d <= b);
  const sm = (t, f) => E.filter(e => e.type === t && !isWalletTransfer(e) && (!f || f(e))).reduce((s, e) => s + e.amt, 0);
  const m = calc();
  const act = sorted().filter(e => !e.void);
  const cb = act.length ? m[act[act.length - 1].id].bal : (+S.start || 0);
  const C = (l, v, c, num) => `<div class="stat ${c||''}"><small>${l}</small><b${num!=null?' class="cnt" data-to="'+num+'"':''}>${v}</b></div>`;

  $('hHero').innerHTML = `<div class="dclk" id="hClk" aria-label="${lb('Current time','বর্তমান সময়')}"><b id="hClkT"></b><small id="hClkD"></small></div><small>Cash Balance</small><b class="cnt" data-to="${cb}">${tk(cb)}</b><i>${sd(todayIso())} · ${esc(U?U.name:'')}</i>`;
  clkTick();

  var sellT = sm('Sale'), buyT = sm('Purchase');
  $('hStats').innerHTML = C('Total Sell', tk(sellT), 't3', sellT) + C('Total Buy', tk(buyT), 't2', buyT) + C('Bills', B.length, 't4') + C('To receive (Due)', tk(sm('Sale', e => e.pay === 'Due')), 't1') + C('To give (Due)', tk(sm('Purchase', e => e.pay === 'Due')), 'sf');

  if(canCost()){
    try{
      var smap = (POS && typeof POS.stockMap === 'function') ? POS.stockMap() : {};
      var sv = S.products.filter(p => !p.del).reduce((s, p) => s + Math.max(0, smap[p.id] || 0) * (+p.buy || 0), 0);
      $('hStats').insertAdjacentHTML('beforeend', C('Stock value (cost)', tk(sv), 'sf'));
    }catch(e){}
  }

  var todayE = S.entries.filter(e => !e.void && !e.removed && e.d === todayIso()), inT = 0, outT = 0;
  todayE.forEach(e => {
    var c = cash(e);
    if(c > 0) inT += c;
    else if(c < 0) outT += -c;
  });
  var netT = inT - outT;
  $('hToday').innerHTML = (todayE.length
    ? '<span class="tpill pos"><small>' + lb('Cash in', 'নগদ এসেছে') + '</small><b>' + tk(inT) + '</b></span>'
      + '<span class="tpill neg"><small>' + lb('Cash out', 'নগদ গেছে') + '</small><b>' + tk(outT) + '</b></span>'
      + '<span class="tpill net"><small>' + lb('Net', 'নিট') + '</small><b>' + (netT > 0 ? '+' : netT < 0 ? '−' : '') + tk(Math.abs(netT)) + '</b></span>'
      + '<span class="tpill"><small>' + lb('Entries', 'এন্ট্রি') + '</small><b>' + todayE.length + '</b></span>'
    : '<span class="tpill mut">' + lb('No cash movements today', 'আজ কোনো নগদ লেনদেন নেই') + '</span>');

  (function(){
    var canOpen = isA() || role() === 'accountant' || role() === 'cashier';
    var custAll = S.cust.filter(c => !c.del);
    if(!custAll.length || !canOpen){ $('hOwe').hidden = true; $('hOwe').innerHTML = ''; return; }
    var recv = 0, pay = 0, recvN = 0, payN = 0;
    custAll.forEach(c => {
      var s = lStat(c);
      if(s.b < 0){ recv += -s.b; recvN++; }
      else if(s.b > 0){ pay += s.b; payN++; }
    });
    var net = recv - pay, netLabel = recv >= pay ? lb('Net receivable', 'নিট পাওনা') : lb('Net payable', 'নিট দেনা');
    $('hOwe').hidden = false;
    $('hOwe').innerHTML = '<div class="howe-head"><h3 class="dchh" style="padding:0;margin:0;font-size:15px">' + lb('Who owes whom', 'কার কাছে পাওনা / দেনা') + '</h3><button class="ghost" data-q="owe-led">' + lb('Open Ledger', 'খাতা খুলুন') + ' →</button></div>'
      + '<div class="howe-body">'
      + '<div class="howe-box recv"><small>' + lb('They owe us', 'আমরা পাব') + '</small><b>' + tk(recv) + '</b><i>' + recvN + ' ' + lb('parties', 'পক্ষ') + '</i></div>'
      + '<div class="howe-box pay"><small>' + lb('We owe', 'আমরা দেব') + '</small><b>' + tk(pay) + '</b><i>' + payN + ' ' + lb('parties', 'পক্ষ') + '</i></div>'
      + '</div>'
      + '<div class="howe-foot"><span>' + netLabel + ': <b>' + tk(Math.abs(net)) + '</b></span><span>' + (recvN + payN) + ' ' + lb('parties', 'পক্ষ') + '</span></div>';
  })();

  /* 7-day Bar chart with 7 distinct day colors */
  const ds = [...Array(7)].map((_, i) => {
    const x = new Date();
    x.setDate(x.getDate() - 6 + i);
    return iso(x);
  });
  const dv = d => S.entries.reduce((o, e) => {
    if(!e.void && !e.removed && !isWalletTransfer(e) && e.d === d){
      if(e.type === 'Sale') o.s += e.amt;
      else if(e.type === 'Purchase') o.b += e.amt;
    }
    return o;
  }, { s: 0, b: 0 });
  const rows = ds.map(d => ({ d: d, ...dv(d) }));
  const mx = Math.max(1, ...rows.map(r => Math.max(r.s, r.b)));
  $('hChart').innerHTML = rows.map(r =>
    `<div class="dcol" title="${r.d} · Sell ${n(r.s)} · Buy ${n(r.b)}">
      <div class="dbars">
        <div class="dbs" style="height:${Math.ceil(r.s/mx*100)}%"></div>
        <div class="dbb" style="height:${Math.ceil(r.b/mx*100)}%"></div>
      </div>
      <small style="color:${dayColor(r.d)};font-weight:700">${r.d.slice(8)}</small>
    </div>`
  ).join('');

  /* Payment Donut Chart */
  const sE = E.filter(e => e.type === 'Sale' && !isWalletTransfer(e));
  const pt = sE.reduce((s, e) => s + e.amt, 0);
  const pay = { Cash: 0, 'Mobile Banking': 0, Bank: 0, Due: 0, Other: 0 };
  sE.forEach(e => {
    var p = e.pay;
    if(p === 'Cash') pay.Cash += e.amt;
    else if(p === 'Mobile Banking') pay['Mobile Banking'] += e.amt;
    else if(p === 'Bank') pay.Bank += e.amt;
    else if(p === 'Due') pay.Due += e.amt;
    else pay.Other += e.amt;
  });
  const segs = [['Cash', pay.Cash, '--ch1'], ['Mobile', pay['Mobile Banking'], '--ch2'], ['Bank', pay.Bank, '--ch3'], ['Due', pay.Due, '--ch4'], ['Other', pay.Other, '--ch5']].filter(x => x[1] > 0);
  let stops = '', acc = 0;
  segs.forEach(([k, v, c]) => {
    if(v > 0) stops += `var(${c}) ${acc/pt*100}% ${(acc+v)/pt*100}%,`;
    acc += v;
  });
  $('hPay').innerHTML = `<div class="dwrap${pt>0?'':' zero'}"${pt>0?` style="background:conic-gradient(${stops.slice(0,-1)})"`:''}><div class="dhole"><b>${tk(pt)}</b><small>Sales</small></div></div><div class="dleg">${segs.map(([k,v,c])=>`<div><i style="background:var(${c})"></i>${k}<b>${tk(v)}</b></div>`).join('')}</div>`;

  /* Category breakdown bar */
  (function(){
    var CH = ['--ch1', '--ch2', '--ch3', '--ch4', '--ch5'], catMap = {}, catEl = $('hCatBar');
    if(!catEl) return;
    E.filter(e => e.type === 'Sale' && !isWalletTransfer(e)).forEach(e => {
      var c = e.cat || lb('Uncategorized', 'অশ্রেণিভুক্ত');
      catMap[c] = (catMap[c] || 0) + e.amt;
    });
    var cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    var top = cats.slice(0, 5), rest = cats.slice(5).reduce((s, x) => s + x[1], 0), total = cats.reduce((s, x) => s + x[1], 0);
    if(rest > 0) top.push([lb('Others', 'অন্যান্য'), rest]);
    if(!total || !top.length){ catEl.innerHTML = ''; return; }
    catEl.innerHTML = '<div class="dcat-title">' + lb('Sales by category', 'বিভাগ অনুযায়ী বিক্রয়') + '</div>'
      + '<div class="dcat-bar">' + top.map(function(x, i){ return '<span style="width:' + Math.max(1, Math.round(x[1]/total*100)) + '%;background:var(' + CH[i%CH.length] + ')"></span>'; }).join('') + '</div>'
      + '<div class="dcat-leg">' + top.map(function(x, i){ return '<div><i style="background:var(' + CH[i%CH.length] + ')"></i>' + esc(x[0]) + ' <b>' + tk(x[1]) + '</b></div>'; }).join('') + '</div>';
  })();

  /* Render Salat Times Card */
  renderSalatCard();

  try{ animateCounts(); }catch(e){}
}

/* Dashboard Event Listeners */
$('hTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-p]');
  if(b){
    HP = b.dataset.p;
    homeUI();
  }
});

$('hQa').addEventListener('click', e => {
  const b = e.target.closest('[data-q]');
  if(!b) return;
  const q = b.dataset.q;
  if(q === 'sale' || q === 'purchase'){ POS.setMode(q); go('pos'); }
  else if(q === 'acc') go('acc');
  else{ go('pos'); POS.bills(); }
});

$('hOwe').addEventListener('click', e => {
  if(e.target.closest('[data-q="owe-led"]')) go('led');
});
