#!/bin/bash
# Fix bench update pull to work with develop branch
# This creates git hooks that redirect main to develop

set -e

echo "=== Fixing bench update pull for develop branch ==="
echo ""

for app in frappe erpnext hrms; do
    if [ -d "apps/$app" ]; then
        echo "Fixing $app pull..."
        cd "apps/$app"
        
        # Create a git hook that intercepts pull commands
        mkdir -p .git/hooks
        
        # Create a post-checkout hook that ensures main tracks develop
        cat > .git/hooks/post-checkout << 'HOOK_EOF'
#!/bin/bash
# Auto-update main branch to match develop
if [ "$3" = "1" ]; then  # Only on branch checkout
    if git rev-parse --verify develop >/dev/null 2>&1; then
        git update-ref refs/heads/main $(git rev-parse develop) 2>/dev/null || true
    fi
fi
HOOK_EOF
        
        chmod +x .git/hooks/post-checkout
        
        # Also create a wrapper script approach - set git config
        git config pull.rebase false
        git config branch.main.remote upstream
        git config branch.main.merge refs/heads/develop
        
        # Ensure main branch exists and points to develop
        if git rev-parse --verify develop >/dev/null 2>&1; then
            git update-ref refs/heads/main $(git rev-parse develop) 2>/dev/null || true
            git branch --set-upstream-to=upstream/develop main 2>/dev/null || true
        fi
        
        cd ../..
        echo "✓ $app pull fixed"
    fi
done

echo ""
echo "=== Alternative: Use bench update with --patch flag ==="
echo "bench update --no-backup --patch  (skips pull, only runs migrations)"
echo ""
echo "Or pull manually:"
echo "  cd apps/frappe && git pull upstream develop"
echo "  cd ../erpnext && git pull upstream develop"
echo "  cd ../hrms && git pull upstream develop"

