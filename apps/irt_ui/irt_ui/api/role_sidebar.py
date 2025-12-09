# Copyright (c) 2025, IRT and Contributors
# License: MIT. See LICENSE

import frappe
from frappe import _


@frappe.whitelist()
def get_role_sidebar(role=None):
	"""Get sidebar items for a specific role"""
	if not role:
		role = frappe.get_roles()[0] if frappe.get_roles() else None
	
	if not role:
		return None
	
	# Check cache first
	cache_key = f"role_sidebar_{role}"
	cached_data = frappe.cache().get_value(cache_key)
	if cached_data:
		return cached_data
	
	# Get role sidebar configuration
	role_sidebar = frappe.db.get_value(
		"IRT Role Sidebar",
		{"role": role, "enabled": 1},
		["name"]
	)
	
	if not role_sidebar:
		return None
	
	doc = frappe.get_doc("IRT Role Sidebar", role_sidebar)
	
	# Build sidebar structure
	sidebar_data = {
		"label": role,
		"items": [],
		"header_icon": "folder",
		"module": "IRT UI"
	}
	
	# Get all menu items
	menu_items = [item for item in doc.menu_items if item.is_active]
	
	# Build hierarchical structure
	parent_items = {}
	child_items = []
	item_map = {}  # Map to track items by label/name
	
	for item in menu_items:
		item_dict = {
			"label": item.label,
			"icon": item.icon or "",
			"type": item.type,
			"sequence": item.sequence or 0,
			"is_active": item.is_active,
			"open_in_new_tab": item.open_in_new_tab or 0
		}
		
		# Use name if available, otherwise use label as key
		item_key = item.name if hasattr(item, 'name') and item.name else item.label
		item_map[item_key] = item_dict
		
		if item.type == "Link":
			if item.route:
				item_dict["url"] = item.route
			elif item.link_type == "URL" and item.url:
				item_dict["url"] = item.url
			elif item.link_to:
				# Build route based on link_type
				route = build_route(item.link_type, item.link_to)
				if route:
					item_dict["url"] = route
				else:
					item_dict["url"] = "#"
			else:
				item_dict["url"] = "#"
			
			item_dict["link_type"] = item.link_type or "DocType"
			item_dict["link_to"] = item.link_to or ""
			
			# Ensure child property is set for Frappe compatibility
			item_dict["child"] = 0
		
		if item.parent_item:
			item_dict["parent_item"] = item.parent_item
			child_items.append(item_dict)
		else:
			item_dict["child_items"] = []
			parent_items[item_key] = item_dict
	
	# Attach child items to parents
	for child in child_items:
		parent_key = child.get("parent_item")
		# Try to find parent by name or label
		if parent_key in parent_items:
			parent_items[parent_key]["child_items"].append(child)
		else:
			# Try to find by label match
			for key, parent in parent_items.items():
				if parent.get("label") == parent_key:
					parent["child_items"].append(child)
					break
	
	# Sort items by sequence
	sorted_items = sorted(parent_items.values(), key=lambda x: x.get("sequence", 0))
	
	# Flatten structure for sidebar
	for item in sorted_items:
		sidebar_item = {
			"label": item["label"],
			"icon": item.get("icon", ""),
			"type": item.get("type", "Link"),
			"open_in_new_tab": item.get("open_in_new_tab", 0)
		}
		
		if item.get("type") == "Link":
			sidebar_item["url"] = item.get("url", "#")
			sidebar_item["link_type"] = item.get("link_type", "DocType")
			sidebar_item["link_to"] = item.get("link_to", "")
			sidebar_item["child"] = 0
			sidebar_item["collapsible"] = 1 if item.get("child_items") else 0
		elif item.get("type") == "Section Break":
			sidebar_item["collapsible"] = 1
			sidebar_item["indent"] = 0
		
		# Store child_items for custom rendering
		if item.get("child_items") and len(item.get("child_items", [])) > 0:
			sidebar_item["child_items"] = [
				{
					"label": child["label"],
					"icon": child.get("icon", ""),
					"url": child.get("url", "#"),
					"link_type": child.get("link_type", "DocType"),
					"link_to": child.get("link_to", ""),
					"open_in_new_tab": child.get("open_in_new_tab", 0),
					"type": "Link"
				}
				for child in sorted(item["child_items"], key=lambda x: x.get("sequence", 0))
			]
		
		sidebar_data["items"].append(sidebar_item)
		
		# Add child items as separate entries right after parent (Frappe expects this structure)
		if item.get("child_items") and len(item.get("child_items", [])) > 0:
			for child in sorted(item["child_items"], key=lambda x: x.get("sequence", 0)):
				child_item = {
					"label": child["label"],
					"icon": child.get("icon", ""),
					"type": "Link",
					"url": child.get("url", "#"),
					"link_type": child.get("link_type", "DocType"),
					"link_to": child.get("link_to", ""),
					"child": 1,  # Mark as child item
					"open_in_new_tab": child.get("open_in_new_tab", 0)
				}
				sidebar_data["items"].append(child_item)
	
	# Cache the result
	frappe.cache().set_value(cache_key, sidebar_data, expires_in_sec=3600)
	
	return sidebar_data


def build_route(link_type, link_to):
	"""Build route URL based on link type"""
	if not link_to:
		return None
	
	if link_type == "DocType":
		return f"/app/{frappe.scrub(link_to)}"
	elif link_type == "Page":
		return f"/app/{frappe.scrub(link_to)}"
	elif link_type == "Report":
		return f"/app/query-report/{frappe.scrub(link_to)}"
	elif link_type == "Workspace":
		return f"/app/{frappe.scrub(link_to)}"
	elif link_type == "Dashboard":
		return f"/app/dashboard/{frappe.scrub(link_to)}"
	
	return None


@frappe.whitelist()
def get_available_menu_items():
	"""Get all available menu items from Workspace Sidebars"""
	from frappe.boot import get_sidebar_items
	
	all_sidebar_items = get_sidebar_items()
	available_items = []
	
	for sidebar_name, sidebar_data in all_sidebar_items.items():
		for item in sidebar_data.get("items", []):
			if item.get("type") == "Link":
				available_items.append({
					"label": item.get("label"),
					"icon": item.get("icon", ""),
					"link_type": item.get("link_type"),
					"link_to": item.get("link_to"),
					"url": item.get("url", ""),
					"source": sidebar_name
				})
	
	return available_items


@frappe.whitelist()
def get_all_sidebar_items():
	"""Get all sidebar items grouped by sidebar name"""
	from frappe.boot import get_sidebar_items
	
	all_sidebar_items = get_sidebar_items()
	items_list = []
	
	for sidebar_name, sidebar_data in all_sidebar_items.items():
		for item in sidebar_data.get("items", []):
			if item.get("type") == "Link":
				items_list.append({
					"label": item.get("label"),
					"icon": item.get("icon", ""),
					"link_type": item.get("link_type"),
					"link_to": item.get("link_to"),
					"url": item.get("url", ""),
					"sidebar_name": sidebar_data.get("label", sidebar_name)
				})
	
	return items_list


def check_role_has_access(role, link_type, link_to):
	"""Check if a role has access to a specific link"""
	if not role or not link_to:
		return False
	
	# Administrator role has access to everything
	if role == "Administrator":
		return True
	
	try:
		link_type_lower = (link_type or "").lower()
		
		if link_type_lower == "doctype":
			# Check if role has read permission for this DocType
			# First verify DocType exists
			if not frappe.db.exists("DocType", link_to):
				return False
			
			# Check DocPerm table directly - role must have read=1
			# Also check if permlevel is 0 (base level permission)
			has_perm = frappe.db.exists("DocPerm", {
				"parent": link_to,
				"role": role,
				"read": 1,
				"permlevel": 0
			})
			
			if has_perm:
				return True
			
			# Also check if "All" role has permission (which applies to all roles)
			has_all_perm = frappe.db.exists("DocPerm", {
				"parent": link_to,
				"role": "All",
				"read": 1,
				"permlevel": 0
			})
			
			return bool(has_all_perm)
		
		elif link_type_lower == "page":
			# Check if role has access to Page
			# First check if page exists
			if not frappe.db.exists("Page", link_to):
				return False
			
			# Check if page has role restrictions
			page_roles = frappe.get_all("Has Role", 
				filters={"parent": link_to, "parenttype": "Page"},
				fields=["role"]
			)
			# If no role restrictions, accessible to all
			if not page_roles:
				return True
			# Check if role is in allowed roles
			return role in [pr.role for pr in page_roles]
		
		elif link_type_lower == "report":
			# Check if role has access to Report
			if not frappe.db.exists("Report", link_to):
				return False
			
			report_roles = frappe.get_all("Has Role",
				filters={"parent": link_to, "parenttype": "Report"},
				fields=["role"]
			)
			# If no role restrictions, accessible to all
			if not report_roles:
				return True
			return role in [rr.role for rr in report_roles]
		
		elif link_type_lower == "workspace":
			# Workspace - check if role has access
			if not frappe.db.exists("Workspace", link_to):
				return False
			
			# Workspaces are generally accessible, but check module access
			try:
				workspace_doc = frappe.get_doc("Workspace", link_to)
				# Check if workspace is public or for_user
				if workspace_doc.public == 1:
					return True
				# Check module access
				if workspace_doc.module:
					# Check if role has access to this module
					module_roles = frappe.get_all("Has Role",
						filters={"parent": workspace_doc.module, "parenttype": "Module Def"},
						fields=["role"]
					)
					if not module_roles:
						return True
					return role in [mr.role for mr in module_roles]
				return True
			except:
				return False
		
		elif link_type_lower == "dashboard":
			# Dashboard - generally accessible
			return True
		
		else:
			# For other types (URL, etc.), allow by default
			return True
			
	except Exception as e:
		frappe.log_error(f"Error checking access for role {role}, link_type {link_type}, link_to {link_to}: {str(e)}", "Role Sidebar Error")
		return False


@frappe.whitelist()
def get_default_sidebar_items_for_role(role):
	"""Get all default sidebar items that are accessible to a specific role"""
	if not role:
		frappe.log_error("No role provided to get_default_sidebar_items_for_role", "Role Sidebar Error")
		return []
	
	role_items = []
	sequence_counter = 1
	checked_count = 0
	allowed_count = 0
	seen_items = set()  # Track items to prevent duplicates
	
	try:
		# Get from Workspace Sidebar directly and filter by role permissions
		workspace_sidebars = frappe.get_all("Workspace Sidebar", fields=["name", "header_icon"], limit=50)
		frappe.log_error(f"Found {len(workspace_sidebars)} Workspace Sidebars for role {role}", "Role Sidebar Debug")
		
		for ws in workspace_sidebars:
			try:
				ws_doc = frappe.get_doc("Workspace Sidebar", ws.name)
				for si in ws_doc.items:
					if si.type == "Link" and si.link_to:
						checked_count += 1
						
						# Create unique key to prevent duplicates
						item_key = f"{si.link_type}:{si.link_to}:{si.label}"
						
						# Skip if we've already added this item
						if item_key in seen_items:
							continue
						
						# Check if role has access to this item
						if check_role_has_access(role, si.link_type, si.link_to):
							allowed_count += 1
							seen_items.add(item_key)
							
							url = si.url or build_route(si.link_type, si.link_to) or "#"
							role_items.append({
								"label": si.label or "",
								"icon": si.icon or "",
								"link_type": si.link_type or "DocType",
								"link_to": si.link_to,
								"url": url,
								"type": "Link",
								"sidebar_name": ws.name,
								"sequence": sequence_counter,
								"is_active": 1,
								"open_in_new_tab": 0
							})
							sequence_counter += 1
					elif si.type == "Section Break":
						# Create unique key for section breaks
						section_key = f"section:{si.label}"
						if section_key not in seen_items:
							seen_items.add(section_key)
							role_items.append({
								"label": si.label or "Section",
								"icon": si.icon or "",
								"type": "Section Break",
								"sequence": sequence_counter,
								"is_active": 1,
								"sidebar_name": ws.name
							})
							sequence_counter += 1
			except Exception as e:
				frappe.log_error(f"Error processing Workspace Sidebar {ws.name}: {str(e)}", "Role Sidebar Error")
				continue
		
		frappe.log_error(
			f"Role {role}: Checked {checked_count} items, allowed {allowed_count}, "
			f"returning {len(role_items)} items (including sections). "
			f"Sample: {[item.get('label') for item in role_items[:5]] if role_items else 'None'}",
			"Role Sidebar Debug"
		)
		
		return role_items
		
	except Exception as e:
		import traceback
		error_msg = f"Error getting default sidebar items for role {role}: {str(e)}\n{traceback.format_exc()}"
		frappe.log_error(error_msg, "Role Sidebar Error")
		return []


@frappe.whitelist()
def save_role_sidebar(role, items):
	"""Save sidebar configuration for a role"""
	# Check if user is Administrator
	if "Administrator" not in frappe.get_roles():
		frappe.throw(_("Only Administrator can manage role sidebars"))
	
	if isinstance(items, str):
		import json
		items = json.loads(items)
	
	# Get or create role sidebar
	role_sidebar_name = frappe.db.get_value("IRT Role Sidebar", {"role": role})
	
	if role_sidebar_name:
		doc = frappe.get_doc("IRT Role Sidebar", role_sidebar_name)
	else:
		doc = frappe.get_doc({
			"doctype": "IRT Role Sidebar",
			"role": role,
			"enabled": 1
		})
	
	# Clear existing items
	doc.menu_items = []
	
	# Add new items
	for idx, item in enumerate(items, start=1):
		doc.append("menu_items", {
			"label": item.get("label"),
			"icon": item.get("icon", ""),
			"type": item.get("type", "Link"),
			"link_type": item.get("link_type"),
			"link_to": item.get("link_to"),
			"url": item.get("url", ""),
			"route": item.get("route", ""),
			"parent_item": item.get("parent_item"),
			"sequence": item.get("sequence", idx),
			"is_active": item.get("is_active", 1),
			"open_in_new_tab": item.get("open_in_new_tab", 0)
		})
	
	doc.save()
	frappe.db.commit()
	
	return {"status": "success", "name": doc.name}


@frappe.whitelist()
def update_sidebar_for_users(role):
	"""Trigger real-time update for users with this role"""
	# Get all users with this role
	users = frappe.get_all(
		"Has Role",
		filters={"role": role},
		fields=["parent"],
		distinct=True
	)
	
	user_list = [user.parent for user in users]
	
	# Broadcast update
	frappe.publish_realtime(
		"role_sidebar_updated",
		{"role": role},
		user=user_list
	)
	
	return {"status": "success", "users_notified": len(user_list)}

