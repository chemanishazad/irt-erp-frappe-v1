// Copyright (c) 2025, IRT and Contributors
// License: MIT. See LICENSE

frappe.ui.form.on('IRT Role Sidebar', {
	refresh(frm) {
		// Add button to load default items
		if (frm.doc.role) {
			frm.add_custom_button(__('Load Default Items'), function() {
				load_default_items(frm, true);
			});
		}
		
		// Update sidebar preview when form loads
		if (frm.doc.role && frm.doc.menu_items && frm.doc.menu_items.length > 0) {
			// Update preview with current form data
			setTimeout(function() {
				preview_sidebar_from_form(frm);
			}, 500);
		} else if (frm.doc.role && frm.doc.enabled && !frm.is_new()) {
			// Load saved sidebar data
			update_sidebar_preview(frm.doc.role);
		}
	},

	role(frm) {
		// Auto-load default items when role is selected
		if (frm.doc.role) {
			console.log('=== Role selected:', frm.doc.role, '===');
			
			// Store previous role to detect role change
			const previous_role = frm._previous_role || null;
			frm._previous_role = frm.doc.role;
			
			// If role changed and we have items, ask user
			if (previous_role && previous_role !== frm.doc.role && frm.doc.menu_items && frm.doc.menu_items.length > 0) {
				frappe.confirm(
					__('Role changed from {0} to {1}. Load default items for {1}? This will replace existing items.', [previous_role, frm.doc.role]),
					function() {
						// User confirmed - load default items
						frappe.show_alert({
							message: __('Loading default sidebar items for {0}...', [frm.doc.role]),
							indicator: 'blue'
						}, 2);
						setTimeout(function() {
							load_default_items(frm, false);
						}, 300);
					},
					function() {
						// User cancelled - just update preview with existing items
						setTimeout(function() {
							preview_sidebar_from_form(frm);
						}, 300);
					}
				);
			} else if (frm.is_new() || !frm.doc.menu_items || frm.doc.menu_items.length === 0) {
				// New record or empty table - load default items
				frappe.show_alert({
					message: __('Loading default sidebar items for {0}...', [frm.doc.role]),
					indicator: 'blue'
				}, 2);
				
				setTimeout(function() {
					load_default_items(frm, false);
				}, 300);
			} else {
				// Role selected but items exist - load from saved data OR update preview
				// First check if we have saved data for this role
				frappe.call({
					method: 'irt_ui.api.role_sidebar.get_role_sidebar',
					args: { role: frm.doc.role },
					callback: function(r) {
						if (r.message && r.message.items && r.message.items.length > 0) {
							// Load saved items for this role
							console.log('Loading saved items for role:', frm.doc.role);
							frm.clear_table('menu_items');
							
							r.message.items.forEach(function(item, index) {
								let row = frm.add_child('menu_items');
								row.label = item.label || '';
								row.icon = item.icon || '';
								row.type = item.type || 'Link';
								row.link_type = item.link_type || 'DocType';
								row.link_to = item.link_to || '';
								row.url = item.url || '#';
								row.sequence = item.sequence || (index + 1);
								row.is_active = item.is_active !== undefined ? item.is_active : 1;
								row.open_in_new_tab = item.open_in_new_tab || 0;
							});
							
							frm.refresh_field('menu_items');
							
							// Update sidebar preview
							setTimeout(function() {
								preview_sidebar_from_form(frm);
							}, 500);
						} else {
							// No saved data - just update preview with existing items
							setTimeout(function() {
								preview_sidebar_from_form(frm);
							}, 300);
						}
					},
					error: function() {
						// On error, just update preview
						setTimeout(function() {
							preview_sidebar_from_form(frm);
						}, 300);
					}
				});
			}
		}
	},
	
	menu_items(frm) {
		// Update sidebar preview when menu items change
		if (frm.doc.role && frm.doc.menu_items && frm.doc.menu_items.length > 0) {
			setTimeout(function() {
				preview_sidebar_from_form(frm);
			}, 500);
		}
	},

	after_save(frm) {
		// Update sidebar in real-time after save
		if (frm.doc.role && frm.doc.enabled) {
			update_sidebar_preview(frm.doc.role);
			
			// Trigger real-time update
			frappe.call({
				method: 'irt_ui.api.role_sidebar.update_sidebar_for_users',
				args: { role: frm.doc.role },
				callback: function(r) {
					frappe.show_alert({
						message: __('Sidebar updated for all users with {0} role', [frm.doc.role]),
						indicator: 'green'
					}, 3);
				}
			});
		}
	}
});

function load_default_items(frm, show_confirm) {
	if (!frm.doc.role) {
		frappe.msgprint(__('Please select a role first.'));
		return;
	}

	if (show_confirm) {
		frappe.confirm(__('This will replace all existing menu items. Continue?'), function() {
			do_load_default_items(frm);
		});
	} else {
		do_load_default_items(frm);
	}
}

function do_load_default_items(frm) {
	console.log('=== Loading default items for role:', frm.doc.role, '===');
	
	frappe.call({
		method: 'irt_ui.api.role_sidebar.get_default_sidebar_items_for_role',
		args: { role: frm.doc.role },
		callback: function(r) {
			console.log('=== API Response ===');
			console.log('Full response:', r);
			console.log('Response message:', r.message);
			console.log('Is array?', Array.isArray(r.message));
			console.log('Items count:', r.message ? r.message.length : 0);
			
			if (r.message && Array.isArray(r.message) && r.message.length > 0) {
				console.log('First 3 items:', r.message.slice(0, 3));
				
				// Clear existing items
				frm.clear_table('menu_items');
				console.log('Cleared menu_items table');
				
				// Add default items
				let added_count = 0;
				r.message.forEach(function(item, index) {
					try {
						let row = frm.add_child('menu_items');
						row.label = item.label || '';
						row.icon = item.icon || '';
						row.type = item.type || 'Link';
						row.link_type = item.link_type || 'DocType';
						row.link_to = item.link_to || '';
						row.url = item.url || '';
						row.route = item.route || '';
						row.sequence = item.sequence || (index + 1);
						row.is_active = item.is_active !== undefined ? item.is_active : 1;
						row.open_in_new_tab = item.open_in_new_tab || 0;
						added_count++;
					} catch (e) {
						console.error('Error adding item:', item, e);
					}
				});
				
				console.log('Added', added_count, 'items to table');
				frm.refresh_field('menu_items');
				console.log('Refreshed menu_items field');
				
				frappe.show_alert({
					message: __('Loaded {0} default sidebar items', [r.message.length]),
					indicator: 'green'
				}, 3);
				
				// Update sidebar preview immediately after items are loaded
				setTimeout(function() {
					preview_sidebar_from_form(frm);
				}, 800);
			} else {
				console.warn('=== No default items returned ===');
				console.warn('Response:', r);
				console.warn('Message:', r.message);
				frappe.msgprint({
					title: __('No Default Items Found'),
					message: __('No default sidebar items found for role "{0}".<br><br>Check Error Log for details.', [frm.doc.role]),
					indicator: 'orange'
				});
			}
		},
		error: function(r) {
			console.error('=== API Error ===');
			console.error('Full error:', r);
			console.error('Exception:', r.exc);
			console.error('Exception type:', r.exc_type);
			console.error('Traceback:', r.traceback);
			
			let error_msg = __('Error loading default items');
			if (r.exc) {
				error_msg += ': ' + (r.exc_type || 'Unknown error');
				if (r.traceback) {
					console.error('Traceback:', r.traceback);
				}
			}
			frappe.msgprint({
				title: __('Error'),
				message: error_msg + '<br><br>Check browser console and Error Log for details.',
				indicator: 'red'
			});
		}
	});
}

function preview_sidebar_from_form(frm) {
	// Build sidebar data from form and preview it
	if (!frm.doc.role || !frm.doc.menu_items || frm.doc.menu_items.length === 0) {
		console.log('Cannot preview: missing role or menu items');
		return;
	}
	
	console.log('=== Building sidebar preview from form data ===');
	console.log('Role:', frm.doc.role);
	console.log('Menu items count:', frm.doc.menu_items.length);
	
	// Build sidebar structure from form menu_items
	const sidebar_items = [];
	frm.doc.menu_items.forEach(function(item, index) {
		if (item.is_active !== 0) { // Check for active items
			if (item.type === 'Link') {
				sidebar_items.push({
					label: item.label || '',
					icon: item.icon || '',
					link_type: item.link_type || 'DocType',
					link_to: item.link_to || '',
					url: item.url || '#',
					type: 'Link'
				});
			} else if (item.type === 'Section Break') {
				sidebar_items.push({
					label: item.label || 'Section',
					icon: item.icon || '',
					type: 'Section Break'
				});
			}
		}
	});
	
	console.log('Built sidebar items:', sidebar_items.length);
	
	const sidebar_data = {
		label: frm.doc.role,
		items: sidebar_items,
		header_icon: 'folder',
		module: 'IRT UI'
	};
	
	// Update boot data with multiple keys for compatibility
	const role_key = frappe.scrub(frm.doc.role);
	const role_lower = frm.doc.role.toLowerCase();
	
	if (!frappe.boot.workspace_sidebar_item) {
		frappe.boot.workspace_sidebar_item = {};
	}
	frappe.boot.workspace_sidebar_item[role_key] = sidebar_data;
	frappe.boot.workspace_sidebar_item[role_lower] = sidebar_data;
	frappe.boot.workspace_sidebar_item[frm.doc.role] = sidebar_data;
	
	console.log('Updated boot data for role:', frm.doc.role);
	console.log('Sidebar data structure:', sidebar_data);
	
	// Force sidebar reload - don't check if user has role (for preview purposes)
	if (frappe.app && frappe.app.sidebar) {
		try {
			// Set workspace_title to the role name for preview
			frappe.app.sidebar.workspace_title = frm.doc.role;
			
			// Force reload by calling setup with role
			frappe.app.sidebar.setup(frm.doc.role);
			
			// Also try to render if render method exists
			if (frappe.app.sidebar.render) {
				setTimeout(function() {
					try {
						frappe.app.sidebar.render();
					} catch (e) {
						console.warn('Render method error:', e);
					}
				}, 100);
			}
			
			console.log('✓ Sidebar preview updated for role:', frm.doc.role);
			frappe.show_alert({
				message: __('Sidebar preview updated for {0}', [frm.doc.role]),
				indicator: 'green'
			}, 2);
		} catch (e) {
			console.error('Error updating sidebar preview:', e);
			// Try alternative method - force prepare and render
			if (frappe.app.sidebar) {
				try {
					frappe.app.sidebar.workspace_title = frm.doc.role;
					if (frappe.app.sidebar.prepare) {
						frappe.app.sidebar.prepare();
					}
					if (frappe.app.sidebar.render) {
						setTimeout(function() {
							frappe.app.sidebar.render();
						}, 100);
					}
				} catch (e2) {
					console.error('Alternative sidebar update also failed:', e2);
				}
			}
		}
	} else {
		console.warn('Sidebar not available yet, will retry...');
		// Retry after a delay
		setTimeout(function() {
			preview_sidebar_from_form(frm);
		}, 1000);
	}
}

function update_sidebar_preview(role) {
	// Use exposed function to refresh sidebar
	if (typeof window.refresh_role_sidebar === 'function') {
		window.refresh_role_sidebar(role);
	} else {
		// Fallback: reload sidebar for current user if they have this role
		if (frappe.boot && frappe.boot.user && frappe.boot.user.roles) {
			const user_roles = frappe.boot.user.roles || [];
			if (user_roles.includes(role) && frappe.app && frappe.app.sidebar) {
				// Reload sidebar
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
							
							// Reload sidebar
							if (frappe.app.sidebar) {
								try {
									frappe.app.sidebar.setup(role);
								} catch (e) {
									console.warn('Error reloading sidebar:', e);
								}
							}
						}
					}
				});
			}
		}
	}
}

