#!/usr/bin/env bash

# Only top-level flows are standalone tests; subflows are invoked via runFlow.
# Retry each flow up to twice to absorb emulator flakes (slow boots, ANRs).
overall=0
max_attempts=3
for flow in .maestro/*.yaml; do
  passed=0
  for attempt in $(seq 1 $max_attempts); do
    echo "::group::maestro $flow (attempt $attempt/$max_attempts)"
    if maestro test "$flow"; then
      echo "::endgroup::"
      passed=1
      break
    fi
    echo "::endgroup::"
    if [ "$attempt" -lt "$max_attempts" ]; then
      echo "::warning::$flow failed on attempt $attempt — retrying"
    fi
  done
  if [ "$passed" -ne 1 ]; then
    echo "::error::$flow failed after $max_attempts attempts"
    overall=1
  fi
done
exit $overall
