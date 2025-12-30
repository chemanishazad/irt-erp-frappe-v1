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
	
	// Helper function to normalize route format
	function normalizeRoute(route) {
		if (!route) return route;
		
		// Convert desk# format to /desk/ format
		let normalized = route;
		if (normalized.startsWith("desk#")) {
			normalized = normalized.replace("desk#", "/desk/");
		} else if (normalized.startsWith("/desk#")) {
			normalized = normalized.replace("/desk#", "/desk/");
		}
		
		// For dashboard-view routes, convert underscores back to spaces in dashboard name
		// Format: /desk/dashboard-view/dashboard_name_with_underscores
		if (normalized.includes("/dashboard-view/")) {
			const parts = normalized.split("/dashboard-view/");
			if (parts.length === 2) {
				const dashboard_part = parts[1];
				// Convert underscores to spaces for dashboard names
				const dashboard_name = dashboard_part.replace(/_/g, " ");
				normalized = `${parts[0]}/dashboard-view/${dashboard_name}`;
			}
		}
		
		return normalized;
	}
	
	// Helper function to convert route to Frappe's route array format
	function routeToArray(route) {
		if (!route) return [];
		
		// Remove leading /desk/ or /app/ if present
		let clean_route = route.replace(/^\/?(desk|app)\//, "");
		
		// For dashboard-view routes, preserve spaces in dashboard name
		// Format: dashboard-view/Dashboard Name (with spaces)
		if (clean_route.startsWith("dashboard-view/")) {
			const dashboard_part = clean_route.replace("dashboard-view/", "");
			// Return array with "dashboard-view" and the full dashboard name (with spaces)
			return ["dashboard-view", dashboard_part];
		}
		
		// For other routes, split by / to get route parts
		const parts = clean_route.split("/").filter(p => p);
		
		return parts;
	}
	
	// Handle role-based home_page routing on initial load
	function handleRoleBasedHomePage() {
		if (!frappe.boot || !frappe.boot.home_page) return false;
		
		const home_page = frappe.boot.home_page;
		
		// Normalize the route (convert desk# to /desk/ and handle spaces)
		const normalized_route = normalizeRoute(home_page);
		
		// Check if home_page is in desk# or /desk/ format
		if (normalized_route.startsWith("/desk/")) {
			// Extract route after /desk/
			const route_part = normalized_route.replace(/^\/desk\//, "");
			
			// Navigate to the route
			if (route_part) {
				const route_array = routeToArray(route_part);
				frappe.set_route(...route_array);
				return true;
			}
		}
		
		// Check if it's a standard route that should be handled directly
		if (isStandardRoute(home_page)) {
			const route_array = routeToArray(normalized_route);
			if (route_array.length > 0) {
				frappe.set_route(...route_array);
				return true;
			}
		}
		
		return false;
	}
	
	// Force redirect on initial page load if home_page is set
	function forceInitialRedirect() {
		if (!frappe.boot || !frappe.boot.home_page) return;
		
		const home_page = frappe.boot.home_page;
		const current_route = frappe.get_route();
		
		// Only redirect if we're on default desk/home route
		const is_default_route = current_route.length === 0 || 
			(current_route.length === 1 && current_route[0] === "desk") ||
			(current_route.length === 2 && current_route[0] === "desk" && current_route[1] === "home");
		
		if (is_default_route && home_page && home_page !== "desktop" && home_page !== "home") {
			// Normalize the route (convert desk# to /desk/ and handle spaces)
			const normalized_route = normalizeRoute(home_page);
			
			// Handle desk# or /desk/ routes
			if (normalized_route.startsWith("/desk/")) {
				const route_part = normalized_route.replace(/^\/desk\//, "");
				if (route_part) {
					const route_array = routeToArray(route_part);
					if (route_array.length > 0) {
						frappe.set_route(...route_array);
						return;
					}
				}
			}
			
			// Handle standard routes
			if (isStandardRoute(home_page)) {
				const route_array = routeToArray(normalized_route);
				if (route_array.length > 0) {
					frappe.set_route(...route_array);
					return;
				}
			}
		}
	}
	
	// Override router render to handle role-based home_page on initial load
	if (frappe.router && frappe.router.render) {
		const original_render = frappe.router.render;
		
		frappe.router.render = function() {
			// Check if we're on the default desk route and should redirect
			const current_route = frappe.get_route();
			const is_default_desk = current_route.length === 0 || 
				(current_route.length === 1 && current_route[0] === "desk") ||
				(current_route.length === 2 && current_route[0] === "desk" && current_route[1] === "home");
			
			if (is_default_desk && frappe.boot && frappe.boot.home_page) {
				// Try to handle role-based home_page
				if (handleRoleBasedHomePage()) {
					return; // Route handled, don't show default desktop
				}
			}
			
			// Call original render
			return original_render.call(this);
		};
	}
	
	// Also handle on desk.js load_bootinfo as fallback
	if (frappe.desk && frappe.desk.load_bootinfo) {
		const original_load_bootinfo = frappe.desk.load_bootinfo;
		
		frappe.desk.load_bootinfo = function() {
			original_load_bootinfo.call(this);
			
			// After bootinfo is loaded, check for role-based home_page
			setTimeout(() => {
				forceInitialRedirect();
			}, 300);
		};
	}
	
	// Also handle on app startup
	if (frappe.ready) {
		frappe.ready(function() {
			setTimeout(forceInitialRedirect, 500);
		});
	}
	
	// Handle on route change to catch initial load
	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", function() {
			setTimeout(forceInitialRedirect, 100);
		});
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

