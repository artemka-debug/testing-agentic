# Requirements — gh-1-basic-application-setup

## Overview

Establish a NestJS codebase with Docker Compose–managed PostgreSQL, OpenAPI documentation, a verifiable database connection, and Jest-based integration e2e tests aligned with the GitHub issue.

## Non-functional

- Use environment variables for DB host, port, user, password, database name.
- Keep local-only workflow: runnable on developer machine with `pnpm` + Docker.

## REQ mapping (summary)

| ID       | Priority | Summary                                      |
|----------|----------|----------------------------------------------|
| REQ-001  | must     | NestJS scaffold + build/start                |
| REQ-002  | must     | OpenAPI / Swagger surface                    |
| REQ-003  | must     | Docker Compose PostgreSQL                    |
| REQ-004  | must     | App connects to DB + health signal         |
| REQ-005  | must     | Integration / e2e tests                    |
| REQ-006  | should   | Security review + audit note                 |

## Open questions

None blocking; issue text is sufficient for an initial scaffold.
