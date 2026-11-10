import { api } from './auth.js';
const element = (tag, text) => { const node=document.createElement(tag); if(text !== undefined) node.textContent=text; return node; };

export function usersPanel(session) {
  const host=element('section');host.className='editor-card';host.append(element('h2','Users'));
  if(!session.local){host.append(element('p','Production accounts are managed in Auth0. Add verified Auth0 user IDs to ADMIN_SUBJECTS in Netlify and redeploy to grant access. Local accounts are never uploaded or used for production authentication.'));return host;}
  if(session.role!=='admin'){host.append(element('p','Only administrators can manage users.'));return host;}
  const notice=element('p');notice.setAttribute('role','status');host.append(element('p','Manage local accounts. Changes take effect immediately. Admins manage accounts and content; editors manage content only.'),notice);
  const list=element('div');host.append(list);
  async function refresh(){try{const result=await api('local-users');list.replaceChildren();for(const user of result.users)list.append(form(user));list.append(form());}catch(error){notice.textContent=error.message;if(error.status===401)location.replace('/admin/login.html?expired=1');}}
  async function save(payload){return api('local-users-save',{method:'POST',headers:{'X-CSRF-Token':session.csrf},body:JSON.stringify(payload)});}
  function form(user){
    const container=element('form');container.className='cms-record';container.append(element('h3',user ? user.name : 'Add user'));
    if(user?.id==='owner'){container.append(element('p',`${user.email} · Workspace owner · Admin`),element('p','The owner login is configured in the server terminal and cannot be deleted here.'));return container;}
    const fields=element('fieldset'), controls={};
    for(const [key,labelText,type] of [['name','Name','text'],['email','Email address','email'],['password',user?'New password (leave blank to keep current)':'Password (at least 12 characters)','password'],['role','Role','select'],['active','Active account','checkbox']]){
      const wrapper=element('div');wrapper.className='field';const id=`user_${user?.id || 'new'}_${key}`;
      const label=element('label',labelText);label.htmlFor=id;const input=element(type==='select'?'select':'input');input.id=id;input.name=key;
      if(type==='select'){for(const role of ['editor','admin']){const option=element('option',role==='admin'?'Admin':'Editor');option.value=role;input.append(option);}input.value=user?.role||'editor';}
      else{input.type=type;if(type==='checkbox')input.checked=user?.active??true;else if(type==='password'){input.autocomplete='new-password';input.minLength=12;input.maxLength=1024;input.required=!user;}else{input.value=user?.[key]||'';input.required=true;input.maxLength=key==='name'?100:254;}}
      controls[key]=input;wrapper.append(label,input);fields.append(wrapper);
    }
    const actions=element('div');actions.className='record-actions';const submit=element('button',user?'Save user':'Create user');submit.type='submit';submit.className='primary';actions.append(submit);
    if(user){const remove=element('button','Delete user');remove.type='button';remove.className='cms-delete';remove.addEventListener('click',async()=>{if(!confirm('Delete this user and revoke their sessions?'))return;fields.disabled=true;try{await save({action:'delete',id:user.id});notice.textContent='User deleted.';await refresh();}catch(error){notice.textContent=error.message;fields.disabled=false;}});actions.append(remove);}
    fields.append(actions);container.append(fields);
    container.addEventListener('submit',async event=>{event.preventDefault();if(!container.reportValidity())return;fields.disabled=true;notice.textContent='Saving user...';try{await save({action:user?'update':'create',id:user?.id,name:controls.name.value,email:controls.email.value,password:controls.password.value,role:controls.role.value,active:controls.active.checked});controls.password.value='';notice.textContent='User saved. Existing sessions for this account have been revoked.';await refresh();}catch(error){notice.textContent=error.message;fields.disabled=false;}});
    return container;
  }
  refresh();return host;
}
