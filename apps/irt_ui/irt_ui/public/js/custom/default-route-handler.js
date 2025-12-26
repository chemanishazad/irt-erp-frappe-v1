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
	
	// REMOVED: pageview.show override - was interfering with dashboard routing
	// REMOVED: pageview.with_page override - was interfering with dashboard routing  
	// REMOVED: router.render override - was interfering with default dashboard
	
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
	function initDashboardRouteHandler() {
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
	}

	// Initialize when Frappe is ready, or immediately if already available
	if (typeof frappe !== 'undefined' && frappe.ready) {
		frappe.ready(initDashboardRouteHandler);
	} else {
		// Wait for Frappe to be available
		$(document).ready(function() {
			if (typeof frappe !== 'undefined') {
				initDashboardRouteHandler();
			}
		});
	}

	// Remove workflow_state filter from URL for Employee Onboarding Case
	// Note: Filter will still be applied and shown in badges, but won't appear in URL
	if (frappe.views && frappe.views.ListView) {
		const ListView = frappe.views.ListView;
		const DOCTYPE_TO_FIX = 'Employee Onboarding Case';
		const FILTER_TO_REMOVE = 'workflow_state';

		// Override get_search_params to exclude workflow_state from URL
		if (ListView.prototype.get_search_params) {
			const original_get_search_params = ListView.prototype.get_search_params;
			ListView.prototype.get_search_params = function() {
				const search_params = original_get_search_params.call(this);
				
				// Remove workflow_state from URL params for Employee Onboarding Case
				// This prevents it from being added to URL, but filter will still be applied
				if (this.doctype === DOCTYPE_TO_FIX && search_params.has(FILTER_TO_REMOVE)) {
					search_params.delete(FILTER_TO_REMOVE);
				}
				
				return search_params;
			};
		}

		// Clean up URL on page load and after filter updates if workflow_state is present
		function cleanupWorkflowStateFromURL() {
			const route = frappe.get_route();
			const routeStr = frappe.get_route_str();
			const isOnboardingCase = route && (
				route[1] === 'employee-onboarding-case' || 
				route[1] === 'Employee Onboarding Case' ||
				routeStr.includes('employee-onboarding-case')
			);
			
			if (isOnboardingCase) {
				const urlParams = new URLSearchParams(window.location.search);
				if (urlParams.has(FILTER_TO_REMOVE)) {
					urlParams.delete(FILTER_TO_REMOVE);
					const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
					window.history.replaceState(null, null, newUrl);
				}
			}
		}

		function initWorkflowStateURLCleanup() {
			cleanupWorkflowStateFromURL();
			
			// Also clean up after URL updates
			if (ListView.prototype.update_url_with_filters) {
				const original_update_url = ListView.prototype.update_url_with_filters;
				ListView.prototype.update_url_with_filters = function() {
					const result = original_update_url.apply(this, arguments);
					if (this.doctype === DOCTYPE_TO_FIX) {
						setTimeout(cleanupWorkflowStateFromURL, 50);
					}
					return result;
				};
			}
		}

		// Initialize when Frappe is ready, or immediately if already available
		if (typeof frappe !== 'undefined' && frappe.ready) {
			frappe.ready(initWorkflowStateURLCleanup);
		} else {
			// Wait for Frappe to be available
			$(document).ready(function() {
				if (typeof frappe !== 'undefined') {
					initWorkflowStateURLCleanup();
				}
			});
		}
	}
})();

