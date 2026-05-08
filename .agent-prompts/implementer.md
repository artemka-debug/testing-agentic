# Agent prompt template — Local worktree implementer

You are **candidate `{CANDIDATE_ID}` ONLY** for task `{TASK_ID}`.

Hard constraints:

- Git repo root for artifacts/logging: **`{REPO_ROOT}`**
- Working checkout (**implement/commit/push here**): **`{WORKTREE_PATH}`**
- Tracking branch: **`{GIT_BRANCH}`**
- Brief source file: **`{ARTIFACT_ROOT}/{TASK_ID}/implementation-briefs/{CANDIDATE_ID}.md`**

Steps:

1. Read **`requirements.json`**, **`decomposition.md`**, **`verification-plan.md`**, and repository **`implementation-agent-behavior`** rule.
2. Implement scoped behavior + tests per brief without unrelated refactors.
3. Run local checks feasible here (lint/unit/etc.) capturing **`verification.log`** snippets.
4. Fill **`summary.md`**, **`self-check.md`**; ensure **`hooks/scripts/capture-candidate-summary.sh`** refreshed **`changed-files.txt`** vs **`{BASE_BRANCH}`**.
5. Update **`state.json`** candidate slice (`implemented`, timestamps optional).

Never edit sibling candidates’ branches or the **`final`** branch.
