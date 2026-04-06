export namespace Artifact {
  export enum Enum {
    analytics = "analytics",
    bots = "bots",
  }
  export function filename(artifact: Enum, hostname: string): string {
    switch (artifact) {
      case Enum.analytics:
        return `${hostname}.analytics.json`;
      case Enum.bots:
        return `${hostname}.bots.json`;
    }
  }
}
