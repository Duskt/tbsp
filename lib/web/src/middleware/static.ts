import fs from 'node:fs';
import { BaseApp } from '../server.ts';

function debugPath<T>(path: string, fallback: T) {
  try {
    fs.accessSync(path);
  } catch {
    console.error(`Failed to access file at ${path} (resolved from ${process.cwd()}).`);
    return fallback;
  }
}

/**
 * Serve a response from a file at `path`.
 * This uses the environment variable `DEV` (development mode)
 * to define its behaviour. (It's a wrapper around `Bun.file`)
 * - in development: read the file and send the content
 * - in production: load the file into memory immediately and send content on request without fs IO
 */
export function File(path: string, preload = false) {
  let r = debugPath(path, () => new Response('Resource not found.', { status: 404 }));
  if (r) return r;

  if (preload) {
    return async () => new Response(await Bun.file(path).bytes());
  } else {
    return () => new Response(Bun.file(path));
  }
}

export function PublicDirectory(basePath: string, preload = false, prefix = '') {
  basePath = basePath.endsWith('/') ? basePath.slice(0, basePath.length - 1) : basePath;
  let app = new BaseApp<any, any>({
    read: () => {
      throw new Error('Never');
    },
    clientWsConnFactory: () => {
      throw new Error("WebSocket shouldn't serve static files!!?");
    },
  });

  let r = debugPath(basePath, app);
  if (r) return r;

  for (let item of fs.readdirSync(basePath)) {
    let itemPath = `${basePath}/${item}`;
    if (debugPath(itemPath, true)) continue;

    if (fs.statSync(itemPath).isDirectory()) {
      app.use(PublicDirectory(`${basePath}/${item}`, preload, `${item}/`));
    } else {
      // console.log(`Registered file ${itemPath} at /${prefix}${item}`);
      app.get(`/${prefix}${item}`, File(itemPath, preload));
    }
  }
  return app;
}
