const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'interviews.html'),'utf8');
const code=fs.readFileSync(path.join(root,'schedule-interview.js'),'utf8');
const utils=fs.readFileSync(path.join(root,'shared-utils.js'),'utf8');
const defaults={scheduleEmail:'test@example.com',scheduleRegisterId:'SK999',scheduleFullName:'Test Candidate',scheduleBatch:'2',scheduleRound:'Round 1',scheduleTechnology:'Java',scheduleCompany:'Test Company',scheduleHrName:'Test Recruiter',scheduleHrNumber:'9000000000',scheduleHrEmail:'hr@example.com',scheduleDate:'2026-10-09',scheduleTimeFrom:'04:00 PM',scheduleTimeTo:'05:00 PM'};
function fixture(t,save=async()=> 'existing'){
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});t.after(()=>dom.window.close());
 const w=dom.window,d=w.document;let calls=0,posted;
 const realTimer=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>realTimer(fn,ms===1250?0:ms);
 w.SkInterviewSave={save:async(details,progress)=>{calls++;posted=details;return save(details,progress);}};
 w.eval(utils);w.eval(code);
 const el=id=>d.getElementById(id),click=id=>el(id).click();
 click('openScheduleModal');
 function fill(values=defaults){for(const [id,value] of Object.entries(values)){el(id).value=value;el(id).dispatchEvent(new w.Event('input',{bubbles:true}));el(id).dispatchEvent(new w.Event('change',{bubbles:true}));}}
 function final(){fill();for(let i=0;i<3;i++)click('scheduleNextButton');assert.equal(el('scheduleProgressText').textContent,'Step 4 of 4');}
 function submit(){el('scheduleInterviewForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
 return {w,d,el,click,fill,final,submit,get calls(){return calls;},get posted(){return posted;}};
}
const settle=()=>new Promise(r=>setTimeout(r,15));
for(const id of Object.keys(defaults))test('required '+id+' prevents submission when empty',t=>{
 const f=fixture(t);f.final();f.el(id).value='';f.submit();assert.equal(f.calls,0);
});
test('whitespace-only full name is rejected',t=>{const f=fixture(t);f.final();f.el('scheduleFullName').value='   ';f.submit();assert.equal(f.calls,0);});
test('invalid email and ID are rejected',t=>{const f=fixture(t);f.fill({scheduleEmail:'bad',scheduleRegisterId:'SK0'});f.click('scheduleNextButton');assert.equal(f.el('scheduleProgressText').textContent,'Step 1 of 4');});
for(const to of ['03:00 PM','04:00 PM'])test('end time '+to+' must be later than start',t=>{const f=fixture(t);f.final();f.el('scheduleTimeTo').value=to;f.submit();assert.equal(f.calls,0);});
test('time picker preserves quick selection when reopened',t=>{
 const f=fixture(t);f.final();const picker=f.el('scheduleTimeFrom').closest('.modern-time-picker');
 f.el('scheduleTimeFrom').click();picker.querySelector('[data-quick="04:00 PM"]').click();f.el('scheduleTimeFrom').click();
 assert.equal(picker.querySelector('.modern-time-hour').value,'4');assert.equal(picker.querySelector('[data-period].active').dataset.period,'PM');
 picker.querySelector('.modern-time-panel__apply').click();assert.equal(f.el('scheduleTimeFrom').value,'04:00 PM');
});
test('existing booking warning preserves form values and keeps modal open',async t=>{const f=fixture(t);f.final();f.submit();await settle();assert.equal(f.calls,1);assert.equal(f.el('scheduleModal').hidden,false);assert.match(f.el('scheduleFormStatus').className,/is-warning/);assert.equal(f.el('scheduleFullName').value,defaults.scheduleFullName);});
test('pending save retains values and changes action to Check save status',async t=>{const f=fixture(t,async()=> 'pending');f.final();f.submit();await settle();assert.equal(f.d.querySelector('button[type=submit]').textContent,'Check save status');assert.equal(f.el('scheduleDate').value,defaults.scheduleDate);});
test('failure retains details and re-enables controls',async t=>{const f=fixture(t,async()=>{throw Error('Service unavailable');});f.final();f.submit();await settle();assert.match(f.el('scheduleFormStatus').textContent,/Service unavailable/);assert.equal(f.el('scheduleDate').disabled,false);assert.equal(f.el('scheduleModal').hidden,false);});
test('repeated submit and modal close are blocked while saving',async t=>{let finish;const f=fixture(t,()=>new Promise(r=>{finish=r;}));f.final();f.submit();f.submit();f.d.querySelector('.schedule-modal__close').click();assert.equal(f.calls,1);assert.equal(f.el('scheduleModal').hidden,false);assert.equal(f.el('scheduleDate').disabled,true);finish('existing');await settle();assert.equal(f.el('scheduleDate').disabled,false);});
test('successful save resets the form and closes dialog',async t=>{const f=fixture(t,async()=> 'saved');f.final();f.submit();await settle();assert.equal(f.el('scheduleModal').hidden,true);assert.equal(f.el('scheduleFullName').value,'');assert.equal(f.el('scheduleRegisterId').value,'SK');});
test('Enter before final step advances instead of saving',t=>{const f=fixture(t);f.fill();f.submit();assert.equal(f.calls,0);assert.equal(f.el('scheduleProgressText').textContent,'Step 2 of 4');});
test('other technology is required only while Other is selected',t=>{const f=fixture(t);f.fill();f.click('scheduleNextButton');f.fill({scheduleTechnology:'__other_option__'});f.click('scheduleNextButton');assert.equal(f.el('scheduleProgressText').textContent,'Step 2 of 4');f.fill({scheduleOtherTechnology:'Rust'});f.click('scheduleNextButton');assert.equal(f.el('scheduleProgressText').textContent,'Step 3 of 4');});
test('invalid earlier step is revealed when Save is attempted',t=>{const f=fixture(t);f.final();f.el('scheduleEmail').value='';f.submit();assert.equal(f.calls,0);assert.equal(f.el('scheduleProgressText').textContent,'Step 1 of 4');});
test('AM and PM are serialized into correct 24 hour values',async t=>{const f=fixture(t);f.final();f.fill({scheduleTimeFrom:'12:00 AM',scheduleTimeTo:'12:00 PM'});f.submit();await settle();assert.equal(f.posted.fromTime,'00:00');assert.equal(f.posted.toTime,'12:00');});
for(const [id,value] of Object.entries({scheduleEmail:'wrong',scheduleRegisterId:'SK0',scheduleCompany:'123',scheduleHrName:'123',scheduleHrNumber:'not-a-number',scheduleHrEmail:'wrong',scheduleTimeFrom:'13:00 PM',scheduleTimeTo:'25:00 PM'}))test('malformed '+id+' blocks save',t=>{const f=fixture(t);f.final();f.el(id).value=value;f.submit();assert.equal(f.calls,0);});
