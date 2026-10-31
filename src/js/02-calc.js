function calc(){let p=+S.start||0;const m={};sorted().forEach(e=>{if(e.void)return;const bal=r2(p+cash(e));m[e.id]={p,bal,df:e.act==null?null:r2(e.act-bal)};p=bal});return m}
const prevFor=(d,t)=>{let p=+S.start||0;sorted().forEach(e=>{if(!e.void&&e.id!==editing&&(e.d+e.t)<=(d+t))p=r2(p+cash(e))});return p};
var WLT={bk:'Bkash Personal',ng:'Nagad',rk:'Rocket',bka:'Bkash Agent',gp:'GP Recharge',robi:'Robi Recharge',cir:'Circkle Recharge'};
var WLTC={Purchase:{'Bk In - Personal':'bk','Nagad In - Personal':'ng','Rocket In - Personal':'rk','Bkash Cash Out':'bka','Recharge Balance - DSR GP':'gp','Recharge Balance - DSR Robi':'robi','Recharge Balance - DSR Circkle':'cir','Bkash B2B Balance Receive':'bka'},Sale:{'Bk Sent - Personal':'bk','Nagad Sent - Personal':'ng','Rocket Sent - Personal':'rk','Bkash Cash IN':'bka','Recharge - GP':'gp','Recharge - Robi':'robi','Recharge - Circkle':'cir'}};
 const isWalletTransfer=e=>!!(WLTC[e.type]&&WLTC[e.type][e.cat]);
var WLT_MFS=['bk','ng','rk','bka'],WLT_RCR=['gp','robi','cir'],WLT_BN={bk:'বিকাশ পার্সোনাল',ng:'নগদ',rk:'রকেট',bka:'বিকাশ এজেন্ট',gp:'জিপি রিচার্জ',robi:'রবি রিচার্জ',cir:'সার্কেল রিচার্জ'};
var ACC_N=150,ACC_D='',LPGN=80,LPGC=null,AV=false;
function imgCap(c,q){var u=c.toDataURL('image/jpeg',q);while(u.length>24000&&q>.3){q-=.1;u=c.toDataURL('image/jpeg',q)}return u}
const CATS={Sale:['Printing','Stationery','Computer Service','Other'].concat(Object.keys(WLTC.Sale)),Purchase:['Stock','Rent','Salary','Utilities','Transport','Other'].concat(Object.keys(WLTC.Purchase))};
