/**
 * Hide Right Sidebar (Activity Panel) for Onboarding
 * Hides the right sidebar completely for this specific doctype - FORM VIEWS ONLY
 */

(function() {
	'use strict';
	
	const DOCTYPE_NAME = 'Onboarding';
	const DOCTYPE_ROUTE = 'onboarding';
	
	function hideRightSidebar() {
		// Check if we're on Onboarding form (NOT list view)
		const route = frappe.get_route();
		const isOnboarding = route && route.length > 0 && 
			(route[0] === DOCTYPE_ROUTE || route[0] === DOCTYPE_NAME || 
			 route[0] === 'Form' && route[1] === DOCTYPE_NAME);
		
		// Check if it's a list view - don't hide sidebar on list views
		const isListView = route && (
			route[0] === 'List' || 
			route[1] === 'view' || 
			route[2] === 'List' ||
			route[2] === 'list' ||
			window.location.pathname.includes('/view/list') ||
			document.body.getAttribute('data-route')?.includes('List')
		);
		
		// Only hide on form detail screens, not on list views
		if (!isOnboarding || isListView) {
			return;
		}
		
		// Hide right sidebar elements - use inline styles with !important
		const selectors = [
			'.layout-side-section',
			'.layout-side-section.right',
			'.form-sidebar'
		];
		
		selectors.forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				el.style.setProperty('display', 'none', 'important');
				el.style.setProperty('visibility', 'hidden', 'important');
				el.style.setProperty('width', '0', 'important');
				el.style.setProperty('height', '0', 'important');
				el.style.setProperty('overflow', 'hidden', 'important');
				el.style.setProperty('padding', '0', 'important');
				el.style.setProperty('margin', '0', 'important');
				el.style.setProperty('opacity', '0', 'important');
				el.style.setProperty('pointer-events', 'none', 'important');
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


