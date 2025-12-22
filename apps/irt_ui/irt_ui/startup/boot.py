# Copyright (c) 2025, IRT and Contributors
# License: MIT. See LICENSE

import frappe


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
