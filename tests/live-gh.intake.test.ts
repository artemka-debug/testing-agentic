import { describe, expect, it } from "vitest";
import { intakeGithubIssue } from "../src/github/intake.js";

const live = process.env.GITHUB_INTAKE_LIVE === "1";

describe.skipIf(!live)("live gh: artemka-debug/testing-agentic#1", () => {
  it("returns normalized issue intake (AC-001)", async () => {
    const res = await intakeGithubIssue({
      repo: "artemka-debug/testing-agentic",
      issueNumber: 1,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(res.userMessage);
    }
    expect(res.issue.number).toBe(1);
    expect(res.issue.closingPullRequests.length).toBeGreaterThanOrEqual(0);
  });
});
