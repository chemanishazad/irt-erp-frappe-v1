"""
Custom bench command to sync assets after build
Usage: bench sync-assets
"""

import click
import os
import subprocess
from pathlib import Path


@click.command("sync-assets")
def sync_assets():
	"""Sync assets.json with actual files and clean up orphaned files"""
	import frappe
	
	frappe.init("")
	
	try:
		# Get sites path - frappe.get_site_path("..") gets sites directory
		sites_path = frappe.get_site_path("..")
		if not os.path.exists(os.path.join(sites_path, "assets")):
			# Try alternative path
			sites_path = frappe.local.sites_path
		
		script_path = Path(__file__).parent.parent / "build_utils" / "asset_sync.js"
		
		if not script_path.exists():
			click.echo(f"✗ Asset sync script not found at {script_path}")
			raise click.Abort()
		
		env = os.environ.copy()
		env["FRAPPE_SITES_PATH"] = str(sites_path)
		
		result = subprocess.run(
			["node", str(script_path)],
			env=env,
			capture_output=True,
			text=True,
		)
		
		if result.stdout:
			click.echo(result.stdout)
		if result.stderr:
			click.echo(result.stderr)
		
		if result.returncode == 0:
			click.echo("✓ Asset synchronization completed")
		else:
			click.echo("✗ Asset synchronization failed")
			raise click.Abort()
	except Exception as e:
		click.echo(f"✗ Error: {e}")
		raise click.Abort()
	finally:
		frappe.destroy()

