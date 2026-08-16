(function(){
  "use strict";
  // Always open the landing page at the beginning of the hero unless a section link was requested.
  if("scrollRestoration" in history) history.scrollRestoration="manual";
  if(!location.hash) requestAnimationFrame(function(){window.scrollTo(0,0);});
  const roles=["Full Stack Developer","Cloud & DevOps Engineer","Data Professional","QA Automation Engineer","SAP Consultant"];
  let roleIndex=0;
  function rotateRole(){
    const el=document.getElementById("aiRole"); if(!el)return;
    el.style.opacity="0"; el.style.transform="translateY(6px)";
    setTimeout(function(){roleIndex=(roleIndex+1)%roles.length;el.textContent=roles[roleIndex];el.style.opacity="1";el.style.transform="translateY(0)";},220);
  }
  function parallax(){
    const stage=document.querySelector(".ai-stage"); if(!stage||!matchMedia("(pointer:fine)").matches)return;
    stage.addEventListener("pointermove",function(e){const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;stage.querySelector(".neural-core").style.transform="rotateY("+(x*12)+"deg) rotateX("+(-y*10)+"deg)";});
    stage.addEventListener("pointerleave",function(){stage.querySelector(".neural-core").style.transform="";});
  }
  document.addEventListener("DOMContentLoaded",function(){setInterval(rotateRole,2600);parallax();});
})();
