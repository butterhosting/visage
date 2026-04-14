import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { PersistenceError } from "./error/PersistenceError";
import { WebsiteRepository } from "./WebsiteRepository";

describe(WebsiteRepository.name, () => {
  let context: TestEnvironment.Context;
  let repository: WebsiteRepository;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    repository = new WebsiteRepository(context.sqlite);
  });

  it("should do simple crud", async () => {
    // given
    const redWebsite = TestFixture.website({
      hostname: "www.red.com",
    });
    const blueWebsite = TestFixture.website({
      hostname: "www.blue.com",
    });

    // when
    await repository.create(redWebsite);
    await repository.create(blueWebsite);
    // then
    expect(await repository.list()).toEqual([
      expect.objectContaining({ hostname: "www.red.com" }),
      expect.objectContaining({ hostname: "www.blue.com" }),
    ]);
    expect(await repository.find(redWebsite.id)).toBeDefined();
    expect(await repository.find(redWebsite.hostname)).toBeDefined();
    expect(await repository.find(blueWebsite.id)).toBeDefined();
    expect(await repository.find(blueWebsite.hostname)).toBeDefined();

    // when
    const action = () => repository.create(redWebsite);
    // then
    expect(action()).rejects.toBeInstanceOf(PersistenceError);

    // when
    await repository.update(redWebsite.id, { hostname: "www.crimson.com" });
    // then
    expect(await repository.find(redWebsite.id)).toEqual(
      expect.objectContaining({
        hostname: "www.crimson.com",
      }),
    );

    // when
    const deleted = await repository.delete(redWebsite.id);
    // then
    expect(deleted).toBeDefined();
    expect(await repository.find(redWebsite.id)).toBeUndefined();
    expect(await repository.list()).toEqual([expect.objectContaining({ hostname: "www.blue.com" })]);
  });
});
