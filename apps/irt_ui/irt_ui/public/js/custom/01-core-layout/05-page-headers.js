/**
 * Page Headers - Conditional Button Visibility
 * Show menu, list view buttons, and search bar only for Administrator
 */

(function() {
	'use strict';

	// Check if user is Administrator
	function isAdministrator() {
		if (typeof frappe === 'undefined' || !frappe.session) {
			return false;
		}
		
		// Check if user is Administrator
		if (frappe.session.user === 'Administrator') {
			return true;
		}
		
		// Check if user has Administrator role
		if (frappe.boot && frappe.boot.user && frappe.boot.user.roles) {
			return frappe.boot.user.roles.includes('Administrator');
		}
		
		// Check user_info roles
		if (frappe.boot && frappe.boot.user_info && frappe.boot.user_info[frappe.session.user]) {
			const userInfo = frappe.boot.user_info[frappe.session.user];
			if (userInfo.roles && Array.isArray(userInfo.roles)) {
				return userInfo.roles.includes('Administrator');
			}
		}
		
		return false;
	}

	// Toggle button visibility based on user role
	function toggleButtonsVisibility() {
		const isAdmin = isAdministrator();
		
		// Add/remove class on body for CSS targeting
		if (isAdmin) {
			document.body.classList.add('user-is-administrator');
			document.body.classList.remove('user-is-not-administrator');
		} else {
			document.body.classList.add('user-is-not-administrator');
			document.body.classList.remove('user-is-administrator');
		}
		
		// Directly hide/show buttons if needed (fallback)
		const menuButtons = document.querySelectorAll(
			'.page-actions .menu-btn-group, ' +
			'.standard-actions .menu-btn-group, ' +
			'.page-actions button[aria-label="Menu"], ' +
			'.standard-actions button[aria-label="Menu"], ' +
			'.page-actions button[data-original-title="Menu"], ' +
			'.standard-actions button[data-original-title="Menu"]'
		);
		
		const listViewButtons = document.querySelectorAll(
			'.page-actions .custom-btn-group:has(.custom-btn-group-label), ' +
			'.page-actions .custom-btn-group .custom-btn-group-label'
		);
		
		menuButtons.forEach(btn => {
			if (btn.closest('.menu-btn-group')) {
				const group = btn.closest('.menu-btn-group');
				if (isAdmin) {
					group.style.display = '';
					group.style.visibility = '';
					group.style.opacity = '';
				} else {
					group.style.display = 'none';
					group.style.visibility = 'hidden';
					group.style.opacity = '0';
				}
			} else {
				if (isAdmin) {
					btn.style.display = '';
					btn.style.visibility = '';
					btn.style.opacity = '';
				} else {
					btn.style.display = 'none';
					btn.style.visibility = 'hidden';
					btn.style.opacity = '0';
				}
			}
		});
		
		listViewButtons.forEach(btn => {
			const group = btn.closest('.custom-btn-group') || btn;
			if (isAdmin) {
				group.style.display = '';
				group.style.visibility = '';
				group.style.opacity = '';
			} else {
				group.style.display = 'none';
				group.style.visibility = 'hidden';
				group.style.opacity = '0';
			}
		});
		
		// Hide/show top navigation search bar (global search)
		const topNavSearch = document.querySelectorAll(
			'.search-bar, ' +
			'.desktop-search-wrapper, ' +
			'#navbar-search, ' +
			'.navbar .search-bar, ' +
			'.navbar .desktop-search-wrapper'
		);
		
		topNavSearch.forEach(search => {
			if (isAdmin) {
				search.style.display = '';
				search.style.visibility = '';
				search.style.opacity = '';
			} else {
				search.style.display = 'none';
				search.style.visibility = 'hidden';
				search.style.opacity = '0';
			}
		});
	}

	// Initialize when DOM is ready
	function init() {
		// Wait for frappe to be available
		if (typeof frappe === 'undefined') {
			setTimeout(init, 100);
			return;
		}
		
		// Initial check
		toggleButtonsVisibility();
		
		// Watch for DOM changes (for dynamically added buttons)
		const observer = new MutationObserver(() => {
			toggleButtonsVisibility();
		});
		
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
		
		// Also check when page changes
		if (typeof frappe !== 'undefined' && frappe.router) {
			frappe.router.on('change', () => {
				setTimeout(toggleButtonsVisibility, 100);
			});
		}
	}

	// Start initialization
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		// If already loaded, wait a bit for frappe to initialize
		setTimeout(init, 100);
	}
})();

