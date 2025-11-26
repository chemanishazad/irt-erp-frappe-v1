#!/bin/bash
# Script to set up SSH for GitHub and push

set -e

BENCH_DIR="/home/manish/Documents/irt/irt-erp-v3/frappe-bench"
cd "$BENCH_DIR"

REPO_OWNER="che-manish"
REPO_NAME="irt-erp-v1"
BRANCH="main"

echo "============================================================"
echo "GitHub SSH Setup"
echo "============================================================"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "Creating new SSH key..."
    ssh-keygen -t ed25519 -C "manikandan.r@bontonsoftwares.in" -f ~/.ssh/id_ed25519 -N "" || {
        echo "Using RSA instead..."
        ssh-keygen -t rsa -b 4096 -C "manikandan.r@bontonsoftwares.in" -f ~/.ssh/id_rsa -N ""
    }
    echo "✓ SSH key created"
else
    echo "✓ SSH key already exists"
fi
echo ""

# Display public key
if [ -f ~/.ssh/id_ed25519.pub ]; then
    KEY_FILE=~/.ssh/id_ed25519.pub
elif [ -f ~/.ssh/id_rsa.pub ]; then
    KEY_FILE=~/.ssh/id_rsa.pub
fi

echo "============================================================"
echo "Your SSH Public Key:"
echo "============================================================"
cat "$KEY_FILE"
echo ""
echo "============================================================"
echo ""
echo "⚠ ACTION REQUIRED:"
echo "1. Copy the SSH key above (entire output)"
echo "2. Go to: https://github.com/settings/ssh/new"
echo "   (Login with username: che-manish, password: Manisrko619!)"
echo "3. Paste the key, give it a title (e.g., 'IRT ERP Bench')"
echo "4. Click 'Add SSH key'"
echo "5. Press ENTER here after adding the key..."
echo ""
read -p "Press ENTER after you've added the SSH key to GitHub..."

# Change remote to SSH
echo ""
echo "Configuring git remote to use SSH..."
git remote set-url origin git@github.com:${REPO_OWNER}/${REPO_NAME}.git
echo "✓ Remote configured to use SSH"
echo ""

# Test SSH connection
echo "Testing SSH connection to GitHub..."
ssh -T git@github.com -o StrictHostKeyChecking=no 2>&1 | head -3 || {
    echo "⚠ SSH connection test had issues, but continuing..."
}
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
if git push -u origin $BRANCH; then
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
    echo "Please check:"
    echo "1. SSH key was added to GitHub correctly"
    echo "2. Repository exists and you have write access"
    exit 1
fi

