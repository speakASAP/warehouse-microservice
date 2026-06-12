#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

printf '%s\n' 'WAREHOUSE ORCHESTRATOR: define next goal'
printf '%s\n' ''
printf '%s\n' 'Next goal: none - WH-G1 through WH-G9 are complete'
printf '%s\n' 'Awaiting owner-approved next goal before coding'
printf '%s\n' 'State file: docs/IMPLEMENTATION_STATE.md'
printf '%s\n' ''
printf '%s\n' 'Required first command:'
printf '%s\n' "cd '$ROOT' && git status --short --branch"
