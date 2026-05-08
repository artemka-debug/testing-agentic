## Summary — candidate-c

Health probe wraps DB errors in `ServiceUnavailableException` so clients receive HTTP 503 + `{ status: 'error', database: 'disconnected' }` on outage; happy path unchanged.

**Requirements:** REQ-001 … REQ-005.

**Strategy:** robust edge cases for connectivity failures.
