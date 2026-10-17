import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {run,human} from './lib/domain.mjs';
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(REPO_ROOT,'.data/demo');
const db=await getDb();try{await migrate(db);await db.exec('BEGIN');await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');for(const cmd of ['order-book','renewals','carrier-chase'])console.log('\n'+cmd+'\n'+human(await run(db,cmd)));console.log('\nFictional demo stored in .data/demo. Set DATA_DIR to read it.');}finally{await db.close();}
