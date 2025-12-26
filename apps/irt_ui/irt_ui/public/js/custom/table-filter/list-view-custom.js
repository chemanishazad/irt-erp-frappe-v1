/**
 * List View Customizations
 * - Disable row/cell clicks
 * - Hide checkbox column
 * - Add View button at end of each row
 */

(function() {
	'use strict';

	/**
	 * Disable row and cell clicks
	 */
	function disableRowClicks() {
		// Prevent row clicks from opening forms
		$(document).off('click', '.frappe-list .list-row').on('click', '.frappe-list .list-row', function(e) {
			const $target = $(e.target);
			
			// Allow View button clicks
			if ($target.hasClass('view-detail-btn') || $target.closest('.view-detail-btn').length > 0) {
				return true;
			}
			
			// Prevent all other clicks
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// Prevent cell clicks (including status cells)
		$(document).off('click', '.frappe-list .list-row-col').on('click', '.frappe-list .list-row-col', function(e) {
			const $target = $(e.target);
			
			// Allow View button clicks
			if ($target.hasClass('view-detail-btn') || $target.closest('.view-detail-btn').length > 0) {
				return true;
			}
			
			// Prevent all other clicks
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// Prevent status badge/clicks specifically
		$(document).off('click', '.frappe-list .indicator-pill, .frappe-list .status, .frappe-list [class*="status"]').on('click', '.frappe-list .indicator-pill, .frappe-list .status, .frappe-list [class*="status"]', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// Prevent link clicks in cells
		$(document).off('click', '.frappe-list .list-row a').on('click', '.frappe-list .list-row a', function(e) {
			const $target = $(e.target);
			
			// Allow View button clicks
			if ($target.hasClass('view-detail-btn') || $target.closest('.view-detail-btn').length > 0) {
				return true;
			}
			
			// Prevent all other link clicks
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// Prevent filterable clicks
		$(document).off('click', '.frappe-list .filterable').on('click', '.frappe-list .filterable', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	}

	// Cache selectors for performance
	const CHECKBOX_SELECTORS = '.list-row-head .select-like, .list-row-head .checkbox-actions, .frappe-list .list-row .select-like, .frappe-list .list-row .checkbox-actions';
	const CHECKBOX_INPUT_SELECTORS = '.frappe-list input[type="checkbox"]';
	const SUBJECT_SELECTORS = '.frappe-list .list-row-col.list-subject, .frappe-list .list-row .level-left .list-row-col.list-subject';
	
	/**
	 * Hide checkbox column (but keep first data column visible) - OPTIMIZED
	 */
	function hideCheckboxColumn() {
		// Batch CSS operations for performance
		const hideStyles = {
			display: 'none !important',
			visibility: 'hidden !important',
			width: '0 !important',
			height: '0 !important',
			opacity: '0 !important',
			position: 'absolute !important',
			left: '-9999px !important',
			flex: '0 !important'
		};
		
		// Hide checkbox elements in one batch
		$(CHECKBOX_SELECTORS).css(hideStyles);
		$(CHECKBOX_INPUT_SELECTORS).css(hideStyles);

		// Ensure first data column (subject) is visible - batch operation
		$(SUBJECT_SELECTORS).css({
			display: 'flex !important',
			visibility: 'visible !important',
			opacity: '1 !important',
			position: 'relative !important',
			left: 'auto !important',
			width: 'auto !important',
			minWidth: '150px !important',
			flex: '1.5 !important'
		});

		// Optimize level-left check - only process if needed
		const $levelLefts = $('.frappe-list .list-row .level-left');
		if ($levelLefts.length > 0) {
			$levelLefts.each(function() {
				const $levelLeft = $(this);
				const $firstVisibleCol = $levelLeft.find('.list-row-col:not(.select-like):not(.checkbox-actions):first');
				if ($firstVisibleCol.length > 0 && !$firstVisibleCol.hasClass('list-subject')) {
					$firstVisibleCol.css({
						display: 'flex !important',
						visibility: 'visible !important',
						opacity: '1 !important',
						position: 'relative !important',
						left: 'auto !important',
						width: 'auto !important',
						minWidth: '150px !important'
					});
				}
			});
		}
	}

	// Cache doctype for performance
	let cachedDoctype = null;
	
	/**
	 * Add View button to each row - OPTIMIZED
	 */
	function addViewButtons() {
		// Cache doctype lookup
		if (!cachedDoctype) {
			const route = frappe.get_route();
			cachedDoctype = route && route[1] ? route[1] : (window.cur_list ? window.cur_list.doctype : null);
		}
		
		if (!cachedDoctype) return;
		
		// Use documentFragment for batch DOM operations
		const $rows = $('.frappe-list .list-row').not(':has(.view-detail-btn)');
		if ($rows.length === 0) return;
		
		$rows.each(function() {
			const $row = $(this);
			
			// Get document name - optimized lookup
			const name = $row.attr('data-name') || 
			            $row.find('.list-subject a').attr('data-name') || 
			            $row.find('a[data-name]').first().attr('data-name');
			
			if (!name) return;

			// Find or create actions column
			let $actionsCol = $row.find('.list-row-col.actions');
			
			if ($actionsCol.length === 0) {
				// Create actions column if it doesn't exist
				$actionsCol = $('<div>', {
					class: 'list-row-col actions'
				});
				
				// Find level-right or create it
				let $levelRight = $row.find('.level-right');
				if ($levelRight.length === 0) {
					$levelRight = $('<div>', {
						class: 'level-right'
					});
					$row.append($levelRight);
				}
				
				$levelRight.append($actionsCol);
			}

			// Create View button with event handler
			const $viewBtn = $('<button>', {
				class: 'btn btn-sm btn-primary view-detail-btn',
				type: 'button',
				html: '<span>View</span>',
				'data-doctype': cachedDoctype,
				'data-name': name
			}).on('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				const btnDoctype = $(this).attr('data-doctype');
				const btnName = $(this).attr('data-name');
				
				if (btnDoctype && btnName) {
					frappe.set_route(['Form', btnDoctype, btnName]);
				}
			});

			// Add button to actions column
			$actionsCol.append($viewBtn);
		});
	}

	/**
	 * Add Actions header column to table header
	 */
	function addActionsHeader() {
		const $header = $('.list-row-head');
		if ($header.length === 0) return;

		// Check if Actions header already exists
		if ($header.find('.list-row-col.actions-header').length > 0) {
			return;
		}

		// Find level-right in header or create it
		let $headerLevelRight = $header.find('.level-right');
		if ($headerLevelRight.length === 0) {
			$headerLevelRight = $('<div>', {
				class: 'level-right'
			});
			$header.append($headerLevelRight);
		}

		// Remove grey background from level-right immediately
		$headerLevelRight.css({
			background: 'transparent !important',
			backgroundColor: 'transparent !important',
			borderLeft: 'none !important'
		});

		// Create Actions header column with inline styles for immediate visibility
		const $actionsHeader = $('<div>', {
			class: 'list-row-col actions-header ellipsis hidden-xs',
			html: '<span>Actions</span>',
			css: {
				display: 'flex !important',
				visibility: 'visible !important',
				opacity: '1 !important',
				alignItems: 'center !important',
				justifyContent: 'flex-start !important',
				padding: '8px 12px !important',
				minWidth: '90px !important',
				flexShrink: '0 !important',
				fontSize: '11px !important',
				fontWeight: '500 !important',
				textTransform: 'uppercase !important',
				letterSpacing: '0.3px !important',
				color: 'var(--text-muted, #6c757d) !important',
				textAlign: 'left !important',
				background: 'transparent !important',
				backgroundColor: 'transparent !important',
				position: 'relative !important',
				left: 'auto !important',
				width: 'auto !important',
				height: 'auto !important'
			}
		});

		// Add to level-right
		$headerLevelRight.append($actionsHeader);
	}

	/**
	 * Override Frappe's get_header_html_skeleton to inject Actions header directly into HTML
	 */
	function overrideGetHeaderHtmlSkeleton() {
		if (!frappe.views || !frappe.views.ListView) {
			// Retry if ListView not ready yet
			setTimeout(overrideGetHeaderHtmlSkeleton, 50);
			return;
		}
		
		const ListView = frappe.views.ListView;
		if (ListView.prototype.__irt_ui_header_html_overridden) return;
		
		// Override get_header_html_skeleton to inject Actions header directly
		const originalGetHeaderHtmlSkeleton = ListView.prototype.get_header_html_skeleton;
		if (originalGetHeaderHtmlSkeleton) {
			ListView.prototype.get_header_html_skeleton = function(left = "", right = "") {
				// Inject Actions header into right HTML before Frappe processes it
				const actionsHeaderHtml = `
					<div class="list-row-col actions-header ellipsis hidden-xs">
						<span>Actions</span>
					</div>
				`;
				
				// Append Actions header to right HTML
				const modifiedRight = right + actionsHeaderHtml;
				
				// Call original with modified right HTML
				return originalGetHeaderHtmlSkeleton.call(this, left, modifiedRight);
			};
		}
		
		ListView.prototype.__irt_ui_header_html_overridden = true;
	}

	/**
	 * Override Frappe's get_right_html to inject View button directly into HTML
	 */
	function overrideGetRightHtml() {
		if (!frappe.views || !frappe.views.ListView) {
			setTimeout(overrideGetRightHtml, 50);
			return;
		}
		
		const ListView = frappe.views.ListView;
		if (ListView.prototype.__irt_ui_right_html_overridden) return;
		
		const originalGetRightHtml = ListView.prototype.get_right_html;
		if (originalGetRightHtml) {
			ListView.prototype.get_right_html = function(doc) {
				// Get original right HTML (meta info, etc.)
				const originalRight = originalGetRightHtml.call(this, doc);
				
				// Get doctype and name
				const doctype = this.doctype || (frappe.get_route() && frappe.get_route()[1]);
				const name = doc.name;
				
				if (!doctype || !name) {
					return originalRight;
				}
				
				// Use Frappe's escape_html to prevent XSS
				const escapeHtml = frappe.utils.escape_html || ((str) => {
					if (!str) return '';
					const div = document.createElement('div');
					div.textContent = str;
					return div.innerHTML;
				});
				
				// Inject View button HTML directly into right HTML
				const viewButtonHtml = `
					<div class="list-row-col actions">
						<button type="button" class="btn btn-sm btn-primary view-detail-btn" 
							data-doctype="${escapeHtml(doctype)}" 
							data-name="${escapeHtml(name)}">
							<span>View</span>
						</button>
					</div>
				`;
				
				// Append View button to right HTML
				return originalRight + viewButtonHtml;
			};
		}
		
		ListView.prototype.__irt_ui_right_html_overridden = true;
	}

	/**
	 * Override Frappe's render_header and render_list to inject Actions header immediately
	 */
	function overrideRenderHeader() {
		if (!frappe.views || !frappe.views.ListView) {
			// Retry if ListView not ready yet
			setTimeout(overrideRenderHeader, 100);
			return;
		}
		
		const ListView = frappe.views.ListView;
		if (ListView.prototype.__irt_ui_header_overridden) return;
		
		// Override render_header
		const originalRenderHeader = ListView.prototype.render_header;
		ListView.prototype.render_header = function(refresh_header) {
			const result = originalRenderHeader.call(this, refresh_header);
			
			// Add Actions header immediately - no delay
			addActionsHeader();
			
			return result;
		};
		
		// Also override render_list which calls render_header
		const originalRenderList = ListView.prototype.render_list;
		if (originalRenderList) {
			ListView.prototype.render_list = function() {
				const result = originalRenderList.call(this);
				
				// Add Actions header after render_list completes
				addActionsHeader();
				
				// Bind View button click events immediately after render
				bindViewButtonEvents();
				
				return result;
			};
		}
		
		// Also override setup_view which calls render_header
		const originalSetupView = ListView.prototype.setup_view;
		if (originalSetupView) {
			ListView.prototype.setup_view = function() {
				const result = originalSetupView.call(this);
				
				// Add Actions header after setup_view completes
				addActionsHeader();
				
				return result;
			};
		}
		
		ListView.prototype.__irt_ui_header_overridden = true;
	}
	
	/**
	 * Bind click events to View buttons (for buttons injected via HTML override)
	 */
	function bindViewButtonEvents() {
		// Use event delegation for better performance - only bind once
		if (!viewButtonsBound) {
			$(document).off('click', '.view-detail-btn').on('click', '.view-detail-btn', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				const $btn = $(this);
				const doctype = $btn.attr('data-doctype');
				const name = $btn.attr('data-name');
				
				if (doctype && name) {
					frappe.set_route(['Form', doctype, name]);
				}
			});
			viewButtonsBound = true;
		}
	}

	/**
	 * Hide unwanted right-end elements
	 */
	function hideRightEndElements() {
		// Hide list-count, like icons, and other unwanted right-end elements
		$('.frappe-list .list-row .level-right .list-count').hide();
		$('.frappe-list .list-row-head .level-right .list-count').hide();
		$('.frappe-list .list-row .level-right .list-liked-by-me').hide();
		$('.frappe-list .list-row-head .level-right .list-liked-by-me').hide();
		$('.frappe-list .list-row .level-right .list-row-activity').hide();
		$('.frappe-list .list-row-head .level-right .list-row-activity').hide();
		
		// Hide all level-items in level-right except actions column
		$('.frappe-list .list-row .level-right .level-item').each(function() {
			const $item = $(this);
			if (!$item.hasClass('actions') && !$item.find('.list-row-col.actions').length && !$item.find('.view-detail-btn').length) {
				$item.hide();
			}
		});
		
		$('.frappe-list .list-row-head .level-right .level-item').each(function() {
			const $item = $(this);
			if (!$item.hasClass('actions-header') && !$item.find('.list-row-col.actions-header').length && !$item.find('.list-row-col.actions').length) {
				$item.hide();
			}
		});
	}

	// Cache for performance
	let lastCustomizationTime = 0;
	const CUSTOMIZATION_THROTTLE = 200; // Only run every 200ms max
	
	/**
	 * Apply cell borders dynamically - ENSURE ALL CELLS HAVE BORDERS (including empty)
	 */
	function applyCellBorders() {
		const route = frappe.get_route();
		if (route && route[0] === 'List' && route[1]) {
			// Apply borders to ALL header columns (including empty cells) - THIN LAYER LINES
			$('.list-row-head .level-left .list-row-col, .list-row-head .list-row-col:not(.actions-header), .list-row-head .list-row-col:empty').each(function() {
				const $col = $(this);
				if (!$col.hasClass('actions-header')) {
					$col.css({
						'border-right': '1px solid #e2e8f0',
						'border-right-width': '1px',
						'border-right-style': 'solid',
						'border-right-color': '#e2e8f0',
						'border-top': 'none',
						'border-bottom': 'none',
						'border-left': 'none',
						'height': '100%',
						'min-height': '100%',
						'padding-top': '0',
						'padding-bottom': '0',
						'margin-top': '0',
						'margin-bottom': '0',
						'align-self': 'stretch'
					});
				}
			});
			
			// Apply borders to ALL row columns (including empty cells) - THIN LAYER LINES
			$('.frappe-list .list-row .level-left .list-row-col, .frappe-list .list-row .list-row-col:not(.actions), .frappe-list .list-row-col:empty, .frappe-list .list-row .list-row-col:empty').each(function() {
				const $col = $(this);
				if (!$col.hasClass('actions')) {
					$col.css({
						'border-right': '1px solid #e2e8f0',
						'border-right-width': '1px',
						'border-right-style': 'solid',
						'border-right-color': '#e2e8f0',
						'border-top': 'none',
						'border-bottom': 'none',
						'border-left': 'none',
						'height': '100%',
						'min-height': '100%',
						'padding-top': '0',
						'padding-bottom': '0',
						'margin-top': '0',
						'margin-bottom': '0',
						'align-self': 'stretch'
					});
				}
			});
			
			// Ensure rows and containers stretch for full height borders
			$('.frappe-list .list-row, .list-row-head').css({
				'display': 'flex',
				'align-items': 'stretch',
				'min-height': '38px'
			});
			
			$('.frappe-list .list-row .level-left, .list-row-head .level-left').css({
				'display': 'flex',
				'align-items': 'stretch',
				'height': '100%',
				'min-height': '100%'
			});
			
			// Apply horizontal borders (top and bottom) - THIN LAYER LINES
			// Header: top and bottom borders
			$('.list-row-head').css({
				'border-top': '1px solid #e2e8f0',
				'border-bottom': '1px solid #e2e8f0',
				'border-top-width': '1px',
				'border-bottom-width': '1px',
				'border-top-style': 'solid',
				'border-bottom-style': 'solid',
				'border-top-color': '#e2e8f0',
				'border-bottom-color': '#e2e8f0'
			});
			
			// Rows: top and bottom borders (all rows including last)
			$('.frappe-list .list-row').css({
				'border-top': '1px solid #e2e8f0',
				'border-bottom': '1px solid #e2e8f0',
				'border-top-width': '1px',
				'border-bottom-width': '1px',
				'border-top-style': 'solid',
				'border-bottom-style': 'solid',
				'border-top-color': '#e2e8f0',
				'border-bottom-color': '#e2e8f0'
			});
			
			// Add left and right borders to table container
			$('.frappe-list, .frappe-list .result-container').css({
				'border-left': '1px solid #e2e8f0',
				'border-right': '1px solid #e2e8f0',
				'border-left-width': '1px',
				'border-right-width': '1px',
				'border-left-style': 'solid',
				'border-right-style': 'solid',
				'border-left-color': '#e2e8f0',
				'border-right-color': '#e2e8f0',
				'box-sizing': 'border-box'
			});
			
			// Add left border to first column
			$('.frappe-list .list-row .level-left .list-row-col:first-child, .list-row-head .level-left .list-row-col:first-child').css({
				'border-left': '1px solid #e2e8f0',
				'border-left-width': '1px',
				'border-left-style': 'solid',
				'border-left-color': '#e2e8f0'
			});
			
			// Add right border to actions column
			$('.frappe-list .list-row .level-right .list-row-col.actions, .list-row-head .level-right .list-row-col.actions-header').css({
				'border-right': '1px solid #e2e8f0',
				'border-right-width': '1px',
				'border-right-style': 'solid',
				'border-right-color': '#e2e8f0'
			});
			
			// Remove left border from actions column header (last data column has right border)
			$('.list-row-head .level-right .list-row-col.actions-header, .list-row-head .list-row-col.actions-header').each(function() {
				$(this).css({
					'border-left': 'none',
					'border-left-width': '0',
					'border-left-style': 'none',
					'border-left-color': 'transparent',
					'border-right': 'none',
					'border-top': 'none',
					'border-bottom': 'none'
				});
			});
			
			// Remove left border from actions column rows (last data column has right border)
			$('.frappe-list .list-row .level-right .list-row-col.actions, .frappe-list .list-row-col.actions').each(function() {
				$(this).css({
					'border-left': 'none',
					'border-left-width': '0',
					'border-left-style': 'none',
					'border-left-color': 'transparent',
					'border-right': 'none',
					'border-top': 'none',
					'border-bottom': 'none'
				});
			});
			
			// Remove left border from level-right container (prevents double line)
			$('.frappe-list .list-row .level-right, .list-row-head .level-right').each(function() {
				$(this).css({
					'border-left': 'none',
					'border-left-width': '0',
					'border-left-style': 'none',
					'border-left-color': 'transparent'
				});
			});
		}
	}

	/**
	 * Apply all customizations (throttled for performance)
	 */
	function applyCustomizations() {
		const now = Date.now();
		if (now - lastCustomizationTime < CUSTOMIZATION_THROTTLE) {
			return;
		}
		lastCustomizationTime = now;
		
		const route = frappe.get_route();
		if (route && route[0] === 'List' && route[1]) {
			disableRowClicks();
			hideCheckboxColumn();
			addActionsHeader();
			addViewButtons();
			hideRightEndElements();
			applyCellBorders(); // Apply cell borders
		}
	}

	// Single optimized observer for all changes
	let observerInstance = null;
	let lastHeaderCheck = 0;
	const HEADER_CHECK_THROTTLE = 300;
	
	// Track if View buttons are already bound
	let viewButtonsBound = false;
	
	/**
	 * Initialize with optimized DOM observer
	 */
	function init() {
		// Override get_header_html_skeleton FIRST - this injects Actions header into HTML directly
		overrideGetHeaderHtmlSkeleton();
		
		// Override get_right_html FIRST - this injects View button into HTML directly
		overrideGetRightHtml();
		
		// Override Frappe's render_header - try multiple times if needed (reduced attempts)
		let overrideAttempts = 0;
		const maxOverrideAttempts = 10; // Reduced from 20
		const tryOverride = setInterval(() => {
			overrideAttempts++;
			if (frappe.views && frappe.views.ListView) {
				overrideRenderHeader();
				overrideGetRightHtml(); // Ensure override is applied
				bindViewButtonEvents(); // Bind events immediately
				clearInterval(tryOverride);
			} else if (overrideAttempts >= maxOverrideAttempts) {
				clearInterval(tryOverride);
			}
		}, 100); // Increased from 50ms

		// Immediate check for existing header
		if ($('.list-row-head').length > 0) {
			addActionsHeader();
		}

		// Single optimized MutationObserver for all changes
		if (!observerInstance && document.body) {
			observerInstance = new MutationObserver(function(mutations) {
				let needsHeaderCheck = false;
				let needsCustomization = false;
				
				// Batch process all mutations
				for (let mutation of mutations) {
					if (mutation.addedNodes.length) {
						for (let node of mutation.addedNodes) {
							if (node.nodeType === 1) { // Element node
								// Check for header
								if (node.classList && (
									node.classList.contains('list-row-head') ||
									node.classList.contains('list-row-container') ||
									node.querySelector('.list-row-head') ||
									node.querySelector('.level-right')
								)) {
									needsHeaderCheck = true;
								}
								
								// Check for list rows
								if (node.classList && (
									node.classList.contains('frappe-list') ||
									node.classList.contains('list-row') ||
									node.querySelector('.frappe-list') ||
									node.querySelector('.list-row')
								)) {
									needsCustomization = true;
								}
							}
						}
					}
				}
				
				// Apply changes only if needed
				if (needsHeaderCheck) {
					const now = Date.now();
					if (now - lastHeaderCheck > HEADER_CHECK_THROTTLE) {
						addActionsHeader();
						lastHeaderCheck = now;
					}
				}
				
				if (needsCustomization) {
					// Ensure View buttons are bound when rows are added
					bindViewButtonEvents();
					applyCustomizations();
				}
			});
			
			// Observe only the main content area, not entire body
			const $mainContent = $('.layout-main-section, .page-body');
			const targetElement = $mainContent.length > 0 ? $mainContent[0] : document.body;
			
			observerInstance.observe(targetElement, {
				childList: true,
				subtree: true,
				attributes: false // Don't watch attributes for performance
			});
		}

		// Apply on route change - optimized
		frappe.router.on('change', function() {
			// Clear doctype cache on route change
			cachedDoctype = null;
			
			// Use requestAnimationFrame for better performance
			if (window.requestAnimationFrame) {
				requestAnimationFrame(() => {
					addActionsHeader();
					bindViewButtonEvents(); // Re-bind events after route change
					applyCustomizations();
					applyCellBorders(); // Apply cell borders
				});
			} else {
				setTimeout(() => {
					addActionsHeader();
					bindViewButtonEvents(); // Re-bind events after route change
					applyCustomizations();
					applyCellBorders(); // Apply cell borders
				}, 100);
			}
		});
		
		// Apply cell borders immediately and periodically
		applyCellBorders();
		setInterval(applyCellBorders, 500);

		// Reduced frequency checks - only when needed
		setInterval(function() {
			const $header = $('.list-row-head');
			if ($header.length > 0 && $header.find('.list-row-col.actions-header').length === 0) {
				addActionsHeader();
			}
		}, 500); // Reduced from 100ms to 500ms

		// Less frequent periodic check
		setInterval(applyCustomizations, 2000); // Increased from 1000ms to 2000ms
	}

	// Initialize immediately and also on document ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	
	// Also initialize on jQuery ready as backup
	$(document).ready(function() {
		init();
	});
	
	// Also try immediately - all overrides (optimized)
	if (typeof frappe !== 'undefined' && frappe.views && frappe.views.ListView) {
		overrideGetHeaderHtmlSkeleton();
		overrideGetRightHtml();
		overrideRenderHeader();
		bindViewButtonEvents(); // Bind events immediately
	}
	
	// Clear doctype cache on route change
	frappe.router && frappe.router.on('change', function() {
		cachedDoctype = null;
	});

})();

