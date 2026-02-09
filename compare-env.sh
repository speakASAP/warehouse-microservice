#!/bin/bash

# Wrapper: compare .env files across local, statex, and sgipreal.
# Delegates to scripts/compare-env.sh (single implementation).
# Usage: ./compare-env.sh [project-name]
# Example: ./compare-env.sh crypto-ai-agent
# Example: ./compare-env.sh all

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/compare-env.sh"
if [ ! -f "$SCRIPT" ]; then
    echo "Error: $SCRIPT not found" >&2
    exit 1
fi
exec "$SCRIPT" "$@"
