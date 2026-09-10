import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
const check = (condition, message) => { if (!condition) throw new Error(message); };
check(existsSync('dist/index.html'), 'dist/index.html missing');
const html = readFileSync('dist/index.html', 'utf8');
const entry = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
check(entry?.startsWith('/echoes-of-two/'), 'Entry must use Pages project base');
const files = readdirSync('dist', { recursive: true }).map(String).filter(file => statSync(join('dist', file)).isFile());
const total = files.reduce((bytes, file) => bytes + statSync(join('dist', file)).size, 0);
check(total < 250 * 1024 ** 2, 'Deployment exceeds 250 MiB');
let jsGzip = 0;
for (const file of files.filter(file => /\.(js|html|css)$/.test(file))) {
  const content = readFileSync(join('dist', file), 'utf8');
  check(!/\b(?:SUPABASE_SERVICE_ROLE_KEY|sb_secret_[\w-]{12,}|ghp_[\w]{30,})\b/.test(content), `Secret-like value in ${file}`);
  if (file.endsWith('.js')) jsGzip += gzipSync(content).length;
}
check(jsGzip < 2.5 * 1024 ** 2, 'Combined gzip JS exceeds 2.5 MiB');
const textures = JSON.parse(readFileSync('scripts/texture-sources.json', 'utf8'));
let initialAssets = statSync('dist/images/vietnam-hero.jpg').size;
for (const name of ['hung', 'mei']) {
  const file = readFileSync(`dist/models/${name}.glb`);
  check(file.length < 12 * 1024 ** 2, `${name} exceeds model budget`);
  check(file.toString('ascii', 0, 4) === 'glTF' && file.readUInt32LE(4) === 2 && file.readUInt32LE(8) === file.length, `${name} is not a complete GLB v2`);
  const gltf = JSON.parse(file.toString('utf8', 20, 20 + file.readUInt32LE(12)));
  check(gltf.skins?.length > 0 && gltf.images?.length > 0, `${name}: rig or textures missing`);
  for (const clip of ['idle', 'walk', 'run', 'wave', 'victory', 'kneel']) check(gltf.animations?.some(a => a.name.includes(clip) && a.channels.length > 0), `${name}: ${clip} animation missing`);
  initialAssets += file.length;
}
for (const texture of textures) {
  const size = statSync(join('dist', texture.path)).size;
  check(size === texture.size, `${texture.path} is incomplete`);
  if (texture.kind === 'Diffuse' || texture.id === 'rock_face_03') initialAssets += size;
}
check(initialAssets < 20 * 1024 ** 2, 'Required scene assets exceed 20 MiB');
check(existsSync('dist/licenses/Microsoft-Rocketbox.txt') && existsSync('dist/credits.html'), 'Asset credits missing');
console.log(JSON.stringify({ verifiedFiles: files.length, totalMiB: +(total/1024**2).toFixed(2), allJavaScriptGzipKiB: +(jsGzip/1024).toFixed(1), sceneAssetsMiB: +(initialAssets/1024**2).toFixed(2), animatedHumanGLBs: 2 }));
