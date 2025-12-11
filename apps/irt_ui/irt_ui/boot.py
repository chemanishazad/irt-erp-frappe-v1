# Copyright (c) 2024, IRT and contributors
# For license information, please see license.txt

import frappe
from irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings import get_theme_settings


def boot_session(bootinfo):
	"""Add theme settings to bootinfo"""
	try:
		theme_settings = get_theme_settings()
		bootinfo.irt_theme_settings = theme_settings
	except Exception as e:
		# If theme settings fail to load, use defaults
		frappe.log_error(f"Error loading theme settings: {str(e)}", "IRT Theme Settings Boot Error")
		bootinfo.irt_theme_settings = {}

