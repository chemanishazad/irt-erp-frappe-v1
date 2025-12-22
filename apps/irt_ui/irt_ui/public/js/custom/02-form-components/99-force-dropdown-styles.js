/**
 * Force dropdown styles in forms
 * ULTRA AGGRESSIVE VERSION - Uses computed color values
 */

(function() {
	'use strict';
	
	console.log('[IRT UI] Dropdown force styles script loaded');

	// Get computed CSS variable values as actual colors
	function getComputedColor(varName, fallback) {
		try {
			const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
			if (value) {
				// If it's a CSS variable reference, resolve it
				if (value.startsWith('var(')) {
					// Create a test element to get computed value
					const testEl = document.createElement('div');
					testEl.style.setProperty('background-color', value);
					document.body.appendChild(testEl);
					const computed = getComputedStyle(testEl).backgroundColor;
					document.body.removeChild(testEl);
					return computed || fallback;
				}
				return value;
			}
		} catch (e) {}
		return fallback;
	}

	// Get actual color values
	let whiteColor = '#ffffff';
	let primaryColor = '#0066ff';
	let primaryRgba10 = 'rgba(0, 102, 255, 0.1)';
	let textColor = '#333333';
	let fontSize = '14px';

	// Initialize colors when DOM is ready
	function initColors() {
		whiteColor = getComputedColor('--color-bg-white', '#ffffff');
		primaryColor = getComputedColor('--color-primary', '#0066ff');
		primaryRgba10 = getComputedColor('--color-primary-rgba-10', 'rgba(0, 102, 255, 0.1)');
		textColor = getComputedColor('--color-text-primary', '#333333');
		fontSize = getComputedColor('--font-size-sm', '14px');
	}

	// Inject a style tag with maximum specificity
	function injectStyleTag() {
		// Remove existing injected style if any
		const existing = document.getElementById('irt-ui-dropdown-force-styles');
		if (existing) {
			existing.remove();
		}

		const style = document.createElement('style');
		style.id = 'irt-ui-dropdown-force-styles';
		style.textContent = `
			/* FORCE DROPDOWN STYLES - MAXIMUM SPECIFICITY */
			/* Custom dropdown menus */
			html body .form-section .dropdown-menu li,
			html body .form-section .select-dropdown li,
			html body .form-section .awesomplete ul li,
			html body .form-section ul.dropdown-menu li,
			html body .form-section ul.select-dropdown li,
			html body .form-section .section-body .dropdown-menu li,
			html body .form-section .section-body .select-dropdown li,
			html body .form-section .section-body .awesomplete ul li,
			html body .form-section .frappe-control .dropdown-menu li,
			html body .form-section .frappe-control .select-dropdown li,
			html body .form-section .frappe-control .awesomplete ul li {
				background-color: ${whiteColor} !important;
				background: ${whiteColor} !important;
				color: ${textColor} !important;
				font-size: ${fontSize} !important;
			}

			html body .form-section .dropdown-menu li:hover,
			html body .form-section .dropdown-menu li.active,
			html body .form-section .dropdown-menu li.selected,
			html body .form-section .dropdown-menu li[aria-selected="true"],
			html body .form-section .select-dropdown li:hover,
			html body .form-section .select-dropdown li.active,
			html body .form-section .select-dropdown li.selected,
			html body .form-section .select-dropdown li[aria-selected="true"],
			html body .form-section .awesomplete ul li:hover,
			html body .form-section .awesomplete ul li.active,
			html body .form-section .awesomplete ul li.selected,
			html body .form-section .awesomplete ul li[aria-selected="true"] {
				background-color: ${primaryRgba10} !important;
				background: ${primaryRgba10} !important;
				color: ${primaryColor} !important;
				font-size: ${fontSize} !important;
			}

			/* Native select elements - option styling */
			html body .form-section select option,
			html body .form-section .frappe-control select option,
			html body .form-section .section-body select option {
				background-color: ${whiteColor} !important;
				color: ${textColor} !important;
				font-size: ${fontSize} !important;
			}

			html body .form-section select option:checked,
			html body .form-section select option:hover,
			html body .form-section .frappe-control select option:checked,
			html body .form-section .frappe-control select option:hover {
				background-color: ${primaryRgba10} !important;
				color: ${primaryColor} !important;
			}
		`;
		document.head.appendChild(style);
	}

	// Function to force dropdown styles - ULTRA AGGRESSIVE
	function forceDropdownStyles() {
		// Target ALL possible dropdown items - use more generic selectors
		const allLis = document.querySelectorAll('li');
		let foundCount = 0;
		
		allLis.forEach(function(item) {
			// Only process items inside form sections
			if (!item.closest('.form-section')) {
				return;
			}

			// Skip grid/list items
			if (item.closest('.grid-form-heading') || 
			    item.closest('.list-row') ||
			    item.closest('.grid-row') ||
			    item.classList.contains('grid-form-heading') ||
			    item.classList.contains('list-row')) {
				return;
			}

			// Check if it's in a dropdown context
			const isInDropdown = item.closest('.dropdown-menu, .select-dropdown, .awesomplete ul, ul.dropdown-menu, ul.select-dropdown');
			if (!isInDropdown) {
				return;
			}

			foundCount++;

			// Check if it's hovered/selected/active
			const isHovered = item.matches(':hover');
			const isSelected = item.hasAttribute('aria-selected') && item.getAttribute('aria-selected') === 'true';
			const isActive = item.classList.contains('active') || item.classList.contains('selected');

			// FORCE remove ALL inline background styles
			item.style.removeProperty('background');
			item.style.removeProperty('background-color');
			item.style.removeProperty('background-image');

			// Apply correct styles based on state using actual color values
			if (isHovered || isSelected || isActive) {
				// Hover/Selected state - use theme color
				item.style.setProperty('background-color', primaryRgba10, 'important');
				item.style.setProperty('color', primaryColor, 'important');
			} else {
				// Normal state - white background
				item.style.setProperty('background-color', whiteColor, 'important');
				item.style.setProperty('color', textColor, 'important');
			}

			// Always set font size
			item.style.setProperty('font-size', fontSize, 'important');
		});

		// Debug: log if we found items (only first time)
		if (foundCount > 0 && !window._irtDropdownDebugLogged) {
			console.log('[IRT UI] Found', foundCount, 'dropdown items in form sections');
			window._irtDropdownDebugLogged = true;
		}
	}

	// Initialize colors first
	initColors();
	injectStyleTag();

	// Run when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			initColors();
			injectStyleTag();
			forceDropdownStyles();
		});
	} else {
		initColors();
		injectStyleTag();
		forceDropdownStyles();
	}

	// Run with Frappe ready (if available)
	if (typeof frappe !== 'undefined' && typeof frappe.ready === 'function') {
		frappe.ready(function() {
			initColors();
			injectStyleTag();
			forceDropdownStyles();
		});
	}

	// Re-inject style tag when colors are updated
	const originalInitColors = initColors;
	initColors = function() {
		originalInitColors();
		injectStyleTag();
	};

	// ULTRA AGGRESSIVE: Run continuously every 100ms to catch any style changes
	const intervalId = setInterval(function() {
		forceDropdownStyles();
	}, 100);

	// Keep running indefinitely - don't stop after 30 seconds

	// Watch for DOM changes
	const observer = new MutationObserver(function() {
		forceDropdownStyles();
	});

	// Start observing immediately
	if (document.body) {
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['style', 'class', 'aria-selected']
		});
	} else {
		// Wait for body to exist
		const bodyObserver = new MutationObserver(function() {
			if (document.body) {
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['style', 'class', 'aria-selected']
				});
				bodyObserver.disconnect();
			}
		});
		bodyObserver.observe(document.documentElement, {
			childList: true,
			subtree: true
		});
	}

	// Listen for mouse events to catch hover states
	document.addEventListener('mouseover', function(e) {
		if (e.target.matches('.form-section .dropdown-menu li, .form-section .select-dropdown li, .form-section .awesomplete ul li')) {
			forceDropdownStyles();
		}
	}, true);

	// Listen for form events
	if (typeof $ !== 'undefined') {
		$(document).on('form-refresh form-load', function() {
			setTimeout(forceDropdownStyles, 100);
		});
	}

	// Also run on window focus (in case styles were changed while tab was inactive)
	window.addEventListener('focus', forceDropdownStyles);
})();
