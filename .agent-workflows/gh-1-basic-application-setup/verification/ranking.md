# Ranking — gh-1-basic-application-setup

1. **candidate-c** — Maps database outages to `503 Service Unavailable` with stable JSON body; best operator UX and client semantics while keeping e2e green.
2. **candidate-b** — Additional unit coverage (raw error propagation) without HTTP mapping; good for test-first narrative.
3. **candidate-a** — Smallest test surface; acceptable baseline, fewer failure-mode assertions.

Regression risk: low across all three (identical dependency tree and e2e expectations on the happy path).
