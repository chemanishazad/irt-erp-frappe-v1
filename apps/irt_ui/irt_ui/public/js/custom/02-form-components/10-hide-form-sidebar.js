/**
 * Hide Right Sidebar (Activity Panel) for Employee Onboarding Case
 * Hides the right sidebar completely for this specific doctype
 */

(function() {
	'use strict';
	
	const DOCTYPE_NAME = 'Employee Onboarding Case';
	const DOCTYPE_ROUTE = 'employee-onboarding-case';
	
	function hideRightSidebar() {
		// Check if we're on Employee Onboarding Case form
		const route = frappe.get_route();
		const isOnboardingCase = route && route.length > 0 && 
			(route[0] === DOCTYPE_ROUTE || route[0] === DOCTYPE_NAME);
		
		if (!isOnboardingCase) {
			return;
		}
		
		// Hide right sidebar elements
		const selectors = [
			'.layout-side-section',
			'.layout-side-section.right',
			'.form-sidebar',
			'.form-sidebar-items',
			'.activity-section',
			'.communication-section'
		];
		
		selectors.forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				el.style.display = 'none';
				el.style.visibility = 'hidden';
				el.style.width = '0';
				el.style.height = '0';
				el.style.overflow = 'hidden';
				el.style.padding = '0';
				el.style.margin = '0';
				el.style.opacity = '0';
				el.style.pointerEvents = 'none';
			});
		});
		
		// Adjust main content to use full width
		const mainSectionWrapper = document.querySelector('.layout-main-section-wrapper');
		if (mainSectionWrapper) {
			mainSectionWrapper.style.width = '100%';
			mainSectionWrapper.style.maxWidth = '100%';
			mainSectionWrapper.style.marginRight = '0';
			mainSectionWrapper.style.paddingRight = '0';
		}
		
		const mainSection = document.querySelector('.layout-main-section');
		if (mainSection) {
			mainSection.style.width = '100%';
			mainSection.style.maxWidth = '100%';
			mainSection.style.marginRight = '0';
			mainSection.style.paddingRight = '0';
		}
		
		const layoutMain = document.querySelector('.layout-main');
		if (layoutMain) {
			layoutMain.style.width = '100%';
			layoutMain.style.maxWidth = '100%';
		}
	}
	
	// Run on page load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', hideRightSidebar);
	} else {
		hideRightSidebar();
	}
	
	// Run on route change
	frappe.router.on('change', hideRightSidebar);
	
	// Run on form load/refresh
	if (frappe.ui.form && frappe.ui.form.on) {
		frappe.ui.form.on(DOCTYPE_NAME, {
			onload: hideRightSidebar,
			refresh: hideRightSidebar
		});
	}
	
	// Watch for DOM changes
	if (typeof MutationObserver !== 'undefined') {
		const observer = new MutationObserver(function() {
			hideRightSidebar();
		});
		
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	
	// Run periodically to catch dynamically added elements
	setInterval(hideRightSidebar, 500);
})();

