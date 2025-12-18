/**
 * Top Navigation Bar - Enhanced Functionality
 * Status: ✅ ACTIVE - Enhanced UI and Functionality
 */

(function() {
	'use strict';

	// Force close any dropdowns on page load - but don't interfere with user clicks
	if (typeof $ !== 'undefined') {
		// Force close any dropdowns that Bootstrap tries to open on init
		$(document).ready(function() {
			// Close immediately
			$('.navbar-nav .dropdown, .navbar .dropdown').removeClass('show open');
			$('.navbar-nav .dropdown-menu, .navbar .dropdown-menu').hide();
			$('.navbar-nav [data-toggle="dropdown"]').attr('aria-expanded', 'false');
			
			// Close again after short delays to catch any that open during initialization
			setTimeout(() => {
				$('.navbar-nav .dropdown, .navbar .dropdown').removeClass('show open');
				$('.navbar-nav .dropdown-menu, .navbar .dropdown-menu').hide();
				$('.navbar-nav [data-toggle="dropdown"]').attr('aria-expanded', 'false');
			}, 100);
			
			setTimeout(() => {
				$('.navbar-nav .dropdown, .navbar .dropdown').removeClass('show open');
				$('.navbar-nav .dropdown-menu, .navbar .dropdown-menu').hide();
				$('.navbar-nav [data-toggle="dropdown"]').attr('aria-expanded', 'false');
			}, 500);
		});
	}

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initNavbar);
	} else {
		initNavbar();
	}

	function initNavbar() {
		// Close all dropdowns immediately
		closeAllDropdowns();
		
		// Close multiple times to catch any that open during initialization (but not too many)
		setTimeout(() => {
			closeAllDropdowns();
			enhanceSearchBar();
			enhanceDropdowns();
			enhanceAvatar();
			enhanceKeyboardNavigation();
			enhanceBreadcrumbs();
		}, 100);
		
		// Close once more after everything loads
		setTimeout(() => closeAllDropdowns(), 500);
	}

	/**
	 * Close all dropdowns by default - AGGRESSIVE
	 */
	function closeAllDropdowns() {
		// Close all navbar dropdowns
		document.querySelectorAll('.navbar-nav .dropdown, .navbar .dropdown, .dropdown-help, .dropdown-profile, .dropdown-user, .dropdown-notifications').forEach(dropdown => {
			dropdown.classList.remove('show', 'open');
			dropdown.removeAttribute('aria-expanded');
			
			const menu = dropdown.querySelector('.dropdown-menu, .notifications-list');
			if (menu) {
				menu.style.setProperty('display', 'none', 'important');
				menu.style.setProperty('visibility', 'hidden', 'important');
				menu.style.setProperty('opacity', '0', 'important');
			}
			
			// Close all toggle buttons
			const toggleButtons = dropdown.querySelectorAll('[data-toggle="dropdown"], .dropdown-toggle, button, .nav-link');
			toggleButtons.forEach(toggleButton => {
				toggleButton.setAttribute('aria-expanded', 'false');
				toggleButton.classList.remove('show', 'open');
			});
		});
		
		// Also close any dropdowns that might be open via Bootstrap
		document.querySelectorAll('.dropdown.show, .dropdown.open, [aria-expanded="true"]').forEach(element => {
			if (element.closest('.navbar-nav') || element.closest('.navbar')) {
				element.classList.remove('show', 'open');
				element.setAttribute('aria-expanded', 'false');
				const menu = element.querySelector('.dropdown-menu, .notifications-list');
				if (menu) {
					menu.style.setProperty('display', 'none', 'important');
					menu.style.setProperty('visibility', 'hidden', 'important');
					menu.style.setProperty('opacity', '0', 'important');
				}
			}
		});
		
		// Use jQuery if available to force close via Bootstrap API
		if (typeof $ !== 'undefined') {
			$('.navbar-nav .dropdown, .navbar .dropdown').each(function() {
				const $dropdown = $(this);
				$dropdown.removeClass('show open');
				$dropdown.find('.dropdown-menu').hide();
				$dropdown.find('[data-toggle="dropdown"]').attr('aria-expanded', 'false');
			});
		}
	}

	/**
	 * Enhance Search Bar Functionality
	 */
	function enhanceSearchBar() {
		// Set width for navbar search bar
		const navbarSearchBars = document.querySelectorAll(
			'.navbar .search-bar, .navbar .desktop-search-wrapper, .navbar .navbar-collapse .search-bar, .navbar .navbar-collapse .desktop-search-wrapper'
		);
		
		navbarSearchBars.forEach(searchBar => {
			searchBar.style.setProperty('min-width', '350px', 'important');
			searchBar.style.setProperty('max-width', '500px', 'important');
			searchBar.style.setProperty('width', '450px', 'important');
			searchBar.style.setProperty('flex', '0 0 auto', 'important');
		});
		
		// Also set width for form containers
		const navbarForms = document.querySelectorAll(
			'.navbar .navbar-collapse form, .navbar .navbar-collapse .form-inline'
		);
		
		navbarForms.forEach(form => {
			form.style.setProperty('min-width', '350px', 'important');
			form.style.setProperty('max-width', '500px', 'important');
			form.style.setProperty('width', '450px', 'important');
		});
		
		const searchInputs = document.querySelectorAll(
			'.search-bar input, .desktop-search-wrapper input, #navbar-search'
		);

		searchInputs.forEach(input => {
			input.addEventListener('focus', function() {
				this.parentElement?.classList.add('search-focused');
			});

			input.addEventListener('blur', function() {
				this.parentElement?.classList.remove('search-focused');
			});

			input.addEventListener('keydown', function(e) {
				if (e.key === 'Escape') {
					this.value = '';
					this.blur();
				}
			});

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
			'.navbar-nav .dropdown-toggle, .navbar-nav [data-toggle="dropdown"], .navbar-nav .dropdown'
		);

		dropdownToggles.forEach(toggle => {
			// Ensure dropdown menu is properly positioned and visible when shown
			const dropdown = toggle.classList.contains('dropdown') ? toggle : toggle.closest('.dropdown');
			if (dropdown) {
				const menu = dropdown.querySelector('.dropdown-menu');
				if (menu) {
					// IMPORTANT: Close dropdown by default (especially for notifications)
					dropdown.classList.remove('show', 'open');
					
					// Set aria-expanded to false by default
					const toggleButton = dropdown.querySelector('[data-toggle="dropdown"], .dropdown-toggle, button');
					if (toggleButton) {
						toggleButton.setAttribute('aria-expanded', 'false');
					}
					
					// Only set inline styles if dropdown is not supposed to be open
					// Let Bootstrap handle the display when user clicks
					if (!dropdown.classList.contains('show') && !dropdown.classList.contains('open')) {
						menu.style.setProperty('display', 'none', 'important');
						menu.style.setProperty('visibility', 'hidden', 'important');
						menu.style.setProperty('opacity', '0', 'important');
					}
					
					// Monitor for class changes - but don't override Bootstrap's behavior
					const observer = new MutationObserver(function(mutations) {
						mutations.forEach(function(mutation) {
							if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
								// If Bootstrap adds show/open class, allow it to display
								if (dropdown.classList.contains('show') || dropdown.classList.contains('open')) {
									// Remove our restrictive inline styles to let Bootstrap/CSS handle it
									menu.style.removeProperty('display');
									menu.style.removeProperty('visibility');
									menu.style.removeProperty('opacity');
									if (toggleButton) {
										toggleButton.setAttribute('aria-expanded', 'true');
									}
								} else {
									// If show/open is removed, hide it
									menu.style.setProperty('display', 'none', 'important');
									menu.style.setProperty('visibility', 'hidden', 'important');
									menu.style.setProperty('opacity', '0', 'important');
									if (toggleButton) {
										toggleButton.setAttribute('aria-expanded', 'false');
									}
								}
							}
						});
					});
					observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
				}
			}

			// Handle click events - add animation classes but don't interfere with Bootstrap
			if (!toggle.classList.contains('dropdown')) {
				toggle.addEventListener('click', function(e) {
					const dropdown = this.closest('.dropdown');
					if (dropdown) {
						const menu = dropdown.querySelector('.dropdown-menu');
						if (menu) {
							// Use setTimeout to check state after Bootstrap handles the click
							setTimeout(() => {
								if (dropdown.classList.contains('show') || dropdown.classList.contains('open')) {
									// Remove restrictive inline styles to let CSS handle display
									menu.style.removeProperty('display');
									menu.style.removeProperty('visibility');
									menu.style.removeProperty('opacity');
									menu.classList.add('dropdown-opening');
									setTimeout(() => {
										menu.classList.remove('dropdown-opening');
									}, 200);
								} else {
									// Hide when closed
									menu.style.setProperty('display', 'none', 'important');
									menu.style.setProperty('visibility', 'hidden', 'important');
									menu.style.setProperty('opacity', '0', 'important');
									menu.classList.add('dropdown-closing');
									setTimeout(() => {
										menu.classList.remove('dropdown-closing');
									}, 200);
								}
							}, 10);
						}
					}
				});
			}
		});

		// Close dropdowns when clicking outside
		document.addEventListener('click', function(e) {
			const clickedDropdown = e.target.closest('.navbar-nav .dropdown');
			const clickedToggle = e.target.closest('[data-toggle="dropdown"], .dropdown-toggle');
			
			document.querySelectorAll('.navbar-nav .dropdown.show, .navbar-nav .dropdown.open').forEach(dropdown => {
				// Don't close if clicking on the toggle button (Bootstrap will handle it)
				if (clickedToggle && dropdown.contains(clickedToggle)) {
					return;
				}
				
				if (dropdown !== clickedDropdown && !dropdown.contains(e.target)) {
					// Close the dropdown
					dropdown.classList.remove('show', 'open');
					const menu = dropdown.querySelector('.dropdown-menu');
					if (menu) {
						menu.style.setProperty('display', 'none', 'important');
						menu.style.setProperty('visibility', 'hidden', 'important');
						menu.style.setProperty('opacity', '0', 'important');
						menu.style.setProperty('pointer-events', 'none', 'important');
						menu.classList.add('dropdown-closing');
						setTimeout(() => {
							menu.classList.remove('dropdown-closing');
						}, 200);
					}
					
					// Update aria-expanded
					const toggleButton = dropdown.querySelector('[data-toggle="dropdown"], .dropdown-toggle, button');
					if (toggleButton) {
						toggleButton.setAttribute('aria-expanded', 'false');
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

		avatar.addEventListener('click', function(e) {
			this.classList.add('avatar-clicked');
			setTimeout(() => {
				this.classList.remove('avatar-clicked');
			}, 200);
		});

		const avatarElement = avatar.querySelector('.avatar');
		if (avatarElement) {
			avatarElement.addEventListener('mouseenter', function() {
				const userName = avatar.querySelector('.user-name');
				if (userName && userName.scrollWidth > userName.clientWidth) {
					avatar.setAttribute('title', userName.textContent.trim());
				}
			});
		}
	}

	function enhanceKeyboardNavigation() {
		const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
		navLinks.forEach(link => {
			link.addEventListener('keydown', function(e) {
				if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
					e.preventDefault();
					const links = Array.from(navLinks);
					const currentIndex = links.indexOf(this);
					const nextIndex = e.key === 'ArrowRight' 
						? (currentIndex + 1) % links.length
						: (currentIndex - 1 + links.length) % links.length;
					links[nextIndex]?.focus();
				}

				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					this.click();
				}
			});
		});

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

	function enhanceBreadcrumbs() {
		const breadcrumbLinks = document.querySelectorAll('#navbar-breadcrumbs a');
		breadcrumbLinks.forEach(link => {
			link.addEventListener('click', function(e) {
				this.classList.add('breadcrumb-clicked');
				setTimeout(() => {
					this.classList.remove('breadcrumb-clicked');
				}, 200);
			});
		});
	}

	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			// Close all dropdowns on route change
			closeAllDropdowns();
			setTimeout(() => {
				closeAllDropdowns();
				enhanceSearchBar();
				enhanceDropdowns();
				enhanceBreadcrumbs();
			}, 100);
		});
	}
	
	// Also close dropdowns when page becomes visible (user switches tabs back)
	document.addEventListener('visibilitychange', function() {
		if (!document.hidden) {
			closeAllDropdowns();
		}
	});
	
	// Close dropdowns on window focus
	window.addEventListener('focus', function() {
		closeAllDropdowns();
	});
})();

