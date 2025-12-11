# Copyright (c) 2025, IRT and Contributors
# License: MIT. See LICENSE

# TEMPORARILY DISABLED - Role-based sidebar management
# import frappe
# from irt_ui.api.role_sidebar import get_role_sidebar


# def boot_session(bootinfo):
# 	"""Override sidebar items based on user role"""
# 	if frappe.session.user == "Guest":
# 		return
# 	
# 	# Get user roles
# 	user_roles = frappe.get_roles()
# 	if not user_roles:
# 		return
# 	
# 	# Get the first role (since user mentioned single role assignment)
# 	# Skip automatic roles
# 	automatic_roles = ["Guest", "All", "Desk User", "Administrator"]
# 	user_role = None
# 	for role in user_roles:
# 		if role not in automatic_roles:
# 			user_role = role
# 			break
# 	
# 	if not user_role:
# 		return
# 	
# 	# Get role-based sidebar
# 	try:
# 		role_sidebar = get_role_sidebar(user_role)
# 		
# 		if role_sidebar:
# 			# Override workspace_sidebar_item with role-based sidebar
# 			# Create keys that match Frappe's expected format
# 			sidebar_key = frappe.scrub(user_role)
# 			role_lower = user_role.lower()
# 			
# 			# Replace or add role-based sidebar
# 			if not bootinfo.get("workspace_sidebar_item"):
# 				bootinfo.workspace_sidebar_item = {}
# 			
# 			# Store original sidebar items for fallback
# 			if not bootinfo.get("original_workspace_sidebar_item"):
# 				bootinfo.original_workspace_sidebar_item = bootinfo.workspace_sidebar_item.copy()
# 			
# 			# Set role-based sidebar with multiple keys for compatibility
# 			bootinfo.workspace_sidebar_item[sidebar_key] = role_sidebar
# 			bootinfo.workspace_sidebar_item[role_lower] = role_sidebar
# 			bootinfo.workspace_sidebar_item[user_role] = role_sidebar
# 			
# 			# Set as default workspace if user doesn't have one
# 			if not bootinfo.get("user") or not bootinfo.user.get("default_workspace"):
# 				# Create a default workspace entry for this role
# 				if not bootinfo.get("workspaces"):
# 					bootinfo.workspaces = {"pages": []}
# 				
# 				# Add role sidebar as a workspace page
# 				workspace_page = {
# 					"name": user_role,
# 					"title": user_role,
# 					"public": True,
# 					"module": role_sidebar.get("module", "IRT UI"),
# 					"icon": role_sidebar.get("header_icon", "folder"),
# 					"type": "Page",
# 					"link_type": "Page",
# 					"link_to": user_role
# 				}
# 				
# 				# Add to pages if not exists
# 				if workspace_page not in bootinfo.workspaces.get("pages", []):
# 					bootinfo.workspaces.setdefault("pages", []).insert(0, workspace_page)
# 				
# 				# Set as default workspace
# 				if bootinfo.get("user"):
# 					bootinfo.user["default_workspace"] = {
# 						"name": user_role,
# 						"public": True
# 					}
# 	except Exception as e:
# 		# Log error but don't break boot process
# 		frappe.log_error(f"Error loading role sidebar for {user_role}: {str(e)}", "Role Sidebar Boot Error")

