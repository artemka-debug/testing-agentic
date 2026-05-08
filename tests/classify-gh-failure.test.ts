import { describe, expect, it } from "vitest";
import { classifyGhFailure } from "../src/github/classify-gh-failure.js";

describe("classifyGhFailure", () => {
  it("classifies missing issue GraphQL errors as business", () => {
    expect(
      classifyGhFailure(
        "GraphQL: Could not resolve to an issue or pull request with the number of 99999999.",
        "",
      ),
    ).toBe("business");
  });

  it("classifies unknown failures as transport by default", () => {
    expect(classifyGhFailure("some network glitch", "")).toBe("transport");
  });
});
