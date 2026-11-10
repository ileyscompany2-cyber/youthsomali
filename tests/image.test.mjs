import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateImage } from '../netlify/functions/lib/image.js';

test('valid PNG and existing JPEG pass shared upload validation', async () => {
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7X8AAAAASUVORK5CYII=';
  assert.equal(validateImage(png).width,1);
  const jpeg=await readFile(new URL('../assets/images/project-dialogue.jpg',import.meta.url));
  const result=validateImage(jpeg.toString('base64'));assert.equal(result.extension,'jpg');assert.ok(result.width>1&&result.height>1);
});
test('truncated, disguised, oversized and excessive-dimension uploads are rejected', () => {
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  for (const bytes of [Buffer.from('<svg onload="alert(1)"></svg>'),Buffer.concat([signature,Buffer.alloc(100)]),Buffer.alloc(2000001),Buffer.from([255,216,255,217])]) assert.throws(()=>validateImage(bytes.toString('base64')));
  const data=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7X8AAAAASUVORK5CYII=','base64');data.writeUInt32BE(50000,16);assert.throws(()=>validateImage(data.toString('base64')));
});
