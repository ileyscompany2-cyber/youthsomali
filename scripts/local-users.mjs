import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';

const fail = (status, text) => { throw Object.assign(new Error(text), { status }); };
const credentials = password => {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) fail(400, 'Use a password between 12 and 1024 characters.');
  const salt = randomBytes(32).toString('hex');
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') };
};
const publicUser = ({ id, email, name, role, active }) => ({ id, email, name, role, active });

export async function createUserStore(root, ownerEmail, ownerPassword) {
  // This private file is excluded from Git, static hosting and public file routes.
  // Password hashes are secrets too: never return them from the users API.
  const path = resolve(root, '.local-users.json');
  const owner = { id: 'owner', email: ownerEmail.trim().toLowerCase(), name: 'Workspace owner', role: 'admin', active: true, ...credentials(ownerPassword) };
  let records = [];
  try { records = JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!Array.isArray(records) || records.some(record => !record || typeof record.email !== 'string' || !['admin','editor'].includes(record.role) || !/^[a-f0-9]{64}$/.test(record.salt || '') || !/^[a-f0-9]{128}$/.test(record.hash || ''))) throw new Error('Invalid local user store. Restore a valid private user file.');
  const byId = id => id === 'owner' ? owner : records.find(record => record.id === id && record.email !== owner.email);
  let pending = Promise.resolve();
  function change(action) {
    const task = pending.then(async () => {
      const next = structuredClone(records), result = action(next);
      const temporary = path + '.local-tmp';
      await writeFile(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
      await rename(temporary, path); records = next; return result;
    }); pending = task.catch(() => {}); return task;
  }
  return {
    get(id) { const record = byId(id); return record ? publicUser(record) : undefined; },
    list() { return [owner, ...records.filter(record => record.email !== owner.email)].map(publicUser); },
    authenticate(email, password) {
      const record = [owner, ...records].find(record => record.email === String(email).trim().toLowerCase());
      // Perform a hash for unknown users too, avoiding an easy account-existence timing signal.
      const target = record || owner;
      const computed = scryptSync(password, target.salt, 64);
      return record?.active && timingSafeEqual(computed, Buffer.from(target.hash, 'hex')) ? publicUser(record) : undefined;
    },
    async save(input, currentId) {
      return change(next => {
        if (!input || !['create','update','delete'].includes(input.action)) fail(400, 'Invalid user action.');
        if (input.id === 'owner') fail(403, 'The workspace owner is managed from the server terminal.');
        if (input.action === 'delete') {
          if (input.id === currentId) fail(400, 'You cannot delete your own account.');
          const index = next.findIndex(record => record.id === input.id); if (index < 0) fail(404, 'User not found.');
          next.splice(index, 1); return { id: input.id };
        }
        const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
        if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254 || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100 || !['admin','editor'].includes(input.role) || typeof input.active !== 'boolean') fail(400, 'Enter a name, valid email, role and account status.');
        if (email === owner.email || next.some(record => record.email === email && record.id !== input.id)) fail(409, 'This email already has an account.');
        let record;
        if (input.action === 'create') { if (next.length >= 100) fail(400, 'Local account limit reached.'); record = { id: randomUUID(), ...credentials(input.password) }; next.push(record); }
        else { record = next.find(record => record.id === input.id); if (!record) fail(404, 'User not found.'); if (record.id === currentId && (!input.active || input.role !== 'admin')) fail(400, 'You cannot disable or demote your own account.'); if (input.password) Object.assign(record, credentials(input.password)); }
        Object.assign(record, { email, name: input.name.trim(), role: input.role, active: input.active });
        return publicUser(record);
      });
    }
  };
}
