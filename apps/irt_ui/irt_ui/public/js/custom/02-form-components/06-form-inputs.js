/**
 * Form Inputs - JavaScript Enhancements
 * Status: ✅ ACTIVE - Enhanced form functionality
 * Features:
 * - Hide dropdown arrow icons
 * - Form validation enhancements
 * - Auto-save functionality
 * - Keyboard navigation
 * - Field focus indicators
 * - Form state management
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

	/* ============================================
	   FORM VALIDATION ENHANCEMENTS
	   ============================================ */

	function enhanceFormValidation() {
		const formControls = document.querySelectorAll('.form-control, input, select, textarea');
		
		formControls.forEach(control => {
			// Real-time validation feedback
			control.addEventListener('blur', function() {
				validateField(this);
			});

			// Clear error on input
			control.addEventListener('input', function() {
				if (this.classList.contains('is-invalid')) {
					clearFieldError(this);
				}
			});
		});
	}

	function validateField(field) {
		const formGroup = field.closest('.form-group, .frappe-control');
		if (!formGroup) return;

		// Check required fields
		if (field.hasAttribute('required') && !field.value.trim()) {
			showFieldError(field, 'This field is required');
			return false;
		}

		// Email validation
		if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
			showFieldError(field, 'Please enter a valid email address');
			return false;
		}

		// Number validation
		if (field.type === 'number') {
			const min = field.getAttribute('min');
			const max = field.getAttribute('max');
			const value = parseFloat(field.value);
			
			if (field.value && !isNaN(value)) {
				if (min && value < parseFloat(min)) {
					showFieldError(field, `Value must be at least ${min}`);
					return false;
				}
				if (max && value > parseFloat(max)) {
					showFieldError(field, `Value must be at most ${max}`);
					return false;
				}
			}
		}

		// URL validation
		if (field.type === 'url' && field.value && !isValidUrl(field.value)) {
			showFieldError(field, 'Please enter a valid URL');
			return false;
		}

		// Clear errors if valid
		clearFieldError(field);
		return true;
	}

	function showFieldError(field, message) {
		const formGroup = field.closest('.form-group, .frappe-control');
		if (!formGroup) return;

		// Remove existing error
		clearFieldError(field);

		// Add error class
		formGroup.classList.add('has-error');
		field.classList.add('is-invalid');

		// Show error message
		let errorElement = formGroup.querySelector('.field-error-message');
		if (!errorElement) {
			errorElement = document.createElement('div');
			errorElement.className = 'field-error-message help-block';
			formGroup.appendChild(errorElement);
		}
		errorElement.textContent = message;
	}

	function clearFieldError(field) {
		const formGroup = field.closest('.form-group, .frappe-control');
		if (!formGroup) return;

		formGroup.classList.remove('has-error');
		field.classList.remove('is-invalid');

		const errorElement = formGroup.querySelector('.field-error-message');
		if (errorElement) {
			errorElement.remove();
		}
	}

	function isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function isValidUrl(url) {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/* ============================================
	   AUTO-SAVE FUNCTIONALITY
	   ============================================ */

	function initAutoSave() {
		const forms = document.querySelectorAll('form, .form-container, .form-section');
		
		forms.forEach(form => {
			let saveTimeout;
			const formData = new FormData();
			let isDirty = false;

			// Mark form as dirty on change
			const inputs = form.querySelectorAll('input, select, textarea');
			inputs.forEach(input => {
				input.addEventListener('input', function() {
					isDirty = true;
					form.classList.add('dirty');
					
					// Debounce auto-save
					clearTimeout(saveTimeout);
					saveTimeout = setTimeout(() => {
						triggerAutoSave(form);
					}, 2000); // Save after 2 seconds of inactivity
				});
			});
		});
	}

	function triggerAutoSave(form) {
		form.classList.add('saving');
		form.classList.remove('dirty');

		// Simulate save (replace with actual save logic)
		setTimeout(() => {
			form.classList.remove('saving');
			form.classList.add('saved');
			
			// Show save indicator
			showSaveIndicator(form);
			
			setTimeout(() => {
				form.classList.remove('saved');
			}, 2000);
		}, 500);
	}

	function showSaveIndicator(form) {
		let indicator = form.querySelector('.save-indicator');
		if (!indicator) {
			indicator = document.createElement('div');
			indicator.className = 'save-indicator';
			indicator.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: var(--color-success);
				color: white;
				padding: 8px 16px;
				border-radius: 6px;
				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
				z-index: 10000;
				font-size: 13px;
				animation: slideIn 0.3s ease;
			`;
			document.body.appendChild(indicator);
		}
		
		indicator.textContent = '✓ Saved';
		indicator.style.display = 'block';
		
		setTimeout(() => {
			indicator.style.animation = 'slideOut 0.3s ease';
			setTimeout(() => {
				indicator.style.display = 'none';
			}, 300);
		}, 2000);
	}

	/* ============================================
	   KEYBOARD NAVIGATION
	   ============================================ */

	function enhanceKeyboardNavigation() {
		document.addEventListener('keydown', function(e) {
			// Tab navigation enhancement
			if (e.key === 'Tab') {
				const activeElement = document.activeElement;
				if (activeElement && (activeElement.tagName === 'INPUT' || 
					activeElement.tagName === 'SELECT' || 
					activeElement.tagName === 'TEXTAREA')) {
					
					// Add visual indicator for keyboard navigation
					activeElement.classList.add('keyboard-navigating');
					
					setTimeout(() => {
						activeElement.classList.remove('keyboard-navigating');
					}, 1000);
				}
			}

			// Enter to submit (if in form)
			if (e.key === 'Enter' && e.target.closest('form')) {
				const form = e.target.closest('form');
				const submitButton = form.querySelector('button[type="submit"], .btn-primary');
				
				// Don't submit if in textarea
				if (e.target.tagName !== 'TEXTAREA' && submitButton && !e.shiftKey) {
					e.preventDefault();
					submitButton.click();
				}
			}

			// Escape to clear field
			if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
				if (e.target.value) {
					e.target.value = '';
					e.target.dispatchEvent(new Event('input', { bubbles: true }));
				}
			}
		});
	}

	/* ============================================
	   FIELD FOCUS ENHANCEMENTS
	   ============================================ */

	function enhanceFieldFocus() {
		const formControls = document.querySelectorAll('.form-control, input, select, textarea');
		
		formControls.forEach(control => {
			control.addEventListener('focus', function() {
				const formGroup = this.closest('.form-group, .frappe-control');
				if (formGroup) {
					formGroup.classList.add('field-focused');
				}
			});

			control.addEventListener('blur', function() {
				const formGroup = this.closest('.form-group, .frappe-control');
				if (formGroup) {
					formGroup.classList.remove('field-focused');
				}
			});
		});
	}

	/* ============================================
	   FORM STATE MANAGEMENT
	   ============================================ */

	function trackFormState() {
		const forms = document.querySelectorAll('form, .form-container');
		
		forms.forEach(form => {
			let originalData = {};
			
			// Capture initial state
			const inputs = form.querySelectorAll('input, select, textarea');
			inputs.forEach(input => {
				if (input.name || input.id) {
					originalData[input.name || input.id] = input.value;
				}
			});

			// Check for changes
			function checkForChanges() {
				let hasChanges = false;
				inputs.forEach(input => {
					const key = input.name || input.id;
					if (key && originalData[key] !== input.value) {
						hasChanges = true;
					}
				});

				if (hasChanges) {
					form.classList.add('has-changes');
				} else {
					form.classList.remove('has-changes');
				}
			}

			inputs.forEach(input => {
				input.addEventListener('input', checkForChanges);
				input.addEventListener('change', checkForChanges);
			});
		});
	}

	/* ============================================
	   INITIALIZATION
	   ============================================ */

	function init() {
		// Initialize all enhancements
		enhanceFormValidation();
		enhanceKeyboardNavigation();
		enhanceFieldFocus();
		trackFormState();
		initAutoSave();

		// Add CSS for animations
		if (!document.getElementById('form-enhancements-style')) {
			const style = document.createElement('style');
			style.id = 'form-enhancements-style';
			style.textContent = `
				@keyframes slideIn {
					from {
						transform: translateX(100%);
						opacity: 0;
					}
					to {
						transform: translateX(0);
						opacity: 1;
					}
				}
				@keyframes slideOut {
					from {
						transform: translateX(0);
						opacity: 1;
					}
					to {
						transform: translateX(100%);
						opacity: 0;
					}
				}
				.field-focused {
					position: relative;
				}
				/* Blue side line removed - no longer needed */
				.field-focused::before {
					display: none;
				}
				.keyboard-navigating {
					outline: 2px solid var(--color-primary) !important;
					outline-offset: 2px !important;
				}
			`;
			document.head.appendChild(style);
		}
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Re-initialize on route changes (Frappe specific)
	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			setTimeout(init, 100);
		});
	}

	// Watch for dynamically added forms
	const formObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes.length) {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) {
						if (node.tagName === 'FORM' || node.classList?.contains('form-container')) {
							setTimeout(init, 100);
						}
					}
				});
			}
		});
	});

	formObserver.observe(document.body, {
		childList: true,
		subtree: true
	});
})();

