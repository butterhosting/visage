export class RestrictedService {
  public constructor() {}

  public async purge(): Promise<void> {
    throw new Error("Not implemented");
  }

  public async seed(): Promise<void> {
    await this.purge();
    throw new Error("Not implemented");
  }
}
