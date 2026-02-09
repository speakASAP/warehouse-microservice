#!/bin/bash

# Script to pull latest changes from all git repositories
# Usage: ./pull-all-repos.sh

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find all git repositories
REPOS=$(find "$BASE_DIR" -maxdepth 2 -type d -name ".git" | sed 's|/.git$||' | sed "s|^$BASE_DIR/||" | sort)

echo "🔍 Found $(echo "$REPOS" | grep -c .) git repositories"
echo ""

for repo in $REPOS; do
    if [ -z "$repo" ]; then
        continue
    fi
    
    REPO_PATH="$BASE_DIR/$repo"
    
    echo "=========================================="
    echo "📁 Pulling: $repo"
    echo "=========================================="
    
    cd "$REPO_PATH"
    
    # Check if there's a remote configured
    if git remote | grep -q .; then
        # Get current branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        
        echo "📍 Current branch: $CURRENT_BRANCH"
        
        # Check if there are uncommitted changes
        if ! git diff --quiet || ! git diff --cached --quiet; then
            echo "⚠️  Uncommitted changes detected"
            echo "📋 Status:"
            git status --short
            echo ""
            echo "💡 Stashing changes before pull..."
            git stash push -m "Auto-stash before pull: $(date '+%Y-%m-%d %H:%M:%S')"
            STASHED=true
        else
            STASHED=false
        fi
        
        # Pull latest changes
        echo "⬇️  Pulling from remote..."
        if git pull; then
            echo "✅ Successfully pulled latest changes"
        else
            echo "⚠️  Pull failed or no changes to pull"
        fi
        
        # Restore stashed changes if any
        if [ "$STASHED" = true ]; then
            if git stash list | grep -q .; then
                echo "📦 Restoring stashed changes..."
                if git stash pop; then
                    echo "✅ Stashed changes restored"
                else
                    echo "⚠️  Conflict while restoring stashed changes - manual intervention needed"
                fi
            fi
        fi
    else
        echo "ℹ️  No remote configured - skipping pull"
    fi
    
    echo ""
done

echo "✅ Done pulling from all repositories"

