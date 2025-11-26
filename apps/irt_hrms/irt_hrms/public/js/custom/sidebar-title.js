/**
 * Sidebar Title Customization
 *
 * Changes sidebar title to show "Frappe" instead of full name
 */

frappe.ready(function() {
	customizeSidebarTitle();
});

function customizeSidebarTitle() {
	// Wait for sidebar to be rendered
	setTimeout(() => {
		const headerTitle = document.querySelector('.sidebar-header .header-title');
		if (headerTitle) {
			// Get the text content
			const currentText = headerTitle.textContent.trim();

			// If it contains "Frappe Framework", change to just "Frappe"
			if (currentText.includes('Frappe')) {
				// Extract just "Frappe" or keep first word
				const titleText = currentText.split(' ')[0];
				headerTitle.textContent = titleText;
			}

			// Also check for app name that might be "Frappe Framework"
			if (frappe.boot && frappe.boot.app_name) {
				const appName = frappe.boot.app_name;
				if (appName.includes('Frappe')) {
					headerTitle.textContent = 'Frappe';
				}
			}
		}
	}, 500);

	// Also listen for sidebar updates
	const observer = new MutationObserver(() => {
		const headerTitle = document.querySelector('.sidebar-header .header-title');
		if (headerTitle) {
			const currentText = headerTitle.textContent.trim();
			if (currentText.includes('Frappe Framework') || currentText === 'Frappe Framework') {
				headerTitle.textContent = 'Frappe';
			}
		}
	});

	// Observe sidebar header for changes
	const sidebarHeader = document.querySelector('.sidebar-header');
	if (sidebarHeader) {
		observer.observe(sidebarHeader, {
			childList: true,
			subtree: true,
			characterData: true
		});
	}
}

