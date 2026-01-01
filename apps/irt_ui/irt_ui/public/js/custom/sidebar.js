/**
 * Custom Sidebar JavaScript for Role-Based Sidebars
 * Only activates when role-based sidebars exist
 * For users without role-based sidebars, this script does NOTHING
 */

(function() {
	'use strict';

	// Check if role-based sidebars exist
	function hasRoleBasedSidebars() {
		try {
			if (!frappe || !frappe.boot || !frappe.boot.workspace_sidebar_item) {
				return false;
			}
			
			const items = frappe.boot.workspace_sidebar_item;
			if (!items || typeof items !== 'object') {
				return false;
			}
			
			// Check if ANY sidebar has is_role_based flag set to true AND has items
			for (const key in items) {
				if (items.hasOwnProperty(key)) {
					const sidebar = items[key];
					if (sidebar && 
						sidebar.is_role_based === true && 
						Array.isArray(sidebar.items) &&
						sidebar.items.length > 0) {
						return true;
					}
				}
			}
		} catch (e) {
			return false;
		}
		return false;
	}

	// Find first role-based sidebar key
	function findFirstRoleBasedSidebar() {
		if (frappe.boot && frappe.boot.workspace_sidebar_item) {
			for (const key in frappe.boot.workspace_sidebar_item) {
				if (frappe.boot.workspace_sidebar_item.hasOwnProperty(key)) {
					const sidebar = frappe.boot.workspace_sidebar_item[key];
					if (sidebar && 
						sidebar.is_role_based === true && 
						Array.isArray(sidebar.items) &&
						sidebar.items.length > 0) {
						return key;
					}
				}
			}
		}
		return null;
	}

	// Initialize only if role-based sidebars exist
	function init() {
		// CRITICAL: If no role-based sidebars exist, do NOTHING
		// Exit immediately - let default Frappe sidebar work normally
		if (!hasRoleBasedSidebars()) {
			return;
		}

		// Only reach here if role-based sidebars exist
		// Wait for Sidebar class to be available
		if (!frappe.ui || !frappe.ui.Sidebar) {
			if (frappe.ready) {
				frappe.ready(() => {
					if (frappe.ui && frappe.ui.Sidebar && hasRoleBasedSidebars()) {
						applyMinimalOverrides();
					}
				});
			}
			return;
		}

		if (hasRoleBasedSidebars()) {
			applyMinimalOverrides();
		}
	}

	// Find default (non-role-based) sidebar for Administrator
	function findDefaultSidebarForAdmin(currentSidebar) {
		if (!currentSidebar) return null;
		
		let defaultSidebarKey = null;
		let defaultSidebarLabel = null;
		
		for (const [key, sidebar] of Object.entries(frappe.boot.workspace_sidebar_item)) {
			if (sidebar && sidebar.is_role_based !== true) {
				// Prefer sidebar with same label or module
				if (sidebar.label === currentSidebar.label || 
					sidebar.module === currentSidebar.module) {
					defaultSidebarKey = key;
					defaultSidebarLabel = sidebar.label || key;
					break;
				}
				// Otherwise, use first non-role-based sidebar as fallback
				if (!defaultSidebarKey) {
					defaultSidebarKey = key;
					defaultSidebarLabel = sidebar.label || key;
				}
			}
		}
		
		return defaultSidebarKey ? { key: defaultSidebarKey, label: defaultSidebarLabel } : null;
	}

	// Apply only minimal overrides needed for role-based sidebars
	function applyMinimalOverrides() {
		// Double-check role-based sidebars still exist
		if (!hasRoleBasedSidebars()) {
			return;
		}

		if (!frappe.ui || !frappe.ui.Sidebar) {
			return;
		}

		const Sidebar = frappe.ui.Sidebar;
		const firstRoleBasedSidebar = findFirstRoleBasedSidebar();

		// Override prepare() to handle Administrator - use default sidebars
		if (Sidebar.prototype.prepare) {
			const originalPrepare = Sidebar.prototype.prepare;
			Sidebar.prototype.prepare = function() {
				// For Administrator, skip role-based sidebars and use default sidebars
				if (frappe.session.user === "Administrator") {
					try {
						const currentSidebar = frappe.boot.workspace_sidebar_item[this.workspace_title.toLowerCase()];
						if (currentSidebar && currentSidebar.is_role_based === true) {
							// Find a default sidebar
							const defaultSidebar = findDefaultSidebarForAdmin(currentSidebar);
							if (defaultSidebar) {
								this.workspace_title = defaultSidebar.label;
								this.sidebar_data = frappe.boot.workspace_sidebar_item[defaultSidebar.key];
							} else {
								this.sidebar_data = currentSidebar;
							}
						} else {
							this.sidebar_data = frappe.boot.workspace_sidebar_item[this.workspace_title.toLowerCase()];
						}
						this.workspace_sidebar_items = this.sidebar_data.items;
						if (this.edit_mode) {
							this.workspace_sidebar_items = this.new_sidebar_items;
						}
						this.choose_app_name();
						this.find_nested_items();
					} catch (e) {
						console.log(e);
					}
				} else {
					// For non-Administrator users, use original behavior
					return originalPrepare.call(this);
				}
			};
		}

		// Override get_correct_workspace_sidebars to exclude role-based sidebars for Administrator
		if (Sidebar.prototype.get_correct_workspace_sidebars) {
			const originalGetSidebars = Sidebar.prototype.get_correct_workspace_sidebars;
			Sidebar.prototype.get_correct_workspace_sidebars = function(link_to) {
				const sidebars = originalGetSidebars.call(this, link_to);
				
				// For Administrator, filter out role-based sidebars
				if (frappe.session.user === "Administrator") {
					return sidebars.filter(sidebarName => {
						const sidebar = frappe.boot.workspace_sidebar_item[sidebarName.toLowerCase()];
						return !sidebar || sidebar.is_role_based !== true;
					});
				}
				
				return sidebars;
			};
		}

		// Override set_workspace_sidebar to use role-based sidebar for non-Administrator users
		if (Sidebar.prototype.set_workspace_sidebar && firstRoleBasedSidebar) {
			const original = Sidebar.prototype.set_workspace_sidebar;
			Sidebar.prototype.set_workspace_sidebar = function(router) {
				// For Administrator, use default behavior (skip role-based sidebars)
				if (frappe.session.user === "Administrator") {
					// Handle Administrator case - find default sidebars
					try {
						let route = frappe.get_route();
						if (route[0] == "setup-wizard") return;
						
						if (route[0] == "Workspaces") {
							let workspace = !route[1] ? "My Workspaces" : route[1];
							
							// If workspace is role-based, find default alternative
							const workspaceSidebar = frappe.boot.workspace_sidebar_item[workspace.toLowerCase()];
							if (workspaceSidebar && workspaceSidebar.is_role_based === true) {
								const defaultSidebar = findDefaultSidebarForAdmin(workspaceSidebar);
								if (defaultSidebar) {
									workspace = defaultSidebar.label;
								}
							}
							
							this.setup(workspace);
						} else if (route[0] == "List" || route[0] == "Form") {
							let doctype = route[1];
							let sidebars = this.get_correct_workspace_sidebars(doctype);
							
							if (sidebars.includes(this.workspace_title)) {
								this.setup(this.workspace_title);
								return;
							}
							
							if (sidebars.length == 0) {
								let module_name = router.meta?.module;
								if (module_name) {
									// Filter out role-based sidebars from module map
									let moduleSidebars = this.sidebar_module_map[module_name] || [];
									moduleSidebars = moduleSidebars.filter(sidebarName => {
										const sidebar = frappe.boot.workspace_sidebar_item[sidebarName.toLowerCase()];
										return !sidebar || sidebar.is_role_based !== true;
									});
									this.setup(moduleSidebars[0] || module_name);
								}
							} else {
								if (this.workspace_title && sidebars.includes(this.workspace_title.toLowerCase())) {
									this.setup(this.workspace_title.toLowerCase());
								} else {
									this.setup(sidebars[0]);
								}
							}
						} else if (route[0] == "query-report") {
							let doctype = route[1];
							let sidebars = this.get_correct_workspace_sidebars(doctype);
							if (this.workspace_title && sidebars.includes(this.workspace_title.toLowerCase())) {
								this.setup(this.workspace_title.toLowerCase());
							} else {
								this.setup(sidebars[0]);
							}
						}
					} catch (e) {
						console.log(e);
					}
					
					this.set_active_workspace_item();
					return;
				}
				
				// For non-Administrator users, use role-based sidebar
				if (hasRoleBasedSidebars() && firstRoleBasedSidebar) {
					const role_sidebar = frappe.boot.workspace_sidebar_item?.[firstRoleBasedSidebar];
					if (role_sidebar && role_sidebar.is_role_based && role_sidebar.items && role_sidebar.items.length > 0) {
						// Use the label from sidebar data to preserve the case (e.g., "HRMS" instead of lowercase key)
						const sidebarTitle = role_sidebar.label || firstRoleBasedSidebar;
						this.setup(sidebarTitle);
						this.set_active_workspace_item();
						return;
					}
				}
				// Fallback to default behavior
				return original.call(this, router);
			};
		}
	}

	// Initialize when ready
	if (typeof frappe === 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				setTimeout(init, 100);
			});
		} else {
			setTimeout(init, 100);
		}
	} else if (frappe.boot) {
		init();
	} else {
		if (frappe.ready) {
			frappe.ready(() => {
				init();
			});
		}
	}
})();
