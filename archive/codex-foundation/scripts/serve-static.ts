/** Local static QA server with no SPA fallback: verifies hash routing without rewrites. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, relative } from 'node:path';
const [directory = 'dist', mount = '/', port = '4173'] = process.argv.slice(2);
const root = resolve(directory);
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url!, 'http://localhost').pathname);
    if (!pathname.startsWith(mount)) {
      res.writeHead(404).end();
      return;
    }
    const path = resolve(root, pathname.slice(mount.length) || 'index.html');
    if (relative(root, path).startsWith('..')) {
      res.writeHead(403).end();
      return;
    }
    const content = await readFile(path);
    res
      .writeHead(200, {
        'Content-Type': types[extname(path)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(content);
  } catch {
    res.writeHead(404).end();
  }
}).listen(Number(port), '127.0.0.1', () =>
  console.log(`Static QA: http://127.0.0.1:${port}${mount}`),
);
