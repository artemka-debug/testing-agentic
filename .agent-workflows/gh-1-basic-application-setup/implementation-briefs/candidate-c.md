# Implementation brief — candidate-c (robust edge cases)

- Add `validateEnv()` (or `Joi`/`class-validator` on a small env DTO) so missing critical DB fields fail fast in non-test contexts.
- Health endpoint: wrap DB query; on failure return 503 with `{ status: 'error', database: 'disconnected' }` (e2e still expects success path when DB up — add unit test for failure path).
- Document behavior in README.
