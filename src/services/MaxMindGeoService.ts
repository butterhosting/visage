import { Env } from "@/Env";
import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import { exists, readdir, readFile, rename, rm, unlink, writeFile } from "fs/promises";
import { basename, dirname, join } from "path";

export class MaxMindGeoService {
  private readonly log = new Logger(__filename);

  private readonly configuration?: {
    requestUrl: string;
    requestHeaders?: { Authorization: string };
    localRoot: string;
    localVersionFile: string;
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
        localRoot: env.X_MAXMIND.ROOT,
        localDatabaseFile: join(env.X_MAXMIND.ROOT, "GeoLite2-City.mmdb"),
        localVersionFile: join(env.X_MAXMIND.ROOT, "GeoLite2-City.version"),
        awaitDownload: env.X_MAXMIND.AWAIT_DOWNLOAD,
      };
    }
  }

  public async lookup(ipAddress: string): Promise<AnalyticsEvent["geo"]> {
    if (this.reader) {
      try {
        const result = this.reader.city(ipAddress);
        return {
          countryCode: result.country?.isoCode ?? undefined,
          cityName: result.city?.names.en ?? undefined,
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
      this.log.info("Analytics geo enrichment disabled");
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

      // We have to remove any database older than 30 days, as per the EULA
      // https://support.maxmind.com/knowledge-base/articles/maintain-up-to-date-data
      const localVersion = await this.getLocalVersion();
      if (localVersion) {
        const age = Temporal.Now.instant().since(localVersion);
        if (Temporal.Duration.compare(age, Temporal.Duration.from({ days: 30 })) > 0) {
          this.log.warn("Database is older than 30 days, removing per EULA requirements");
          await this.clearEverything();
        }
      }

      const remoteVersion = await this.getRemoteVersion();
      if (!remoteVersion) {
        if (await exists(this.configuration.localDatabaseFile)) {
          this.log.warn("Failed to determine latest (remote) version, re-using available database ...");
          return await this.succeedDownload();
        }
        return this.failDownload("Failed to determine latest (remote) version");
      }
      if (localVersion && Temporal.Instant.compare(localVersion, remoteVersion) === 0) {
        if (await exists(this.configuration.localDatabaseFile)) {
          this.log.info("Database is up to date");
          return await this.succeedDownload();
        }
        this.log.warn("Database file missing despite matching version, re-downloading ...");
      }

      this.log.info(`Downloading ${this.configuration.requestUrl}`);
      const response = await fetch(this.configuration.requestUrl, {
        method: "GET",
        headers: this.configuration.requestHeaders,
        redirect: "follow",
      });
      if (!response.ok) {
        return this.failDownload(`Database download failed: ${response.status} ${response.statusText}`);
      }

      this.log.debug("Writing tarball");
      const tarball = join(this.configuration.localRoot, "GeoLite2-City.tar.gz");
      const writer = Bun.file(tarball).writer();
      try {
        for await (const chunk of response.body!) {
          writer.write(chunk);
        }
      } finally {
        await writer.end();
      }

      this.log.debug("Extracting tarball");
      const extract = Bun.spawn(["tar", "xzf", tarball, "--strip-components=1", "-C", dirname(this.configuration.localDatabaseFile)], {
        stderr: "pipe",
      });
      const exitCode = await extract.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(extract.stderr).text();
        return this.failDownload(`Database extraction failed: ${stderr}`);
      }

      this.log.debug("Ensuring a single .mmdb file");
      const entries = await readdir(this.configuration.localRoot);
      const mmdbFiles = entries.filter((e) => e.endsWith(".mmdb"));
      if (mmdbFiles.length !== 1) {
        return this.failDownload(`Expected exactly 1 .mmdb file after extraction, found ${mmdbFiles.length}: ${mmdbFiles.join(", ")}`);
      }
      if (mmdbFiles[0] !== basename(this.configuration.localDatabaseFile)) {
        await rename(join(this.configuration.localRoot, mmdbFiles[0]), this.configuration.localDatabaseFile);
      }

      this.log.info("Database successfully downloaded and extracted");
      await writeFile(this.configuration.localVersionFile, remoteVersion.toString());
      await unlink(tarball);
      return await this.succeedDownload();
    } catch (err) {
      return this.failDownload("An unknown error occurred while downloading the database", err);
    }
  }

  private async getLocalVersion(): Promise<Temporal.Instant | undefined> {
    this.require(this.configuration);
    if (await exists(this.configuration.localVersionFile)) {
      return Temporal.Instant.from(await readFile(this.configuration.localVersionFile, "utf-8"));
    }
  }

  private async getRemoteVersion(): Promise<Temporal.Instant | undefined> {
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
    const lastModified = headResponse.headers.get("last-modified");
    if (lastModified) {
      // Uses the standard HTTP date format, for example:
      // Fri, 27 Mar 2026 15:01:04 GMT
      const epochMillis = Date.parse(lastModified);
      return Temporal.Instant.fromEpochMilliseconds(epochMillis);
    }
    return undefined;
  }

  private async clearEverything() {
    this.require(this.configuration);
    const localRoot = this.configuration.localRoot;
    await Promise.all(
      (await readdir(localRoot)).map((entry) =>
        rm(join(localRoot, entry), {
          recursive: true,
        }),
      ),
    );
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
