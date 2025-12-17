// /**
//  * Form Inputs - JavaScript Enhancements
//  * Status: ✅ ACTIVE - Enhanced form functionality
//  * Features:
//  * - Hide dropdown arrow icons
//  * - Form validation enhancements
//  * - Auto-save functionality
//  * - Keyboard navigation
//  * - Field focus indicators
//  * - Form state management
//  */

// (function() {
// 	'use strict';

// 	// Override Frappe's icon function to prevent select icon creation
// 	if (typeof frappe !== 'undefined' && frappe.utils && frappe.utils.icon) {
// 		const originalIcon = frappe.utils.icon;
// 		frappe.utils.icon = function(name, size) {
// 			// If it's a select icon, return empty string
// 			if (name === 'select') {
// 				return '';
// 			}
// 			// Otherwise use original function
// 			return originalIcon.apply(this, arguments);
// 		};
// 	}

// 	// Function to hide all arrow icons - More aggressive and direct
// 	function hideArrowIcons() {
// 		// Direct removal of select-icon elements - Try multiple times
// 		for (let i = 0; i < 5; i++) {
// 			const selectIcons = document.querySelectorAll('.select-icon');
// 			selectIcons.forEach(icon => {
// 				// Try to remove the element completely
// 				try {
// 					if (icon && icon.parentNode) {
// 						icon.remove();
// 					}
// 				} catch (e) {
// 					// If removal fails, hide it completely
// 					if (icon) {
// 						icon.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important;';
// 					}
// 				}
// 			});
// 		}

// 		// Hide select icons - All possible selectors
// 		const selectors = [
// 			'.select-icon',
// 			'[class*="select-icon"]',
// 			'.frappe-control[data-fieldtype="Select"] .select-icon',
// 			'.frappe-control[data-fieldtype="Select"] .control-input .select-icon',
// 			'.frappe-control[data-fieldtype="Select"] .form-group .select-icon',
// 			'.link-field .select-icon',
// 			'.select-input .select-icon',
// 			'.control-input .select-icon'
// 		];

// 		selectors.forEach(selector => {
// 			try {
// 				const elements = document.querySelectorAll(selector);
// 				elements.forEach(el => {
// 					// Remove element if possible
// 					if (el.parentNode && el.classList.contains('select-icon')) {
// 						el.remove();
// 					} else {
// 						// Otherwise hide completely
// 						el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important;';
// 					}
// 				});
// 			} catch (e) {
// 				// Ignore invalid selectors
// 			}
// 		});

// 		// Hide any SVG icons inside select controls
// 		const svgSelectors = [
// 			'.frappe-control[data-fieldtype="Select"] svg',
// 			'.select-icon svg',
// 			'.link-field svg',
// 			'.frappe-control[data-fieldtype="Select"] .icon svg',
// 			'.select-icon .icon svg'
// 		];

// 		svgSelectors.forEach(selector => {
// 			try {
// 				const svgElements = document.querySelectorAll(selector);
// 				svgElements.forEach(svg => {
// 					const parent = svg.closest('.select-icon') || svg.parentElement;
// 					if (parent) {
// 						parent.style.setProperty('display', 'none', 'important');
// 						parent.style.setProperty('visibility', 'hidden', 'important');
// 					}
// 					svg.style.setProperty('display', 'none', 'important');
// 					svg.style.setProperty('visibility', 'hidden', 'important');
// 				});
// 			} catch (e) {
// 				// Ignore invalid selectors
// 			}
// 		});

// 		// Hide icon elements
// 		const iconSelectors = [
// 			'.frappe-control[data-fieldtype="Select"] .icon',
// 			'.select-icon .icon',
// 			'.frappe-control[data-fieldtype="Select"] .select-icon .icon'
// 		];

// 		iconSelectors.forEach(selector => {
// 			try {
// 				const iconElements = document.querySelectorAll(selector);
// 				iconElements.forEach(icon => {
// 					icon.style.setProperty('display', 'none', 'important');
// 					icon.style.setProperty('visibility', 'hidden', 'important');
// 					icon.style.setProperty('opacity', '0', 'important');
// 				});
// 			} catch (e) {
// 				// Ignore invalid selectors
// 			}
// 		});

// 		// Hide any elements with right arrow characters or icons
// 		const allElements = document.querySelectorAll('*');
// 		allElements.forEach(el => {
// 			const text = el.textContent || '';
// 			const classList = Array.from(el.classList || []);
// 			const hasArrowClass = classList.some(cls => 
// 				cls.includes('arrow') || 
// 				cls.includes('chevron') || 
// 				cls.includes('select-icon') ||
// 				cls.includes('dropdown-icon')
// 			);
			
// 			if (hasArrowClass && el.closest('.frappe-control[data-fieldtype="Select"]')) {
// 				el.style.setProperty('display', 'none', 'important');
// 				el.style.setProperty('visibility', 'hidden', 'important');
// 			}
// 		});
// 	}

// 	// Run immediately and multiple times
// 	function initHideArrows() {
// 		hideArrowIcons();
// 		setTimeout(hideArrowIcons, 50);
// 		setTimeout(hideArrowIcons, 100);
// 		setTimeout(hideArrowIcons, 200);
// 		setTimeout(hideArrowIcons, 500);
// 		setTimeout(hideArrowIcons, 1000);
// 	}

// 	if (document.readyState === 'loading') {
// 		document.addEventListener('DOMContentLoaded', initHideArrows);
// 	} else {
// 		initHideArrows();
// 	}

// 	// Watch for dynamically added elements - More aggressive
// 	const observer = new MutationObserver(function(mutations) {
// 		let shouldRun = false;
// 		mutations.forEach(function(mutation) {
// 			if (mutation.addedNodes.length) {
// 				mutation.addedNodes.forEach(node => {
// 					if (node.nodeType === 1) { // Element node
// 						if (node.classList && (
// 							node.classList.contains('select-icon') ||
// 							node.querySelector && node.querySelector('.select-icon')
// 						)) {
// 							shouldRun = true;
// 						}
// 					}
// 				});
// 			}
// 			if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
// 				const target = mutation.target;
// 				if (target.classList && target.classList.contains('select-icon')) {
// 					shouldRun = true;
// 				}
// 			}
// 		});
// 		if (shouldRun) {
// 			setTimeout(hideArrowIcons, 10);
// 			setTimeout(hideArrowIcons, 50);
// 			setTimeout(hideArrowIcons, 100);
// 		}
// 	});

// 	// Start observing with more options
// 	observer.observe(document.body, {
// 		childList: true,
// 		subtree: true,
// 		attributes: true,
// 		attributeFilter: ['class', 'style']
// 	});

// 	// Re-run on route changes (Frappe specific)
// 	if (typeof frappe !== 'undefined') {
// 		frappe.router?.on('change', function() {
// 			setTimeout(hideArrowIcons, 50);
// 			setTimeout(hideArrowIcons, 100);
// 			setTimeout(hideArrowIcons, 200);
// 			setTimeout(hideArrowIcons, 500);
// 		});
// 	}

// 	// Also run periodically to catch any missed elements - More frequent
// 	setInterval(hideArrowIcons, 500);

// 	/* ============================================
// 	   FORM VALIDATION ENHANCEMENTS
// 	   ============================================ */

// 	function enhanceFormValidation() {
// 		const formControls = document.querySelectorAll('.form-control, input, select, textarea');
		
// 		formControls.forEach(control => {
// 			// Real-time validation feedback
// 			control.addEventListener('blur', function() {
// 				validateField(this);
// 			});

// 			// Clear error on input
// 			control.addEventListener('input', function() {
// 				if (this.classList.contains('is-invalid')) {
// 					clearFieldError(this);
// 				}
// 			});
// 		});
// 	}

// 	function validateField(field) {
// 		const formGroup = field.closest('.form-group, .frappe-control');
// 		if (!formGroup) return;

// 		// Check required fields
// 		if (field.hasAttribute('required') && !field.value.trim()) {
// 			showFieldError(field, 'This field is required');
// 			return false;
// 		}

// 		// Email validation
// 		if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
// 			showFieldError(field, 'Please enter a valid email address');
// 			return false;
// 		}

// 		// Number validation
// 		if (field.type === 'number') {
// 			const min = field.getAttribute('min');
// 			const max = field.getAttribute('max');
// 			const value = parseFloat(field.value);
			
// 			if (field.value && !isNaN(value)) {
// 				if (min && value < parseFloat(min)) {
// 					showFieldError(field, `Value must be at least ${min}`);
// 					return false;
// 				}
// 				if (max && value > parseFloat(max)) {
// 					showFieldError(field, `Value must be at most ${max}`);
// 					return false;
// 				}
// 			}
// 		}

// 		// URL validation
// 		if (field.type === 'url' && field.value && !isValidUrl(field.value)) {
// 			showFieldError(field, 'Please enter a valid URL');
// 			return false;
// 		}

// 		// Clear errors if valid
// 		clearFieldError(field);
// 		return true;
// 	}

// 	function showFieldError(field, message) {
// 		const formGroup = field.closest('.form-group, .frappe-control');
// 		if (!formGroup) return;

// 		// Remove existing error
// 		clearFieldError(field);

// 		// Add error class
// 		formGroup.classList.add('has-error');
// 		field.classList.add('is-invalid');

// 		// Show error message
// 		let errorElement = formGroup.querySelector('.field-error-message');
// 		if (!errorElement) {
// 			errorElement = document.createElement('div');
// 			errorElement.className = 'field-error-message help-block';
// 			formGroup.appendChild(errorElement);
// 		}
// 		errorElement.textContent = message;
// 	}

// 	function clearFieldError(field) {
// 		const formGroup = field.closest('.form-group, .frappe-control');
// 		if (!formGroup) return;

// 		formGroup.classList.remove('has-error');
// 		field.classList.remove('is-invalid');

// 		const errorElement = formGroup.querySelector('.field-error-message');
// 		if (errorElement) {
// 			errorElement.remove();
// 		}
// 	}

// 	function isValidEmail(email) {
// 		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// 	}

// 	function isValidUrl(url) {
// 		try {
// 			new URL(url);
// 			return true;
// 		} catch {
// 			return false;
// 		}
// 	}

// 	/* ============================================
// 	   AUTO-SAVE FUNCTIONALITY
// 	   ============================================ */

// 	function initAutoSave() {
// 		const forms = document.querySelectorAll('form, .form-container, .form-section');
		
// 		forms.forEach(form => {
// 			let saveTimeout;
// 			const formData = new FormData();
// 			let isDirty = false;

// 			// Mark form as dirty on change
// 			const inputs = form.querySelectorAll('input, select, textarea');
// 			inputs.forEach(input => {
// 				input.addEventListener('input', function() {
// 					isDirty = true;
// 					form.classList.add('dirty');
					
// 					// Debounce auto-save
// 					clearTimeout(saveTimeout);
// 					saveTimeout = setTimeout(() => {
// 						triggerAutoSave(form);
// 					}, 2000); // Save after 2 seconds of inactivity
// 				});
// 			});
// 		});
// 	}

// 	function triggerAutoSave(form) {
// 		form.classList.add('saving');
// 		form.classList.remove('dirty');

// 		// Simulate save (replace with actual save logic)
// 		setTimeout(() => {
// 			form.classList.remove('saving');
// 			form.classList.add('saved');
			
// 			// Show save indicator
// 			showSaveIndicator(form);
			
// 			setTimeout(() => {
// 				form.classList.remove('saved');
// 			}, 2000);
// 		}, 500);
// 	}

// 	function showSaveIndicator(form) {
// 		let indicator = form.querySelector('.save-indicator');
// 		if (!indicator) {
// 			indicator = document.createElement('div');
// 			indicator.className = 'save-indicator';
// 			indicator.style.cssText = `
// 				position: fixed;
// 				top: 20px;
// 				right: 20px;
// 				background: var(--color-success);
// 				color: white;
// 				padding: 8px 16px;
// 				border-radius: 6px;
// 				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
// 				z-index: 10000;
// 				font-size: 13px;
// 				animation: slideIn 0.3s ease;
// 			`;
// 			document.body.appendChild(indicator);
// 		}
		
// 		indicator.textContent = '✓ Saved';
// 		indicator.style.display = 'block';
		
// 		setTimeout(() => {
// 			indicator.style.animation = 'slideOut 0.3s ease';
// 			setTimeout(() => {
// 				indicator.style.display = 'none';
// 			}, 300);
// 		}, 2000);
// 	}

// 	/* ============================================
// 	   KEYBOARD NAVIGATION
// 	   ============================================ */

// 	function enhanceKeyboardNavigation() {
// 		document.addEventListener('keydown', function(e) {
// 			// Tab navigation enhancement
// 			if (e.key === 'Tab') {
// 				const activeElement = document.activeElement;
// 				if (activeElement && (activeElement.tagName === 'INPUT' || 
// 					activeElement.tagName === 'SELECT' || 
// 					activeElement.tagName === 'TEXTAREA')) {
					
// 					// Add visual indicator for keyboard navigation
// 					activeElement.classList.add('keyboard-navigating');
					
// 					setTimeout(() => {
// 						activeElement.classList.remove('keyboard-navigating');
// 					}, 1000);
// 				}
// 			}

// 			// Enter to submit (if in form)
// 			if (e.key === 'Enter' && e.target.closest('form')) {
// 				const form = e.target.closest('form');
// 				const submitButton = form.querySelector('button[type="submit"], .btn-primary');
				
// 				// Don't submit if in textarea
// 				if (e.target.tagName !== 'TEXTAREA' && submitButton && !e.shiftKey) {
// 					e.preventDefault();
// 					submitButton.click();
// 				}
// 			}

// 			// Escape to clear field
// 			if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
// 				if (e.target.value) {
// 					e.target.value = '';
// 					e.target.dispatchEvent(new Event('input', { bubbles: true }));
// 				}
// 			}
// 		});
// 	}

// 	/* ============================================
// 	   FIELD FOCUS ENHANCEMENTS
// 	   ============================================ */

// 	function enhanceFieldFocus() {
// 		const formControls = document.querySelectorAll('.form-control, input, select, textarea');
		
// 		formControls.forEach(control => {
// 			control.addEventListener('focus', function() {
// 				const formGroup = this.closest('.form-group, .frappe-control');
// 				if (formGroup) {
// 					formGroup.classList.add('field-focused');
// 				}
// 			});

// 			control.addEventListener('blur', function() {
// 				const formGroup = this.closest('.form-group, .frappe-control');
// 				if (formGroup) {
// 					formGroup.classList.remove('field-focused');
// 				}
// 			});
// 		});
// 	}

// 	/* ============================================
// 	   FORM STATE MANAGEMENT
// 	   ============================================ */

// 	function trackFormState() {
// 		const forms = document.querySelectorAll('form, .form-container');
		
// 		forms.forEach(form => {
// 			let originalData = {};
			
// 			// Capture initial state
// 			const inputs = form.querySelectorAll('input, select, textarea');
// 			inputs.forEach(input => {
// 				if (input.name || input.id) {
// 					originalData[input.name || input.id] = input.value;
// 				}
// 			});

// 			// Check for changes
// 			function checkForChanges() {
// 				let hasChanges = false;
// 				inputs.forEach(input => {
// 					const key = input.name || input.id;
// 					if (key && originalData[key] !== input.value) {
// 						hasChanges = true;
// 					}
// 				});

// 				if (hasChanges) {
// 					form.classList.add('has-changes');
// 				} else {
// 					form.classList.remove('has-changes');
// 				}
// 			}

// 			inputs.forEach(input => {
// 				input.addEventListener('input', checkForChanges);
// 				input.addEventListener('change', checkForChanges);
// 			});
// 		});
// 	}

// 	/* ============================================
// 	   INITIALIZATION
// 	   ============================================ */

// 	function init() {
// 		// Initialize all enhancements
// 		enhanceFormValidation();
// 		enhanceKeyboardNavigation();
// 		enhanceFieldFocus();
// 		trackFormState();
// 		initAutoSave();

// 		// Add CSS for animations
// 		if (!document.getElementById('form-enhancements-style')) {
// 			const style = document.createElement('style');
// 			style.id = 'form-enhancements-style';
// 			style.textContent = `
// 				@keyframes slideIn {
// 					from {
// 						transform: translateX(100%);
// 						opacity: 0;
// 					}
// 					to {
// 						transform: translateX(0);
// 						opacity: 1;
// 					}
// 				}
// 				@keyframes slideOut {
// 					from {
// 						transform: translateX(0);
// 						opacity: 1;
// 					}
// 					to {
// 						transform: translateX(100%);
// 						opacity: 0;
// 					}
// 				}
// 				.field-focused {
// 					position: relative;
// 				}
// 				/* Blue side line removed - no longer needed */
// 				.field-focused::before {
// 					display: none;
// 				}
// 				.keyboard-navigating {
// 					outline: 2px solid var(--color-primary) !important;
// 					outline-offset: 2px !important;
// 				}
// 			`;
// 			document.head.appendChild(style);
// 		}
// 	}

// 	// Initialize when DOM is ready
// 	if (document.readyState === 'loading') {
// 		document.addEventListener('DOMContentLoaded', init);
// 	} else {
// 		init();
// 	}

// 	// Re-initialize on route changes (Frappe specific)
// 	if (typeof frappe !== 'undefined') {
// 		frappe.router?.on('change', function() {
// 			setTimeout(init, 100);
// 		});
// 	}

// 	// Watch for dynamically added forms
// 	const formObserver = new MutationObserver(function(mutations) {
// 		mutations.forEach(function(mutation) {
// 			if (mutation.addedNodes.length) {
// 				mutation.addedNodes.forEach(node => {
// 					if (node.nodeType === 1) {
// 						if (node.tagName === 'FORM' || node.classList?.contains('form-container')) {
// 							setTimeout(init, 100);
// 						}
// 					}
// 				});
// 			}
// 		});
// 	});

// 	formObserver.observe(document.body, {
// 		childList: true,
// 		subtree: true
// 	});
// })();

/**
 * Auto-expand textareas and label inputs as user types
 * Status: ✅ ACTIVE
 */
(function() {
	'use strict';

	/**
	 * Auto-expand textarea/input based on content
	 */
	function autoExpand(element) {
		if (!element) return;
		
		// Reset height to auto to get the correct scrollHeight
		element.style.height = 'auto';
		
		// Calculate new height
		const scrollHeight = element.scrollHeight;
		const minHeight = parseInt(window.getComputedStyle(element).minHeight) || 40;
		const maxHeight = parseInt(window.getComputedStyle(element).maxHeight) || 500;
		
		// Set height with constraints
		let newHeight = Math.max(minHeight, scrollHeight);
		newHeight = Math.min(newHeight, maxHeight);
		
		element.style.height = newHeight + 'px';
		element.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
	}

	/**
	 * Initialize auto-expand for an element
	 */
	function initAutoExpand(element) {
		if (!element || element.dataset.autoExpandInitialized === 'true') return;
		
		// Mark as initialized
		element.dataset.autoExpandInitialized = 'true';
		
		// Add auto-expand class
		element.classList.add('auto-expand');
		
		// Set initial height
		autoExpand(element);
		
		// Add event listeners
		element.addEventListener('input', function() {
			autoExpand(this);
		});
		
		element.addEventListener('focus', function() {
			autoExpand(this);
		});
		
		// Handle paste events
		element.addEventListener('paste', function() {
			setTimeout(() => autoExpand(this), 10);
		});
	}

	/**
	 * Initialize all auto-expand elements
	 */
	function initAllAutoExpand() {
		// Find all textareas
		const textareas = document.querySelectorAll('textarea:not([data-auto-expand-initialized="true"])');
		textareas.forEach(textarea => {
			initAutoExpand(textarea);
		});

		// Find label inputs in form builder (EditableInput components)
		const labelInputs = document.querySelectorAll(
			'input[placeholder*="Label"], ' +
			'input[placeholder*="label"], ' +
			'.editable-input input, ' +
			'[contenteditable="true"]'
		);
		labelInputs.forEach(input => {
			if (input.tagName === 'INPUT' && input.type === 'text') {
				initAutoExpand(input);
			} else if (input.contentEditable === 'true') {
				// Handle contenteditable elements
				if (input.dataset.autoExpandInitialized !== 'true') {
					input.dataset.autoExpandInitialized = 'true';
					input.style.minHeight = '40px';
					input.style.maxHeight = '200px';
					input.style.overflowY = 'auto';
					input.style.wordWrap = 'break-word';
					
					input.addEventListener('input', function() {
						this.style.height = 'auto';
						const scrollHeight = this.scrollHeight;
						const minHeight = 40;
						const maxHeight = 200;
						let newHeight = Math.max(minHeight, scrollHeight);
						newHeight = Math.min(newHeight, maxHeight);
						this.style.height = newHeight + 'px';
						this.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
					});
				}
			}
		});

		// Find form builder label inputs specifically
		const formBuilderLabels = document.querySelectorAll(
			'.form-builder input[type="text"], ' +
			'[data-fieldname*="label"] input, ' +
			'[data-fieldname*="Label"] input'
		);
		formBuilderLabels.forEach(input => {
			if (input.type === 'text' && !input.classList.contains('awesomplete-input')) {
				initAutoExpand(input);
			}
		});
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(initAllAutoExpand, 100);
			setTimeout(initAllAutoExpand, 500);
		});
	} else {
		setTimeout(initAllAutoExpand, 100);
		setTimeout(initAllAutoExpand, 500);
	}

	// Watch for dynamically added elements
	const observer = new MutationObserver(function(mutations) {
		let shouldInit = false;
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes.length) {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) {
						if (node.tagName === 'TEXTAREA' || 
							node.querySelector('textarea') ||
							node.classList?.contains('editable-input') ||
							node.querySelector('.editable-input') ||
							node.querySelector('input[placeholder*="Label"]') ||
							node.querySelector('input[placeholder*="label"]')) {
							shouldInit = true;
						}
					}
				});
			}
		});
		if (shouldInit) {
			setTimeout(initAllAutoExpand, 50);
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	// Re-initialize on route changes (Frappe)
	if (typeof frappe !== 'undefined' && frappe.router) {
		frappe.router.on('change', function() {
			setTimeout(initAllAutoExpand, 200);
			setTimeout(initAllAutoExpand, 500);
		});
	}
})();

/**
 * Fix Form Builder Properties Panel - Ensure all fields are visible
 * Status: ✅ ACTIVE
 */
(function() {
	'use strict';

	/**
	 * Ensure placeholder field and all properties panel fields are visible and properly sized
	 */
	function fixPropertiesPanel() {
		// Find properties panel sidebar - Default Frappe width
		const sidebarContainer = document.querySelector('.sidebar-container');
		if (sidebarContainer) {
			sidebarContainer.style.minWidth = '272px';
			sidebarContainer.style.width = '272px';
			sidebarContainer.style.maxWidth = '384px';
		}

		// Find properties panel
		const controlData = document.querySelector('.control-data');
		if (!controlData) return;

		// Set minimal left padding for clean UI
		controlData.style.padding = '12px 12px';
		controlData.style.paddingLeft = '8px';
		controlData.style.paddingRight = '12px';
		controlData.style.width = '100%';

		// Ensure all fields are visible and properly sized - Reduced spacing
		const fields = controlData.querySelectorAll('.field');
		fields.forEach(field => {
			field.style.display = 'flex';
			field.style.flexDirection = 'column';
			field.style.visibility = 'visible';
			field.style.opacity = '1';
			field.style.marginBottom = '12px';
			field.style.marginTop = '0';
			field.style.marginLeft = '0';
			field.style.marginRight = '0';
			field.style.padding = '0';
			field.style.paddingLeft = '0';
			field.style.paddingRight = '0';
			field.style.width = '100%';

			// Find placeholder field specifically
			const fieldname = field.getAttribute('data-fieldname');
			const label = field.querySelector('.control-label, label');
			const isPlaceholder = fieldname === 'placeholder' || 
			                      (label && label.textContent.toLowerCase().includes('placeholder'));

			if (isPlaceholder) {
				field.style.display = 'flex';
				field.style.visibility = 'visible';
				field.style.opacity = '1';
				
				// Ensure input/textarea is visible
				const input = field.querySelector('input, textarea');
				if (input) {
					input.style.display = 'block';
					input.style.visibility = 'visible';
					input.style.opacity = '1';
					input.style.width = '100%';
					input.style.minWidth = '100%';
					input.style.maxWidth = '100%';
					input.style.marginTop = 'var(--spacing-xs)';
					input.style.minHeight = '60px';
					input.style.padding = 'var(--spacing-sm) var(--spacing-md)';
					input.style.fontSize = 'var(--font-size-base)';
				}
			}

			// Ensure all inputs in field are visible - No left padding/margin
			const inputs = field.querySelectorAll('input, textarea, select');
			inputs.forEach(input => {
				if (input.type !== 'hidden' && input.style.display !== 'none') {
					input.style.display = 'block';
					input.style.visibility = 'visible';
					input.style.opacity = '1';
					input.style.width = '100%';
					input.style.minWidth = '100%';
					input.style.maxWidth = '100%';
					input.style.marginTop = '4px';
					input.style.marginLeft = '0';
					input.style.marginRight = '0';
					input.style.paddingLeft = '8px';
					input.style.paddingRight = '8px';
					input.style.boxSizing = 'border-box';
					
					// Set proper sizing based on input type
					if (input.tagName === 'TEXTAREA') {
						input.style.minHeight = '60px';
						input.style.padding = 'var(--spacing-sm) var(--spacing-md)';
					} else if (input.tagName === 'SELECT') {
						input.style.minHeight = '42px';
						input.style.padding = 'var(--spacing-sm) var(--spacing-md)';
					} else if (input.type !== 'checkbox' && input.type !== 'radio') {
						input.style.minHeight = '42px';
						input.style.padding = 'var(--spacing-sm) var(--spacing-md)';
					}
					
					input.style.fontSize = 'var(--font-size-base)';
				}
			});

			// Ensure labels are visible - No left padding/margin
			const labels = field.querySelectorAll('.control-label, label, .label');
			labels.forEach(label => {
				label.style.display = 'block';
				label.style.visibility = 'visible';
				label.style.opacity = '1';
				label.style.fontSize = '13px';
				label.style.marginBottom = '4px';
				label.style.marginLeft = '0';
				label.style.marginRight = '0';
				label.style.paddingLeft = '0';
				label.style.paddingRight = '0';
			});

			// Ensure input wrappers take full width - No left padding/margin
			const hasCheckbox = field.querySelector('input[type="checkbox"], input[type="radio"]');
			const wrappers = field.querySelectorAll('.frappe-control, .form-group, .control-input-wrapper');
			wrappers.forEach(wrapper => {
				wrapper.style.width = '100%';
				wrapper.style.marginLeft = '0';
				wrapper.style.marginRight = '0';
				wrapper.style.paddingLeft = '0';
				wrapper.style.paddingRight = '0';
				if (hasCheckbox) {
					// Checkbox fields should use row layout
					wrapper.style.display = 'flex';
					wrapper.style.flexDirection = 'row';
					wrapper.style.alignItems = 'center';
					wrapper.style.gap = 'var(--spacing-sm)';
				} else {
					// Other fields use column layout
					wrapper.style.display = 'flex';
					wrapper.style.flexDirection = 'column';
				}
			});

			// Fix checkbox label positioning - Checkbox FIRST, then text AFTER - AGGRESSIVE FIX
			if (hasCheckbox) {
				field.style.cssText += `
					flex-direction: row !important;
					align-items: flex-start !important;
					justify-content: flex-start !important;
					padding-left: 0 !important;
					margin-left: 0 !important;
				`;
				
				const checkbox = field.querySelector('input[type="checkbox"], input[type="radio"]');
				const label = field.querySelector('.control-label, label, .label');
				const wrapper = field.querySelector('.frappe-control, .form-group, .control-input-wrapper');
				const labelArea = field.querySelector('.label-area, span.label-area');
				
				// Handle Frappe checkbox structure (checkbox inside label)
				const frappeCheckboxLabel = field.querySelector('.frappe-control.checkbox label, .frappe-control[data-fieldtype="Check"] label');
				if (frappeCheckboxLabel && checkbox && checkbox.parentElement === frappeCheckboxLabel) {
					// Checkbox is inside label - fix label structure
					frappeCheckboxLabel.style.cssText = `
						display: flex !important;
						flex-direction: row !important;
						align-items: center !important;
						justify-content: flex-start !important;
						gap: var(--spacing-sm) !important;
						margin: 0 !important;
						padding: 0 !important;
					`;
					
					checkbox.style.cssText = `
						order: 1 !important;
						margin-right: var(--spacing-sm) !important;
						margin-left: 0 !important;
						flex-shrink: 0 !important;
					`;
					
					if (labelArea) {
						labelArea.style.cssText = `
							order: 2 !important;
							margin-left: 0 !important;
							margin-right: 0 !important;
							flex: 0 1 auto !important;
						`;
					}
				} else {
					// Standard checkbox structure
					if (checkbox) {
						// Checkbox comes FIRST - force it
						checkbox.style.cssText += `
							order: 1 !important;
							margin-right: var(--spacing-sm) !important;
							margin-left: 0 !important;
							flex-shrink: 0 !important;
							align-self: flex-start !important;
							display: inline-block !important;
							vertical-align: middle !important;
						`;
						
						// Move checkbox to be first in DOM if needed
						if (checkbox.parentElement && checkbox.nextSibling) {
							checkbox.parentElement.insertBefore(checkbox, checkbox.parentElement.firstChild);
						}
					}
					
					if (label) {
						// Text comes AFTER checkbox
						label.style.cssText += `
							order: 2 !important;
							margin-left: var(--spacing-sm) !important;
							margin-right: 0 !important;
							display: inline-flex !important;
							align-items: center !important;
							flex: 0 1 auto !important;
							text-align: left !important;
							vertical-align: middle !important;
						`;
					}
				}
				
				if (wrapper) {
					// Fix wrapper alignment
					wrapper.style.cssText += `
						display: flex !important;
						flex-direction: row !important;
						align-items: flex-start !important;
						justify-content: flex-start !important;
						padding-left: 0 !important;
						margin-left: 0 !important;
					`;
				}
			}
			
			// Search icon at LEFT end - AGGRESSIVE FIX
			const searchBoxes = document.querySelectorAll('.sidebar-container .header .search-box, .form-builder-container .sidebar-container .header .search-box');
			searchBoxes.forEach(searchBox => {
				const searchIcon = searchBox.querySelector('.search-icon, span.search-icon');
				const searchInput = searchBox.querySelector('.search-input, input[type="text"], input');
				
				if (searchIcon && searchInput) {
					// Force LEFT position for icon
					searchIcon.style.cssText = `
						position: absolute !important;
						left: 7px !important;
						top: 50% !important;
						transform: translateY(-50%) !important;
						-webkit-transform: translateY(-50%) !important;
						pointer-events: none !important;
						z-index: 1 !important;
						margin: 0 !important;
						display: flex !important;
						align-items: center !important;
						justify-content: center !important;
						right: auto !important;
					`;
					
					// Left align the input text
					searchInput.style.cssText += `
						text-align: left !important;
						padding-left: 30px !important;
					`;
					
					// Also fix any nested elements
					const iconElements = searchIcon.querySelectorAll('svg, div, *');
					iconElements.forEach(el => {
						el.style.margin = '0';
						el.style.display = 'block';
					});
				}
			});
		});

		// Ensure control-data container is scrollable with visible scrollbar - FIXED
		controlData.style.overflowY = 'scroll';
		controlData.style.overflowX = 'hidden';
		controlData.style.height = 'calc(100vh - 202px)';
		controlData.style.minHeight = 'calc(100vh - 202px)';
		controlData.style.maxHeight = 'calc(100vh - 202px)';
		controlData.style.scrollbarWidth = 'thin';
		controlData.style.webkitOverflowScrolling = 'touch';
		controlData.style.position = 'relative';
		controlData.style.boxSizing = 'border-box';
		
		// Prevent form shifting when fields are added
		controlData.style.willChange = 'scroll-position';
		
		// Force scrollbar to always be visible
		controlData.style.overflowY = 'scroll';
		
		// Watch for placeholder field addition and prevent shift
		const placeholderObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.addedNodes.length) {
					mutation.addedNodes.forEach(node => {
						if (node.nodeType === 1) {
							const isPlaceholderField = node.getAttribute?.('data-fieldname') === 'placeholder' ||
							                          node.querySelector?.('[data-fieldname="placeholder"]') ||
							                          node.textContent?.toLowerCase().includes('placeholder');
							if (isPlaceholderField) {
								// Maintain scroll position when placeholder appears
								const currentScrollTop = controlData.scrollTop;
								setTimeout(() => {
									controlData.scrollTop = currentScrollTop;
								}, 0);
							}
						}
					});
				}
			});
		});
		
		placeholderObserver.observe(controlData, {
			childList: true,
			subtree: true
		});
	}

	/**
	 * Remove unwanted padding from form builder
	 */
	function removeUnwantedPadding() {
		// Form builder container
		const formBuilder = document.querySelector('.form-builder-container');
		if (formBuilder) {
			formBuilder.style.padding = '0';
			formBuilder.style.margin = '0';
		}

		// Form sections
		const sections = document.querySelectorAll('.form-section, .section-columns');
		sections.forEach(section => {
			section.style.padding = 'var(--spacing-xs)';
			section.style.margin = '0';
		});

		// Form fields
		const fields = document.querySelectorAll('.form-builder .field, .form-section .field');
		fields.forEach(field => {
			field.style.padding = 'var(--spacing-xs)';
			field.style.margin = 'var(--spacing-xs) 0';
		});

		// Column containers
		const columns = document.querySelectorAll('.column-container, .section-columns');
		columns.forEach(column => {
			column.style.padding = 'var(--spacing-xs)';
			column.style.margin = '0';
		});
	}

	/**
	 * Initialize fixes
	 */
	/**
	 * Fix Add Field button - prevent text truncation
	 */
	function fixAddFieldButton() {
		const addFieldButtons = document.querySelectorAll(
			'.add-field-btn, ' +
			'button[title="Add field"], ' +
			'button[title*="Add field"], ' +
			'.btn-xs.btn-icon[title*="Add field"], ' +
			'.form-builder button.btn-xs.btn-icon'
		);
		
		addFieldButtons.forEach(btn => {
			const btnText = btn.textContent || btn.innerText || '';
			const title = btn.getAttribute('title') || '';
			
			// Check if this is the "Add field" button
			if (title.toLowerCase().includes('add field') || 
			    btnText.toLowerCase().includes('add field') ||
			    btnText.toLowerCase().includes('dd fie')) {
				
				// Fix button width and text display
				btn.style.width = 'auto';
				btn.style.minWidth = 'auto';
				btn.style.padding = '6px 12px';
				btn.style.whiteSpace = 'nowrap';
				btn.style.overflow = 'visible';
				btn.style.textOverflow = 'clip';
				btn.style.display = 'inline-flex';
				btn.style.alignItems = 'center';
				btn.style.justifyContent = 'center';
				btn.style.gap = '6px';
				
				// Ensure text content is visible
				const spans = btn.querySelectorAll('span, .btn-text');
				spans.forEach(span => {
					span.style.display = 'inline-block';
					span.style.visibility = 'visible';
					span.style.opacity = '1';
					span.style.whiteSpace = 'nowrap';
					span.style.overflow = 'visible';
					span.style.textOverflow = 'clip';
				});
				
				// If text is truncated, try to restore it
				if (btnText.includes('dd fie') || btnText.length < 8) {
					// Try to find the full text from title or restore it
					if (title && title.toLowerCase().includes('add field')) {
						const fullText = title.replace(/.*add field/i, 'Add field').trim();
						if (fullText && btn.textContent !== fullText) {
							// Only update if we can find the text node
							const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === 3);
							if (textNodes.length > 0) {
								textNodes[0].textContent = fullText;
							} else {
								// Create a span if needed
								const span = document.createElement('span');
								span.textContent = fullText;
								btn.appendChild(span);
							}
						}
					}
				}
			}
		});
	}

	/**
	 * Prevent form shifting when sidebar content changes
	 */
	function preventFormShifting() {
		const sidebarContainer = document.querySelector('.sidebar-container, .form-builder-container .sidebar-container');
		const controlData = document.querySelector('.control-data');
		const formMain = document.querySelector('.form-builder-container .form-main, .form-builder .form-main');
		
		if (sidebarContainer) {
			sidebarContainer.style.overflow = 'hidden';
			sidebarContainer.style.position = 'relative';
			sidebarContainer.style.height = '100%';
			sidebarContainer.style.display = 'flex';
			sidebarContainer.style.flexDirection = 'column';
		}
		
		if (controlData) {
			controlData.style.overflowY = 'scroll';
			controlData.style.overflowX = 'hidden';
			controlData.style.flex = '1';
			controlData.style.minHeight = '0';
			controlData.style.position = 'relative';
		}
		
		if (formMain) {
			formMain.style.position = 'relative';
			formMain.style.overflow = 'visible';
		}
	}

	/**
	 * Hide grey empty state space when no field is selected
	 */
	function hideEmptyStateSpace() {
		const emptyStates = document.querySelectorAll('.empty-state, .sidebar-container .empty-state, .form-builder-container .empty-state');
		emptyStates.forEach(emptyState => {
			emptyState.style.display = 'none';
			emptyState.style.visibility = 'hidden';
			emptyState.style.opacity = '0';
			emptyState.style.height = '0';
			emptyState.style.overflow = 'hidden';
			emptyState.style.padding = '0';
			emptyState.style.margin = '0';
		});

		// Hide sidebar container if it only contains empty state
		const sidebarContainers = document.querySelectorAll('.sidebar-container, .form-builder-container .sidebar-container');
		sidebarContainers.forEach(sidebar => {
			const hasFields = sidebar.querySelector('.control-data .field');
			const hasEmptyState = sidebar.querySelector('.empty-state');
			
			if (hasEmptyState && !hasFields) {
				sidebar.style.display = 'none';
				sidebar.style.visibility = 'hidden';
				sidebar.style.width = '0';
				sidebar.style.minWidth = '0';
				sidebar.style.maxWidth = '0';
				sidebar.style.padding = '0';
				sidebar.style.margin = '0';
			} else if (hasFields) {
				sidebar.style.display = 'flex';
				sidebar.style.visibility = 'visible';
			}
		});
	}

	/**
	 * Remove grey background and fix max-width constraints
	 */
	function removeGreyBackground() {
		// Fix section bodies - remove max-width constraints
		const sectionBodies = document.querySelectorAll('.section-body, .form-section .section-body, .form-dashboard-section .section-body');
		sectionBodies.forEach(section => {
			section.style.maxWidth = '100%';
			section.style.width = '100%';
			section.style.background = 'var(--color-bg-white)';
			section.style.backgroundColor = 'var(--color-bg-white)';
		});

		// Fix form sections - remove grey background
		const formSections = document.querySelectorAll('.form-section, .form-section.card-section, .form-dashboard-section');
		formSections.forEach(section => {
			section.style.background = 'var(--color-bg-white)';
			section.style.backgroundColor = 'var(--color-bg-white)';
			section.style.maxWidth = '100%';
			section.style.width = '100%';
		});

		// Fix tab panes - remove grey background
		const tabPanes = document.querySelectorAll('.tab-pane, #doctype-form_builder_tab, #customize-form-form_tab');
		tabPanes.forEach(pane => {
			pane.style.background = 'var(--color-bg-white)';
			pane.style.backgroundColor = 'var(--color-bg-white)';
			pane.style.maxWidth = '100%';
			pane.style.width = '100%';
		});
	}

	function initFixes() {
		fixPropertiesPanel();
		removeUnwantedPadding();
		fixAddFieldButton();
		preventFormShifting();
		hideEmptyStateSpace();
		removeGreyBackground();
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(initFixes, 100);
			setTimeout(initFixes, 500);
			setTimeout(initFixes, 1000);
		});
	} else {
		setTimeout(initFixes, 100);
		setTimeout(initFixes, 500);
		setTimeout(initFixes, 1000);
	}

	// Watch for dynamically added elements - Enhanced
	const observer = new MutationObserver(function(mutations) {
		let shouldFix = false;
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes.length) {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) {
						if (node.classList?.contains('control-data') ||
							node.classList?.contains('field') ||
							node.classList?.contains('search-box') ||
							node.classList?.contains('add-field-btn') ||
							node.classList?.contains('section-body') ||
							node.classList?.contains('form-section') ||
							node.querySelector('.control-data') ||
							node.querySelector('.field') ||
							node.querySelector('.search-box') ||
							node.querySelector('.add-field-btn') ||
							node.querySelector('.section-body') ||
							node.querySelector('.form-section') ||
							node.querySelector('button[title*="Add field"]') ||
							node.querySelector('input[type="checkbox"]')) {
							shouldFix = true;
						}
					}
				});
			}
			// Also watch for attribute changes (like style changes)
			if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
				const target = mutation.target;
				if (target.classList?.contains('search-icon') || 
					target.classList?.contains('search-box') ||
					target.classList?.contains('add-field-btn') ||
					target.closest('.search-box') ||
					target.closest('.add-field-btn')) {
					shouldFix = true;
				}
			}
		});
		if (shouldFix) {
			setTimeout(initFixes, 50);
			setTimeout(initFixes, 200);
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['style', 'class']
	});
	
	// Also run fixes periodically to catch any missed elements
	setInterval(function() {
		const searchBoxes = document.querySelectorAll('.sidebar-container .header .search-box');
		const checkboxFields = document.querySelectorAll('.control-data .field:has(input[type="checkbox"])');
		const addFieldButtons = document.querySelectorAll('.add-field-btn, button[title*="Add field"]');
		const emptyStates = document.querySelectorAll('.empty-state');
		
		if (searchBoxes.length > 0 || checkboxFields.length > 0 || addFieldButtons.length > 0 || emptyStates.length > 0) {
			initFixes();
		}
	}, 1000);

	// Re-initialize on route changes
	if (typeof frappe !== 'undefined' && frappe.router) {
		frappe.router.on('change', function() {
			setTimeout(initFixes, 200);
			setTimeout(initFixes, 500);
		});
	}
})();

