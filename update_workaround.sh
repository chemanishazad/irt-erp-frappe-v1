#!/bin/bash
# Workaround for bench update when using develop branch
# This script performs all update tasks without version checking

set -e

echo "=== Bench Update Workaround (for develop branch) ==="
echo ""

# Update requirements
echo "1. Updating requirements..."
bench setup requirements

# Build assets
echo ""
echo "2. Building assets..."
bench build --force

# Run migrations for all sites
echo ""
echo "3. Running migrations..."
for site in $(bench --site all list-apps 2>/dev/null | grep -v "^$" | head -1 | xargs -I {} bench --site {} list-sites 2>/dev/null || bench --site all list-sites 2>/dev/null | grep -v "^$"); do
    if [ -d "sites/$site" ]; then
        echo "Migrating site: $site"
        bench --site "$site" migrate || true
    fi
done

# Alternative: migrate specific site
# bench --site irt migrate

echo ""
echo "=== Update Complete ==="
echo ""
echo "Note: To pull updates from upstream, use:"
echo "  cd apps/frappe && git pull upstream develop"
echo "  cd ../erpnext && git pull upstream develop"
echo "  cd ../hrms && git pull upstream develop"

