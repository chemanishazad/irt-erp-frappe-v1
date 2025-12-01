/**
 * Unified Search & Filters
 * Places one clean search input beside the filter buttons
 * and uses server-side OR filters so every visible column is searched.
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

	function patchBaseList() {
		if (baseListPatched) {
			return true;
		}

		if (!(frappe && frappe.views && frappe.views.BaseList)) {
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

	function getActiveListView() {
		if (window.cur_list && window.cur_list.doctype) {
			return window.cur_list;
		}

		const views = frappe?.views?.list_view || {};
		const route = typeof frappe?.get_route === 'function' ? frappe.get_route() : [];
		const doctypeFromRoute = route && route[1];

		if (doctypeFromRoute) {
			const match = Object.values(views).find((view) => view && view.doctype === doctypeFromRoute);
			if (match) {
				return match;
			}
		}

		return Object.values(views).find((view) => view && view.doctype) || null;
	}

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
		state.clearBtn.style.display = active ? 'flex' : 'none';
	}

	function handleInput(value) {
		clearTimeout(state.searchTimeout);
		state.searchTimeout = setTimeout(() => applySearch(value), SEARCH_DEBOUNCE);
	}

	function handleClearClick() {
		if (!state.input) return;
		state.input.value = '';
		state.clearBtn.style.display = 'none';
		handleInput('');
	}

	function bindInputEvents() {
		if (!state.input || state.input.dataset.unifiedBound === 'true') return;

		state.input.dataset.unifiedBound = 'true';

		state.input.addEventListener('input', function () {
			const hasValue = !!this.value.trim();
			state.clearBtn.style.display = hasValue ? 'flex' : 'none';
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
		icon.innerHTML =
			'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142C8.8181 12.2929 7.3181 12.7071 5.70711 12.7071C2.53553 12.7071 0 10.1716 0 7.00001C0 3.82843 2.53553 1.29289 5.70711 1.29289C8.87868 1.29289 11.4142 3.82843 11.4142 7.00001C11.4142 8.611 10.9999 10.111 10 11.2929Z" fill="currentColor"/></svg>';

		const clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'unified-search-clear';
		clearBtn.innerHTML =
			'<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

		formGroup.appendChild(icon);
		formGroup.appendChild(input);
		formGroup.appendChild(clearBtn);
		wrapper.appendChild(formGroup);

		state.wrapper = wrapper;
		state.input = input;
		state.clearBtn = clearBtn;
	}

	function isDeskPage() {
		// Check if we're on the desk/home page
		const route = typeof frappe?.get_route === 'function' ? frappe.get_route() : [];
		if (!route || route.length === 0 || route[0] === '' || route[0] === 'desk') {
			return true;
		}
		
		// Check for desk page elements
		if (document.querySelector('.standard-icons') || document.querySelector('.desk-page')) {
			return true;
		}
		
		// Check if there's no list view
		const listView = getActiveListView();
		if (!listView || !listView.doctype) {
			return true;
		}
		
		return false;
	}

	function findTargetContainer() {
		// Don't create search on desk page
		if (isDeskPage()) {
			return null;
		}
		
		const candidates = [
			document.querySelector('.page-form .filter-section'),
			document.querySelector('.page-form'),
			document.querySelector('.page-header + .page-form'),
			document.querySelector('.layout-main .page-form'),
		];

		for (const target of candidates) {
			if (!target) continue;
			if (target.closest('.sidebar, .list-sidebar, .desk-sidebar')) continue;
			return target;
		}

		const list = document.querySelector('.frappe-list');
		if (list && list.parentElement && !list.parentElement.closest('.sidebar, .list-sidebar, .desk-sidebar')) {
			return list.parentElement;
		}

		return null; // Don't fall back to body/layout-main
	}

	function findAnchorChild(target) {
		if (!target) return null;
		const children = Array.from(target.children || []);
		const selectorList = ['.filter-selector', '.btn-group', '.filter-button', '.filter-toggle'];
		return children.find((child) => selectorList.some((sel) => child.matches(sel)));
	}

	function placeWrapper() {
		const target = findTargetContainer();
		if (!target || !state.wrapper) {
			return false;
		}

		const anchor = findAnchorChild(target);
		if (anchor && anchor.parentElement === target) {
			target.insertBefore(state.wrapper, anchor);
		} else if (target.firstChild) {
			target.insertBefore(state.wrapper, target.firstChild);
		} else {
			target.appendChild(state.wrapper);
		}

		return true;
	}

	function ensureSearchField(attempt = 0) {
		const existing = document.querySelector('.unified-search-wrapper');
		if (existing) {
			state.wrapper = existing;
			state.input = existing.querySelector('.unified-search-input');
			state.clearBtn = existing.querySelector('.unified-search-clear');
			placeWrapper();
			bindInputEvents();
			syncInputWithListView();
			return true;
		}

		buildSearchWrapper();
		const placed = placeWrapper();

		if (placed) {
			bindInputEvents();
			syncInputWithListView();
			log('Search field inserted');
			return true;
		}

		if (attempt < 10) {
			setTimeout(() => ensureSearchField(attempt + 1), 300);
		}

		return false;
	}

	function initObservers() {
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				if (!document.querySelector('.unified-search-wrapper')) {
					ensureSearchField();
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });
		}

		if (window.frappe && frappe.router && typeof frappe.router.on === 'function') {
			frappe.router.on('change', () =>
				setTimeout(() => {
					ensureSearchField();
					syncInputWithListView();
				}, 150)
			);
		}

		document.addEventListener('DOMContentLoaded', () =>
			setTimeout(() => {
				ensureSearchField();
				syncInputWithListView();
			}, 100)
		);

		window.addEventListener('load', () =>
			setTimeout(() => {
				ensureSearchField();
				syncInputWithListView();
			}, 150)
		);
	}

	ensureSearchField();
	initObservers();
})();
 
