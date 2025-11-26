/**
 * Sidebar Enhancements
 *
 * JavaScript for enhanced sidebar functionality and interactions
 */

frappe.ready(function() {
	initSidebarEnhancements();
	initSidebarAnimations();
	initSidebarTooltips();
	initSidebarKeyboardNavigation();
});

/**
 * Initialize Sidebar Enhancements
 */
function initSidebarEnhancements() {
	const sidebar = document.querySelector('.body-sidebar');
	if (!sidebar) return;

	// Add smooth scroll behavior
	sidebar.style.scrollBehavior = 'smooth';

	// Highlight active item on page load
	highlightActiveSidebarItem();

	// Add click ripple effect to sidebar items
	addRippleEffect();

	// Add loading state for navigation
	addLoadingStates();

	// Auto-scroll to active item
	autoScrollToActiveItem();
}

/**
 * Highlight Active Sidebar Item
 */
function highlightActiveSidebarItem() {
	const activeItem = document.querySelector('.standard-sidebar-item.active-sidebar');
	if (activeItem) {
		// Add entrance animation
		activeItem.style.animation = 'fadeInUp 0.4s ease-out';

		// Ensure it's visible
		setTimeout(() => {
			activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);
	}
}

/**
 * Add Ripple Effect to Sidebar Items
 */
function addRippleEffect() {
	const sidebarItems = document.querySelectorAll('.standard-sidebar-item .item-anchor');

	sidebarItems.forEach(anchor => {
		anchor.addEventListener('click', function(e) {
			// Remove existing ripple
			const existingRipple = this.querySelector('.ripple-effect');
			if (existingRipple) {
				existingRipple.remove();
			}

			// Create ripple
			const ripple = document.createElement('span');
			ripple.classList.add('ripple-effect');

			const rect = this.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height);
			const x = e.clientX - rect.left - size / 2;
			const y = e.clientY - rect.top - size / 2;

			ripple.style.width = ripple.style.height = size + 'px';
			ripple.style.left = x + 'px';
			ripple.style.top = y + 'px';

			this.appendChild(ripple);

			// Remove after animation
			setTimeout(() => {
				ripple.style.opacity = '0';
				ripple.style.transform = 'scale(2)';
				setTimeout(() => ripple.remove(), 300);
			}, 200);
		});
	});

	// Add CSS for ripple effect
	if (!document.getElementById('sidebar-ripple-style')) {
		const style = document.createElement('style');
		style.id = 'sidebar-ripple-style';
		style.textContent = `
			.ripple-effect {
				position: absolute;
				border-radius: 50%;
				background: rgba(102, 126, 234, 0.3);
				transform: scale(0);
				animation: sidebar-ripple 0.6s ease-out;
				pointer-events: none;
				z-index: 0;
			}
			@keyframes sidebar-ripple {
				to {
					transform: scale(2);
					opacity: 0;
				}
			}
		`;
		document.head.appendChild(style);
	}
}

/**
 * Add Loading States for Navigation
 */
function addLoadingStates() {
	const sidebarLinks = document.querySelectorAll('.standard-sidebar-item .item-anchor[href]');

	sidebarLinks.forEach(link => {
		link.addEventListener('click', function(e) {
			const item = this.closest('.standard-sidebar-item');
			if (item && !item.classList.contains('active-sidebar')) {
				// Add loading state
				item.classList.add('loading');

				// Remove loading state after navigation (with timeout fallback)
				setTimeout(() => {
					item.classList.remove('loading');
				}, 2000);
			}
		});
	});
}

/**
 * Auto-scroll to Active Item
 */
function autoScrollToActiveItem() {
	const activeItem = document.querySelector('.standard-sidebar-item.active-sidebar');
	if (activeItem) {
		setTimeout(() => {
			activeItem.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest'
			});
		}, 300);
	}
}

/**
 * Initialize Sidebar Animations
 */
function initSidebarAnimations() {
	// Staggered fade-in animation for sidebar items
	const sidebarItems = document.querySelectorAll('.standard-sidebar-item');

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry, index) => {
			if (entry.isIntersecting) {
				setTimeout(() => {
					entry.target.style.opacity = '0';
					entry.target.style.transform = 'translateX(-20px)';
					entry.target.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

					setTimeout(() => {
						entry.target.style.opacity = '1';
						entry.target.style.transform = 'translateX(0)';
					}, 50);
				}, index * 30);

				observer.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.1,
		rootMargin: '0px'
	});

	sidebarItems.forEach(item => {
		observer.observe(item);
	});
}

/**
 * Initialize Enhanced Tooltips
 */
function initSidebarTooltips() {
	const sidebarItems = document.querySelectorAll('.standard-sidebar-item .item-anchor');

	sidebarItems.forEach(anchor => {
		const label = anchor.querySelector('.sidebar-item-label');
		if (label) {
			// Check if text is truncated
			if (label.scrollWidth > label.clientWidth) {
				anchor.setAttribute('title', label.textContent.trim());
				anchor.setAttribute('data-toggle', 'tooltip');
				anchor.setAttribute('data-placement', 'right');
			}
		}
	});
}

/**
 * Initialize Keyboard Navigation
 */
function initSidebarKeyboardNavigation() {
	const sidebar = document.querySelector('.body-sidebar');
	if (!sidebar) return;

	// Make sidebar focusable
	sidebar.setAttribute('tabindex', '0');

	sidebar.addEventListener('keydown', function(e) {
		const items = Array.from(document.querySelectorAll('.standard-sidebar-item .item-anchor'));
		const currentIndex = items.findIndex(item => item === document.activeElement);

		let nextIndex = -1;

		switch(e.key) {
			case 'ArrowDown':
				e.preventDefault();
				nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'ArrowUp':
				e.preventDefault();
				nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				break;
			case 'Home':
				e.preventDefault();
				nextIndex = 0;
				break;
			case 'End':
				e.preventDefault();
				nextIndex = items.length - 1;
				break;
			case 'Enter':
			case ' ':
				if (document.activeElement.tagName === 'A') {
					document.activeElement.click();
				}
				return;
		}

		if (nextIndex >= 0 && items[nextIndex]) {
			items[nextIndex].focus();
			items[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	});
}

/**
 * Add Hover Sound Effect (Optional - can be disabled)
 */
function addHoverSound() {
	// This is optional and can be enabled if desired
	// For now, we'll keep it disabled to avoid audio pollution
}

/**
 * Update Sidebar Width Dynamically
 */
function updateSidebarWidth(width) {
	const sidebar = document.querySelector('.body-sidebar');
	if (sidebar) {
		sidebar.style.width = width + 'px';
		sidebar.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

		// Update main content margin
		const mainContent = document.querySelector('.layout-main-section, .main-section');
		if (mainContent) {
			mainContent.style.width = `calc(100% - ${width}px)`;
			mainContent.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
		}
	}
}

/**
 * Collapse/Expand Sidebar (for mobile)
 */
function toggleSidebar() {
	const sidebar = document.querySelector('.body-sidebar');
	if (sidebar) {
		sidebar.classList.toggle('mobile-open');
	}
}

// Export functions for use in other scripts
window.sidebarEnhancements = {
	updateSidebarWidth,
	toggleSidebar,
	highlightActiveSidebarItem,
	autoScrollToActiveItem
};

