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

/* ==========================================================================
   LOCATIONS, WEATHER, AIR QUALITY & ACTIVE SALAT ENGINE
   ========================================================================== */

const BD_DIVISIONS = [
  { id: 'dhaka', en: 'Dhaka Division', bn: 'ঢাকা বিভাগ' },
  { id: 'chattogram', en: 'Chattogram Division', bn: 'চট্টগ্রাম বিভাগ' },
  { id: 'sylhet', en: 'Sylhet Division', bn: 'সিলেট বিভাগ' },
  { id: 'rajshahi', en: 'Rajshahi Division', bn: 'রাজশাহী বিভাগ' },
  { id: 'khulna', en: 'Khulna Division', bn: 'খুলনা বিভাগ' },
  { id: 'barishal', en: 'Barishal Division', bn: 'বরিশাল বিভাগ' },
  { id: 'rangpur', en: 'Rangpur Division', bn: 'রংপুর বিভাগ' },
  { id: 'mymensingh', en: 'Mymensingh Division', bn: 'ময়মনসিংহ বিভাগ' }
];

const BD_DISTRICTS = [
  // Dhaka Division
  { div: 'dhaka', en: 'Dhaka', bn: 'ঢাকা', lat: 23.8103, lon: 90.4125 },
  { div: 'dhaka', en: 'Gazipur', bn: 'গাজীপুর', lat: 24.0023, lon: 90.4264 },
  { div: 'dhaka', en: 'Narayanganj', bn: 'নারায়ণগঞ্জ', lat: 23.6238, lon: 90.5000 },
  { div: 'dhaka', en: 'Tangail', bn: 'টাঙ্গাইল', lat: 24.2513, lon: 89.9167 },
  { div: 'dhaka', en: 'Narsingdi', bn: 'নরসিংদী', lat: 23.9197, lon: 90.7206 },
  { div: 'dhaka', en: 'Faridpur', bn: 'ফরিদপুর', lat: 23.6071, lon: 89.8426 },
  { div: 'dhaka', en: 'Gopalganj', bn: 'গোপালগঞ্জ', lat: 23.0051, lon: 89.8266 },
  { div: 'dhaka', en: 'Kishoreganj', bn: 'কিশোরগঞ্জ', lat: 24.4449, lon: 90.7766 },
  { div: 'dhaka', en: 'Madaripur', bn: 'মাদারীপুর', lat: 23.1641, lon: 90.1897 },
  { div: 'dhaka', en: 'Manikganj', bn: 'মানিকগঞ্জ', lat: 23.8617, lon: 90.0003 },
  { div: 'dhaka', en: 'Munshiganj', bn: 'মুন্সীগঞ্জ', lat: 23.5422, lon: 90.5305 },
  { div: 'dhaka', en: 'Rajbari', bn: 'রাজবাড়ী', lat: 23.7574, lon: 89.6445 },
  { div: 'dhaka', en: 'Shariatpur', bn: 'শরীয়তপুর', lat: 23.2423, lon: 90.3540 },

  // Chattogram Division
  { div: 'chattogram', en: 'Chattogram', bn: 'চট্টগ্রাম', lat: 22.3569, lon: 91.7832 },
  { div: 'chattogram', en: "Cox's Bazar", bn: "কক্সবাজার", lat: 21.4272, lon: 92.0058 },
  { div: 'chattogram', en: 'Cumilla', bn: 'কুমিল্লা', lat: 23.4607, lon: 91.1809 },
  { div: 'chattogram', en: 'Feni', bn: 'ফেনী', lat: 23.0159, lon: 91.3976 },
  { div: 'chattogram', en: 'Brahmanbaria', bn: 'ব্রাহ্মণবাড়িয়া', lat: 23.9571, lon: 91.1119 },
  { div: 'chattogram', en: 'Chandpur', bn: 'চাঁদপুর', lat: 23.2333, lon: 90.6667 },
  { div: 'chattogram', en: 'Noakhali', bn: 'নোয়াখালী', lat: 22.8696, lon: 91.0995 },
  { div: 'chattogram', en: 'Lakshmipur', bn: 'লক্ষ্মীপুর', lat: 22.9425, lon: 90.8412 },
  { div: 'chattogram', en: 'Rangamati', bn: 'রাঙ্গামাটি', lat: 22.6533, lon: 92.1753 },
  { div: 'chattogram', en: 'Bandarban', bn: 'বান্দরবান', lat: 22.1953, lon: 92.2184 },
  { div: 'chattogram', en: 'Khagrachhari', bn: 'খাগড়াছড়ি', lat: 23.1193, lon: 91.9847 },

  // Sylhet Division
  { div: 'sylhet', en: 'Sylhet', bn: 'সিলেট', lat: 24.8949, lon: 91.8687 },
  { div: 'sylhet', en: 'Moulvibazar', bn: 'মৌলভীবাজার', lat: 24.4829, lon: 91.7774 },
  { div: 'sylhet', en: 'Habiganj', bn: 'হবিগঞ্জ', lat: 24.3749, lon: 91.4155 },
  { div: 'sylhet', en: 'Sunamganj', bn: 'সুনামগঞ্জ', lat: 25.0658, lon: 91.3950 },

  // Rajshahi Division
  { div: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী', lat: 24.3745, lon: 88.6042 },
  { div: 'rajshahi', en: 'Bogura', bn: 'বগুড়া', lat: 24.8465, lon: 89.3777 },
  { div: 'rajshahi', en: 'Pabna', bn: 'পাবনা', lat: 24.0064, lon: 89.2483 },
  { div: 'rajshahi', en: 'Sirajganj', bn: 'সিরাজগঞ্জ', lat: 24.4534, lon: 89.7008 },
  { div: 'rajshahi', en: 'Naogaon', bn: 'নওগাঁ', lat: 24.7936, lon: 88.9318 },
  { div: 'rajshahi', en: 'Natore', bn: 'নাটোর', lat: 24.4206, lon: 88.9324 },
  { div: 'rajshahi', en: 'Chapainawabganj', bn: 'চাঁপাইনবাবগঞ্জ', lat: 24.5965, lon: 88.2775 },
  { div: 'rajshahi', en: 'Joypurhat', bn: 'জয়পুরহাট', lat: 25.1015, lon: 89.0270 },

  // Khulna Division
  { div: 'khulna', en: 'Khulna', bn: 'খুলনা', lat: 22.8456, lon: 89.5403 },
  { div: 'khulna', en: 'Jashore', bn: 'যশোর', lat: 23.1664, lon: 89.2138 },
  { div: 'khulna', en: 'Kushtia', bn: 'কুষ্টিয়া', lat: 23.9013, lon: 89.1205 },
  { div: 'khulna', en: 'Satkhira', bn: 'সাতক্ষীরা', lat: 22.7185, lon: 89.0705 },
  { div: 'khulna', en: 'Bagerhat', bn: 'বাগেরহাট', lat: 22.6516, lon: 89.7859 },
  { div: 'khulna', en: 'Chuadanga', bn: 'চুয়াডাঙ্গা', lat: 23.6402, lon: 88.8418 },
  { div: 'khulna', en: 'Jhenaidah', bn: 'ঝিনাইদহ', lat: 23.5450, lon: 89.1726 },
  { div: 'khulna', en: 'Magura', bn: 'মাগুরা', lat: 23.4873, lon: 89.4198 },
  { div: 'khulna', en: 'Meherpur', bn: 'মেহেরপুর', lat: 23.7622, lon: 88.6318 },
  { div: 'khulna', en: 'Narail', bn: 'নড়াইল', lat: 23.1725, lon: 89.5127 },

  // Barishal Division
  { div: 'barishal', en: 'Barishal', bn: 'বরিশাল', lat: 22.7010, lon: 90.3535 },
  { div: 'barishal', en: 'Bhola', bn: 'ভোলা', lat: 22.6859, lon: 90.6481 },
  { div: 'barishal', en: 'Patuakhali', bn: 'পটুয়াখালী', lat: 22.3596, lon: 90.3299 },
  { div: 'barishal', en: 'Pirojpur', bn: 'পিরোজপুর', lat: 22.5841, lon: 89.9720 },
  { div: 'barishal', en: 'Barguna', bn: 'বরগুনা', lat: 22.1570, lon: 90.1256 },
  { div: 'barishal', en: 'Jhalokati', bn: 'ঝালকাঠি', lat: 22.6406, lon: 90.1987 },

  // Rangpur Division
  { div: 'rangpur', en: 'Rangpur', bn: 'রংপুর', lat: 25.7439, lon: 89.2752 },
  { div: 'rangpur', en: 'Dinajpur', bn: 'দিনাজপুর', lat: 25.6217, lon: 88.6355 },
  { div: 'rangpur', en: 'Gaibandha', bn: 'গাইবান্ধা', lat: 25.3288, lon: 89.5403 },
  { div: 'rangpur', en: 'Kurigram', bn: 'কুড়িগ্রাম', lat: 25.8054, lon: 89.6362 },
  { div: 'rangpur', en: 'Lalmonirhat', bn: 'লালমনিরহাট', lat: 25.9923, lon: 89.2847 },
  { div: 'rangpur', en: 'Nilphamari', bn: 'নীলফামারী', lat: 25.9318, lon: 88.8560 },
  { div: 'rangpur', en: 'Panchagarh', bn: 'পঞ্চগড়', lat: 26.3411, lon: 88.5542 },
  { div: 'rangpur', en: 'Thakurgaon', bn: 'ঠাকুরগাঁও', lat: 26.0337, lon: 88.4617 },

  // Mymensingh Division
  { div: 'mymensingh', en: 'Mymensingh', bn: 'ময়মনসিংহ', lat: 24.7471, lon: 90.4203 },
  { div: 'mymensingh', en: 'Jamalpur', bn: 'জামালপুর', lat: 24.9375, lon: 89.9378 },
  { div: 'mymensingh', en: 'Netrokona', bn: 'নেত্রকোণা', lat: 24.8709, lon: 90.7279 },
  { div: 'mymensingh', en: 'Sherpur', bn: 'শেরপুর', lat: 25.0205, lon: 90.0153 }
];

function getLocation(){
  if(typeof S !== 'undefined' && S && S.location && S.location.en) return S.location;
  var def = { div: 'dhaka', en: 'Dhaka', bn: 'ঢাকা', lat: 23.8103, lon: 90.4125 };
  try{
    var saved = localStorage.getItem('ncs_location_v1');
    if(saved){
      var parsed = JSON.parse(saved);
      if(parsed && parsed.en && parsed.lat){
        if(typeof S !== 'undefined' && S) S.location = parsed;
        return parsed;
      }
    }
  }catch(e){}
  if(typeof S !== 'undefined' && S) S.location = def;
  return def;
}

function setLocation(loc){
  if(!loc || !loc.lat) return;
  if(typeof S !== 'undefined' && S) S.location = loc;
  try{ localStorage.setItem('ncs_location_v1', JSON.stringify(loc)); }catch(e){}
  try{
    sessionStorage.removeItem('ncs_weather_v1');
    sessionStorage.removeItem('ncs_salat_v1');
    sessionStorage.removeItem('ncs_aqi_v1');
  }catch(e){}
  fetchWeatherAndAqi();
  fetchSalatForCurrentLoc();
  if(typeof ltoast === 'function') ltoast(lb('Location updated: ', 'অবস্থান পরিবর্তিত: ') + (S.lang==='bn'?loc.bn:loc.en));
}

function findNearestDistrict(lat, lon){
  var nearest = BD_DISTRICTS[0];
  var minD = Infinity;
  for(var i=0; i<BD_DISTRICTS.length; i++){
    var d = BD_DISTRICTS[i];
    var dist = (d.lat - lat)*(d.lat - lat) + (d.lon - lon)*(d.lon - lon);
    if(dist < minD){
      minD = dist;
      nearest = d;
    }
  }
  return nearest;
}

/* Minimal Weather Line SVGs (stroke-based, 24x24 viewBox, currentColor) */
function getWeatherIconSvg(code, size){
  size = size || 20;
  var s = 'viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-svg" aria-hidden="true"';
  if(code === 0){
    return '<svg ' + s + '><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  }
  if(code === 1 || code === 2){
    return '<svg ' + s + '><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M4.93 19.07l1.41-1.41"/><circle cx="12" cy="12" r="3"/><path d="M8 18h9a4 4 0 0 0 1.5-7.7A4.5 4.5 0 0 0 10 9a4 4 0 0 0-3 3.8A3 3 0 0 0 8 18z"/></svg>';
  }
  if(code === 3){
    return '<svg ' + s + '><path d="M17.5 19H9a6 6 0 0 1-1.2-11.8A7.5 7.5 0 0 1 21 12.5 4.5 4.5 0 0 1 17.5 19z"/></svg>';
  }
  if(code >= 45 && code <= 48){
    return '<svg ' + s + '><path d="M4 14h16M4 10h16M6 18h12M8 6h8"/></svg>';
  }
  if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)){
    return '<svg ' + s + '><path d="M19 15.5A4.5 4.5 0 0 0 16 8a6 6 0 0 0-11 2.5A4 4 0 0 0 6 18h13"/><path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2"/></svg>';
  }
  if(code >= 95){
    return '<svg ' + s + '><path d="M19 14.5A4.5 4.5 0 0 0 16 7a6 6 0 0 0-11 2.5A4 4 0 0 0 6 17h13"/><path d="m13 14-3 5h3l-1 4 4-6h-3z"/></svg>';
  }
  return '<svg ' + s + '><path d="M17.5 19H9a6 6 0 0 1-1.2-11.8A7.5 7.5 0 0 1 21 12.5 4.5 4.5 0 0 1 17.5 19z"/></svg>';
}

function getWeatherDesc(code){
  var isBn = S.lang === 'bn';
  if(code === 0) return isBn ? 'পরিষ্কার আকাশ' : 'Clear Sky';
  if(code === 1) return isBn ? 'প্রধানত পরিষ্কার' : 'Mainly Clear';
  if(code === 2) return isBn ? 'আংশিক মেঘলা' : 'Partly Cloudy';
  if(code === 3) return isBn ? 'মেঘলা আকাশ' : 'Overcast';
  if(code >= 45 && code <= 48) return isBn ? 'কুয়াশাচ্ছন্ন' : 'Foggy / Mist';
  if(code >= 51 && code <= 55) return isBn ? 'হালকা গুঁড়িগুঁড়ি বৃষ্টি' : 'Light Drizzle';
  if(code >= 61 && code <= 65) return isBn ? 'বৃষ্টিপাত' : 'Rain';
  if(code >= 80 && code <= 82) return isBn ? 'বৃষ্টির সম্ভাবনা' : 'Rain Showers';
  if(code >= 95) return isBn ? 'বজ্রঝড়' : 'Thunderstorm';
  return isBn ? 'স্বাভাবিক আবহাওয়া' : 'Fair Weather';
}

function getAqiRating(aqi){
  var isBn = S.lang === 'bn';
  if(aqi <= 50) return { label: isBn ? 'ভালো' : 'Good', color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
  if(aqi <= 100) return { label: isBn ? 'সহনীয়' : 'Moderate', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' };
  if(aqi <= 150) return { label: isBn ? 'সংবেদনশীলদের জন্য অস্বাস্থ্যকর' : 'Unhealthy for Sensitive', color: '#F97316', bg: 'rgba(249,115,22,0.15)' };
  if(aqi <= 200) return { label: isBn ? 'অস্বাস্থ্যকর' : 'Unhealthy', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
  if(aqi <= 300) return { label: isBn ? 'খুবই অস্বাস্থ্যকর' : 'Very Unhealthy', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' };
  return { label: isBn ? 'ঝুঁকিপূর্ণ' : 'Hazardous', color: '#881337', bg: 'rgba(136,19,55,0.2)' };
}

let weatherCache = null;
let aqiCache = null;

function renderWeatherHeader(cur){
  var iconEl = $('hwIcon'), tempEl = $('hwTemp'), wrapEl = $('hdrWeather');
  if(!iconEl || !tempEl || !cur) return;
  var isBn = S.lang === 'bn';
  var temp = Math.round(cur.temperature_2m);
  iconEl.innerHTML = getWeatherIconSvg(cur.weather_code, 18);
  tempEl.textContent = isBn ? (toBnNum(temp) + '°সে') : (temp + '°C');
  var loc = getLocation();
  if(wrapEl){
    var locName = isBn ? loc.bn : loc.en;
    wrapEl.title = (isBn ? 'আবহাওয়া ও বায়ুমান' : 'Weather & Air Quality') + ' — ' + locName + ' (' + getWeatherDesc(cur.weather_code) + ')';
  }
}

async function fetchWeatherAndAqi(callback){
  var loc = getLocation();
  try{
    var cachedW = sessionStorage.getItem('ncs_weather_v1');
    var cachedA = sessionStorage.getItem('ncs_aqi_v1');
    if(cachedW){
      var pW = JSON.parse(cachedW);
      if(pW && pW.lat === loc.lat && Date.now() - pW.ts < 1800000){
        weatherCache = pW.data;
        renderWeatherHeader(weatherCache);
        if(cachedA){
          var pA = JSON.parse(cachedA);
          if(pA && pA.lat === loc.lat) aqiCache = pA.data;
        }
        if(callback) callback(weatherCache, aqiCache);
        return;
      }
    }
  }catch(e){}

  if(typeof navigator !== 'undefined' && navigator.onLine === false){
    if(callback) callback(weatherCache, aqiCache);
    return;
  }

  try{
    var wUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FDhaka';
    var aUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + loc.lat + '&longitude=' + loc.lon + '&current=us_aqi,pm10,pm2_5&timezone=Asia%2FDhaka';

    var results = await Promise.allSettled([
      fetch(wUrl).then(r => r.json()),
      fetch(aUrl).then(r => r.json())
    ]);

    if(results[0].status === 'fulfilled' && results[0].value && results[0].value.current){
      var curW = results[0].value.current;
      if(results[0].value.daily){
        curW.max = (results[0].value.daily.temperature_2m_max || [])[0];
        curW.min = (results[0].value.daily.temperature_2m_min || [])[0];
      }
      weatherCache = curW;
      try{ sessionStorage.setItem('ncs_weather_v1', JSON.stringify({ ts: Date.now(), lat: loc.lat, data: curW })); }catch(e){}
      renderWeatherHeader(curW);
    }

    if(results[1].status === 'fulfilled' && results[1].value && results[1].value.current){
      aqiCache = results[1].value.current;
      try{ sessionStorage.setItem('ncs_aqi_v1', JSON.stringify({ ts: Date.now(), lat: loc.lat, data: aqiCache })); }catch(e){}
    }

    if(callback) callback(weatherCache, aqiCache);
  }catch(err){
    console.error('Weather/AQI fetch failed:', err);
    if(callback) callback(weatherCache, aqiCache);
  }
}

function renderDistrictListHtml(filterQuery, selectedEn){
  filterQuery = (filterQuery || '').trim().toLowerCase();
  var isBn = S.lang === 'bn';
  var html = '';

  BD_DIVISIONS.forEach(div => {
    var dList = BD_DISTRICTS.filter(d => {
      if(d.div !== div.id) return false;
      if(!filterQuery) return true;
      return d.en.toLowerCase().includes(filterQuery) || d.bn.includes(filterQuery) || div.en.toLowerCase().includes(filterQuery) || div.bn.includes(filterQuery);
    });

    if(dList.length > 0){
      html += '<div class="loc-group-title">' + (isBn ? div.bn : div.en) + '</div>';
      dList.forEach(d => {
        var isSel = (d.en === selectedEn) ? ' selected' : '';
        html += '<button type="button" class="loc-option-btn' + isSel + '" data-loc-en="' + d.en + '">' +
          '<span>' + (isBn ? d.bn : d.en) + '</span>' +
          '<small style="color:var(--mut)">' + (isBn ? d.en : d.bn) + '</small>' +
        '</button>';
      });
    }
  });

  return html || ('<div style="padding:10px;text-align:center;color:var(--mut);font-size:12px">' + (isBn ? 'কোন জেলা পাওয়া যায়নি' : 'No district found') + '</div>');
}

function buildLocationPickerHtml(currentLoc){
  var isBn = S.lang === 'bn';
  return '' +
    '<div class="loc-panel" id="locPickerPanel">' +
      '<div class="loc-bar" id="locBarBtn" role="button" tabindex="0">' +
        '<span>📍 ' + (isBn ? 'বর্তমান অবস্থান: ' : 'Location: ') + '<b style="color:var(--acc)">' + (isBn ? currentLoc.bn : currentLoc.en) + '</b></span>' +
        '<span style="font-size:11.5px;color:var(--mut)">' + (isBn ? 'পরিবর্তন করুন ▾' : 'Change ▾') + '</span>' +
      '</div>' +
      '<div class="loc-dropdown" id="locDropdown" style="display:none">' +
        '<input type="text" class="loc-search-inp" id="locSearchInp" placeholder="' + (isBn ? 'জেলা খুঁজুন (যেমন: ঢাকা, কুমিল্লা, Sylhet)...' : 'Search district (e.g. Dhaka, Sylhet)...') + '" autocomplete="off">' +
        '<div class="loc-scroll-list" id="locScrollList">' +
          renderDistrictListHtml('', currentLoc.en) +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">' +
          '<span class="loc-adv-link" id="locAdvToggle">⚙ ' + (isBn ? 'অ্যাডভান্সড / জিপিএস' : 'Advanced / GPS') + '</span>' +
          '<button type="button" class="ghost" id="locGpsBtn" style="height:26px;font-size:11px;padding:0 8px">🎯 ' + (isBn ? 'ডিভাইস জিপিএস' : 'Use GPS') + '</button>' +
        '</div>' +
        '<div class="loc-adv-box" id="locAdvBox" style="display:none">' +
          '<div style="display:flex;gap:6px;align-items:center">' +
            '<input type="number" id="locLatInp" step="0.0001" placeholder="Lat (23.81)" value="' + currentLoc.lat + '" style="height:28px;font-size:12px;width:90px">' +
            '<input type="number" id="locLonInp" step="0.0001" placeholder="Lon (90.41)" value="' + currentLoc.lon + '" style="height:28px;font-size:12px;width:90px">' +
            '<button type="button" class="go" id="locSaveCoordsBtn" style="height:28px;font-size:11px;padding:0 8px">' + (isBn ? 'সেভ' : 'Set') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function wireLocationPickerEvents(onLocationChanged){
  var barBtn = $('locBarBtn');
  var dropdown = $('locDropdown');
  var searchInp = $('locSearchInp');
  var scrollList = $('locScrollList');
  var advToggle = $('locAdvToggle');
  var advBox = $('locAdvBox');
  var gpsBtn = $('locGpsBtn');
  var saveCoordsBtn = $('locSaveCoordsBtn');

  if(barBtn && dropdown){
    barBtn.onclick = function(){
      var isHidden = dropdown.style.display === 'none';
      dropdown.style.display = isHidden ? 'block' : 'none';
      if(isHidden && searchInp) searchInp.focus();
    };
  }

  if(searchInp && scrollList){
    searchInp.oninput = function(){
      var curLoc = getLocation();
      scrollList.innerHTML = renderDistrictListHtml(searchInp.value, curLoc.en);
    };
  }

  if(scrollList){
    scrollList.onclick = function(e){
      var btn = e.target.closest('[data-loc-en]');
      if(!btn) return;
      var enName = btn.dataset.locEn;
      var found = BD_DISTRICTS.find(d => d.en === enName);
      if(found){
        setLocation(found);
        if(onLocationChanged) onLocationChanged(found);
      }
    };
  }

  if(advToggle && advBox){
    advToggle.onclick = function(){
      advBox.style.display = (advBox.style.display === 'none') ? 'block' : 'none';
    };
  }

  if(gpsBtn){
    gpsBtn.onclick = function(){
      if(!navigator.geolocation){
        if(typeof ltoast === 'function') ltoast(lb('Geolocation not supported by device', 'ডিভাইসে জিপিএস সাপোর্ট নেই'));
        return;
      }
      gpsBtn.textContent = '...';
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        var nearest = findNearestDistrict(lat, lon);
        var customLoc = {
          div: nearest.div,
          en: nearest.en + ' (GPS)',
          bn: nearest.bn + ' (জিপিএস)',
          lat: Math.round(lat*10000)/10000,
          lon: Math.round(lon*10000)/10000
        };
        setLocation(customLoc);
        if(onLocationChanged) onLocationChanged(customLoc);
      }, function(err){
        gpsBtn.textContent = '🎯 GPS';
        if(typeof ltoast === 'function') ltoast(lb('Location permission denied or unavailable', 'অবস্থান অনুমতি বাতিল বা ব্যর্থ হয়েছে'));
      }, { timeout: 10000 });
    };
  }

  if(saveCoordsBtn){
    saveCoordsBtn.onclick = function(){
      var latInp = $('locLatInp'), lonInp = $('locLonInp');
      var lat = parseFloat(latInp ? latInp.value : '');
      var lon = parseFloat(lonInp ? lonInp.value : '');
      if(isNaN(lat) || isNaN(lon)){
        if(typeof ltoast === 'function') ltoast(lb('Please enter valid coordinates', 'সঠিক স্থানাঙ্ক লিখুন'));
        return;
      }
      var nearest = findNearestDistrict(lat, lon);
      var customLoc = {
        div: nearest.div,
        en: nearest.en + ' (Custom)',
        bn: nearest.bn + ' (কাস্টম)',
        lat: Math.round(lat*10000)/10000,
        lon: Math.round(lon*10000)/10000
      };
      setLocation(customLoc);
      if(onLocationChanged) onLocationChanged(customLoc);
    };
  }
}

function openWeatherCardModal(){
  var loc = getLocation();
  var isBn = S.lang === 'bn';

  function buildModalBody(w, a){
    var temp = w ? Math.round(w.temperature_2m) : '--';
    var maxT = (w && w.max != null) ? Math.round(w.max) : '--';
    var minT = (w && w.min != null) ? Math.round(w.min) : '--';
    var feels = (w && w.apparent_temperature != null) ? Math.round(w.apparent_temperature) : temp;
    var humidity = (w && w.relative_humidity_2m != null) ? w.relative_humidity_2m + '%' : '--';
    var wind = (w && w.wind_speed_10m != null) ? Math.round(w.wind_speed_10m) + ' km/h' : '--';
    var rainProb = (w && w.precipitation_probability != null) ? w.precipitation_probability + '%' : '0%';
    var wCode = w ? w.weather_code : 0;
    var wDesc = getWeatherDesc(wCode);
    var wSvg = getWeatherIconSvg(wCode, 52);

    var aqiVal = (a && a.us_aqi != null) ? a.us_aqi : null;
    var aqiRating = aqiVal != null ? getAqiRating(aqiVal) : null;
    var pm25 = (a && a.pm2_5 != null) ? a.pm2_5 : '--';
    var pm10 = (a && a.pm10 != null) ? a.pm10 : '--';

    var aqiHtml = aqiVal != null ? (
      '<div class="wm-aqi-box">' +
        '<div class="wm-aqi-head">' +
          '<div style="font-size:13px;font-weight:600;color:var(--ink)">🍃 ' + (isBn ? 'বায়ুমান সূচক (Air Quality)' : 'Air Quality Index (AQI)') + '</div>' +
          '<span class="wm-aqi-pill" style="color:' + aqiRating.color + ';background:' + aqiRating.bg + '">' +
            'AQI ' + (isBn ? toBnNum(aqiVal) : aqiVal) + ' · ' + aqiRating.label +
          '</span>' +
        '</div>' +
        '<div class="wm-aqi-meta">' +
          '<span><b>PM2.5:</b> ' + (isBn && typeof pm25 === 'number' ? toBnNum(pm25) : pm25) + ' µg/m³</span>' +
          '<span><b>PM10:</b> ' + (isBn && typeof pm10 === 'number' ? toBnNum(pm10) : pm10) + ' µg/m³</span>' +
        '</div>' +
      '</div>'
    ) : (
      '<div class="wm-aqi-box" style="text-align:center;color:var(--mut);font-size:12px">' +
        (isBn ? 'বায়ুমান ডেটা লোড হচ্ছে...' : 'Loading Air Quality...') +
      '</div>'
    );

    return '' +
      '<div class="wm-card">' +
        buildLocationPickerHtml(loc) +
        '<div class="wm-hero">' +
          '<div class="wm-hero-left">' +
            '<div class="wm-temp">' + (isBn && temp !== '--' ? toBnNum(temp) + '°সে' : temp + '°C') + '</div>' +
            '<div class="wm-cond">' + wDesc + '</div>' +
            '<div class="wm-sub">' +
              (isBn ? 'অনুভূত: ' : 'Feels like: ') + (isBn && feels !== '--' ? toBnNum(feels) + '°' : feels + '°') +
              ' · ' + (isBn ? 'সর্বোচ্চ: ' : 'H: ') + (isBn && maxT !== '--' ? toBnNum(maxT) + '°' : maxT + '°') +
              ' · ' + (isBn ? 'সর্বনিম্ন: ' : 'L: ') + (isBn && minT !== '--' ? toBnNum(minT) + '°' : minT + '°') +
            '</div>' +
          '</div>' +
          '<div class="wm-hero-icon">' + wSvg + '</div>' +
        '</div>' +
        '<div class="wm-grid">' +
          '<div class="wm-metric">' +
            '<div class="wm-metric-lbl">💧 ' + (isBn ? 'আর্দ্রতা' : 'Humidity') + '</div>' +
            '<div class="wm-metric-val">' + (isBn ? toBnNum(humidity) : humidity) + '</div>' +
          '</div>' +
          '<div class="wm-metric">' +
            '<div class="wm-metric-lbl">💨 ' + (isBn ? 'বাতাসের গতি' : 'Wind Speed') + '</div>' +
            '<div class="wm-metric-val">' + (isBn ? toBnNum(wind) : wind) + '</div>' +
          '</div>' +
          '<div class="wm-metric">' +
            '<div class="wm-metric-lbl">🌧️ ' + (isBn ? 'বৃষ্টির সম্ভাবনা' : 'Rain Chance') + '</div>' +
            '<div class="wm-metric-val">' + (isBn ? toBnNum(rainProb) : rainProb) + '</div>' +
          '</div>' +
          '<div class="wm-metric">' +
            '<div class="wm-metric-lbl">🌡️ ' + (isBn ? 'তাপমাত্রা পরিসীমা' : 'Range') + '</div>' +
            '<div class="wm-metric-val">' + (isBn && minT !== '--' ? toBnNum(minT) : minT) + '° - ' + (isBn && maxT !== '--' ? toBnNum(maxT) : maxT) + '°</div>' +
          '</div>' +
        '</div>' +
        aqiHtml +
        '<div style="text-align:center;font-size:11.5px;color:var(--mut);border-top:1px dashed var(--line);padding-top:8px">' +
          (isBn ? '⚡ এখানে জেলা পরিবর্তন করলে নামাজের সময়সূচীও স্বয়ংক্রিয়ভাবে আপডেট হবে' : '⚡ Changing location here also updates Prayer Times') +
        '</div>' +
      '</div>';
  }

  ask(
    (isBn ? '🌤️ আবহাওয়া ও বায়ুমান — ' : '🌤️ Weather & Air Quality — ') + (isBn ? loc.bn : loc.en),
    buildModalBody(weatherCache, aqiCache),
    function(){ return true; },
    lb('Close', 'বন্ধ করুন'),
    true
  );

  wireLocationPickerEvents(function(newLoc){
    loc = newLoc;
    fetchWeatherAndAqi(function(freshW, freshA){
      $('ot').textContent = (S.lang==='bn' ? '🌤️ আবহাওয়া ও বায়ুমান — ' : '🌤️ Weather & Air Quality — ') + (S.lang==='bn' ? loc.bn : loc.en);
      $('ob').innerHTML = buildModalBody(freshW, freshA);
      wireLocationPickerEvents(null);
    });
  });

  if(!weatherCache || !aqiCache){
    fetchWeatherAndAqi(function(freshW, freshA){
      if(!$('ov').hidden){
        $('ob').innerHTML = buildModalBody(freshW, freshA);
        wireLocationPickerEvents(null);
      }
    });
  }
}

/* ---------- Active Prayer Period & Mosque Times Engine ---------- */

let salatTimingsCache = null;
const salatAlertedToday = {};

function computeActiveSalat(timings, now){
  if(!timings) return null;
  now = now || new Date();
  var curMins = now.getHours() * 60 + now.getMinutes();

  var parseMins = function(tStr){
    if(!tStr) return 0;
    var p = tStr.split(':').map(Number);
    return p[0]*60 + p[1];
  };

  var fMins = parseMins(timings.Fajr);
  var sMins = parseMins(timings.Sunrise);
  var dMins = parseMins(timings.Dhuhr);
  var aMins = parseMins(timings.Asr);
  var mMins = parseMins(timings.Maghrib);
  var iMins = parseMins(timings.Isha);

  var prayerSlots = [
    { id: 'Fajr', en: 'Fajr', bn: 'ফজর', t: timings.Fajr, mins: fMins, icon: '🌅' },
    { id: 'Sunrise', en: 'Sunrise', bn: 'সূর্যোদয়', t: timings.Sunrise, mins: sMins, icon: '☀️', isSun: true },
    { id: 'Dhuhr', en: 'Dhuhr', bn: 'যোহর', t: timings.Dhuhr, mins: dMins, icon: '☀️' },
    { id: 'Asr', en: 'Asr', bn: 'আসর', t: timings.Asr, mins: aMins, icon: '🌤️' },
    { id: 'Maghrib', en: 'Maghrib', bn: 'মাগরিব', t: timings.Maghrib, mins: mMins, icon: '🌇' },
    { id: 'Isha', en: 'Isha', bn: 'ইশা', t: timings.Isha, mins: iMins, icon: '🌙' }
  ];

  var activePrayer = null;
  var nextPrayer = null;
  var isSunriseGap = false;

  if(curMins >= fMins && curMins < sMins){
    activePrayer = prayerSlots[0];
    nextPrayer = prayerSlots[1];
  } else if(curMins >= sMins && curMins < dMins){
    activePrayer = null;
    isSunriseGap = true;
    nextPrayer = prayerSlots[2];
  } else if(curMins >= dMins && curMins < aMins){
    activePrayer = prayerSlots[2];
    nextPrayer = prayerSlots[3];
  } else if(curMins >= aMins && curMins < mMins){
    activePrayer = prayerSlots[3];
    nextPrayer = prayerSlots[4];
  } else if(curMins >= mMins && curMins < iMins){
    activePrayer = prayerSlots[4];
    nextPrayer = prayerSlots[5];
  } else {
    activePrayer = prayerSlots[5];
    nextPrayer = prayerSlots[0];
  }

  var diffMins = 0;
  if(nextPrayer){
    diffMins = nextPrayer.mins - curMins;
    if(diffMins < 0) diffMins += 24 * 60;
  }

  return {
    active: activePrayer,
    next: nextPrayer,
    isSunriseGap: isSunriseGap,
    diffMins: diffMins,
    slots: prayerSlots
  };
}

function updateHeaderSalat(timings){
  if(!timings) return;
  var isBn = S.lang === 'bn';
  var salatState = computeActiveSalat(timings);
  if(!salatState) return;

  var prayerBtn = $('hdrPrayerBtn');
  var popover = $('hdrPrayerPopover');
  var loc = getLocation();
  var locName = isBn ? loc.bn : loc.en;

  var nextP = salatState.next;
  var activeP = salatState.active;
  var diffH = Math.floor(salatState.diffMins / 60);
  var diffM = salatState.diffMins % 60;
  var diffStr = isBn
    ? (diffH > 0 ? toBnNum(diffH) + ' ঘণ্টা ' : '') + toBnNum(diffM) + ' মিনিট বাকি'
    : (diffH > 0 ? diffH + 'h ' : '') + diffM + 'm left';

  var headerLabel = isBn ? 'নামাজের সময়সূচী' : 'Prayer Times';
  if(prayerBtn){
    var activeDesc = activeP ? (isBn ? activeP.bn + ' চলমান' : activeP.en + ' Active') : (isBn ? 'সূর্যোদয় সম্পন্ন' : 'Sunrise Passed');
    var nextDesc = nextP ? ((isBn ? nextP.bn : nextP.en) + ' ' + t12(nextP.t)) : '';
    prayerBtn.setAttribute('aria-label', headerLabel + ' · ' + activeDesc + ' · ' + (isBn ? 'পরবর্তী: ' : 'Next: ') + nextDesc);
    prayerBtn.title = headerLabel + ' (' + locName + ') — ' + activeDesc + ' · ' + (isBn ? 'পরবর্তী: ' : 'Next: ') + nextDesc;
  }

  if(popover){
    var headSubtitle = activeP
      ? ('<span style="color:var(--pos);font-weight:600">' + (isBn ? activeP.bn + ' চলমান' : activeP.en + ' Active') + '</span>')
      : ('<span style="color:var(--mut)">' + (isBn ? 'সূর্যোদয় সম্পন্ন' : 'Sunrise Passed') + '</span>');

    popover.innerHTML = '' +
      '<div class="hp-pop-head">' +
        '<div><b>' + headerLabel + '</b><small class="mut" style="display:block;font-size:11px">' + locName + '</small></div>' +
        '<div style="text-align:right">' + headSubtitle + '<small class="mut" style="display:block;font-size:11px">' + (nextP ? ((isBn?nextP.bn:nextP.en) + ' ' + diffStr) : '') + '</small></div>' +
      '</div>' +
      '<div class="hp-pop-grid">' +
        salatState.slots.map(function(p){
          var isActive = activeP && activeP.id === p.id;
          var isNext = nextP && nextP.id === p.id;
          var cls = isActive ? ' active' : (isNext ? ' upcoming' : '');
          var statusBadge = isActive ? (isBn ? 'চলমান' : 'NOW') : (isNext ? (isBn ? 'পরবর্তী' : 'NEXT') : '');
          return '<div class="hp-pop-item' + cls + '">' +
            '<span>' + p.icon + ' ' + (isBn ? p.bn : p.en) + '</span>' +
            '<div><b>' + t12(p.t) + '</b>' + (statusBadge ? ' <small style="font-size:9.5px;text-transform:uppercase;color:var(--acc)">' + statusBadge + '</small>' : '') + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="hp-pop-foot">' +
        '<small class="mut">' + (isBn ? 'সম্পূর্ণ সময়সূচী দেখতে ক্লিক করুন' : 'Click to view full prayer card & alarms') + '</small>' +
      '</div>';
  }
}

function fetchSalatForCurrentLoc(callback){
  var today = todayIso();
  var loc = getLocation();
  try{
    var cached = sessionStorage.getItem('ncs_salat_v1');
    if(cached){
      var parsed = JSON.parse(cached);
      if(parsed && parsed.date === today && parsed.lat === loc.lat && parsed.timings){
        salatTimingsCache = parsed.timings;
        updateHeaderSalat(parsed.timings);
        if(callback) callback(parsed.timings);
        return;
      }
    }
  }catch(e){}

  if(typeof navigator !== 'undefined' && navigator.onLine === false){
    if(callback) callback(salatTimingsCache);
    return;
  }

  var sUrl = 'https://api.aladhan.com/v1/timings?latitude=' + loc.lat + '&longitude=' + loc.lon + '&method=1';
  fetch(sUrl)
    .then(r => r.json())
    .then(data => {
      if(data && data.data && data.data.timings){
        salatTimingsCache = data.data.timings;
        try{
          sessionStorage.setItem('ncs_salat_v1', JSON.stringify({ date: today, lat: loc.lat, timings: data.data.timings }));
        }catch(e){}
        updateHeaderSalat(data.data.timings);
        if(callback) callback(data.data.timings);
      }
    })
    .catch(() => {
      if(callback) callback(salatTimingsCache);
    });
}

function fetchDhakaSalat(callback){
  fetchSalatForCurrentLoc(callback);
}

function fetchDhakaWeather(){
  fetchWeatherAndAqi();
}

function openFullSalatModal(){
  var loc = getLocation();
  fetchSalatForCurrentLoc(function(timings){
    if(!timings){
      if(typeof ltoast === 'function') ltoast(lb('Prayer timings unavailable offline', 'নামাজের সময়সূচী অফলাইনে পাওয়া যায়নি'));
      return;
    }
    var isBn = S.lang === 'bn';
    var salatState = computeActiveSalat(timings);
    var activeP = salatState ? salatState.active : null;
    var nextP = salatState ? salatState.next : null;

    var diffH = salatState ? Math.floor(salatState.diffMins / 60) : 0;
    var diffM = salatState ? (salatState.diffMins % 60) : 0;
    var diffStr = isBn
      ? (diffH > 0 ? toBnNum(diffH) + ' ঘণ্টা ' : '') + toBnNum(diffM) + ' মিনিট বাকি'
      : (diffH > 0 ? diffH + 'h ' : '') + diffM + 'm left';

    var activeBanner = activeP
      ? ('<div style="background:color-mix(in srgb,var(--pos) 14%,var(--card));border:1px solid var(--pos);border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
           '<div><span style="color:var(--pos);font-weight:700">● ' + (isBn ? activeP.bn + ' ওয়াক্ত চলমান' : activeP.en + ' Prayer Active') + '</span><small class="mut" style="display:block;font-size:11.5px">' + (isBn ? 'পরবর্তী নামাজ: ' : 'Next prayer: ') + '<b>' + (isBn ? nextP.bn : nextP.en) + '</b> (' + diffStr + ')</small></div>' +
           '<b style="font-size:15px;color:var(--pos)">' + t12(activeP.t) + '</b>' +
         '</div>')
      : ('<div style="background:var(--soft);border:1px solid var(--acc);border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
           '<div><span style="color:var(--acc);font-weight:700">☀️ ' + (isBn ? 'সূর্যোদয় সম্পন্ন (কোন নামাজ চলমান নেই)' : 'Sunrise Passed (No Active Prayer)') + '</span><small class="mut" style="display:block;font-size:11.5px">' + (isBn ? 'পরবর্তী নামাজ: ' : 'Next prayer: ') + '<b>' + (nextP ? (isBn?nextP.bn:nextP.en) : '') + '</b> (' + diffStr + ')</small></div>' +
         '</div>');

    var bodyHtml = '' +
      '<div style="margin-bottom:12px">' +
        buildLocationPickerHtml(loc) +
        activeBanner +
        '<div class="salat-grid">' +
          salatState.slots.map(function(p){
            var isActive = activeP && activeP.id === p.id;
            var isNext = nextP && nextP.id === p.id;
            var tFormatted = t12(p.t);
            var cls = isActive ? ' salat-box-active' : (p.isSun ? ' salat-box-sun' : '');
            var badge = isActive ? '<span class="sb-badge" style="background:var(--pos)">' + (isBn ? 'চলমান' : 'ACTIVE') + '</span>'
                                 : (isNext ? '<span class="sb-badge">' + (isBn ? 'পরবর্তী' : 'NEXT') + '</span>' : '');
            return '<div class="salat-box' + cls + '">' +
              '<div class="sb-icon">' + p.icon + '</div>' +
              '<div class="sb-name">' + (isBn ? p.bn : p.en) + '</div>' +
              '<b class="sb-time">' + (isBn ? toBnNum(tFormatted) : tFormatted) + '</b>' +
              badge +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:10px;margin-top:10px">' +
        '<small class="mut">' + (isBn ? 'প্রতি ওয়াক্তে স্বয়ংক্রিয় আযান/অ্যালার্ম বাজবে' : 'Automatic prayer chime plays on arrival') + '</small>' +
        '<button type="button" class="ghost" id="btnTestSalatAlarmModal" style="height:32px;padding:0 12px;font-size:12px">🔔 ' + (isBn ? 'অ্যালার্ম পরীক্ষা' : 'Test Sound') + '</button>' +
      '</div>';

    ask(
      lb('🕌 Salat Times — ', '🕌 নামাজের সময়সূচী — ') + (isBn ? loc.bn : loc.en),
      bodyHtml,
      function(){ return true; },
      lb('Close', 'বন্ধ করুন'),
      true
    );

    wireLocationPickerEvents(function(newLoc){
      loc = newLoc;
      openFullSalatModal();
    });

    var testBtn = $('btnTestSalatAlarmModal');
    if(testBtn){
      testBtn.onclick = function(){
        var pName = isBn ? (activeP ? activeP.bn : (nextP ? nextP.bn : 'যোহর')) : (activeP ? activeP.en : (nextP ? nextP.en : 'Dhuhr'));
        showSalatAlarmToast(pName, activeP ? t12(activeP.t) : (nextP ? t12(nextP.t) : '1:15 PM'));
      };
    }
  });
}

if(typeof document !== 'undefined'){
  document.addEventListener('click', function(e){
    var pBtn = e.target.closest('#hdrPrayerBtn');
    if(pBtn) openFullSalatModal();
    var wBtn = e.target.closest('#hdrWeather');
    if(wBtn) openWeatherCardModal();
  });
}

fetchSalatForCurrentLoc();
setInterval(function(){ fetchSalatForCurrentLoc(); }, 60000);

fetchWeatherAndAqi();
setInterval(function(){ fetchWeatherAndAqi(); }, 1800000);

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
