import { join } from "path";

const index = Bun.file(join(import.meta.dirname, "pages", "index.html"));

const server = Bun.serve({
  port: 4001,
  fetch: () => new Response(index, { headers: { "content-type": "text/html" } }),
});
console.log(`SPA website started on ${server.url}`);
