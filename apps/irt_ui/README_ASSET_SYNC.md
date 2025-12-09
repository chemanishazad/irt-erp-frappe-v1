# Asset Sync Fix

Fixes CSS/JS loading issues caused by `assets.json` being out of sync with files on disk.

## Quick Fix

After building assets, run:

```bash
bench sync-assets
```

Or directly:

```bash
node apps/irt_ui/irt_ui/build_utils/asset_sync.js
```

## What It Does

1. Validates that files referenced in `assets.json` exist
2. Removes orphaned bundle files not in `assets.json`
3. Prevents CSS/JS loading failures

## When to Use

- After `bench build` or `bench watch`
- When CSS/JS files don't load
- When `assets.json` references missing files
