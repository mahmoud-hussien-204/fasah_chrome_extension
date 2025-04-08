(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function s(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(n){if(n.ep)return;n.ep=!0;const a=s(n);fetch(n.href,a)}})();let y,o;const m={baseUrl:"https://tms.tabadul.sa/api/appointment/tas/v2/",fleetBaseUrl:"https://tms.tabadul.sa/api/fleet/v2/"},g=()=>new Date(Date.now()+864e5).toLocaleDateString("en-CA").replace(/-/g,"/"),u=async(t,e={},s=m.baseUrl)=>{const r={"Accept-Language":"ar",Accept:"application/json",token:decodeURIComponent(y)};return await(await fetch(`${s+t}`,{method:"GET",...e,headers:{...r,...e==null?void 0:e.headers}})).json()};document.addEventListener("DOMContentLoaded",()=>{o=JSON.parse(localStorage.getItem("truckData")||"[]"),L();const t=document.getElementById("start-btn"),e=document.getElementById("stop-btn");t==null||t.addEventListener("click",b),e==null||e.addEventListener("click",k)});function L(){if(o&&o.length){const t=document.getElementById("trucks-list");if(!t)return;t.innerHTML="",o.forEach((e,s)=>{const r=document.createElement("li");r.className="flex gap-4 truck-item",r.innerHTML=`
         <input
            type="text"
            id="truck-name"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="اسم السائق"
            ${s===0?"autofocus":""}
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
      `,t.appendChild(r)})}}async function b(){const t=document.getElementById("stop-btn");try{v(!1),t==null||t.classList.remove("hidden"),f(!0),l("جاري معالجة البيانات..."),h("disable"),await S(),E()&&await T()}catch(e){f(!1);const s=document.getElementById("error-alert");s==null||s.classList.remove("hidden"),s==null||s.classList.add("flex");const r=s==null?void 0:s.querySelector("#error-alert-msg");r&&(r.textContent=e),h("enable"),t==null||t.classList.add("hidden")}}async function k(){window.location.reload()}function f(t){const e=document.getElementById("filling-loading");t?(e==null||e.classList.remove("hidden"),e==null||e.classList.add("flex")):(e==null||e.classList.remove("flex"),e==null||e.classList.add("hidden"))}function l(t){document.getElementById("message").innerText=t}function h(t){const e=document.getElementById("form"),s=e==null?void 0:e.querySelectorAll("input");s==null||s.forEach(r=>{t==="enable"?r.disabled=!1:t==="disable"&&(r.disabled=!0)}),w(t)}function w(t){const e=document.getElementById("start-btn");t==="enable"?e.disabled=!1:t==="disable"&&(e.disabled=!0)}async function S(){await new Promise((t,e)=>{chrome.tabs.query({active:!0,currentWindow:!0},s=>{const r=s[0];chrome.tabs.sendMessage(r.id,{action:"getToken"},n=>{(n==null?void 0:n.status)==="success"?n.message==="getToken"&&(y=n.data.token,t(!0)):e("لا يوجد توكن الرجاء تسجيل الدخول من تانى")})})})}function E(){const t=[];let e=!1;if(document.querySelectorAll(".truck-item").forEach(s=>{const r=s.querySelector("#truck-name"),n=s.querySelector("#truck-number"),a=s.querySelector("#truck-declaration-number"),c=r.value.trim(),d=n.value.trim(),i=a.value.trim();r.classList.remove("input-error"),n.classList.remove("input-error"),a.classList.remove("input-error"),c||(r.classList.add("input-error"),e=!0),d||(n.classList.add("input-error"),e=!0),i||(a.classList.add("input-error"),e=!0),c&&d&&i&&t.push({name:c,truckNumber:d,customsDeclarationNumber:i})}),e)alert("يرجى ملء جميع الحقول المطلوبة!");else{if(t.length>0)return localStorage.setItem("truckData",JSON.stringify(t)),o=t,!0;alert("يرجى إضافة شاحنة واحدة على الأقل ببيانات صحيحة.")}return!1}const p=async()=>{var s,r;l("جارى البحث عن مواعيد...");const t=new URLSearchParams({economicOperator:"",type:"TRANSIT",departure:"KFC",arrival:"31"}),e=await u(`zone/schedule/land?${t.toString()}`);if(Reflect.has(e,"schedules")){const n=e.schedules;return n.length>3?n[n.length-3]:n[0]}if((e==null?void 0:e.success)===!1){if((r=(s=e==null?void 0:e.errors)==null?void 0:s[0])!=null&&r.message.includes("تم تجاوز الحد الأقصى")){let n=!1;l(" تم تجاوز الحد الأقصى هنستنى 15 ثواني وبعدين نعيد المحاولة لو مش هتستنى انت تقدر ");const a=document.createElement("button");a.innerText="تضغط هنا",a.classList.add("text-primary","cursor-pointer"),a.addEventListener("click",()=>{n=!0,b()});const c=document.getElementById("message");return c==null||c.appendChild(a),await new Promise(i=>setTimeout(()=>{i(!n)},15e3))?p():void 0}return p()}},N=async t=>{var a,c;l("جاري البحث عن معلومات السائق... والشاحنة");const e=new URLSearchParams({finalDestination:"95",finalDestinationTime:g(),q:t.truckNumber}),s=await u(`truck/verified/all/forAdd?${e.toString()}`,void 0,m.fleetBaseUrl),r=new URLSearchParams({finalDestination:"95",finalDestinationTime:g(),q:t.name}),n=await u(`driver/verified/all/forAdd?${r.toString()}`,void 0,m.fleetBaseUrl);return{truck:(a=s.content)==null?void 0:a[0],driver:(c=n.content)==null?void 0:c[0],data:t}},D=async t=>{l("جاري حجز الموعد...");const e={purpose:"6",fleet_info:[{licenseNo:t.driver.licenseNo,residentCountry:t.driver.residentCountry,plateCountry:t.truck.plateCountry,vehicleSequenceNumber:t.truck.vehicleSequenceNumber,chassisNo:t.truck.chassisNo}],transit:{transit_port_code:t.schedule.port_code,transit_schedule_id:t.schedule.zone_schedule_id},declaration_number:t.data.customsDeclarationNumber};return await u("appointment/transit/create",{method:"POST",body:JSON.stringify(e),headers:{"Content-Type":"application/json"}})};async function T(){var e;const t=await p();if(t){const s=await N(o==null?void 0:o[0]);s!=null&&s.driver&&s.truck&&s.data&&await D({...s,schedule:t})&&(v(!0),h("enable"),f(!1),(e=document.getElementById("stop-btn"))==null||e.classList.add("hidden"))}}function v(t){const e=document.getElementById("success-alert");t?(e==null||e.classList.add("flex"),e==null||e.classList.remove("hidden")):(e==null||e.classList.add("hidden"),e==null||e.classList.remove("flex"))}
