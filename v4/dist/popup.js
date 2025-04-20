(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function s(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(t){if(t.ep)return;t.ep=!0;const n=s(t);fetch(t.href,n)}})();let c;document.addEventListener("DOMContentLoaded",()=>{c=JSON.parse(localStorage.getItem("truckData")||"[]"),l();const r=document.getElementById("start-btn"),e=document.getElementById("stop-btn");r==null||r.addEventListener("click",d),e==null||e.addEventListener("click",m)});function l(){if(c&&c.length){const r=document.getElementById("trucks-list");if(!r)return;r.innerHTML="",c.forEach((e,s)=>{const o=document.createElement("li");o.className="flex gap-4 truck-item",o.innerHTML=`
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
      `,r.appendChild(o)})}}async function d(){if(b()){const e=document.getElementById("stop-btn");e==null||e.classList.remove("hidden"),f(),p("الرجاء الانتظار ..."),g(),await new Promise(()=>{chrome.tabs.query({active:!0,currentWindow:!0},s=>{const o=s[0];chrome.tabs.sendMessage(o.id,{action:"start",data:c==null?void 0:c[0]},t=>{console.log("response",t)})})})}}async function m(){window.location.reload()}function f(r){const e=document.getElementById("filling-loading");e==null||e.classList.remove("hidden"),e==null||e.classList.add("flex")}function p(r){document.getElementById("message").innerText=r}function g(r){const e=document.getElementById("form"),s=e==null?void 0:e.querySelectorAll("input");s==null||s.forEach(o=>{o.disabled=!0}),y()}function y(r){const e=document.getElementById("start-btn");e.disabled=!0}function b(){const r=[];let e=!1;if(document.querySelectorAll(".truck-item").forEach(s=>{const o=s.querySelector("#truck-name"),t=s.querySelector("#truck-number"),n=s.querySelector("#truck-declaration-number"),i=o.value.trim(),a=t.value.trim(),u=n.value.trim();o.classList.remove("input-error"),t.classList.remove("input-error"),n.classList.remove("input-error"),i||(o.classList.add("input-error"),e=!0),a||(t.classList.add("input-error"),e=!0),u||(n.classList.add("input-error"),e=!0),i&&a&&u&&r.push({name:i,truckNumber:a,customsDeclarationNumber:u})}),e)alert("يرجى ملء جميع الحقول المطلوبة!");else{if(r.length>0)return localStorage.setItem("truckData",JSON.stringify(r)),c=r,!0;alert("يرجى إضافة شاحنة واحدة على الأقل ببيانات صحيحة.")}return!1}
