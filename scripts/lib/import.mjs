import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCsv} from './csv.mjs';
import {add,audit,text,keys} from './domain.mjs';
const required=['code','name','account_code','account_name','account_owner','site_code','site_name','address','kind','carrier','carrier_reference','status','currency','charge','cost','started_on','contract_end'];
export function cents(v){if(!/^\d+(\.\d{1,2})?$/.test(v))throw Error('Money must be a nonnegative decimal without currency symbols or separators');const [whole,fraction='']=v.split('.');const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(!Number.isSafeInteger(n))throw Error('Money is too large');return n;}
export async function importSalesforce(db,file,mapFile,actor){
 text(actor,'actor');const m=JSON.parse(fs.readFileSync(text(mapFile,'map'),'utf8'));keys(m,['columns','review_due','status_values','kind_values']);keys(m.columns,[...required,'ceased_on']);
 for(const k of required)text(m.columns[k],'Mapped column '+k);
 const rows=parseCsv(fs.readFileSync(text(file,'file'),'utf8'));if(!rows.length)throw Error('No service rows');
 for(const h of Object.values(m.columns))if(!Object.hasOwn(rows[0],h))throw Error('Missing mapped column '+h);
 let imported=0,unchanged=0;const seen=new Set();
 for(const raw of rows){
  const d=Object.fromEntries(Object.entries(m.columns).map(([k,h])=>[k,raw[h].trim()]));const code=text(d.code,'code');if(seen.has(code))throw Error('Duplicate service code in export '+code);seen.add(code);
  const sourceHash=createHash('sha256').update(JSON.stringify({raw,mapping:m})).digest('hex');
  const existing=(await db.query('select * from services where code=$1',[code]))[0];
  if(existing){if(existing.source_hash!==sourceHash)throw Error('Changed source row or mapping '+code+'; reconcile explicitly');unchanged++;continue;}
  let a=(await db.query('select * from accounts where code=$1',[text(d.account_code,'account_code')]))[0];
  if(!a)a=await add(db,'account',{code:d.account_code,name:d.account_name,owner:d.account_owner},actor);
  else if(a.name!==d.account_name||a.owner!==d.account_owner)throw Error('Account details conflict '+a.code);
  let site=(await db.query('select * from sites where code=$1',[text(d.site_code,'site_code')]))[0];
  if(!site)site=await add(db,'site',{account:a.id,code:d.site_code,name:d.site_name,address:d.address},actor);
  else if(site.account_id!==a.id||site.name!==d.site_name||site.address!==d.address)throw Error('Site details conflict '+site.code);
  const status=m.status_values?.[d.status]||d.status,kind=m.kind_values?.[d.kind]||d.kind;
  const s=await add(db,'service',{account:a.id,site:site.id,code,name:d.name,kind,carrier:d.carrier,carrier_reference:d.carrier_reference,status,currency:d.currency,charge_cents:cents(d.charge),cost_cents:cents(d.cost),started_on:d.started_on,contract_end:d.contract_end,...(d.ceased_on?{ceased_on:d.ceased_on}:{}),review_due:text(m.review_due,'review_due')},actor);
  await db.query('update services set source_row=$1,source_hash=$2 where id=$3',[JSON.stringify(raw),sourceHash,s.id]);imported++;
 }
 await audit(db,actor,'import salesforce',(await db.query('select id from services where code=$1',[rows[0][m.columns.code].trim()]))[0].id,{imported,unchanged,rows:rows.length});return {imported,unchanged,rows:rows.length};
}
