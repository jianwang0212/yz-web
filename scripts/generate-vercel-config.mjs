import fs from 'node:fs/promises';
import { buildVercelConfig } from '../site-routes.mjs';

await fs.writeFile('vercel.json', `${JSON.stringify(buildVercelConfig(), null, 2)}\n`, 'utf8');
console.log('Updated vercel.json from site-routes.mjs');
