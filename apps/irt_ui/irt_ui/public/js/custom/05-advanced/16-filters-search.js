/**
 * Unified Search & Filters (Cleaned)
 * - Places one search input beside filter buttons
 * - Uses server-side OR filters so every visible column is searched
 */

console.log('🔍 Unified search script loaded');

(function () {
	'use strict';

	const SEARCH_DEBOUNCE = 450;
	const MAX_SEARCH_FIELDS = 5;

	const state = {
		wrapper: null,
		input: null,
		clearBtn: null,
		searchTimeout: null,
	};

	let baseListPatched = false;

	function log(...args) {
		console.log('[UnifiedSearch]', ...args);
	}

	/* -----------------------------------------------------------
	 * 1. PATCH BASE LIST FOR OR FILTERS
	 * ----------------------------------------------------------- */
	function patchBaseList() {
		if (baseListPatched) return true;

		if (!(window.frappe && frappe.views && frappe.views.BaseList)) {
			return false;
		}

		const proto = frappe.views.BaseList.prototype;
		if (proto.__unifiedSearchPatched) {
			baseListPatched = true;
			return true;
		}

		const originalGetArgs = proto.get_args;
		proto.get_args = function () {
			const args = originalGetArgs.call(this) || {};
			if (this.__unified_or_filters && this.__unified_or_filters.length) {
				args.or_filters = this.__unified_or_filters;
			} else if (args.or_filters) {
				delete args.or_filters;
			}
			return args;
		};

		proto.__unifiedSearchPatched = true;
		baseListPatched = true;
		return true;
	}

	/* -----------------------------------------------------------
	 * 2. CURRENT LIST VIEW / ROUTE HELPERS
	 * ----------------------------------------------------------- */
	function getActiveListView() {
		if (window.cur_list && window.cur_list.doctype) {
			return window.cur_list;
		}

		const views = frappe?.views?.list_view || {};
		const route = typeof frappe?.get_route === 'function' ? frappe.get_route() : [];
		const doctypeFromRoute = route && route[1];

		if (doctypeFromRoute) {
			const match = Object.values(views).find(
				(view) => view && view.doctype === doctypeFromRoute
			);
			if (match) return match;
		}

		return Object.values(views).find((view) => view && view.doctype) || null;
	}

	function isListRoute() {
		// Prefer DOM detection so we don't miss tree-like routes that still show list UI
		if (document.querySelector('.list-search')) return true;
		if (window.cur_list && window.cur_list.doctype) return true;

		const route = typeof frappe?.get_route === 'function' ? frappe.get_route() : [];
		return (
			(route && route.length && route[0] && route[0].toLowerCase() === 'list') ||
			(route && route.length && route[1] && route[1].toLowerCase() === 'list')
		);
	}

	// Backward compat: keep a no-op isDeskPage to avoid ReferenceErrors
	function isDeskPage() {
		return false;
	}

	/* -----------------------------------------------------------
	 * 3. SEARCH FIELD / FILTER LOGIC
	 * ----------------------------------------------------------- */
	function isTextField(fieldtype) {
		if (!fieldtype) return true;
		const friendly = [
			'Data',
			'Small Text',
			'Text',
			'Text Editor',
			'Long Text',
			'Read Only',
			'Link',
			'Dynamic Link',
			'Select',
			'HTML Editor',
			'Phone',
			'Email',
			'Code',
		];
		return friendly.includes(fieldtype) || fieldtype.toLowerCase().includes('text');
	}

	function getSearchFields(listView) {
		const fields = new Set(['name']);

		if (listView.meta) {
			if (listView.meta.title_field) {
				fields.add(listView.meta.title_field);
			}
			if (typeof listView.meta.search_fields === 'string') {
				listView.meta.search_fields
					.split(',')
					.map((field) => field && field.trim())
					.filter(Boolean)
					.forEach((field) => fields.add(field));
			}
		}

		if (Array.isArray(listView.columns)) {
			listView.columns.forEach((column) => {
				const df = column?.df;
				if (df && df.fieldname && isTextField(df.fieldtype)) {
					fields.add(df.fieldname);
				}
			});
		}

		return Array.from(fields)
			.filter(Boolean)
			.slice(0, MAX_SEARCH_FIELDS);
	}

	function buildOrFilters(listView, fields, query) {
		const value = `%${query}%`;
		return fields.map((field) => [listView.doctype, field, 'like', value]);
	}

	function applySearch(query) {
		if (!patchBaseList()) {
			setTimeout(() => applySearch(query), 200);
			return;
		}

		const listView = getActiveListView();
		if (!listView) {
			setTimeout(() => applySearch(query), 200);
			return;
		}

		const searchValue = (query || '').trim();

		if (!searchValue) {
			if (listView.__unified_or_filters && listView.__unified_or_filters.length) {
				delete listView.__unified_or_filters;
				delete listView.__unified_search_query;
				listView.start = 0;
				listView.refresh();
			}
			return;
		}

		const fields = getSearchFields(listView);
		if (!fields.length) {
			log('No searchable fields found');
			return;
		}

		listView.__unified_or_filters = buildOrFilters(listView, fields, searchValue);
		listView.__unified_search_query = searchValue;
		listView.start = 0;
		listView.refresh();
		log('Applied unified search filters:', fields);
	}

	function showNativeSearchFallback() {
		const native = document.querySelector('.list-search');
		if (native) {
			native.style.setProperty('display', 'flex', 'important');
			native.style.setProperty('opacity', '1', 'important');
			native.style.setProperty('visibility', 'visible', 'important');
			const input = native.querySelector('input');
			if (input) {
				input.style.setProperty('display', 'block', 'important');
				input.style.setProperty('opacity', '1', 'important');
				input.style.setProperty('visibility', 'visible', 'important');
				input.style.setProperty('width', '100%', 'important');
			}
		}
	}

	function syncInputWithListView() {
		const listView = getActiveListView();
		if (!listView || !state.input) return;

		const active = listView.__unified_search_query || '';
		state.input.value = active;
		// Clear button is always hidden - do nothing
	showNativeSearchFallback();
	}

	function handleInput(value) {
		clearTimeout(state.searchTimeout);
		state.searchTimeout = setTimeout(() => applySearch(value), SEARCH_DEBOUNCE);
	}

	function handleClearClick() {
		if (!state.input) return;
		state.input.value = '';
		// Clear button is always hidden - do nothing
		handleInput('');
	}

	/* -----------------------------------------------------------
	 * 4. BUILD SEARCH UI
	 * ----------------------------------------------------------- */
	function buildSearchWrapper() {
		const wrapper = document.createElement('div');
		wrapper.className = 'unified-search-wrapper';
		wrapper.dataset.unifiedSearch = 'true';

		const formGroup = document.createElement('div');
		formGroup.className = 'form-group unified-search-group';
		formGroup.style.position = 'relative';

		const input = document.createElement('input');
		input.type = 'text';
		input.className = 'unified-search-input form-control';
		input.placeholder = 'Search records...';
		input.autocomplete = 'off';

		const icon = document.createElement('span');
		icon.className = 'unified-search-icon';
		icon.innerHTML =
			'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';

		// Create search button
		const searchBtn = document.createElement('button');
		searchBtn.type = 'button';
		searchBtn.className = 'unified-search-btn btn btn-primary';
		searchBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><span>Search</span>';
		searchBtn.setAttribute('aria-label', 'Search');

		const clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'unified-search-clear';
		clearBtn.style.setProperty('display', 'none', 'important');
		clearBtn.style.setProperty('visibility', 'hidden', 'important');
		clearBtn.style.setProperty('opacity', '0', 'important');
		clearBtn.style.setProperty('pointer-events', 'none', 'important');
		clearBtn.setAttribute('hidden', 'true');
		clearBtn.innerHTML =
			'<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
		clearBtn.setAttribute('aria-label', 'Clear search');
		clearBtn.setAttribute('aria-hidden', 'true');

		formGroup.appendChild(icon);
		formGroup.appendChild(input);
		formGroup.appendChild(clearBtn);
		wrapper.appendChild(formGroup);
		wrapper.appendChild(searchBtn);

		state.wrapper = wrapper;
		state.input = input;
		state.searchBtn = searchBtn;
		state.clearBtn = clearBtn;
	}

	function bindInputEvents() {
		if (!state.input || state.input.dataset.unifiedBound === 'true') return;

		state.input.dataset.unifiedBound = 'true';

		state.input.addEventListener('input', function () {
			// Clear button is always hidden - don't show it
			handleInput(this.value);
		});

		state.input.addEventListener('keydown', function (event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				handleInput(this.value);
			}
		});

		// Bind search button click
		if (state.searchBtn) {
			state.searchBtn.addEventListener('click', function() {
				handleInput(state.input.value);
			showNativeSearchFallback();
			});
		}

		if (state.clearBtn) {
			state.clearBtn.addEventListener('click', handleClearClick);
		}
	}

	/* -----------------------------------------------------------
	 * 5. PLACE SEARCH WRAPPER IN FILTER SECTION
	 * ----------------------------------------------------------- */
	function findTargetContainer() {
		// First, try to use the list view's $filter_section property (most reliable)
		const listView = window.cur_list || getActiveListView();
		if (listView && listView.$filter_section && listView.$filter_section.length) {
			const domElement = listView.$filter_section[0];
			if (domElement && !domElement.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
				return domElement;
			}
		}

		// Fallback: Prefer filter-section inside page-form (created by FilterArea)
		let target =
			document.querySelector('.page-form .filter-section') ||
			document.querySelector('.filter-section');

		if (target && !target.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
			return target;
		}

		// Try to find page-form (where FilterArea creates filter-section)
		const pageForm = document.querySelector('.page-form');
		if (pageForm && !pageForm.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
			// Check if filter-section exists (created by FilterArea)
			target = pageForm.querySelector('.filter-section');
			if (!target) {
				// FilterArea might not have created it yet, create our own
				target = document.createElement('div');
				target.className = 'filter-section flex';
				target.style.width = '100%';
				target.style.gap = '8px';
				// Insert at the beginning of page-form
				if (pageForm.firstChild) {
					pageForm.insertBefore(target, pageForm.firstChild);
				} else {
					pageForm.appendChild(target);
				}
			}
			return target;
		}

		// Fallback: create inside page head container
		const headContainer =
			document.querySelector('.page-head .page-head-content') ||
			document.querySelector('.page-head .container') ||
			document.querySelector('.page-head');
		if (headContainer) {
			target = headContainer.querySelector('.filter-section');
			if (!target) {
				target = document.createElement('div');
				target.className = 'filter-section flex';
				target.style.width = '100%';
				target.style.gap = '8px';
				if (headContainer.firstChild) {
					headContainer.insertBefore(target, headContainer.firstChild);
				} else {
					headContainer.appendChild(target);
				}
			}
			return target;
		}

		return null;
	}

	function placeWrapper() {
		const target = findTargetContainer();
		if (!target || !state.wrapper) {
			return false;
		}

		// Already placed
		if (target.contains(state.wrapper) && state.wrapper.parentElement === target) {
			return true;
		}

		// Remove from old location
		if (state.wrapper.parentElement) {
			state.wrapper.parentElement.removeChild(state.wrapper);
		}

		// Remove search wrapper from anywhere else first
		if (state.wrapper.parentElement) {
			state.wrapper.parentElement.removeChild(state.wrapper);
		}
		
		// Insert as FIRST child (absolute left position)
		if (target.firstChild) {
			target.insertBefore(state.wrapper, target.firstChild);
		} else {
			target.insertBefore(state.wrapper, null);
		}
		
		// Force it to be the first element
		if (target.firstChild !== state.wrapper) {
			target.insertBefore(state.wrapper, target.firstChild);
		}

		// Minimal inline layout - simple approach
		const wStyle = state.wrapper.style;
		wStyle.display = 'flex';
		wStyle.flex = '1 1 auto';
		wStyle.minWidth = '320px';
		wStyle.maxWidth = '100%';
		wStyle.width = '100%';
		wStyle.height = '36px';
		wStyle.alignItems = 'center';
		wStyle.marginRight = '12px';
		wStyle.marginLeft = '0';
		wStyle.order = '-1';

		// Ensure input stretches
		if (state.input) {
			state.input.style.width = '100%';
		}

		// Ensure filter section and parent containers align left
		if (target && target.style) {
			target.style.justifyContent = 'flex-start';
			target.style.marginLeft = '0';
			target.style.marginRight = '0';
		}
		
		// Also fix standard-filter-section if it exists - LEFT ALIGNED
		const standardFilterSection = target.closest('.standard-filter-section') || 
		                             document.querySelector('.standard-filter-section');
		if (standardFilterSection) {
			standardFilterSection.style.justifyContent = 'flex-start';
			standardFilterSection.style.order = '-1';
			standardFilterSection.style.marginLeft = '0';
			standardFilterSection.style.marginRight = '0';
		}
		
		// Fix page-form alignment - LEFT ALIGNED
		const pageForm = target.closest('.page-form') || document.querySelector('.page-form');
		if (pageForm) {
			pageForm.style.justifyContent = 'flex-start';
			pageForm.style.alignItems = 'center';
			
			// Ensure standard-filter-section is first child
			const stdFilter = pageForm.querySelector('.standard-filter-section');
			if (stdFilter && pageForm.firstChild !== stdFilter) {
				pageForm.insertBefore(stdFilter, pageForm.firstChild);
			}
		}

		log('Search wrapper placed', {
			target: target.className,
			parent: state.wrapper.parentElement?.className,
		});

		return true;
	}

	function ensureSearchField(attempt = 0) {
		// Only proceed if we're on a list route or have a list view
		if (!isListRoute() && !window.cur_list) {
			return false;
		}

		// Reuse existing wrapper if present
		const existing = document.querySelector('.unified-search-wrapper');
		if (existing && !state.wrapper) {
			state.wrapper = existing;
			state.input = existing.querySelector('.unified-search-input');
			state.clearBtn = existing.querySelector('.unified-search-clear');
			state.searchBtn = existing.querySelector('.unified-search-btn');
		}

		if (!state.wrapper) {
			buildSearchWrapper();
		}

		// Try to place the wrapper
		const placed = placeWrapper();

		if (placed) {
			bindInputEvents();
			syncInputWithListView();
			showNativeSearchFallback();
			if (attempt === 0) {
				log('Search field inserted/updated successfully');
			}
			return true;
		}

		// If not placed and we haven't exceeded retry limit, try again
		if (attempt < 20) {
			// Increase delay for later attempts
			const delay = attempt < 5 ? 200 : attempt < 10 ? 300 : 400;
			setTimeout(() => ensureSearchField(attempt + 1), delay);
		} else {
			// Final fallback: show native search
			if (attempt === 20) {
				log('Failed to place search field after 20 attempts; showing native search');
			}
			showNativeSearchFallback();
		}

		return false;
	}

	/* -----------------------------------------------------------
	 * 6. APPLY LIST VIEW OVERRIDES (Same pattern as pagination)
	 * ----------------------------------------------------------- */
	function applyListViewOverrides() {
		if (!frappe.views || !frappe.views.ListView) {
			setTimeout(applyListViewOverrides, 100);
			return;
		}

		// Hook into setup_filter_area to place search field right after filter section is created
		const OriginalSetupFilterArea = frappe.views.ListView.prototype.setup_filter_area;
		if (OriginalSetupFilterArea && !frappe.views.ListView.prototype.__unifiedSearchFilterAreaHooked) {
			frappe.views.ListView.prototype.setup_filter_area = function() {
				const result = OriginalSetupFilterArea.call(this);
				// Store reference to this list view
				window.cur_list = this;
				
				// FilterArea creates $filter_section synchronously, so it should be ready
				// But wait a tiny bit for DOM to update
				setTimeout(() => {
					ensureSearchField();
					syncInputWithListView();
					showNativeSearchFallback();
				}, 50);
				
				return result;
			};
			frappe.views.ListView.prototype.__unifiedSearchFilterAreaHooked = true;
		}

		// Override after_render - same timing as pagination (100ms)
		const OriginalAfterRender = frappe.views.ListView.prototype.after_render;
		frappe.views.ListView.prototype.after_render = function() {
			OriginalAfterRender.call(this);
			// Store reference to this list view
			window.cur_list = this;
			
			// Ensure search field is placed - filter section should exist by now
			setTimeout(() => {
				ensureSearchField();
				syncInputWithListView();
				showNativeSearchFallback();
			}, 100);
		};

		// Override refresh to update search field after data loads
		const OriginalRefresh = frappe.views.ListView.prototype.refresh;
		frappe.views.ListView.prototype.refresh = function(args) {
			const self = this;
			// Store reference to this list view
			window.cur_list = self;
			const result = OriginalRefresh.call(this, args);
			
			if (result && result.then) {
				result.then(() => {
					setTimeout(() => {
						// Ensure search field is placed and synced
						ensureSearchField();
						syncInputWithListView();
						showNativeSearchFallback();
					}, 50);
				});
			} else {
				setTimeout(() => {
					// Ensure search field is placed and synced
					ensureSearchField();
					syncInputWithListView();
					showNativeSearchFallback();
				}, 50);
			}
			
			return result;
		};
	}

	/* -----------------------------------------------------------
	 * 7. OBSERVERS & INITIALIZATION
	 * ----------------------------------------------------------- */
	function initObservers() {
		// Watch DOM for filter-section creation - debounced
		if (typeof MutationObserver !== 'undefined') {
			let mutationTimeout;
			const observer = new MutationObserver(() => {
				clearTimeout(mutationTimeout);
				mutationTimeout = setTimeout(() => {
					if (isListRoute() && !document.querySelector('.unified-search-wrapper')) {
						ensureSearchField();
						showNativeSearchFallback();
					}
				}, 200);
			});

			const root = document.body;
			observer.observe(root, {
				childList: true,
				subtree: true,
			});
		}

		// Periodic sanity check to ensure clear buttons stay hidden
		const hideClearButtons = () => {
			const clearButtons = document.querySelectorAll('.unified-search-clear');
			clearButtons.forEach(btn => {
				const computed = window.getComputedStyle(btn);
				if (computed.display !== 'none' || computed.visibility !== 'hidden' || computed.opacity !== '0' || !btn.hasAttribute('hidden')) {
					btn.style.setProperty('display', 'none', 'important');
					btn.style.setProperty('visibility', 'hidden', 'important');
					btn.style.setProperty('opacity', '0', 'important');
					btn.style.setProperty('pointer-events', 'none', 'important');
					btn.setAttribute('hidden', 'true');
				}
			});
		};

		// Run periodic check less frequently
		setInterval(() => {
			if (isListRoute()) {
				hideClearButtons();
			}
		}, 2000);
	}

	// Wait for frappe to be ready, then apply overrides - EXACT same approach as pagination
	$(document).ready(function() {
		applyListViewOverrides();
		initObservers();
		
		// Initial load check - wait for list view and filter section to be ready
		function tryInitialLoad(attempt = 0) {
			if (attempt > 20) return; // Stop after 20 attempts (~6 seconds)
			
			// Check multiple ways to detect list view
			const listView = window.cur_list || getActiveListView();
			// Check for filter section via list view property (most reliable)
			const hasFilterSectionViaListView = listView && listView.$filter_section && listView.$filter_section.length;
			// Or check DOM
			const hasFilterSectionInDOM = document.querySelector('.page-form .filter-section') || 
			                              document.querySelector('.filter-section');
			const hasFilterSection = hasFilterSectionViaListView || hasFilterSectionInDOM;
			const hasListContainer = document.querySelector('.frappe-list, .list-container, .list-view-container');
			const isList = isListRoute() || hasListContainer || listView;
			
			if (isList && hasFilterSection) {
				// We're on a list route and filter section exists - place search field
				ensureSearchField();
				syncInputWithListView();
				showNativeSearchFallback();
			} else if (isList) {
				// We're on a list route but filter section not ready yet, retry
				setTimeout(() => tryInitialLoad(attempt + 1), 250);
			} else if (attempt < 12) {
				// Not on list route yet, keep checking (but less aggressively)
				setTimeout(() => tryInitialLoad(attempt + 1), 400);
			}
		}
		
		// Start initial load check after a short delay
		setTimeout(() => tryInitialLoad(), 200);
		
		// Route change handler - same timing as pagination (500ms)
		frappe.router && frappe.router.on('change', function() {
			setTimeout(() => {
				if (isListRoute() || window.cur_list) {
					ensureSearchField();
					syncInputWithListView();
					showNativeSearchFallback();
				}
			}, 500);
		});
	});
})();
