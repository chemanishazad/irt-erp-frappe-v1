/**
 * Custom Pagination for Frappe List Views
 * Simple: Page size dropdown + Load More button
 */

(function() {
	'use strict';

	const PAGE_SIZES = [10, 20, 50, 100];

	// Wait for Frappe to be ready
	$(document).ready(function() {
		// Hook into ListView after_render
		if (frappe.views && frappe.views.ListView) {
			const OriginalAfterRender = frappe.views.ListView.prototype.after_render;
			
			frappe.views.ListView.prototype.after_render = function() {
				OriginalAfterRender.call(this);
				
				// Transform pagination after render
				setTimeout(() => {
					transformPagination(this);
				}, 100);
			};
		}

		// Also hook into route changes
		frappe.router && frappe.router.on('change', function() {
			setTimeout(() => {
				if (cur_list && cur_list.$paging_area) {
					transformPagination(cur_list);
				}
			}, 500);
		});
	});

	function transformPagination(listView) {
		if (!listView || !listView.$paging_area) return;
		
		const $area = listView.$paging_area;
		
		// Check if already transformed
		if ($area.hasClass('custom-pagination-applied')) return;
		
		// Get pagination data
		const totalCount = listView.total_count || 0;
		const pageSize = listView.page_length || 20;
		const currentCount = listView.data ? listView.data.length : 0;
		const hasMore = currentCount < totalCount;
		
		// Build new pagination HTML
		const newHTML = buildPaginationHTML(pageSize, currentCount, totalCount, hasMore);
		
		// Replace content
		$area.html(newHTML);
		$area.addClass('custom-pagination-applied');
		$area.removeClass('level');
		
		// Bind events
		bindPaginationEvents($area, listView);
		
		// Always show the area (so dropdown is visible even without Load More)
		$area.css('display', 'flex');
	}

	function buildPaginationHTML(pageSize, currentCount, totalCount, hasMore) {
		const pageSizeOptions = PAGE_SIZES.map(size => {
			const selected = size === pageSize ? 'selected' : '';
			return `<option value="${size}" ${selected}>${size} / page</option>`;
		}).join('');
		
		return `
			<div class="pagination-left">
				<span class="pagination-info">Showing <strong>${currentCount}</strong> of <strong>${totalCount}</strong></span>
			</div>
			<div class="pagination-center">
				${hasMore ? '<button type="button" class="btn-load-more">Load More</button>' : '<span class="all-loaded">All loaded</span>'}
			</div>
			<div class="pagination-right">
				<select class="page-size-select">
					${pageSizeOptions}
				</select>
			</div>
		`;
	}

	function bindPaginationEvents($area, listView) {
		const removeTransformClass = () => {
			$area.removeClass('custom-pagination-applied');
		};
		
		// Load More button
		$area.find('.btn-load-more').off('click').on('click', function() {
			const pageSize = listView.page_length || 20;
			listView.start = listView.start + pageSize;
			removeTransformClass();
			listView.refresh();
		});
		
		// Page size dropdown
		$area.find('.page-size-select').off('change').on('change', function() {
			const newSize = parseInt($(this).val());
			listView.start = 0;
			listView.page_length = newSize;
			listView.selected_page_count = newSize;
			removeTransformClass();
			listView.refresh();
		});
	}

})();
