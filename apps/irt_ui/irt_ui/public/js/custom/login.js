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
		
		// Replace Show/Hide text with eye icon - run immediately and after delays
		replacePasswordToggle();
		
		// Run multiple times to catch elements added at different times
		setTimeout(function() {
			replacePasswordToggle();
		}, 100);
		
		setTimeout(function() {
			replacePasswordToggle();
		}, 300);
		
		setTimeout(function() {
			replacePasswordToggle();
		}, 600);
		
		// Use MutationObserver to watch for dynamically added toggle buttons and text changes
		observePasswordToggles();
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
	
	const animation = lottie.loadAnimation({
		container: container,
		renderer: 'svg',
		loop: true,
		autoplay: true,
		path: animationPath
	});
	
	// Ensure animation fills the container
	animation.addEventListener('data_ready', function() {
		const svg = container.querySelector('svg');
		if (svg) {
			svg.setAttribute('width', '100%');
			svg.setAttribute('height', '100%');
			svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
		}
	});
	
	animation.addEventListener('DOMLoaded', function() {
		const svg = container.querySelector('svg');
		if (svg) {
			svg.style.width = '100%';
			svg.style.height = '100%';
			svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
		}
	});
	
	animation.addEventListener('error', function(error) {
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

/**
 * Replace Show/Hide text with eye icon
 */
function replacePasswordToggle() {
	const toggleButtons = document.querySelectorAll('.toggle-password');
	
	toggleButtons.forEach(function(toggle) {
		// Check if already processed
		if (toggle.dataset.processed === 'true') {
			// Re-apply icons if text was changed back by Frappe
			if (toggle.textContent && toggle.textContent.trim() && !toggle.querySelector('.eye-icon')) {
				toggle.dataset.processed = 'false';
			} else {
				return;
			}
		}
		
		// Get the input element
		const toggleAttr = toggle.getAttribute('toggle');
		const input = toggleAttr ? document.querySelector(toggleAttr) : null;
		
		if (!input) {
			return;
		}
		
		// Create eye icon SVG (show password - visible when password is hidden)
		const eyeIcon = `
			<svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
		
		// Create eye-off icon SVG (hide password - visible when password is shown)
		const eyeOffIcon = `
			<svg class="eye-off-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		`;
		
		// Clear any existing text content and replace with icons only
		toggle.textContent = '';
		toggle.innerHTML = eyeIcon + eyeOffIcon;
		toggle.setAttribute('aria-label', 'Show password');
		toggle.setAttribute('title', 'Show password');
		toggle.dataset.processed = 'true';
		
		// Set initial state based on input type
		updateToggleState(toggle, input);
		
		// Remove Frappe's default click handler using jQuery if available
		if (typeof $ !== 'undefined') {
			$(toggle).off('click');
		}
		
		// Define click handler function
		function handleToggleClick(e) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			
			// Toggle password visibility
			if (input.type === 'password') {
				input.type = 'text';
			} else {
				input.type = 'password';
			}
			
			// Update toggle state and ensure icons stay
			updateToggleState(toggle, input);
			
			// Prevent Frappe from changing text back
			if (typeof $ !== 'undefined') {
				$(toggle).off('click');
			}
			
			// Focus back on input
			setTimeout(function() {
				input.focus();
			}, 10);
		}
		
		// Add our click handler - use capture phase to run before Frappe's handler
		toggle.addEventListener('click', handleToggleClick, true);
	});
}

/**
 * Observe DOM for dynamically added password toggle buttons and text changes
 */
function observePasswordToggles() {
	const observer = new MutationObserver(function(mutations) {
		let shouldReplace = false;
		mutations.forEach(function(mutation) {
			// Check for newly added nodes
			if (mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach(function(node) {
					if (node.nodeType === 1) { // Element node
						if (node.classList && node.classList.contains('toggle-password')) {
							shouldReplace = true;
						} else if (node.querySelectorAll) {
							const toggles = node.querySelectorAll('.toggle-password');
							if (toggles.length > 0) {
								shouldReplace = true;
							}
						}
					}
				});
			}
			
			// Check if text content changed (Frappe might be updating it)
			if (mutation.type === 'childList' || mutation.type === 'characterData') {
				const target = mutation.target;
				if (target && target.classList && target.classList.contains('toggle-password')) {
					const textContent = target.textContent ? target.textContent.trim() : '';
					const hasIcons = target.querySelector('.eye-icon');
					// If there's text but no icons, Frappe changed it back
					if (textContent && (textContent === 'Show' || textContent === 'Hide') && !hasIcons) {
						shouldReplace = true;
					}
				}
			}
		});
		
		if (shouldReplace) {
			setTimeout(function() {
				replacePasswordToggle();
			}, 10);
		}
	});
	
	// Observe the document body for changes
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
		attributes: false
	});
}

/**
 * Update toggle button state and accessibility attributes
 */
function updateToggleState(toggle, input) {
	// Ensure icons are present
	if (!toggle.querySelector('.eye-icon')) {
		const eyeIcon = `
			<svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
		const eyeOffIcon = `
			<svg class="eye-off-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		`;
		toggle.textContent = '';
		toggle.innerHTML = eyeIcon + eyeOffIcon;
	}
	
	if (input.type === 'password') {
		// Password is hidden - show eye icon
		toggle.classList.remove('password-visible');
		toggle.setAttribute('aria-label', 'Show password');
		toggle.setAttribute('title', 'Show password');
	} else {
		// Password is visible - show eye-off icon
		toggle.classList.add('password-visible');
		toggle.setAttribute('aria-label', 'Hide password');
		toggle.setAttribute('title', 'Hide password');
	}
}
