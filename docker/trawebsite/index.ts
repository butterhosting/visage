import { join } from "path";

const pagesDir = join(import.meta.dirname, "pages");

const server = Bun.serve({
  port: 4002,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const file = Bun.file(join(pagesDir, pathname === "/" ? "index.html" : pathname));
    if (await file.exists()) {
      return new Response(file, { headers: { "content-type": "text/html" } });
    }
    return new Response("Not Found", { status: 404 });
  },
});
console.log(`Traditional website started on ${server.url}`);
