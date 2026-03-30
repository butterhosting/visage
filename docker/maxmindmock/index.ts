import { mkdir, rm } from "fs/promises";
import { join } from "path";

/**
 * The fixture binary was taken from: https://github.com/maxmind/MaxMind-DB/tree/main/test-data
 * This method mimics the tarball directory structure from the real API, and gzips it.
 */
async function constructGeoLiteDatabaseFixtureTarball(): Promise<Uint8Array<ArrayBuffer>> {
  const dir = import.meta.dirname;
  const tarball = join(dir, "GeoLite2-City.tar.gz");
  const nested = join(dir, "GeoLite2-City_test");
  await mkdir(nested, { recursive: true });
  await Bun.write(join(nested, "GeoLite2-City.mmdb"), Bun.file(join(dir, "GeoIP2-City-Test.mmdb")));
  await Bun.spawn(["tar", "czf", tarball, "-C", dir, "GeoLite2-City_test"]).exited;
  await rm(nested, { recursive: true });
  const tarballBytes = await Bun.file(tarball).bytes();
  await rm(tarball);
  return tarballBytes;
}

function validateRequest({ database }: { database: string }) {
  if (database !== "GeoLite2-City") {
    throw new Error(`Unsupported database: ${database}`);
  }
}

const databaseFixtureTarball = await constructGeoLiteDatabaseFixtureTarball();
const server = Bun.serve({
  port: 3030,
  routes: {
    "/": () => new Response("ok"),
    "/geoip/databases/:database/download": {
      HEAD: ({ params }) => {
        validateRequest(params);
        return new Response(null, {
          headers: {
            "last-modified": new Date().toUTCString(),
          },
        });
      },
      GET: ({ params }) => {
        validateRequest(params);
        return new Response(databaseFixtureTarball, {
          headers: {
            "content-type": "application/gzip",
            "last-modified": new Date().toUTCString(),
          },
        });
      },
    },
  },
});
console.log(`MaxMindMock started on ${server.url}`);
