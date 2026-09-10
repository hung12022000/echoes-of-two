import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'scripts/asset-sources.json'), 'utf8'));
const textures = JSON.parse(await readFile(resolve(root, 'scripts/texture-sources.json'), 'utf8'));
for(const entry of textures) {
  const target=resolve(root,'public',entry.path);
  let bytes;try{bytes=await readFile(target);}catch{const response=await fetch(entry.url,{headers:{'User-Agent':'EchoesOfTwo-AssetBuild/1.0'}});if(!response.ok)throw Error('Texture download failed '+entry.path);bytes=Buffer.from(await response.arrayBuffer());}
  if(createHash('md5').update(bytes).digest('hex')!==entry.md5)throw Error('Texture checksum mismatch '+entry.path);
  await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);
}
for (const file of manifest.files) {
  const target = resolve(root, 'art-source', file);
  if (!target.startsWith(resolve(root, 'art-source') + (process.platform === 'win32' ? '\\' : '/'))) throw Error('Unsafe asset path');
  try { await access(target); continue; } catch { /* Download pinned sources on a fresh checkout. */ }
  const url = 'https://raw.githubusercontent.com/' + manifest.repository + '/' + manifest.commit + '/' + file;
  const response = await fetch(url);
  if (!response.ok) throw Error('Asset download failed ' + response.status + ' ' + file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  console.log('Downloaded', file);
}
const blender = process.env.BLENDER_PATH || 'blender';
const result = spawnSync(blender, ['-b', '--python-exit-code', '1', '--python', resolve(root, 'scripts/build-characters.py')], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
