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

		if item_type == "doctype":
			# Check if user can read and has permission
			can_read = name in (self.can_read or [])
			has_permission = frappe.has_permission(name, "read")
			
			# If restricted_doctypes is set, check if doctype is in it
			# If not set (None/empty), allow all doctypes that user can read
			if self.restricted_doctypes:
				return can_read and name in self.restricted_doctypes and has_permission
			else:
				return can_read and has_permission
		
		if item_type == "page":
			# Check if page is in allowed pages
			allowed = name in (self.allowed_pages or [])
			
			# If restricted_pages is set, check if page is in it
			# If not set (None/empty), allow all pages that user has access to
			if self.restricted_pages:
				return allowed and name in self.restricted_pages
			else:
				return allowed
		
		if item_type == "report":
			return name in (self.allowed_reports or [])
		
		if item_type == "help":
			return True
		
		if item_type == "dashboard":
			return True
		
		if item_type == "url":
			return True
		
		if item_type == "workspace":
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
					return f"desk#form/{doctype_slug}"
				else:
					return f"desk#list/{doctype_slug}"
			except Exception:
				return f"desk#list/{doctype_slug}"
		
		elif link_type == "dashboard":
			# Dashboard route - use Frappe's dashboard-view format
			dashboard_slug = frappe.scrub(link_to)
			return f"desk#dashboard-view/{dashboard_slug}"
		
		elif link_type == "workspace":
			# Workspace route
			workspace_slug = frappe.scrub(link_to)
			return f"desk#workspace/{workspace_slug}"
		
		elif link_type == "page":
			# Page route
			return f"desk#page/{frappe.scrub(link_to)}"
		
		elif link_type == "report":
			# Report route - need to check if it's a query report
			try:
				report = frappe.get_doc("Report", link_to)
				if report.report_type == "Query Report" or report.report_type == "Script Report":
					return f"desk#query-report/{frappe.scrub(link_to)}"
				elif report.ref_doctype:
					return f"desk#report/{frappe.scrub(report.ref_doctype)}/{frappe.scrub(link_to)}"
				else:
					return f"desk#report/{frappe.scrub(link_to)}"
			except Exception:
				return f"desk#report/{frappe.scrub(link_to)}"
		
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
				try:
					if item.link_type == "DocType":
						frappe.get_meta(item.link_to)  # Verify doctype exists
					elif item.link_type == "Dashboard":
						frappe.get_doc("Dashboard", item.link_to)  # Verify dashboard exists
					elif item.link_type == "Workspace":
						frappe.get_doc("Workspace", item.link_to)  # Verify workspace exists
					elif item.link_type == "Page":
						frappe.get_doc("Page", item.link_to)  # Verify page exists
					elif item.link_type == "Report":
						frappe.get_doc("Report", item.link_to)  # Verify report exists
					first_item = item
					break
				except (frappe.DoesNotExistError, Exception):
					# Skip invalid items
					continue
		
		if not first_item:
			return
		
		# Generate route from first item
		route = self.get_route_from_item(first_item)
		if not route:
			return
		
		# Frappe expects routes in format: desk#route or /desk#route
		# Ensure route is in correct format
		if not route.startswith("desk#") and not route.startswith("/desk#"):
			if route.startswith("/app/"):
				# Convert /app/... to desk#...
				route = route.replace("/app/", "desk#", 1)
			elif route.startswith("/app"):
				route = route.replace("/app", "desk#", 1)
			else:
				route = f"desk#{route.lstrip('/')}"
		
		# Ensure it starts with /desk# for proper routing
		if not route.startswith("/"):
			route = f"/{route}"
		
		# Update role's home_page
		try:
			role_doc = frappe.get_doc("Role", self.for_role)
			if role_doc.home_page != route:
				role_doc.home_page = route
				role_doc.save(ignore_permissions=True)
				
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

