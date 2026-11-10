import { imagePath, safeLink } from './cms-schema.js';
import { setImageSource } from './responsive-image.js';
const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
function image(path, alt, className) { const img = make('img', className); if (imagePath(path)) setImageSource(img,path); img.alt = alt || ''; img.loading = 'lazy'; return img; }
export function renderCollections(data) {
  const c = data.collections;
  if (!c) return;
  if (Array.isArray(c.programs)) {
    const count = document.querySelector('[data-content="home_program_count"]'); if (count) count.textContent = String(c.programs.length);
    const summary = document.querySelector('[data-content="programs_3"]'); if (summary) summary.textContent = summary.textContent.replace(/^\d+/, String(c.programs.length));
    const host = document.querySelector('#programs .card-grid'); host.replaceChildren();
    for (const record of c.programs) { const card = make('article','content-card'), body = make('div','content-card-body'); body.append(make('h3','',record.title),make('p','',record.description)); card.append(image(record.image, record.title),body); host.append(card); }
  }
  if (Array.isArray(c.team)) {
    const host = document.querySelector('#team .team-member-grid'); host.replaceChildren();
    for (const record of c.team) { const card = make('article','content-card'), body = make('div','content-card-body'); body.append(image(record.image,`${record.name}, ${record.position}`,'team-member-photo'),make('p','eyebrow',record.position),make('h3','',record.name)); card.append(body); host.append(card); }
  }
  if (Array.isArray(c.events)) {
    const old = document.querySelector('#events .project-preview');
    let host = document.querySelector('#events .managed-events');
    if (!host) { host = make('div','managed-events'); old.replaceWith(host); }
    host.replaceChildren();
    for (const record of c.events.filter(event => event.published)) { const card = make('div','project-preview'), body = make('div','content-card-body'), link = make('a','button button-primary','Contact YPP about this event'); link.href='#contact'; body.append(make('p','eyebrow',record.date || 'Coming soon'),make('h3','',record.title),make('p','',record.description),make('p','',`Date and venue: ${record.date || 'To be announced.'}${record.location ? ' · ' + record.location : ''}`),link); card.append(image(record.image,record.title,'project-preview-photo'),body); host.append(card); }
    if (!host.children.length) host.append(make('p','empty-state','No upcoming events have been announced.'));
  }
  if (Array.isArray(c.gallery)) {
    const host = document.querySelector('#gallery .gallery-groups'); host.replaceChildren(); const groups = new Map();
    for (const record of c.gallery) { const name = record.group || 'YPP and the community'; if (!groups.has(name)) { const group = make('div','gallery-group'), grid = make('div','gallery-items'); group.append(make('h3','',name),grid); host.append(group); groups.set(name,grid); } const link = make('a','gallery-item'); if (imagePath(record.image)) link.href='/' + record.image; link.target='_blank';link.rel='noopener'; link.append(image(record.image,record.alt),make('span','',record.caption)); groups.get(name).append(link); }
  }
  if (Array.isArray(c.navigation)) {
    const nav = document.querySelector('#primary-navigation'); nav.querySelectorAll('[data-managed-nav], a:not(.nav-cta):not(.admin-login-link):not(.admin-dashboard-link)').forEach(node => node.remove());
    const before = nav.querySelector('.admin-login-link') || nav.querySelector('.nav-cta');
    for (const record of c.navigation) { if (!safeLink(record.href)) continue; const link = make('a','',record.label); link.href=record.href;link.dataset.managedNav='true'; nav.insertBefore(link,before); }
  }
}
export function renderSettings(data) {
  const values = new Map(Object.values(data.sections).flat().map(row => [row.id,row.value]));
  if (values.has('contact_email')) { const value=values.get('contact_email'); if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)) document.querySelectorAll('a[href^="mailto:"]').forEach(link => { link.textContent=value;link.href='mailto:'+value; }); }
  if (values.has('contact_phone')) { const value=values.get('contact_phone'); if (/^\+?[\d ()-]{5,40}$/.test(value)) document.querySelectorAll('a[href^="tel:"]').forEach(link => { link.textContent=value;link.href='tel:'+value.replace(/[ ()-]/g,''); }); }
  for (const [key,selector] of [['hero_primary','.hero-actions a:first-child'],['hero_secondary','.hero-actions a:last-child'],['contact_button','#primary-navigation .nav-cta']]) { const node = document.querySelector(selector); if (values.has(key+'_text')) node.textContent=values.get(key+'_text'); if (safeLink(values.get(key+'_href'))) node.href=values.get(key+'_href'); }
  if (imagePath(values.get('site_logo'))) { document.querySelector('.brand-logo').src='/'+values.get('site_logo'); document.querySelector('link[rel="icon"]').href='/'+values.get('site_logo'); }
  if (values.has('site_footer')) document.querySelector('.site-footer .container>span:first-child').textContent=values.get('site_footer');
}
