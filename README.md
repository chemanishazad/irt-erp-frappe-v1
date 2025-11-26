# IRT ERP v3 - Frappe Bench

Custom Frappe/ERPNext setup with `irt_hrms` app for all customizations.

## Structure

- **Core Apps** (tracked for changes, upgradable):
  - `apps/frappe/` - Frappe framework
  - `apps/erpnext/` - ERPNext
  - `apps/hrms/` - HRMS
  
- **Custom App** (all customizations here):
  - `apps/irt_hrms/` - IRT customizations

## Quick Start

### Update System
```bash
./bench-update.sh
```

This script:
1. Pulls updates from `upstream/develop` for all apps
2. Updates requirements
3. Builds assets
4. Runs migrations

### Initial Setup (One-time)
If `bench update` fails with git errors, run:
```bash
./fix_bench_update.sh
```

## Git Tracking

All files are tracked so you can see every change:
- Core app files (frappe, erpnext, hrms) - tracked
- Custom app files (irt_hrms) - tracked
- Configuration files - tracked

Only ignored:
- `env/` - Virtual environment
- `logs/` - Log files
- `*.pyc`, `__pycache__/` - Python cache
- `node_modules/` - Node dependencies
- `sites/*/site_config.json` - Passwords (sensitive)
- `sites/*/private/` - Private files
- `apps/*/.git/` - App git repos

## Manual Updates

If you need to pull updates manually:
```bash
cd apps/frappe && git pull upstream develop
cd ../erpnext && git pull upstream develop
cd ../hrms && git pull upstream develop
cd ../..
bench setup requirements
bench build --force
bench --site irt migrate
```

## Files

- `bench-update.sh` - Main update script
- `fix_bench_update.sh` - One-time git setup script
- `patches.txt` - Bench patch tracking
