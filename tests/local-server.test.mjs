import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';

test('local authentication, authorized saves, conflict handling, uploads and logout', { timeout: 30000 }, async t => {
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const temporary=await mkdtemp(resolve(tmpdir(),'ypp-local-test-'));
  const port=20000+Math.floor(Math.random()*30000),origin=`http://127.0.0.1:${port}`;
  const password=randomBytes(20).toString('hex'),email='admin@example.test';
  let child;
  try {
    for(const file of ['package.json','scripts/local-server.mjs','scripts/local-users.mjs','netlify/functions/lib/content.js','netlify/functions/lib/image.js','assets/js/cms-schema.js','content/site.json','index.html']){const target=resolve(temporary,file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(root,file),target);}
    child=spawn(process.execPath,[resolve(temporary,'scripts/local-server.mjs')],{env:{...process.env,LOCAL_PORT:String(port),LOCAL_ADMIN_EMAIL:email,LOCAL_ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});
    await new Promise((accept,reject)=>{const timer=setTimeout(()=>reject(new Error('Local server did not start')),10000);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(new Error('Local server exited: '+code));});child.stdout.on('data',chunk=>{if(chunk.toString().includes('Admin login:')){clearTimeout(timer);accept();}});});
    let cookie='',csrf='';
    const request=(name,{method='GET',data,originHeader=origin,token=csrf,authenticated=true}={})=>fetch(`${origin}/.netlify/functions/${name}`,{method,headers:{...(method==='POST'?{'Content-Type':'application/json',Origin:originHeader,'X-CSRF-Token':token}:{}),...(authenticated&&cookie?{Cookie:cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
    await t.test('anonymous saves and private file reads are rejected',async()=>{assert.equal((await request('github-publish',{method:'POST',data:{}})).status,401);assert.equal((await fetch(origin+'/.env')).status,404);assert.equal((await fetch(origin+'/scripts/local-server.mjs')).status,404);});
    await t.test('incorrect credentials fail; correct credentials create an HttpOnly cookie',async()=>{assert.equal((await request('local-login',{method:'POST',data:{email,password:'incorrect'}})).status,401);const response=await request('local-login',{method:'POST',data:{email,password}});assert.equal(response.status,200);const header=response.headers.get('set-cookie');assert.match(header,/HttpOnly; SameSite=Strict/);cookie=header.split(';')[0];const session=await(await request('auth-session')).json();assert.equal(session.local,true);csrf=session.csrf;});
    await t.test('writes require the correct Origin and CSRF token',async()=>{assert.equal((await request('github-publish',{method:'POST',data:{},token:'wrong'})).status,403);assert.equal((await request('github-publish',{method:'POST',data:{},originHeader:'http://evil.test'})).status,403);});
    await t.test('Remember Me creates a bounded persistent HttpOnly cookie',async()=>{
      const response=await request('local-login',{method:'POST',data:{email,password,remember:true},authenticated:false});assert.equal(response.status,200);
      const header=response.headers.get('set-cookie');assert.match(header,/Max-Age=604800/);assert.match(header,/HttpOnly; SameSite=Strict/);
      const persistentCookie=header.split(';')[0];const persistent=await(await fetch(origin+'/.netlify/functions/auth-session',{headers:{Cookie:persistentCookie}})).json();const ttl=persistent.expires-Math.floor(Date.now()/1000);assert.ok(ttl<=604800&&ttl>604790);
      assert.equal((await fetch(origin+'/.netlify/functions/auth-logout',{method:'POST',headers:{Cookie:persistentCookie,Origin:origin,'X-CSRF-Token':persistent.csrf,'Content-Type':'application/json'},body:'{}'})).status,200);
    });
    await t.test('saving updates only the temporary fixture and produces a backup',async()=>{const original=await(await request('github-content')).json();const content=structuredClone(original.content);content.sections.home[1].value='Local test update';const response=await request('github-publish',{method:'POST',data:{sha:original.sha,content}});assert.equal(response.status,200);assert.equal(JSON.parse(await readFile(resolve(temporary,'content/site.json'),'utf8')).sections.home[1].value,'Local test update');assert.equal((await readdir(resolve(temporary,'.local-backups'))).length,1);assert.equal((await request('github-publish',{method:'POST',data:{sha:original.sha,content}})).status,409);});
    await t.test('image upload is validated and immediately served locally',async()=>{assert.equal((await request('github-upload',{method:'POST',data:{data:Buffer.from('<script>bad</script>').toString('base64')}})).status,400);const data='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7X8AAAAASUVORK5CYII=';const response=await request('github-upload',{method:'POST',data:{data}});assert.equal(response.status,200);const result=await response.json();assert.match(result.path,/^assets\/uploads\/[\w-]+\.png$/);assert.equal((await fetch(origin+'/'+result.path)).status,200);});
    await t.test('user management protects roles, hashes passwords and revokes disabled accounts',async()=>{
      const editorPassword=randomBytes(20).toString('hex');
      const editor={name:'Local editor',email:'editor@example.test',role:'editor',active:true,password:editorPassword};
      assert.equal((await request('local-users-save',{method:'POST',data:{action:'create',...editor},token:'wrong'})).status,403);
      assert.equal((await request('local-users-save',{method:'POST',data:{action:'create',...editor}})).status,200);
      const listing=await(await request('local-users')).json();const account=listing.users.find(u=>u.email===editor.email);
      assert.ok(account);assert.equal(account.hash,undefined);assert.equal(account.salt,undefined);
      const stored=await readFile(resolve(temporary,'.local-users.json'),'utf8');assert.equal(stored.includes(editorPassword),false);
      assert.equal((await fetch(origin+'/.local-users.json')).status,404);
      const login=await request('local-login',{method:'POST',data:{email:editor.email,password:editorPassword},authenticated:false});assert.equal(login.status,200);
      const editorCookie=login.headers.get('set-cookie').split(';')[0];
      const session=await(await fetch(origin+'/.netlify/functions/auth-session',{headers:{Cookie:editorCookie}})).json();assert.equal(session.role,'editor');
      assert.equal((await fetch(origin+'/.netlify/functions/local-users',{headers:{Cookie:editorCookie}})).status,403);
      assert.equal((await fetch(origin+'/.netlify/functions/github-content',{headers:{Cookie:editorCookie}})).status,200);
      assert.equal((await request('local-users-save',{method:'POST',data:{action:'update',id:account.id,...editor,active:false,password:''}})).status,200);
      assert.equal((await fetch(origin+'/.netlify/functions/auth-session',{headers:{Cookie:editorCookie}})).status,401);
      assert.equal((await request('local-login',{method:'POST',data:{email:editor.email,password:editorPassword},authenticated:false})).status,401);
      assert.equal((await request('local-users-save',{method:'POST',data:{action:'delete',id:'owner'}})).status,403);
      assert.equal((await request('local-users-save',{method:'POST',data:{action:'delete',id:account.id}})).status,200);
      assert.equal((await(await request('local-users')).json()).users.length,1);
    });
    await t.test('localhost and admin directory URLs route correctly',async()=>{
      const response=await fetch(`http://localhost:${port}/`,{redirect:'manual'});assert.equal(response.status,302);assert.equal(response.headers.get('location'),origin+'/');
      const admin=await fetch(origin+'/admin/',{redirect:'manual'});assert.equal(admin.status,302);assert.equal(admin.headers.get('location'),'/admin/index.html');
      const headers=await fetch(origin+'/');assert.match(headers.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(headers.headers.get('x-content-type-options'),'nosniff');
    });
    await t.test('invalid content and oversized requests receive explicit errors',async()=>{
      const current=await(await request('github-content')).json();assert.equal((await request('github-publish',{method:'POST',data:{sha:current.sha,content:{version:1,sections:{},password:'not-public'}}})).status,400);
      assert.equal((await request('github-publish',{method:'POST',data:{padding:'x'.repeat(810000)}})).status,413);
    });
    await t.test('logout invalidates the session on the server',async()=>{assert.equal((await request('auth-logout',{method:'POST',data:{}})).status,200);assert.equal((await request('auth-session')).status,401);});
    await t.test('concurrent invalid logins cannot bypass rate limiting',async()=>{const responses=await Promise.all(Array.from({length:8},()=>request('local-login',{method:'POST',data:{email,password:'invalid-password'},authenticated:false})));assert.ok(responses.some(response=>response.status===429));assert.ok(responses.filter(response=>response.status===401).length<=5);assert.equal((await request('local-login',{method:'POST',data:{email,password},authenticated:false})).status,429);});
  } finally {
    if(child&&child.exitCode===null){const closed=once(child,'close');child.kill();await closed;}
    await rm(temporary,{recursive:true,force:true});
  }
});
