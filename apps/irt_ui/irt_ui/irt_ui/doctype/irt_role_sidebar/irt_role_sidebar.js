// Copyright (c) 2025, IRT and Contributors
// License: MIT. See LICENSE

frappe.ui.form.on('IRT Role Sidebar', {
	refresh(frm) {
		// Add button to load default items
		if (frm.doc.role) {
			frm.add_custom_button(__('Load Default Items'), function() {
				load_default_items(frm, true);
			});
			
			// Add button to reload role data
			frm.add_custom_button(__('Reload Role Data'), function() {
				if (frm.doc.role) {
					load_role_data(frm);
				} else {
					frappe.msgprint(__('Please select a role first.'));
				}
			});
		}
		
		// Update sidebar preview when form loads
		if (frm.doc.role && frm.doc.menu_items && frm.doc.menu_items.length > 0) {
			// Update preview with current form data
			setTimeout(function() {
				preview_sidebar_from_form(frm);
			}, 500);
		} else if (frm.doc.role && !frm.is_new()) {
			// Load saved sidebar data for existing records
			setTimeout(function() {
				load_role_data(frm);
			}, 300);
		}
	},

	role(frm) {
		// Auto-load items when role is selected - ALWAYS load for selected role
		if (frm.doc.role) {
			const selected_role = frm.doc.role;
			console.log('=== Role selected:', selected_role, '===');
			
			// Store previous role to detect role change
			const previous_role = frm._previous_role || null;
			frm._previous_role = selected_role;
			
			// Always clear table first when role changes
			if (previous_role !== selected_role) {
				console.log('Role changed from', previous_role, 'to', selected_role);
				// Clear the table immediately and show loading state
				frm.clear_table('menu_items');
				frm.refresh_field('menu_items');
				
				// Show loading indicator
				if (frm.fields_dict.menu_items && frm.fields_dict.menu_items.grid) {
					const grid = frm.fields_dict.menu_items.grid;
					if (grid.wrapper) {
						grid.wrapper.find('.grid-body').html(
							'<div class="text-center" style="padding: 20px; color: var(--text-muted);">' +
							'<i class="fa fa-spinner fa-spin"></i> ' +
							__('Loading menu items for {0}...', [selected_role]) +
							'</div>'
						);
					}
				}
			}
			
			// Always load data for the selected role
			// Use a small delay to ensure form is ready
			setTimeout(function() {
				// Double-check role hasn't changed
				if (frm.doc.role === selected_role) {
					load_role_data(frm);
				}
			}, 150);
		} else {
			// Role cleared - clear menu items
			console.log('Role cleared, clearing menu items');
			if (frm.doc.menu_items && frm.doc.menu_items.length > 0) {
				frm.clear_table('menu_items');
				frm.refresh_field('menu_items');
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

function load_role_data(frm) {
	if (!frm.doc.role) {
		console.warn('No role selected, cannot load data');
		return;
	}
	
	const selected_role = frm.doc.role;
	console.log('=== Loading data for role:', selected_role, '===');
	
	// Show loading indicator
	frappe.show_alert({
		message: __('Loading sidebar data for {0}...', [selected_role]),
		indicator: 'blue'
	}, 3);
	
	// First try to load saved sidebar data for this role
	frappe.call({
		method: 'irt_ui.api.role_sidebar.get_role_sidebar',
		args: { role: selected_role },
		callback: function(r) {
			// Verify role hasn't changed while loading
			if (frm.doc.role !== selected_role) {
				console.log('Role changed during load, aborting');
				return;
			}
			
			if (r.message && r.message.items && r.message.items.length > 0) {
				// Load saved items for this role
				console.log('✓ Found saved sidebar for role:', selected_role, '-', r.message.items.length, 'items');
				console.log('Sample items:', r.message.items.slice(0, 3).map(i => i.label));
				
				load_items_to_form(frm, r.message.items);
				
				// Update sidebar immediately
				setTimeout(function() {
					update_sidebar_from_saved_data(selected_role, r.message);
				}, 300);
			} else {
				// No saved data - load default items for this role
				console.log('No saved sidebar found, loading default items for role:', selected_role);
				load_default_items(frm, false);
			}
		},
		error: function(r) {
			console.error('Error loading saved sidebar:', r);
			// On error, load default items
			console.log('Loading default items for role:', selected_role);
			load_default_items(frm, false);
		}
	});
}

function load_items_to_form(frm, items) {
	if (!items || items.length === 0) {
		console.warn('No items to load');
		// Clear table if no items
		frm.clear_table('menu_items');
		frm.refresh_field('menu_items');
		return;
	}
	
	const selected_role = frm.doc.role;
	console.log('=== Loading', items.length, 'items to form for role:', selected_role, '===');
	
	// Clear existing items first
	frm.clear_table('menu_items');
	
	// Wait a moment for table to clear, then add items
	setTimeout(function() {
		// Verify role hasn't changed
		if (frm.doc.role !== selected_role) {
			console.log('Role changed during load, aborting');
			return;
		}
		
		// Add items to form
		let added_count = 0;
		items.forEach(function(item, index) {
			try {
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
				added_count++;
			} catch (e) {
				console.error('Error adding item', index, ':', e);
			}
		});
		
		// Refresh the field to show the items
		frm.refresh_field('menu_items');
		
		// Force grid refresh if available
		if (frm.fields_dict.menu_items && frm.fields_dict.menu_items.grid) {
			frm.fields_dict.menu_items.grid.refresh();
		}
		
		console.log('✓ Loaded', added_count, 'items to form');
		console.log('Form now has', frm.doc.menu_items ? frm.doc.menu_items.length : 0, 'menu items');
		
		// Verify items are actually in the form
		if (frm.doc.menu_items && frm.doc.menu_items.length > 0) {
			console.log('Sample form items:', frm.doc.menu_items.slice(0, 3).map(i => i.label));
		} else {
			console.warn('WARNING: Items not found in form after loading!');
		}
		
		// Show success message
		frappe.show_alert({
			message: __('Loaded {0} menu items for {1}', [added_count, selected_role]),
			indicator: 'green'
		}, 3);
	}, 150);
}

function update_sidebar_from_saved_data(role, sidebar_data) {
	// Update boot data
	const role_lower = role.toLowerCase();
	const role_key = frappe.scrub(role);
	
	if (!frappe.boot.workspace_sidebar_item) {
		frappe.boot.workspace_sidebar_item = {};
	}
	
	// Store with lowercase key (Frappe's format)
	frappe.boot.workspace_sidebar_item[role_lower] = sidebar_data;
	frappe.boot.workspace_sidebar_item[role_key] = sidebar_data;
	frappe.boot.workspace_sidebar_item[role] = sidebar_data;
	
	console.log('Updated boot data for role:', role);
	
	// Update sidebar
	if (frappe.app && frappe.app.sidebar) {
		try {
			frappe.app.sidebar.workspace_title = role;
			frappe.app.sidebar.setup(role);
			console.log('✓ Sidebar updated for role:', role);
		} catch (e) {
			console.error('Error updating sidebar:', e);
		}
	}
}

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
	const selected_role = frm.doc.role;
	if (!selected_role) {
		frappe.msgprint(__('Please select a role first.'));
		return;
	}
	
	console.log('=== Loading default items for role:', selected_role, '===');
	
	frappe.call({
		method: 'irt_ui.api.role_sidebar.get_default_sidebar_items_for_role',
		args: { role: selected_role },
		callback: function(r) {
			// Verify role hasn't changed while loading
			if (frm.doc.role !== selected_role) {
				console.log('Role changed during load, aborting');
				return;
			}
			
			console.log('=== API Response ===');
			console.log('Full response:', r);
			console.log('Response message:', r.message);
			console.log('Is array?', Array.isArray(r.message));
			console.log('Items count:', r.message ? r.message.length : 0);
			
			if (r.message && Array.isArray(r.message) && r.message.length > 0) {
				console.log('First 3 items:', r.message.slice(0, 3).map(i => ({label: i.label, type: i.type})));
				
				// Clear existing items
				frm.clear_table('menu_items');
				console.log('Cleared menu_items table');
				
				// Wait a moment for table to clear, then add items
				setTimeout(function() {
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
					
					// Refresh the field to show the items
					frm.refresh_field('menu_items');
					console.log('Refreshed menu_items field');
					console.log('Form now has', frm.doc.menu_items ? frm.doc.menu_items.length : 0, 'menu items');
					
					frappe.show_alert({
						message: __('Loaded {0} default sidebar items for {1}', [added_count, selected_role]),
						indicator: 'green'
					}, 3);
					
					// Update sidebar preview immediately after items are loaded
					setTimeout(function() {
						preview_sidebar_from_form(frm);
					}, 800);
					
					// Also update sidebar header to show role name
					if (frappe.app && frappe.app.sidebar && frappe.app.sidebar.sidebar_header) {
						setTimeout(function() {
							try {
								frappe.app.sidebar.sidebar_header.set_title(selected_role);
							} catch (e) {
								console.warn('Could not update sidebar header:', e);
							}
						}, 1000);
					}
				}, 100);
			} else {
				console.warn('=== No default items returned ===');
				console.warn('Response:', r);
				console.warn('Message:', r.message);
				frappe.msgprint({
					title: __('No Default Items Found'),
					message: __('No default sidebar items found for role "{0}".<br><br>Check Error Log for details.', [selected_role]),
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
		// Check for active items (handle both 1 and true)
		const is_active = item.is_active === 1 || item.is_active === true || item.is_active === undefined;
		
		if (is_active) {
			if (item.type === 'Link') {
				// Build URL if not provided
				let url = item.url || '';
				if (!url || url === '#') {
					if (item.link_type === 'DocType' && item.link_to) {
						url = `/app/${frappe.scrub(item.link_to)}`;
					} else if (item.link_type === 'Page' && item.link_to) {
						url = `/app/${frappe.scrub(item.link_to)}`;
					} else if (item.link_type === 'Report' && item.link_to) {
						url = `/app/query-report/${frappe.scrub(item.link_to)}`;
					} else if (item.link_type === 'Workspace' && item.link_to) {
						url = `/app/${frappe.scrub(item.link_to)}`;
					} else if (item.link_type === 'Dashboard' && item.link_to) {
						url = `/app/${frappe.scrub(item.link_to)}`;
					} else {
						url = '#';
					}
				}
				
				// Build complete sidebar item matching Frappe's structure
				const sidebar_item = {
					label: item.label || '',
					icon: item.icon || '',
					link_type: item.link_type || 'DocType',
					link_to: item.link_to || '',
					url: url,
					type: 'Link',
					child: false,
					collapsible: false,
					indent: 0
				};
				
				// Add open_in_new_tab if set
				if (item.open_in_new_tab) {
					sidebar_item.open_in_new_tab = item.open_in_new_tab;
				}
				
				sidebar_items.push(sidebar_item);
			} else if (item.type === 'Section Break') {
				sidebar_items.push({
					label: item.label || 'Section',
					icon: item.icon || '',
					type: 'Section Break',
					child: false,
					collapsible: false
				});
			}
		}
	});
	
	console.log('Built sidebar items:', sidebar_items.length);
	console.log('Sample items:', sidebar_items.slice(0, 3));
	
	const sidebar_data = {
		label: frm.doc.role,
		items: sidebar_items,
		header_icon: 'folder',
		module: 'IRT UI'
	};
	
	// Update boot data with multiple keys for compatibility
	// Frappe uses lowercase key by default, so prioritize that
	const role_key = frappe.scrub(frm.doc.role);
	const role_lower = frm.doc.role.toLowerCase();
	
	if (!frappe.boot.workspace_sidebar_item) {
		frappe.boot.workspace_sidebar_item = {};
	}
	
	// Store with lowercase key first (Frappe's default format)
	frappe.boot.workspace_sidebar_item[role_lower] = sidebar_data;
	// Also store with other formats for compatibility
	frappe.boot.workspace_sidebar_item[role_key] = sidebar_data;
	frappe.boot.workspace_sidebar_item[frm.doc.role] = sidebar_data;
	
	console.log('Updated boot data for role:', frm.doc.role);
	console.log('Primary key (lowercase):', role_lower);
	console.log('Sidebar data keys:', Object.keys(frappe.boot.workspace_sidebar_item));
	console.log('Data at lowercase key:', !!frappe.boot.workspace_sidebar_item[role_lower]);
	
	// Force sidebar reload - use setup which calls make_sidebar
	const updateSidebar = function(retry_count = 0) {
		if (retry_count > 5) {
			console.error('Failed to update sidebar after 5 retries');
			return;
		}
		
		if (!frappe.app || !frappe.app.sidebar) {
			console.warn('Sidebar not available, retrying...', retry_count);
			setTimeout(() => updateSidebar(retry_count + 1), 500);
			return;
		}
		
		try {
			console.log('=== Updating sidebar for role:', frm.doc.role, '===');
			console.log('Current workspace_title:', frappe.app.sidebar.workspace_title);
			console.log('Sidebar data available:', !!frappe.boot.workspace_sidebar_item[role_key]);
			
			// Ensure workspace_title is set before calling setup
			frappe.app.sidebar.workspace_title = frm.doc.role;
			
			// Use setup method which calls prepare() and make_sidebar()
			frappe.app.sidebar.setup(frm.doc.role);
			
			// Verify sidebar was updated
			setTimeout(function() {
				const current_items = frappe.app.sidebar.workspace_sidebar_items || [];
				console.log('Sidebar now has', current_items.length, 'items');
				console.log('Sidebar workspace_title:', frappe.app.sidebar.workspace_title);
				
				if (current_items.length > 0) {
					console.log('✓ Sidebar preview updated successfully for role:', frm.doc.role);
					frappe.show_alert({
						message: __('Sidebar preview updated for {0} ({1} items)', [frm.doc.role, current_items.length]),
						indicator: 'green'
					}, 2);
				} else {
					console.warn('Sidebar updated but no items found');
					frappe.show_alert({
						message: __('Sidebar updated but no items displayed. Check console for details.'),
						indicator: 'orange'
					}, 3);
				}
			}, 300);
			
		} catch (e) {
			console.error('Error updating sidebar preview:', e);
			console.error('Stack:', e.stack);
			
			// Fallback: try prepare and make_sidebar manually
			try {
				console.log('Trying fallback method...');
				frappe.app.sidebar.workspace_title = frm.doc.role;
				if (frappe.app.sidebar.prepare) {
					frappe.app.sidebar.prepare();
				}
				if (frappe.app.sidebar.make_sidebar) {
					frappe.app.sidebar.make_sidebar();
				}
				console.log('Fallback method completed');
			} catch (e2) {
				console.error('Fallback also failed:', e2);
				if (retry_count < 3) {
					setTimeout(() => updateSidebar(retry_count + 1), 1000);
				}
			}
		}
	};
	
	// Start update process with a small delay to ensure DOM is ready
	setTimeout(() => updateSidebar(0), 200);
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


