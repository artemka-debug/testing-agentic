import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GhIssueViewJsonField } from "./gh-issue-fields.js";
import { GH_ISSUE_VIEW_JSON_FIELDS } from "./gh-issue-fields.js";

const execFileAsync = promisify(execFile);

export type RunGhIssueViewArgs = {
  repo: string;
  issueNumber: number;
  ghPath?: string;
  /** Override fields (tests); default is {@link GH_ISSUE_VIEW_JSON_FIELDS}. */
  jsonFields?: readonly GhIssueViewJsonField[];
};

export type GhProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/**
 * Runs the supported `gh issue view --json …` invocation for JSON intake.
 */
export async function runGhIssueViewJson(args: RunGhIssueViewArgs): Promise<GhProcessResult> {
  const gh = args.ghPath ?? "gh";
  const fields = (args.jsonFields ?? GH_ISSUE_VIEW_JSON_FIELDS).join(",");

  try {
    const { stdout, stderr } = await execFileAsync(
      gh,
      ["issue", "view", String(args.issueNumber), "--repo", args.repo, "--json", fields],
      {
        maxBuffer: 20 * 1024 * 1024,
        encoding: "utf8",
      },
    );
    return { stdout, stderr: stderr ?? "", exitCode: 0 };
  } catch (err: unknown) {
    const e = err as {
      stdout?: string;
      stderr?: string;
      code?: number;
      message?: string;
    };
    const stderr = typeof e.stderr === "string" ? e.stderr : "";
    const stdout = typeof e.stdout === "string" ? e.stdout : "";
    const code = typeof e.code === "number" ? e.code : 1;
    return { stdout, stderr, exitCode: code };
  }
}
