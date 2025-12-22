// Copyright (c) 2025, IRT and Contributors
// For license information, please see license.txt

// Override the global autocomplete load_installed_apps method for this doctype
frappe.ui.form.on("Role Based Sidebar", {
	onload: function(frm) {
		// Override the autocomplete's load_installed_apps method globally for this form
		// This needs to happen before the field is rendered
		if (frm.fields_dict.app) {
			// Wait for field to be created, then override
			setTimeout(() => {
				const app_field = frm.fields_dict.app;
				if (app_field && app_field.autocomplete && app_field.df.options === "Installed Applications") {
					// Override load_installed_apps
					app_field.autocomplete.load_installed_apps = async function() {
						const me = this;
						await frappe.call({
							method: "irt_ui.irt_ui.doctype.role_based_sidebar.role_based_sidebar.get_installed_apps_optimized",
							callback: function (r) {
								if (r.message && r.message.length > 0) {
									me.set_data(r.message);
								}
							},
						});
					};
					
					// Override set_options to use optimized version
					const original_set_options = app_field.autocomplete.set_options;
					app_field.autocomplete.set_options = function() {
						if (this.df.options === "Installed Applications") {
							// Use optimized load instead
							this.load_installed_apps();
							return;
						}
						return original_set_options.call(this);
					};
				}
			}, 100);
		}
	},
	
	refresh: function(frm) {
		// Add any custom form logic here
		if (frm.is_new()) {
			frm.set_value("header_icon", "layout-grid");
		}
		
		// Also override in refresh in case field wasn't ready in onload
		if (frm.fields_dict.app && frm.fields_dict.app.autocomplete && frm.fields_dict.app.df.options === "Installed Applications") {
			frm.fields_dict.app.autocomplete.load_installed_apps = async function() {
				const me = this;
				await frappe.call({
					method: "irt_ui.irt_ui.doctype.role_based_sidebar.role_based_sidebar.get_installed_apps_optimized",
					callback: function (r) {
						if (r.message && r.message.length > 0) {
							me.set_data(r.message);
						}
					},
				});
			};
		}
	},
	
	for_role: function(frm) {
		// Prevent any infinite loops or excessive queries
		if (frm.doc.for_role) {
			// Validate role exists
			frappe.db.get_value("Role", frm.doc.for_role, "name", (r) => {
				if (!r || !r.name) {
					frappe.msgprint(__("Invalid Role selected"));
					frm.set_value("for_role", "");
				}
			});
		}
	},
	
	app: function(frm) {
		// Validate app exists
		if (frm.doc.app) {
			const installed_apps = frappe.boot.installed_apps || [];
			if (installed_apps.length > 0 && !installed_apps.includes(frm.doc.app)) {
				// Allow it - might be a valid app not in boot
				// Just log for debugging
				console.log("App selected:", frm.doc.app);
			}
		}
	}
});

