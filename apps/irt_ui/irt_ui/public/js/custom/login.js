/**
 * Login Page JavaScript
 * - Adds class to body for CSS fallback
 * - Initializes Lottie background animation
 * - Updates logo to use custom image
 */

frappe.ready(function() {
	// Check if we're on login page
	const loginSections = document.querySelectorAll('.for-login, .for-email-login, .for-signup, .for-forgot');
	if (loginSections.length > 0) {
		document.body.classList.add('login-page');
		
		// Initialize Lottie background animation
		initLottieBackground();
		
		// Update logo if custom logo exists
		updateLogo();
	}
});

/**
 * Initialize Lottie background animation
 */
function initLottieBackground() {
	// Check if Lottie is already loaded
	if (typeof lottie === 'undefined') {
		// Load Lottie library from CDN
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
		script.onload = function() {
			loadLottieAnimation();
		};
		document.head.appendChild(script);
	} else {
		loadLottieAnimation();
	}
}

/**
 * Load and play Lottie animation
 */
function loadLottieAnimation() {
	// Create container for Lottie animation
	const container = document.createElement('div');
	container.id = 'lottie-background';
	document.body.appendChild(container);
	
	// Load animation from JSON file
	const animationPath = '/assets/irt_ui/images/backGround.json';
	
	lottie.loadAnimation({
		container: container,
		renderer: 'svg',
		loop: true,
		autoplay: true,
		path: animationPath
	}).catch(function(error) {
		console.warn('Lottie animation failed to load:', error);
		// Fallback: remove container if animation fails
		if (container.parentNode) {
			container.parentNode.removeChild(container);
		}
	});
}

/**
 * Update logo to use custom logo image
 */
function updateLogo() {
	const logoImg = document.querySelector('.page-card-head .app-logo');
	if (logoImg) {
		// Check if custom logo exists
		const customLogoPath = '/assets/irt_ui/images/logo.png';
		
		// Test if image exists by creating a new image element
		const testImg = new Image();
		testImg.onload = function() {
			logoImg.src = customLogoPath;
			logoImg.alt = 'IRT Logo';
		};
		testImg.onerror = function() {
			// Keep default logo if custom logo doesn't exist
			console.log('Custom logo not found, using default logo');
		};
		testImg.src = customLogoPath;
	}
}
