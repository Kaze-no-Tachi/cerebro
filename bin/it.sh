#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose -f docker-compose.test.yml up -d --wait

CEREBRO_IT=1 sbt 'testOnly *IT'

# Tear down only on success; leave containers running for a failed run so the
# developer can `docker logs` to inspect what went wrong.
docker compose -f docker-compose.test.yml down
