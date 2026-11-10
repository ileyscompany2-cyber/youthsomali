import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';

test('content, images and accounts persist across restart; sessions expire and backups restore', {timeout:30000}, async()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),work=await mkdtemp(resolve(tmpdir(),'ypp-persistence-'));
  const port=20000+Math.floor(Math.random()*30000),origin=`http://127.0.0.1:${port}`;
  const email='persistence@example.test',password=randomBytes(20).toString('hex'),editorPassword=randomBytes(20).toString('hex');let child,cookie='',csrf='';
  async function stop(){if(child&&child.exitCode===null){const closed=once(child,'close');child.kill();await closed;}}
  async function start(short){child=spawn(process.execPath,[resolve(work,'scripts/local-server.mjs')],{env:{...process.env,LOCAL_PORT:String(port),LOCAL_ADMIN_EMAIL:email,LOCAL_ADMIN_PASSWORD:password,...(short?{LOCAL_SESSION_SECONDS:'2'}:{})},stdio:['ignore','pipe','pipe']});await new Promise((accept,reject)=>{const timer=setTimeout(()=>reject(new Error('Server startup timed out')),10000);child.stdout.on('data',data=>{if(data.toString().includes('Admin login:')){clearTimeout(timer);accept();}});child.once('error',reject);child.once('exit',code=>reject(new Error('Server exited '+code)));});}
  async function request(name,data){return fetch(origin+'/.netlify/functions/'+name,{method:data===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:origin,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});}
  async function login(){const response=await request('local-login',{email,password});assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];csrf=(await(await request('auth-session')).json()).csrf;}
  try{
    for(const file of ['package.json','scripts/local-server.mjs','scripts/local-users.mjs','netlify/functions/lib/content.js','netlify/functions/lib/image.js','assets/js/cms-schema.js','content/site.json']){const target=resolve(work,file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(root,file),target);}
    await start(true);await login();const original=await(await request('github-content')).json();
    const content=structuredClone(original.content);content.sections.home[1].value='Persists after restart';
    assert.equal((await request('github-publish',{sha:original.sha,content})).status,200);
    const upload=await request('github-upload',{data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7X8AAAAASUVORK5CYII='});assert.equal(upload.status,200);const image=(await upload.json()).path;
    assert.equal((await request('local-users-save',{action:'create',name:'Persistent editor',email:'persistent-editor@example.test',password:editorPassword,role:'editor',active:true})).status,200);
    await new Promise(accept=>setTimeout(accept,2200));assert.equal((await request('auth-session')).status,401);
    await stop();await start(false);assert.equal((await request('auth-session')).status,401);await login();
    assert.equal((await(await request('github-content')).json()).content.sections.home[1].value,'Persists after restart');assert.equal((await fetch(origin+'/'+image)).status,200);
    const backup=(await readdir(resolve(work,'.local-backups')))[0];assert.deepEqual(JSON.parse(await readFile(resolve(work,'.local-backups',backup),'utf8')),original.content);
    await copyFile(resolve(work,'.local-backups',backup),resolve(work,'content/site.json'));assert.deepEqual((await(await request('github-content')).json()).content,original.content);
    const editorLogin=await request('local-login',{email:'persistent-editor@example.test',password:editorPassword});assert.equal(editorLogin.status,200);const editorCookie=editorLogin.headers.get('set-cookie').split(';')[0];assert.equal((await(await fetch(origin+'/.netlify/functions/auth-session',{headers:{Cookie:editorCookie}})).json()).role,'editor');
  }finally{await stop();await rm(work,{recursive:true,force:true});}
});
