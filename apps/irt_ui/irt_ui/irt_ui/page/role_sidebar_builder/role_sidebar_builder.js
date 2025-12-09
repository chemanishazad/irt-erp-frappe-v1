frappe.pages['role-sidebar-builder'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Role Sidebar Builder'),
		single_column: true
	});

	// Check if user is Administrator
	if (!frappe.user_roles.includes('Administrator')) {
		frappe.msgprint(__('Only Administrator can access this page.'));
		return;
	}

	let role_sidebar_builder = new RoleSidebarBuilder(page);
};

class RoleSidebarBuilder {
	constructor(page) {
		this.page = page;
		this.current_role = null;
		this.menu_items = [];
		this.available_items = [];
		this.init();
	}

	init() {
		this.make_role_selector();
		this.make_menu_builder();
		this.load_available_items();
	}

	make_role_selector() {
		let me = this;
		
		this.page.add_field({
			label: __('Select Role'),
			fieldtype: 'Link',
			options: 'Role',
			fieldname: 'role',
			change: function() {
				me.current_role = this.value;
				console.log('Role selected:', me.current_role);
				if (me.current_role) {
					// Clear existing items first
					me.menu_items = [];
					me.render_menu_items();
					
					// First load default items, then load custom items
					me.load_default_items_for_role();
				} else {
					me.menu_items = [];
					me.render_menu_items();
				}
			}
		});

		this.role_field = this.page.fields_dict.role;
	}

	make_menu_builder() {
		let me = this;

		// Container for menu builder
		this.menu_container = $('<div class="role-sidebar-builder-container"></div>').appendTo(this.page.main);

		// Toolbar
		this.toolbar = $(`
			<div class="role-sidebar-toolbar">
				<button class="btn btn-primary btn-sm" id="add-menu-item">
					<i class="fa fa-plus"></i> ${__('Add Menu Item')}
				</button>
				<button class="btn btn-secondary btn-sm" id="add-section-break">
					<i class="fa fa-minus"></i> ${__('Add Section Break')}
				</button>
				<button class="btn btn-info btn-sm" id="load-default-items">
					<i class="fa fa-refresh"></i> ${__('Load Default Items')}
				</button>
				<button class="btn btn-warning btn-sm" id="import-from-sidebar">
					<i class="fa fa-download"></i> ${__('Import from Sidebar')}
				</button>
				<button class="btn btn-success btn-sm" id="save-sidebar" style="float: right;">
					<i class="fa fa-save"></i> ${__('Save')}
				</button>
			</div>
		`).appendTo(this.menu_container);

		// Menu items list (sortable)
		this.menu_list = $('<div class="role-sidebar-menu-list"></div>').appendTo(this.menu_container);

		// Initialize SortableJS for drag and drop
		this.init_sortable();

		// Event handlers
		$('#add-menu-item').on('click', () => this.add_menu_item());
		$('#add-section-break').on('click', () => this.add_section_break());
		$('#load-default-items').on('click', () => this.load_default_items_for_role());
		$('#import-from-sidebar').on('click', () => this.show_import_dialog());
		$('#save-sidebar').on('click', () => this.save_sidebar());
	}

	init_sortable() {
		let me = this;
		
		// Check if SortableJS is available, if not load it
		if (typeof Sortable === 'undefined') {
			// Try to load from Frappe's assets
			frappe.require('assets/frappe/js/lib/sortablejs/Sortable.min.js', () => {
				me.create_sortable();
			}, () => {
				// Fallback: use jQuery UI sortable if available
				if (typeof $ !== 'undefined' && $.fn.sortable) {
					me.create_jquery_sortable();
				} else {
					console.warn('SortableJS not available. Drag and drop may not work.');
				}
			});
		} else {
			this.create_sortable();
		}
	}

	create_sortable() {
		let me = this;
		if (!this.menu_list || !this.menu_list[0]) return;
		
		try {
			if (this.sortable) {
				this.sortable.destroy();
			}
			
			this.sortable = new Sortable(this.menu_list[0], {
				animation: 150,
				handle: '.drag-handle',
				ghostClass: 'sortable-ghost',
				dragClass: 'sortable-drag',
				onEnd: function(evt) {
					me.update_sequences();
				}
			});
		} catch (e) {
			console.warn('Error creating Sortable:', e);
			// Fallback to jQuery sortable
			this.create_jquery_sortable();
		}
	}

	create_jquery_sortable() {
		let me = this;
		if (typeof $ === 'undefined' || !$.fn.sortable) {
			console.warn('jQuery UI sortable not available');
			return;
		}

		this.menu_list.sortable({
			handle: '.drag-handle',
			axis: 'y',
			opacity: 0.6,
			update: function() {
				me.update_sequences();
			}
		});
	}

	load_available_items() {
		let me = this;
		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_available_menu_items',
			callback: function(r) {
				if (r.message) {
					me.available_items = r.message;
				}
			}
		});
	}

	load_default_items_for_role() {
		let me = this;
		if (!this.current_role) {
			frappe.msgprint(__('Please select a role first.'));
			return;
		}

		// Show loading indicator
		frappe.show_alert({
			message: __('Loading default sidebar items for {0}...', [this.current_role]),
			indicator: 'blue'
		}, 2);

		// First, get default items for this role
		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_default_sidebar_items_for_role',
			args: { role: this.current_role },
			callback: function(r) {
				console.log('Default items API response:', r);
				let default_items = r.message || [];
				
				if (!Array.isArray(default_items)) {
					console.error('Invalid response format:', default_items);
					default_items = [];
				}
				
				if (default_items.length === 0) {
					console.warn('No default items returned from API');
					frappe.show_alert({
						message: __('No default sidebar items found. Check Error Log for details.'),
						indicator: 'orange'
					}, 5);
				} else {
					console.log(`Successfully loaded ${default_items.length} default items`);
					frappe.show_alert({
						message: __('Found {0} default sidebar items', [default_items.length]),
						indicator: 'green'
					}, 2);
				}
				
				// Then, get custom items if any
				me.load_custom_role_sidebar(default_items);
			},
			error: function(r) {
				console.error('Error loading default items:', r);
				let error_msg = __('Error loading default items');
				if (r.exc && r.exc_type) {
					error_msg += `: ${r.exc_type}`;
				}
				frappe.show_alert({
					message: error_msg,
					indicator: 'red'
				}, 5);
				// Still try to load custom items
				me.load_custom_role_sidebar([]);
			}
		});
	}

	load_custom_role_sidebar(default_items = []) {
		let me = this;
		if (!this.current_role) return;

		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_role_sidebar',
			args: { role: this.current_role },
			callback: function(r) {
				console.log('Custom sidebar response:', r);
				let custom_items = [];
				if (r.message && r.message.items && r.message.items.length > 0) {
					custom_items = r.message.items;
				}

				// Merge default items with custom items
				// If custom items exist, use them; otherwise use default items
				if (custom_items.length > 0) {
					me.menu_items = custom_items;
					frappe.show_alert({
						message: __('Loaded {0} custom menu items. Use "Load Default Items" to see defaults.', [custom_items.length]),
						indicator: 'green'
					}, 3);
				} else if (default_items.length > 0) {
					me.menu_items = default_items;
					frappe.show_alert({
						message: __('Loaded {0} default menu items. You can customize them now.', [default_items.length]),
						indicator: 'blue'
					}, 4);
				} else {
					me.menu_items = [];
					frappe.show_alert({
						message: __('No menu items found. Click "Add Menu Item" or "Load Default Items" to get started.'),
						indicator: 'orange'
					}, 5);
				}

				console.log('Final menu items:', me.menu_items);
				me.render_menu_items();
			},
			error: function(r) {
				console.error('Error loading custom sidebar:', r);
				// If error loading custom, use default items
				if (default_items.length > 0) {
					me.menu_items = default_items;
					frappe.show_alert({
						message: __('Using default items. No custom sidebar found.'),
						indicator: 'blue'
					}, 3);
					me.render_menu_items();
				}
			}
		});
	}

	load_role_sidebar() {
		// Legacy method - redirect to new method
		this.load_default_items_for_role();
	}

	show_import_dialog() {
		let me = this;
		if (!this.current_role) {
			frappe.msgprint(__('Please select a role first.'));
			return;
		}

		// Get all available sidebar items
		frappe.call({
			method: 'irt_ui.api.role_sidebar.get_all_sidebar_items',
			callback: function(r) {
				if (r.message && r.message.length > 0) {
					me.show_sidebar_selector(r.message);
				} else {
					frappe.msgprint(__('No default sidebar items found.'));
				}
			}
		});
	}

	show_sidebar_selector(sidebars) {
		let me = this;
		
		// Group items by sidebar
		let sidebar_groups = {};
		sidebars.forEach(item => {
			let sidebar_name = item.sidebar_name || 'Default';
			if (!sidebar_groups[sidebar_name]) {
				sidebar_groups[sidebar_name] = [];
			}
			sidebar_groups[sidebar_name].push(item);
		});

		let dialog = new frappe.ui.Dialog({
			title: __('Import from Default Sidebar'),
			fields: [
				{
					label: __('Select Sidebar'),
					fieldname: 'sidebar_name',
					fieldtype: 'Select',
					options: Object.keys(sidebar_groups).join('\n'),
					reqd: 1,
					change: function() {
						let selected_sidebar = this.value;
						let items = sidebar_groups[selected_sidebar] || [];
						
						// Update items list
						let items_html = '<div style="max-height: 300px; overflow-y: auto;">';
						items.forEach((item, idx) => {
							items_html += `
								<div style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
									<label style="font-weight: normal; cursor: pointer;">
										<input type="checkbox" name="import_item" value="${idx}" checked style="margin-right: 8px;">
										${item.icon ? `<i class="${item.icon}" style="margin-right: 5px;"></i>` : ''}
										${item.label}
									</label>
								</div>
							`;
						});
						items_html += '</div>';
						
						dialog.fields_dict.items_html.$wrapper.html(items_html);
					}
				},
				{
					fieldname: 'items_html',
					fieldtype: 'HTML',
					options: '<div style="padding: 10px; color: #999;">' + __('Select a sidebar to view items') + '</div>'
				}
			],
			primary_action_label: __('Import Selected'),
			primary_action: function(values) {
				let selected_sidebar = values.sidebar_name;
				let items = sidebar_groups[selected_sidebar] || [];
				
				// Get selected items
				let selected_indices = [];
				dialog.fields_dict.items_html.$wrapper.find('input[name="import_item"]:checked').each(function() {
					selected_indices.push(parseInt($(this).val()));
				});

				if (selected_indices.length === 0) {
					frappe.msgprint(__('Please select at least one item to import.'));
					return;
				}

				// Import selected items
				let current_max_sequence = me.menu_items.length > 0 ? 
					Math.max(...me.menu_items.map(i => i.sequence || 0)) : 0;

				selected_indices.forEach((idx, i) => {
					let item = items[idx];
					let menu_item = {
						label: item.label,
						icon: item.icon || '',
						type: 'Link',
						link_type: item.link_type || 'DocType',
						link_to: item.link_to || '',
						url: item.url || '',
						route: item.route || '',
						sequence: current_max_sequence + i + 1,
						is_active: 1,
						open_in_new_tab: 0
					};
					me.menu_items.push(menu_item);
				});

				me.render_menu_items();
				dialog.hide();
				
				frappe.show_alert({
					message: __('Imported {0} items successfully', [selected_indices.length]),
					indicator: 'green'
				}, 3);
			}
		});

		dialog.show();
	}

	render_menu_items() {
		let me = this;
		this.menu_list.empty();

		console.log('Rendering menu items:', this.menu_items);
		console.log('Menu items count:', this.menu_items ? this.menu_items.length : 0);

		if (!this.menu_items || this.menu_items.length === 0) {
			this.menu_list.html('<div class="text-muted text-center" style="padding: 20px;">' + 
				__('No menu items. Click "Add Menu Item" or "Load Default Items" to get started.') + '</div>');
			return;
		}

		this.menu_items.forEach((item, index) => {
			try {
				let $item = this.create_menu_item_element(item, index);
				this.menu_list.append($item);
			} catch (e) {
				console.error('Error rendering menu item:', item, e);
			}
		});

		// Reinitialize sortable
		if (this.sortable) {
			try {
				this.sortable.destroy();
			} catch (e) {
				console.warn('Error destroying sortable:', e);
			}
		}
		this.create_sortable();
	}

	create_menu_item_element(item, index) {
		let me = this;
		let is_section = item.type === 'Section Break';
		let is_default = item.sidebar_name && item.sidebar_name !== 'Custom';
		
		let $item = $(`
			<div class="role-sidebar-menu-item ${is_default ? 'default-item' : 'custom-item'}" data-index="${index}" data-type="${item.type || 'Link'}">
				<div class="menu-item-header">
					<span class="drag-handle"><i class="fa fa-bars"></i></span>
					<span class="menu-item-icon">
						${item.icon ? `<i class="${item.icon}"></i>` : '<i class="fa fa-circle"></i>'}
					</span>
					<span class="menu-item-label">${item.label || __('Untitled')}</span>
					<span class="menu-item-type">${is_section ? __('Section') : __('Link')}</span>
					${is_default ? '<span class="badge badge-info" style="margin-left: 5px;">Default</span>' : ''}
					<div class="menu-item-actions">
						<button class="btn btn-xs btn-secondary edit-item"><i class="fa fa-edit"></i></button>
						<button class="btn btn-xs btn-danger delete-item"><i class="fa fa-trash"></i></button>
					</div>
				</div>
				${item.child_items && item.child_items.length > 0 ? `
					<div class="menu-item-children">
						${item.child_items.map((child, idx) => `
							<div class="menu-item-child" data-child-index="${idx}">
								<span class="child-icon">${child.icon ? `<i class="${child.icon}"></i>` : ''}</span>
								<span class="child-label">${child.label}</span>
								<button class="btn btn-xs btn-secondary edit-child"><i class="fa fa-edit"></i></button>
								<button class="btn btn-xs btn-danger delete-child"><i class="fa fa-trash"></i></button>
							</div>
						`).join('')}
					</div>
				` : ''}
			</div>
		`);

		// Event handlers
		$item.find('.edit-item').on('click', () => this.edit_menu_item(index));
		$item.find('.delete-item').on('click', () => this.delete_menu_item(index));
		$item.find('.edit-child').on('click', function() {
			let child_idx = $(this).closest('.menu-item-child').data('child-index');
			me.edit_child_item(index, child_idx);
		});
		$item.find('.delete-child').on('click', function() {
			let child_idx = $(this).closest('.menu-item-child').data('child-index');
			me.delete_child_item(index, child_idx);
		});

		return $item;
	}

	add_menu_item() {
		if (!this.current_role) {
			frappe.msgprint(__('Please select a role first.'));
			return;
		}

		this.show_menu_item_dialog();
	}

	add_section_break() {
		if (!this.current_role) {
			frappe.msgprint(__('Please select a role first.'));
			return;
		}

		let section = {
			label: __('New Section'),
			type: 'Section Break',
			icon: '',
			sequence: this.menu_items.length + 1,
			is_active: 1
		};

		this.menu_items.push(section);
		this.render_menu_items();
	}

	show_menu_item_dialog(item_index = null) {
		let me = this;
		let item = item_index !== null ? this.menu_items[item_index] : null;
		let is_edit = item !== null;

		let dialog = new frappe.ui.Dialog({
			title: is_edit ? __('Edit Menu Item') : __('Add Menu Item'),
			fields: [
				{
					label: __('Label'),
					fieldname: 'label',
					fieldtype: 'Data',
					reqd: 1,
					default: item ? item.label : ''
				},
				{
					label: __('Icon'),
					fieldname: 'icon',
					fieldtype: 'Icon',
					default: item ? item.icon : ''
				},
				{
					label: __('Link Type'),
					fieldname: 'link_type',
					fieldtype: 'Select',
					options: 'DocType\nPage\nReport\nWorkspace\nDashboard\nURL',
					default: item ? (item.link_type || 'DocType') : 'DocType',
					change: function() {
						let link_type = this.value;
						if (link_type === 'URL') {
							dialog.set_df_property('link_to', 'hidden', 1);
							dialog.set_df_property('url', 'hidden', 0);
							dialog.set_df_property('route', 'hidden', 1);
						} else {
							dialog.set_df_property('link_to', 'hidden', 0);
							dialog.set_df_property('url', 'hidden', 1);
							dialog.set_df_property('route', 'hidden', 0);
						}
					}
				},
				{
					label: __('Link To'),
					fieldname: 'link_to',
					fieldtype: 'Dynamic Link',
					options: 'link_type',
					default: item ? item.link_to : '',
					hidden: item && item.link_type === 'URL' ? 1 : 0
				},
				{
					label: __('URL'),
					fieldname: 'url',
					fieldtype: 'Data',
					default: item ? item.url : '',
					hidden: item && item.link_type !== 'URL' ? 1 : 0
				},
				{
					label: __('Route'),
					fieldname: 'route',
					fieldtype: 'Data',
					description: __('Custom route (e.g., /app/customer)'),
					default: item ? item.route : '',
					hidden: item && item.link_type === 'URL' ? 1 : 0
				},
				{
					label: __('Open in New Tab'),
					fieldname: 'open_in_new_tab',
					fieldtype: 'Check',
					default: item ? item.open_in_new_tab : 0
				}
			],
			primary_action_label: is_edit ? __('Update') : __('Add'),
			primary_action: function(values) {
				let menu_item = {
					label: values.label,
					icon: values.icon || '',
					type: 'Link',
					link_type: values.link_type,
					link_to: values.link_to || '',
					url: values.link_type === 'URL' ? values.url : '',
					route: values.route || '',
					open_in_new_tab: values.open_in_new_tab || 0,
					sequence: is_edit ? item.sequence : me.menu_items.length + 1,
					is_active: 1
				};

				if (is_edit) {
					me.menu_items[item_index] = menu_item;
				} else {
					me.menu_items.push(menu_item);
				}

				me.render_menu_items();
				dialog.hide();
			}
		});

		dialog.show();
	}

	edit_menu_item(index) {
		this.show_menu_item_dialog(index);
	}

	delete_menu_item(index) {
		let me = this;
		frappe.confirm(
			__('Are you sure you want to delete this menu item?'),
			function() {
				me.menu_items.splice(index, 1);
				me.update_sequences();
				me.render_menu_items();
			}
		);
	}

	edit_child_item(parent_index, child_index) {
		// Similar to edit_menu_item but for child items
		let me = this;
		let parent = this.menu_items[parent_index];
		let child = parent.child_items[child_index];

		let dialog = new frappe.ui.Dialog({
			title: __('Edit Sub-Menu Item'),
			fields: [
				{
					label: __('Label'),
					fieldname: 'label',
					fieldtype: 'Data',
					reqd: 1,
					default: child.label
				},
				{
					label: __('Icon'),
					fieldname: 'icon',
					fieldtype: 'Icon',
					default: child.icon || ''
				},
				{
					label: __('URL'),
					fieldname: 'url',
					fieldtype: 'Data',
					default: child.url || ''
				},
				{
					label: __('Open in New Tab'),
					fieldname: 'open_in_new_tab',
					fieldtype: 'Check',
					default: child.open_in_new_tab || 0
				}
			],
			primary_action_label: __('Update'),
			primary_action: function(values) {
				child.label = values.label;
				child.icon = values.icon || '';
				child.url = values.url || '';
				child.open_in_new_tab = values.open_in_new_tab || 0;
				me.render_menu_items();
				dialog.hide();
			}
		});

		dialog.show();
	}

	delete_child_item(parent_index, child_index) {
		let me = this;
		frappe.confirm(
			__('Are you sure you want to delete this sub-menu item?'),
			function() {
				me.menu_items[parent_index].child_items.splice(child_index, 1);
				me.render_menu_items();
			}
		);
	}

	update_sequences() {
		this.menu_list.find('.role-sidebar-menu-item').each((index, el) => {
			let item_index = $(el).data('index');
			if (this.menu_items[item_index]) {
				this.menu_items[item_index].sequence = index + 1;
			}
		});
	}

	save_sidebar() {
		let me = this;
		if (!this.current_role) {
			frappe.msgprint(__('Please select a role first.'));
			return;
		}

		// Update sequences before saving
		this.update_sequences();

		// Prepare items for saving
		let items_to_save = this.menu_items.map(item => {
			let save_item = {
				label: item.label,
				type: item.type || 'Link',
				icon: item.icon || '',
				sequence: item.sequence || 0,
				is_active: item.is_active !== undefined ? item.is_active : 1
			};

			if (item.type === 'Link') {
				save_item.link_type = item.link_type || 'DocType';
				save_item.link_to = item.link_to || '';
				save_item.url = item.url || '';
				save_item.route = item.route || '';
				save_item.open_in_new_tab = item.open_in_new_tab || 0;
			}

			// Handle child items
			if (item.child_items && item.child_items.length > 0) {
				item.child_items.forEach((child, idx) => {
					me.menu_items.push({
						label: child.label,
						icon: child.icon || '',
						type: 'Link',
						link_type: 'URL',
						url: child.url || '#',
						parent_item: item.label,
						sequence: item.sequence + (idx + 1) * 0.1,
						is_active: 1,
						open_in_new_tab: child.open_in_new_tab || 0
					});
				});
			}

			return save_item;
		});

		frappe.call({
			method: 'irt_ui.api.role_sidebar.save_role_sidebar',
			args: {
				role: this.current_role,
				items: items_to_save
			},
			callback: function(r) {
				if (r.message && r.message.status === 'success') {
					frappe.show_alert({
						message: __('Sidebar saved successfully'),
						indicator: 'green'
					}, 3);
					
					// Trigger real-time update
					frappe.call({
						method: 'irt_ui.api.role_sidebar.update_sidebar_for_users',
						args: { role: me.current_role }
					});
				}
			}
		});
	}
}

