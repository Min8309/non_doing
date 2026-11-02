import { build } from 'esbuild';
import { mkdir, copyFile, rm, cp } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({entryPoints:['src/room-scene.js'],outfile:'room-scene.bundle.js',bundle:true,minify:true,format:'esm',target:['es2022']});
for (const name of ['index.html', 'room-scene.bundle.js', 'letters.js', 'letters.css', 'room.js', 'room.css', 'pond.js', 'ritual.js', 'ritual.css', 'tailwind.css']) {
  await copyFile(name, `dist/${name}`);
}

await cp('assets', 'dist/assets', { recursive: true });
