(function(){
  "use strict";

  const modal=document.getElementById("scheduleModal");
  const openButton=document.getElementById("openScheduleModal");
  const form=document.getElementById("scheduleInterviewForm");
  const status=document.getElementById("scheduleFormStatus");
  const submitButton=form&&form.querySelector("button[type='submit']");
  const technology=document.getElementById("scheduleTechnology");
  const otherWrap=document.getElementById("scheduleOtherTechnologyWrap");
  const otherTechnology=document.getElementById("scheduleOtherTechnology");
  const sections=Array.from(form?form.querySelectorAll("[data-schedule-step]"):[]);
  const progressTitle=document.getElementById("scheduleProgressTitle");
  const progressText=document.getElementById("scheduleProgressText");
  const progressBar=document.getElementById("scheduleProgressBar");
  const backButton=document.getElementById("scheduleBackButton");
  const nextButton=document.getElementById("scheduleNextButton");
  let previousFocus=null;
  let currentStep=0;
  let saving=false;

  if(!modal||!openButton||!form)return;

  function setStatus(message,type){status.textContent=message||"";status.className="schedule-form__status"+(type?" is-"+type:"");}
  function openModal(){if(saving)return;previousFocus=document.activeElement;modal.hidden=false;document.body.classList.add("schedule-modal-open");setStatus("");showStep(0);setTimeout(function(){document.getElementById("scheduleEmail").focus();},0);}
  function closeModal(){if(saving)return;modal.hidden=true;document.body.classList.remove("schedule-modal-open");if(previousFocus)previousFocus.focus();}

  openButton.addEventListener("click",openModal);
  modal.querySelectorAll("[data-close-schedule]").forEach(function(button){button.addEventListener("click",closeModal);});
  document.addEventListener("keydown",function(event){if(event.key!=="Escape"||modal.hidden)return;const openPanel=modal.querySelector(".modern-time-panel:not([hidden])");if(openPanel){openPanel.hidden=true;return;}closeModal();});

  technology.addEventListener("change",function(){
    const isOther=technology.value==="__other_option__";
    otherWrap.hidden=!isOther;
    otherTechnology.required=isOther;
    if(!isOther)otherTechnology.value="";
  });

  const fieldNames={scheduleEmail:"Email",scheduleRegisterId:"SK Tech Register ID",scheduleFullName:"Full Name",scheduleBatch:"Batch",scheduleRound:"Round",scheduleTechnology:"Technology",scheduleOtherTechnology:"Other technology",scheduleCompany:"Interview company",scheduleHrName:"HR name",scheduleHrNumber:"HR number",scheduleHrEmail:"HR email",scheduleDate:"Interview date",scheduleTimeFrom:"Start time",scheduleTimeTo:"End time"};
  const fields=Object.keys(fieldNames).map(function(id){return document.getElementById(id);});
  fields.forEach(function(field){
    const error=document.createElement("span");error.className="schedule-field-error";error.id=field.id+"Error";error.setAttribute("aria-live","polite");const errorAnchor=field.closest(".modern-time-picker")||field;errorAnchor.insertAdjacentElement("afterend",error);field.setAttribute("aria-describedby",error.id);
    field.addEventListener("blur",function(){field.dataset.touched="true";validateField(field,true);});
    ["input","change"].forEach(function(eventName){field.addEventListener(eventName,function(){validateField(field,field.dataset.touched==="true");});});
  });

  function showStep(index){
    currentStep=Math.max(0,Math.min(index,sections.length-1));closeTimePanels();
    sections.forEach(function(section,sectionIndex){const active=sectionIndex===currentStep;section.hidden=!active;section.classList.toggle("is-active",active);});
    progressTitle.textContent=sections[currentStep].dataset.scheduleStep;progressText.textContent="Step "+(currentStep+1)+" of "+sections.length;progressBar.style.width=((currentStep+1)/sections.length*100)+"%";
    backButton.hidden=currentStep===0;nextButton.hidden=currentStep===sections.length-1;submitButton.hidden=currentStep!==sections.length-1;
    const first=sections[currentStep].querySelector("input,select");if(first)setTimeout(function(){first.focus();},80);
  }
  function validateStep(index){
    const stepFields=fields.filter(function(field){return sections[index].contains(field);});let valid=true;
    stepFields.forEach(function(field){field.dataset.touched="true";if(!validateField(field,true))valid=false;});
    if(!valid){const first=sections[index].querySelector(".is-invalid");if(first)first.focus();setStatus("Please correct the highlighted fields before continuing.","error");}
    return valid;
  }
  nextButton.addEventListener("click",function(){if(!validateStep(currentStep))return;setStatus("");showStep(currentStep+1);});
  backButton.addEventListener("click",function(){setStatus("");showStep(currentStep-1);});

  function setModernTime(input,hour,minute,period){
    input.value=String(hour).padStart(2,"0")+":"+String(minute).padStart(2,"0")+" "+period;
    input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function closeTimePanels(except){modal.querySelectorAll(".modern-time-panel").forEach(function(panel){if(panel!==except)panel.hidden=true;});}
  modal.querySelectorAll("[data-modern-time]").forEach(function(input){
    const picker=input.closest(".modern-time-picker");const panel=picker.querySelector(".modern-time-panel");const icon=picker.querySelector(".modern-time-picker__icon");
    panel.innerHTML='<strong>Choose time</strong><small>12-hour format</small><span class="modern-time-panel__controls"><select class="modern-time-hour" aria-label="Hour"></select><b>:</b><select class="modern-time-minute" aria-label="Minute"></select><span class="modern-time-period" role="group" aria-label="AM or PM"><button type="button" data-period="AM" class="active">AM</button><button type="button" data-period="PM">PM</button></span></span><span class="modern-time-panel__quick"><button type="button" data-quick="09:00 AM">9:00 AM</button><button type="button" data-quick="10:00 AM">10:00 AM</button><button type="button" data-quick="02:00 PM">2:00 PM</button><button type="button" data-quick="04:00 PM">4:00 PM</button></span><button type="button" class="modern-time-panel__apply">Apply time</button>';
    const hourSelect=panel.querySelector(".modern-time-hour");const minuteSelect=panel.querySelector(".modern-time-minute");
    for(let hour=1;hour<=12;hour++){hourSelect.add(new Option(String(hour).padStart(2,"0"),String(hour)));}
    for(let minute=0;minute<60;minute+=5){minuteSelect.add(new Option(String(minute).padStart(2,"0"),String(minute)));}
    hourSelect.value="9";minuteSelect.value="0";
    function openPanel(event){event.preventDefault();event.stopPropagation();closeTimePanels(panel);panel.hidden=false;hourSelect.focus();}
    input.addEventListener("click",openPanel);icon.addEventListener("click",openPanel);
    panel.addEventListener("click",function(event){event.stopPropagation();const periodButton=event.target.closest("[data-period]");if(periodButton){panel.querySelectorAll("[data-period]").forEach(function(button){button.classList.toggle("active",button===periodButton);});return;}const quick=event.target.closest("[data-quick]");if(quick){const match=quick.dataset.quick.match(/(\d+):(\d+)\s(AM|PM)/);setModernTime(input,match[1],match[2],match[3]);panel.hidden=true;input.focus();return;}if(event.target.closest(".modern-time-panel__apply")){const period=panel.querySelector("[data-period].active").dataset.period;setModernTime(input,hourSelect.value,minuteSelect.value,period);panel.hidden=true;input.focus();}});
  });
  document.addEventListener("click",function(event){if(!event.target.closest(".modern-time-picker"))closeTimePanels();});

  function validateField(field,show){
    field.setCustomValidity("");
    if(field.id==="scheduleTimeTo"&&field.value&&document.getElementById("scheduleTimeFrom").value&&toMinutes(field.value)<=toMinutes(document.getElementById("scheduleTimeFrom").value)){field.setCustomValidity("End time must be later than the start time.");}
    const error=document.getElementById(field.id+"Error");
    let message="";
    if(!field.validity.valid){
      const label=fieldNames[field.id]||"This field";
      if(field.validity.valueMissing)message=label+" is required.";
      else if(field.validity.typeMismatch)message="Enter a valid "+label.toLowerCase()+".";
      else if(field.validity.patternMismatch)message=field.title||("Enter a valid "+label.toLowerCase()+".");
      else message=field.validationMessage;
    }
    error.textContent=show?message:"";field.classList.toggle("is-invalid",Boolean(show&&message));field.classList.toggle("is-valid",Boolean(field.value&&!message));
    return !message;
  }

  function validateForm(){
    let valid=true;fields.forEach(function(field){if(!validateField(field,true))valid=false;});
    if(!valid){const first=form.querySelector(".is-invalid");if(first)first.focus();setStatus("Please correct the highlighted fields.","error");}
    return valid;
  }

  form.addEventListener("submit",async function(event){
    event.preventDefault();
    if(saving)return;
    if(currentStep<sections.length-1){nextButton.click();return;}
    if(!validateForm())return;
    function normalizedTime(id){const minutes=toMinutes(document.getElementById(id).value);return String(Math.floor(minutes/60)).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0");}
    const details={email:document.getElementById("scheduleEmail").value.trim(),registerId:document.getElementById("scheduleRegisterId").value.trim().toUpperCase(),fullName:document.getElementById("scheduleFullName").value.trim(),batch:document.getElementById("scheduleBatch").value,round:document.getElementById("scheduleRound").value,technology:technology.value==="__other_option__"?otherTechnology.value.trim():technology.value,company:document.getElementById("scheduleCompany").value.trim(),hrName:document.getElementById("scheduleHrName").value.trim(),hrNumber:document.getElementById("scheduleHrNumber").value.trim(),hrEmail:document.getElementById("scheduleHrEmail").value.trim(),date:document.getElementById("scheduleDate").value,fromTime:normalizedTime("scheduleTimeFrom"),toTime:normalizedTime("scheduleTimeTo")};
    saving=true;
    const controls=Array.from(form.querySelectorAll("input,select,button"));
    const disabledStates=controls.map(function(control){return control.disabled;});
    controls.forEach(function(control){control.disabled=true;});
    form.setAttribute("aria-busy","true");
    submitButton.textContent="Saving…";setStatus("Checking and saving interview…","working");
    let outcome;
    try{
      outcome=await SkInterviewSave.save(details);
      if(outcome==="busy")return;
      if(outcome==="pending"){
        setStatus("Your save is awaiting confirmation. Use Check save status to check again without sending another booking. If it remains unconfirmed, contact SK Tech before submitting again.","error");
        return;
      }
      form.reset();otherWrap.hidden=true;otherTechnology.required=false;fields.forEach(function(field){delete field.dataset.touched;field.classList.remove("is-valid","is-invalid");validateField(field,false);});
      setStatus(outcome==="existing"?"This interview is already saved. No duplicate was added.":"Interview saved successfully.","success");
      await new Promise(function(resolve){setTimeout(resolve,1250);});
      saving=false;closeModal();showStep(0);if(typeof loadData==="function")loadData();
    }catch(error){setStatus(error.message||"Could not check the save status. Please try again.","error");}
    finally{
      saving=false;
      controls.forEach(function(control,index){control.disabled=disabledStates[index];});
      form.removeAttribute("aria-busy");
      submitButton.textContent=outcome==="pending"?"Check save status":"Save Interview";
    }
  });
})();
