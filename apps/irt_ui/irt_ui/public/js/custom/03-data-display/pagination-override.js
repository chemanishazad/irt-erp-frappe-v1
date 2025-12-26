/**
 * Custom Page-Based Pagination for Frappe List Views
 * Shows: 21-40 of 341 | Prev | 1 | [2] | 3 | ... | N | Next | 10/page
 * 
 * Key Change: Uses direct frappe.call for page navigation to bypass data concatenation
 */

(function() {
	'use strict';

	const PAGE_SIZES = [10, 20, 50, 100];

	// Wait for frappe to be ready, then apply overrides
	$(document).ready(function() {
		applyListViewOverrides();
		
		// Route change handler - OPTIMIZED
		frappe.router && frappe.router.on('change', function() {
			if (window.requestAnimationFrame) {
				requestAnimationFrame(() => {
					if (cur_list && cur_list.$paging_area) {
						cur_list.$paging_area.removeClass('custom-pagination-applied');
						transformPagination(cur_list);
					}
				});
			} else {
				if (cur_list && cur_list.$paging_area) {
					cur_list.$paging_area.removeClass('custom-pagination-applied');
					transformPagination(cur_list);
				}
			}
		});
	});

	function applyListViewOverrides() {
		if (!frappe.views || !frappe.views.ListView) {
			setTimeout(applyListViewOverrides, 100);
			return;
		}

		// Override after_render - OPTIMIZED (no delay)
		const OriginalAfterRender = frappe.views.ListView.prototype.after_render;
		frappe.views.ListView.prototype.after_render = function() {
			const result = OriginalAfterRender.call(this);
			// Use requestAnimationFrame for immediate DOM update
			if (window.requestAnimationFrame) {
				requestAnimationFrame(() => transformPagination(this));
			} else {
				transformPagination(this);
			}
			return result;
		};

		// Override refresh to update pagination after data loads - OPTIMIZED
		const OriginalRefresh = frappe.views.ListView.prototype.refresh;
		frappe.views.ListView.prototype.refresh = function(args) {
			const self = this;
			const result = OriginalRefresh.call(this, args);
			
			if (result && result.then) {
				result.then(() => {
					// Wait a bit for total_count to be set (it's set in render_count)
					setTimeout(() => {
						if (self.$paging_area) {
							self.$paging_area.removeClass('custom-pagination-applied');
							transformPagination(self);
						}
					}, 200); // Small delay to allow render_count to complete
				});
			} else {
				// Synchronous refresh - wait a bit for total_count
				setTimeout(() => {
					if (self.$paging_area) {
						self.$paging_area.removeClass('custom-pagination-applied');
						transformPagination(self);
					}
				}, 200);
			}
			
			return result;
		};
		
		// Override render_count to update pagination when total_count is set
		const OriginalRenderCount = frappe.views.ListView.prototype.render_count;
		if (OriginalRenderCount) {
			frappe.views.ListView.prototype.render_count = function() {
				const self = this;
				const result = OriginalRenderCount.call(this);
				
				// After render_count completes, total_count should be set
				// Update pagination if it exists
				if (self.$paging_area && self.total_count !== undefined && self.total_count !== null) {
					setTimeout(() => {
						self.$paging_area.removeClass('custom-pagination-applied');
						transformPagination(self);
					}, 100);
				}
				
				return result;
			};
		}
	}

	function transformPagination(listView) {
		if (!listView || !listView.$paging_area) return;
		
		const $area = listView.$paging_area;
		if ($area.hasClass('custom-pagination-applied')) return;
		
		// Get pagination data
		const totalCount = listView.total_count;
		const pageSize = listView.page_length || 20;
		const start = listView.start || 0;
		const dataLength = listView.data ? listView.data.length : 0;
		
		// If total_count is not set yet, wait for it to be set
		// This happens when data is still loading
		if (totalCount === undefined || totalCount === null) {
			// Wait for total_count to be set (it's set in render_count -> get_count_str)
			// Check periodically until it's available
			let attempts = 0;
			const maxAttempts = 50; // 5 seconds max wait (50 * 100ms)
			const checkInterval = setInterval(() => {
				attempts++;
				if (listView.total_count !== undefined && listView.total_count !== null) {
					clearInterval(checkInterval);
					// Remove the applied class to allow re-transformation
					$area.removeClass('custom-pagination-applied');
					transformPagination(listView);
				} else if (attempts >= maxAttempts) {
					clearInterval(checkInterval);
					// If still not available after max attempts, use data length as fallback
					const fallbackCount = dataLength > 0 ? dataLength : 0;
					updatePaginationHTML(listView, $area, fallbackCount, pageSize, start, dataLength);
				}
			}, 100);
			return;
		}
		
		// total_count is available, proceed with normal pagination update
		updatePaginationHTML(listView, $area, totalCount, pageSize, start, dataLength);
	}
	
	function updatePaginationHTML(listView, $area, totalCount, pageSize, start, dataLength) {
		const currentPage = Math.floor(start / pageSize) + 1;
		const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
		
		// Calculate range based on actual data length shown
		const from = totalCount > 0 && dataLength > 0 ? start + 1 : 0;
		const to = totalCount > 0 && dataLength > 0 ? Math.min(start + dataLength, totalCount) : 0;
		
		// Build HTML
		const html = buildPaginationHTML(currentPage, totalPages, pageSize, totalCount, from, to);
		
		$area.html(html);
		$area.addClass('custom-pagination-applied');
		$area.removeClass('level');
		$area.css('display', 'flex');
		
		// Bind events
		bindEvents($area, listView);
	}

	function buildPaginationHTML(currentPage, totalPages, pageSize, totalCount, from, to) {
		const pages = getPageNumbers(currentPage, totalPages);
		const pagesHTML = pages.map(p => {
			if (p === '...') {
				return '<span class="page-ellipsis">···</span>';
			}
			const activeClass = p === currentPage ? 'active' : '';
			return `<button type="button" class="btn-page ${activeClass}" data-page="${p}" aria-label="Page ${p}">${p}</button>`;
		}).join('');
		
		const sizeOptions = PAGE_SIZES.map(size => {
			const selected = size === pageSize ? 'selected' : '';
			return `<option value="${size}" ${selected}>${size}/page</option>`;
		}).join('');
		
		// Format numbers with commas for better readability
		const formatNumber = (num) => {
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		};
		
		return `
			<div class="pagination-info">
				<span>${formatNumber(from)}-${formatNumber(to)} of ${formatNumber(totalCount)}</span>
			</div>
			<div class="pagination-controls">
				<button type="button" class="btn-nav btn-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M15 18l-6-6 6-6"/>
					</svg>
					<span>Prev</span>
				</button>
				<div class="page-numbers" role="navigation" aria-label="Pagination">
					${pagesHTML}
				</div>
				<button type="button" class="btn-nav btn-next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">
					<span>Next</span>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 18l6-6-6-6"/>
					</svg>
				</button>
			</div>
			<div class="pagination-size">
				<select class="page-size-select" aria-label="Items per page" title="Items per page">${sizeOptions}</select>
			</div>
		`;
	}

	function getPageNumbers(current, total) {
		if (total <= 7) {
			return Array.from({length: total}, (_, i) => i + 1);
		}
		
		const pages = [];
		pages.push(1);
		
		if (current > 3) {
			pages.push('...');
		}
		
		const start = Math.max(2, current - 1);
		const end = Math.min(total - 1, current + 1);
		
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		
		if (current < total - 2) {
			pages.push('...');
		}
		
		if (total > 1) {
			pages.push(total);
		}
		
		return pages;
	}

	function bindEvents($area, listView) {
		/**
		 * Custom page navigation that fetches fresh data for the target page
		 * Uses frappe.call directly to bypass Frappe's data concatenation
		 */
		const goToPage = (page) => {
			const pageSize = listView.page_length || 20;
			const targetStart = (page - 1) * pageSize;
			
			// Update listView state
			listView.start = targetStart;
			
			// Clear existing data to force fresh render
			listView.data = [];
			
			// Use frappe.call to fetch data directly
			const args = listView.get_args();
			args.start = targetStart;
			args.page_length = pageSize;
			
			frappe.call({
				method: listView.method || 'frappe.desk.reportview.get',
				args: args,
				type: 'GET',
				freeze: true,
				freeze_message: __('Loading...'),
			}).then((r) => {
				// Process response - same as prepare_data but always replace
				let data = r.message || {};
				Object.assign(frappe.boot.user_info, data.user_info || {});
				delete data.user_info;
				
				data = !Array.isArray(data) ? frappe.utils.dict(data.keys, data.values) : data;
				
				// Replace data (not concat)
				listView.data = data;
				listView.data = listView.data.uniqBy((d) => d.name);
				
				// Clear args cache to allow future refreshes
				listView.last_args = null;
				
				// Re-render the list
				listView.render();
				
				// Update pagination
				$area.removeClass('custom-pagination-applied');
				transformPagination(listView);
			}).catch((err) => {
				// Handle errors gracefully
				console.error('Pagination error:', err);
				frappe.show_alert({
					message: __('Failed to load page. Please try again.'),
					indicator: 'red'
				}, 3);
				// Restore pagination state
				$area.removeClass('custom-pagination-applied');
				transformPagination(listView);
			});
		};
		
		// Previous button
		$area.find('.btn-prev').off('click').on('click', function() {
			if ($(this).prop('disabled')) return;
			const pageSize = listView.page_length || 20;
			const currentPage = Math.floor((listView.start || 0) / pageSize) + 1;
			if (currentPage > 1) goToPage(currentPage - 1);
		});
		
		// Next button
		$area.find('.btn-next').off('click').on('click', function() {
			if ($(this).prop('disabled')) return;
			const pageSize = listView.page_length || 20;
			const totalPages = Math.ceil((listView.total_count || 0) / pageSize);
			const currentPage = Math.floor((listView.start || 0) / pageSize) + 1;
			if (currentPage < totalPages) goToPage(currentPage + 1);
		});
		
		// Page number buttons
		$area.find('.btn-page').off('click').on('click', function() {
			const page = parseInt($(this).data('page'));
			goToPage(page);
		});
		
		// Page size dropdown
		$area.find('.page-size-select').off('change').on('change', function() {
			const newSize = parseInt($(this).val());
			listView.page_length = newSize;
			listView.selected_page_count = newSize;
			goToPage(1); // Reset to page 1 when changing page size
		});
	}

})();
