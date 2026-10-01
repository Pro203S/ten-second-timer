import { readFile, readdir, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const htmlPath = new URL('index.html', dist);
let html = await readFile(htmlPath, 'utf8');

// Inline modules so file:// does not need to fetch scripts across local origins.
for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)) {
  const code = await readFile(new URL(match[1], dist), 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
}

for (const match of html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)) {
  let css = await readFile(new URL(match[1], dist), 'utf8');
  const font = await readFile(new URL('PretendardVariable.ttf', dist));
  css = css.replace(/url\([^)]*PretendardVariable\.ttf[^)]*\)/g,
    () => `url("data:font/ttf;base64,${font.toString('base64')}")`);
  html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
}

await writeFile(htmlPath, html);
for (const entry of await readdir(dist)) {
  if (entry !== 'index.html') {
    await rm(new URL(entry, dist), { recursive: true, force: true });
  }
}
console.log('Created standalone dist/index.html (JavaScript, CSS, and font embedded).');
