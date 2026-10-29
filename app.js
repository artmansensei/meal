const PRICE = 60;
const STORE_KEY = 'khabar_hisab_v1';
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA');
let state = loadState();
function loadState(){try{return JSON.parse(localStorage.getItem(STORE_KEY)) || {meals:{},payments:[],theme:'light'}}catch{return {meals:{},payments:[],theme:'light'}}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-US');}
function prettyDate(s){if(!s)return '';const [y,m,d]=s.split('-');return `${d}/${m}/${y}`;}
function allMealStats(){
  const entries=Object.entries(state.meals);
  let lunch=0,dinner=0;
  entries.forEach(([,v])=>{if(v.lunch)lunch++;if(v.dinner)dinner++;});
  const meals=lunch+dinner,cost=meals*PRICE,paid=state.payments.reduce((a,p)=>a+Number(p.amount),0);
  return {lunch,dinner,meals,cost,paid,due:cost-paid};
}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2300);}
function setTheme(theme){state.theme=theme;document.body.classList.toggle('dark',theme==='dark');$('themeBtn').textContent=theme==='dark'?'☀':'☾';$('themeBtn').setAttribute('aria-label',theme==='dark'?'লাইট মোড':'ডার্ক মোড');saveState();}
function showTab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));['meals','payments','summary'].forEach(n=>$(n+'Panel').classList.toggle('hidden',n!==name));if(name==='payments')renderPayments();if(name==='summary')renderSummary();}
function loadSelectedDate(){const entry=state.meals[$('mealDate').value]||{};$('lunchCheck').checked=!!entry.lunch;$('dinnerCheck').checked=!!entry.dinner;updateDayCost();}
function updateDayCost(){const n=Number($('lunchCheck').checked)+Number($('dinnerCheck').checked);$('dayCost').textContent='এই দিনের খরচ: '+money(n*PRICE);}
function saveMeals(){const date=$('mealDate').value;if(!date){toast('একটি তারিখ নির্বাচন করুন');return;}const v={lunch:$('lunchCheck').checked,dinner:$('dinnerCheck').checked};if(!v.lunch&&!v.dinner)delete state.meals[date];else state.meals[date]=v;saveState();renderAll();toast('খাবারের হিসাব সংরক্ষণ হয়েছে');}
function renderAll(){const s=allMealStats();$('dueAmount').textContent=money(Math.max(0,s.due));$('dueHint').textContent=s.due>0?'এখনও '+money(s.due)+' জমা দিতে হবে':s.due<0?'আপনার '+money(-s.due)+' টাকা অগ্রিম আছে':'সব হিসাব আপডেট আছে';$('totalMeals').textContent=s.meals;$('totalCost').textContent=money(s.cost);$('totalPaid').textContent=money(s.paid);}
function renderPayments(){const list=$('paymentList');const ps=[...state.payments].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);$('paymentCount').textContent=ps.length+'টি রেকর্ড';if(!ps.length){list.innerHTML='<div class="empty-state">এখনও কোনো জমার রেকর্ড নেই।<br>উপরের ফর্ম থেকে জমা যোগ করুন।</div>';return;}list.innerHTML=ps.map(p=>`<div class="history-item"><div class="history-icon">৳</div><div class="history-main"><strong>${prettyDate(p.date)}</strong><small>${escapeHtml(p.note||'টাকা জমা') }</small></div><div class="history-amount">${money(p.amount)}</div><button class="delete-btn" data-delete-payment="${p.id}" aria-label="রেকর্ড মুছুন">×</button></div>`).join('');}
function renderSummary(){const s=allMealStats();$('lunchCount').textContent=s.lunch;$('dinnerCount').textContent=s.dinner;$('summaryMeals').textContent=s.meals;$('summaryCost').textContent=money(s.cost);$('summaryPaid').textContent=money(s.paid);$('summaryDue').textContent=s.due>0?money(s.due)+' বাকি':s.due<0?money(-s.due)+' অগ্রিম':money(0);const days=Object.entries(state.meals).sort((a,b)=>b[0].localeCompare(a[0]));$('dayList').innerHTML=days.length?days.map(([date,v])=>`<div class="history-item"><div class="history-icon">${v.lunch&&v.dinner?'2':'1'}×</div><div class="history-main"><strong>${prettyDate(date)}</strong><small>${[v.lunch?'দুপুর':'',v.dinner?'রাত':''].filter(Boolean).join(' + ')}</small></div><div class="history-amount">${money((Number(v.lunch)+Number(v.dinner))*PRICE)}</div><button class="delete-btn" data-delete-day="${date}" aria-label="দিনের হিসাব মুছুন">×</button></div>`).join(''):'<div class="empty-state">এখনও কোনো দিনের খাবারের হিসাব নেই।</div>';}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('mealDate').value=today();$('paymentDate').value=today();setTheme(state.theme||'light');loadSelectedDate();renderAll();
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$('themeBtn').addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));
$('mealDate').addEventListener('change',loadSelectedDate);$('lunchCheck').addEventListener('change',updateDayCost);$('dinnerCheck').addEventListener('change',updateDayCost);
$('todayBtn').addEventListener('click',()=>{$('mealDate').value=today();loadSelectedDate();});
$('saveMealsBtn').addEventListener('click',saveMeals);
$('paymentForm').addEventListener('submit',e=>{e.preventDefault();const amount=Math.floor(Number($('paymentAmount').value));const date=$('paymentDate').value;if(!date||!Number.isFinite(amount)||amount<=0){toast('সঠিক তারিখ ও টাকার পরিমাণ দিন');return;}state.payments.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),date,amount,note:$('paymentNote').value.trim(),created:Date.now()});saveState();$('paymentAmount').value='';$('paymentNote').value='';renderAll();renderPayments();toast('জমার রেকর্ড যোগ হয়েছে');});
document.addEventListener('click',e=>{const p=e.target.closest('[data-delete-payment]');const d=e.target.closest('[data-delete-day]');if(p&&confirm('এই জমার রেকর্ডটি মুছে ফেলবেন?')){state.payments=state.payments.filter(x=>x.id!==p.dataset.deletePayment);saveState();renderAll();renderPayments();toast('রেকর্ড মুছে ফেলা হয়েছে');}if(d&&confirm('এই দিনের খাবারের হিসাব মুছে ফেলবেন?')){delete state.meals[d.dataset.deleteDay];saveState();renderAll();renderSummary();toast('দিনের হিসাব মুছে ফেলা হয়েছে');}});
$('exportBtn').addEventListener('click',()=>{const rows=[['ধরন','তারিখ','বিবরণ','পরিমাণ (টাকা)']];Object.entries(state.meals).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([date,v])=>rows.push(['খাবার',date,[v.lunch?'দুপুর':'',v.dinner?'রাত':''].filter(Boolean).join('+'),(Number(v.lunch)+Number(v.dinner))*PRICE]));state.payments.forEach(p=>rows.push(['জমা',p.date,p.note||'টাকা জমা',p.amount]));const csv='\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='khabar-hisab.csv';a.click();URL.revokeObjectURL(a.href);});
$('resetBtn').addEventListener('click',()=>{if(confirm('সব খাবার ও জমার হিসাব স্থায়ীভাবে মুছে ফেলবেন? এই কাজ ফিরিয়ে নেওয়া যাবে না।')){state={meals:{},payments:[],theme:state.theme};saveState();renderAll();renderSummary();renderPayments();loadSelectedDate();toast('সব হিসাব মুছে ফেলা হয়েছে');}});
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
