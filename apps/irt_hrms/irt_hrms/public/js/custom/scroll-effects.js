/**
 * Scroll Effects and Header Movement
 *
 * Adds smooth scroll effects and header movement on scroll
 */

frappe.ready(function() {
	initScrollEffects();
	initHeaderMovement();
	initSmoothAnimations();
});

/**
 * Initialize Scroll Effects
 */
function initScrollEffects() {
	let lastScrollTop = 0;
	const navbar = document.querySelector('.navbar, .navbar-default');
	const pageHead = document.querySelector('.page-head');

	if (!navbar && !pageHead) return;

	window.addEventListener('scroll', function() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		// Navbar scroll effect
		if (navbar) {
			if (scrollTop > 10) {
				navbar.classList.add('scrolled');
			} else {
				navbar.classList.remove('scrolled');
			}
		}

		// Page head scroll effect
		if (pageHead) {
			if (scrollTop > 50) {
				pageHead.classList.add('scrolled');
			} else {
				pageHead.classList.remove('scrolled');
			}
		}

		lastScrollTop = scrollTop;
	}, false);
}

/**
 * Initialize Header Movement on Scroll
 */
function initHeaderMovement() {
	const pageHead = document.querySelector('.page-head');
	if (!pageHead) return;

	let lastScrollTop = 0;
	let ticking = false;

	window.addEventListener('scroll', function() {
		if (!ticking) {
			window.requestAnimationFrame(function() {
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

				if (scrollTop > lastScrollTop && scrollTop > 100) {
					// Scrolling down - hide header
					pageHead.style.transform = 'translateY(-100%)';
					pageHead.style.opacity = '0.9';
				} else {
					// Scrolling up - show header
					pageHead.style.transform = 'translateY(0)';
					pageHead.style.opacity = '1';
				}

				lastScrollTop = scrollTop;
				ticking = false;
			});

			ticking = true;
		}
	});

	// Add transition
	pageHead.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
}

/**
 * Initialize Smooth Animations
 */
function initSmoothAnimations() {
	// Intersection Observer for fade-in animations
	const observerOptions = {
		threshold: 0.1,
		rootMargin: '0px 0px -50px 0px'
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.style.opacity = '0';
				entry.target.style.transform = 'translateY(20px)';

				setTimeout(() => {
					entry.target.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
					entry.target.style.opacity = '1';
					entry.target.style.transform = 'translateY(0)';
				}, 50);

				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe cards and sections
	document.querySelectorAll('.card, .panel, .form-section, .workspace-card').forEach(el => {
		observer.observe(el);
	});
}

/**
 * Smooth scroll to top
 */
function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

// Export for use
window.scrollEffects = {
	scrollToTop,
	initScrollEffects,
	initHeaderMovement
};

