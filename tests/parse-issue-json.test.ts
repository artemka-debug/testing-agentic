import { describe, expect, it } from "vitest";
import {
  parseGithubIssueJsonPayload,
  payloadTopLevelKeys,
} from "../src/github/parse-issue-json.js";

describe("parseGithubIssueJsonPayload", () => {
  it("maps closedByPullRequestsReferences into normalized closing PR refs (TEST-001)", () => {
    const raw = JSON.stringify({
      number: 1,
      title: "Basic application setup",
      closedByPullRequestsReferences: [
        {
          id: "PR_x",
          number: 3,
          url: "https://github.com/artemka-debug/testing-agentic/pull/3",
          repository: {
            name: "testing-agentic",
            owner: { login: "artemka-debug" },
          },
        },
      ],
    });

    const res = parseGithubIssueJsonPayload(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.value.closingPullRequests).toHaveLength(1);
    expect(res.value.closingPullRequests[0]?.number).toBe(3);
    expect(res.value.closingPullRequests[0]?.url).toContain("/pull/3");
  });

  it("accepts legacy closingPullRequests without failing (TEST-002 / issue #1 regression)", () => {
    const raw = JSON.stringify({
      number: 1,
      title: "t",
      closingPullRequests: [
        { id: "PR_y", number: 9, url: "https://example.test/pr/9" },
      ],
    });

    const res = parseGithubIssueJsonPayload(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.value.closingPullRequests[0]?.number).toBe(9);
  });

  it("prefers closedByPullRequestsReferences over closingPullRequests when both exist", () => {
    const raw = JSON.stringify({
      number: 1,
      title: "t",
      closedByPullRequestsReferences: [{ id: "a", number: 1, url: "https://a" }],
      closingPullRequests: [{ id: "b", number: 2, url: "https://b" }],
    });

    const res = parseGithubIssueJsonPayload(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.value.closingPullRequests[0]?.number).toBe(1);
  });

  it("issue #1 regression: closingPullRequests shaped payload does not trip unknown-field validation (TEST-004)", () => {
    const raw = JSON.stringify({
      assignees: [],
      author: { login: "u" },
      body: "hello",
      closingPullRequests: [],
      comments: [],
      labels: [],
      number: 1,
      state: "CLOSED",
      title: "t",
      url: "https://github.com/o/r/issues/1",
      surpriseTopLevel: true,
    });

    const res = parseGithubIssueJsonPayload(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(payloadTopLevelKeys(JSON.parse(raw)).length).toBeGreaterThan(8);
  });
});
