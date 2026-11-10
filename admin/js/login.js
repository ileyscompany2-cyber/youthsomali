import { api, themeControl } from './auth.js';
themeControl();
const notice = document.querySelector('#notice');
const button = document.querySelector('#signin');
const label = document.querySelector('#button-label');
const query = new URLSearchParams(location.search);
let local = false;
let localUnavailable = false;
const ready = ['127.0.0.1','localhost'].includes(location.hostname)
  ? api('local-info').then(result => {
    local = result.local === true;
    if (!local) return;
    document.querySelector('.provider-note').hidden = true;
    label.textContent = 'Sign in to local dashboard';
    const form = document.querySelector('#login-form');
    const fields = document.createElement('div'); fields.className = 'local-login-fields';
    for (const [id,text,type,autocomplete] of [['local-email','Email address','email','username'],['local-password','Password','password','current-password']]) {
      const fieldLabel=document.createElement('label');fieldLabel.htmlFor=id;fieldLabel.textContent=text;
      const input=document.createElement('input');input.id=id;input.name=id;input.type=type;input.autocomplete=autocomplete;input.required=true;input.maxLength=type==='password'?1024:254;
      fields.append(fieldLabel,input);
    }
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Show password';toggle.setAttribute('aria-pressed','false');toggle.addEventListener('click',()=>{const input=document.querySelector('#local-password');const show=input.type==='password';input.type=show?'text':'password';toggle.textContent=show?'Hide password':'Show password';toggle.setAttribute('aria-pressed',String(show));});fields.append(toggle);form.prepend(fields);
  }).catch(error=>{localUnavailable=true;notice.hidden=false;notice.textContent='Start the local server using Start-Local.ps1 from the project terminal, then open http://127.0.0.1:8888/admin/login.html. '+error.message;button.disabled=true;})
  : Promise.resolve();
if (query.has('error') || query.has('expired') || query.has('logout')) {
  notice.hidden = false;
  notice.textContent = query.get('error') === 'configuration'
    ? 'Administrator sign-in is not configured yet. Complete the Auth0 and Netlify environment setup in the project README, then redeploy.'
    : query.has('error') ? 'Sign-in could not be completed. Use an authorized account with a verified email, or contact your administrator.'
    : query.has('logout') ? 'You have been signed out.' : 'Your session ended. Please sign in again.';
  history.replaceState(null, '', '/admin/login.html');
}
api('auth-session').then(() => location.replace('/admin/index.html')).catch(error => {
  if (error.status !== 401) { notice.hidden = false; notice.textContent = error.message; }
});
document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  await ready;
  if (localUnavailable) return;
  if (!document.querySelector('#login-form').reportValidity()) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  if (local) {
    label.textContent='Signing in...';
    try { await api('local-login',{method:'POST',body:JSON.stringify({email:document.querySelector('#local-email').value.trim(),password:document.querySelector('#local-password').value,remember:document.querySelector('#remember').checked})});location.replace('/admin/index.html'); }
    catch(error){notice.hidden=false;notice.textContent=error.message;button.disabled=false;button.removeAttribute('aria-busy');label.textContent='Sign in to local dashboard';}
    return;
  }
  label.textContent = 'Opening secure sign-in...';
  location.assign(`/.netlify/functions/auth-start?remember=${document.querySelector('#remember').checked ? '1' : '0'}`);
});
// Restore controls after returning from the provider through browser history.
addEventListener('pageshow', () => {
  button.disabled = localUnavailable;
  button.removeAttribute('aria-busy');
  label.textContent = local ? 'Sign in to local dashboard' : 'Sign in securely';
});
