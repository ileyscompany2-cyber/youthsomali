import { api, requireSession, themeControl } from './auth.js';
import { collectionEditor } from './collection-editor.js';
import { imagePath } from '/assets/js/cms-schema.js';
import { usersPanel } from './users.js';
themeControl();
const $ = id => document.getElementById(id);
const labels = { overview: 'Overview', home: 'Homepage', about: 'About & website text', programs: 'Programs', events: 'Events', news: 'News & blog', projects: 'Projects', pages: 'Website pages', gallery: 'Gallery', team: 'Team members', contact: 'Contact', settings: 'Website settings', images: 'Image library', users: 'Users' };
const icons = { overview: 'grid-1x2', home: 'house', about: 'file-text', programs: 'people', events: 'calendar-event', news: 'newspaper', projects: 'briefcase', pages: 'files', gallery: 'images', team: 'person-badge', contact: 'envelope', settings: 'sliders', images: 'image' };
function icon(key) { const el = document.createElement('i'); el.className = `bi bi-${key === 'users' ? 'person-gear' : icons[key] || 'file-text'}`; el.setAttribute('aria-hidden', 'true'); return el; }
let user, documentData, sha, current = 'overview', dirty = false, busy = false;
const recent = [];
const recordUpdate = text => { recent.unshift({ time: new Date().toLocaleString(), text }); recent.length = Math.min(recent.length, 8); };
const message = text => { $('status').textContent = text; };
function markDirty() { dirty = true; $('summary').textContent = 'You have unpublished changes'; }
function fail(error) { message(error.message); if ([401,403].includes(error.status)) { dirty = false; location.replace('/admin/login.html?expired=1'); } }
async function write(name, body) { return api(name, { method: 'POST', headers: { 'X-CSRF-Token': user.csrf }, body: JSON.stringify(body) }); }
function setBusy(value) {
  busy = value;
  $('reload').disabled = value;
  $('logout').disabled = value;
  $('editor').inert = value;
  $('editor').setAttribute('aria-busy', String(value));
  for (const button of $('sections').children) button.disabled = value;
  for (const id of ['publish','upload-button','preview']) $(id).disabled = value || !documentData;
}
function element(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
async function load() {
  setBusy(true);
  try { const result = await api('github-content'); documentData = result.content; sha = result.sha; dirty = false; $('summary').textContent = user.local ? 'Loaded from this computer' : 'Up to date with the repository'; render(); }
  catch (error) { fail(error); } finally { setBusy(false); }
}
function render() {
  $('heading').textContent = labels[current]; $('editor').replaceChildren(); $('upload-panel').hidden = current !== 'images';
  for (const button of $('sections').children) { button.classList.toggle('active', button.dataset.section === current); button.setAttribute('aria-current', button.dataset.section === current ? 'page' : 'false'); }
  if (current === 'users') { $('editor').append(usersPanel(user)); return; }
  if (!documentData) return;
  if (current === 'overview') {
    const grid = element('div', undefined, 'overview-grid');
    for (const [key, rows] of Object.entries(documentData.sections)) { const records=documentData.collections?.[key]; const button = element('button'); button.append(icon(key), element('span', labels[key], 'overview-label'), element('strong', String(records ? records.length : rows.length)), element('span', records ? 'content entries' : 'editable content fields')); button.addEventListener('click', () => { current = key; render(); }); grid.append(button); }
    $('editor').append(grid);
    const updates=element('section',undefined,'editor-card recent-updates');updates.append(element('h2','Recent updates in this session'));const list=element('ul');for(const entry of recent)list.append(element('li',entry.time+' · '+entry.text));if(!recent.length)updates.append(element('p','No uploads or publishing activity in this session.'));else updates.append(list);$('editor').append(updates);return;
  }
  if (current === 'images') {
    $('image-library').replaceChildren(); const paths = new Set([...Object.values(documentData.sections).flat().filter(r => r.type === 'image').map(r => r.value), ...Object.values(documentData.collections || {}).flat().map(r=>r.image).filter(Boolean)]);
    for (const path of paths) { const tile = element('div', undefined, 'image-tile'), img = element('img'); img.src = '/' + path; img.alt = ''; tile.append(img, element('p', path)); $('image-library').append(tile); } return;
  }
  const rows = documentData.sections[current] ||= [];
  const card = element('div', undefined, 'editor-card'); card.append(element('h2', labels[current]), element('p', 'Changes are plain text. Image fields accept local repository paths.'));
  for (const row of rows) {
    const field = element('div', undefined, 'field'), label = element('label', row.label || 'Content'); label.htmlFor = row.id;
    const input = element(row.type === 'image' ? 'input' : 'textarea'); input.id = row.id; input.value = row.value; input.maxLength = 20000;
    if(row.id==='home_program_count'){input.value=String(documentData.collections?.programs?.length ?? row.value);input.readOnly=true;label.textContent='Program count (calculated automatically)';}
    input.addEventListener('input', () => { row.value = input.value; markDirty(); }); field.append(label,input);
    if (row.type === 'image') {
      const img = element('img'); img.alt = 'Current image'; if(imagePath(row.value))img.src = '/' + row.value;
      const picker=element('input');picker.type='file';picker.accept='image/png,image/jpeg,image/webp';picker.hidden=true;
      const replace=element('button','Choose replacement image');replace.addEventListener('click',()=>picker.click());
      const imageButton=element('button',undefined,'cms-image-button');imageButton.type='button';imageButton.setAttribute('aria-label','Replace '+row.label);imageButton.append(img);imageButton.addEventListener('click',()=>picker.click());
      picker.addEventListener('change',async()=>{if(!picker.files[0])return;try{row.value=await uploadFile(picker.files[0]);markDirty();render();}catch(error){fail(error);}});
      field.append(imageButton,picker,replace);
    }
    if (row.type === 'article' || row.id.startsWith('image_')) { const remove = element('button', 'Remove entry'); remove.type = 'button'; remove.addEventListener('click', () => { rows.splice(rows.indexOf(row),1); markDirty(); render(); }); field.append(remove); }
    card.append(field);
  }
  const actions = element('div', undefined, 'record-actions');
  const add = element('button', 'Add text entry'); add.addEventListener('click', () => { rows.push({ id: `entry_${crypto.randomUUID()}`, type: 'article', label: 'New entry', value: '' }); markDirty(); render(); }); if(current !== 'settings')actions.append(add);
  if (current !== 'settings') { const addImage = element('button', 'Add image'); addImage.addEventListener('click', () => { rows.push({ id: `image_${crypto.randomUUID()}`, type: 'image', label: 'New image', value: 'assets/images/ypp-logo.png' }); markDirty(); render(); }); actions.append(addImage); }
  card.append(actions); $('editor').append(card);
  const key=current==='settings'?'navigation':current;
  if(documentData.collections && Object.hasOwn(documentData.collections,key)) $('editor').append(collectionEditor(key,documentData,{changed:markDirty,upload:uploadFile,error:fail}));
}
for (const [key,label] of Object.entries(labels)) { const button = element('button'); button.append(icon(key), element('span', label)); button.type = 'button'; button.dataset.section = key; button.addEventListener('click', () => { current = key; render(); }); $('sections').append(button); }
$('reload').addEventListener('click', () => { if (!dirty || confirm('Discard unpublished changes and reload?')) load(); });
$('publish').addEventListener('click', async () => {
  if (busy || !documentData) return;
  setBusy(true); message(user.local ? 'Saving content to this computer...' : 'Publishing content to GitHub…');
  try { const result = await write('github-publish', { content: documentData, sha }); sha = result.sha; dirty = false; recordUpdate(user.local ? 'Website content saved locally' : 'Website content published to GitHub ('+result.commit.slice(0,7)+')'); $('summary').textContent = user.local ? 'Saved locally · refresh the website to view changes' : 'Saved to GitHub · deployment pending'; message(result.message); } catch (error) { fail(error); } finally { setBusy(false); }
});
async function uploadFile(file) {
  if (busy) throw new Error('Wait for the current operation to finish.');
  if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2000000) throw new Error('Choose a PNG, JPEG, or WebP image under 2 MB.');
  setBusy(true); message('Uploading '+file.name+(user.local ? ' to this computer...' : ' to GitHub...'));
  try { const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Unable to read this image.'));reader.readAsDataURL(file);});const result=await write('github-upload',{data});recordUpdate('Uploaded '+file.name);message(user.local ? 'Image uploaded locally. Save content to display it on your local website.' : 'Image committed. Publish content to use it; the image appears after deployment.');return result.path; }
  finally { setBusy(false); }
}
$('upload-button').addEventListener('click', async () => {
  if (busy) return;
  const files=Array.from($('upload').files);if(!files.length){message('Choose one or more images first.');return;}
  const results=$('upload-results');results.replaceChildren();
  for(const file of files){try{const path=await uploadFile(file);$('upload-result').value=path;const input=element('input');input.readOnly=true;input.value=path;input.setAttribute('aria-label','Uploaded path for '+file.name);results.append(element('p',file.name),input);}catch(error){fail(error);break;}}
});
$('upload').addEventListener('change',()=>{const host=$('upload-previews');host.replaceChildren();for(const file of Array.from($('upload').files)){if(!['image/png','image/jpeg','image/webp'].includes(file.type))continue;const img=element('img');const url=URL.createObjectURL(file);img.src=url;img.alt=file.name;img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});host.append(img);}});
$('preview').addEventListener('click',()=>{
  if(!documentData||busy)return;
  const snapshot=structuredClone(documentData), preview=window.open('/?preview=1','_blank');
  if(!preview){message('Allow a new browser tab to preview your changes.');return;}
  const receive=event=>{if(event.origin!==location.origin||event.source!==preview||event.data?.type!=='ypp-preview-ready')return;preview.postMessage({type:'ypp-preview-content',content:snapshot},location.origin);window.removeEventListener('message',receive);};
  window.addEventListener('message',receive);setTimeout(()=>window.removeEventListener('message',receive),30000);
});
$('logout').addEventListener('click', async () => { if (busy || (dirty && !confirm('Sign out and discard unpublished changes?'))) return; setBusy(true); try { await write('auth-logout', {}); dirty = false; location.replace('/admin/login.html?logout=1'); } catch (error) { fail(error); setBusy(false); } });
addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
try { user = await requireSession(); $('account').textContent = user.email; $('loading').hidden = true; $('app').hidden = false;
  if(user.local){$('publish').textContent='Save locally';document.querySelector('.workspace-footnote').textContent='Local mode: saves update content/site.json on this computer. Original data is backed up in .local-backups/. Nothing is published online.';document.querySelector('#upload-panel>p').textContent='Upload PNG, JPEG or WebP images up to 2 MB to this computer. Copy a path into an image field and save locally.';message('Local administration · editing this project on your computer.');}
  await load(); setInterval(async () => { try { await requireSession(); } catch (error) { fail(error); } },60000); } catch (error) { $('loading').textContent = error.message; }
