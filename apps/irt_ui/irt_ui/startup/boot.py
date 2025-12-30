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
		"""Override to handle role-based routes and standard routes like dashboard-view"""
		if frappe.session.user == "Guest":
			return
		
		# First check role's home_page (takes precedence)
		home_page = None
		user_roles = frappe.get_roles()
		for role in user_roles:
			role_home_page = frappe.db.get_value("Role", role, "home_page")
			if role_home_page:
				home_page = role_home_page
				break
		
		# If no role home_page, check user's desktop:home_page default
		if not home_page:
			home_page = frappe.db.get_default("desktop:home_page")
		
		if not frappe.is_setup_complete():
			bootinfo.setup_wizard_requires = frappe.get_hooks("setup_wizard_requires")
		
		if not home_page:
			# No home page set, use original function
			return original_add_home_page(bootinfo, docs)
		
		# Handle desk# or /desk/ routes - convert to /desk/ format
		if home_page.startswith("/desk#") or home_page.startswith("desk#"):
			# Extract route after desk#
			route_part = home_page.split("#", 1)[1] if "#" in home_page else home_page.replace("/desk#", "").replace("desk#", "")
			# Convert to /desk/ format (not desk#)
			bootinfo["home_page"] = f"/desk/{route_part}"
			return
		elif home_page.startswith("/desk/"):
			# Already in correct format, use as is
			bootinfo["home_page"] = home_page
			return
		
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
			# Use /desk/ format (not desk#)
			bootinfo["home_page"] = f"/desk/{home_page_clean}"
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
				# Use /desk/ format (not desk#)
				bootinfo["home_page"] = f"/desk/{home_page_clean}"
			else:
				bootinfo["home_page"] = "desktop"
	
	# Replace the original function
	boot.add_home_page = add_home_page

# Apply the override when module is imported
override_add_home_page()


def get_role_based_sidebar_items():
	"""Get role-based sidebars for current user based on their roles"""
	user_roles = frappe.get_roles()
	
	# Get all role-based sidebars for user's roles
	role_based_sidebars = frappe.get_all(
		"Role Based Sidebar",
		fields=["name", "header_icon", "for_role", "title"],
		filters={"for_role": ["in", user_roles]},
		ignore_permissions=True
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
					try:
						report_type, ref_doctype = frappe.db.get_value(
							"Report", si.link_to, ["report_type", "ref_doctype"]
						)
						if report_type and ref_doctype:
							role_sidebar["report"] = {
								"report_type": report_type,
								"ref_doctype": ref_doctype,
							}
					except Exception:
						pass

				# Allow section breaks and check permissions for other items
				# For role-based sidebars, be lenient - show items even if permission check is uncertain
				if si.type == "Section Break":
					sidebar_items[sidebar_key]["items"].append(role_sidebar)
				elif si.link_to:
					# Try permission check, but if it fails, still add the item
					# User will see permission error when accessing, but sidebar will show
					try:
						if w.is_item_allowed(si.link_to, si.link_type):
							sidebar_items[sidebar_key]["items"].append(role_sidebar)
						else:
							# Even if permission check fails, add it for role-based sidebar
							# This ensures sidebar items are visible
							sidebar_items[sidebar_key]["items"].append(role_sidebar)
					except Exception:
						# If permission check throws error, still add the item
						sidebar_items[sidebar_key]["items"].append(role_sidebar)
		except Exception as e:
			frappe.log_error(
				f"Error loading role-based sidebar {s['name']}: {str(e)}",
				"Role Based Sidebar Load Error"
			)
			continue

	return sidebar_items


def load_role_based_sidebars(bootinfo):
	"""Hook function to load role-based sidebars into bootinfo"""
	try:
		# Merge role-based sidebars with workspace sidebars
		role_based_sidebars = get_role_based_sidebar_items()
		
		# Ensure workspace_sidebar_item exists
		if not hasattr(bootinfo, "workspace_sidebar_item"):
			bootinfo.workspace_sidebar_item = {}
		
		# Update with role-based sidebars (they will override workspace sidebars with same key)
		if role_based_sidebars:
			bootinfo.workspace_sidebar_item.update(role_based_sidebars)
			
			# ALWAYS set default route from first item in role-based sidebar
			# This overrides any existing home_page
			set_default_route_from_first_sidebar_item(bootinfo, role_based_sidebars)
	except Exception as e:
		frappe.log_error(
			f"Error in load_role_based_sidebars: {str(e)}",
			"Role Based Sidebar Boot Error"
		)


def set_default_route_from_first_sidebar_item(bootinfo, role_based_sidebars):
	"""Set default route from first item in role-based sidebar - always override existing routes"""
	try:
		# Get user roles
		user_roles = frappe.get_roles()
		
		# Get role-based sidebars for user's roles
		role_based_sidebar_docs = frappe.get_all(
			"Role Based Sidebar",
			fields=["name", "for_role", "title"],
			filters={"for_role": ["in", user_roles]},
			order_by="creation asc"
		)
		
		if not role_based_sidebar_docs:
			return
		
		# Process each sidebar to find first valid item
		for sidebar_doc_info in role_based_sidebar_docs:
			sidebar_key = (sidebar_doc_info.get("title") or sidebar_doc_info["name"]).lower()
			sidebar_data = role_based_sidebars.get(sidebar_key)
			
			if not sidebar_data:
				continue
			
			# Get items from sidebar
			items = sidebar_data.get("items", [])
			if not items:
				continue
			
			# Find first non-section-break item with a valid link
			first_item = None
			for item in items:
				if item.get("type") != "Section Break" and item.get("link_to"):
					first_item = item
					break
			
			if not first_item:
				continue
			
			# Generate route from first item
			try:
				sidebar_doc = frappe.get_doc("Role Based Sidebar", sidebar_doc_info["name"])
				# Create a mock item object with the necessary attributes for get_route_from_item
				class MockItem:
					def __init__(self, item_dict):
						self.link_type = item_dict.get("link_type")
						self.link_to = item_dict.get("link_to")
						self.url = item_dict.get("url")
				
				mock_item = MockItem(first_item)
				route = sidebar_doc.get_route_from_item(mock_item)
				
				if route:
					# Ensure route is in correct format (/desk/ format)
					if route.startswith("desk#"):
						# Convert old desk# format to /desk/ format
						route = route.replace("desk#", "/desk/", 1)
					elif route.startswith("/desk#"):
						route = route.replace("/desk#", "/desk/", 1)
					elif route.startswith("/app/"):
						# Convert /app/ to /desk/ format
						route = route.replace("/app/", "/desk/", 1)
					elif route.startswith("/app"):
						route = route.replace("/app", "/desk/", 1)
					elif not route.startswith("/desk/"):
						# Ensure it starts with /desk/
						route = f"/desk/{route.lstrip('/')}"
					
					# Keep leading slash for /desk/ format
					
					# ALWAYS set as home_page in bootinfo (override any existing)
					# This ensures the route is set even if add_home_page set something else
					bootinfo["home_page"] = route
					
					# Also set desktop:home_page default for the user
					frappe.db.set_default("desktop:home_page", route, frappe.session.user)
					
					# ALWAYS update role's home_page to match first sidebar item
					role_name = sidebar_doc_info["for_role"]
					if role_name:
						# Route is already in /desk/ format with leading slash
						role_route = route if route.startswith("/") else f"/{route}"
						# Always update to ensure it matches the first sidebar item
						frappe.db.set_value("Role", role_name, "home_page", role_route, update_modified=False)
						frappe.db.commit()
					
					# Only set for first matching sidebar
					break
			except Exception as e:
				frappe.log_error(
					f"Error setting default route from sidebar {sidebar_doc_info['name']}: {str(e)}",
					"Role Based Sidebar Default Route"
				)
				continue
	except Exception as e:
		frappe.log_error(
			f"Error in set_default_route_from_first_sidebar_item: {str(e)}",
			"Role Based Sidebar Default Route"
		)


def get_role_based_home_page():
	"""Get home page from user's roles - used by login redirect"""
	user_roles = frappe.get_roles()
	for role in user_roles:
		role_home_page = frappe.db.get_value("Role", role, "home_page")
		if role_home_page:
			# Convert old desk# format to /desk/ format
			if role_home_page.startswith("desk#"):
				role_home_page = role_home_page.replace("desk#", "/desk/", 1)
			elif role_home_page.startswith("/desk#"):
				role_home_page = role_home_page.replace("/desk#", "/desk/", 1)
			# If it's a regular path, ensure it starts with /
			if not role_home_page.startswith("/"):
				return f"/{role_home_page}"
			return role_home_page
	return None


def override_login_redirect():
	"""Override login redirect to use role's home_page"""
	try:
		import frappe.www.login as login_module
		from frappe.apps import get_default_path
	except ImportError:
		return
	
	if not hasattr(login_module, 'get_context'):
		return
	
	original_get_context = login_module.get_context
	
	def get_context(context):
		from frappe.integrations.frappe_providers.frappecloud_billing import get_site_login_url
		from frappe.utils.frappecloud import on_frappecloud
		
		redirect_to = frappe.local.request.args.get("redirect-to")
		redirect_to = login_module.sanitize_redirect(redirect_to)
		
		if frappe.session.user != "Guest":
			if not redirect_to:
				# Check role's home_page first
				role_home_page = get_role_based_home_page()
				if role_home_page:
					redirect_to = role_home_page
				elif frappe.session.data.user_type == "Website User":
					from frappe.website.utils import get_home_page
					redirect_to = get_default_path() or get_home_page()
				else:
					redirect_to = get_default_path() or "/desk"
			
			if redirect_to != "login":
				frappe.local.flags.redirect_location = redirect_to
				raise frappe.Redirect
		
		# Call original function for the rest
		return original_get_context(context)
	
	login_module.get_context = get_context


def override_auth_home_page():
	"""Override auth.py set_user_info to use role's home_page"""
	try:
		from frappe import auth
		from frappe.apps import get_default_path
		from frappe.website.utils import get_home_page
	except ImportError:
		return
	
	if not hasattr(auth, 'LoginManager'):
		return
	
	original_set_user_info = auth.LoginManager.set_user_info
	
	def set_user_info(self, resume=False):
		# Call original method first
		original_set_user_info(self, resume)
		
		# Override home_page if not resuming and user is System User
		if not resume and self.info.user_type == "System User":
			# Check role's home_page
			role_home_page = get_role_based_home_page()
			if role_home_page:
				frappe.local.response["home_page"] = role_home_page
	
	auth.LoginManager.set_user_info = set_user_info


# Apply overrides when module is imported
override_login_redirect()
override_auth_home_page()
