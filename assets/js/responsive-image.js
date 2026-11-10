import { variants } from './image-variants.js';
export function setImageSource(image, path) {
  const variant = variants[path];
  if (!variant) { image.src = '/' + path; image.removeAttribute('srcset'); image.removeAttribute('sizes'); return; }
  image.src = '/' + variant['1600'];
  image.srcset = `/${variant['800']} 800w, /${variant['1600']} 1600w`;
  image.sizes = image.classList.contains('home-hero-photo') || image.closest('.team-page-feature') ? '100vw' : '(max-width: 600px) 100vw, 600px';
  image.width = variant.width; image.height = variant.height;
}
