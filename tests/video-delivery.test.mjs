import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { serveVideo } from '../lib/serve-video.mjs';

test('MP4 responses support playback ranges, seeking, HEAD and unsatisfiable ranges', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'videovitannya-media-'));
  const file = join(directory, 'fixture.mp4');
  const bytes = Buffer.from('0123456789abcdefghijklmnopqrstuvwxyz');
  await writeFile(file, bytes);
  const server = http.createServer((req, res) => serveVideo(req, res, file, bytes.length));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/fixture.mp4`;
  try {
    const full = await fetch(url);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('content-type'), 'video/mp4');
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    assert.equal(full.headers.get('content-length'), String(bytes.length));
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);

    for (const [range, start, end] of [['bytes=0-7', 0, 7], ['bytes=20-', 20, 35], ['bytes=-5', 31, 35], ['bytes=30-999', 30, 35]]) {
      const result = await fetch(url, { headers: { Range: range } });
      assert.equal(result.status, 206, range);
      assert.equal(result.headers.get('content-range'), `bytes ${start}-${end}/${bytes.length}`);
      assert.equal(result.headers.get('content-length'), String(end - start + 1));
      assert.deepEqual(Buffer.from(await result.arrayBuffer()), bytes.subarray(start, end + 1));
    }

    const head = await fetch(url, { method: 'HEAD', headers: { Range: 'bytes=0-7' } });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), String(bytes.length));
    assert.equal((await head.arrayBuffer()).byteLength, 0);

    for (const range of ['bytes=999-', 'bytes=8-2', 'bytes=-0', 'bytes=abc']) {
      const result = await fetch(url, { headers: { Range: range } });
      assert.equal(result.status, 416, range);
      assert.equal(result.headers.get('content-range'), `bytes */${bytes.length}`);
      assert.equal((await result.arrayBuffer()).byteLength, 0);
    }

    const staleRange = await fetch(url, { headers: { Range: 'bytes=0-7', 'If-Range': '"old-version"' } });
    assert.equal(staleRange.status, 200);
    assert.deepEqual(Buffer.from(await staleRange.arrayBuffer()), bytes);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(file);
    await rmdir(directory);
  }
});
