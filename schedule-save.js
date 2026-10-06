(function(root){
  "use strict";
  const SAVE_URL="https://script.google.com/macros/s/AKfycbzZJqQBmjAPssoUklP7sq3xIEi0oA2S9ofZZxYAtwe4haRTI-jwmBmg5A-ixQ4DHW5n/exec";
  const VERIFY_URL="https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";
  const pending=new Set();
  const normalize=value=>String(value??"").trim().toLowerCase();
  const timeKey="Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment";
  const endKey="Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment";
  function datePart(value,kind){
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return "";
    // Sheets serial times use 1899 dates, including Kolkata's historical offset.
    const options=kind==="date"?{year:"numeric",month:"2-digit",day:"2-digit"}:{hour:"2-digit",minute:"2-digit",hourCycle:"h23"};
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",...options}).formatToParts(date);
    const part=type=>parts.find(item=>item.type===type).value;
    return kind==="date"?part("year")+"-"+part("month")+"-"+part("day"):part("hour")+":"+part("minute");
  }
  function matches(row,details){
    return [["Sk Tech Register ID","registerId"],["Round","round"],[" Technologies Required*","technology"],["Interview Company ","company"],["Batch","batch"]].every(([column,key])=>normalize(row[column])===normalize(details[key]))&&
      datePart(row["Interview Date"],"date")===details.date&&datePart(row[timeKey],"time")===details.fromTime&&datePart(row[endKey],"time")===details.toTime;
  }
  function keyFor(details){
    return "sk-interview-pending-v1:"+JSON.stringify([details.registerId,details.round,details.technology,details.company,details.batch,details.date,details.fromTime,details.toTime].map(normalize));
  }
  function isPending(key){try{return pending.has(key)||root.localStorage.getItem(key)==="1";}catch{return pending.has(key);}}
  function remember(key){pending.add(key);try{root.localStorage.setItem(key,"1");}catch{/* In-memory protection still applies. */}}
  function forget(key){pending.delete(key);try{root.localStorage.removeItem(key);}catch{/* Storage may be unavailable. */}}
  async function request(url,options={}){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try{return await root.fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
  }
  async function exists(details){
    const response=await request(VERIFY_URL+"?fresh="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Could not check existing interviews. Nothing was sent. Please try again.");
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error("Could not check existing interviews. Nothing was sent. Please try again.");
    return rows.some(row=>matches(row,details));
  }
  async function saveOnce(details,key){
    const wasPending=isPending(key);
    try{
      if(await exists(details)){forget(key);return "existing";}
    }catch{
      if(wasPending)return "pending";
      throw new Error("Could not check existing interviews. Nothing was sent. Please try again.");
    }
    // An opaque POST or a network error cannot prove that the server did not save.
    // Repeated attempts only verify; they never resend an uncertain booking.
    if(!wasPending){
      remember(key);
      try{await request(SAVE_URL,{method:"POST",mode:"no-cors",body:new URLSearchParams(details)});}catch{/* Verify before deciding the outcome. */}
    }
    for(let attempt=0;attempt<5;attempt++){
      if(attempt)await new Promise(resolve=>setTimeout(resolve,1500));
      try{if(await exists(details)){forget(key);return "saved";}}catch{/* A failed read is not a failed save. */}
    }
    return "pending";
  }
  let active=false;
  root.SkInterviewSave={matches,async save(details){
    if(active)return "busy";
    active=true;
    const key=keyFor(details);
    try{
      // Serialize the same booking across tabs where Web Locks are available.
      if(root.navigator?.locks)return await root.navigator.locks.request(key,()=>saveOnce(details,key));
      return await saveOnce(details,key);
    }finally{active=false;}
  }};
})(globalThis);
