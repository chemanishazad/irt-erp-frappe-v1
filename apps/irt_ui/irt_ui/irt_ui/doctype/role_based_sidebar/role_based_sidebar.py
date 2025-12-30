# Copyright (c) 2025, IRT and Contributors
# For license information, please see license.txt

import os
from json import JSONDecodeError, dumps, loads

import click

import frappe
from frappe import _
from frappe.boot import get_allowed_pages, get_allowed_reports
from frappe.model.document import Document
from frappe.modules.utils import create_directory_on_app_path


class RoleBasedSidebar(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from irt_ui.irt_ui.doctype.role_based_sidebar_item.role_based_sidebar_item import RoleBasedSidebarItem
		from frappe.types import DF

		app: DF.Autocomplete | None
		for_role: DF.Link | None
		items: DF.Table[RoleBasedSidebarItem]
		module: DF.Text | None
		title: DF.Data | None
	# end: auto-generated types

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		if not frappe.flags.in_migrate:
			self.user = frappe.get_user()
			self.can_read = self.get_cached("user_perm_can_read", self.get_can_read_items)

		self.allowed_pages = get_allowed_pages(cache=True)
		self.allowed_reports = get_allowed_reports(cache=True)
		self.restricted_doctypes = frappe.cache.get_value("domain_restricted_doctypes")
		self.restricted_pages = frappe.cache.get_value("domain_restricted_pages")

	def get_can_read_items(self):
		if not self.user.can_read:
			self.user.build_permissions()

	def autoname(self):
		"""Generate name from title and role to allow same title for different roles"""
		if not self.name and self.title and self.for_role:
			# Create name from title and role: "title-role"
			title_slug = frappe.scrub(self.title)
			role_slug = frappe.scrub(self.for_role)
			name = f"{title_slug}-{role_slug}"
			
			# Ensure uniqueness by appending number if needed
			if frappe.db.exists("Role Based Sidebar", name):
				counter = 1
				while frappe.db.exists("Role Based Sidebar", f"{name}-{counter}"):
					counter += 1
				name = f"{name}-{counter}"
			
			self.name = name

	def validate(self):
		"""Validate that title+role combination is unique"""
		if self.title and self.for_role:
			existing = frappe.db.get_value(
				"Role Based Sidebar",
				{
					"title": self.title,
					"for_role": self.for_role,
					"name": ["!=", self.name]
				},
				"name"
			)
			if existing:
				frappe.throw(
					_("A sidebar with title '{0}' for role '{1}' already exists").format(
						self.title, self.for_role
					)
				)

	def before_save(self):
		allow_export = self.app and not frappe.flags.in_import and frappe.conf.developer_mode
		if allow_export:
			self.export_sidebar()
		self.set_module()

	def on_update(self):
		"""Set default route after save is successful"""
		self.set_role_default_route()

	def export_sidebar(self):
		folder_path = create_directory_on_app_path("role_based_sidebar", self.app)
		file_path = os.path.join(folder_path, f"{frappe.scrub(self.title)}.json")
		doc_export = self.as_dict(no_nulls=True, no_private_properties=True)
		with open(file_path, "w+") as doc_file:
			doc_file.write(frappe.as_json(doc_export) + "\n")

	def delete_file(self):
		folder_path = create_directory_on_app_path("role_based_sidebar", self.app)
		file_path = os.path.join(folder_path, f"{frappe.scrub(self.title)}.json")
		if os.path.exists(file_path):
			os.remove(file_path)

	def on_trash(self):
		if is_workspace_manager():
			if frappe.conf.developer_mode and self.app:
				self.delete_file()
		else:
			frappe.throw(_("You need to be Workspace Manager to delete a public role-based sidebar."))

	def is_item_allowed(self, name, item_type):
		if frappe.session.user == "Administrator":
			return True

		if not name:
			return False

		item_type = item_type.lower() if item_type else ""

		# For role-based sidebars, be more lenient - if item is configured, show it
		# User will get permission error when actually accessing, but sidebar should show
		if item_type == "doctype":
			# Check if doctype exists
			try:
				frappe.get_meta(name)
			except Exception:
				return False
			
			# For role-based sidebars, show the item even if permission check fails
			# The actual permission will be checked when user tries to access
			try:
				has_permission = frappe.has_permission(name, "read", throw=False)
				return has_permission
			except Exception:
				# If permission check fails, still allow for role-based sidebar
				# User will see permission error when accessing, but sidebar shows
				return True
		
		if item_type == "page":
			# Check if page exists without requiring permissions
			# Use db.exists to avoid permission errors
			if not frappe.db.exists("Page", name):
				return False
			
			# For role-based sidebars, show page if it exists
			# Permission will be checked when accessing
			allowed = name in (self.allowed_pages or [])
			if allowed:
				return True
			
			# Even if not in allowed_pages, allow for role-based sidebar
			# User will get permission error when accessing
			return True
		
		if item_type == "report":
			# Check if report exists
			try:
				frappe.get_doc("Report", name)
			except Exception:
				return False
			
			allowed = name in (self.allowed_reports or [])
			if allowed:
				return True
			# Allow for role-based sidebar even if not in allowed_reports
			return True
		
		if item_type == "dashboard":
			# Check if dashboard exists
			try:
				frappe.get_doc("Dashboard", name)
			except Exception:
				return False
			return True
		
		if item_type == "workspace":
			# Check if workspace exists
			try:
				frappe.get_doc("Workspace", name)
			except Exception:
				return False
			return True
		
		if item_type == "url":
			return True
		
		if item_type == "help":
			return True
		
		# Default: allow if we can't determine
		return True

	def get_cached(self, cache_key, fallback_fn):
		value = frappe.cache.get_value(cache_key, user=frappe.session.user)
		if value is not None:
			return value

		value = fallback_fn()

		# Expire every six hour
		frappe.cache.set_value(cache_key, value, frappe.session.user, 21600)
		return value

	def set_module(self):
		if not self.module:
			self.module = self.get_module_from_items()

	def get_module_from_items(self):
		all_modules_in_sidebars = []

		for item in self.items:
			if item.type != "Section Break" and item.type != "Sidebar Item Group" and item.link_type != "URL":
				try:
					all_modules_in_sidebars.append(frappe.get_doc(item.link_type, item.link_to).module)
				except frappe.DoesNotExistError as e:
					frappe.logger().error(e)
		from collections import Counter

		counts = Counter(all_modules_in_sidebars)
		if counts and counts.most_common(1)[0]:
			return counts.most_common(1)[0][0]

	def get_route_from_item(self, item):
		"""Generate route from sidebar item based on link_type and link_to"""
		if not item or not item.link_to:
			return None
		
		link_type = item.link_type.lower() if item.link_type else None
		link_to = item.link_to
		
		# Handle different link types
		if link_type == "doctype":
			# Default to list view for DocType
			doctype_slug = frappe.scrub(link_to)
			try:
				if frappe.get_meta(link_to).is_single:
					return f"/desk/form/{doctype_slug}"
				else:
					return f"/desk/list/{doctype_slug}"
			except Exception:
				return f"/desk/list/{doctype_slug}"
		
		elif link_type == "dashboard":
			# Dashboard route - use Frappe's dashboard-view format
			# Use actual dashboard name with spaces (not scrubbed) for proper routing
			# Format: /desk/dashboard-view/Dashboard Name (with spaces)
			return f"/desk/dashboard-view/{link_to}"
		
		elif link_type == "workspace":
			# Workspace route - use /app/ format for home_page compatibility
			# Use workspace name with proper slugging (spaces to dashes, not underscores)
			try:
				workspace = frappe.get_doc("Workspace", link_to)
				# Use workspace name (title) for slug, convert spaces to dashes
				from frappe.desk.utils import slug
				workspace_slug = slug(workspace.name or link_to)
				if workspace.public:
					return f"/app/{workspace_slug}"
				else:
					return f"/app/private/{workspace_slug}"
			except Exception:
				# Fallback: use link_to with proper slugging
				from frappe.desk.utils import slug
				workspace_slug = slug(link_to)
				return f"/app/{workspace_slug}"
		
		elif link_type == "page":
			# Page route
			return f"/desk/page/{frappe.scrub(link_to)}"
		
		elif link_type == "report":
			# Report route - need to check if it's a query report
			try:
				report = frappe.get_doc("Report", link_to)
				if report.report_type == "Query Report" or report.report_type == "Script Report":
					return f"/desk/query-report/{frappe.scrub(link_to)}"
				elif report.ref_doctype:
					return f"/desk/report/{frappe.scrub(report.ref_doctype)}/{frappe.scrub(link_to)}"
				else:
					return f"/desk/report/{frappe.scrub(link_to)}"
			except Exception:
				return f"/desk/report/{frappe.scrub(link_to)}"
		
		elif link_type == "url":
			# External URL
			return item.url if hasattr(item, 'url') and item.url else None
		
		return None

	def set_role_default_route(self):
		"""Set the first sidebar item as the default route for the role"""
		if not self.for_role or not self.items:
			return
		
		# Get the first non-section-break item
		first_item = None
		for item in sorted(self.items, key=lambda x: x.idx or 0):
			if item.type not in ["Section Break", "Sidebar Item Group"] and item.link_to:
				# Verify the link exists before using it
				# Use db.exists to avoid permission errors
				try:
					if item.link_type == "DocType":
						frappe.get_meta(item.link_to)  # Verify doctype exists
					elif item.link_type == "Dashboard":
						if not frappe.db.exists("Dashboard", item.link_to):
							continue
					elif item.link_type == "Workspace":
						if not frappe.db.exists("Workspace", item.link_to):
							continue
					elif item.link_type == "Page":
						# Use db.exists to avoid permission errors
						if not frappe.db.exists("Page", item.link_to):
							continue
					elif item.link_type == "Report":
						if not frappe.db.exists("Report", item.link_to):
							continue
					first_item = item
					break
				except (frappe.DoesNotExistError, frappe.PermissionError, Exception) as e:
					# Skip invalid items or items user doesn't have permission to access
					# Log permission errors but don't fail
					if isinstance(e, frappe.PermissionError):
						frappe.log_error(
							f"Permission error checking {item.link_type} '{item.link_to}': {str(e)}",
							"Role Based Sidebar: set_role_default_route"
						)
					continue
		
		if not first_item:
			return
		
		# Generate route from first item
		route = self.get_route_from_item(first_item)
		if not route:
			return
		
		# For home_page field, use /desk/ format (not desk#)
		# Routes are already in /desk/ format, but ensure they're properly formatted
		if route.startswith("desk#"):
			# Convert old desk# format to /desk/ format
			route = route.replace("desk#", "/desk/", 1)
		elif route.startswith("/desk#"):
			route = route.replace("/desk#", "/desk/", 1)
		
		# Ensure route starts with /desk/ for home_page field
		if not route.startswith("/desk/"):
			if route.startswith("/desk"):
				route = route.replace("/desk", "/desk/", 1)
			elif route.startswith("desk/"):
				route = f"/{route}"
			else:
				route = f"/desk/{route.lstrip('/')}"
		
		# Update role's home_page
		try:
			role_doc = frappe.get_doc("Role", self.for_role)
			if role_doc.home_page != route:
				# Temporarily disable path validation for desk routes
				# The validate_path function only validates website paths, not desk routes
				# We'll set the route directly via database to bypass validation
				old_home_page = role_doc.home_page
				role_doc.home_page = route
				
				# Save with validation disabled for path checking
				# The home_page validation will fail for desk routes, so we skip it
				try:
					role_doc.save(ignore_permissions=True)
				except Exception as validation_error:
					# If validation fails (likely because it's a desk route), 
					# set it directly via database update
					if "not a valid path" in str(validation_error):
						# Desk routes are valid but don't pass website path validation
						# Update directly via database
						frappe.db.set_value("Role", self.for_role, "home_page", route)
						frappe.db.commit()
					else:
						# Re-raise if it's a different error
						raise
				
				# Also update desktop:home_page default for users with this role
				users_with_role = frappe.get_all(
					"Has Role",
					filters={"role": self.for_role, "parenttype": "User"},
					fields=["parent"]
				)
				for user_role in users_with_role:
					user = user_role["parent"]
					frappe.db.set_default("desktop:home_page", route, user)
				
				frappe.db.commit()
				
				frappe.msgprint(
					_("Default route for role '{0}' has been set to '{1}'").format(
						self.for_role, route
					),
					indicator="green",
					alert=True
				)
		except Exception as e:
			frappe.log_error(
				f"Error setting default route for role {self.for_role}: {str(e)}",
				"Role Based Sidebar: set_role_default_route"
			)
			# Show user-friendly error message
			frappe.msgprint(
				_("Could not set default route: {0}").format(str(e)),
				indicator="orange",
				alert=True
			)


def is_workspace_manager():
	return "Workspace Manager" in frappe.get_roles()


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_role_query(doctype, txt, searchfield, start, page_len, filters):
	"""Optimized query for Role field to prevent browser freezing"""
	return frappe.get_all(
		"Role",
		limit_start=start,
		limit_page_length=page_len,
		filters=[
			["Role", "name", "like", f"%{txt}%"],
			["Role", "name", "!=", "All"],
			["Role", "name", "!=", "Guest"],
		],
		fields=["name"],
		order_by="name asc",
		as_list=True,
	)


@frappe.whitelist()
def get_app_query(txt=None):
	"""Optimized query for App field to prevent browser freezing"""
	installed_apps = frappe.get_installed_apps()
	app_list = []
	
	# Filter apps based on search text
	if txt:
		txt = txt.lower()
		installed_apps = [app for app in installed_apps if txt in app.lower()]
	
	# Limit results to prevent freezing (show first 50 matching apps)
	installed_apps = installed_apps[:50]
	
	for app in installed_apps:
		if app == "frappe":
			continue
		app_list.append(app)
	
	return app_list


@frappe.whitelist()
def get_installed_apps_optimized():
	"""Optimized version of get_installed_apps to prevent browser freezing"""
	installed_apps = frappe.get_installed_apps()
	app_list = []
	
	# Limit to first 50 apps to prevent freezing
	for app in installed_apps[:50]:
		if app == "frappe":
			continue
		app_list.append(app)
	
	# Return in format expected by autocomplete: list of dicts with value and label
	return [{"value": app, "label": app} for app in app_list]


@frappe.whitelist()
def add_role_sidebar_items(sidebar_title, sidebar_items):
	sidebar_items = loads(sidebar_items)
	w = frappe.get_doc("Role Based Sidebar", sidebar_title)
	items = []
	current_idx = 1
	for item in sidebar_items:
		si = frappe.new_doc("Role Based Sidebar Item")
		si.update(item)
		si.idx = current_idx
		items.append(si)
		current_idx += 1

		nested_items = item.get("nested_items", [])
		if nested_items:
			for nested_item in nested_items:
				new_nested_item = frappe.new_doc("Role Based Sidebar Item")
				new_nested_item.update(nested_item)
				new_nested_item.child = 1
				new_nested_item.idx = current_idx
				items.append(new_nested_item)
				current_idx += 1

	w.items = items
	w.save()
	return w

