# Git Tracking Setup - Track All Changes

## Overview
This setup ensures ALL files are tracked in git so you can see every change you make to core files (frappe, erpnext, hrms).

## What's Tracked

### ✅ All Core App Files
- **4,589 Python files** from frappe, erpnext, hrms are tracked
- All JavaScript, JSON, CSS, and other source files
- Any changes you make to core files will show up in `git status`

### ✅ Custom App Files
- All files in `apps/irt_hrms/` are tracked
- Your customizations are fully visible

### ✅ Configuration Files
- `.gitignore` - Updated to track everything
- `patches.txt` - Bench patch tracking
- `sites/apps.json` - App configuration
- All other config files

## What's Ignored (for safety/performance)

Only these are ignored:
- `env/` - Virtual environment (can be recreated)
- `logs/` - Log files (regenerated)
- `*.pyc`, `__pycache__/` - Python cache (regenerated)
- `node_modules/` - Node dependencies (can be reinstalled)
- `sites/*/site_config.json` - Contains passwords (sensitive)
- `sites/*/private/` - Private files (sensitive)
- `apps/*/.git/` - App git repos (apps have their own repos)

## How to See Your Changes

### Check what you changed:
```bash
# See all modified files
git status

# See changes in core files
git diff apps/frappe/
git diff apps/erpnext/
git diff apps/hrms/

# See changes in specific file
git diff apps/frappe/frappe/__init__.py
```

### Commit your changes:
```bash
# Stage all changes
git add -A

# See what will be committed
git status

# Commit
git commit -m "Description of your changes"
```

## Important Notes

1. **Core App Files**: All files in `apps/frappe/`, `apps/erpnext/`, `apps/hrms/` are tracked
2. **Custom Changes**: Any modifications to core files will show in git
3. **App Git Repos**: Each app has its own `.git` folder (ignored in main repo)
4. **No Secrets**: Sensitive files (passwords, private data) remain ignored

## Example: Finding Your Changes

If you modified a core file:
```bash
# See all modified files
git status

# See the actual changes
git diff apps/frappe/frappe/some_file.py

# Stage and commit
git add apps/frappe/frappe/some_file.py
git commit -m "fix: updated core file for custom requirement"
```

This way, you'll always know exactly what you changed in the core apps!

