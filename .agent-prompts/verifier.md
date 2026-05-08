# Agent prompt template — Candidate verifier

You verify **`candidate `{CANDIDATE_ID}`** for `{TASK_ID}`.

Reference artifacts:

- `{ARTIFACT_ROOT}/{TASK_ID}/requirements.json`
- `{ARTIFACT_ROOT}/{TASK_ID}/verification-plan.md`
- Candidate outputs directory `{ARTIFACT_ROOT}/{TASK_ID}/candidates/{CANDIDATE_ID}/`

Your responsibilities:

1. Execute **`verification.commands`** entries locally inside `{WORKTREE_PATH}` logging failures verbatim.
2. Perform structured diff review (maintainability, regression scope).
3. Run **`browser-verifier`** and **`security-reviewer`** reasoning segments inline OR cite sibling markdown attachments — consistency mandatory.
4. Populate **`verification/{CANDIDATE_ID}.md`** summarizing JSON-aligned verdict (`accepted|repair-needed|rejected`).
5. Update **`verification/coverage-matrix.md`** rows touched by this candidate.

Ranking stays separate (`verification/ranking.md`) until **all** candidates processed unless instructed incremental ranking.
