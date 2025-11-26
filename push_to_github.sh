#!/bin/bash
# Script to push to GitHub using PAT token

set -e

BENCH_DIR="/home/manish/Documents/irt/irt-erp-v3/frappe-bench"
cd "$BENCH_DIR"

# Get token from environment variable or .git-credentials file
if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f "$HOME/.git-credentials" ]; then
        # Extract token from git credentials file
        TOKEN=$(grep -oP '(?<=github.com:)[^@]+' "$HOME/.git-credentials" | head -1)
    else
        echo "❌ Error: GITHUB_TOKEN environment variable not set"
        echo ""
        echo "Set it using:"
        echo "  export GITHUB_TOKEN='your_token_here'"
        echo ""
        echo "Or create a token file at ~/.git-credentials with format:"
        echo "  https://username:token@github.com"
        exit 1
    fi
else
    TOKEN="$GITHUB_TOKEN"
fi

REPO_OWNER="chemanishazad"
REPO_NAME="irt-erp-frappe-v1"
BRANCH="main"

echo "============================================================"
echo "GitHub Push Script"
echo "============================================================"
echo ""

# Check if repository exists
echo "Checking if repository exists..."
REPO_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME")

if [ "$REPO_EXISTS" = "404" ]; then
    echo "⚠ Repository doesn't exist. Creating it now..."
    curl -X POST \
        -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"private\":true}" || {
        echo "❌ Failed to create repository. You may need to create it manually on GitHub."
        exit 1
    }
    echo "✓ Repository created"
    sleep 2
elif [ "$REPO_EXISTS" = "200" ]; then
    echo "✓ Repository exists"
else
    echo "⚠ Could not verify repository status (HTTP $REPO_EXISTS)"
fi
echo ""

# Configure remote URL with token
echo "Configuring git remote..."
git remote set-url origin https://${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git
echo "✓ Remote configured"
echo ""

# Push to GitHub (force push if commit was amended)
echo "Pushing to GitHub..."
if git push -f -u origin $BRANCH; then
    echo ""
    echo "============================================================"
    echo "✓ Successfully pushed to GitHub!"
    echo "============================================================"
    echo "Repository: https://github.com/$REPO_OWNER/$REPO_NAME"
    echo "Branch: $BRANCH"
    echo ""
else
    echo ""
    echo "============================================================"
    echo "❌ Push failed"
    echo "============================================================"
    echo ""
    echo "Possible issues:"
    echo "1. Token may not have 'repo' scope - check at: https://github.com/settings/tokens"
    echo "2. Repository permissions issue"
    echo "3. Token may be expired or invalid"
    echo ""
    echo "To fix:"
    echo "- Create a new token with 'repo' scope at: https://github.com/settings/tokens"
    echo "- Or check repository permissions at: https://github.com/$REPO_OWNER/$REPO_NAME/settings"
    exit 1
fi

