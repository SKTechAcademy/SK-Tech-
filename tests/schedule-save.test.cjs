const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../schedule-save.js'),'utf8');
const details={registerId:'SK26',round:'Round 1',technology:'Full Stack Dot Net Developer',company:'Persistent systems',batch:'2',date:'2026-10-08',fromTime:'16:00',toTime:'17:00'};
const row={'Sk Tech Register ID':'SK26','Round':'Round 1',' Technologies Required*':details.technology,'Interview Company ':details.company,'Batch':2,'Interview Date':'2026-10-07T18:30:00Z','Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment':'1899-12-30T10:38:50Z','Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment':'1899-12-30T11:38:50Z'};
function setup(fetch,storage=new Map(),navigator={}){
 const context={fetch,navigator,URLSearchParams,AbortController,Intl,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:(fn,ms)=>setTimeout(fn,ms===12000?ms:0),clearTimeout};
 vm.runInNewContext(source,context);
 return context.SkInterviewSave;
}
const response=rows=>({ok:true,json:async()=>rows});
test('matches exact date and historical Sheets time in India regardless of browser timezone',()=>{
 const api=setup();assert.equal(api.matches(row,details),true);
 for(const change of [{date:'2026-10-09'},{fromTime:'15:00'},{toTime:'18:00'},{round:'Round 2'},{registerId:'SK27'}])assert.equal(api.matches(row,{...details,...change}),false);
});
test('existing booking sends no POST',async()=>{
 let posts=0;const api=setup(async(url,options)=>{if(options.method)posts++;return response([row]);});
 assert.equal(await api.save(details),'existing');assert.equal(posts,0);
});
test('double submit sends one POST; verification waits until POST finishes',async()=>{
 let posts=0,finished=false,reads=0;
 const api=setup(async(url,options)=>{if(options.method){posts++;await new Promise(r=>setTimeout(r,10));finished=true;return {};}
 reads++;if(reads>1)assert.equal(finished,true);return response(finished?[row]:[]);});
 const first=api.save(details);assert.equal(await api.save(details),'busy');assert.equal(await first,'saved');assert.equal(posts,1);
});
test('delayed visibility is polled without resending',async()=>{
 let posts=0,reads=0;const api=setup(async(url,options)=>{if(options.method){posts++;return {}; }return response(++reads>=5?[row]:[]);});
 assert.equal(await api.save(details),'saved');assert.equal(posts,1);
});
test('uncertain save remains protected across retry and reload',async()=>{
 const storage=new Map();let posts=0;const fetch=async(url,options)=>{if(options.method){posts++;return {};}return response([]);};
 const api=setup(fetch,storage);assert.equal(await api.save(details),'pending');assert.equal(await api.save(details),'pending');
 assert.equal(await setup(fetch,storage).save(details),'pending');assert.equal(posts,1);
});
test('POST network error after server saves is reconciled',async()=>{
 let posted=false;const api=setup(async(url,options)=>{if(options.method){posted=true;throw Error('lost response');}return response(posted?[row]:[]);});
 assert.equal(await api.save(details),'saved');
});
test('read failure before submission sends no POST and permits a safe retry',async()=>{
 let posts=0,offline=true;const api=setup(async(url,options)=>{if(options.method)posts++;if(offline)throw Error('offline');return response([row]);});
 await assert.rejects(api.save(details),/Nothing was sent/);assert.equal(posts,0);offline=false;assert.equal(await api.save(details),'existing');
});
test('a different date is a distinct booking',async()=>{
 let posts=0;const other={...details,date:'2026-10-09'};
 const otherRow={...row,'Interview Date':'2026-10-08T18:30:00Z'};
 const api=setup(async(url,options)=>{if(options.method){posts++;return {};}return response(posts?[row,otherRow]:[row]);});
 assert.equal(await api.save(other),'saved');assert.equal(posts,1);
});
test('same booking in two tabs is serialized by Web Locks',async()=>{
 let chain=Promise.resolve(),posts=0;const navigator={locks:{request:(key,fn)=>{const result=chain.then(fn);chain=result.catch(()=>{});return result;}}};
 const storage=new Map();const fetch=async(url,options)=>{if(options.method){posts++;return {};}return response(posts?[row]:[]);};
 const results=await Promise.all([setup(fetch,storage,navigator).save(details),setup(fetch,storage,navigator).save(details)]);
 assert.deepEqual(results,['saved','existing']);assert.equal(posts,1);
});
