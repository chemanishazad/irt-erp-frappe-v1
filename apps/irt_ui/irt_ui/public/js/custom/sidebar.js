/**
 * Custom Sidebar JavaScript for Role-Based Sidebars
 * Ensures role-based sidebars persist and header stays visible when navigating
 */

(function() {
	'use strict';

	// Track current role-based sidebar - persist across navigation
	let current_role_based_sidebar = null;
	let role_based_sidebar_initialized = false;

	// Initialize role-based sidebar on page load
	function initializeRoleBasedSidebar() {
		if (role_based_sidebar_initialized) return;
		
		if (frappe.boot && frappe.boot.workspace_sidebar_item) {
			// Find first role-based sidebar
			for (const [key, sidebar_data] of Object.entries(frappe.boot.workspace_sidebar_item)) {
				if (sidebar_data.is_role_based && sidebar_data.items && sidebar_data.items.length > 0) {
					current_role_based_sidebar = key;
					role_based_sidebar_initialized = true;
					
					// Set it immediately if sidebar exists
					if (frappe.app && frappe.app.sidebar) {
						frappe.app.sidebar.setup(key);
					}
					break;
				}
			}
		}
	}

	// Initialize when boot is ready
	if (frappe.boot) {
		initializeRoleBasedSidebar();
	} else {
		frappe.ready(() => {
			initializeRoleBasedSidebar();
		});
	}

	// Override sidebar prepare to handle missing sidebar_data gracefully
	if (frappe.ui && frappe.ui.Sidebar) {
		const Sidebar = frappe.ui.Sidebar;
		
		if (Sidebar.prototype.prepare) {
			const original_prepare = Sidebar.prototype.prepare;
			
			Sidebar.prototype.prepare = function() {
				try {
					// If we have a role-based sidebar, always use it
					if (current_role_based_sidebar && frappe.boot.workspace_sidebar_item) {
						const role_sidebar = frappe.boot.workspace_sidebar_item[current_role_based_sidebar];
						if (role_sidebar && role_sidebar.is_role_based) {
							this.sidebar_data = role_sidebar;
							this.workspace_sidebar_items = role_sidebar.items || [];
							
							if (this.edit_mode) {
								this.workspace_sidebar_items = this.new_sidebar_items;
							}
							
							this.choose_app_name();
							this.find_nested_items();
							return;
						}
					}
					
					// Fallback to original logic
					this.sidebar_data = null;
					const sidebar_key = this.workspace_title ? this.workspace_title.toLowerCase() : null;
					
					if (sidebar_key && frappe.boot.workspace_sidebar_item) {
						this.sidebar_data = frappe.boot.workspace_sidebar_item[sidebar_key];
						
						// Check if this is a role-based sidebar
						if (this.sidebar_data && this.sidebar_data.is_role_based) {
							current_role_based_sidebar = sidebar_key;
							role_based_sidebar_initialized = true;
						}
					}
					
					// Ensure sidebar_data exists even if empty
					if (!this.sidebar_data) {
						this.sidebar_data = { items: [] };
					}
					
					// Ensure items array exists
					if (!this.sidebar_data.items) {
						this.sidebar_data.items = [];
					}
					
					// Now safely access items
					this.workspace_sidebar_items = this.sidebar_data.items;
					
					if (this.edit_mode) {
						this.workspace_sidebar_items = this.new_sidebar_items;
					}
					
					this.choose_app_name();
					this.find_nested_items();
				} catch (e) {
					console.error("Error in sidebar prepare:", e);
					// Ensure safe defaults on error
					if (!this.sidebar_data) {
						this.sidebar_data = { items: [] };
					}
					if (!this.workspace_sidebar_items) {
						this.workspace_sidebar_items = [];
					}
					// Fallback to original
					return original_prepare.call(this);
				}
			};
		}

		// Override set_workspace_sidebar to ALWAYS use role-based sidebar
		if (Sidebar.prototype.set_workspace_sidebar) {
			const original_set_workspace_sidebar = Sidebar.prototype.set_workspace_sidebar;
			
			Sidebar.prototype.set_workspace_sidebar = function(router) {
				try {
					// ALWAYS use role-based sidebar if available
					if (current_role_based_sidebar && frappe.boot.workspace_sidebar_item) {
						const role_sidebar = frappe.boot.workspace_sidebar_item[current_role_based_sidebar];
						if (role_sidebar && role_sidebar.is_role_based && role_sidebar.items && role_sidebar.items.length > 0) {
							this.setup(current_role_based_sidebar);
							this.set_active_workspace_item();
							return;
						}
					}
					
					// If no role-based sidebar set yet, find one
					if (!current_role_based_sidebar && frappe.boot.workspace_sidebar_item) {
						for (const [key, sidebar_data] of Object.entries(frappe.boot.workspace_sidebar_item)) {
							if (sidebar_data.is_role_based && sidebar_data.items && sidebar_data.items.length > 0) {
								current_role_based_sidebar = key;
								role_based_sidebar_initialized = true;
								this.setup(key);
								this.set_active_workspace_item();
								return;
							}
						}
					}
					
					// Fallback to original only if no role-based sidebar exists
					return original_set_workspace_sidebar.call(this, router);
				} catch (e) {
					console.error("Error in set_workspace_sidebar:", e);
					// Still try to use role-based sidebar on error
					if (current_role_based_sidebar && frappe.boot.workspace_sidebar_item) {
						const role_sidebar = frappe.boot.workspace_sidebar_item[current_role_based_sidebar];
						if (role_sidebar && role_sidebar.is_role_based) {
							this.setup(current_role_based_sidebar);
							this.set_active_workspace_item();
							return;
						}
					}
					return original_set_workspace_sidebar.call(this, router);
				}
			};
		}

		// Override setup to ALWAYS maintain role-based sidebar
		if (Sidebar.prototype.setup) {
			const original_setup = Sidebar.prototype.setup;
			
			Sidebar.prototype.setup = function(sidebar_key) {
				// If we have a role-based sidebar, don't switch away from it
				if (current_role_based_sidebar && sidebar_key !== current_role_based_sidebar) {
					// Check if the requested sidebar is a role-based sidebar
					if (frappe.boot.workspace_sidebar_item && frappe.boot.workspace_sidebar_item[sidebar_key]) {
						const requested_sidebar = frappe.boot.workspace_sidebar_item[sidebar_key];
						if (requested_sidebar.is_role_based) {
							// It's a role-based sidebar, allow the switch
							current_role_based_sidebar = sidebar_key;
							role_based_sidebar_initialized = true;
						} else {
							// It's not a role-based sidebar, keep using our role-based sidebar
							return original_setup.call(this, current_role_based_sidebar);
						}
					} else {
						// Requested sidebar not found, keep using role-based sidebar
						return original_setup.call(this, current_role_based_sidebar);
					}
				}
				
				// Check if this is a role-based sidebar
				if (frappe.boot.workspace_sidebar_item && frappe.boot.workspace_sidebar_item[sidebar_key]) {
					const sidebar_data = frappe.boot.workspace_sidebar_item[sidebar_key];
					if (sidebar_data.is_role_based) {
						current_role_based_sidebar = sidebar_key;
						role_based_sidebar_initialized = true;
					}
				}
				
				return original_setup.call(this, sidebar_key);
			};
		}
	}
})();
