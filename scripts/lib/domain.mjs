import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {REPO_ROOT} from './db.mjs';
import {table} from './format.mjs';
export const tables=['accounts','sites','services','change_orders','carrier_tasks','notes','audit_events'];
export const reads={
 accounts:'select code,name,owner from accounts order by code',
 sites:'select s.code,a.name account,s.name,s.address from sites s join accounts a on a.id=s.account_id order by s.code',
 services:'select * from service_register order by code',
 'order-book':'select code,service,carrier,kind,owner,status,due_on,days_overdue,open_tasks from order_book order by due_on,code',
 renewals:'select code,account,site,carrier,currency,charge_cents,cost_cents,contract_end,days_to_expiry from renewal_queue order by contract_end,code',
 margins:'select * from monthly_margin order by currency,account,carrier',
 'carrier-chase':'select change_order,service,carrier,title,owner,due_on,days_overdue from carrier_queue order by due_on,change_order',
 attention:`select 'Overdue order' issue,code record,owner,due_on due from order_book where days_overdue>0
 union all select 'Overdue carrier task',change_order,owner,due_on from carrier_queue where days_overdue>0
 union all select 'Retention review',code,'Record owner',review_due from record_checks where retention_review_due order by due,record`,
 compliance:'select * from record_checks order by code',
 workload:'select owner,count(*)::integer open_orders,count(*) filter(where days_overdue>0)::integer overdue,min(due_on) next_due from order_book group by owner order by owner',
 history:'select actor,event,record_id,detail,created_at from audit_events order by created_at,id'
};
export const questions=[
 ['Which active services cost more than their monthly charge?',"select code,account,carrier,currency,charge_cents,cost_cents,margin_cents from service_register where status='active' and margin_cents<0 order by code"],
 ['Which renewals have an unfinished service change?',`select r.code,r.account,r.contract_end,o.code change_order,o.kind,o.status from renewal_queue r join order_book o on o.service=r.code order by r.contract_end`],
 ['Which carriers have overdue follow-ups?',`select carrier,count(*)::integer overdue,min(due_on) oldest_due from carrier_queue where days_overdue>0 group by carrier order by carrier`],
 ['Which customer accounts have the lowest monthly margin in each currency?',"select account,currency,sum(charge_cents) charge_cents,sum(cost_cents) cost_cents,sum(margin_cents) margin_cents from monthly_margin group by account,currency order by currency,sum(margin_cents),account"],
 ['Which active services have no carrier reference?',"select code,name,carrier from service_register where status='active' and trim(carrier_reference)='' order by code"],
 ['Which requested changes still need customer authorisation?',"select code,service,kind,owner,due_on from order_book where status='requested' order by due_on"],
 ['Which authorised changes are blocked by carrier tasks?',"select code,service,kind,open_tasks,due_on from order_book where status='authorised' and open_tasks>0 order by due_on"],
 ['Which service records need an accuracy or retention review?',"select code,accuracy_check_missing,retention_review_due,review_due from record_checks where accuracy_check_missing or retention_review_due order by code"],
 ['Which expired service contracts are still active?',"select code,account,carrier,contract_end from renewal_queue where days_to_expiry<0 order by contract_end"],
 ['Which completed changes have both customer and carrier evidence?',"select code,kind,authorisation_reference,completion_reference,completed_on from change_orders where status='completed' order by completed_on,code"]
];
export function text(v,label){if(typeof v!=='string'||!v.trim())throw Error(label+' is required');return v.trim();}
export function integer(v,label){if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v)))throw Error(label+' must be a nonnegative safe integer');return Number(v);}
export function date(v,label){text(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(label+' must be a valid YYYY-MM-DD');return v;}
export const today=()=>new Date().toISOString().slice(0,10);
export function pastDate(v,label){date(v,label);if(v>today())throw Error(label+' cannot be in the future');return v;}
export function keys(obj,allowed){if(!obj||Array.isArray(obj)||typeof obj!=='object')throw Error('Expected an object');for(const k of Object.keys(obj))if(!allowed.includes(k))throw Error('Unknown field '+k);}
function choice(v,allowed,label){if(!allowed.includes(v))throw Error(label+' must be '+allowed.join(', '));return v;}
export function human(v){if(Array.isArray(v)){if(!v.length)return '(none)';return table(v,Object.keys(v[0]).map(key=>({key,label:key.replace(/_cents$/, '').replaceAll('_',' '),format:x=>x==null?'':key.endsWith('_cents')?(Number(x)/100).toFixed(2):typeof x==='object'?JSON.stringify(x):x})));}if(v&&typeof v==='object')return Object.entries(v).map(([k,x])=>k+'\n'+(typeof x==='object'?human(x):x)).join('\n\n');return String(v);}
export async function resolve(db,kind,term){
 const fields={accounts:['code','name'],sites:['code','name'],services:['code','name'],change_orders:['code'],carrier_tasks:['title']}[kind];
 if(!fields)throw Error('Unsupported record type');text(term,'Record');
 const all=await db.query(`select * from ${kind} order by id`),needle=term.toLowerCase();
 let found=all.filter(r=>r.id===needle||fields.some(k=>String(r[k]).toLowerCase()===needle));
 if(!found.length)found=all.filter(r=>r.id.startsWith(needle)||fields.some(k=>String(r[k]).toLowerCase().includes(needle)));
 if(found.length!==1)throw Error((found.length?'Ambiguous record. Choose an id:':'No matching record. Available records:')+'\n'+human((found.length?found:all).map(r=>({id:r.id,name:r[fields[0]],description:r[fields.at(-1)]}))));
 return found[0];
}
export async function audit(db,actor,event,id,detail){await db.query('insert into audit_events(actor,event,record_id,detail) values($1,$2,$3,$4)',[text(actor,'actor'),event,id,JSON.stringify(detail)]);}
export async function insert(db,kind,obj){if(!tables.includes(kind))throw Error('Unknown entity');const cols=Object.keys(obj);return (await db.query(`insert into ${kind}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(obj)))[0];}
export async function add(db,kind,d,actor){
 text(actor,'actor');let row;
 if(kind==='account'){
  keys(d,['code','name','owner']);row=await insert(db,'accounts',{code:text(d.code,'code'),name:text(d.name,'name'),owner:text(d.owner,'owner')});
 }else if(kind==='site'){
  keys(d,['account','code','name','address']);const a=await resolve(db,'accounts',d.account);row=await insert(db,'sites',{account_id:a.id,code:text(d.code,'code'),name:text(d.name,'name'),address:text(d.address,'address')});
 }else if(kind==='service'){
  keys(d,['account','site','code','name','kind','carrier','carrier_reference','status','currency','charge_cents','cost_cents','started_on','contract_end','ceased_on','review_due']);
  const a=await resolve(db,'accounts',d.account),s=await resolve(db,'sites',d.site);if(s.account_id!==a.id)throw Error('Site belongs to another account');
  const started=date(d.started_on,'started_on'),end=date(d.contract_end,'contract_end');if(end<started)throw Error('Contract end precedes start');
  const status=choice(d.status,['planned','active','ceased'],'status');if(status!=='planned')pastDate(started,'started_on');
  const ceased=status==='ceased'?pastDate(d.ceased_on,'ceased_on'):null;if(ceased&&ceased<started)throw Error('Cease precedes start');if(d.ceased_on&&status!=='ceased')throw Error('Only ceased services have ceased_on');
  row=await insert(db,'services',{account_id:a.id,site_id:s.id,code:text(d.code,'code'),name:text(d.name,'name'),kind:choice(d.kind,['fibre','voice','mobile','data'],'kind'),carrier:text(d.carrier,'carrier'),carrier_reference:d.carrier_reference?text(d.carrier_reference,'carrier_reference'):'',status,currency:choice(d.currency,['NZD','AUD','USD'],'currency'),charge_cents:integer(d.charge_cents,'charge_cents'),cost_cents:integer(d.cost_cents,'cost_cents'),started_on:started,contract_end:end,ceased_on:ceased,review_due:date(d.review_due,'review_due')});
 }else if(kind==='order'){
  keys(d,['service','code','kind','owner','requested_on','due_on','target_site','target_charge_cents','target_cost_cents','target_contract_end']);
  const s=await resolve(db,'services',d.service),kind=choice(d.kind,['add','move','change','disconnect'],'kind');
  if(s.status!==(kind==='add'?'planned':'active'))throw Error('Service status does not permit '+kind);
  const requested=pastDate(d.requested_on,'requested_on'),due=date(d.due_on,'due_on');if(due<requested)throw Error('Due date precedes request');
  const target=kind==='move'?await resolve(db,'sites',d.target_site):null;if(target&&target.account_id!==s.account_id)throw Error('Move site must belong to service account');if(target?.id===s.site_id)throw Error('Move requires a different site');
  if(kind!=='move'&&d.target_site)throw Error('Only move takes target_site');
  if(kind!=='change'&&['target_charge_cents','target_cost_cents','target_contract_end'].some(k=>d[k]!=null))throw Error('Only change takes target commercial terms');
  row=await insert(db,'change_orders',{service_id:s.id,code:text(d.code,'code'),kind,owner:text(d.owner,'owner'),requested_on:requested,due_on:due,target_site_id:target?.id||null,target_charge_cents:kind==='change'?integer(d.target_charge_cents,'target_charge_cents'):null,target_cost_cents:kind==='change'?integer(d.target_cost_cents,'target_cost_cents'):null,target_contract_end:kind==='change'?date(d.target_contract_end,'target_contract_end'):null});
 }else if(kind==='task'){
  keys(d,['order','title','owner','due_on']);const o=await resolve(db,'change_orders',d.order);if(!['requested','authorised'].includes(o.status))throw Error('Order is no longer open');
  const due=date(d.due_on,'due_on');if(due<o.requested_on)throw Error('Task due precedes order request');
  row=await insert(db,'carrier_tasks',{order_id:o.id,title:text(d.title,'title'),owner:text(d.owner,'owner'),due_on:due});
 }else throw Error('add requires account, site, service, order or task');
 await audit(db,actor,'add '+kind,row.id,d);return row;
}
export async function service(db,term){const s=await resolve(db,'services',term);return {service:[s],orders:await db.query('select * from change_orders where service_id=$1 order by requested_on,code',[s.id]),tasks:await db.query('select t.* from carrier_tasks t join change_orders o on o.id=t.order_id where o.service_id=$1 order by t.due_on',[s.id]),notes:await db.query('select actor,body,created_at from notes where service_id=$1 order by created_at',[s.id])};}
export const mutations=['add','log','verify-service','review-retention','authorise-order','complete-task','complete-order','cancel-order'];
async function ready(db,s){if(!s.verified_on||s.review_due<today())throw Error('Verify service accuracy and review retention first');}
export async function run(db,cmd,term,f={}){
 if(reads[cmd]){if(term)throw Error('This read takes no record argument');return db.query(reads[cmd]);}
 if(cmd==='service')return service(db,term);
 if(cmd==='insights'){if(term)throw Error('insights takes no record');const out={};for(const [q,sql]of questions)out[q]=await db.query(sql);return out;}
 if(cmd==='add')return add(db,term,JSON.parse(fs.readFileSync(text(f.file,'file'),'utf8')),text(f.actor,'actor'));
 if(mutations.includes(cmd)){
  const actor=text(f.actor,'actor'),kind=cmd.includes('order')?'change_orders':cmd==='complete-task'?'carrier_tasks':'services';let r=await resolve(db,kind,term);
  // Every mutation is called in one CLI transaction. Lock the aggregate before changing it.
  if(kind==='carrier_tasks')await db.query('select id from change_orders where id=$1 for update',[r.order_id]);
  r=(await db.query(`select * from ${kind} where id=$1 for update`,[r.id]))[0];let result;
  if(cmd==='log')result=await insert(db,'notes',{service_id:r.id,actor,body:text(f.note,'note')});
  if(cmd==='verify-service'){const checked=pastDate(f.checked,'checked');result=(await db.query('update services set verified_on=$1,verification_reference=$2 where id=$3 returning *',[checked,text(f.reference,'reference'),r.id]))[0];}
  if(cmd==='review-retention'){const due=date(f.due,'due');if(due<=today())throw Error('Next review must be in the future');text(f.reason,'reason');result=(await db.query('update services set review_due=$1 where id=$2 returning *',[due,r.id]))[0];}
  if(cmd==='authorise-order'){
   if(r.status!=='requested')throw Error('Only requested orders can be authorised');const on=pastDate(f.on,'on');if(on<r.requested_on)throw Error('Authorisation predates request');
   const s=(await db.query('select * from services where id=$1 for update',[r.service_id]))[0];await ready(db,s);
   result=(await db.query("update change_orders set status='authorised',authorised_on=$1,authorisation_reference=$2 where id=$3 returning *",[on,text(f.reference,'reference'),r.id]))[0];
  }
  if(cmd==='complete-task'){
   if(r.status!=='open')throw Error('Task already closed');const o=(await db.query('select * from change_orders where id=$1',[r.order_id]))[0];if(!['requested','authorised'].includes(o.status))throw Error('Order is no longer open');
   const on=pastDate(f.on,'on');if(on<o.requested_on)throw Error('Task completion predates request');
   result=(await db.query("update carrier_tasks set status='closed',closed_on=$1,evidence=$2 where id=$3 returning *",[on,text(f.evidence,'evidence'),r.id]))[0];
  }
  if(cmd==='cancel-order'){
   if(!['requested','authorised'].includes(r.status))throw Error('Order is no longer open');
   result=(await db.query("update change_orders set status='cancelled',cancellation_reason=$1 where id=$2 returning *",[text(f.reason,'reason'),r.id]))[0];
  }
  if(cmd==='complete-order'){
   if(r.status!=='authorised')throw Error('Authorise order before completion');
   const on=pastDate(f.on,'on'),evidence=text(f.evidence,'evidence');if(on<r.authorised_on)throw Error('Completion predates authorisation');
   if((await db.query("select id from carrier_tasks where order_id=$1 and status='open'",[r.id])).length)throw Error('Close carrier tasks before completion');
   if((await db.query('select id from carrier_tasks where order_id=$1 and closed_on>$2',[r.id,on])).length)throw Error('Completion predates carrier task evidence');
   const s=(await db.query('select * from services where id=$1 for update',[r.service_id]))[0];await ready(db,s);
   if(s.status!==(r.kind==='add'?'planned':'active'))throw Error('Service status changed; reconcile order');
   if(r.kind!=='add'&&on<s.started_on)throw Error('Completion predates service start');
   if(r.kind==='move')await db.query('update services set site_id=$1 where id=$2',[r.target_site_id,s.id]);
   if(r.kind==='change')await db.query('update services set charge_cents=$1,cost_cents=$2,contract_end=$3 where id=$4',[r.target_charge_cents,r.target_cost_cents,r.target_contract_end,s.id]);
   if(r.kind==='disconnect')await db.query("update services set status='ceased',ceased_on=$1 where id=$2",[on,s.id]);
   if(r.kind==='add'){
    if(!s.carrier_reference.trim())throw Error('Activation needs a carrier reference');if(on>s.contract_end)throw Error('Activation is after contract end');
    await db.query("update services set status='active',started_on=$1 where id=$2",[on,s.id]);
   }
   result=(await db.query("update change_orders set status='completed',completed_on=$1,completion_reference=$2 where id=$3 returning *",[on,evidence,r.id]))[0];
   await audit(db,actor,'service updated from order',s.id,{order:r.code,before:s});
  }
  await audit(db,actor,cmd,r.id,f);return result;
 }
 if(cmd==='export'){
  if(term)throw Error('export takes no record');const out={format:'telecom-operations-v1',exported_at:new Date().toISOString()};for(const t of tables)out[t]=await db.query(`select * from ${t} order by id`);
  if(f.out){fs.writeFileSync(f.out,JSON.stringify(out,null,2)+'\n',{flag:'wx',mode:0o600});return {file:path.resolve(f.out),records:tables.reduce((n,t)=>n+out[t].length,0)};}return out;
 }
 if(cmd==='weekly-review'||cmd==='draft-change'){
  let sections,title;
  if(cmd==='weekly-review'){if(term)throw Error('weekly-review takes no record');title='Weekly telecom operations review';sections={orders:await db.query(reads['order-book']),carrier_followups:await db.query(reads['carrier-chase']),renewals:await db.query(reads.renewals),record_checks:await db.query(reads.compliance)};}
  else {const o=await resolve(db,'change_orders',term),s=(await db.query('select * from services where id=$1',[o.service_id]))[0];await ready(db,s);title='Internal change working paper: '+o.code;sections={order:[o],service:[s],tasks:await db.query('select * from carrier_tasks where order_id=$1 order by due_on',[o.id])};}
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,cmd+'-'+randomUUID()+'.md');fs.writeFileSync(file,'# '+title+'\n\nDraft only. Check against customer instructions and carrier evidence. This is not a network instruction.\n\n'+human(sections)+'\n',{flag:'wx',mode:0o600});return {file};
 }
 throw Error('Unknown command '+cmd);
}
