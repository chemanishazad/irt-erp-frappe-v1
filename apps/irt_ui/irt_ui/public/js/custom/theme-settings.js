/**
 * IRT Theme Settings - Dynamic Theme Application
 * Applies theme colors from IRT Theme Settings doctype dynamically
 */

(function() {
	'use strict';

	// Map database field names to CSS variable names
	const CSS_VARIABLE_MAP = {
		// Primary colors
		'color_primary': '--color-primary',
		'color_primary_dark': '--color-primary-dark',
		'color_primary_light': '--color-primary-light',
		'color_primary_lighter': '--color-primary-lighter',
		'color_primary_lightest': '--color-primary-lightest',
		
		// Secondary colors
		'color_secondary': '--color-secondary',
		'color_secondary_dark': '--color-secondary-dark',
		'color_secondary_light': '--color-secondary-light',
		'color_secondary_lighter': '--color-secondary-lighter',
		'color_secondary_lightest': '--color-secondary-lightest',
		
		// Accent colors
		'color_accent': '--color-accent',
		'color_accent_dark': '--color-accent-dark',
		'color_accent_light': '--color-accent-light',
		'color_accent_lighter': '--color-accent-lighter',
		'color_accent_lightest': '--color-accent-lightest',
		
		// Text colors
		'color_text_primary': '--color-text-primary',
		'color_text_secondary': '--color-text-secondary',
		'color_text_tertiary': '--color-text-tertiary',
		'color_text_light': '--color-text-light',
		'color_text_lighter': '--color-text-lighter',
		
		// Background colors
		'color_bg_white': '--color-bg-white',
		'color_bg_gray': '--color-bg-gray',
		'color_bg_gray_light': '--color-bg-gray-light',
		'color_bg_gray_lighter': '--color-bg-gray-lighter',
		'color_bg_light_blue': '--color-bg-light-blue',
		
		// Sidebar colors
		'sidebar_bg_solid': '--sidebar-bg-solid',
		'sidebar_border_color': '--sidebar-border-color',
		'sidebar_hover_bg': '--sidebar-hover-bg',
		'sidebar_active_bg_solid': '--sidebar-active-bg-solid',
		'sidebar_active_color': '--sidebar-active-color',
		
		// Border colors
		'color_border': '--color-border',
		'color_border_dark': '--color-border-dark',
		'color_border_light': '--color-border-light',
		
		// Status colors
		'color_success': '--color-success',
		'color_error': '--color-error',
		'color_warning': '--color-warning',
		'color_info': '--color-info',
		
		// Avatar colors
		'avatar_frame_bg': '--avatar-frame-bg',
		'avatar_frame_color': '--avatar-frame-color',
		'avatar_frame_border': '--avatar-frame-border',
	};

	/**
	 * Apply theme settings to CSS variables
	 */
	function applyThemeSettings(themeSettings) {
		if (!themeSettings || typeof themeSettings !== 'object') {
			console.warn('IRT Theme Settings: No theme settings found');
			return;
		}

		const root = document.documentElement;
		let appliedCount = 0;

		// Apply each theme setting to corresponding CSS variable
		Object.keys(themeSettings).forEach(fieldName => {
			const cssVarName = CSS_VARIABLE_MAP[fieldName];
			const value = themeSettings[fieldName];

			if (cssVarName && value) {
				root.style.setProperty(cssVarName, value);
				appliedCount++;
			}
		});

		// Generate rgba variants for primary and secondary colors
		generateRgbaVariants(themeSettings, root);

		console.log(`IRT Theme Settings: Applied ${appliedCount} theme variables`);
	}

	/**
	 * Generate rgba variants for primary and secondary colors
	 */
	function generateRgbaVariants(themeSettings, root) {
		const colors = ['primary', 'secondary'];
		
		colors.forEach(colorType => {
			const baseColor = themeSettings[`color_${colorType}`];
			if (baseColor) {
				// Convert hex to rgb
				const rgb = hexToRgb(baseColor);
				if (rgb) {
					const opacities = [8, 10, 15, 20, 30, 40, 50];
					opacities.forEach(opacity => {
						const cssVar = `--color-${colorType}-rgba-${opacity}`;
						const rgbaValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
						root.style.setProperty(cssVar, rgbaValue);
					});
				}
			}
		});
	}

	/**
	 * Convert hex color to RGB
	 */
	function hexToRgb(hex) {
		// Remove # if present
		hex = hex.replace('#', '');
		
		// Handle 3-digit hex
		if (hex.length === 3) {
			hex = hex.split('').map(char => char + char).join('');
		}
		
		const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	/**
	 * Initialize theme on page load
	 */
	function initTheme() {
		// Get theme settings from boot data
		if (frappe.boot && frappe.boot.irt_theme_settings) {
			applyThemeSettings(frappe.boot.irt_theme_settings);
		} else {
			// Fallback: Try to fetch from API
			frappe.call({
				method: 'irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings.get_theme_settings_api',
				callback: function(r) {
					if (r.message) {
						applyThemeSettings(r.message);
					}
				}
			});
		}
	}

	/**
	 * Reload theme settings (useful after updating theme)
	 */
	function reloadTheme() {
		frappe.call({
			method: 'irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings.get_theme_settings_api',
			callback: function(r) {
				if (r.message) {
					applyThemeSettings(r.message);
					frappe.show_alert({
						message: __('Theme updated successfully'),
						indicator: 'green'
					}, 3);
				}
			}
		});
	}

	// Apply theme when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initTheme);
	} else {
		initTheme();
	}

	// Expose reload function globally for use in form scripts
	window.irtTheme = {
		reload: reloadTheme,
		apply: applyThemeSettings
	};

	// Listen for theme updates (if using frappe's realtime)
	if (frappe.realtime) {
		frappe.realtime.on('irt_theme_updated', function() {
			reloadTheme();
		});
	}

})();

