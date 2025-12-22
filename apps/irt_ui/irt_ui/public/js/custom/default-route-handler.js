// Copyright (c) 2025, IRT and Contributors
// Handle standard routes as default routing (no is_custom checkbox needed)

(function() {
	'use strict';
	
	// Standard Frappe routes that should work as default routing
	const standard_routes = [
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
	];
	
	// Helper to check if a name is a standard route
	function isStandardRoute(name) {
		if (!name) return false;
		const route_first_part = name.split("/")[0];
		return standard_routes.includes(route_first_part);
	}
	
	// Override pageview.show to handle standard routes correctly
	if (frappe.views && frappe.views.pageview && frappe.views.pageview.show) {
		const original_show = frappe.views.pageview.show;
		
		frappe.views.pageview.show = function(page_name) {
			// Get the actual page name (might be empty, use boot.home_page)
			let name = page_name;
			if (!name && frappe.boot && frappe.boot.home_page) {
				name = frappe.boot.home_page;
			}
			
			// If it's a standard route (contains / and starts with standard route), use router instead
			if (name && isStandardRoute(name)) {
				// This is a standard route - use frappe.set_route instead of pageview.show
				frappe.set_route(name);
				return;
			}
			
			// Use original function for standard pages
			return original_show.call(this, page_name);
		};
	}
	
	// Override pageview.with_page to handle standard routes
	if (frappe.views && frappe.views.pageview && frappe.views.pageview.with_page) {
		const original_with_page = frappe.views.pageview.with_page;
		
		frappe.views.pageview.with_page = function(name, callback) {
			// If it's a standard route, don't try to load as Page
			if (name && isStandardRoute(name)) {
				// Standard routes are handled by router, just call callback
				if (callback) callback();
				return;
			}
			
			// Use original function for standard pages
			return original_with_page.call(this, name, callback);
		};
	}
	
	// Override router.render to handle home_page routes correctly
	if (frappe.router && frappe.router.render) {
		const original_render = frappe.router.render;
		
		frappe.router.render = function() {
			// If no route and home_page is a standard route, set it
			if (!this.current_route || this.current_route.length === 0) {
				if (frappe.boot && frappe.boot.home_page && isStandardRoute(frappe.boot.home_page)) {
					// Home page is a standard route - navigate to it
					frappe.set_route(frappe.boot.home_page);
					return;
				}
			}
			
			// Use original function
			return original_render.call(this);
		};
	}
	
	// Override sidebar item get_path to ensure Dashboard links include dashboard name
	if (frappe.ui && frappe.ui.sidebar_item && frappe.ui.sidebar_item.TypeLink) {
		const TypeLink = frappe.ui.sidebar_item.TypeLink;
		const original_get_path = TypeLink.prototype.get_path;
		
		TypeLink.prototype.get_path = function() {
			const path = original_get_path.call(this);
			
			// Fix for Dashboard link type - ensure dashboard name is included
			if (this.item && this.item.type === "Link" && this.item.link_type === "Dashboard" && this.item.link_to) {
				// If path doesn't include the dashboard name, regenerate it
				if (!path || path === "dashboard-view" || !path.includes(this.item.link_to)) {
					const dashboard_route = `dashboard-view/${this.item.link_to}`;
					return dashboard_route;
				}
			}
			
			return path;
		};
	}
	
	// Override generate_route to ensure Dashboard type always includes name
	if (frappe.utils && frappe.utils.generate_route) {
		const original_generate_route = frappe.utils.generate_route;
		
		frappe.utils.generate_route = function(item) {
			// Ensure Dashboard type includes the name
			if (item && item.type && item.type.toLowerCase() === "dashboard" && item.name) {
				const route = `dashboard-view/${item.name}`;
				return route;
			}
			
			// Use original function for other types
			return original_generate_route.call(this, item);
		};
	}
	
	// Intercept sidebar item clicks to fix Dashboard routes
	frappe.ready(function() {
		// Use event delegation to catch all sidebar item clicks
		$(document).on('click', '.sidebar-item-container a.item-anchor[href*="dashboard-view"]', function(e) {
			const href = $(this).attr('href');
			
			// If href is just "dashboard-view" without dashboard name, try to get it from data attributes
			if (href === 'dashboard-view' || href === '/desk/dashboard-view' || href.endsWith('/dashboard-view')) {
				e.preventDefault();
				
				// Try to find the dashboard name from the sidebar item data
				const $container = $(this).closest('.sidebar-item-container');
				const itemName = $container.attr('item-name');
				
				// Get dashboard name from workspace sidebar items
				if (frappe.boot && frappe.boot.workspace_sidebar_item) {
					// Find the sidebar item that matches this container
					for (const sidebarKey in frappe.boot.workspace_sidebar_item) {
						const sidebar = frappe.boot.workspace_sidebar_item[sidebarKey];
						if (sidebar.items) {
							for (const item of sidebar.items) {
								if (item.label === itemName && item.link_type === "Dashboard" && item.link_to) {
									// Found the dashboard - navigate to it
									frappe.set_route(`dashboard-view/${item.link_to}`);
									return;
								}
							}
						}
					}
				}
				
				// If we can't find it, just navigate to dashboard-view (will show default)
				frappe.set_route('dashboard-view');
			}
		});
	});
})();
