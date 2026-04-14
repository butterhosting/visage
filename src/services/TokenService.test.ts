import { Artifact } from "@/models/Artifact";
import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { TokenService } from "./TokenService";

describe(TokenService.name, () => {
  let context: TestEnvironment.Context;
  let service: TokenService;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    service = new TokenService(context.tokenRepository, context.websiteRepository, context.eventBus);
  });

  it("should throw an error if the website doesn't exist", async () => {
    // when
    const action = () => service.generate({ websites: ["abc123"] });
    // then
    expect(action()).rejects.toEqual(
      expect.objectContaining({
        problem: "TokenError::websites_not_found",
        details: {
          ids: ["abc123"],
        },
      }),
    );
  });

  it("supports a basic flow", async () => {
    // given
    const website = await context.websiteRepository.create(TestFixture.website({ hostname: "www.example.com" }));

    // when
    const token = await service.generate({ websites: [website.id] });
    // then
    expect(token.value).toBeTruthy();
    expect(await service.list()).toEqual([
      expect.objectContaining({
        id: token.id,
      }),
    ]);

    // when
    const valid = token.value!;
    const invalid = token.value!.split("").reverse().join("");
    // then
    expect(await service.validate(valid)).toEqual(
      expect.objectContaining({
        id: token.id,
      }),
    );
    expect(await service.validate(invalid)).toBeUndefined();

    // when
    await service.delete(token.id);
    // then
    expect(await service.validate(valid)).toBeUndefined();
    expect(await service.validate(invalid)).toBeUndefined();
    expect(await service.list()).toEqual([]);
  });
});
