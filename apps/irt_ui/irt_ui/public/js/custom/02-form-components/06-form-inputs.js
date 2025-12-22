/**
 * Removed commented-out code - All form builder overrides removed
 */

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

		// Removed form builder specific label input handling - use Frappe default
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
 * Removed Form Builder Properties Panel overrides - use Frappe default
 * All form builder JavaScript overrides have been removed to allow Frappe defaults to work properly
 */
(function() {
	'use strict';
	// All form builder overrides removed - using Frappe defaults
	return;
})();

