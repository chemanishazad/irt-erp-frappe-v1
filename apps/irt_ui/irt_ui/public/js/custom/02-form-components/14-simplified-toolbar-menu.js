/**
 * Toolbar Menu - Ensure Proper Scrolling
 * Shows all default menu items with proper scrollbar support
 */

(function() {
	'use strict';

	// Ensure dropdown has proper scrolling when it opens
	function ensureDropdownScrolling() {
		const checkAndFixScrolling = function() {
			const dropdowns = $('.page-actions .dropdown-menu');
			dropdowns.each(function() {
				const $menu = $(this);
				// Ensure max-height and overflow are set
				if (!$menu.css('max-height') || $menu.css('max-height') === 'none') {
					$menu.css({
						'max-height': '400px',
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					});
				}
			});
		};

		// Check when dropdown is shown
		$(document).on('shown.bs.dropdown', '.page-actions .dropdown', function() {
			setTimeout(checkAndFixScrolling, 10);
		});

		// Also check on click
		$(document).on('click', '.page-actions [data-toggle="dropdown"]', function() {
			setTimeout(checkAndFixScrolling, 50);
		});

		// Initial check
		setTimeout(checkAndFixScrolling, 100);
	}

	// Initialize when DOM is ready
	if (typeof $ !== 'undefined') {
		ensureDropdownScrolling();
	} else {
		document.addEventListener('DOMContentLoaded', ensureDropdownScrolling);
	}

})();

