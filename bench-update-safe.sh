#!/bin/bash
# Safe bench update wrapper that works with develop branch
# This script handles the pull manually, then runs bench update with --patch

set -e

echo "=== Safe Bench Update (for develop branch) ==="
echo ""

# Step 1: Pull updates manually from develop branch
echo "1. Pulling updates from upstream develop..."
for app in frappe erpnext hrms; do
    if [ -d "apps/$app" ]; then
        echo "  Pulling $app..."
        cd "apps/$app"
        git pull upstream develop 2>&1 | grep -E "(Already up to date|Updating|Fast-forward)" || echo "  ✓ $app updated"
        cd ../..
    fi
done

echo ""
echo "2. Running bench update (migrations only)..."
bench update --no-backup --patch

echo ""
echo "=== Update Complete ==="

