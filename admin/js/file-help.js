// Classic script also works when a user accidentally opens an HTML file directly.
if (location.protocol === 'file:') {
  const host = document.getElementById('notice') || document.getElementById('loading');
  if (host) {
    host.hidden = false;
    host.textContent = 'Tijaabada local-ka: terminal-ka project-ka ku qor powershell -File .\\Start-Local.ps1, kadib fur link-ga hoose. Ha ku furin file://.';
    const link = document.createElement('a');
    link.href = 'http://127.0.0.1:8888/admin/login.html';
    link.textContent = 'Open local admin login';
    link.style.display = 'block'; link.style.marginTop = '16px';
    host.append(link);
  }
  const button = document.getElementById('signin'); if (button) button.disabled = true;
}
