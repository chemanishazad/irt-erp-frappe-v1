/**
 * Asset Synchronization Utility for IRT UI
 * Fixes CSS/JS loading issues by ensuring assets.json matches files on disk
 * Usage: node asset_sync.js
 */

const fs = require("fs");
const path = require("path");

// Get sites path from environment or detect from current directory
let sites_path = process.env.FRAPPE_SITES_PATH;
if (!sites_path) {
	// Try to detect from common locations
	const current_dir = __dirname;
	if (current_dir.includes("frappe-bench")) {
		sites_path = path.join(current_dir.split("frappe-bench")[0], "frappe-bench", "sites");
	} else {
		sites_path = path.join(__dirname, "../../../sites");
	}
}

const assets_json_path = path.join(sites_path, "assets", "assets.json");
const assets_rtl_json_path = path.join(sites_path, "assets", "assets-rtl.json");

/**
 * Validate that all files referenced in assets.json actually exist
 */
function validateAssetsJson() {
	const missing_files = [];
	
	// Read assets.json
	if (!fs.existsSync(assets_json_path)) {
		console.warn(`[IRT UI] assets.json not found at ${assets_json_path}`);
		return { valid: false, missing_files };
	}
	
	const assets_json = JSON.parse(fs.readFileSync(assets_json_path, "utf8"));
	
	// Check each asset file
	for (const [key, asset_path] of Object.entries(assets_json)) {
		// Skip RTL assets (handled separately)
		if (key.startsWith("rtl_")) continue;
		
		// Convert /assets/... path to filesystem path
		const file_path = path.join(sites_path, asset_path.replace(/^\//, ""));
		
		if (!fs.existsSync(file_path)) {
			missing_files.push({ key, path: asset_path, file_path });
		}
	}
	
	// Check RTL assets
	if (fs.existsSync(assets_rtl_json_path)) {
		const assets_rtl_json = JSON.parse(fs.readFileSync(assets_rtl_json_path, "utf8"));
		for (const [key, asset_path] of Object.entries(assets_rtl_json)) {
			const file_path = path.join(sites_path, asset_path.replace(/^\//, ""));
			if (!fs.existsSync(file_path)) {
				missing_files.push({ key, path: asset_path, file_path });
			}
		}
	}
	
	return { valid: missing_files.length === 0, missing_files };
}

/**
 * Clean up orphaned bundle files that are no longer referenced in assets.json
 */
function cleanupOrphanedAssets() {
	if (!fs.existsSync(assets_json_path)) {
		return { cleaned: 0 };
	}
	
	const assets_json = JSON.parse(fs.readFileSync(assets_json_path, "utf8"));
	const assets_rtl_json = fs.existsSync(assets_rtl_json_path)
		? JSON.parse(fs.readFileSync(assets_rtl_json_path, "utf8"))
		: {};
	
	// Get all referenced file paths
	const referenced_files = new Set();
	for (const asset_path of Object.values(assets_json)) {
		if (typeof asset_path === "string" && asset_path.startsWith("/assets/")) {
			referenced_files.add(path.join(sites_path, asset_path.replace(/^\//, "")));
		}
	}
	for (const asset_path of Object.values(assets_rtl_json)) {
		if (typeof asset_path === "string" && asset_path.startsWith("/assets/")) {
			referenced_files.add(path.join(sites_path, asset_path.replace(/^\//, "")));
		}
	}
	
	// Normalize paths for comparison
	const referenced_files_normalized = new Set();
	for (const file_path of referenced_files) {
		referenced_files_normalized.add(path.resolve(file_path));
	}
	
	// Find all bundle files in assets directory recursively
	const assets_dir = path.join(sites_path, "assets");
	if (!fs.existsSync(assets_dir)) {
		return { cleaned: 0 };
	}
	
	function findFiles(dir, pattern) {
		const files = [];
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					files.push(...findFiles(fullPath, pattern));
				} else if (pattern.test(entry.name)) {
					files.push(fullPath);
				}
			}
		} catch (err) {
			// Ignore permission errors
		}
		return files;
	}
	
	const bundlePattern = /\.bundle\.(js|css)$/;
	const mapPattern = /\.bundle\.(js|css)\.map$/;
	
	const all_bundle_files = findFiles(assets_dir, bundlePattern);
	const all_map_files = findFiles(assets_dir, mapPattern);
	
	// Delete orphaned files
	let cleaned_count = 0;
	for (const file_path of [...all_bundle_files, ...all_map_files]) {
		const normalized_path = path.resolve(file_path);
		if (!referenced_files_normalized.has(normalized_path)) {
			try {
				fs.unlinkSync(file_path);
				cleaned_count++;
			} catch (err) {
				if (err.code !== "ENOENT") {
					console.error(`[IRT UI] Failed to delete orphaned file ${file_path}: ${err.message}`);
				}
			}
		}
	}
	
	return { cleaned: cleaned_count };
}

/**
 * Sync assets: validate and clean up orphaned files
 */
function syncAssets() {
	console.log("[IRT UI] Syncing assets...");
	
	// Validate assets.json
	const validation = validateAssetsJson();
	if (!validation.valid && validation.missing_files.length > 0) {
		console.warn(`⚠ Found ${validation.missing_files.length} missing file(s) in assets.json`);
		console.warn("  Run: bench build --force");
	}
	
	// Clean up orphaned files
	const cleanup_result = cleanupOrphanedAssets();
	if (cleanup_result.cleaned > 0) {
		console.log(`✓ Cleaned up ${cleanup_result.cleaned} orphaned file(s)`);
	} else {
		console.log("✓ No orphaned files found");
	}
	
	return {
		valid: validation.valid,
		missing_files: validation.missing_files.length,
		cleaned: cleanup_result.cleaned,
	};
}

// Run if called directly
if (require.main === module) {
	const result = syncAssets();
	process.exit(result.valid ? 0 : 1);
}

module.exports = {
	validateAssetsJson,
	cleanupOrphanedAssets,
	syncAssets,
};

