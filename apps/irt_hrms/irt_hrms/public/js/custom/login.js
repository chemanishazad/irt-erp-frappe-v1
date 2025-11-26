/**
 * Custom Login Page JavaScript
 *
 * This file contains custom JavaScript functionality for the login page.
 * Changes made:
 * - Eye icon toggle for password visibility
 * - Removed forgot password and email login handlers
 * - Enhanced user experience improvements
 *
 * Last Updated: 2024
 */

frappe.ready(function() {
	// Initialize password visibility toggle with eye icon
	initPasswordToggle();

	// Remove hash change handlers for forgot password and email login
	removeUnwantedHandlers();
});

/**
 * Initialize password visibility toggle with eye icon
 */
function initPasswordToggle() {
	const passwordField = document.getElementById('login_password');
	if (!passwordField) return;

	const passwordContainer = passwordField.closest('.password-field');
	if (!passwordContainer) return;

	// Remove existing toggle if any
	const existingToggle = passwordContainer.querySelector('.toggle-password');
	if (existingToggle) {
		existingToggle.remove();
	}

	// Create eye icon toggle button with standard eye icons
	const eyeToggle = document.createElement('button');
	eyeToggle.type = 'button';
	eyeToggle.className = 'toggle-password';
	eyeToggle.setAttribute('aria-label', 'Show password');
	eyeToggle.setAttribute('aria-pressed', 'false');

	// Standard eye icon (show password) - Clean and simple
	const eyeShowIcon = `
		<svg class="eye-icon eye-show" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	`;

	// Standard eye-off icon (hide password) - Clean and simple
	const eyeHideIcon = `
		<svg class="eye-icon eye-hide" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
			<path d="M17.94 17.94A13.07 13.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	`;

	eyeToggle.innerHTML = eyeShowIcon + eyeHideIcon;

	// Add toggle functionality
	eyeToggle.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();

		const isPassword = passwordField.getAttribute('type') === 'password';
		const newType = isPassword ? 'text' : 'password';

		passwordField.setAttribute('type', newType);

		// Toggle icon visibility and ARIA attributes
		const showIcon = eyeToggle.querySelector('.eye-show');
		const hideIcon = eyeToggle.querySelector('.eye-hide');

		if (newType === 'text') {
			// Password is now visible - show hide icon
			showIcon.style.display = 'none';
			hideIcon.style.display = 'block';
			eyeToggle.classList.add('active');
			eyeToggle.setAttribute('aria-label', 'Hide password');
			eyeToggle.setAttribute('aria-pressed', 'true');
		} else {
			// Password is now hidden - show show icon
			showIcon.style.display = 'block';
			hideIcon.style.display = 'none';
			eyeToggle.classList.remove('active');
			eyeToggle.setAttribute('aria-label', 'Show password');
			eyeToggle.setAttribute('aria-pressed', 'false');
		}

		// Keep focus on password field after toggle
		setTimeout(() => {
			passwordField.focus();
		}, 10);
	});

	// Append toggle to password container
	passwordContainer.appendChild(eyeToggle);
}

/**
 * Remove unwanted hash change handlers for forgot password and email login
 */
function removeUnwantedHandlers() {
	// Override login.route to prevent navigation to unwanted sections
	if (window.login && window.login.route) {
		const originalRoute = window.login.route;
		window.login.route = function() {
			const route = window.location.hash.slice(1);

			// Block unwanted routes
			if (route === 'forgot' || route === 'login-with-email-link' || route === 'signup') {
				window.location.hash = 'login';
				return;
			}

			// Only allow login route
			if (!route || route === 'login') {
				window.location.hash = 'login';
				if (window.login.login) {
					window.login.login();
				}
				return;
			}

			// Call original route handler for other routes
			return originalRoute.apply(this, arguments);
		};
	}

	// Remove forgot password and signup functions if they exist
	if (window.login) {
		window.login.forgot = function() {
			window.location.hash = 'login';
			if (window.login.login) {
				window.login.login();
			}
		};

		window.login.signup = function() {
			window.location.hash = 'login';
			if (window.login.login) {
				window.login.login();
			}
		};

		window.login.login_with_email_link = function() {
			window.location.hash = 'login';
			if (window.login.login) {
				window.login.login();
			}
		};
	}
}

