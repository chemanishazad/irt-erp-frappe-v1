// /**
//  * Custom Sidebar JavaScript - Minimal
//  */

// (function () {
// 	let initialized = false;

// 	function initCustomSidebar() {
// 		if (initialized) return;

// 		const container = document.querySelector('.body-sidebar-container');
// 		const sidebar = document.querySelector('.body-sidebar');
// 		const sidebarTop = document.querySelector('.body-sidebar-top');
// 		const sidebarBottom = document.querySelector('.body-sidebar-bottom');

// 		if (!container || !sidebar) return;

// 		initialized = true;

// 		// Ensure flex layout
// 		if (sidebarTop) {
// 			sidebarTop.style.flex = '1 1 auto';
// 			sidebarTop.style.minHeight = '0';
// 		}
// 		if (sidebarBottom) {
// 			sidebarBottom.style.marginTop = 'auto';
// 			sidebarBottom.style.flexShrink = '0';
// 		}

// 		// Hide Frappe Framework subtitle and dropdown
// 		hideHeaderElements();

// 		setupCollapseToggle(container);
// 		setupTooltips();
// 		setupSectionToggle();
// 		setupActiveState();
// 		ensureNavigationWorks();
// 		setupKeyboardNavigation();
// 		setupSmoothAnimations();

// 		// Re-setup on route change
// 		if (typeof frappe !== 'undefined' && frappe.router && frappe.router.on) {
// 			frappe.router.on('change', function () {
// 				setTimeout(function () {
// 					setupTooltips();
// 					setupSectionToggle();
// 					updateActiveState();
// 				}, 200);
// 			});
// 		}
// 	}

// 	function hideHeaderElements() {
// 		// Hide Frappe Framework subtitle
// 		const subtitle = document.querySelector('.header-subtitle');
// 		if (subtitle) {
// 			subtitle.style.display = 'none';
// 			subtitle.style.opacity = '0';
// 			subtitle.style.height = '0';
// 			subtitle.style.margin = '0';
// 			subtitle.style.padding = '0';
// 		}

// 		// Hide dropdown icon and menu
// 		const dropIcon = document.querySelector('.sidebar-header .drop-icon');
// 		if (dropIcon) {
// 			dropIcon.style.display = 'none';
// 			dropIcon.style.visibility = 'hidden';
// 		}

// 		const dropdownMenu = document.querySelector('.sidebar-header-menu');
// 		if (dropdownMenu) {
// 			dropdownMenu.style.display = 'none';
// 			dropdownMenu.style.visibility = 'hidden';
// 		}

// 		// Watch for dynamically added elements
// 		const observer = new MutationObserver(function () {
// 			const subtitle = document.querySelector('.header-subtitle');
// 			if (subtitle) {
// 				subtitle.style.display = 'none';
// 				subtitle.style.opacity = '0';
// 			}
// 			const dropIcon = document.querySelector('.sidebar-header .drop-icon');
// 			if (dropIcon) {
// 				dropIcon.style.display = 'none';
// 			}
// 		});

// 		const sidebar = document.querySelector('.sidebar-header');
// 		if (sidebar) {
// 			observer.observe(sidebar, {
// 				childList: true,
// 				subtree: true
// 			});
// 		}
// 	}

// 	function setupCollapseToggle(container) {
// 		// Sync with Frappe's sidebar-expand event
// 		if (typeof $ !== 'undefined') {
// 			$(document).on('sidebar-expand', function (event, data) {
// 				if (data && data.sidebar_expand !== undefined) {
// 					if (data.sidebar_expand) {
// 						container.classList.add('expanded');
// 					} else {
// 						container.classList.remove('expanded');
// 					}
// 				}
// 			});
// 		}

// 		// Initial sync
// 		if (typeof frappe !== 'undefined' && frappe.app && frappe.app.sidebar) {
// 			if (frappe.app.sidebar.sidebar_expanded) {
// 				container.classList.add('expanded');
// 			} else {
// 				container.classList.remove('expanded');
// 			}
// 		}
// 	}

// 	function setupTooltips() {
// 		const sidebar = document.querySelector('.body-sidebar');
// 		if (!sidebar) return;

// 		updateTooltips();

// 		const observer = new MutationObserver(function () {
// 			updateTooltips();
// 		});

// 		observer.observe(sidebar, {
// 			childList: true,
// 			subtree: true
// 		});
// 	}

// 	function updateTooltips() {
// 		const sidebar = document.querySelector('.body-sidebar');
// 		if (!sidebar) return;

// 		const items = sidebar.querySelectorAll('.standard-sidebar-item .item-anchor');
// 		items.forEach(function (item) {
// 			const label = item.querySelector('.sidebar-item-label');
// 			if (!label) return;

// 			const tooltipText = label.textContent.trim();
// 			if (tooltipText) {
// 				item.setAttribute('data-tooltip', tooltipText);
// 			}
// 		});
// 	}

// 	function setupSectionToggle() {
// 		const sidebar = document.querySelector('.body-sidebar');
// 		if (!sidebar) return;

// 		sidebar.addEventListener('click', function (e) {
// 			// Check if clicking on a nested item (submenu item) - don't toggle, just navigate
// 			const nestedItem = e.target.closest('.nested-container .standard-sidebar-item, .sidebar-child-item .standard-sidebar-item');
// 			if (nestedItem) {
// 				// Allow normal navigation for nested items - don't toggle parent section
// 				return;
// 			}

// 			// Check if clicking on a regular navigation link (not section break)
// 			const regularLink = e.target.closest('.standard-sidebar-item:not(.section-break) .item-anchor');
// 			if (regularLink) {
// 				// Allow normal navigation - don't toggle anything
// 				return;
// 			}

// 			// Only toggle when clicking directly on section break header
// 			const sectionBreak = e.target.closest('.standard-sidebar-item.section-break');
// 			const sectionBreakAnchor = e.target.closest('.standard-sidebar-item.section-break .item-anchor');
// 			const sectionBreakControl = e.target.closest('.sidebar-item-control, .drop-icon');
			
// 			// Only proceed if clicking on section break header or its control
// 			if (!sectionBreak && !sectionBreakControl) return;

// 			// Prevent default only for section breaks
// 			e.preventDefault();
// 			e.stopPropagation();

// 			const container = sectionBreak ? sectionBreak.closest('.sidebar-item-container.section-item') : null;
// 			if (!container) return;

// 			const nestedContainer =
// 				container.querySelector('.nested-container') ||
// 				container.querySelector('.sidebar-child-item');
// 			if (!nestedContainer) return;

// 			const isHidden = nestedContainer.classList.contains('hidden');

// 			// Toggle: if hidden, show it; if visible, hide it
// 			if (isHidden) {
// 				nestedContainer.classList.remove('hidden');
// 				sectionBreak && sectionBreak.classList.add('expanded');
// 			} else {
// 				nestedContainer.classList.add('hidden');
// 				sectionBreak && sectionBreak.classList.remove('expanded');
// 			}
// 		});
// 	}

// 	function setupActiveState() {
// 		if (typeof $ !== 'undefined') {
// 			$(document).on('route-change', function () {
// 				setTimeout(updateActiveState, 200);
// 			});
// 		}

// 		window.addEventListener('popstate', function () {
// 			setTimeout(updateActiveState, 200);
// 		});

// 		setTimeout(updateActiveState, 500);
// 	}

// 	function updateActiveState() {
// 		const currentPath = window.location.pathname;
// 		const items = document.querySelectorAll('.standard-sidebar-item .item-anchor');

// 		// Clear all active states with smooth transition
// 		document.querySelectorAll('.standard-sidebar-item').forEach(function (el) {
// 			el.classList.remove('active-sidebar');
// 		});

// 		// Find the best matching item (most specific match)
// 		let bestMatch = null;
// 		let bestMatchLength = 0;

// 		items.forEach(function (item) {
// 			const href = item.getAttribute('href');
// 			if (!href) return;

// 			// Remove query params and hash for comparison
// 			const hrefPath = href.split('?')[0].split('#')[0].replace(/^\/+/, '').replace(/\/$/, '');
// 			const currentPathClean = currentPath.split('?')[0].split('#')[0].replace(/\/$/, '');

// 			// Exact match is best
// 			if (currentPathClean === '/' + hrefPath || currentPathClean === hrefPath || currentPathClean.endsWith('/' + hrefPath)) {
// 				const matchLength = hrefPath.length;
// 				if (matchLength > bestMatchLength) {
// 					bestMatch = item;
// 					bestMatchLength = matchLength;
// 				}
// 			}
// 			// Partial match (but prefer longer matches)
// 			else if (currentPathClean.includes(hrefPath) && hrefPath.length > bestMatchLength) {
// 				bestMatch = item;
// 				bestMatchLength = hrefPath.length;
// 			}
// 		});

// 		// Set only the best match as active - always keep it active if it matches
// 		if (bestMatch) {
// 			const parent = bestMatch.closest('.standard-sidebar-item');
// 			if (parent) {
// 				parent.classList.add('active-sidebar');
				
// 				// Smooth scroll to active item if it's not visible
// 				setTimeout(function() {
// 					scrollToActiveItem(parent);
// 				}, 100);
// 			}
// 		}
// 	}

// 	function scrollToActiveItem(activeElement) {
// 		const sidebarTop = document.querySelector('.body-sidebar-top');
// 		if (!sidebarTop || !activeElement) return;

// 		const elementRect = activeElement.getBoundingClientRect();
// 		const sidebarRect = sidebarTop.getBoundingClientRect();

// 		// Simple scroll if not visible
// 		if (elementRect.top < sidebarRect.top || elementRect.bottom > sidebarRect.bottom) {
// 			activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
// 		}
// 	}

// 	// Ensure navigation links work properly and don't get hidden
// 	function ensureNavigationWorks() {
// 		const sidebar = document.querySelector('.body-sidebar');
// 		if (!sidebar) return;

// 		// Watch for link clicks and ensure they navigate properly
// 		sidebar.addEventListener('click', function (e) {
// 			const link = e.target.closest('.standard-sidebar-item:not(.section-break) .item-anchor');
// 			if (!link) return;

// 			const href = link.getAttribute('href');
// 			if (!href || href === '#' || href === 'javascript:void(0)') {
// 				e.preventDefault();
// 				return;
// 			}

// 		// Ensure active state is maintained
// 		setTimeout(function () {
// 			updateActiveState();
// 		}, 100);
// 		});
// 	}

// 	// Keyboard navigation support
// 	function setupKeyboardNavigation() {
// 		const sidebar = document.querySelector('.body-sidebar');
// 		if (!sidebar) return;

// 		// Make sidebar items focusable
// 		const items = sidebar.querySelectorAll('.standard-sidebar-item:not(.section-break) .item-anchor');
// 		items.forEach(function(item) {
// 			item.setAttribute('tabindex', '0');
// 		});
// 	}

// 	// Simple animations
// 	function setupSmoothAnimations() {
// 		// Keep it simple - no excessive animations
// 		return;
// 	}

// 	// Initialize
// 	if (document.readyState === 'loading') {
// 		document.addEventListener('DOMContentLoaded', function () {
// 			setTimeout(initCustomSidebar, 100);
// 		});
// 	} else {
// 		setTimeout(initCustomSidebar, 100);
// 	}

// 	if (typeof frappe !== 'undefined' && typeof frappe.ready === 'function') {
// 		frappe.ready(function () {
// 			setTimeout(initCustomSidebar, 200);
// 		});
// 	}
// })();
