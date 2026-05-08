# Implementation brief — candidate-b (test-first)

- Same runtime behavior as baseline; expand **unit** tests:
  - `AppModule` shallow compile test with `TypeOrmModule` overridden by empty module or dynamic mock (avoid real DB in unit tier).
  - Additional `HealthController` edge case: ensure `query` rejects → expect rejection (simulated DB failure).
- Keep e2e identical in intent to candidate-a.
