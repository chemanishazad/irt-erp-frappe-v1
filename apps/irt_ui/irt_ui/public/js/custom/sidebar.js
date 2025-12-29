/**
 * Custom Sidebar JavaScript for Role-Based Sidebars
 * Ensures role-based sidebars appear correctly when navigating
 */

(function() {
	'use strict';

	// Override sidebar setup to ensure role-based sidebars are shown
	if (frappe.ui && frappe.ui.Sidebar) {
		const Sidebar = frappe.ui.Sidebar;
		
		// Override set_workspace_sidebar to better handle role-based sidebars
		if (Sidebar.prototype.set_workspace_sidebar) {
			const original_set_workspace_sidebar = Sidebar.prototype.set_workspace_sidebar;
			
			Sidebar.prototype.set_workspace_sidebar = function(router) {
				try {
					const route = frappe.get_route();
					if (route[0] === "setup-wizard") return;
					
					// For List or Form views, find the correct sidebar
					if (route[0] === "List" || route[0] === "Form") {
						const doctype = route[1];
						const sidebars = this.get_correct_workspace_sidebars(doctype);
						
						// If we found sidebars, use the first one
						if (sidebars && sidebars.length > 0) {
							// Normalize to lowercase for lookup
							const sidebar_key = sidebars[0].toLowerCase();
							
							// Check if this sidebar exists in workspace_sidebar_item
							if (frappe.boot.workspace_sidebar_item && frappe.boot.workspace_sidebar_item[sidebar_key]) {
								this.setup(sidebar_key);
								this.set_active_workspace_item();
								return;
							}
						}
					}
					
					// Call original method for other cases
					return original_set_workspace_sidebar.call(this, router);
				} catch (e) {
					console.error("Error in set_workspace_sidebar:", e);
					// Fallback to original
					return original_set_workspace_sidebar.call(this, router);
				}
			};
		}
		
		// Override prepare to handle missing sidebar_data gracefully
		if (Sidebar.prototype.prepare) {
			const original_prepare = Sidebar.prototype.prepare;
			
			Sidebar.prototype.prepare = function() {
				try {
					const sidebar_key = this.workspace_title ? this.workspace_title.toLowerCase() : null;
					
					if (sidebar_key && frappe.boot.workspace_sidebar_item) {
						this.sidebar_data = frappe.boot.workspace_sidebar_item[sidebar_key];
						
						if (this.sidebar_data && this.sidebar_data.items) {
							this.workspace_sidebar_items = this.sidebar_data.items;
							if (this.edit_mode) {
								this.workspace_sidebar_items = this.new_sidebar_items;
							}
							this.choose_app_name();
							this.find_nested_items();
							return;
						}
					}
					
					// Fallback to original if no role-based sidebar found
					return original_prepare.call(this);
				} catch (e) {
					console.error("Error in sidebar prepare:", e);
					// Fallback to original
					return original_prepare.call(this);
				}
			};
		}
	}
	
	// Ensure sidebar is shown when route changes
	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", function() {
			// Small delay to ensure route is fully set
			setTimeout(function() {
				if (frappe.app && frappe.app.sidebar) {
					const route = frappe.get_route();
					
					// For List/Form views, ensure sidebar is shown
					if ((route[0] === "List" || route[0] === "Form") && route[1]) {
						const doctype = route[1];
						
						if (frappe.app.sidebar.get_correct_workspace_sidebars) {
							const sidebars = frappe.app.sidebar.get_correct_workspace_sidebars(doctype);
							
							if (sidebars && sidebars.length > 0) {
								const sidebar_key = sidebars[0].toLowerCase();
								
								// Check if sidebar exists and has items
								if (frappe.boot.workspace_sidebar_item && 
									frappe.boot.workspace_sidebar_item[sidebar_key] &&
									frappe.boot.workspace_sidebar_item[sidebar_key].items &&
									frappe.boot.workspace_sidebar_item[sidebar_key].items.length > 0) {
									
									// Setup sidebar if not already set
									if (frappe.app.sidebar.workspace_title !== sidebar_key) {
										frappe.app.sidebar.setup(sidebar_key);
									}
								}
							}
						}
					}
				}
			}, 100);
		});
	}
})();
