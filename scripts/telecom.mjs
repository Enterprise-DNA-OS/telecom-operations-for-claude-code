#!/usr/bin/env node
import {getDb} from './lib/db.mjs';
import {run,reads,human} from './lib/domain.mjs';
import {importSalesforce} from './lib/import.mjs';
const args=process.argv.slice(2),flags={},pos=[];
const sets={add:['file','actor'],log:['note','actor'],'verify-service':['checked','reference','actor'],'review-retention':['due','reason','actor'],'authorise-order':['on','reference','actor'],'complete-task':['on','evidence','actor'],'complete-order':['on','evidence','actor'],'cancel-order':['reason','actor'],import:['file','map','actor','dry-run'],export:['out']};
let db;
try{
 for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=i<0?a.slice(2):a.slice(2,i);if(k in flags)throw Error('Duplicate flag '+k);flags[k]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const [cmd,term]=pos;
 if(!cmd||flags.help){console.log('Telecom operations: '+[...Object.keys(reads),'service','insights',...Object.keys(sets),'weekly-review','draft-change'].join(', ')+'\nArguments: --key=value. Every command supports --json. See docs/cli.md.');process.exit(0);}
 if(pos.length>2)throw Error('Too many arguments');
 for(const [k,v]of Object.entries(flags)){
  if(!['json',...(sets[cmd]||[])].includes(k))throw Error('Unknown flag --'+k);
  if(['json','dry-run'].includes(k)&&v!==true)throw Error('--'+k+' takes no value');
  if(!['json','dry-run'].includes(k)&&v===true)throw Error('--'+k+' requires a value');
 }
 db=await getDb();await db.exec('BEGIN');let result;
 if(cmd==='import'){if(term!=='salesforce')throw Error('Use import salesforce');result=await importSalesforce(db,flags.file,flags.map,flags.actor);}
 else result=await run(db,cmd,term,flags);
 await db.exec(flags['dry-run']?'ROLLBACK':'COMMIT');if(flags['dry-run'])result={...result,dry_run:true};
 console.log(flags.json?JSON.stringify(result,null,2):human(result));
}catch(e){if(db)await db.exec('ROLLBACK').catch(()=>{});console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
