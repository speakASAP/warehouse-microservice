#!/bin/bash

# Script to check all git repositories, commit uncommitted changes, and push
# Usage: ./check-and-commit-all-repos.sh

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
    echo "📁 Checking: $repo"
    echo "=========================================="
    
    cd "$REPO_PATH"
    
    # Check if there are uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "⚠️  Uncommitted changes found"
        
        # Show status
        git status --short
        
        # Stage all changes
        echo "📝 Staging all changes..."
        git add -A
        
        # Create commit message with timestamp
        COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S') - Uncommitted changes"
        
        # Check if there are staged changes
        if git diff --cached --quiet; then
            echo "ℹ️  No changes to commit after staging"
        else
            echo "💾 Committing changes..."
            git commit -m "$COMMIT_MSG" || echo "⚠️  Commit failed or nothing to commit"
        fi
    else
        echo "✅ No uncommitted changes"
    fi
    
    # Check if there are commits to push
    if git rev-parse --abbrev-ref @{u} > /dev/null 2>&1; then
        LOCAL=$(git rev-parse @)
        REMOTE=$(git rev-parse @{u})
        BASE=$(git merge-base @ @{u})
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            echo "📤 Pushing to remote..."
            git push || echo "⚠️  Push failed"
        else
            echo "✅ Already up to date with remote"
        fi
    else
        echo "ℹ️  No remote tracking branch configured"
    fi
    
    echo ""
done

echo "✅ Done checking all repositories"
