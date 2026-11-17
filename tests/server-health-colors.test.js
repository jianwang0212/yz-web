import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../templates/server-assets.html',import.meta.url),'utf8');
const context={number:v=>String(v),esc:v=>String(v)};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function latestMemoryMarkup'),source.indexOf('function rowMarkup')),context);
test('inclusive resource boundaries; zero not missing; invalid/stale never healthy',()=>{
 for(const [kind,warn,critical] of [['cpu',60,80],['memory',75,85],['disk',80,90]]){
  for(const [value,want] of [[0,'ok'],[warn-.01,'ok'],[warn,'warning'],[critical-.01,'warning'],[critical,'critical'],[100,'critical'],[null,'unknown'],[undefined,'unknown'],[NaN,'unknown'],[Infinity,'unknown'],[-1,'unknown'],[101,'unknown'],[true,'unknown'],['87','unknown']])assert.equal(context.metricLevel(value,kind),want,kind+':'+value);
  assert.equal(context.metricLevel(0,kind,true),'unknown');assert.equal(context.metricLevel(99,kind,true),'unknown');
 }
});
test('high RAM has text and class; stale or missing cannot imply current high/normal',()=>{
 const row={runtime:{ok:true,memory:{value:87,at:'2026-11-17T16:30:00+08:00',approx:true}}};assert.match(context.latestMemoryMarkup(row),/metric-critical/);assert.match(context.latestMemoryMarkup(row),/过高/);row.runtime.stale=true;assert.match(context.latestMemoryMarkup(row),/metric-unknown/);assert.doesNotMatch(context.latestMemoryMarkup(row),/metric-critical/);assert.match(context.latestMemoryMarkup(row),/采样过期/);row.runtime.ok=false;assert.match(context.latestMemoryMarkup(row),/不等于宕机/);
});
test('root disk severity and no stale fallback when current disk sample missing',()=>{
 const row={diskUsedPct:12,runtime:{ok:true,stale:false,diskUsedPct:94}};assert.match(context.diskMarkup(row),/metric-critical/);assert.match(context.diskMarkup(row),/过高/);row.runtime.diskUsedPct=80;assert.match(context.diskMarkup(row),/metric-warning/);row.runtime.diskUsedPct=0;assert.match(context.diskMarkup(row),/0%/);row.runtime.diskUsedPct=null;assert.match(context.diskMarkup(row),/采样缺失/);assert.doesNotMatch(context.diskMarkup(row),/12%/);
});
test('CPU mean high/partial/null/stale colors without changing actual data',()=>{
 const row={cloudCpu:{scope:'aliyun_ecs',asOf:'2026-11-17T16:00:00+08:00',windows:Object.fromEntries(['7d','30d'].map(k=>[k,{start:'2026-10-18T16:00:00+08:00',end:'2026-11-17T16:00:00+08:00',cpu:{average:88,p95:90,points:168,expectedPoints:168,periodSeconds:3600}}]))}};const before=JSON.stringify(row);assert.match(context.usageMarkup(row),/usage-period metric-critical/);assert.equal(JSON.stringify(row),before);row.cloudCpu.stale=true;assert.doesNotMatch(context.usageMarkup(row),/metric-critical/);assert.match(context.usageMarkup(row),/历史读数/);row.cloudCpu.windows['7d'].cpu=null;assert.match(context.usageMarkup(row),/无历史/);
});
test('compact accessible legend distinguishes averages from peaks and outage',()=>{assert.match(source,/id="health-legend"/);assert.match(source,/不反映瞬时峰值/);assert.match(source,/不代表业务故障/);assert.match(source,/for\(const row of PRIMARY_ROWS\)if\(row.runtime\)row.runtime.stale=true;render\(\)/);});
