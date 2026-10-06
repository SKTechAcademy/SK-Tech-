(function(root){
  "use strict";
  const SAVE_URL="https://script.google.com/macros/s/AKfycbzZJqQBmjAPssoUklP7sq3xIEi0oA2S9ofZZxYAtwe4haRTI-jwmBmg5A-ixQ4DHW5n/exec";
  const VERIFY_URL="https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";
  const pending=new Set();
  const normalize=value=>String(value??"").trim().replace(/\s+/g," ").toLowerCase();
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
  async function request(url,options={},timeout=20000,readJson=false){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await root.fetch(url,{...options,signal:controller.signal});
      if(!readJson)return response;
      if(!response.ok)throw new Error("Interview service unavailable");
      // Keep the timeout active until the response body has also downloaded.
      return await response.json();
    }finally{clearTimeout(timer);}
  }
  async function exists(details,timeout=20000){
    const rows=await request(VERIFY_URL+"?fresh="+Date.now(),{cache:"no-store",credentials:"omit"},timeout,true);
    if(!Array.isArray(rows))throw new Error("Invalid interview service response");
    return rows.some(row=>matches(row,details));
  }
  async function checkExisting(details,onProgress){
    for(let attempt=0;attempt<3;attempt++){
      if(attempt){
        onProgress("The connection is slow or temporarily unavailable. Retrying the duplicate check ("+(attempt+1)+" of 3)… Your details are safe.");
        await new Promise(resolve=>setTimeout(resolve,attempt*1000));
      }
      try{return await exists(details,15000+attempt*5000);}catch(error){
        if(attempt===2)throw error;
      }
    }
  }
  async function saveOnce(details,key,onProgress){
    const wasPending=isPending(key);
    onProgress(wasPending?"Checking your previous save. No new booking will be sent…":"Checking for an existing interview…");
    try{
      if(await checkExisting(details,onProgress)){forget(key);return wasPending?"saved":"existing";}
    }catch{
      if(wasPending)return "pending";
      throw new Error("The interview service could not be reached after 3 attempts. Nothing was sent. Your details are still here. Check your connection and select Save Interview to retry.");
    }
    // An opaque POST or a network error cannot prove that the server did not save.
    // Repeated attempts only verify; they never resend an uncertain booking.
    if(!wasPending){
      remember(key);
      onProgress("Saving interview… Please keep this form open.");
      try{await request(SAVE_URL,{method:"POST",mode:"no-cors",body:new URLSearchParams(details)});}catch{/* Verify before deciding the outcome. */}
    }
    onProgress("Waiting for Google Sheets to confirm your save… No second booking will be sent.");
    for(let attempt=0;attempt<5;attempt++){
      if(attempt)await new Promise(resolve=>setTimeout(resolve,1500));
      try{if(await exists(details)){forget(key);return "saved";}}catch{/* A failed read is not a failed save. */}
    }
    return "pending";
  }
  let active=false;
  root.SkInterviewSave={matches,async save(details,onProgress=()=>{}){
    if(active)return "busy";
    active=true;
    const key=keyFor(details);
    try{
      // Serialize the same booking across tabs where Web Locks are available.
      if(root.navigator?.locks)return await root.navigator.locks.request(key,()=>saveOnce(details,key,onProgress));
      return await saveOnce(details,key,onProgress);
    }finally{active=false;}
  }};
})(globalThis);
