import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const template=fs.readFileSync(path.join(root,'templates/server-assets.html'),'utf8');
const pattern=/<script type="application\/json" id="asset-data">([\s\S]*?)<\/script>/;
test('tracked server template contains no asset payload and supports protected polling',()=>{
 assert.deepEqual(JSON.parse(template.match(pattern)[1]).rows,[]);
 assert.doesNotMatch(template,/\b(?:\d{1,3}\.){3}\d{1,3}\b|i-[a-z0-9]{16,}|orderId=\d+/);
 assert.match(template,/connect-src 'self'/);
 assert.match(template,/credentials:'same-origin'/);
 assert.match(template,/每60秒刷新；内存为只读采集估算，CPU周\/月为历史快照/);
 assert.match(template,/if\(live&&!live.memory\)/);
 assert.match(template,/采集失败，不等于服务器宕机/);
 assert.match(template,/Math.round\(100\*\(1-available\/total\)\)/);
});
test('private asset renderer preserves input data and writes only explicit output',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'server-assets-render-'));
 try{
  const input=path.join(dir,'private.html'),output=path.join(dir,'result.html');
  const data={schema:1,preparedAt:'2026-01-01T00:00:00+08:00',rows:[{id:'synthetic',endpoint:'example.invalid',cost:{amount:1200,months:12}}],sources:[]};
  fs.writeFileSync(input,'<script type="application/json" id="asset-data">'+JSON.stringify(data)+'</script>');
  const result=spawnSync(process.execPath,['scripts/render-server-assets.mjs',input,output],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(output,'utf8').match(pattern)[1]),data);
  assert.ok(JSON.parse(result.stdout).sha256);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Projects contains one private assets entry and generated data is gitignored',()=>{
 const projects=fs.readFileSync(path.join(root,'projects.html'),'utf8');
 assert.equal((projects.match(/href="\/projects\/server-assets"/g)||[]).length,1);
 const result=spawnSync('git',['check-ignore','projects/server-assets.html','projects/server-monitor-data.json'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/server-assets.html/);assert.match(result.stdout,/server-monitor-data.json/);
});
