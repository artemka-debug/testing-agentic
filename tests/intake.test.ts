import { beforeEach, describe, expect, it, vi } from "vitest";
import { intakeGithubIssue } from "../src/github/intake.js";
import { runGhIssueViewJson } from "../src/github/run-gh-issue-view.js";

vi.mock("../src/github/run-gh-issue-view.js", () => ({
  runGhIssueViewJson: vi.fn(),
}));

describe("intakeGithubIssue", () => {
  beforeEach(() => {
    vi.mocked(runGhIssueViewJson).mockReset();
  });

  it("does not mention unknown JSON fields when gh exits non-zero (AC-004)", async () => {
    vi.mocked(runGhIssueViewJson).mockResolvedValue({
      stdout: "",
      stderr: "GraphQL: Could not resolve to an issue or pull request",
      exitCode: 1,
    });

    const res = await intakeGithubIssue({
      repo: "artemka-debug/testing-agentic",
      issueNumber: 999999,
    });

    expect(res.ok).toBe(false);
    if (res.ok) {
      throw new Error("expected failure");
    }
    expect(res.error.kind).toBe("business");
    expect(res.userMessage.toLowerCase()).not.toContain("unknown");
    expect(res.userMessage.toLowerCase()).not.toContain("json field");
  });

  it("parses successful gh stdout even with extra top-level keys (AC-003 / FR-004)", async () => {
    vi.mocked(runGhIssueViewJson).mockResolvedValue({
      stdout: JSON.stringify({
        number: 1,
        title: "t",
        futureGithubField: { hello: "world" },
      }),
      stderr: "",
      exitCode: 0,
    });

    const res = await intakeGithubIssue({ repo: "o/r", issueNumber: 1 });
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(`expected success ${res.userMessage}`);
    }
    expect(res.issue.number).toBe(1);
  });
});
