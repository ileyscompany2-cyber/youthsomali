import { collectionFields, imagePath, safeLink } from '../../../assets/js/cms-schema.js';
export function validateContent(data) {
  if (!data || data.version !== 1 || !data.sections || typeof data.sections !== 'object' || Array.isArray(data.sections)) throw Object.assign(new Error('Invalid content document'), { status: 400 });
  if (Object.keys(data).some(key => !['version','sections','collections'].includes(key))) throw Object.assign(new Error('Unknown content document field'), { status: 400 });
  const allowed = ['home', 'about', 'programs', 'events', 'gallery', 'team', 'contact', 'news', 'projects', 'pages', 'settings'];
  const ids = new Set();
  for (const [key, rows] of Object.entries(data.sections)) {
    if (!allowed.includes(key) || !Array.isArray(rows) || rows.length > 300) throw Object.assign(new Error('Invalid section'), { status: 400 });
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(row.id) || !['text', 'image', 'article'].includes(row.type) || typeof row.value !== 'string' || row.value.length > 20000 || typeof row.label !== 'string' || row.label.length > 200) throw Object.assign(new Error('Invalid content entry'), { status: 400 });
      if (Object.keys(row).some(key => !['id','type','value','label'].includes(key))) throw Object.assign(new Error('Unknown content entry field'), { status: 400 });
      if (row.type === 'image' && !imagePath(row.value)) throw Object.assign(new Error('Use a local image path'), { status: 400 });
      if (row.type === 'image' && row.value.includes('..')) throw Object.assign(new Error('Invalid image path'), { status: 400 });
      if (ids.has(row.id)) throw Object.assign(new Error('Duplicate content identifier'), { status: 400 });
      ids.add(row.id);
    }
  }
  if (data.collections !== undefined) {
    if (!data.collections || typeof data.collections !== 'object' || Array.isArray(data.collections)) throw Object.assign(new Error('Invalid collections'), { status: 400 });
    for (const [key, records] of Object.entries(data.collections)) {
      if (!Object.hasOwn(collectionFields, key) || !Array.isArray(records) || records.length > 200) throw Object.assign(new Error('Invalid collection'), { status: 400 });
      for (const record of records) {
        if (!record || !/^[\w-]{1,80}$/.test(record.id || '') || ids.has(record.id)) throw Object.assign(new Error('Invalid record ID'), { status: 400 });
        ids.add(record.id);
        if (Object.keys(record).some(field => field !== 'id' && !Object.hasOwn(collectionFields[key], field))) throw Object.assign(new Error('Unknown record field'), { status: 400 });
        for (const field of Object.keys(collectionFields[key])) {
          const value = record[field];
          if (field === 'published' ? typeof value !== 'boolean' : typeof value !== 'string' || value.length > (field === 'description' ? 20000 : 1000)) throw Object.assign(new Error('Invalid record field: ' + field), { status: 400 });
          if (field === 'image' && !imagePath(value)) throw Object.assign(new Error('Invalid image path'), { status: 400 });
          if (field === 'href' && !safeLink(value)) throw Object.assign(new Error('Use an HTTPS, local or section link'), { status: 400 });
        }
      }
    }
  }
  for (const row of Object.values(data.sections).flat()) {
    if (row.id.endsWith('_href') && !safeLink(row.value)) throw Object.assign(new Error('Invalid link destination'), { status: 400 });
    if (row.id === 'contact_email' && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(row.value)) throw Object.assign(new Error('Invalid contact email'), { status: 400 });
    if (row.id === 'contact_phone' && !/^\+?[\d ()-]{5,40}$/.test(row.value)) throw Object.assign(new Error('Invalid phone number'), { status: 400 });
  }
  return data;
}
