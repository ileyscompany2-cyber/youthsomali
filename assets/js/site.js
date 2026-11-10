// Delegate navigation clicks so JSON-generated links get the same accessible behavior.
const menuButton = document.querySelector('.menu-toggle');
const pageNav = document.querySelector('#primary-navigation');
function closeMenu() {
  pageNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  pageNav.classList.toggle('is-open', open);
});
pageNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && pageNav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = encodeURIComponent('Contact YPP');
  const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`);
  const recipient = document.querySelector('a[href^="mailto:"]').getAttribute('href');
  window.location.href = `${recipient}?subject=${subject}&body=${body}`;
});
