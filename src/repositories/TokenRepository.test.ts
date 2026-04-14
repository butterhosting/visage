import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { PersistenceError } from "./error/PersistenceError";
import { TokenRepository } from "./TokenRepository";

describe(TokenRepository.name, () => {
  let context: TestEnvironment.Context;
  let repository: TokenRepository;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    repository = new TokenRepository(context.sqlite);
  });

  it("should do simple crud", async () => {
    // given
    const websiteA = TestFixture.website({ hostname: "a.com" });
    const websiteB = TestFixture.website({ hostname: "b.com" });
    const tokenWildcard = TestFixture.token({ websiteIds: "*" });
    const tokenScoped = TestFixture.token({ websiteIds: [websiteA.id, websiteB.id] });

    // when
    await repository.create(tokenWildcard);
    await repository.create(tokenScoped);
    // then
    expect(await repository.list()).toHaveLength(2);
    expect(await repository.find(tokenWildcard.id)).toEqual(expect.objectContaining({ websiteIds: "*" }));
    expect(await repository.find(tokenScoped.id)).toEqual(expect.objectContaining({ websiteIds: [websiteA.id, websiteB.id] }));

    // when
    const action = () => repository.create(tokenWildcard);
    // then
    expect(action()).rejects.toBeInstanceOf(PersistenceError);

    // when
    const updated = await repository.updateUsage(tokenWildcard.id);
    // then
    expect(updated).toBeDefined();
    expect(updated?.lastUsed).toBeDefined();

    // when
    await repository.updateAllByRemovingWebsite(websiteA.id);
    // then
    expect(await repository.find(tokenScoped.id)).toEqual(
      expect.objectContaining({
        websiteIds: [websiteB.id],
      }),
    );
    expect(await repository.find(tokenWildcard.id)).toEqual(
      expect.objectContaining({
        websiteIds: "*",
      }),
    );

    // when
    await repository.updateAllByRemovingWebsite(websiteB.id);
    // then
    expect(await repository.find(tokenScoped.id)).toBeUndefined();
    expect(await repository.list()).toEqual([
      expect.objectContaining({
        websiteIds: "*",
      }),
    ]);

    // when
    const deleted = await repository.delete(tokenWildcard.id);
    // then
    expect(deleted).toBeDefined();
    expect(await repository.find(tokenWildcard.id)).toBeUndefined();
    expect(await repository.list()).toHaveLength(0);
  });
});
