__version__ = "0.0.1"

# Import startup.boot early to apply add_home_page override before get_bootinfo() runs
# This ensures standard routes work as default routing
try:
	from irt_ui.startup import boot
except ImportError:
	# If import fails, continue - might be during app installation
	pass

