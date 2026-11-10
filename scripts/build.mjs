import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const path of ['index.html', 'robots.txt', 'assets', 'Photos', 'admin', 'content']) await cp(path, `dist/${path}`, { recursive: true });
