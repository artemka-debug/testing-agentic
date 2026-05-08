# Agent prompt template — Security review slice

Perform **`security-reviewer`** pass against **`candidate `{CANDIDATE_ID}`** diff & dependency deltas.

Deliver **`## Security review` subsection inside `verification/{CANDIDATE_ID}.md`** containing:

- `Status` (`pass|fail|needs-review`)
- Bullet findings with severity + remediation paths referencing concrete paths
  
Honor **`security.dependencyAuditCommand`** output if configured — summarize only actionable signal.

Escalate human waiver needs explicitly — agents never silently downgrade **`blocking`** items.
