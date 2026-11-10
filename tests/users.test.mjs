import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createUserStore } from '../scripts/local-users.mjs';

test('local user accounts survive a restart and support password reset and deletion',async()=>{
  const root=await mkdtemp(join(tmpdir(),'ypp-users-test-'));
  try{
    let store=await createUserStore(root,'owner@example.test','owner-password-for-test');
    const account=await store.save({action:'create',name:'Editor',email:'editor@example.test',role:'editor',active:true,password:'editor-password-for-test'},'owner');
    store=await createUserStore(root,'owner@example.test','new-owner-password-for-test');
    assert.equal(store.authenticate('editor@example.test','editor-password-for-test').id,account.id);
    assert.equal(store.authenticate('owner@example.test','owner-password-for-test'),undefined);
    await store.save({action:'update',id:account.id,name:'Administrator',email:'editor@example.test',role:'admin',active:true,password:'replacement-password-for-test'},'owner');
    assert.equal(store.authenticate('editor@example.test','editor-password-for-test'),undefined);
    assert.equal(store.authenticate('editor@example.test','replacement-password-for-test').role,'admin');
    await assert.rejects(store.save({action:'delete',id:account.id},account.id));
    await assert.rejects(store.save({action:'create',name:'Duplicate',email:'editor@example.test',role:'editor',active:true,password:'another-password-for-test'},'owner'));
    await assert.rejects(store.save({action:'create',name:'Weak',email:'weak@example.test',role:'editor',active:true,password:'short'},'owner'));
    await store.save({action:'delete',id:account.id},'owner');assert.equal(store.authenticate('editor@example.test','replacement-password-for-test'),undefined);
  }finally{await rm(root,{recursive:true,force:true});}
});
