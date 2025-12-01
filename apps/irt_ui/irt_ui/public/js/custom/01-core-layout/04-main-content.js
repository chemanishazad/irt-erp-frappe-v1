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
		setTimeout(() => {
			fixLayoutSpacing();
			enhanceScrollbar();
			enhanceCards();
			enhanceWorkspaceCards();
			enhanceQuickAccessCards();
			enhanceLinkItems();
			ensureDataVisibility();
			ensurePaginationVisible();
			setupPaginationWatcher();
		}, 100);
		
		// Re-apply fixes for dynamic content
		setTimeout(fixLayoutSpacing, 500);
		setTimeout(ensurePaginationVisible, 500);
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

		const layoutWrapper = document.querySelector('.layout-main-section-wrapper');
		if (layoutWrapper) {
			layoutWrapper.style.setProperty('flex', '1 1 auto', 'important');
			layoutWrapper.style.setProperty('width', '100%', 'important');
			layoutWrapper.style.setProperty('max-width', '100%', 'important');
			layoutWrapper.style.setProperty('margin-right', '0px', 'important');
		}

		const layoutMain = document.querySelector('.layout-main');
		if (layoutMain) {
			layoutMain.style.setProperty('width', '100%', 'important');
			layoutMain.style.setProperty('max-width', '100%', 'important');
			layoutMain.style.setProperty('margin-right', '0px', 'important');
		}

		const sidebars = document.querySelectorAll('.form-sidebar, .list-sidebar, .layout-side-section, .layout-sidebar');
		sidebars.forEach(sidebar => {
			sidebar.style.setProperty('display', 'none', 'important');
			sidebar.style.setProperty('width', '0', 'important');
			sidebar.style.setProperty('margin', '0', 'important');
			sidebar.style.setProperty('padding', '0', 'important');
		});
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

		// Ensure list view result containers are visible
		const resultContainers = document.querySelectorAll('.frappe-list .result-container, .frappe-list .result, .frappe-list .no-result');
		resultContainers.forEach(element => {
			const computedStyle = window.getComputedStyle(element);
			// Only force visibility if it's actually hidden and should be shown
			if (computedStyle.display === 'none' && element.classList.contains('no-result')) {
				// Show no-result message if there's no data
				element.style.setProperty('display', 'block', 'important');
				element.style.setProperty('visibility', 'visible', 'important');
			} else if (computedStyle.display === 'none' && !element.classList.contains('no-result')) {
				// Check if there's data - if so, show the result container
				const listView = element.closest('.frappe-list');
				if (listView) {
					const hasRows = listView.querySelectorAll('.list-row-container').length > 0;
					if (hasRows) {
						element.style.setProperty('display', 'block', 'important');
						element.style.setProperty('visibility', 'visible', 'important');
					}
				}
			}
		});

		// Ensure no-result message is visible when there's no data
		const frappeLists = document.querySelectorAll('.frappe-list');
		frappeLists.forEach(list => {
			const resultContainer = list.querySelector('.result-container');
			const result = list.querySelector('.result');
			const noResult = list.querySelector('.no-result');
			const hasRows = list.querySelectorAll('.list-row-container').length > 0;

			if (resultContainer && !hasRows) {
				// If no rows, ensure no-result is visible
				if (noResult) {
					noResult.style.setProperty('display', 'block', 'important');
					noResult.style.setProperty('visibility', 'visible', 'important');
				}
				// Hide result container if no data
				if (result) {
					result.style.setProperty('display', 'none', 'important');
				}
			} else if (resultContainer && hasRows) {
				// If has rows, show result container and hide no-result
				resultContainer.style.setProperty('display', 'block', 'important');
				resultContainer.style.setProperty('visibility', 'visible', 'important');
				if (result) {
					result.style.setProperty('display', 'block', 'important');
					result.style.setProperty('visibility', 'visible', 'important');
				}
				if (noResult) {
					noResult.style.setProperty('display', 'none', 'important');
				}
			}
		});
	}

	/**
	 * Ensure Pagination Area is Always Visible
	 */
	function ensurePaginationVisible() {
		const paginationAreas = document.querySelectorAll('.list-paging-area');
		paginationAreas.forEach(area => {
			area.style.setProperty('display', 'block', 'important');
			area.style.setProperty('visibility', 'visible', 'important');
			area.style.setProperty('opacity', '1', 'important');
			area.style.setProperty('height', 'auto', 'important');
			area.style.setProperty('max-height', 'none', 'important');
			
			let parent = area.parentElement;
			while (parent && parent !== document.body) {
				if (parent.classList.contains('frappe-list')) {
					parent.style.setProperty('display', 'flex', 'important');
					parent.style.setProperty('flex-direction', 'column', 'important');
				}
				if (parent.classList.contains('result-container') || parent.classList.contains('result')) {
					parent.style.setProperty('overflow', 'visible', 'important');
				}
				parent = parent.parentElement;
			}
		});
		
		const loadMoreButtons = document.querySelectorAll('.list-paging-area .btn-more');
		loadMoreButtons.forEach(btn => {
			btn.style.setProperty('display', 'inline-block', 'important');
			btn.style.setProperty('visibility', 'visible', 'important');
			btn.style.setProperty('opacity', '1', 'important');
		});
		
		const listCounts = document.querySelectorAll('.list-count');
		listCounts.forEach(count => {
			count.style.setProperty('display', 'inline-block', 'important');
			count.style.setProperty('visibility', 'visible', 'important');
			count.style.setProperty('opacity', '1', 'important');
		});
	}
	
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
		
		document.querySelectorAll('.frappe-list').forEach(list => {
			observer.observe(list, {
				attributes: true,
				attributeFilter: ['style'],
				childList: true,
				subtree: true
			});
		});
	}

	if (typeof frappe !== 'undefined') {
		frappe.router?.on('change', function() {
			setTimeout(() => {
				fixLayoutSpacing();
				enhanceCards();
				enhanceWorkspaceCards();
				enhanceQuickAccessCards();
				enhanceLinkItems();
				ensureDataVisibility();
				ensurePaginationVisible();
			}, 100);
			// Also run after a longer delay to catch dynamically loaded content
			setTimeout(() => {
				ensureDataVisibility();
				ensurePaginationVisible();
			}, 500);
		});
		
		if (frappe.listview && frappe.listview.ListView) {
			const originalRefresh = frappe.listview.ListView.prototype.refresh;
			frappe.listview.ListView.prototype.refresh = function() {
				const result = originalRefresh.apply(this, arguments);
				setTimeout(() => {
					ensurePaginationVisible();
					ensureDataVisibility();
				}, 100);
				return result;
			};

			// Also hook into render_list to ensure visibility after rendering
			if (frappe.listview.ListView.prototype.render_list) {
				const originalRenderList = frappe.listview.ListView.prototype.render_list;
				frappe.listview.ListView.prototype.render_list = function() {
					const result = originalRenderList.apply(this, arguments);
					setTimeout(() => {
						ensureDataVisibility();
						ensurePaginationVisible();
					}, 50);
					return result;
				};
			}
		}
	}
})();

