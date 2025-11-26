/**
 * Sidebar Logo Enhancement
 *
 * Enhances sidebar logo display and ensures proper rendering
 */

frappe.ready(function() {
	enhanceSidebarLogo();
});

function enhanceSidebarLogo() {
	// Wait for sidebar to be rendered
	setTimeout(() => {
		const logoContainer = document.querySelector('.header-logo-container');
		const logo = document.querySelector('.header-logo');

		if (logoContainer && logo) {
			// Ensure logo container is visible
			logoContainer.style.display = 'flex';
			logoContainer.style.alignItems = 'center';
			logoContainer.style.justifyContent = 'center';

			// If logo has an image, ensure it displays properly
			const logoImg = logo.querySelector('img');
			if (logoImg) {
				logoImg.style.maxWidth = '100%';
				logoImg.style.maxHeight = '100%';
				logoImg.style.objectFit = 'contain';
			}

			// If logo has SVG, ensure proper sizing
			const logoSvg = logo.querySelector('svg');
			if (logoSvg && !logoImg) {
				logoSvg.style.width = '24px';
				logoSvg.style.height = '24px';
			}
		}

		// Update title text if needed
		const headerTitle = document.querySelector('.sidebar-header .header-title');
		if (headerTitle) {
			const currentText = headerTitle.textContent.trim();
			if (currentText.includes('Frappe Framework')) {
				headerTitle.textContent = 'Frappe';
			}
		}
	}, 500);

	// Observe for dynamic updates
	const observer = new MutationObserver(() => {
		const logoContainer = document.querySelector('.header-logo-container');
		if (logoContainer) {
			logoContainer.style.display = 'flex';
		}
	});

	const sidebarHeader = document.querySelector('.sidebar-header');
	if (sidebarHeader) {
		observer.observe(sidebarHeader, {
			childList: true,
			subtree: true
		});
	}
}

