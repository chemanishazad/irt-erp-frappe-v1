#!/bin/bash
# Fix bench update to work with develop branch
# This script creates git aliases so bench update works correctly

set -e

echo "=== Fixing bench update for develop branch ==="
echo ""

# For each app, ensure develop branch is set up correctly
for app in frappe erpnext hrms; do
    if [ -d "apps/$app" ]; then
        echo "Fixing $app..."
        cd "apps/$app"
        
        # Ensure we're on develop branch
        if ! git rev-parse --verify develop >/dev/null 2>&1; then
            git checkout -b develop 2>/dev/null || git checkout develop
        fi
        
        # Set upstream tracking
        git branch --set-upstream-to=upstream/develop develop 2>/dev/null || true
        
        # Create a local main branch that tracks develop (for bench compatibility)
        if ! git rev-parse --verify main >/dev/null 2>&1; then
            git branch main develop 2>/dev/null || true
        fi
        git branch --set-upstream-to=upstream/develop main 2>/dev/null || true
        
        # Update the reference so upstream/main points to upstream/develop
        if git rev-parse --verify upstream/develop >/dev/null 2>&1; then
            git update-ref refs/remotes/upstream/main $(git rev-parse upstream/develop) 2>/dev/null || true
        fi
        
        cd ../..
        echo "✓ $app fixed"
    fi
done

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Now you can use: bench update --no-backup"
echo "Or use: bench update --no-backup --patch (to skip pull and only run migrations)"

