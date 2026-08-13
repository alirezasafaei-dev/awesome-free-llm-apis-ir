import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { openDiscoverDatabase } from "../services/discover/database.mjs";
import { ValidationError, validateToolInput } from "../services/discover/validation.mjs";

const root=await mkdtemp(path.join(os.tmpdir(),"discover-db-test-"));
const sample=(overrides={})=>({slug:"vibe-ai",name:"Vibe AI",short_description_fa:"دستیار هوش مصنوعی",description_fa:"ابزار تست‌شده",destination_url:"https://example.com/vibe",platform:"android",category:"assistant",capabilities:["chat","image"],badges:["تست‌شده"],access_note_fa:"",cta_label_fa:"باز کردن",featured:false,sort_order:10,published:false,last_tested_date:"2026-08-13",...overrides});
try{
  const repo=openDiscoverDatabase(path.join(root,"discover.sqlite3"));
  try{
    const draft=repo.createTool(sample());
    assert.equal(draft.published,false);
    assert.deepEqual(repo.listPublishedTools(),[]);
    const normal=repo.createTool(sample({slug:"normal",name:"Normal",destination_url:"https://example.com/normal",published:true,sort_order:1}));
    const featured=repo.createTool(sample({slug:"featured",name:"Featured",destination_url:"https://example.com/featured",published:true,featured:true,sort_order:99}));
    assert.deepEqual(repo.listPublishedTools().map(t=>t.id),[featured.id,normal.id]);
    assert.equal(repo.updateTool(draft.id,{...sample(),published:true,name:"Updated"}).name,"Updated");
    assert.throws(()=>repo.createTool(sample({slug:"normal",destination_url:"https://example.com/duplicate"})),/slug/i);
    assert.equal(repo.deleteTool(normal.id),true);
  }finally{repo.close()}
  for(const destination_url of ["http://example.com/tool","file:///tmp/tool"])assert.throws(()=>validateToolInput(sample({destination_url})),ValidationError);
  assert.throws(()=>validateToolInput(sample({last_tested_date:"13/08/2026"})),ValidationError);
  assert.throws(()=>validateToolInput(sample({featured:"yes"})),ValidationError);
  assert.throws(()=>validateToolInput(sample({unexpected:"field"})),ValidationError);
  console.log("Discover SQLite/validation contract passed.");
}finally{await rm(root,{recursive:true,force:true})}

await import("./test-discover-api.mjs");
await import("./test-discover-admin-site.mjs");
