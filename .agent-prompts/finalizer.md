# Agent prompt template — PR finalizer

Finalize **`task `{TASK_ID}`** using verifier recommendation **`{WINNER_ID}`**.

Checklist:

1. Confirm **`coverage-matrix.md`** shows **`must`** items **`covered|waived`** legitimately.
Copy **`templates/pr-body-template.md`** (when syncing this package) into `.agent-workflows/<task-id>/pr/body.md`.
3. Merge or transplant **`{WINNER_ID}`** onto **`final`** / `{PR_BRANCH}` per repo maintainer instructions documented alongside **`state.json`** notes.
4. Run mandatory final verification bundle (`lint`, scoped tests minimum).
5. `git push -u origin HEAD` then **`gh pr create`** exactly once unless recovering failure documented under **`logs/`**.
6. Save PR URL to **`pr/url.txt`** and flip **`state.json`** → `pr-created`.

Do not bypass **`before-pr-create` hooks**.
