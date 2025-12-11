// Client script for IRT Theme Settings
// Enhanced with better UI, presets, export/import, and live preview

frappe.ui.form.on('IRT Theme Settings', {
	refresh(frm) {
		// Update export field
		update_export_field(frm);
		
		// Setup preset preview
		setup_preset_preview(frm);
		
		// Add action buttons
		setup_action_buttons(frm);
		
		// Setup color change handlers for live preview
		setup_live_preview(frm);
		
		// Setup import handler
		setup_import_handler(frm);
	},
	
	// Live preview when colors change
	color_primary(frm) {
		apply_color_preview(frm, 'color_primary', '--color-primary');
		if (frm.doc.auto_generate_variants) {
			auto_generate_variants(frm, 'primary');
		}
	},
	color_secondary(frm) {
		apply_color_preview(frm, 'color_secondary', '--color-secondary');
		if (frm.doc.auto_generate_variants) {
			auto_generate_variants(frm, 'secondary');
		}
	},
	color_accent(frm) {
		apply_color_preview(frm, 'color_accent', '--color-accent');
		if (frm.doc.auto_generate_variants) {
			auto_generate_variants(frm, 'accent');
		}
	},
	
	// Apply preview for all color fields
	color_primary_dark(frm) { apply_color_preview(frm, 'color_primary_dark', '--color-primary-dark'); },
	color_primary_light(frm) { apply_color_preview(frm, 'color_primary_light', '--color-primary-light'); },
	color_primary_lighter(frm) { apply_color_preview(frm, 'color_primary_lighter', '--color-primary-lighter'); },
	color_primary_lightest(frm) { apply_color_preview(frm, 'color_primary_lightest', '--color-primary-lightest'); },
	color_secondary_dark(frm) { apply_color_preview(frm, 'color_secondary_dark', '--color-secondary-dark'); },
	color_secondary_light(frm) { apply_color_preview(frm, 'color_secondary_light', '--color-secondary-light'); },
	color_secondary_lighter(frm) { apply_color_preview(frm, 'color_secondary_lighter', '--color-secondary-lighter'); },
	color_secondary_lightest(frm) { apply_color_preview(frm, 'color_secondary_lightest', '--color-secondary-lightest'); },
	color_accent_dark(frm) { apply_color_preview(frm, 'color_accent_dark', '--color-accent-dark'); },
	color_accent_light(frm) { apply_color_preview(frm, 'color_accent_light', '--color-accent-light'); },
	color_accent_lighter(frm) { apply_color_preview(frm, 'color_accent_lighter', '--color-accent-lighter'); },
	color_accent_lightest(frm) { apply_color_preview(frm, 'color_accent_lightest', '--color-accent-lightest'); },
	color_text_primary(frm) { apply_color_preview(frm, 'color_text_primary', '--color-text-primary'); },
	color_text_secondary(frm) { apply_color_preview(frm, 'color_text_secondary', '--color-text-secondary'); },
	color_text_tertiary(frm) { apply_color_preview(frm, 'color_text_tertiary', '--color-text-tertiary'); },
	color_text_light(frm) { apply_color_preview(frm, 'color_text_light', '--color-text-light'); },
	color_text_lighter(frm) { apply_color_preview(frm, 'color_text_lighter', '--color-text-lighter'); },
	color_bg_white(frm) { apply_color_preview(frm, 'color_bg_white', '--color-bg-white'); },
	color_bg_gray(frm) { apply_color_preview(frm, 'color_bg_gray', '--color-bg-gray'); },
	color_bg_gray_light(frm) { apply_color_preview(frm, 'color_bg_gray_light', '--color-bg-gray-light'); },
	color_bg_gray_lighter(frm) { apply_color_preview(frm, 'color_bg_gray_lighter', '--color-bg-gray-lighter'); },
	color_bg_light_blue(frm) { apply_color_preview(frm, 'color_bg_light_blue', '--color-bg-light-blue'); },
	color_border(frm) { apply_color_preview(frm, 'color_border', '--color-border'); },
	color_border_dark(frm) { apply_color_preview(frm, 'color_border_dark', '--color-border-dark'); },
	color_border_light(frm) { apply_color_preview(frm, 'color_border_light', '--color-border-light'); },
	sidebar_bg_solid(frm) { apply_color_preview(frm, 'sidebar_bg_solid', '--sidebar-bg-solid'); },
	sidebar_active_color(frm) { apply_color_preview(frm, 'sidebar_active_color', '--sidebar-active-color'); },
	color_success(frm) { apply_color_preview(frm, 'color_success', '--color-success'); },
	color_error(frm) { apply_color_preview(frm, 'color_error', '--color-error'); },
	color_warning(frm) { apply_color_preview(frm, 'color_warning', '--color-warning'); },
	color_info(frm) { apply_color_preview(frm, 'color_info', '--color-info'); },
	avatar_frame_bg(frm) { apply_color_preview(frm, 'avatar_frame_bg', '--avatar-frame-bg'); },
	avatar_frame_color(frm) { apply_color_preview(frm, 'avatar_frame_color', '--avatar-frame-color'); },
	avatar_frame_border(frm) { apply_color_preview(frm, 'avatar_frame_border', '--avatar-frame-border'); },
	
	after_save(frm) {
		// Reload theme after saving
		if (window.irtTheme && window.irtTheme.reload) {
			window.irtTheme.reload();
		}
		update_export_field(frm);
	}
});

// Helper function to apply color preview
function apply_color_preview(frm, fieldname, cssVar) {
	const value = frm.doc[fieldname];
	if (value && window.irtTheme && window.irtTheme.apply) {
		const tempSettings = {};
		tempSettings[fieldname] = value;
		window.irtTheme.apply(tempSettings);
	}
}

// Auto-generate color variants
function auto_generate_variants(frm, colorType) {
	const baseColor = frm.doc[`color_${colorType}`];
	if (!baseColor) return;
	
	// Simple variant generation (can be enhanced with proper color manipulation)
	const variants = generate_color_variants(baseColor);
	
	if (!frm.doc[`color_${colorType}_dark`]) {
		frm.set_value(`color_${colorType}_dark`, variants.dark);
	}
	if (!frm.doc[`color_${colorType}_light`]) {
		frm.set_value(`color_${colorType}_light`, variants.light);
	}
	if (!frm.doc[`color_${colorType}_lighter`]) {
		frm.set_value(`color_${colorType}_lighter`, variants.lighter);
	}
	if (!frm.doc[`color_${colorType}_lightest`]) {
		frm.set_value(`color_${colorType}_lightest`, variants.lightest);
	}
}

// Generate color variants (simplified)
function generate_color_variants(hex) {
	// Convert hex to RGB
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	
	// Generate darker variant
	const darkR = Math.max(0, Math.floor(r * 0.7));
	const darkG = Math.max(0, Math.floor(g * 0.7));
	const darkB = Math.max(0, Math.floor(b * 0.7));
	
	// Generate lighter variants
	const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.3));
	const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.3));
	const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.3));
	
	const lighterR = Math.min(255, Math.floor(r + (255 - r) * 0.5));
	const lighterG = Math.min(255, Math.floor(g + (255 - g) * 0.5));
	const lighterB = Math.min(255, Math.floor(b + (255 - b) * 0.5));
	
	const lightestR = Math.min(255, Math.floor(r + (255 - r) * 0.7));
	const lightestG = Math.min(255, Math.floor(g + (255 - g) * 0.7));
	const lightestB = Math.min(255, Math.floor(b + (255 - b) * 0.7));
	
	return {
		dark: `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`,
		light: `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`,
		lighter: `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`,
		lightest: `#${lightestR.toString(16).padStart(2, '0')}${lightestG.toString(16).padStart(2, '0')}${lightestB.toString(16).padStart(2, '0')}`
	};
}

// Setup action buttons
function setup_action_buttons(frm) {
	// Preview Theme button
	frm.add_custom_button(__('👁️ Preview Theme'), function() {
		if (window.irtTheme && window.irtTheme.reload) {
			window.irtTheme.reload();
			frappe.show_alert({
				message: __('Theme preview applied'),
				indicator: 'blue'
			}, 2);
		}
	}, __('Actions'));
	
	// Reset to Defaults button
	frm.add_custom_button(__('🔄 Reset to Defaults'), function() {
		frappe.confirm(
			__('Are you sure you want to reset all theme colors to default values? This cannot be undone.'),
			function() {
				reset_to_defaults(frm);
			}
		);
	}, __('Actions'));
	
	// Export Theme button
	frm.add_custom_button(__('📥 Export Theme'), function() {
		export_theme(frm);
	}, __('Actions'));
	
	// Copy Export JSON button
	frm.add_custom_button(__('📋 Copy Export JSON'), function() {
		copy_export_json(frm);
	}, __('Actions'));
}

// Reset to defaults
function reset_to_defaults(frm) {
	const defaults = {
		'color_primary': '#0066FF',
		'color_primary_dark': '#0052CC',
		'color_primary_light': '#1A7AFF',
		'color_primary_lighter': '#3388FF',
		'color_primary_lightest': '#4D99FF',
		'color_secondary': '#9D4EDD',
		'color_secondary_dark': '#7B2DB8',
		'color_secondary_light': '#B366E8',
		'color_secondary_lighter': '#C880F0',
		'color_secondary_lightest': '#D699F5',
		'color_accent': '#FF6B35',
		'color_accent_dark': '#E55A2B',
		'color_accent_light': '#FF7F4D',
		'color_accent_lighter': '#FF9366',
		'color_accent_lightest': '#FFA780',
		'color_text_primary': '#1a202c',
		'color_text_secondary': '#6f737c',
		'color_text_tertiary': '#718096',
		'color_text_light': '#a0aec0',
		'color_text_lighter': '#cbd5e0',
		'color_bg_white': '#ffffff',
		'color_bg_gray': '#f0f0d0',
		'color_bg_gray_light': '#f5f5e0',
		'color_bg_gray_lighter': '#fafaf0',
		'color_bg_light_blue': '#00D4FF',
		'sidebar_bg_solid': '#F0F4FF',
		'sidebar_border_color': 'rgba(157, 78, 221, 0.2)',
		'sidebar_hover_bg': 'rgba(157, 78, 221, 0.08)',
		'sidebar_active_bg_solid': 'rgba(157, 78, 221, 0.15)',
		'sidebar_active_color': '#9D4EDD',
		'color_border': '#e2e8f0',
		'color_border_dark': '#cbd5e0',
		'color_border_light': '#edf2f7',
		'color_success': '#10b981',
		'color_error': '#e53e3e',
		'color_warning': '#f59e0b',
		'color_info': '#3b82f6',
		'avatar_frame_bg': '#ffffff',
		'avatar_frame_color': '#374151',
		'avatar_frame_border': '#e5e7eb'
	};
	
	Object.keys(defaults).forEach(field => {
		frm.set_value(field, defaults[field]);
	});
	
	frappe.show_alert({
		message: __('Theme colors reset to defaults'),
		indicator: 'blue'
	}, 3);
}

// Export theme
function export_theme(frm) {
	frappe.call({
		method: 'irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings.export_theme',
		callback: function(r) {
			if (r.message) {
				frm.set_value('theme_export', r.message);
				frappe.show_alert({
					message: __('Theme exported to Export Theme field'),
					indicator: 'green'
				}, 3);
			}
		}
	});
}

// Copy export JSON
function copy_export_json(frm) {
	const exportJson = frm.doc.theme_export;
	if (!exportJson) {
		frappe.msgprint(__('Please export theme first'));
		return;
	}
	
	// Copy to clipboard
	if (navigator.clipboard) {
		navigator.clipboard.writeText(exportJson).then(function() {
			frappe.show_alert({
				message: __('Theme JSON copied to clipboard'),
				indicator: 'green'
			}, 3);
		});
	} else {
		// Fallback for older browsers
		const textarea = document.createElement('textarea');
		textarea.value = exportJson;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		frappe.show_alert({
			message: __('Theme JSON copied to clipboard'),
			indicator: 'green'
		}, 3);
	}
}

// Setup import handler
function setup_import_handler(frm) {
	frm.get_field('theme_import').$input.on('blur', function() {
		const importJson = frm.doc.theme_import;
		if (importJson && importJson.trim()) {
			frappe.confirm(
				__('Importing theme will overwrite current settings. Continue?'),
				function() {
					frappe.call({
						method: 'irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings.import_theme',
						args: {
							theme_json: importJson
						},
						callback: function(r) {
							if (r.message && r.message.status === 'success') {
								frm.reload_doc();
								frappe.show_alert({
									message: __('Theme imported successfully'),
									indicator: 'green'
								}, 3);
							}
						}
					});
				}
			);
		}
	});
}

// Update export field
function update_export_field(frm) {
	const exportData = {};
	
	// Collect all color fields
	frm.meta.fields.forEach(field => {
		if ((field.fieldtype === 'Color' || field.fieldtype === 'Data') && 
			field.fieldname && 
			!['theme_export', 'theme_import', 'preset_name', 'preset_description', 'preset_preview'].includes(field.fieldname)) {
			const value = frm.doc[field.fieldname];
			if (value) {
				exportData[field.fieldname] = value;
			}
		}
	});
	
	if (Object.keys(exportData).length > 0) {
		frm.set_value('theme_export', JSON.stringify(exportData, null, 2));
	}
}

// Setup preset preview
function setup_preset_preview(frm) {
	const previewHtml = `
		<div class="preset-preview" style="padding: 15px; background: #f8f9fa; border-radius: 6px; margin-top: 10px;">
			<h5 style="margin-bottom: 10px;">Color Preview</h5>
			<div style="display: flex; gap: 10px; flex-wrap: wrap;">
				<div class="color-swatch" style="width: 60px; height: 60px; border-radius: 6px; border: 2px solid #ddd; background: ${frm.doc.color_primary || '#0066FF'};" title="Primary"></div>
				<div class="color-swatch" style="width: 60px; height: 60px; border-radius: 6px; border: 2px solid #ddd; background: ${frm.doc.color_secondary || '#9D4EDD'};" title="Secondary"></div>
				<div class="color-swatch" style="width: 60px; height: 60px; border-radius: 6px; border: 2px solid #ddd; background: ${frm.doc.color_accent || '#FF6B35'};" title="Accent"></div>
			</div>
		</div>
	`;
	
	frm.get_field('preset_preview').$wrapper.html(previewHtml);
}

// Setup live preview for all color fields
function setup_live_preview(frm) {
	// This is handled by individual field handlers above
}
