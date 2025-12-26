// Copyright (c) 2025, IRT and contributors
// Global list view workflow action handler for all doctypes
// Enhances workflow actions in list view with confirmation dialogs

(function() {
	'use strict';

	// Function to initialize list view workflow actions
	function initListViewWorkflowActions() {
		// Override the default list view workflow action handler
		if (frappe.listview && frappe.listview.ListView) {
			const original_get_workflow_action_menu_items = frappe.listview.ListView.prototype.get_workflow_action_menu_items;

			if (original_get_workflow_action_menu_items) {
				frappe.listview.ListView.prototype.get_workflow_action_menu_items = function() {
					const workflow_actions = original_get_workflow_action_menu_items.call(this);
					const me = this;
					
					// Enhance each workflow action with confirmation
					workflow_actions.forEach((action_item) => {
						const original_action = action_item.action;
						action_item.action = function() {
							const docnames = me.get_checked_items(true);
							if (docnames.length === 0) {
								frappe.msgprint(__("Please select at least one document"));
								return;
							}
							
							frappe.confirm(
								__("Are you sure you want to {0} {1} selected document(s)?", [
									action_item.label,
									docnames.length
								]),
								() => {
									original_action.call(this);
								}
							);
						};
					});
					
					return workflow_actions;
				};
			}
		}
	}

	// Initialize when Frappe is ready, or immediately if already available
	if (typeof frappe !== 'undefined' && frappe.ready) {
		frappe.ready(initListViewWorkflowActions);
	} else if (typeof frappe !== 'undefined' && frappe.listview && frappe.listview.ListView) {
		// If Frappe is already loaded, initialize immediately
		initListViewWorkflowActions();
	} else {
		// Wait for Frappe to be available
		$(document).ready(function() {
			if (typeof frappe !== 'undefined' && frappe.listview && frappe.listview.ListView) {
				initListViewWorkflowActions();
			}
		});
	}

})();

