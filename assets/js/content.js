import { imagePath } from './cms-schema.js';
import { renderCollections, renderSettings } from './cms-render.js';
import { setImageSource } from './responsive-image.js';
// Public content is text and local images only. Never interpret stored text as HTML.
function applyContent(data) {
  for (const [section, rows] of Object.entries(data.sections)) {
    for (const row of rows) {
      const target = document.querySelector(`[data-content="${CSS.escape(row.id)}"]`);
      if (target && row.type === 'text') target.textContent = row.value;
      else if (target && row.type === 'image' && imagePath(row.value)) { setImageSource(target,row.value); const link = target.closest('a.gallery-item'); if (link) link.href = '/' + row.value; }
      else if (!target && section === 'settings' && row.id === 'site_title' && row.value) document.title = row.value;
      else if (!target && section === 'settings' && row.id === 'site_description') document.querySelector('meta[name="description"]').content = row.value;
      else if (!target && section !== 'settings') {
        let host = document.getElementById(section);
        if (!host) { host = document.createElement('section'); host.id = section; host.className = 'section'; const container = document.createElement('div'); container.className = 'container'; const heading = document.createElement('h2'); heading.textContent = ({ news: 'News & stories', projects: 'Our projects', pages: 'More from YPP' })[section] || section; container.append(heading); host.append(container); document.querySelector('main').append(host); }
        const container = host.querySelector('.container') || host;
        if (row.type === 'image' && imagePath(row.value)) { const img = document.createElement('img'); setImageSource(img,row.value); img.alt = row.label; img.loading = 'lazy'; img.className = 'managed-image'; container.append(img); }
        else if (row.type === 'article') { const article = document.createElement('article'); article.className = 'managed-entry'; article.textContent = row.value; container.append(article); }
      }
    }
  }
  renderCollections(data);
  renderSettings(data);
}
if (new URLSearchParams(location.search).get('preview') === '1' && window.opener) {
  // Only a same-origin admin window can supply a transient preview; nothing is stored.
  const receivePreview = event => {
    if (event.origin !== location.origin || event.source !== window.opener || event.data?.type !== 'ypp-preview-content') return;
    applyContent(event.data.content);
    const notice = document.createElement('div'); notice.className = 'cms-preview-notice'; notice.textContent = 'Unpublished preview · changes are visible only in this tab'; document.body.prepend(notice);
    window.removeEventListener('message', receivePreview);
  };
  window.addEventListener('message', receivePreview);
  window.opener.postMessage({ type: 'ypp-preview-ready' }, location.origin);
} else {
  fetch('/content/site.json', { cache: 'no-cache' }).then(response => { if (!response.ok) throw new Error('Content unavailable'); return response.json(); }).then(applyContent).catch(() => { /* Original HTML remains available if content cannot be loaded. */ });
}
