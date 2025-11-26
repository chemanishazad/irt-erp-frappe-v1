# Copyright (c) 2024, IRT and Contributors
# License: MIT

import frappe
from frappe.www.login import get_context as original_get_context


def get_context(context):
	"""Override login context to use custom logo and disable signup"""
	# Get the original context
	original_get_context(context)

	# Override logo with custom logo from public/images
	context["logo"] = "/assets/irt_hrms/images/logo.png"

	# Force disable signup
	context["disable_signup"] = 1

	return context

