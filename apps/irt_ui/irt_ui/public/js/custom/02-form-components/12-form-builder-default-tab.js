/**
 * Form Builder - Tab Management
 * 1. Ensure "Add tab" button is always visible
 * 2. Move remove button to right end of each tab
 * 3. Add edit button next to remove button
 */

(function() {
	'use strict';

	console.log('[Default Tab] Script loaded');

	function setupTabs(store) {
		if (!store) return;

		// Find tabs in both locations
		const tabs = document.querySelectorAll('.tab-header .tabs .tab, .tabs .tab');
		
		if (tabs.length === 0) {
			console.log('[Default Tab] No tabs found');
			return;
		}

		console.log(`[Default Tab] Found ${tabs.length} tabs`);
		
		tabs.forEach((tab, index) => {
			// Find tab label to get tab data
			const tabLabel = tab.querySelector('.editable-input, [contenteditable="true"]');
			if (!tabLabel) {
				console.log(`[Default Tab] Tab ${index} has no label`);
				return;
			}
			
			const tabText = (tabLabel.textContent || '').trim();
			const matchingTab = store.form.layout.tabs.find(t => 
				(t.df.label || '').trim() === tabText
			);
			
			if (!matchingTab) {
				console.log(`[Default Tab] Tab "${tabText}" not found in store`);
				return;
			}

			// Find existing remove button created by Vue
			let removeBtn = tab.querySelector('.remove-tab-btn');
			
			// Create actions container at right end if missing
			let tabActions = tab.querySelector('.tab-item-actions');
			if (!tabActions) {
				tabActions = document.createElement('div');
				tabActions.className = 'tab-item-actions';
				tab.appendChild(tabActions);
			}

			// If remove button exists but not in actions container, move it
			if (removeBtn && !tabActions.contains(removeBtn)) {
				// Clone the button to preserve Vue's event handlers
				const clonedBtn = removeBtn.cloneNode(true);
				clonedBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
					// Trigger original button's click
					removeBtn.click();
				});
				tabActions.appendChild(clonedBtn);
				removeBtn = clonedBtn;
			} else if (!removeBtn) {
				// Create remove button if Vue hasn't created it yet
				removeBtn = document.createElement('button');
				removeBtn.className = 'remove-tab-btn btn btn-xs';
				removeBtn.title = __('Remove tab');
				removeBtn.innerHTML = frappe.utils.icon('remove', 'xs') || '✕';
				removeBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
					if (store.remove_tab) {
						store.remove_tab(matchingTab, e);
					}
				});
				tabActions.appendChild(removeBtn);
			}

			// Create edit button if missing
			let editBtn = tabActions.querySelector('.edit-tab-btn');
			if (!editBtn) {
				editBtn = document.createElement('button');
				editBtn.className = 'edit-tab-btn btn btn-xs';
				editBtn.title = __('Edit tab properties');
				editBtn.innerHTML = frappe.utils.icon('edit', 'xs') || '✏️';
				editBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
					// Select the tab field to open properties
					store.form.selected_field = matchingTab.df;
					// Force Vue to update
					if (store.$forceUpdate) {
						store.$forceUpdate();
					}
				});
				tabActions.insertBefore(editBtn, removeBtn);
			}

			// Position tab and actions container
			tab.style.position = 'relative';
			tab.style.paddingRight = '60px';
			
			// Position actions at ABSOLUTE right end
			tabActions.style.cssText = `
				position: absolute !important;
				right: 4px !important;
				top: 50% !important;
				transform: translateY(-50%) !important;
				display: flex !important;
				align-items: center !important;
				gap: 4px !important;
				z-index: 10 !important;
				margin: 0 !important;
				padding: 0 !important;
			`;

			// FORCE remove button to be visible (override Frappe's display: none)
			removeBtn.style.cssText = `
				display: flex !important;
				visibility: visible !important;
				opacity: 0.6 !important;
				padding: 2px 4px !important;
				min-width: 20px !important;
				min-height: 20px !important;
				align-items: center !important;
				justify-content: center !important;
				cursor: pointer !important;
				position: relative !important;
				right: auto !important;
				background: transparent !important;
				border: none !important;
			`;
			
			removeBtn.hidden = false;
			removeBtn.removeAttribute('hidden');
			removeBtn.removeAttribute('style'); // Remove inline style that might hide it
			// Reapply our styles
			removeBtn.style.cssText = `
				display: flex !important;
				visibility: visible !important;
				opacity: 0.6 !important;
				padding: 2px 4px !important;
				min-width: 20px !important;
				min-height: 20px !important;
				align-items: center !important;
				justify-content: center !important;
				cursor: pointer !important;
				position: relative !important;
				right: auto !important;
				background: transparent !important;
				border: none !important;
			`;

			// Ensure edit button is visible
			editBtn.style.cssText = `
				display: flex !important;
				visibility: visible !important;
				opacity: 0.6 !important;
				padding: 2px 4px !important;
				min-width: 20px !important;
				min-height: 20px !important;
				align-items: center !important;
				justify-content: center !important;
				cursor: pointer !important;
				background: transparent !important;
				border: none !important;
			`;
			
			// Hover effects
			editBtn.addEventListener('mouseenter', function() {
				this.style.opacity = '1';
			});
			editBtn.addEventListener('mouseleave', function() {
				this.style.opacity = '0.6';
			});
			
			removeBtn.addEventListener('mouseenter', function() {
				this.style.opacity = '1';
				this.style.background = 'rgba(229, 62, 62, 0.1)';
			});
			removeBtn.addEventListener('mouseleave', function() {
				this.style.opacity = '0.6';
				this.style.background = 'transparent';
			});
			
			console.log(`[Default Tab] Tab "${tabText}" buttons setup complete`);
		});
	}

	function ensureAddTabButton() {
		const formBuilder = window.frappe?.form_builder;
		const store = formBuilder?.store;

		if (!store) {
			setTimeout(ensureAddTabButton, 500);
			return;
		}

		const formMain = document.querySelector('.form-main');
		if (!formMain) {
			setTimeout(ensureAddTabButton, 500);
			return;
		}

		const tabCount = store.form?.layout?.tabs?.length || 0;
		const isReadOnly = store.read_only;
		const isTable = store.doc?.istable;

		// ALWAYS ensure "Add tab" button is visible (for 1 tab case)
		const sidebarContainer = document.querySelector('.sidebar-container');
		if (sidebarContainer && tabCount === 1 && !isReadOnly && !isTable) {
			// Check default-state first (when no field selected)
			const defaultState = sidebarContainer.querySelector('.default-state');
			if (defaultState) {
				let sidebarActions = defaultState.querySelector('.actions');
				let sidebarBtn = defaultState.querySelector('.new-tab-btn');
				
				// Create actions container if missing
				if (!sidebarActions) {
					sidebarActions = document.createElement('div');
					sidebarActions.className = 'actions';
					const emptyState = defaultState.querySelector('.empty-state');
					if (emptyState) {
						defaultState.insertBefore(sidebarActions, emptyState);
					} else {
						defaultState.appendChild(sidebarActions);
					}
				}
				
				// Create button if missing
				if (!sidebarBtn) {
					sidebarBtn = document.createElement('button');
					sidebarBtn.className = 'new-tab-btn btn btn-default btn-xs';
					sidebarBtn.title = __('Add new tab');
					sidebarBtn.textContent = __('Add tab');
					sidebarBtn.addEventListener('click', function(e) {
						e.stopPropagation();
						e.preventDefault();
						if (store.add_new_tab) {
							store.add_new_tab();
						}
					});
					sidebarActions.appendChild(sidebarBtn);
				}
				
				// FORCE visibility
				sidebarActions.style.display = 'block';
				sidebarActions.style.visibility = 'visible';
				sidebarActions.hidden = false;
				sidebarBtn.style.display = '';
				sidebarBtn.style.visibility = 'visible';
				sidebarBtn.hidden = false;
			}
			
			// ALSO add to header so it's visible even when field is selected
			const header = sidebarContainer.querySelector('.header');
			if (header) {
				let headerBtn = header.querySelector('.new-tab-btn');
				if (!headerBtn) {
					headerBtn = document.createElement('button');
					headerBtn.className = 'new-tab-btn btn btn-default btn-xs';
					headerBtn.title = __('Add new tab');
					headerBtn.textContent = __('Add tab');
					headerBtn.style.cssText = 'margin-left: 8px;';
					headerBtn.addEventListener('click', function(e) {
						e.stopPropagation();
						e.preventDefault();
						if (store.add_new_tab) {
							store.add_new_tab();
						}
					});
					const searchBox = header.querySelector('.search-box');
					if (searchBox) {
						header.insertBefore(headerBtn, searchBox);
					} else {
						header.appendChild(headerBtn);
					}
				}
				headerBtn.style.display = '';
				headerBtn.style.visibility = 'visible';
				headerBtn.hidden = false;
			}
		}

		// Check tab-header button (shown when 2+ tabs)
		const tabHeader = document.querySelector('.tab-header');
		if (tabHeader) {
			const tabActions = tabHeader.querySelector('.tab-actions');
			const tabHeaderBtn = tabHeader.querySelector('.new-tab-btn');
			
			if (tabActions) {
				tabActions.style.display = '';
				tabActions.style.visibility = '';
				tabActions.hidden = false;
				tabActions.removeAttribute('hidden');
			}
			
			if (tabHeaderBtn) {
				tabHeaderBtn.style.display = '';
				tabHeaderBtn.style.visibility = 'visible';
				tabHeaderBtn.hidden = false;
				tabHeaderBtn.removeAttribute('hidden');
				console.log('[Default Tab] Found tab-header button, making visible');
			}
		} else {
			console.log('[Default Tab] Tab-header not found (normal for 1 tab)');
		}
	}

	function init() {
		const formBuilder = window.frappe?.form_builder;
		const store = formBuilder?.store;

		if (!store) {
			setTimeout(init, 500);
			return;
		}

		ensureAddTabButton();
		setupTabs(store);
		
		// Watch for DOM changes to handle Vue re-renders
		const tabHeader = document.querySelector('.tab-header');
		const tabsContainer = document.querySelector('.tab-header .tabs, .tabs');
		
		if (tabHeader || tabsContainer) {
			const observer = new MutationObserver(function(mutations) {
				let shouldUpdate = false;
				mutations.forEach(function(mutation) {
					if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
						// Check if tabs were added
						for (let node of mutation.addedNodes) {
							if (node.nodeType === 1 && (node.classList.contains('tab') || node.querySelector('.tab'))) {
								shouldUpdate = true;
								break;
							}
						}
					}
					// Also check for attribute changes that might hide buttons
					if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
						const target = mutation.target;
						if (target && target.classList && target.classList.contains('remove-tab-btn')) {
							shouldUpdate = true;
						}
					}
				});
				
				if (shouldUpdate) {
					setTimeout(() => {
						ensureAddTabButton();
						setupTabs(store);
					}, 100);
				}
			});
			
			// Observe tab container for changes
			if (tabHeader) {
				observer.observe(tabHeader, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['style', 'hidden', 'class']
				});
			}
			if (tabsContainer) {
				observer.observe(tabsContainer, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['style', 'hidden', 'class']
				});
			}
		}
	}

	// Run more frequently to catch Vue rendering
	setInterval(() => {
		const store = window.frappe?.form_builder?.store;
		if (store) {
			ensureAddTabButton();
			setupTabs(store);
		}
	}, 300);

	// Also run on load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.addEventListener('load', init);
	setTimeout(init, 500);
	setTimeout(init, 1500);
	setTimeout(init, 3000);
})();
