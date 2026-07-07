import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.argv[2] || ".");
const port = Number.parseInt(process.env.PORT || "4173", 10);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"]
]);

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
  const pathname = safeDecodePath(requestUrl.pathname);

  if (!pathname) {
    sendText(response, 400, "Bad request");
    return;
  }

  const filePath = resolvePath(pathname);

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  const resolvedFile = resolveIndex(filePath);

  if (!resolvedFile) {
    sendText(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes.get(extname(resolvedFile).toLowerCase()) || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(resolvedFile).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static preview server running at http://${host}:${port}/`);
  console.log(`Serving ${root}`);
});

function resolvePath(pathname) {
  const normalizedPath = normalize(pathname).replace(/^([/\\])+/, "");
  const filePath = resolve(join(root, normalizedPath));

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  return filePath;
}

function safeDecodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function resolveIndex(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  const stats = statSync(filePath);

  if (stats.isDirectory()) {
    const indexPath = join(filePath, "index.html");
    return existsSync(indexPath) ? indexPath : null;
  }

  return stats.isFile() ? filePath : null;
}

function sendText(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(message);
}
