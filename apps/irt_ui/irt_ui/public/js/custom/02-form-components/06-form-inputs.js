/**
 * Form Inputs - JavaScript Enhancements
 * Status: ✅ ACTIVE - Hide dropdown arrow icons
 */

(function() {
	'use strict';

	// Override Frappe's icon function to prevent select icon creation
	if (typeof frappe !== 'undefined' && frappe.utils && frappe.utils.icon) {
		const originalIcon = frappe.utils.icon;
		frappe.utils.icon = function(name, size) {
			// If it's a select icon, return empty string
			if (name === 'select') {
				return '';
			}
			// Otherwise use original function
			return originalIcon.apply(this, arguments);
		};
	}

	// Function to hide all arrow icons - More aggressive and direct
	function hideArrowIcons() {
		// Direct removal of select-icon elements - Try multiple times
		for (let i = 0; i < 5; i++) {
			const selectIcons = document.querySelectorAll('.select-icon');
			selectIcons.forEach(icon => {
				// Try to remove the element completely
				try {
					if (icon && icon.parentNode) {
						icon.remove();
					}
				} catch (e) {
					// If removal fails, hide it completely
					if (icon) {
						icon.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important;';
					}
				}
			});
		}

		// Hide select icons - All possible selectors
		const selectors = [
			'.select-icon',
			'[class*="select-icon"]',
			'.frappe-control[data-fieldtype="Select"] .select-icon',
			'.frappe-control[data-fieldtype="Select"] .control-input .select-icon',
			'.frappe-control[data-fieldtype="Select"] .form-group .select-icon',
			'.link-field .select-icon',
			'.select-input .select-icon',
			'.control-input .select-icon'
		];

		selectors.forEach(selector => {
			try {
				const elements = document.querySelectorAll(selector);
				elements.forEach(el => {
					// Remove element if possible
					if (el.parentNode && el.classList.contains('select-icon')) {
						el.remove();
					} else {
						// Otherwise hide completely
						el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important;';
					}
				});
			} catch (e) {
				// Ignore invalid selectors
			}
		});

		// Hide any SVG icons inside select controls
		const svgSelectors = [
			'.frappe-control[data-fieldtype="Select"] svg',
			'.select-icon svg',
			'.link-field svg',
			'.frappe-control[data-fieldtype="Select"] .icon svg',
			'.select-icon .icon svg'
		];

		svgSelectors.forEach(selector => {
			try {
				const svgElements = document.querySelectorAll(selector);
				svgElements.forEach(svg => {
					const parent = svg.closest('.select-icon') || svg.parentElement;
					if (parent) {
						parent.style.setProperty('display', 'none', 'important');
						parent.style.setProperty('visibility', 'hidden', 'important');
					}
					svg.style.setProperty('display', 'none', 'important');
					svg.style.setProperty('visibility', 'hidden', 'important');
				});
			} catch (e) {
				// Ignore invalid selectors
			}
		});

		// Hide icon elements
		const iconSelectors = [
			'.frappe-control[data-fieldtype="Select"] .icon',
			'.select-icon .icon',
			'.frappe-control[data-fieldtype="Select"] .select-icon .icon'
		];

		iconSelectors.forEach(selector => {
			try {
				const iconElements = document.querySelectorAll(selector);
				iconElements.forEach(icon => {
					icon.style.setProperty('display', 'none', 'important');
					icon.style.setProperty('visibility', 'hidden', 'important');
					icon.style.setProperty('opacity', '0', 'important');
				});
			} catch (e) {
				// Ignore invalid selectors
			}
		});

		// Hide any elements with right arrow characters or icons
		const allElements = document.querySelectorAll('*');
		allElements.forEach(el => {
			const text = el.textContent || '';
			const classList = Array.from(el.classList || []);
			const hasArrowClass = classList.some(cls => 
				cls.includes('arrow') || 
				cls.includes('chevron') || 
				cls.includes('select-icon') ||
				cls.includes('dropdown-icon')
			);
			
			if (hasArrowClass && el.closest('.frappe-control[data-fieldtype="Select"]')) {
				el.style.setProperty('display', 'none', 'important');
				el.style.setProperty('visibility', 'hidden', 'important');
			}
		});
	}

	// Run immediately and multiple times
	function initHideArrows() {
		hideArrowIcons();
		setTimeout(hideArrowIcons, 50);
		setTimeout(hideArrowIcons, 100);
		setTimeout(hideArrowIcons, 200);
		setTimeout(hideArrowIcons, 500);
		setTimeout(hideArrowIcons, 1000);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initHideArrows);
	} else {
		initHideArrows();
	}

	// Watch for dynamically added elements - More aggressive
	const observer = new MutationObserver(function(mutations) {
		let shouldRun = false;
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes.length) {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) { // Element node
						if (node.classList && (
							node.classList.contains('select-icon') ||
							node.querySelector && node.querySelector('.select-icon')
						)) {
							shouldRun = true;
						}
					}
				});
			}
			if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
				const target = mutation.target;
				if (target.classList && target.classList.contains('select-icon')) {
					shouldRun = true;
				}
			}
		});
		if (shouldRun) {
			setTimeout(hideArrowIcons, 10);
			setTimeout(hideArrowIcons, 50);
			setTimeout(hideArrowIcons, 100);
		}
	});

	// Start observing with more options
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['class', 'style']
	});

	// Re-run on route changes (Frappe specific)
	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			setTimeout(hideArrowIcons, 50);
			setTimeout(hideArrowIcons, 100);
			setTimeout(hideArrowIcons, 200);
			setTimeout(hideArrowIcons, 500);
		});
	}

	// Also run periodically to catch any missed elements - More frequent
	setInterval(hideArrowIcons, 500);
})();

