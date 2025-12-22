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

	def before_save(self):
		allow_export = self.app and not frappe.flags.in_import and frappe.conf.developer_mode
		if allow_export:
			self.export_sidebar()
		self.set_module()

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

		item_type = item_type.lower()

		if item_type == "doctype":
			return (
				name in (self.can_read or [])
				and name in (self.restricted_doctypes or [])
				and frappe.has_permission(name)
			)
		if item_type == "page":
			return name in self.allowed_pages and name in self.restricted_pages
		if item_type == "report":
			return name in self.allowed_reports
		if item_type == "help":
			return True
		if item_type == "dashboard":
			return True
		if item_type == "url":
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

