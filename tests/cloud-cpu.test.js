import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
test('CloudMonitor client and rolling aggregates pass Python regression tests',()=>{
 const result=spawnSync('python3',['-m','unittest','discover','-s','tests','-p','test_cloud_cpu.py'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
test('CPU frontend polls private cache without cloud credentials',()=>{
 const html=fs.readFileSync('templates/server-assets.html','utf8');
 assert.match(html,/refreshCloudCpu/);assert.match(html,/server-assets-cpu.json/);assert.match(html,/阿里云自动更新/);
 assert.doesNotMatch(html,/AccessKeySecret|SecurityToken|x-acs-security-token|Credential=/);
 const ignored=spawnSync('git',['check-ignore','projects/server-assets-cpu.json'],{encoding:'utf8'});
 assert.equal(ignored.status,0,ignored.stderr);
});
