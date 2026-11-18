import { createReadStream } from 'node:fs';

// Browsers request small ranges for MP4 metadata, playback and seeking.
export function serveVideo(req, res, file, size, contentType = 'video/mp4') {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=2592000');

  let start = 0;
  let end = size - 1;
  let partial = false;
  // Range only applies to GET. Without validators an If-Range request falls
  // back to the complete representation instead of trusting a stale range.
  const range = req.method === 'GET' && !req.headers['if-range'] && req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && (match[1] || match[2])) {
      if (!match[1]) {
        const suffix = Number(match[2]);
        start = Number.isSafeInteger(suffix) && suffix > 0 ? Math.max(0, size - suffix) : -1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : end;
      }
    } else start = -1;

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Content-Length': 0 });
      res.end();
      return;
    }
    end = Math.min(end, size - 1);
    partial = true;
  }

  const headers = { 'Content-Length': partial ? end - start + 1 : size };
  if (partial) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  res.writeHead(partial ? 206 : 200, headers);
  if (req.method === 'HEAD' || size === 0) { res.end(); return; }

  const stream = createReadStream(file, { start, end });
  stream.on('error', error => res.destroy(error));
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
