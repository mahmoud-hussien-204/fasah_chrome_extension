let v,p={gettenSchedule:!1};const u={baseUrl:"https://tms.tabadul.sa/api/appointment/tas/v2/",fleetBaseUrl:"https://tms.tabadul.sa/api/fleet/v2/"};chrome.runtime.onMessage.addListener((e,t,r)=>{var a;switch(v=((a=document.cookie.split("; ").find(n=>n.startsWith("fsession=")))==null?void 0:a.split("=")[1])||"",e.action){case"start":{y(e.data),r({status:"success",message:"start",data:{message:""}});break}}return!0});function y(e){const t=new MutationObserver(r=>{console.log("mutations",r),r.forEach(a=>{if(!p.gettenSchedule&&a.type==="childList"&&a.addedNodes.length>0){const n=a.addedNodes[0];if(n.nodeType===Node.ELEMENT_NODE){const o=n;if(o.classList.contains("bootstrap-datetimepicker-widget")){const c=o.querySelector(".datepicker-days");if(c){const s=c.querySelector("td:not(.disabled)");s&&(s.click(),s.dispatchEvent(new Event("click")),t.disconnect(),p.gettenSchedule=!0,setTimeout(()=>{const l=document.querySelectorAll("table > tbody > tr input[type=radio]").length>3?document.querySelector("table > tbody > tr:has(input[type=radio]):nth-last-child(3) input[type=radio]"):document.querySelector("table > tbody > tr:has(input[type=radio]):last-child input[type=radio]");if(console.log("input",l),!l)return;l.checked=!0,l.dispatchEvent(new Event("change")),l.dispatchEvent(new Event("click"));const i=document.querySelector("button[data-i18n=nextButtonText]");i&&(i.click(),k(e))},200))}}}}})});t.observe(document.getElementById("finalSchedule"),{childList:!0})}const m=async(e,t={},r=u.baseUrl)=>{const a={"Accept-Language":"ar",Accept:"application/json",token:decodeURIComponent(v)};return await(await fetch(`${r+e}`,{method:"GET",...t,headers:{...a,...t==null?void 0:t.headers}})).json()},h=()=>new Date(Date.now()+864e5).toLocaleDateString("en-CA").replace(/-/g,"/"),k=async e=>{var i,b;console.log("apiGetInfo",e);const t=new URLSearchParams({finalDestination:"95",finalDestinationTime:h(),q:e.truckNumber}),r=await m(`truck/verified/all/forAdd?${t.toString()}`,void 0,u.fleetBaseUrl),a=new URLSearchParams({finalDestination:"95",finalDestinationTime:h(),q:e.name}),n=await m(`driver/verified/all/forAdd?${a.toString()}`,void 0,u.fleetBaseUrl);if(!((i=r==null?void 0:r.content)!=null&&i[0]))throw new Error("يوجد خطأ فى معلومات الشاحنة");if(!((b=n==null?void 0:n.content)!=null&&b[0]))throw new Error("يوجد خطأ فى معلومات السائق");const o=r.content.filter(d=>d.plateNumberAr.trim()===e.truckNumber.trim()),c=n.content.filter(d=>d.nameAr.trim().startsWith(e.name.trim())),s=document.querySelector(".pledge-check input");if(!s)return;s.checked=!0,s.dispatchEvent(new Event("change")),s.dispatchEvent(new Event("click")),f({truck:o==null?void 0:o[0],driver:c==null?void 0:c[0]}),g({truck:o==null?void 0:o[0],driver:c==null?void 0:c[0]});const l=document.querySelector("#mutliAdded hr + div button");console.log("buttonElement",l),l&&l.click()};function f(e){const t=document.createElement("data-table");t.id="list_truck",t.setAttribute("columns",JSON.stringify([{tlabel:"broker:vehicle_sequence_number",value:"vehicleSequenceNumber"},{tlabel:"broker:Plate_Number",value:"plateNumberAr"}])),t.setAttribute("click",""),t.setAttribute("actions",JSON.stringify([{tlabel:"broker:Select",class:"btn-primary col-12",click:"fasah.broker_create_appointment_auto.truckGeneralValidate"}])),t.setAttribute("class","w-100"),t.setAttribute("vce-ready","");const r={plateType:e.truck.plateType,vehicleSequenceNumber:e.truck.vehicleSequenceNumber,plateNumberAr:e.truck.plateNumberAr,plateNumberEn:e.truck.plateNumberEn,plateCountry:e.truck.plateCountry,chassisNo:e.truck.chassisNo,truckCategoryGroup:e.truck.truckCategoryGroup,categoryGroupCode:e.truck.categoryGroupCode,truckColor:e.truck.truckColor,truckColorCode:e.truck.truckColorCode};t.innerHTML=`
    <div class="data-table-container col-12" data-total-elements="1">
      <div class="row">
        <div class="col-md-12 mt-2">
          <div class="table-responsive">
            <table class="fgrid table table-striped">
              <thead>
                <tr>
                  <th>رقم تسلسل السيارة</th>
                  <th>رقم اللوحة</th>
                  <th><span></span></th>
                </tr>
              </thead>
              <tbody>
                <tr data-node="0" data-obj="${JSON.stringify(r)}" class="parent active">
                  <td>
                    <div role="group" class="btn-group w-100">
                      <button type="button" class="btn btn-sm btn-secondary btn-primary col-12">اختيار</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),console.log("dataTable",t);const a=t.querySelector("button");console.log("buttonElement create for truck",a),a&&a.click()}function g(e){const t=document.createElement("data-table");t.id="list_truck",t.setAttribute("columns",JSON.stringify([{tlabel:"broker:license_number",value:"licenseNo"},{tlabel:"broker:fullName",value:"nameAr"}])),t.setAttribute("click",""),t.setAttribute("actions",JSON.stringify([{tlabel:"broker:Select",class:"btn-primary col-12",click:"fasah.broker_create_appointment_auto.getSelectedDriver"}])),t.setAttribute("class","w-100"),t.setAttribute("vce-ready","");const r={licenseNo:e.driver.licenseNo,nameAr:e.driver.nameAr,nameEn:e.driver.nameEn,residentCountry:e.driver.residentCountry};t.innerHTML=`
    <div class="data-table-container col-12" data-total-elements="1">
      <div class="row">
        <div class="col-md-12 mt-2">
          <div class="table-responsive">
            <table class="fgrid table table-striped">
              <thead>
                <tr>
                  <th>رقم رخصة</th>
                  <th>الاسم</th>
                  <th><span></span></th>
                </tr>
              </thead>
              <tbody>
                <tr data-node="0" data-obj='${JSON.stringify(r)}' class="parent active">
                  <td>
                    <div role="group" class="btn-group w-100">
                      <button type="button" class="btn btn-sm btn-secondary btn-primary col-12">اختيار</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),console.log("dataTable",t);const a=t.querySelector("button");console.log("buttonElement create for driver",a),a&&a.click()}
