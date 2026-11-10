import { collectionFields, imagePath } from '/assets/js/cms-schema.js';
const node = (tag, text) => { const el=document.createElement(tag); if (text !== undefined) el.textContent=text; return el; };
export function collectionEditor(key, data, { changed, upload, error }) {
  const records = data.collections[key] ||= [];
  const host=node('section');host.className='collection-manager editor-card';
  function render() {
    host.replaceChildren(node('h2',key === 'navigation' ? 'Navigation links' : 'Manage '+key),node('p','Add, edit, reorder or remove entries, then preview and publish your changes.'));
    records.forEach((record,index) => {
      const card=node('article');card.className='cms-record';
      card.append(node('h3',`${index+1}. ${record.title || record.name || record.caption || record.label || 'New entry'}`));
      for (const [field,labelText] of Object.entries(collectionFields[key])) {
        const wrapper=node('div');wrapper.className='field'; const label=node('label',labelText);label.htmlFor=`${record.id}_${field}`;
        const input=node(field==='description'?'textarea':'input');input.id=label.htmlFor;
        if (field==='published') {input.type='checkbox';input.checked=record[field];} else { input.value=record[field];input.maxLength=field==='description'?20000:1000; }
        input.addEventListener('input',()=>{ record[field]=field==='published'?input.checked:input.value;changed(); });wrapper.append(label,input);
        if (field==='image') {
          const img=node('img');img.alt='Replace image';if(imagePath(record.image)) img.src='/'+record.image;
          const picker=node('input');picker.type='file';picker.accept='image/png,image/jpeg,image/webp';picker.hidden=true;picker.id=record.id+'_picker';
          const replace=node('button','Choose replacement image');replace.type='button'; replace.addEventListener('click',()=>picker.click());
          const clickable=node('button');clickable.type='button';clickable.className='cms-image-button';clickable.setAttribute('aria-label','Replace '+labelText.toLowerCase());clickable.append(img);clickable.addEventListener('click',()=>picker.click());
          picker.addEventListener('change',async()=>{const file=picker.files[0];if(!file)return;try{record.image=await upload(file);changed();render();}catch(e){error(e);}});
          input.addEventListener('change',()=>{if(imagePath(input.value))img.src='/'+input.value;});wrapper.append(clickable,picker,replace);
        }
        card.append(wrapper);
      }
      const actions=node('div');actions.className='record-actions';
      for (const [text,offset] of [['Move up',-1],['Move down',1]]) {const button=node('button',text);button.disabled=index+offset<0||index+offset>=records.length;button.addEventListener('click',()=>{[records[index],records[index+offset]]=[records[index+offset],records[index]];changed();render();});actions.append(button);}
      const remove=node('button','Delete entry');remove.className='cms-delete';remove.addEventListener('click',()=>{if(!confirm('Remove this entry from the website? Publish to apply the removal.'))return;records.splice(index,1);changed();render();});actions.append(remove);card.append(actions);host.append(card);
    });
    const add=node('button','+ Add '+(key==='navigation'?'navigation link':'entry'));add.className='primary';add.addEventListener('click',()=>{const record={id:'record_'+crypto.randomUUID()};for(const field of Object.keys(collectionFields[key]))record[field]=field==='published'?false:field==='image'?'assets/images/ypp-logo.png':field==='href'?'#home':'';records.push(record);changed();render();});host.append(add);
  }
  render();return host;
}
