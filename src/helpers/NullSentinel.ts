export namespace NullSentinel {
  const VALUE = "@null";

  export function encode(value: string | null): string {
    return value === null ? VALUE : value;
  }

  export function decode(value: string): string | null {
    return value === VALUE ? null : value;
  }
}
