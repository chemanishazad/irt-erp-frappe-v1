/**
 * Modern UI Enhancements
 *
 * JavaScript for enhanced UI interactions and functionality
 * Makes the application feel modern and responsive
 */

frappe.ready(function() {
	// Initialize all modern UI enhancements
	initModernUI();
	initAnimations();
	initEnhancedInteractions();
	initFormEnhancements();
	initTableEnhancements();
});

/**
 * Initialize Modern UI Features
 */
function initModernUI() {
	// Add fade-in animation to cards
	document.querySelectorAll('.card, .panel, .workspace-card').forEach((card, index) => {
		card.style.opacity = '0';
		card.style.transform = 'translateY(20px)';
		setTimeout(() => {
			card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
			card.style.opacity = '1';
			card.style.transform = 'translateY(0)';
		}, index * 50);
	});

	// Add ripple effect to buttons
	document.querySelectorAll('.btn').forEach(button => {
		button.addEventListener('click', function(e) {
			const ripple = document.createElement('span');
			const rect = this.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height);
			const x = e.clientX - rect.left - size / 2;
			const y = e.clientY - rect.top - size / 2;

			ripple.style.width = ripple.style.height = size + 'px';
			ripple.style.left = x + 'px';
			ripple.style.top = y + 'px';
			ripple.classList.add('ripple');

			this.appendChild(ripple);

			setTimeout(() => ripple.remove(), 600);
		});
	});

	// Add CSS for ripple effect
	if (!document.getElementById('ripple-style')) {
		const style = document.createElement('style');
		style.id = 'ripple-style';
		style.textContent = `
			.btn {
				position: relative;
				overflow: hidden;
			}
			.btn .ripple {
				position: absolute;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.6);
				transform: scale(0);
				animation: ripple-animation 0.6s ease-out;
				pointer-events: none;
			}
			@keyframes ripple-animation {
				to {
					transform: scale(4);
					opacity: 0;
				}
			}
		`;
		document.head.appendChild(style);
	}
}

/**
 * Initialize Smooth Animations
 */
function initAnimations() {
	// Intersection Observer for scroll animations
	const observerOptions = {
		threshold: 0.1,
		rootMargin: '0px 0px -50px 0px'
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('fade-in');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe all cards and sections
	document.querySelectorAll('.card, .panel, .form-section, .workspace-card').forEach(el => {
		observer.observe(el);
	});
}

/**
 * Initialize Enhanced Interactions
 */
function initEnhancedInteractions() {
	// Enhanced form field focus
	document.querySelectorAll('.form-control, .control-input, input, select, textarea').forEach(field => {
		field.addEventListener('focus', function() {
			this.parentElement.classList.add('field-focused');
		});

		field.addEventListener('blur', function() {
			this.parentElement.classList.remove('field-focused');
		});
	});

	// Add floating label effect
	document.querySelectorAll('.form-group').forEach(group => {
		const input = group.querySelector('input, select, textarea');
		const label = group.querySelector('label');

		if (input && label) {
			input.addEventListener('focus', () => {
				label.style.transform = 'translateY(-20px) scale(0.85)';
				label.style.color = 'var(--primary-500)';
			});

			input.addEventListener('blur', () => {
				if (!input.value) {
					label.style.transform = '';
					label.style.color = '';
				}
			});

			if (input.value) {
				label.style.transform = 'translateY(-20px) scale(0.85)';
			}
		}
	});

	// Enhanced table row interactions
	document.querySelectorAll('.table tbody tr, .list-row').forEach(row => {
		row.addEventListener('mouseenter', function() {
			this.style.transition = 'all 0.2s ease';
		});
	});
}

/**
 * Initialize Form Enhancements
 */
function initFormEnhancements() {
	// Auto-resize textareas
	document.querySelectorAll('textarea').forEach(textarea => {
		textarea.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = this.scrollHeight + 'px';
		});
	});

	// Enhanced file upload
	document.querySelectorAll('input[type="file"]').forEach(input => {
		input.addEventListener('change', function() {
			const fileName = this.files[0]?.name;
			if (fileName) {
				const label = this.parentElement.querySelector('.file-name') ||
					document.createElement('span');
				label.className = 'file-name';
				label.textContent = fileName;
				label.style.marginLeft = '10px';
				label.style.color = 'var(--primary-600)';
				label.style.fontWeight = '500';
				if (!this.parentElement.querySelector('.file-name')) {
					this.parentElement.appendChild(label);
				}
			}
		});
	});

	// Form validation styling
	document.querySelectorAll('form').forEach(form => {
		form.addEventListener('submit', function(e) {
			const invalidFields = form.querySelectorAll(':invalid');
			invalidFields.forEach(field => {
				field.classList.add('invalid-field');
				field.addEventListener('input', function() {
					if (this.validity.valid) {
						this.classList.remove('invalid-field');
					}
				});
			});
		});
	});
}

/**
 * Initialize Table Enhancements
 */
function initTableEnhancements() {
	// Add sort indicators
	document.querySelectorAll('.table thead th').forEach(header => {
		if (header.style.cursor === 'pointer' || header.onclick) {
			header.style.position = 'relative';
			header.style.paddingRight = '30px';

			const indicator = document.createElement('span');
			indicator.className = 'sort-indicator';
			indicator.innerHTML = '⇅';
			indicator.style.position = 'absolute';
			indicator.style.right = '10px';
			indicator.style.opacity = '0.5';
			indicator.style.transition = 'opacity 0.2s';

			header.appendChild(indicator);

			header.addEventListener('mouseenter', () => {
				indicator.style.opacity = '1';
			});

			header.addEventListener('mouseleave', () => {
				indicator.style.opacity = '0.5';
			});
		}
	});

	// Enhanced row selection
	document.querySelectorAll('.table tbody tr').forEach(row => {
		row.addEventListener('click', function(e) {
			if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
				this.classList.toggle('row-selected');
			}
		});
	});
}

/**
 * Add loading state to buttons
 */
function addLoadingState(button, text = 'Loading...') {
	const originalText = button.textContent;
	button.disabled = true;
	button.innerHTML = `
		<span class="spinner-border spinner-border-sm me-2" role="status"></span>
		${text}
	`;
	return () => {
		button.disabled = false;
		button.textContent = originalText;
	};
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 16px 24px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0,0,0,0.2);
		z-index: 10000;
		animation: slideIn 0.3s ease-out;
		border-left: 4px solid var(--primary-500);
	`;

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.style.animation = 'fadeOut 0.3s ease-out';
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

// Export functions for use in other scripts
window.modernUI = {
	addLoadingState,
	showToast,
	initModernUI,
	initAnimations
};

