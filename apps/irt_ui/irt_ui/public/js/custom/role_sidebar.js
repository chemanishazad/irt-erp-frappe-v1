/**
 * Role-Based Sidebar Override
 * Overrides Frappe's default sidebar to use role-based menu items
 */

(function() {
	let role_sidebar_initialized = false;

	function init_role_sidebar() {
		if (role_sidebar_initialized) return;
		if (!frappe.boot || !frappe.boot.workspace_sidebar_item) return;

		role_sidebar_initialized = true;

		// Override sidebar setup to use role-based data
		override_sidebar_setup();

		// Listen for real-time updates
		setup_realtime_listener();
	}

	function override_sidebar_setup() {
		// Store original sidebar prepare method
		if (frappe.ui.Sidebar && frappe.ui.Sidebar.prototype) {
			const original_prepare = frappe.ui.Sidebar.prototype.prepare;

			frappe.ui.Sidebar.prototype.prepare = function() {
				// Check if workspace_title is set to a role (for preview)
				let role_to_check = null;
				let role_sidebar_data = null;
				
				if (this.workspace_title && frappe.boot.workspace_sidebar_item) {
					// Try multiple key formats
					const role_key = frappe.scrub(this.workspace_title);
					const role_lower = this.workspace_title.toLowerCase();
					
					role_sidebar_data = frappe.boot.workspace_sidebar_item[role_lower] ||
										frappe.boot.workspace_sidebar_item[role_key] ||
										frappe.boot.workspace_sidebar_item[this.workspace_title];
					
					if (role_sidebar_data) {
						role_to_check = this.workspace_title;
					}
				}
				
				// If not preview mode, get user role (skip automatic roles)
				if (!role_to_check) {
					const user_roles = frappe.boot.user ? frappe.boot.user.roles : [];
					if (!user_roles || user_roles.length === 0) {
						return original_prepare.call(this);
					}

					const automatic_roles = ["Guest", "All", "Desk User", "Administrator"];
					for (let role of user_roles) {
						if (automatic_roles.indexOf(role) === -1) {
							const role_key = frappe.scrub(role);
							const role_lower = role.toLowerCase();
							
							role_sidebar_data = frappe.boot.workspace_sidebar_item[role_lower] ||
												frappe.boot.workspace_sidebar_item[role_key] ||
												frappe.boot.workspace_sidebar_item[role];
							
							if (role_sidebar_data) {
								role_to_check = role;
								break;
							}
						}
					}
				}

				if (role_sidebar_data && role_to_check) {
					try {
						console.log('Loading role-based sidebar for:', role_to_check);
						console.log('Sidebar data structure:', role_sidebar_data);
						
						this.sidebar_data = role_sidebar_data;
						this.workspace_sidebar_items = this.sidebar_data.items || [];
						this.workspace_title = role_to_check; // Ensure workspace_title is set
						
						// Also set in boot data with lowercase key (Frappe's default format)
						if (!frappe.boot.workspace_sidebar_item[role_to_check.toLowerCase()]) {
							frappe.boot.workspace_sidebar_item[role_to_check.toLowerCase()] = role_sidebar_data;
						}
						
						if (this.edit_mode) {
							this.workspace_sidebar_items = this.new_sidebar_items;
						}
						
						this.choose_app_name();
						this.find_nested_items();
						
						console.log('Prepared sidebar items:', this.workspace_sidebar_items.length);
						
						return; // Return early to use role-based sidebar
					} catch (e) {
						console.warn('Error loading role-based sidebar:', e);
						console.error('Error details:', e.stack);
					}
				}

				// Fallback to original method
				return original_prepare.call(this);
			};

			// Override setup method to use role-based workspace
			const original_setup = frappe.ui.Sidebar.prototype.setup;
			frappe.ui.Sidebar.prototype.setup = function(workspace_title) {
				console.log('Sidebar.setup called with workspace_title:', workspace_title);
				
				// Check if workspace_title is a role name (for preview)
				if (workspace_title && frappe.boot.workspace_sidebar_item) {
					const role_key = frappe.scrub(workspace_title);
					const role_lower = workspace_title.toLowerCase();
					const role_sidebar = frappe.boot.workspace_sidebar_item[role_lower] ||
										frappe.boot.workspace_sidebar_item[role_key] ||
										frappe.boot.workspace_sidebar_item[workspace_title];
					
					if (role_sidebar) {
						console.log('Found role-based sidebar for:', workspace_title);
						// This is a role-based sidebar, use it
						this.workspace_title = workspace_title;
						return original_setup.call(this, workspace_title);
					}
				}
				
				// Get user role for normal operation
				const user_roles = frappe.boot.user ? frappe.boot.user.roles : [];
				const automatic_roles = ["Guest", "All", "Desk User", "Administrator"];
				let user_role = null;
				for (let role of user_roles) {
					if (automatic_roles.indexOf(role) === -1) {
						user_role = role;
						break;
					}
				}

				// If user has a role-based sidebar, use it
				if (user_role && frappe.boot.workspace_sidebar_item) {
					const role_key = frappe.scrub(user_role);
					const role_lower = user_role.toLowerCase();
					const role_sidebar = frappe.boot.workspace_sidebar_item[role_lower] ||
										frappe.boot.workspace_sidebar_item[role_key] ||
										frappe.boot.workspace_sidebar_item[user_role];
					
					if (role_sidebar) {
						console.log('Using user role sidebar:', user_role);
						// Use role name as workspace title
						workspace_title = user_role;
					}
				}

				return original_setup.call(this, workspace_title);
			};
		}
	}

	function setup_realtime_listener() {
		if (typeof frappe.realtime === 'undefined') return;

		frappe.realtime.on('role_sidebar_updated', function(data) {
			if (data && data.role) {
				const user_roles = frappe.boot.user ? frappe.boot.user.roles : [];
				if (user_roles.includes(data.role)) {
					// Reload sidebar for this user
					reload_role_sidebar(data.role);
				}
			}
		});
	}

	function reload_role_sidebar(role) {
		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_role_sidebar',
			args: { role: role },
			callback: function(r) {
				if (r.message) {
					const role_key = frappe.scrub(role);
					
					// Update boot data
					if (!frappe.boot.workspace_sidebar_item) {
						frappe.boot.workspace_sidebar_item = {};
					}
					frappe.boot.workspace_sidebar_item[role_key] = r.message;

					// Reload sidebar if it exists
					if (frappe.app && frappe.app.sidebar) {
						const current_workspace = frappe.app.sidebar.workspace_title;
						if (current_workspace) {
							frappe.app.sidebar.setup(current_workspace);
						}
					}

					frappe.show_alert({
						message: __('Sidebar updated'),
						indicator: 'blue'
					}, 2);
				}
			}
		});
	}

	// Enhanced sidebar item rendering for sub-menus
	function enhance_sidebar_rendering() {
		if (!frappe.ui.SidebarItem) return;

		// Override sidebar item rendering to support child items
		const original_make = frappe.ui.SidebarItem.prototype.make;

		frappe.ui.SidebarItem.prototype.make = function() {
			original_make.call(this);

			// Add support for child_items
			if (this.item.child_items && this.item.child_items.length > 0) {
				this.add_child_items();
			}
		};

		frappe.ui.SidebarItem.prototype.add_child_items = function() {
			if (!this.item.child_items || this.item.child_items.length === 0) return;

			const $parent = this.$item || $(this);
			if (!$parent.length) return;

			// Create container for child items
			let $child_container = $parent.find('.sidebar-child-items');
			if (!$child_container.length) {
				$child_container = $('<div class="sidebar-child-items"></div>');
				$parent.append($child_container);
			}

			// Add child items
			this.item.child_items.forEach((child) => {
				const $child = $(`
					<a href="${child.url || '#'}" 
					   class="sidebar-child-item ${child.open_in_new_tab ? 'external-link' : ''}"
					   ${child.open_in_new_tab ? 'target="_blank"' : ''}>
						${child.icon ? `<i class="${child.icon}"></i>` : ''}
						<span class="sidebar-item-label">${child.label || ''}</span>
					</a>
				`);
				$child_container.append($child);
			});
		};
	}

	// Function to ensure sidebar loads with role-based workspace
	function ensure_role_sidebar_loaded() {
		if (!frappe.app || !frappe.app.sidebar) return;

		const user_roles = frappe.boot.user ? frappe.boot.user.roles : [];
		const automatic_roles = ["Guest", "All", "Desk User", "Administrator"];
		let user_role = null;
		
		for (let role of user_roles) {
			if (automatic_roles.indexOf(role) === -1) {
				user_role = role;
				break;
			}
		}

		if (user_role && frappe.boot.workspace_sidebar_item) {
			const role_key = frappe.scrub(user_role);
			const role_lower = user_role.toLowerCase();
			const role_sidebar = frappe.boot.workspace_sidebar_item[role_key] || 
								frappe.boot.workspace_sidebar_item[role_lower] ||
								frappe.boot.workspace_sidebar_item[user_role];
			
			if (role_sidebar && frappe.app.sidebar.workspace_title !== user_role) {
				// Set the workspace to use role-based sidebar
				frappe.app.sidebar.setup(user_role);
			}
		}
	}

	// Expose function to refresh sidebar for a specific role
	window.refresh_role_sidebar = function(role) {
		if (!role) return;
		
		console.log('Refreshing sidebar for role:', role);
		
		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_role_sidebar',
			args: { role: role },
			callback: function(r) {
				if (r.message) {
					const role_key = frappe.scrub(role);
					const role_lower = role.toLowerCase();
					
					// Update boot data
					if (!frappe.boot.workspace_sidebar_item) {
						frappe.boot.workspace_sidebar_item = {};
					}
					frappe.boot.workspace_sidebar_item[role_key] = r.message;
					frappe.boot.workspace_sidebar_item[role_lower] = r.message;
					frappe.boot.workspace_sidebar_item[role] = r.message;
					
					// Reload sidebar if current user has this role
					const user_roles = frappe.boot.user ? frappe.boot.user.roles : [];
					if (user_roles.includes(role) && frappe.app && frappe.app.sidebar) {
						try {
							frappe.app.sidebar.setup(role);
							console.log('✓ Sidebar refreshed for role:', role);
						} catch (e) {
							console.warn('Error refreshing sidebar:', e);
						}
					} else {
						console.log('User does not have role', role, 'or sidebar not available');
					}
				} else {
					console.warn('No sidebar data returned for role:', role);
				}
			},
			error: function(r) {
				console.error('Error refreshing sidebar:', r);
			}
		});
	};

	// Initialize when Frappe is ready
	if (typeof frappe !== 'undefined') {
		frappe.ready(function() {
			setTimeout(init_role_sidebar, 500);
			setTimeout(enhance_sidebar_rendering, 500);
			setTimeout(ensure_role_sidebar_loaded, 1000);
		});

		// Also listen for route changes
		if (frappe.router && frappe.router.on) {
			frappe.router.on('change', function() {
				setTimeout(ensure_role_sidebar_loaded, 300);
			});
		}
	}

	// Also initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(init_role_sidebar, 500);
			setTimeout(ensure_role_sidebar_loaded, 1000);
		});
	} else {
		setTimeout(init_role_sidebar, 500);
		setTimeout(ensure_role_sidebar_loaded, 1000);
	}
})();

