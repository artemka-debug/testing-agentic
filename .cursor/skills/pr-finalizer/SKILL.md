---
name: pr-finalizer
description: >-
  Select winning candidate branch, ensure final verification + traceability gates, assemble PR body,
  push branch, and open GitHub PR via gh CLI following local-only constraints.
---

# PR finalizer

## When to use

- **`verification/final-recommendation.md`** names a **`recommendedWinner`** **or** human directed override with rationale logged.
- No blocking verifier / security rows remain for **`must`** requirements unless waived transparently.
- Repository remote permissions allow push + `gh pr create`.

## Preconditions

- **`before-pr-create`** hooks satisfied (`validate-traceability.js`, `check-no-secrets.sh`).
- **`github-task-success-definition`** — success artifact is merged-ready GitHub PR.
- **`workflow-local-only`** — run **`gh`** locally with authenticated operator credentials.

## Selection & branch hygiene

1. Confirm **`state.json`** **`candidate-selected`** transition recorded with winner id.
2. Ensure **`final`** branch naming **`docs/state-layout.md`** (`<branchPrefix>/<middle>/final`) is unused or reset per operator policy.
3. Prefer merge strategy documented in **`docs/plan.md`** §4.7:

   ```bash
   git checkout -b <pr-branch> <base>
   git merge --squash <winner-branch>   # or cherry-pick series — choose consistent repo policy
   git commit -m "<short imperative>"
   ```

   Adapt when squash would drop required history — consult maintainer guidelines.

4. Run **`verification.commands`** subset flagged **`final`** in **`verification-plan.md`** (at minimum lint + tests touched).

## PR body assembly

1. Start from **`templates/pr-body-template.md`** in this cursor-native package when syncing templates; save filled output as `.agent-workflows/<task-id>/pr/body.md` in the consumer repo.
2. Fill Summary, Linked issue line (**Closes #** when **`github.linkIssue`**), Requirements Coverage bullets mapping **`REQ-*`** → evidence paths.
3. Paste condensed verification table + security + PO acceptance summaries.
4. Attach artifact references relative to **`.agent-workflows/<task-id>/`** when reviewers should inspect logs locally.

## GitHub PR creation

Preferred (`github.useGhCli`):

```bash
git push -u origin HEAD
gh pr create --title "<title>" --body-file .agent-workflows/<task-id>/pr/body.md ${DRAFT_FLAG}
```

Set **`DRAFT_FLAG=--draft`** when **`github.draftPr`** is **`true`**.

Persist URL:

```bash
printf '%s\n' "$PR_URL" > .agent-workflows/<task-id>/pr/url.txt
```

Update **`state.json`** **`status`** → **`pr-created`**.

## Failure handling

- Push rejected → rebase/fast-forward per maintainer policy; never `--force` shared branches without approval.
- `gh pr create` fails → capture stderr under **`logs/`**, backoff once after fixing title/body validation errors.

## Escalation

- Merge conflicts vs **`base`** → pause for human resolution with backup branches tagged.
- Traceability script fails → **do not** waive silently; fix **`coverage-matrix.md`** or requirements JSON.
