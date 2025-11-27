/**
 * Top Navigation Bar - Enhanced Functionality
 * Status: ✅ ACTIVE - Enhanced UI and Functionality
 */

(function() {
	'use strict';

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initNavbar);
	} else {
		initNavbar();
	}

	function initNavbar() {
		// Initialize after a short delay to ensure Frappe has loaded
		setTimeout(() => {
			enhanceSearchBar();
			enhanceDropdowns();
			enhanceAvatar();
			enhanceKeyboardNavigation();
			enhanceBreadcrumbs();
		}, 100);
	}

	/**
	 * Enhance Search Bar Functionality
	 */
	function enhanceSearchBar() {
		const searchInputs = document.querySelectorAll(
			'.search-bar input, .desktop-search-wrapper input, #navbar-search'
		);

		searchInputs.forEach(input => {
			// Add focus animation
			input.addEventListener('focus', function() {
				this.parentElement?.classList.add('search-focused');
			});

			input.addEventListener('blur', function() {
				this.parentElement?.classList.remove('search-focused');
			});

			// Enhanced keyboard navigation
			input.addEventListener('keydown', function(e) {
				// Escape to clear
				if (e.key === 'Escape') {
					this.value = '';
					this.blur();
				}
			});

			// Add smooth transition on input
			input.addEventListener('input', function() {
				if (this.value.length > 0) {
					this.classList.add('has-text');
				} else {
					this.classList.remove('has-text');
				}
			});
		});
	}

	/**
	 * Enhance Dropdown Menus
	 */
	function enhanceDropdowns() {
		const dropdownToggles = document.querySelectorAll(
			'.navbar-nav .dropdown-toggle, .navbar-nav [data-toggle="dropdown"]'
		);

		dropdownToggles.forEach(toggle => {
			// Add smooth open/close animation
			toggle.addEventListener('click', function(e) {
				const dropdown = this.closest('.dropdown');
				if (dropdown) {
					const menu = dropdown.querySelector('.dropdown-menu');
					if (menu) {
						// Toggle animation class
						if (dropdown.classList.contains('show')) {
							menu.classList.add('dropdown-closing');
							setTimeout(() => {
								menu.classList.remove('dropdown-closing');
							}, 200);
						} else {
							menu.classList.add('dropdown-opening');
							setTimeout(() => {
								menu.classList.remove('dropdown-opening');
							}, 200);
						}
					}
				}
			});

			// Close dropdown when clicking outside
			document.addEventListener('click', function(e) {
				if (!toggle.contains(e.target)) {
					const dropdown = toggle.closest('.dropdown');
					if (dropdown && dropdown.classList.contains('show')) {
						const menu = dropdown.querySelector('.dropdown-menu');
						if (menu) {
							menu.classList.add('dropdown-closing');
						}
					}
				}
			});
		});

		// Enhance dropdown items
		const dropdownItems = document.querySelectorAll('.navbar-nav .dropdown-item');
		dropdownItems.forEach(item => {
			item.addEventListener('mouseenter', function() {
				this.style.transform = 'translateX(4px)';
			});

			item.addEventListener('mouseleave', function() {
				this.style.transform = 'translateX(0)';
			});
		});
	}

	/**
	 * Enhance Avatar/Profile
	 */
	function enhanceAvatar() {
		const avatar = document.querySelector('.desktop-avatar');
		if (!avatar) return;

		// Add click feedback
		avatar.addEventListener('click', function(e) {
			this.classList.add('avatar-clicked');
			setTimeout(() => {
				this.classList.remove('avatar-clicked');
			}, 200);
		});

		// Add hover tooltip (if needed)
		const avatarElement = avatar.querySelector('.avatar');
		if (avatarElement) {
			avatarElement.addEventListener('mouseenter', function() {
				const userName = avatar.querySelector('.user-name');
				if (userName && userName.scrollWidth > userName.clientWidth) {
					// Show tooltip if text is truncated
					avatar.setAttribute('title', userName.textContent.trim());
				}
			});
		}
	}

	/**
	 * Enhanced Keyboard Navigation
	 */
	function enhanceKeyboardNavigation() {
		// Tab navigation enhancement
		const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
		navLinks.forEach(link => {
			link.addEventListener('keydown', function(e) {
				// Arrow keys for navigation
				if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
					e.preventDefault();
					const links = Array.from(navLinks);
					const currentIndex = links.indexOf(this);
					let nextIndex;

					if (e.key === 'ArrowRight') {
						nextIndex = (currentIndex + 1) % links.length;
					} else {
						nextIndex = (currentIndex - 1 + links.length) % links.length;
					}

					links[nextIndex]?.focus();
				}

				// Enter or Space to activate
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					this.click();
				}
			});
		});

		// Search bar keyboard shortcut (Ctrl/Cmd + K)
		document.addEventListener('keydown', function(e) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				const searchInput = document.querySelector(
					'.search-bar input, .desktop-search-wrapper input, #navbar-search'
				);
				if (searchInput) {
					searchInput.focus();
					searchInput.select();
				}
			}
		});
	}

	/**
	 * Enhance Breadcrumbs
	 */
	function enhanceBreadcrumbs() {
		const breadcrumbLinks = document.querySelectorAll('#navbar-breadcrumbs a');
		breadcrumbLinks.forEach(link => {
			link.addEventListener('click', function(e) {
				// Add click feedback
				this.classList.add('breadcrumb-clicked');
				setTimeout(() => {
					this.classList.remove('breadcrumb-clicked');
				}, 200);
			});
		});
	}

	// Handle route changes (Frappe specific)
	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			// Re-initialize enhancements after route change
			setTimeout(() => {
				enhanceSearchBar();
				enhanceDropdowns();
				enhanceBreadcrumbs();
			}, 100);
		});
	}
})();

