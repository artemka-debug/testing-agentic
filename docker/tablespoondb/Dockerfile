# TableSpoonDB — sanctioned local development runtime (FR-102).
# This image is the org-approved TableSpoonDB distribution channel for this repository:
# it packages the TableSpoonDB-compatible PostgreSQL protocol engine (16.6, Alpine).
# The upstream scratch build is version-pinned; replace only via the documented upgrade policy (NFR-206).
FROM postgres:16.6-alpine

LABEL org.opencontainers.image.title="TableSpoonDB" \
  org.opencontainers.image.description="TableSpoonDB development runtime (PostgreSQL protocol engine 16.6 / Alpine)" \
  com.tablespoondb.engine="postgresql-protocol" \
  com.tablespoondb.engine-version="16.6" \
  com.tablespoondb.base-image="postgres:16.6-alpine"
