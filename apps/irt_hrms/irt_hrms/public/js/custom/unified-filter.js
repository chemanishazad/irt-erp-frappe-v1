/**
 * Unified Filter Enhancement
 * Simple and direct approach
 */

(function() {
	'use strict';

	function init() {
		// Wait for jQuery
		if (typeof $ === 'undefined') {
			setTimeout(init, 100);
			return;
		}

		const $sections = $('.standard-filter-section');
		if ($sections.length === 0) {
			setTimeout(init, 500);
			return;
		}

		$sections.each(function() {
			const $section = $(this);

			// Skip if already processed
			if ($section.data('unified-filter-processed')) {
				return;
			}
			$section.data('unified-filter-processed', true);

			// Find all filter inputs
			const $inputs = $section.find('input[type="text"], input[type="search"], select');
			if ($inputs.length < 2) {
				return; // Need at least 2 fields to unify
			}

			// Hide all fields except first
			$inputs.each(function(index) {
				if (index > 0) {
					$(this).closest('.form-group, .col-md-2, div').hide();
				}
			});

			// Make first field full width with enhanced styling
			const $firstField = $inputs.first().closest('.form-group, .col-md-2, div');
			$firstField.css({
				'flex': '1',
				'max-width': '100%',
				'min-width': '350px',
				'position': 'relative'
			});

			// Update placeholder of first field
			const $firstInput = $inputs.first();
			if ($firstInput.attr('placeholder')) {
				$firstInput.attr('placeholder', 'Search all fields (ID, Full Name, Username, User Type)...');
			}

			// Setup unified search - when user types in first field, apply to all text fields
			// and override filter generation to use OR logic
			let searchTimeout;
			let unifiedSearchActive = false;

			// Get list view reference and setup OR filter override
			const $listView = $section.closest('.frappe-list, [data-doctype]');
			let listView = null;
			if ($listView.length) {
				listView = $listView.data('list_view') || window.cur_list;
			}

			// Store fieldnames for unified search
			const fieldnames = [];
			$inputs.each(function() {
				const $input = $(this);
				const fieldname = $input.attr('data-fieldname') || $input.attr('name');
				if (fieldname && !$input.is('select')) {
					fieldnames.push(fieldname);
				}
			});

			// Setup OR filter override - override get_standard_filters to use OR logic
			function setupORFilterOverride() {
				if (!listView) {
					listView = $listView.data('list_view') || window.cur_list;
				}

				if (listView && listView.filter_area && typeof listView.filter_area.get_standard_filters === 'function' && !listView.filter_area._or_filter_override_set) {
					listView.filter_area._or_filter_override_set = true;
					const originalGetStandardFilters = listView.filter_area.get_standard_filters.bind(listView.filter_area);

					listView.filter_area.get_standard_filters = function() {
						const filters = originalGetStandardFilters();

						// Check if first field has a value and we have multiple text fields for unified search
						if (fieldnames.length > 1 && listView && listView.page && listView.page.fields_dict) {
							const firstField = listView.page.fields_dict[fieldnames[0]];
							if (firstField) {
								const searchValue = firstField.get_value();
								if (searchValue && String(searchValue).trim()) {
									// Normalize search value (remove % if present)
									let normalizedSearchValue = String(searchValue).replace(/%/g, '').trim();

									if (normalizedSearchValue) {
										// Format value for like condition
										let likeValue = normalizedSearchValue;
										if (!likeValue.includes('%')) {
											likeValue = '%' + likeValue + '%';
										}

										// Separate unified search filters from other filters
										const otherFilters = [];
										let foundUnifiedFilter = false;

										for (let i = 0; i < filters.length; i++) {
											const f = filters[i];
											if (Array.isArray(f) && f.length >= 4) {
												const fieldname = f[1];
												const condition = f[2];

												// If this is a like filter for one of our unified search fields
												if (condition === 'like' && fieldnames.includes(fieldname)) {
													foundUnifiedFilter = true;
													// Skip this filter - we'll add it to or_filters
													continue;
												}
											}
											// Keep non-unified filters
											otherFilters.push(f);
										}

										// Generate or_filters for ALL text fields
										const allOrFilters = [];
										fieldnames.forEach(function(fieldname) {
											allOrFilters.push([
												listView.doctype,
												fieldname,
												'like',
												likeValue
											]);
										});

										// Store or_filters on listView for get_args to pick up
										listView._unified_or_filters = allOrFilters;
										console.log('Unified filter: Generated', allOrFilters.length, 'or_filters for search:', normalizedSearchValue);

										return otherFilters;
									}
								}

								// Clear unified or_filters when search is empty
								if (!searchValue || !String(searchValue).trim()) {
									listView._unified_or_filters = null;
								}
							}
						}

						return filters;
					};

					// Override get_args to add or_filters
					if (listView && typeof listView.get_args === 'function' && !listView._get_args_override_set) {
						listView._get_args_override_set = true;
						const originalGetArgs = listView.get_args.bind(listView);

						listView.get_args = function() {
							const args = originalGetArgs();

							// Add unified or_filters if they exist
							if (listView._unified_or_filters && listView._unified_or_filters.length > 0) {
								if (!args.or_filters) {
									args.or_filters = [];
								}
								args.or_filters = args.or_filters.concat(listView._unified_or_filters);
								console.log('Unified filter: Added', listView._unified_or_filters.length, 'or_filters:', listView._unified_or_filters);
							}

							return args;
						};
					}
				}
			}

			// Try to setup override immediately and with delays
			setupORFilterOverride();
			setTimeout(setupORFilterOverride, 500);
			setTimeout(setupORFilterOverride, 1000);
			setTimeout(setupORFilterOverride, 2000);

			// Also try when list view is ready
			if (typeof frappe !== 'undefined' && frappe.ready) {
				frappe.ready(function() {
					setTimeout(setupORFilterOverride, 1000);
				});
			}

			$firstInput.on('input', function() {
				const searchValue = $(this).val().trim();
				unifiedSearchActive = !!searchValue;

				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					// Get listView and fields_dict to set values properly
					if (!listView) {
						listView = $listView.data('list_view') || window.cur_list;
					}

					if (listView && listView.page && listView.page.fields_dict) {
						if (searchValue) {
							// Set value on all text field objects using their set_value method
							fieldnames.forEach(function(fieldname) {
								const field = listView.page.fields_dict[fieldname];
								if (field && typeof field.set_value === 'function') {
									try {
										field.set_value(searchValue);
									} catch(e) {
										// Fallback: set input value directly
										const $input = $section.find('[data-fieldname="' + fieldname + '"]');
										if ($input.length) {
											$input.val(searchValue);
											$input.trigger('input');
											$input.trigger('change');
										}
									}
								}
							});
						} else {
							// Clear all fields
							fieldnames.forEach(function(fieldname) {
								const field = listView.page.fields_dict[fieldname];
								if (field && typeof field.set_value === 'function') {
									try {
										field.set_value('');
									} catch(e) {
										// Fallback: clear input value directly
										const $input = $section.find('[data-fieldname="' + fieldname + '"]');
										if ($input.length) {
											$input.val('');
											$input.trigger('input');
											$input.trigger('change');
										}
									}
								}
							});
						}
					}
				}, 300);
			});
		});
	}

	// Start when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Also try after a delay
	setTimeout(init, 1000);
	setTimeout(init, 2000);
	setTimeout(init, 3000);

	// Watch for new filter sections
	if (window.MutationObserver) {
		const observer = new MutationObserver(function() {
			init();
		});
		if (document.body) {
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
	}
})();
