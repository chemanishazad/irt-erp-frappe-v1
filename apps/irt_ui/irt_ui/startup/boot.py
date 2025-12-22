# Copyright (c) 2025, IRT and Contributors
# License: MIT. See LICENSE

import frappe

# Override add_home_page to handle standard routes (like dashboard-view) as default routing
def override_add_home_page():
	"""Override frappe.boot.add_home_page to handle standard routes correctly"""
	try:
		from frappe import boot
	except ImportError:
		# Frappe not fully loaded yet, skip override
		return
	
	if not hasattr(boot, 'add_home_page'):
		# add_home_page not available yet, skip override
		return
	
	original_add_home_page = boot.add_home_page
	
	def add_home_page(bootinfo, docs):
		"""Override to handle standard routes like dashboard-view/HRMS Dashboard as default routing"""
		if frappe.session.user == "Guest":
			return
		
		home_page = frappe.db.get_default("desktop:home_page")
		
		if not frappe.is_setup_complete():
			bootinfo.setup_wizard_requires = frappe.get_hooks("setup_wizard_requires")
		
		if not home_page:
			# No home page set, use original function
			return original_add_home_page(bootinfo, docs)
		
		# Check if this is a standard Frappe route (not a Page doctype)
		# Standard routes that should work as default routing
		standard_routes = [
			"dashboard-view",
			"workspace",
			"list",
			"form",
			"report",
			"tree",
			"kanban",
			"calendar",
			"gantt",
			"map",
			"image",
			"inbox",
		]
		
		# Extract the first part of the route (before any slash)
		home_page_clean = home_page.strip("/")
		if home_page_clean.startswith("desk/"):
			home_page_clean = home_page_clean.replace("desk/", "", 1)
		elif home_page_clean.startswith("/desk/"):
			home_page_clean = home_page_clean.replace("/desk/", "", 1)
		
		route_first_part = home_page_clean.split("/")[0] if "/" in home_page_clean else home_page_clean
		
		# If it's a standard route, set it directly without trying to load as Page doctype
		if route_first_part in standard_routes:
			bootinfo["home_page"] = home_page_clean
			return
		
		# For non-standard routes, try to load as Page doctype (original behavior)
		try:
			page = frappe.desk.desk_page.get(home_page)
			docs.append(page)
			bootinfo["home_page"] = page.name
		except (frappe.DoesNotExistError, frappe.PermissionError):
			frappe.clear_last_message()
			# If it fails and looks like a route (contains /), try setting it directly
			if "/" in home_page_clean:
				bootinfo["home_page"] = home_page_clean
			else:
				bootinfo["home_page"] = "desktop"
	
	# Replace the original function
	boot.add_home_page = add_home_page

# Apply the override when module is imported
override_add_home_page()


def get_role_based_sidebar_items():
	"""Get role-based sidebars for current user based on their roles"""
	user_roles = frappe.get_roles()
	role_based_sidebars = frappe.get_all(
		"Role Based Sidebar",
		fields=["name", "header_icon", "for_role", "title"],
		filters={"for_role": ["in", user_roles]},
	)

	sidebar_items = {}

	for s in role_based_sidebars:
		# Use title if available, otherwise use name
		sidebar_key = (s.get("title") or s["name"]).lower()

		# Skip if already exists (workspace sidebar takes precedence)
		if sidebar_key in sidebar_items:
			continue

		try:
			w = frappe.get_doc("Role Based Sidebar", s["name"])
			sidebar_items[sidebar_key] = {
				"label": s.get("title") or s["name"],
				"items": [],
				"header_icon": s["header_icon"],
				"module": w.module,
				"is_role_based": True,  # Flag to identify role-based sidebars
			}

			for si in w.items:
				role_sidebar = {
					"label": si.label,
					"link_to": si.link_to,
					"link_type": si.link_type,
					"type": si.type,
					"icon": si.icon,
					"child": si.child,
					"collapsible": si.collapsible,
					"indent": si.indent,
					"keep_closed": si.keep_closed,
					"display_depends_on": si.display_depends_on,
					"url": si.url,
					"show_arrow": si.show_arrow,
					"filters": si.filters,
					"route_options": si.route_options,
				}

				if si.link_type == "Report" and si.link_to:
					report_type, ref_doctype = frappe.db.get_value(
						"Report", si.link_to, ["report_type", "ref_doctype"]
					)
					role_sidebar["report"] = {
						"report_type": report_type,
						"ref_doctype": ref_doctype,
					}

				if si.type == "Section Break" or w.is_item_allowed(si.link_to, si.link_type):
					sidebar_items[sidebar_key]["items"].append(role_sidebar)
		except Exception as e:
			frappe.log_error(f"Error loading role-based sidebar {s['name']}: {str(e)}")
			continue

	return sidebar_items


def load_role_based_sidebars(bootinfo):
	"""Hook function to load role-based sidebars into bootinfo"""
	# Merge role-based sidebars with workspace sidebars
	role_based_sidebars = get_role_based_sidebar_items()
	if hasattr(bootinfo, "workspace_sidebar_item"):
		bootinfo.workspace_sidebar_item.update(role_based_sidebars)
	else:
		bootinfo.workspace_sidebar_item = role_based_sidebars
