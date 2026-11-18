import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../mobile/package.json', import.meta.url));
const sharp = require('sharp');
const assets = new URL('../mobile/assets/', import.meta.url);
await fs.mkdir(assets, { recursive: true });

const symbol = `
  <circle cx="512" cy="512" r="400" fill="#7366F0"/>
  <g stroke="#FFFFFF" stroke-width="36" stroke-linecap="round" fill="none">
    <path d="M312 562a200 200 0 0 1 400 0M312 662h400"/>
    <path d="M512 262v64M262 386l48 48M762 386l-48 48"/>
  </g>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#7366F0"/>${symbol}</svg>`;
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${symbol}</svg>`;
await fs.writeFile(new URL('icon.svg', assets), icon);
await sharp(Buffer.from(icon))
  .png()
  .toFile(fileURLToPath(new URL('icon.png', assets)));
await sharp(Buffer.from(splash))
  .png()
  .toFile(fileURLToPath(new URL('splash.png', assets)));
const darkSplash = splash
  .replaceAll('#7366F0', '#A99BFF')
  .replaceAll('#FFFFFF', '#24203F');
await sharp(Buffer.from(darkSplash))
  .png()
  .toFile(fileURLToPath(new URL('splash-dark.png', assets)));
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#7366F0"/>
  <path d="M8 18a8 8 0 0 1 16 0M8 22h16M16 6v3M6 11l2 2M26 11l-2 2"
    stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" fill="none"/>
</svg>`;
await sharp(Buffer.from(favicon))
  .png()
  .toFile(fileURLToPath(new URL('favicon.png', assets)));
console.log('Generated Dayflow icon, splash assets and favicon from the brand symbol.');
