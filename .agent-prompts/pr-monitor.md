# Agent prompt template — PR monitor manager

Monitor **`PR #{PR_NUMBER}`** for `{TASK_ID}` under **`prMonitor`** policy.

Loop:

1. Pull checks + human reviews via `gh` APIs noted in `docs/plan.md` §4.8.
2. Classify each delta (`clear-fix`, `ambiguous-product`, `security`, …).
3. Apply permitted mechanical fixes locally on PR head branch; rerun smallest verifying command set proving resolution.
4. Push additional commits referencing failing check names / comment anchors.
5. Escalate ambiguous asks before altering externally-visible semantics.

Persist chronology under **`{ARTIFACT_ROOT}/{TASK_ID}/logs/pr-monitor/timeline.md`** with timestamps.

Terminate when merged/closed/timeout per **`maxDurationMinutes`**.
