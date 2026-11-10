export const imagePath = value => typeof value === 'string' && /^(?:assets\/(?:images|uploads)\/|Photos\/)[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif)$/i.test(value) && !value.includes('..');
export const safeLink = value => typeof value === 'string' && /^(?:#[a-zA-Z][\w-]*|\/(?!\/)[a-zA-Z0-9_./#?=&%-]*|https:\/\/[^\s<>"'\\]+)$/.test(value) && !value.includes('..');
export const collectionFields = {
  programs: { title: 'Program title', description: 'Description', image: 'Program image' },
  events: { title: 'Event title', description: 'Description', image: 'Event image', date: 'Date (or To be announced)', location: 'Location', published: 'Published' },
  gallery: { caption: 'Caption', alt: 'Image description', image: 'Image', group: 'Gallery group' },
  team: { name: 'Full name', position: 'Position', image: 'Profile photo' },
  navigation: { label: 'Link text', href: 'Link destination' }
};
