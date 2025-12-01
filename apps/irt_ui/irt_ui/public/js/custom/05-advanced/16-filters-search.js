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

	function isDeskPage() {
		const route = typeof frappe?.get_route === 'function' ? frappe.get_route() : [];
		if (!route || route.length === 0 || route[0] === '' || route[0] === 'desk') {
			return true;
		}
		if (document.querySelector('.standard-icons, .desk-page')) {
			return true;
		}
		const listView = getActiveListView();
		if (!listView || !listView.doctype) {
			return true;
		}
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

	function syncInputWithListView() {
		const listView = getActiveListView();
		if (!listView || !state.input) return;

		const active = listView.__unified_search_query || '';
		state.input.value = active;
		// Clear button is always hidden - do nothing
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
		input.placeholder = 'Search...';
		input.autocomplete = 'off';

		const icon = document.createElement('span');
		icon.className = 'unified-search-icon';
		// Changed to a different search icon style (outline with circle and line)
		icon.innerHTML =
			'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';

		const clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'unified-search-clear';
		// Force hide with multiple methods to ensure it never shows
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

		state.wrapper = wrapper;
		state.input = input;
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

		if (state.clearBtn) {
			state.clearBtn.addEventListener('click', handleClearClick);
		}
	}

	/* -----------------------------------------------------------
	 * 5. PLACE SEARCH WRAPPER IN FILTER SECTION
	 * ----------------------------------------------------------- */
	function findTargetContainer() {
		if (isDeskPage()) return null;

		// Prefer filter-section inside page-form, not in sidebars
		let target =
			document.querySelector('.page-form .filter-section') ||
			document.querySelector('.filter-section');

		if (target && !target.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
			return target;
		}

		const pageForm = document.querySelector('.page-form');
		if (pageForm && !pageForm.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
			// Find or create filter-section inside page-form
			target = pageForm.querySelector('.filter-section');
			if (!target) {
				target = document.createElement('div');
				target.className = 'filter-section flex';
				pageForm.insertBefore(target, pageForm.firstChild);
			}
			return target;
		}

		return null;
	}

	function placeWrapper() {
		const target = findTargetContainer();
		if (!target || !state.wrapper) {
			log('No target container or wrapper found', { target: !!target, wrapper: !!state.wrapper });
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

		// Insert as first child (left side)
		if (target.firstChild) {
			target.insertBefore(state.wrapper, target.firstChild);
		} else {
			target.appendChild(state.wrapper);
		}

		// Minimal inline layout to cooperate with CSS
		const wStyle = state.wrapper.style;
		wStyle.display = 'flex';
		wStyle.flex = '1 1 auto';
		wStyle.minWidth = '200px';
		wStyle.height = '34px';
		wStyle.alignItems = 'center';

		// Ensure input stretches
		if (state.input) {
			state.input.style.width = '100%';
		}

		// Push filter controls to the right (first filter-like control gets auto margin)
		const rightControls = target.querySelector(
			'.filter-selector, .filter-button, .sort-selector, button[data-label="Filter"], button[data-original-title*="Filter"], button[title*="Filter"], button[data-original-title*="Sort"], button[title*="Sort"], button[data-original-title*="Last Updated"], button[title*="Last Updated"]'
		);
		if (rightControls && !rightControls.style.marginLeft) {
			rightControls.style.marginLeft = 'auto';
		}

		log('Search wrapper placed', {
			target: target.className,
			parent: state.wrapper.parentElement?.className,
		});

		return true;
	}

	function ensureSearchField(attempt = 0) {
		// Reuse existing wrapper if present
		const existing = document.querySelector('.unified-search-wrapper');
		if (existing && !state.wrapper) {
			state.wrapper = existing;
			state.input = existing.querySelector('.unified-search-input');
			state.clearBtn = existing.querySelector('.unified-search-clear');
		}

		if (!state.wrapper) {
			buildSearchWrapper();
		}

		const placed = placeWrapper();

		if (placed) {
			bindInputEvents();
			syncInputWithListView();
			if (attempt === 0) {
				log('Search field inserted/updated successfully');
			}
			return true;
		}

		if (attempt < 10 && !isDeskPage()) {
			log(`Retry placing search field (${attempt + 1}/10)`);
			setTimeout(() => ensureSearchField(attempt + 1), 300);
		} else if (attempt >= 10) {
			log('Failed to place search field after 10 attempts');
		}

		return false;
	}

	/* -----------------------------------------------------------
	 * 6. OBSERVERS & HOOKS
	 * ----------------------------------------------------------- */
	function initObservers() {
		// Watch DOM for filter-section creation
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				if (!document.querySelector('.unified-search-wrapper') &&
					document.querySelector('.filter-section') &&
					!isDeskPage()
				) {
					log('MutationObserver: filter-section detected, ensuring search field');
					ensureSearchField();
				}
			});

			const root = document.querySelector('.page-form') || document.body;
			observer.observe(root, {
				childList: true,
				subtree: true,
			});
		}

		// Router changes
		if (window.frappe && frappe.router && typeof frappe.router.on === 'function') {
			frappe.router.on('change', () => {
				setTimeout(() => {
					log('Route changed, ensuring search field');
					ensureSearchField();
					syncInputWithListView();
				}, 300);
			});
		}

		// List view setup hook
		if (window.frappe && frappe.views && frappe.views.ListView) {
			const proto = frappe.views.ListView.prototype;
			const originalSetup = proto.setup_view;
			if (originalSetup && !proto.__unifiedSearchSetupHooked) {
				proto.setup_view = function () {
					const result = originalSetup.apply(this, arguments);
					setTimeout(() => {
						log('List view setup complete, ensuring search field');
						ensureSearchField();
						syncInputWithListView();
					}, 400);
					return result;
				};
				proto.__unifiedSearchSetupHooked = true;
			}
		}

		// Initial DOM hooks
		document.addEventListener('DOMContentLoaded', () => {
			setTimeout(() => {
				log('DOM loaded, ensuring search field');
				ensureSearchField();
				syncInputWithListView();
			}, 200);
		});

		window.addEventListener('load', () => {
			setTimeout(() => {
				log('Window loaded, ensuring search field');
				ensureSearchField();
				syncInputWithListView();
			}, 300);
		});

		// Periodic sanity check as a fallback
		setInterval(() => {
			if (!isDeskPage() &&
				document.querySelector('.filter-section') &&
				!document.querySelector('.unified-search-wrapper')
			) {
				log('Periodic check: filter-section exists but search field missing');
				ensureSearchField();
			}

			// Force hide clear button if it somehow becomes visible
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
		}, 3000);
	}

	// Kick things off
	ensureSearchField();
	initObservers();
})();
