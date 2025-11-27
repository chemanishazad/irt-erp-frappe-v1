/**
 * Main Content Area - Enhanced Functionality
 * Status: ✅ ACTIVE - Enhanced UI and Functionality
 */

(function() {
	'use strict';

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initMainContent);
	} else {
		initMainContent();
	}

	function initMainContent() {
		// Initialize after a short delay to ensure Frappe has loaded
		setTimeout(() => {
			fixLayoutSpacing();
			enhanceScrollbar();
			enhanceCards();
			enhanceWorkspaceCards();
			enhanceQuickAccessCards();
			enhanceLinkItems();
			ensureDataVisibility();
			ensurePaginationVisible();
		}, 100);
		
		// Re-apply spacing fix multiple times to catch dynamic content
		setTimeout(fixLayoutSpacing, 300);
		setTimeout(fixLayoutSpacing, 500);
		setTimeout(fixLayoutSpacing, 1000);
		
		// Ensure pagination is visible after list loads
		setTimeout(ensurePaginationVisible, 300);
		setTimeout(ensurePaginationVisible, 500);
		setTimeout(ensurePaginationVisible, 1000);
		setTimeout(ensurePaginationVisible, 2000);
		
		// Setup watcher for pagination visibility
		setTimeout(setupPaginationWatcher, 500);
	}

	/**
	 * Fix Layout Spacing - Ensure proper padding and remove right side space
	 */
	function fixLayoutSpacing() {
		// Force remove right margin/padding from all layout elements
		const selectors = [
			'.layout-main',
			'.layout-main-section-wrapper',
			'.layout-main-section',
			'.page-content-wrapper',
			'.page-container',
			'.page-body',
			'.page_content',
			'body[data-route*="desk"] .container',
			'body[data-route*="desk"] .container-fluid',
			'.main-section',
			'.page-wrapper'
		];

		selectors.forEach(selector => {
			document.querySelectorAll(selector).forEach(element => {
				element.style.setProperty('margin-right', '0px', 'important');
				element.style.setProperty('max-width', '100%', 'important');
				element.style.setProperty('width', '100%', 'important');
				element.style.setProperty('box-sizing', 'border-box', 'important');
				
				// Remove gap if it exists
				if (element.style.gap) {
					element.style.setProperty('gap', '0', 'important');
				}
				
				// Check computed styles
				const computed = window.getComputedStyle(element);
				if (parseInt(computed.marginRight) > 0) {
					element.style.setProperty('margin-right', '0px', 'important');
				}
				if (computed.maxWidth !== '100%' && computed.maxWidth !== 'none') {
					element.style.setProperty('max-width', '100%', 'important');
				}
				if (computed.gap && computed.gap !== '0px' && computed.gap !== 'normal') {
					element.style.setProperty('gap', '0', 'important');
				}
			});
		});

		// Ensure layout-main-section-wrapper takes full width
		const layoutWrapper = document.querySelector('.layout-main-section-wrapper');
		if (layoutWrapper) {
			layoutWrapper.style.setProperty('flex', '1 1 auto', 'important');
			layoutWrapper.style.setProperty('width', '100%', 'important');
			layoutWrapper.style.setProperty('max-width', '100%', 'important');
			layoutWrapper.style.setProperty('margin-right', '0px', 'important');
		}

		// Ensure layout-main takes full width
		const layoutMain = document.querySelector('.layout-main');
		if (layoutMain) {
			layoutMain.style.setProperty('width', '100%', 'important');
			layoutMain.style.setProperty('max-width', '100%', 'important');
			layoutMain.style.setProperty('margin-right', '0px', 'important');
		}

		// Hide any sidebars that might cause right spacing
		const sidebars = document.querySelectorAll('.form-sidebar, .list-sidebar, .layout-side-section, .layout-sidebar');
		sidebars.forEach(sidebar => {
			sidebar.style.setProperty('display', 'none', 'important');
			sidebar.style.setProperty('width', '0', 'important');
			sidebar.style.setProperty('margin', '0', 'important');
			sidebar.style.setProperty('padding', '0', 'important');
		});

		// Remove right padding from page-container if it's causing issues
		const pageContainer = document.querySelector('.page-container');
		if (pageContainer) {
			const computed = window.getComputedStyle(pageContainer);
			const paddingRight = parseInt(computed.paddingRight) || 0;
			if (paddingRight > 24) {
				pageContainer.style.setProperty('padding-right', 'var(--spacing-md)', 'important');
			}
		}
	}

	/**
	 * Enhance Custom Scrollbar
	 */
	function enhanceScrollbar() {
		const mainSection = document.querySelector('.main-section');
		if (!mainSection) return;

		// Add smooth scroll behavior
		mainSection.style.scrollBehavior = 'smooth';
	}

	/**
	 * Enhance Cards with Interactions
	 */
	function enhanceCards() {
		const cards = document.querySelectorAll('.frappe-card, .layout-main-section');
		
		cards.forEach(card => {
			// Add intersection observer for fade-in animation
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						entry.target.classList.add('card-visible');
						observer.unobserve(entry.target);
					}
				});
			}, {
				threshold: 0.1
			});

			observer.observe(card);
		});
	}




	/**
	 * Enhance Workspace Cards
	 */
	function enhanceWorkspaceCards() {
		const cards = document.querySelectorAll('.workspace-card, .card-section, .links-widget-box');
		
		cards.forEach(card => {
			// Add tooltip for truncated titles
			const title = card.querySelector('.card-title, .widget-head .widget-title');
			if (title) {
				const titleText = title.textContent.trim();
				if (title.scrollWidth > title.clientWidth) {
					card.setAttribute('title', titleText);
				}
			}

			// Ensure card is visible
			card.style.visibility = 'visible';
			card.style.opacity = '1';

			// Add click feedback for section cards
			if (card.classList.contains('links-widget-box')) {
				card.addEventListener('click', function(e) {
					// Only if clicking on the card header, not link items
					if (e.target.closest('.widget-head')) {
						this.classList.add('card-clicked');
						setTimeout(() => {
							this.classList.remove('card-clicked');
						}, 150);
					}
				});

				// Add intersection observer for fade-in
				const observer = new IntersectionObserver((entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							entry.target.classList.add('card-visible');
							observer.unobserve(entry.target);
						}
					});
				}, {
					threshold: 0.1
				});

				observer.observe(card);
			}
		});
	}

	/**
	 * Enhance Quick Access Cards (Shortcut Widget Boxes)
	 */
	function enhanceQuickAccessCards() {
		const quickAccessCards = document.querySelectorAll('.shortcut-widget-box');
		
		quickAccessCards.forEach(card => {
			// Keyboard accessibility
			card.setAttribute('tabindex', '0');
			card.setAttribute('role', 'button');
			
			card.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					this.click();
				}
			});

			// Add click feedback and ripple effect
			card.addEventListener('click', function(e) {
				// Visual feedback
				this.classList.add('card-clicked');
				setTimeout(() => {
					this.classList.remove('card-clicked');
				}, 150);

				// Ripple effect
				const ripple = document.createElement('span');
				const rect = this.getBoundingClientRect();
				const size = Math.max(rect.width, rect.height);
				const x = e.clientX - rect.left - size / 2;
				const y = e.clientY - rect.top - size / 2;
				
				ripple.style.width = ripple.style.height = size + 'px';
				ripple.style.left = x + 'px';
				ripple.style.top = y + 'px';
				ripple.classList.add('ripple-effect');
				
				this.appendChild(ripple);
				
				setTimeout(() => {
					ripple.remove();
				}, 600);
			});

			// Add intersection observer for fade-in animation
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						entry.target.classList.add('card-visible');
						observer.unobserve(entry.target);
					}
				});
			}, {
				threshold: 0.1
			});

			observer.observe(card);
		});
	}

	/**
	 * Enhance Link Items
	 */
	function enhanceLinkItems() {
		const linkItems = document.querySelectorAll('.link-item');
		
		linkItems.forEach(item => {
			// Add tooltip for truncated text
			const linkContent = item.querySelector('.link-content');
			if (linkContent) {
				const contentText = linkContent.textContent.trim();
				if (linkContent.scrollWidth > linkContent.clientWidth) {
					item.setAttribute('title', contentText);
					linkContent.setAttribute('title', contentText);
				}
			}

			// Ensure proper click handling
			item.addEventListener('click', function(e) {
				// Add visual feedback
				this.classList.add('link-item-clicked');
				setTimeout(() => {
					this.classList.remove('link-item-clicked');
				}, 200);
			});

			// Keyboard accessibility
			item.setAttribute('tabindex', '0');
			item.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					this.click();
				}
			});
		});
	}

	/**
	 * Ensure Data Visibility
	 */
	function ensureDataVisibility() {
		// Ensure all text is visible
		const textElements = document.querySelectorAll('.link-content, .widget-title, .card-title');
		
		textElements.forEach(element => {
			// Remove any hidden or invisible styles
			if (element.style.display === 'none') {
				element.style.display = 'block';
			}
			if (element.style.visibility === 'hidden') {
				element.style.visibility = 'visible';
			}
			if (element.style.opacity === '0') {
				element.style.opacity = '1';
			}
		});
	}

	/**
	 * Ensure Pagination Area is Always Visible
	 */
	function ensurePaginationVisible() {
		const paginationAreas = document.querySelectorAll('.list-paging-area');
		paginationAreas.forEach(area => {
			// Force visibility
			area.style.setProperty('display', 'block', 'important');
			area.style.setProperty('visibility', 'visible', 'important');
			area.style.setProperty('opacity', '1', 'important');
			area.style.setProperty('height', 'auto', 'important');
			area.style.setProperty('max-height', 'none', 'important');
			
			// Ensure parent containers allow visibility
			let parent = area.parentElement;
			while (parent && parent !== document.body) {
				if (parent.classList.contains('frappe-list')) {
					parent.style.setProperty('display', 'flex', 'important');
					parent.style.setProperty('flex-direction', 'column', 'important');
				}
				if (parent.classList.contains('result-container')) {
					parent.style.setProperty('overflow', 'visible', 'important');
					const currentHeight = parent.style.height;
					if (currentHeight) {
						// Limit height to ensure pagination is visible
						const navbarHeight = 63;
						const paginationHeight = 60;
						const maxHeight = window.innerHeight - navbarHeight - paginationHeight - 100;
						parent.style.setProperty('max-height', maxHeight + 'px', 'important');
					}
				}
				if (parent.classList.contains('result')) {
					const navbarHeight = 63;
					const paginationHeight = 60;
					const maxHeight = window.innerHeight - navbarHeight - paginationHeight - 150;
					parent.style.setProperty('max-height', maxHeight + 'px', 'important');
				}
				parent = parent.parentElement;
			}
		});
		
		// Ensure Load More button is visible
		const loadMoreButtons = document.querySelectorAll('.list-paging-area .btn-more');
		loadMoreButtons.forEach(btn => {
			btn.style.setProperty('display', 'inline-block', 'important');
			btn.style.setProperty('visibility', 'visible', 'important');
			btn.style.setProperty('opacity', '1', 'important');
		});
		
		// Ensure list count is visible
		const listCounts = document.querySelectorAll('.list-count');
		listCounts.forEach(count => {
			count.style.setProperty('display', 'inline-block', 'important');
			count.style.setProperty('visibility', 'visible', 'important');
			count.style.setProperty('opacity', '1', 'important');
		});
	}
	
	// Watch for DOM changes to ensure pagination stays visible
	function setupPaginationWatcher() {
		const observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					const target = mutation.target;
					if (target.classList.contains('list-paging-area') || 
						target.classList.contains('result-container') ||
						target.classList.contains('result')) {
						setTimeout(ensurePaginationVisible, 50);
					}
				}
				if (mutation.type === 'childList') {
					const addedNodes = Array.from(mutation.addedNodes);
					addedNodes.forEach(node => {
						if (node.nodeType === 1 && (
							node.classList.contains('list-paging-area') ||
							node.querySelector('.list-paging-area')
						)) {
							setTimeout(ensurePaginationVisible, 100);
						}
					});
				}
			});
		});
		
		// Observe changes to frappe-list containers
		document.querySelectorAll('.frappe-list').forEach(list => {
			observer.observe(list, {
				attributes: true,
				attributeFilter: ['style'],
				childList: true,
				subtree: true
			});
		});
	}

	// Handle route changes (Frappe specific)
	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			// Re-initialize enhancements after route change
			setTimeout(() => {
				fixLayoutSpacing();
				enhanceCards();
				enhanceWorkspaceCards();
				enhanceQuickAccessCards();
				enhanceLinkItems();
				ensureDataVisibility();
				ensurePaginationVisible();
			}, 100);
		});
		
		// Monitor for list view updates
		if (frappe.listview && frappe.listview.ListView) {
			const originalRefresh = frappe.listview.ListView.prototype.refresh;
			frappe.listview.ListView.prototype.refresh = function() {
				const result = originalRefresh.apply(this, arguments);
				setTimeout(ensurePaginationVisible, 100);
				return result;
			};
		}
	}
})();

