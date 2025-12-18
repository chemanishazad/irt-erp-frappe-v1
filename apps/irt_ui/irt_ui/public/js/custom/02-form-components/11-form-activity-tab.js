/**
 * Hide Activity Section and Add Activity Tab
 * Removes activity from form bottom and adds as tab in navigation
 */

(function() {
	'use strict';

	// Aggressively hide activity section
	function hideActivitySection() {
		// Hide all activity related elements
		const selectors = [
			'.form-footer',
			'.layout-main-section-wrapper > .form-footer',
			'div.form-footer',
			'.new-timeline',
			'.timeline-content',
			'.comment-box',
			'.after-save',
			'.form-activity',
			'.timeline-items'
		];
		
		selectors.forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				el.style.display = 'none';
				el.style.visibility = 'hidden';
				el.style.height = '0';
				el.style.overflow = 'hidden';
			});
		});
	}

	// Run on page load
	hideActivitySection();

	// Run periodically to catch dynamically added elements
	setInterval(hideActivitySection, 500);

	// Form hook to hide activity
	frappe.ui.form.on('*', {
		onload: function(frm) {
			hideActivitySection();
		},
		
		refresh: function(frm) {
			hideActivitySection();
			
			// Add Activity tab
			setTimeout(() => {
				addActivityTab(frm);
			}, 100);
		},
		
		after_save: function(frm) {
			hideActivitySection();
		}
	});

	function addActivityTab(frm) {
		if (!frm || !frm.page) return;
		
		// Find the tab container
		const $pageHead = $(frm.page.page).find('.page-head-content, .page-head');
		const $existingTabs = $pageHead.find('.standard-actions button, .tabs button, [role="tablist"] button');
		
		// Check if Activity tab already exists
		if ($pageHead.find('button:contains("Activity")').length > 0) return;
		
		// Create Activity tab
		const $activityBtn = $(`
			<button class="btn btn-default btn-sm" style="margin-left: 8px;">
				Activity
			</button>
		`);
		
		// Insert after last existing tab
		if ($existingTabs.length > 0) {
			$existingTabs.last().after($activityBtn);
		}
		
		// Click handler
		$activityBtn.on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			showActivityDialog(frm);
		});
	}

	function showActivityDialog(frm) {
		// Create a dialog to show activity
		const dialog = new frappe.ui.Dialog({
			title: 'Activity',
			size: 'large',
			fields: []
		});
		
		// Get activity HTML
		const $activity = $('.form-footer, .new-timeline, .timeline-content').first().clone();
		$activity.show();
		$activity.css({
			'display': 'block',
			'visibility': 'visible',
			'height': 'auto',
			'overflow': 'visible'
		});
		
		// Add to dialog
		dialog.$body.html($activity);
		dialog.show();
	}

	// Watch for DOM changes
	if (typeof MutationObserver !== 'undefined') {
		const observer = new MutationObserver(function() {
			hideActivitySection();
		});
		
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
})();
