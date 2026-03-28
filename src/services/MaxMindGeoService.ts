import { Env } from "@/Env";
import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { exists, readFile, unlink, writeFile } from "fs/promises";
import { dirname, join } from "path";

export class MaxMindGeoService {
  private readonly log = new Logger(__filename);

  private readonly configuration?: {
    requestUrl: string;
    requestHeaders?: { Authorization: string };
    localLastModifiedFile: string;
    localDatabaseFile: string;
    awaitDownload: boolean;
  };

  public constructor(env: Env.Private) {
    if (env.X_MAXMIND) {
      this.configuration = {
        requestUrl: `${env.X_MAXMIND.BASE_URL}/geoip/databases/GeoLite2-City/download?suffix=tar.gz`,
        requestHeaders: {
          Authorization: `Basic ${Buffer.from(`${env.X_MAXMIND.ACCOUNT_ID}:${env.X_MAXMIND.LICENSE_KEY}`, "utf-8").toBase64()}`,
        },
        localLastModifiedFile: join(env.X_MAXMIND?.ROOT, ".last-modified"),
        localDatabaseFile: join(env.X_MAXMIND?.ROOT, "GeoLite2-City.mmdb"),
        awaitDownload: env.X_MAXMIND.AWAIT_DOWNLOAD,
      };
    }
  }

  public async lookup(ipAddress: string): Promise<AnalyticsEvent["geo"]> {
    return {};
  }

  public async keepDatabaseUpToDate() {
    if (!this.configuration) {
      this.log.info("Geo enrichment disabled");
      return;
    }

    setInterval(() => this.download(), Temporal.Duration.from({ days: 1 }).total("millisecond"));
    const promise = this.download();
    if (this.configuration.awaitDownload) {
      await promise;
    }
  }

  public async download() {
    try {
      this.require(this.configuration);

      // Remove any database older than 30 days, as per the EULA
      // https://support.maxmind.com/knowledge-base/articles/maintain-up-to-date-data

      // TODO --- implement!

      const localLastModified = await this.getLocalLastModified();
      const remoteLastModified = await this.getRemoteLastModified();
      if (!remoteLastModified) {
        this.log.error("Failed to determine latest (remote) database version");
        return;
      }
      if (localLastModified === remoteLastModified) {
        this.log.info("Database is up to date");
        return;
      }

      this.log.info(`Downloading database from ${this.configuration.requestUrl}`);
      const response = await fetch(this.configuration.requestUrl, { headers: this.configuration.requestHeaders, redirect: "follow" });
      if (!response.ok) {
        this.log.error(`Database download failed: ${response.status} ${response.statusText}`);
        return;
      }

      const tarball = join(dirname(this.configuration.localDatabaseFile), "GeoLite2-City.tar.gz");
      await Bun.write(tarball, response);
      const extract = Bun.spawn(["tar", "xzf", tarball, "--strip-components=1", "-C", dirname(this.configuration.localDatabaseFile)], {
        stderr: "pipe",
      });
      const exitCode = await extract.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(extract.stderr).text();
        this.log.error(`Database extraction failed: ${stderr}`);
        return;
      }

      await unlink(tarball);
      await writeFile(this.configuration.localLastModifiedFile, remoteLastModified);
      this.log.info("GeoLite2-City database successfully downloaded");
    } catch (err) {
      this.log.error("An unknown error occurred while downloading database", err);
    }
  }

  private async getRemoteLastModified() {
    this.require(this.configuration);
    const headResponse = await fetch(this.configuration.requestUrl, {
      method: "HEAD",
      headers: this.configuration.requestHeaders,
      redirect: "follow",
    });
    if (!headResponse.ok) {
      this.log.warn(`MaxMind HEAD request failed: ${headResponse.status} ${headResponse.statusText}`);
      return;
    }
    return headResponse.headers.get("last-modified") || undefined;
  }

  private async getLocalLastModified() {
    this.require(this.configuration);
    if ((await exists(this.configuration.localDatabaseFile)) && (await exists(this.configuration.localLastModifiedFile))) {
      return await readFile(this.configuration.localLastModifiedFile, "utf-8");
    }
  }

  private require<T>(obj: T): asserts obj is NonNullable<T> {
    if (obj === null || obj === undefined) {
      throw new Error(`Invalid state: configuration unavailable`);
    }
  }
}
