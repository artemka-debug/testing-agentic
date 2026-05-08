---
name: security-reviewer
description: >-
  Structured security review for authz, injection, secrets, dependency/supply-chain, unsafe automation,
  and logging hygiene — aligned with workflow gates before PR finalization (local workflow).
---

# Security reviewer

## When to use

- Any candidate touches auth/session, permissions, parsing of untrusted input, networking, file IO, subprocess/spawn, serialization, payments, PII, or adds dependencies.
- **`security.requireReview`** is **`true`** in **`.cursor-agent-workflow.yaml`** (default).
- Final verifier stage needs **`security.status`** ∈ {`pass`,`fail`,`needs-review`}.

## Preconditions

- Internalize **`security-review-behavior`** rule file copied into consumer `.cursor/rules/`.
- Pull dependency diff from lockfiles when present.
- Never paste live secrets into artifacts — redact aggressively.

## Review checklist (from **`docs/plan.md`** §12)

Work breadth-first, then depth where signals appear:

1. **Identity / authorization** — role checks, object ownership, tenant boundaries, IDOR patterns.
2. **Injection & XSS** — HTML/JS interpolation, SQL/CLI templates, SSRF exfil paths.
3. **Secrets & crypto** — hard-coded tokens, weak randomness, misuse of hashes vs encryption.
4. **Automation hazards** — shell concatenation, path traversal, dynamic `require`.
5. **Data exposure** — verbose errors/logs, client-visible payloads, PII retention.
6. **Supply chain** — new packages, version pinning integrity, install scripts.
7. **Operational limits** — rate limiting, bulk deletes, migration destructive ops.

## Dependency audit command

When **`security.dependencyAuditCommand`** is set (example `pnpm audit`), run in candidate worktree and summarize actionable HIGH/CRITICAL items with file references.

## Severity rubric

| Severity | Meaning |
|----------|---------|
| **blocking** | Exploitable or probable severe compromise — fails gate when **`security.blockOnHighSeverity`** |
| **major** | Likely bug-class risk / privacy violation absent exploit PoC |
| **minor** | Defense-in-depth gaps |
| **informational** | Hardening suggestions |

Map each finding to **`REQ-*`** when tied to acceptance criteria; otherwise mark **`platform`** scope.

## Output shape

Add ```markdown
## Security review (<candidate-id>)
Status: pass | fail | needs-review
Findings:
- [blocking] <short title> — <files> — <remediation>
```

Embed inside **`verification/<candidate-id>.md`** **and** consolidate cross-candidate notes in **`verification/security-summary.md`** when helpful.

## Gates & waivers

- Blocking findings → candidate cannot be promoted unless fixed **or** documented human waiver when **`security.requireHumanWaiverForHighSeverity`** permits (mirror operator decision in **`coverage-matrix.md`**).

## Escalation

- Suspected live credential in git history → stop; operator rotates credential outside automation scope.
- Legal/compliance questions → handoff to human; agents recommend conservative posture only.
