(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function r(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(n){if(n.ep)return;n.ep=!0;const a=r(n);fetch(n.href,a)}})();let L,d;const f={baseUrl:"https://tms.tabadul.sa/api/appointment/tas/v2/",fleetBaseUrl:"https://tms.tabadul.sa/api/fleet/v2/"},b=()=>new Date(Date.now()+864e5).toLocaleDateString("en-CA").replace(/-/g,"/"),m=async(t,e={},r=f.baseUrl)=>{const s={"Accept-Language":"ar",Accept:"application/json",token:decodeURIComponent(L)};return await(await fetch(`${r+t}`,{method:"GET",...e,headers:{...s,...e==null?void 0:e.headers}})).json()};document.addEventListener("DOMContentLoaded",()=>{d=JSON.parse(localStorage.getItem("truckData")||"[]"),E();const t=document.getElementById("start-btn"),e=document.getElementById("stop-btn");t==null||t.addEventListener("click",v),e==null||e.addEventListener("click",S)});function E(){if(d&&d.length){const t=document.getElementById("trucks-list");if(!t)return;t.innerHTML="",d.forEach((e,r)=>{const s=document.createElement("li");s.className="flex gap-4 truck-item",s.innerHTML=`
         <input
            type="text"
            id="truck-name"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="اسم السائق"
            ${r===0?"autofocus":""}
            value="${e.name}"
          />
          <input
            type="text"
            id="truck-number"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="رقم السيارة"
            value="${e.truckNumber}"
          />
          <input
            type="text"
            id="truck-declaration-number"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="رقم البيان الجمركى"
            value="${e.customsDeclarationNumber}"
          />
      `,t.appendChild(s)})}}async function v(){const t=document.getElementById("stop-btn");try{w(!1),t==null||t.classList.remove("hidden"),h(!0),u("جاري معالجة البيانات..."),g("disable"),await N(),x()&&await C()}catch(e){const r=document.getElementById("info-alert");r==null||r.classList.remove("flex"),r==null||r.classList.add("hidden"),h(!1);const s=document.getElementById("error-alert");s==null||s.classList.remove("hidden"),s==null||s.classList.add("flex");const n=s==null?void 0:s.querySelector("#error-alert-msg");n&&(n.textContent=e),g("enable"),t==null||t.classList.add("hidden")}}async function S(){window.location.reload()}function h(t){const e=document.getElementById("filling-loading");t?(e==null||e.classList.remove("hidden"),e==null||e.classList.add("flex")):(e==null||e.classList.remove("flex"),e==null||e.classList.add("hidden"))}function u(t){document.getElementById("message").innerText=t}function g(t){const e=document.getElementById("form"),r=e==null?void 0:e.querySelectorAll("input");r==null||r.forEach(s=>{t==="enable"?s.disabled=!1:t==="disable"&&(s.disabled=!0)}),k(t)}function k(t){const e=document.getElementById("start-btn");t==="enable"?e.disabled=!1:t==="disable"&&(e.disabled=!0)}async function N(){await new Promise((t,e)=>{chrome.tabs.query({active:!0,currentWindow:!0},r=>{const s=r[0];chrome.tabs.sendMessage(s.id,{action:"getToken"},n=>{(n==null?void 0:n.status)==="success"?n.message==="getToken"&&(L=n.data.token,t(!0)):e("لا يوجد توكن الرجاء تسجيل الدخول من تانى")})})})}function x(){const t=[];let e=!1;if(document.querySelectorAll(".truck-item").forEach(r=>{const s=r.querySelector("#truck-name"),n=r.querySelector("#truck-number"),a=r.querySelector("#truck-declaration-number"),c=s.value.trim(),o=n.value.trim(),i=a.value.trim();s.classList.remove("input-error"),n.classList.remove("input-error"),a.classList.remove("input-error"),c||(s.classList.add("input-error"),e=!0),o||(n.classList.add("input-error"),e=!0),i||(a.classList.add("input-error"),e=!0),c&&o&&i&&t.push({name:c,truckNumber:o,customsDeclarationNumber:i})}),e)alert("يرجى ملء جميع الحقول المطلوبة!");else{if(t.length>0)return localStorage.setItem("truckData",JSON.stringify(t)),d=t,!0;alert("يرجى إضافة شاحنة واحدة على الأقل ببيانات صحيحة.")}return!1}const p=async()=>{var r,s;u("جارى البحث عن مواعيد...");const t=new URLSearchParams({economicOperator:"",type:"TRANSIT",departure:"KFC",arrival:"31"}),e=await m(`zone/schedule/land?${t.toString()}`);if(Reflect.has(e,"schedules")){const n=e.schedules;return n.length>3?n[n.length-3]:n[0]}if((e==null?void 0:e.success)===!1){if((s=(r=e==null?void 0:e.errors)==null?void 0:r[0])!=null&&s.message.includes("تم تجاوز الحد الأقصى")){let n=!1;u(" تم تجاوز الحد الأقصى هنستنى 15 ثواني وبعدين نعيد المحاولة لو مش هتستنى انت تقدر ");const a=document.createElement("button");a.innerText="تضغط هنا",a.classList.add("text-primary","cursor-pointer"),a.addEventListener("click",()=>{n=!0,v()});const c=document.getElementById("message");return c==null||c.appendChild(a),await new Promise(i=>setTimeout(()=>{i(!n)},15e3))?p():void 0}return p()}},I=async t=>{var i,y;u("جاري البحث عن معلومات السائق... والشاحنة");const e=new URLSearchParams({finalDestination:"95",finalDestinationTime:b(),q:t.truckNumber}),r=await m(`truck/verified/all/forAdd?${e.toString()}`,void 0,f.fleetBaseUrl),s=new URLSearchParams({finalDestination:"95",finalDestinationTime:b(),q:t.name}),n=await m(`driver/verified/all/forAdd?${s.toString()}`,void 0,f.fleetBaseUrl);if(!((i=r==null?void 0:r.content)!=null&&i[0])||!((y=n==null?void 0:n.content)!=null&&y[0]))throw new Error("يوجد خطأ فى معلومات السائق والشاحنة");const a=r.content.filter(l=>l.plateNumberAr.trim()===t.truckNumber),c=n.content.filter(l=>l.nameAr.trim()===t.name),o=document.getElementById("info-alert");if((a.length>1||c.length>1)&&o){o.classList.remove("hidden"),o.classList.add("flex");const l=o.querySelector("#info-alert-msg");a.length>1&&l&&(l.textContent="يوجد اكتر من شاحنه بنفس رقم السيارة علشان الوقت انا اختارتلك اول سيارة ليها نفس الرقم"),c.length>1&&l&&(l.textContent+="يوجد اكتر من سائق بنفس الاسم علشان الوقت انا اختارتلك اول سائق ليها نفس الاسم")}if(!(a!=null&&a[0]))throw new Error(`لم يتم العثور على شاحنة برقم السيارة ${t.truckNumber}`);if(!(c!=null&&c[0]))throw new Error(`لم يتم العثور على سائق بالاسم ${t.name}`);return{truck:a==null?void 0:a[0],driver:c==null?void 0:c[0],data:t}},A=async t=>{var s,n;u("جاري حجز الموعد...");const e={purpose:"6",fleet_info:[{licenseNo:t.driver.licenseNo,residentCountry:t.driver.residentCountry,plateCountry:t.truck.plateCountry,vehicleSequenceNumber:t.truck.vehicleSequenceNumber,chassisNo:t.truck.chassisNo}],transit:{transit_port_code:t.schedule.port_code,transit_schedule_id:t.schedule.zone_schedule_id},declaration_number:t.data.customsDeclarationNumber},r=await m("appointment/transit/create",{method:"POST",body:JSON.stringify(e),headers:{"Content-Type":"application/json"}});if(!r.success)throw Array.isArray(r.errors)?new Error((n=(s=r.errors)==null?void 0:s[0])==null?void 0:n.message):new Error("حدث خطاء فى حجز الموعد");return r};async function C(){var e;const t=await p();if(t){const r=await I(d==null?void 0:d[0]);r!=null&&r.driver&&r.truck&&r.data&&await A({...r,schedule:t})&&(w(!0),g("enable"),h(!1),(e=document.getElementById("stop-btn"))==null||e.classList.add("hidden"))}}function w(t){const e=document.getElementById("success-alert");t?(e==null||e.classList.add("flex"),e==null||e.classList.remove("hidden")):(e==null||e.classList.add("hidden"),e==null||e.classList.remove("flex"))}
