const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
type Shade = (typeof shades)[number];

export class Color {
  // Custom colors
  public static accent = () => this.css("--color-c-accent");
  public static error = () => this.css("--color-c-error");
  public static darkgray = () => this.css("--color-c-darkgray");
  public static midgray = () => this.css("--color-c-midgray");

  private static cache: Record<string, string> = {};

  private static css(name: string): string {
    let value = this.cache[name];
    if (!value) {
      value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (!value) {
        throw new Error(`Couldn't determine color: ${name}`);
      }
      this.cache[name] = value;
    }
    return value;
  }

  static {
    Object.values(this).forEach((fieldFn) => {
      if (typeof fieldFn === "function") {
        // check if there's any color which throws an error
        shades.forEach(fieldFn);
      }
    });
  }
}
