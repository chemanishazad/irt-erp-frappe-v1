// Copyright (c) 2025, IRT and contributors
// Global workflow action handler for all doctypes
// Replaces default Save/Submit buttons with workflow action buttons

(function() {
	'use strict';

	// Hook into form refresh for all doctypes
	frappe.ui.form.on("*", {
		refresh(frm) {
			// Setup workflow action buttons for all doctypes
			setup_workflow_action_buttons(frm);
		}
	});

	function setup_workflow_action_buttons(frm) {
		// Clear existing action menu items
		frm.page.clear_actions_menu();

		// If document is not saved, show normal Save button
		if (frm.doc.__islocal) {
			return;
		}

		// If document has unsaved changes, show Save button normally
		if (frm.doc.__unsaved === 1) {
			// Ensure Save button is visible when there are unsaved changes
			frm.page.btn_primary.removeClass("hide");
			frm.enable_save();
			return;
		}

		// Check if workflow exists for this doctype
		const workflow_state_field = frappe.workflow.get_state_fieldname(frm.doctype);
		if (!workflow_state_field) {
			// No workflow configured, show normal buttons
			return;
		}

		// Ensure workflow state field exists and has a value
		if (!frm.doc[workflow_state_field]) {
			// Workflow state not set, show normal buttons
			return;
		}

		// Get workflow transitions with error handling
		// Note: Backend already filters transitions by user roles, so we just need to check approval access
		frappe.workflow.get_transitions(frm.doc)
			.then((transitions) => {
				if (!transitions || transitions.length === 0) {
					// No workflow transitions available for current user/state
					// Show normal Save/Submit buttons
					return;
				}

				// Filter transitions by approval access (self-approval check)
				// Backend already filtered by roles, so we only need to check approval access
				const available_transitions = transitions.filter((transition) => {
					const user = frappe.session.user;
					// Check if user has approval access (not self-approval unless allowed)
					const has_approval_access =
						user === "Administrator" ||
						transition.allow_self_approval ||
						user !== frm.doc.owner;
					return has_approval_access;
				});

				if (available_transitions.length === 0) {
					// User doesn't have approval access for any transitions
					return;
				}

				// Hide default Save/Submit button when workflow actions are available
				// This will be shown again if user makes changes
				frm.page.btn_primary.addClass("hide");
				frm.page.btn_secondary.addClass("hide");

				// Disable Save button when in Draft state and document is clean
				// This ensures Save button doesn't appear when workflow actions are shown
				if (frm.doc.docstatus === 0 && frm.doc[workflow_state_field] === "Draft") {
					frm.disable_save();
				}

				// Add workflow actions as visible buttons
				// Sort transitions: Submit/Approve actions first, then Reject
				const sorted_transitions = available_transitions.sort((a, b) => {
					// Put "Reject" actions last
					if (a.action.toLowerCase().includes("reject") && !b.action.toLowerCase().includes("reject")) {
						return 1;
					}
					if (!a.action.toLowerCase().includes("reject") && b.action.toLowerCase().includes("reject")) {
						return -1;
					}
					return 0;
				});

				sorted_transitions.forEach((transition, index) => {
					const action_label = __(transition.action);
					const action_handler = function () {
						handle_workflow_action(frm, transition);
					};

					// First action as primary, others as secondary
					if (index === 0) {
						frm.page.set_primary_action(action_label, action_handler);
					} else {
						frm.page.set_secondary_action(action_label, action_handler);
					}
				});
			})
			.catch((error) => {
				// Handle permission errors or other workflow errors gracefully
				console.warn("Workflow error:", error);
				// Don't show error to user, just fall back to normal buttons
				// The error might be due to permissions or workflow not being properly configured
			});
	}

	function handle_workflow_action(frm, transition) {
		// For Reject action, show remark dialog first
		const action_lower = transition.action.toLowerCase();
		if (action_lower.includes("reject")) {
			// Show remark dialog for reject actions
			frappe.prompt(
				{
					label: __("Remark / Reason"),
					fieldname: "remark",
					fieldtype: "Small Text",
					reqd: 1,
					description: __("Please enter a reason for rejecting this document")
				},
				(values) => {
					// Apply workflow action with remark
					apply_workflow_action(frm, transition, values.remark);
				},
				__("Reject Document"),
				__("Reject")
			);
		} else {
			// For other actions, proceed directly
			apply_workflow_action(frm, transition);
		}
	}

	function apply_workflow_action(frm, transition, remark) {
		frappe.dom.freeze();
		frm.selected_workflow_action = transition.action;

		frm.script_manager.trigger("before_workflow_action").then(() => {
			// Add comment/remark if provided (especially for reject actions)
			const comment_promise = remark 
				? frappe.xcall("frappe.desk.form.utils.add_comment", {
					reference_doctype: frm.doctype,
					reference_name: frm.docname,
					content: `${transition.action}: ${remark}`,
					comment_email: frappe.session.user,
					comment_by: frappe.session.user_fullname || frappe.session.user
				}).catch((err) => {
					// If comment fails, log but don't block workflow action
					console.warn("Could not add comment:", err);
				})
				: Promise.resolve();

			comment_promise.then(() => {
				// Apply workflow action using frappe.call to get full error details
				return new Promise((resolve, reject) => {
					// Temporarily override frappe.show_error to prevent default error dialogs
					const original_show_error = frappe.show_error;
					let error_shown_by_frappe = false;
					let restore_called = false;
					
					const restore_show_error = function() {
						if (!restore_called) {
							restore_called = true;
							frappe.show_error = original_show_error;
						}
					};
					
					frappe.show_error = function() {
						error_shown_by_frappe = true;
						// Don't call original to prevent default dialog
					};

					try {
						frappe.call({
							method: "frappe.model.workflow.apply_workflow",
							args: {
								doc: frm.doc,
								action: transition.action,
								remark: remark || ""
							},
							silent: true, // Prevent Frappe from showing its own error dialogs
							callback: (r) => {
								restore_show_error();
								
								if (r.exc || r.exc_type) {
									// Handle exception
									let error_msg = __("Error applying workflow action");
									if (r._error_message) {
										error_msg = r._error_message;
									} else if (r.exc_type === "PermissionError") {
										error_msg = __("You don't have permission to {0} this document. Please contact your administrator.", [transition.action]);
									} else if (r._server_messages) {
										try {
											const messages = JSON.parse(r._server_messages);
											if (messages && messages.length > 0) {
												error_msg = typeof messages[0] === 'string' ? messages[0] : messages[0].message || error_msg;
											}
										} catch (e) {
											// Ignore parse errors
										}
									}
									reject({ 
										message: error_msg, 
										exc_type: r.exc_type, 
										_error_message: r._error_message, 
										response: r,
										frappe_showed_error: error_shown_by_frappe
									});
								} else {
									resolve(r.message);
								}
							},
							error: (r) => {
								restore_show_error();
								
								// Extract error message from response
								let error_msg = __("Error applying workflow action");
								if (r) {
									if (r._error_message) {
										error_msg = r._error_message;
									} else if (r.exc_type === "PermissionError") {
										error_msg = __("You don't have permission to {0} this document. Please contact your administrator.", [transition.action]);
									} else if (r._server_messages) {
										try {
											const messages = JSON.parse(r._server_messages);
											if (messages && messages.length > 0) {
												error_msg = typeof messages[0] === 'string' ? messages[0] : messages[0].message || error_msg;
											}
										} catch (e) {
											// Ignore parse errors
										}
									} else if (r.message) {
										error_msg = r.message;
									}
								}
								reject({ 
									message: error_msg, 
									response: r,
									frappe_showed_error: error_shown_by_frappe
								});
							}
						});
					} catch (e) {
						// Ensure show_error is restored even if call throws synchronously
						restore_show_error();
						reject({ 
							message: __("Error applying workflow action: {0}", [e.message || e]),
							response: null
						});
					}
					
					// Safety timeout to restore show_error if call never completes
					setTimeout(() => {
						restore_show_error();
					}, 30000); // 30 second timeout
				});
			})
			.then((doc) => {
				frappe.model.sync(doc);
				frm.refresh();
				frm.selected_workflow_action = null;
				frappe.show_alert({
					message: __("{0} successfully", [transition.action]),
					indicator: "green"
				}, 3);
				frm.script_manager.trigger("after_workflow_action");
			})
			.catch((error) => {
				frappe.dom.unfreeze();
				frm.selected_workflow_action = null;
				
				// Extract error message from different formats
				let error_message = __("Error applying workflow action");
				
				if (error) {
					// Check error.message first (most common)
					if (error.message) {
						error_message = error.message;
					}
					// Check _error_message from response
					else if (error._error_message) {
						error_message = error._error_message;
					}
					// Check response._error_message
					else if (error.response && error.response._error_message) {
						error_message = error.response._error_message;
					}
					// Check exc_type for PermissionError
					else if (error.exc_type === "PermissionError" || 
						(error.response && error.response.exc_type === "PermissionError")) {
						error_message = __("You don't have permission to {0} this document. Please contact your administrator.", [transition.action]);
					}
					// Check _server_messages
					else if (error.response && error.response._server_messages) {
						try {
							const messages = JSON.parse(error.response._server_messages);
							if (messages && messages.length > 0) {
								error_message = typeof messages[0] === 'string' ? messages[0] : messages[0].message || error_message;
							}
						} catch (e) {
							// Ignore parse errors
						}
					}
					// If error is a string
					else if (typeof error === "string") {
						error_message = error;
					}
				}
				
				// Show user-friendly error message
				// We've already prevented Frappe's default dialog, so always show our custom message
				frappe.show_alert({
					message: error_message,
					indicator: "red"
				}, 5);
				console.error("Workflow action error:", error);
			})
			.finally(() => {
				frappe.dom.unfreeze();
			});
		}).catch((error) => {
			frappe.dom.unfreeze();
			frm.selected_workflow_action = null;
			frappe.show_alert({
				message: error && error.message ? error.message : __("Error before workflow action"),
				indicator: "red"
			}, 5);
			console.error("Before workflow action error:", error);
		});
	}

})();

