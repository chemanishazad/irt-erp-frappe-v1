# Copyright (c) 2025, IRT and Contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document


class IRTRoleSidebar(Document):
	def validate(self):
		"""Validate menu items and ensure proper sequencing"""
		if self.menu_items:
			# Ensure sequence is set for all items
			for idx, item in enumerate(self.menu_items, start=1):
				if not item.sequence:
					item.sequence = idx
			
			# Sort items by sequence
			self.menu_items.sort(key=lambda x: x.sequence)
			
			# Validate parent items exist
			for item in self.menu_items:
				if item.parent_item:
					parent_exists = any(
						mi.name == item.parent_item or mi.label == item.parent_item
						for mi in self.menu_items
					)
					if not parent_exists:
						frappe.throw(
							f"Parent item '{item.parent_item}' not found for item '{item.label}'"
						)
	
	def on_update(self):
		"""Trigger real-time update when sidebar is updated"""
		if self.enabled and self.role:
			# Clear cache for this role
			cache_key = f"role_sidebar_{self.role}"
			frappe.cache().delete_value(cache_key)
			
			# Get all users with this role
			users = frappe.get_all(
				"Has Role",
				filters={"role": self.role},
				fields=["parent"],
				distinct=True
			)
			user_list = [user.parent for user in users]
			
			# Broadcast update to all users with this role
			frappe.publish_realtime(
				"role_sidebar_updated",
				{"role": self.role},
				user=user_list if user_list else frappe.session.user
			)
	
	def on_trash(self):
		"""Clear cache when sidebar is deleted"""
		cache_key = f"role_sidebar_{self.role}"
		frappe.cache().delete_value(cache_key)

