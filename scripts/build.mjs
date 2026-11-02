import { mkdir, copyFile, rm, cp } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const name of ['index.html', 'pond.js', 'ritual.js', 'ritual.css', 'tailwind.css']) {
  await copyFile(name, `dist/${name}`);
}

await cp('assets', 'dist/assets', { recursive: true });
