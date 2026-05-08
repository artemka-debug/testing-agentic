export type NormalizedClosingPrRef = {
  id?: string;
  number?: number;
  url?: string;
  repository?: unknown;
};

export type NormalizedGithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string | null;
  url: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  labels: unknown[];
  assignees: unknown[];
  comments: unknown[];
  closingPullRequests: NormalizedClosingPrRef[];
};
