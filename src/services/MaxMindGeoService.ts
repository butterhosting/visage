import { Env } from "@/Env";
import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { Reader, ReaderModel } from "@maxmind/geoip2-node";
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
  private reader?: ReaderModel;

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
    if (this.reader) {
      try {
        const { country, city, ...x } = this.reader.city(ipAddress);
        return {
          countryCode: country?.isoCode ?? undefined,
          city: city?.names.en ?? undefined,
        };
      } catch (err) {
        if (err instanceof Error && err.name === "AddressNotFoundError") {
          // do nothing
        } else {
          this.log.warn(`Lookup unexpectedly failed`, err);
        }
      }
    }
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

  private async download(): Promise<Reader | "error"> {
    try {
      this.require(this.configuration);

      // Remove any database older than 30 days, as per the EULA
      // https://support.maxmind.com/knowledge-base/articles/maintain-up-to-date-data

      // TODO --- implement!

      const localLastModified = await this.getLocalLastModified();
      const remoteLastModified = await this.getRemoteLastModified();
      if (!remoteLastModified) {
        return this.failDownload("Failed to determine latest (remote) database version");
      }
      if (localLastModified === remoteLastModified) {
        if (await exists(this.configuration.localDatabaseFile)) {
          this.log.info("Database is up to date");
          return await this.succeedDownload();
        }
        this.log.warn("Database file missing despite matching last-modified, re-downloading ...");
      }

      this.log.info(`Downloading ${this.configuration.requestUrl}`);
      const response = await fetch(this.configuration.requestUrl, { headers: this.configuration.requestHeaders, redirect: "follow" });
      if (!response.ok) {
        return this.failDownload(`Database download failed: ${response.status} ${response.statusText}`);
      }

      const tarball = join(dirname(this.configuration.localDatabaseFile), "GeoLite2-City.tar.gz");
      await Bun.write(tarball, response);
      const extract = Bun.spawn(["tar", "xzf", tarball, "--strip-components=1", "-C", dirname(this.configuration.localDatabaseFile)], {
        stderr: "pipe",
      });
      const exitCode = await extract.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(extract.stderr).text();
        return this.failDownload(`Database extraction failed: ${stderr}`);
      }

      await unlink(tarball);
      await writeFile(this.configuration.localLastModifiedFile, remoteLastModified);
      this.log.info("GeoLite2-City database successfully downloaded");
      return await this.succeedDownload();
    } catch (err) {
      return this.failDownload("An unknown error occurred while downloading database", err);
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

  private failDownload(...message: unknown[]): "error" {
    this.log.error(...message);
    return "error";
  }

  private async succeedDownload(): Promise<Reader> {
    this.require(this.configuration);
    const buffer = await readFile(this.configuration.localDatabaseFile);
    this.reader = Reader.openBuffer(buffer);
    return this.reader;
  }

  private require<T>(obj: T): asserts obj is NonNullable<T> {
    if (obj === null || obj === undefined) {
      throw new Error(`Invalid state: configuration unavailable`);
    }
  }
}
