#!/bin/bash

# Script to sync .env files only for projects that exist on each server.
# Gathers project lists from local, statex, and sgipreal; updates .env only where the project folder exists.

# Don't use set -e, we want to continue even if some copies fail

# Load configuration (support both repo root and scripts/ dir)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/env-sync-config.sh" ]; then
    source "$SCRIPT_DIR/env-sync-config.sh"
elif [ -f "$SCRIPT_DIR/scripts/env-sync-config.sh" ]; then
    source "$SCRIPT_DIR/scripts/env-sync-config.sh"
else
    # Fallback defaults
    LOCAL_BASE="/Users/sergiystashok/Documents/GitHub"
    STATEX_BASE="/home/statex"
    SGIPREAL_BASE="/home/sgipreal"
    STATEX_HOST="statex"
    SGIPREAL_HOST="sgipreal"
fi

LOCAL_BASE="${LOCAL_BASE}"
STATEX_BASE="${STATEX_BASE}"
SGIPREAL_BASE="${SGIPREAL_BASE}"
STATEX_SERVER="${STATEX_HOST}"
SGIPREAL_SERVER="${SGIPREAL_HOST}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Checking SSH connectivity..."
statex_ok=false
sgipreal_ok=false
ssh -o ConnectTimeout=5 "$STATEX_SERVER" "echo ok" >/dev/null 2>&1 && statex_ok=true
ssh -o ConnectTimeout=5 "$SGIPREAL_SERVER" "echo ok" >/dev/null 2>&1 && sgipreal_ok=true
[ "$statex_ok" = true ] && echo "  statex: reachable" || echo -e "  ${YELLOW}statex: unreachable (no sync to statex)${NC}"
[ "$sgipreal_ok" = true ] && echo "  sgipreal: reachable" || echo -e "  ${YELLOW}sgipreal: unreachable (no sync to sgipreal)${NC}"
echo ""

echo "Collecting project lists (only project folders that exist on each server)..."

# Projects that have .env on each server (for source / existence check)
LOCAL_ENVS=$(find "$LOCAL_BASE" -name ".env" -type f 2>/dev/null | grep -v node_modules | sed "s|$LOCAL_BASE/||" | sed "s|/.env$||" | sort)
STATEX_ENVS=""
SGIPREAL_ENVS=""
[ "$statex_ok" = true ] && STATEX_ENVS=$(ssh -o ConnectTimeout=10 "$STATEX_SERVER" "find $STATEX_BASE -name '.env' -type f 2>/dev/null | grep -v node_modules" 2>/dev/null | sed "s|$STATEX_BASE/||" | sed "s|/.env$||" | sort)
[ "$sgipreal_ok" = true ] && SGIPREAL_ENVS=$(ssh -o ConnectTimeout=10 "$SGIPREAL_SERVER" "find $SGIPREAL_BASE -name '.env' -type f 2>/dev/null | grep -v node_modules" 2>/dev/null | sed "s|$SGIPREAL_BASE/||" | sed "s|/.env$||" | sort)

# Project directories that exist on each server (folder present; may or may not have .env)
LOCAL_DIRS=$(find "$LOCAL_BASE" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sed "s|$LOCAL_BASE/||" | sort)
STATEX_DIRS=""
SGIPREAL_DIRS=""
if [ "$statex_ok" = true ]; then
    STATEX_DIRS=$(ssh -o ConnectTimeout=10 "$STATEX_SERVER" "find $STATEX_BASE -maxdepth 1 -mindepth 1 -type d 2>/dev/null" 2>/dev/null | sed "s|$STATEX_BASE/||" | sed 's|/$||' | sort)
    # Fallback: if dir list empty (e.g. find failed) but we have .env list, use that
    [ -z "$STATEX_DIRS" ] && [ -n "$STATEX_ENVS" ] && STATEX_DIRS="$STATEX_ENVS"
fi
if [ "$sgipreal_ok" = true ]; then
    SGIPREAL_DIRS=$(ssh -o ConnectTimeout=10 "$SGIPREAL_SERVER" "find $SGIPREAL_BASE -maxdepth 1 -mindepth 1 -type d 2>/dev/null" 2>/dev/null | sed "s|$SGIPREAL_BASE/||" | sed 's|/$||' | sort)
    [ -z "$SGIPREAL_DIRS" ] && [ -n "$SGIPREAL_ENVS" ] && SGIPREAL_DIRS="$SGIPREAL_ENVS"
fi

# Process only projects that exist (have folder) on at least one server
ALL_PROJECTS=$(echo -e "$LOCAL_DIRS\n$STATEX_DIRS\n$SGIPREAL_DIRS" | grep -v '^$' | sort -u)
echo "Local: $(echo "$LOCAL_DIRS" | wc -l | tr -d ' ') dirs | statex: $(echo "$STATEX_DIRS" | wc -l | tr -d ' ') | sgipreal: $(echo "$SGIPREAL_DIRS" | wc -l | tr -d ' ') dirs"
if [ "$statex_ok" = true ] && [ -z "$STATEX_DIRS" ]; then
    echo -e "${YELLOW}Warning: statex reachable but no project dirs found (check STATEX_BASE=$STATEX_BASE). No sync to statex.${NC}"
fi
if [ "$sgipreal_ok" = true ] && [ -z "$SGIPREAL_DIRS" ]; then
    echo -e "${YELLOW}Warning: sgipreal reachable but no project dirs found. No sync to sgipreal.${NC}"
fi
echo ""

# Function to copy .env file
copy_env() {
    local source_server=$1
    local dest_server=$2
    local project_path=$3
    local source_base=$4
    local dest_base=$5
    
    local source_file="$source_base/$project_path/.env"
    
    # Verify source exists
    if [ "$source_server" = "local" ]; then
        if [ ! -f "$source_file" ]; then
            return 1
        fi
    else
        if ! ssh "$source_server" "[ -f $source_file ]" 2>/dev/null; then
            return 1
        fi
    fi
    
    # Create directory on destination
    if [ "$dest_server" = "local" ]; then
        mkdir -p "$dest_base/$project_path"
        if [ "$source_server" = "local" ]; then
            cp "$source_file" "$dest_base/$project_path/.env" 2>/dev/null && return 0 || return 1
        else
            scp -q "$source_server:$source_file" "$dest_base/$project_path/.env" 2>/dev/null && return 0 || return 1
        fi
    else
        ssh "$dest_server" "mkdir -p $dest_base/$project_path" 2>/dev/null
        if [ "$source_server" = "local" ]; then
            scp -q "$source_file" "$dest_server:$dest_base/$project_path/.env" 2>/dev/null && return 0 || return 1
        else
            # Remote to remote: copy through local as intermediary
            local temp_file=$(mktemp)
            if scp -q "$source_server:$source_file" "$temp_file" 2>/dev/null; then
                scp -q "$temp_file" "$dest_server:$dest_base/$project_path/.env" 2>/dev/null
                local result=$?
                rm -f "$temp_file"
                return $result
            else
                rm -f "$temp_file"
                return 1
            fi
        fi
    fi
}

# Sync each project only to servers where this project exists (has folder)
for project in $ALL_PROJECTS; do
    # Where does this project folder exist?
    local_has_project=false
    statex_has_project=false
    sgipreal_has_project=false
    echo "$LOCAL_DIRS" | grep -q "^${project}$" && local_has_project=true
    echo "$STATEX_DIRS" | grep -q "^${project}$" && statex_has_project=true
    echo "$SGIPREAL_DIRS" | grep -q "^${project}$" && sgipreal_has_project=true

    # Skip if project exists on no server (should not happen)
    if [ "$local_has_project" = false ] && [ "$statex_has_project" = false ] && [ "$sgipreal_has_project" = false ]; then
        continue
    fi

    echo -e "${BLUE}Syncing: $project${NC}"

    # Where does .env already exist? (only check on servers that have this project)
    local_exists=false
    statex_exists=false
    sgipreal_exists=false
    [ "$local_has_project" = true ] && [ -f "$LOCAL_BASE/$project/.env" ] && local_exists=true
    [ "$statex_has_project" = true ] && ssh "$STATEX_SERVER" "[ -f $STATEX_BASE/$project/.env ]" 2>/dev/null && statex_exists=true
    [ "$sgipreal_has_project" = true ] && ssh "$SGIPREAL_SERVER" "[ -f $SGIPREAL_BASE/$project/.env ]" 2>/dev/null && sgipreal_exists=true

    # Determine source (prefer local, then statex, then sgipreal)
    source=""
    if [ "$local_exists" = true ]; then
        source="local"
        source_base="$LOCAL_BASE"
    elif [ "$statex_exists" = true ]; then
        source="$STATEX_SERVER"
        source_base="$STATEX_BASE"
    elif [ "$sgipreal_exists" = true ]; then
        source="$SGIPREAL_SERVER"
        source_base="$SGIPREAL_BASE"
    fi

    if [ -z "$source" ]; then
        echo -e "  ${YELLOW}⚠ No .env found on any server for $project${NC}"
        echo ""
        continue
    fi

    # Copy only to servers that have this project and are missing .env
    if [ "$local_has_project" = true ] && [ "$local_exists" = false ]; then
        echo -e "  ${GREEN}→ Copying to local${NC}"
        copy_env "$source" "local" "$project" "$source_base" "$LOCAL_BASE" || echo -e "    ${YELLOW}Failed${NC}"
    fi
    if [ "$statex_has_project" = true ] && [ "$statex_exists" = false ]; then
        echo -e "  ${GREEN}→ Copying to statex${NC}"
        copy_env "$source" "$STATEX_SERVER" "$project" "$source_base" "$STATEX_BASE" || echo -e "    ${YELLOW}Failed${NC}"
    fi
    if [ "$sgipreal_has_project" = true ] && [ "$sgipreal_exists" = false ]; then
        echo -e "  ${GREEN}→ Copying to sgipreal${NC}"
        copy_env "$source" "$SGIPREAL_SERVER" "$project" "$source_base" "$SGIPREAL_BASE" || echo -e "    ${YELLOW}Failed${NC}"
    fi

    if [ "$local_has_project" = true ] && [ "$local_exists" = true ] && \
       [ "$statex_has_project" = true ] && [ "$statex_exists" = true ] && \
       [ "$sgipreal_has_project" = true ] && [ "$sgipreal_exists" = true ]; then
        echo -e "  ${GREEN}✓ .env present everywhere this project exists${NC}"
    elif ([ "$local_has_project" = false ] || [ "$local_exists" = true ]) && \
         ([ "$statex_has_project" = false ] || [ "$statex_exists" = true ]) && \
         ([ "$sgipreal_has_project" = false ] || [ "$sgipreal_exists" = true ]); then
        echo -e "  ${GREEN}✓ No copy needed${NC}"
    fi

    echo ""
done

echo -e "${GREEN}Sync complete!${NC}"
