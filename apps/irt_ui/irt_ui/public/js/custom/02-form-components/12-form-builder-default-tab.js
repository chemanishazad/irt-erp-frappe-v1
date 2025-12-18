/**
 * Form Builder - Add Default Tab Functionality
 * Ensures single "Add tab" button at right end
 * Adds Edit and Close buttons at right end of each tab
 */

(function() {
	'use strict';

	let isInitialized = false;
	let checkInterval = null;

	console.log('[Default Tab] Script loaded');

	/**
	 * Initialize the default tab functionality
	 */
	function initDefaultTabFeature() {
		if (isInitialized) return;

		console.log('[Default Tab] Starting initialization...');

		if (checkInterval) {
			clearInterval(checkInterval);
		}

		checkInterval = setInterval(() => {
			const formBuilder = window.frappe?.form_builder;
			const store = formBuilder?.store;

			if (store) {
				console.log('[Default Tab] Form builder store found!');
				clearInterval(checkInterval);
				setupDefaultTabFeature(store);
				isInitialized = true;
			}
		}, 500);

		setTimeout(() => {
			if (checkInterval) {
				clearInterval(checkInterval);
			}
		}, 20000);
	}

	/**
	 * Setup the default tab feature
	 */
	function setupDefaultTabFeature(store) {
		console.log('[Default Tab] Setting up features...');

		if (!store) {
			console.error('[Default Tab] Store not available');
			return;
		}

		// Extend the add_new_tab function
		const originalAddNewTab = store.add_new_tab;
		if (originalAddNewTab) {
			store.add_new_tab = function(setAsDefault = false) {
				console.log('[Default Tab] add_new_tab called, setAsDefault:', setAsDefault);
				
				// Remove duplicates BEFORE adding tab
				removeDuplicateAddTabButtons();
				
				originalAddNewTab.call(this);
				const tabs = this.form.layout.tabs;
				const newTab = tabs[tabs.length - 1];
				
				if (setAsDefault && newTab) {
					setDefaultTab(newTab.df.name, store);
					frappe.show_alert({
						message: __('Tab added and set as default'),
						indicator: 'green'
					});
				}
				
				// IMMEDIATE cleanup - don't wait
				removeDuplicateAddTabButtons();
				
				// Multiple cleanup passes to catch Vue's delayed rendering
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 50);
				
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 150);
				
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 300);
				
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 600);
			};
		}

		// Initial setup
		cleanupAndSetupButtons(store);

		// Watch for changes
		watchForChanges(store);

		// Setup properties panel
		setupPropertiesPanel(store);

		// Apply default tab on form load
		applyDefaultTab(store);
	}

	/**
	 * Clean up and setup buttons properly
	 */
	function cleanupAndSetupButtons(store) {
		// Remove ALL duplicate "Add tab" buttons first
		removeDuplicateAddTabButtons();

		// Ensure single "Add tab" button at right end
		ensureSingleAddTabButton(store);

		// Add Edit and Close buttons to tabs
		addEditCloseButtonsToTabs(store);
	}

	/**
	 * Remove all duplicate "Add tab" buttons - AGGRESSIVE CLEANUP
	 */
	function removeDuplicateAddTabButtons() {
		console.log('[Default Tab] Cleaning up duplicate buttons...');
		
		// Find ALL "Add tab" buttons everywhere
		const allAddTabButtons = document.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
		console.log('[Default Tab] Found', allAddTabButtons.length, 'Add tab buttons');
		
		// Find the tab-header and tab-actions
		const tabHeader = document.querySelector('.tab-header');
		const tabActions = tabHeader?.querySelector('.tab-actions');
		
		// If tab-actions exists, keep ONLY the first button there, remove ALL others
		if (tabActions) {
			const buttonsInActions = tabActions.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
			console.log('[Default Tab] Found', buttonsInActions.length, 'buttons in tab-actions');
			
			// Remove ALL except the first one
			for (let i = buttonsInActions.length - 1; i > 0; i--) {
				console.log('[Default Tab] Removing duplicate button', i);
				buttonsInActions[i].remove();
			}
		}

		// Remove ALL buttons that are NOT in tab-actions
		allAddTabButtons.forEach((btn) => {
			const parent = btn.closest('.tab-actions');
			if (!parent) {
				// Not in tab-actions, REMOVE IT
				console.log('[Default Tab] Removing button outside tab-actions');
				btn.remove();
			} else {
				// In tab-actions, check if it's a duplicate
				const siblings = parent.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
				if (siblings.length > 1) {
					// Keep only the first, remove others
					const firstBtn = siblings[0];
					if (btn !== firstBtn) {
						console.log('[Default Tab] Removing duplicate in tab-actions');
						btn.remove();
					}
				}
			}
		});

		// Final check - ensure only ONE button exists
		const remainingButtons = document.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
		console.log('[Default Tab] After cleanup,', remainingButtons.length, 'buttons remain');
		
		if (remainingButtons.length > 1) {
			// Still duplicates, remove all except first in tab-actions
			const tabActionsFinal = document.querySelector('.tab-header .tab-actions');
			if (tabActionsFinal) {
				const finalButtons = tabActionsFinal.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
				for (let i = finalButtons.length - 1; i > 0; i--) {
					finalButtons[i].remove();
				}
			}
		}
	}

	/**
	 * Ensure single "Add tab" button at right end
	 */
	function ensureSingleAddTabButton(store) {
		const formMain = document.querySelector('.form-main, .form-builder-container .form-container .form-main');
		if (!formMain) return;

		// Find or create tab-header
		let tabHeader = formMain.querySelector('.tab-header');
		
		if (!tabHeader) {
			tabHeader = document.createElement('div');
			tabHeader.className = 'tab-header';
			tabHeader.style.cssText = `
				display: flex !important;
				justify-content: space-between !important;
				align-items: center !important;
				min-height: 42px !important;
				background-color: var(--fg-color) !important;
				border-bottom: 1px solid var(--border-color) !important;
				padding-left: var(--padding-xs) !important;
			`;

			const tabContents = formMain.querySelector('.tab-contents');
			if (tabContents) {
				tabContents.insertAdjacentElement('beforebegin', tabHeader);
			} else {
				formMain.insertBefore(tabHeader, formMain.firstChild);
			}
		}

		// Find or create tab-actions at right end
		let tabActions = tabHeader.querySelector('.tab-actions');
		
		if (!tabActions) {
			tabActions = document.createElement('div');
			tabActions.className = 'tab-actions';
			tabHeader.appendChild(tabActions);
		}

		// Ensure tab-actions is at right end
		tabActions.style.cssText = `
			display: flex !important;
			align-items: center !important;
			gap: 4px !important;
			margin-left: auto !important;
			margin-right: 20px !important;
		`;

		// Check for existing "Add tab" button
		let addTabButton = tabActions.querySelector('.new-tab-btn');
		
		// If no button, create it
		if (!addTabButton) {
			addTabButton = document.createElement('button');
			addTabButton.className = 'new-tab-btn btn btn-xs';
			addTabButton.setAttribute('type', 'button');
			addTabButton.title = __('Add new tab (Shift+Click to set as default)');
			// Minimal styles - match Frappe default
			addTabButton.style.cssText = `
				background-color: var(--control-bg, var(--bg-gray)) !important;
				padding: 2px !important;
				margin-left: 4px !important;
				box-shadow: none !important;
			`;

			const addBtnText = document.createElement('div');
			addBtnText.className = 'add-btn-text';
			addBtnText.textContent = __('Add tab');
			addTabButton.appendChild(addBtnText);

			tabActions.appendChild(addTabButton);
		}

		// Ensure button works - replace handler to prevent duplicates
		if (!addTabButton.hasAttribute('data-handler-attached')) {
			addTabButton.setAttribute('data-handler-attached', 'true');
			
			// Remove old handlers by cloning
			const newBtn = addTabButton.cloneNode(true);
			addTabButton.parentNode.replaceChild(newBtn, addTabButton);
			addTabButton = newBtn;
			addTabButton.setAttribute('data-handler-attached', 'true');

			// Add reliable click handler
			addTabButton.addEventListener('click', function(e) {
				e.stopPropagation();
				e.preventDefault();
				
				console.log('[Default Tab] Add tab clicked, shift:', e.shiftKey);
				
				// Remove duplicates BEFORE calling add_new_tab
				removeDuplicateAddTabButtons();
				
				const currentStore = window.frappe?.form_builder?.store || store;
				if (currentStore && currentStore.add_new_tab) {
					const setAsDefault = e.shiftKey;
					currentStore.add_new_tab(setAsDefault);
					
					// Immediate cleanup after call
					setTimeout(() => {
						removeDuplicateAddTabButtons();
					}, 10);
				} else {
					console.error('[Default Tab] Store not available');
				}
			});
		}

		// Ensure tab-header is visible
		tabHeader.style.display = 'flex';
		tabHeader.style.visibility = 'visible';
		tabHeader.style.opacity = '1';
	}

	/**
	 * Add Edit and Close buttons at right end of each tab
	 * Also move existing remove-tab-btn to right end
	 */
	function addEditCloseButtonsToTabs(store) {
		function processTabs() {
			// Find tabs with multiple selectors to catch all cases
			const tabs = document.querySelectorAll('.tab-header .tab, .tabs .tab, .tab[data-label], [class*="tab"]:not(.tab-header):not(.tab-actions):not(.tab-contents)');
			
			tabs.forEach(tab => {
				// Check if this is actually a tab element (has label or is draggable)
				const hasLabel = tab.querySelector('.editable-input, [contenteditable="true"], [data-label]');
				if (!hasLabel) return;
				
				// Always process - remove old buttons first
				const oldActions = tab.querySelector('.tab-item-actions');
				if (oldActions) {
					oldActions.remove();
				}

				// AGGRESSIVELY remove ALL native remove buttons
				const allRemoveBtns = tab.querySelectorAll('.remove-tab-btn');
				allRemoveBtns.forEach(btn => {
					btn.style.display = 'none';
					btn.style.visibility = 'hidden';
					btn.style.opacity = '0';
					btn.style.position = 'absolute';
					btn.style.left = '-9999px';
					btn.style.pointerEvents = 'none';
					btn.remove();
				});

				// Find or create actions container at right end
				let tabActions = tab.querySelector('.tab-item-actions');
				
				if (!tabActions) {
					tabActions = document.createElement('div');
					tabActions.className = 'tab-item-actions';
					tab.appendChild(tabActions);
				}

				// Clear and setup actions container - minimal styles, let CSS handle it
				tabActions.innerHTML = '';
				tabActions.style.cssText = `
					display: flex !important;
					align-items: center !important;
					gap: 2px !important;
					position: absolute !important;
					right: 4px !important;
					top: 50% !important;
					transform: translateY(-50%) !important;
					z-index: 5 !important;
				`;

				// Find tab data - try multiple ways
				const tabLabel = tab.querySelector('.editable-input, [contenteditable="true"], [data-label]');
				if (!tabLabel || !store || !store.form || !store.form.layout) {
					console.log('[Default Tab] Skipping tab - no label or store');
					return;
				}

				const tabText = (tabLabel.textContent || tabLabel.getAttribute('data-label') || '').trim();
				const matchingTab = store.form.layout.tabs.find(t => {
					const label = (t.df.label || '').trim();
					return label === tabText || label.includes(tabText) || tabText.includes(label);
				});

				if (!matchingTab || !matchingTab.df) {
					console.log('[Default Tab] Skipping tab - no matching tab data for:', tabText);
					return;
				}
				
				console.log('[Default Tab] Processing tab:', matchingTab.df.label);

				// Create Edit button - clean, default style
				const editBtn = document.createElement('button');
				editBtn.className = 'edit-tab-btn btn btn-xs';
				editBtn.setAttribute('type', 'button');
				editBtn.title = __('Edit tab properties');
				editBtn.innerHTML = frappe.utils.icon('edit', 'xs') || '✏️';
				// Minimal inline styles - let CSS handle the rest
				editBtn.style.cssText = `
					padding: 2px 4px !important;
					min-width: 20px !important;
					min-height: 20px !important;
				`;

				editBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					store.form.selected_field = matchingTab.df;
					setTimeout(() => {
						ensureCloseButtonVisible();
					}, 100);
				});

				// Create Close button - ALWAYS VISIBLE
				const closeBtn = document.createElement('button');
				closeBtn.className = 'close-tab-btn btn btn-xs btn-icon';
				closeBtn.setAttribute('type', 'button');
				closeBtn.title = __('Remove tab');
				closeBtn.innerHTML = frappe.utils.icon('remove', 'xs') || '✕';
				// Minimal inline styles - let CSS handle the rest
				closeBtn.style.cssText = `
					padding: 2px 4px !important;
					min-width: 20px !important;
					min-height: 20px !important;
				`;

				closeBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
					
					console.log('[Default Tab] Close button clicked for tab:', matchingTab.df.label);
					
					// Find the original remove button
					const originalRemoveBtn = tab.querySelector('.remove-tab-btn');
					if (originalRemoveBtn) {
						// Temporarily make it visible so remove_tab function works
						const originalDisplay = originalRemoveBtn.style.display;
						const originalVisibility = originalRemoveBtn.style.visibility;
						const originalPosition = originalRemoveBtn.style.position;
						
						originalRemoveBtn.style.display = 'block';
						originalRemoveBtn.style.visibility = 'visible';
						originalRemoveBtn.style.position = 'relative';
						
						// Trigger click
						setTimeout(() => {
							originalRemoveBtn.click();
							
							// Hide it again
							originalRemoveBtn.style.display = originalDisplay || 'none';
							originalRemoveBtn.style.visibility = originalVisibility || 'hidden';
							originalRemoveBtn.style.position = originalPosition || 'absolute';
						}, 10);
					} else {
						// Fallback: manually remove using store logic
						removeTabManually(store, matchingTab);
					}
				});

				tabActions.appendChild(editBtn);
				tabActions.appendChild(closeBtn);
				
				// Ensure tab has proper positioning (CSS handles padding)
				if (!tab.style.position || tab.style.position === '') {
					tab.style.position = 'relative';
				}
				
				console.log('[Default Tab] Edit and Close buttons added for tab:', matchingTab.df.label);
			});
		}

		// Run immediately
		processTabs();

		// Watch for new tabs
		const observer = new MutationObserver(() => {
			processTabs();
		});

		const formBuilder = document.querySelector('.form-builder-container, .form-builder, .tab-header');
		if (formBuilder) {
			observer.observe(formBuilder, {
				childList: true,
				subtree: true
			});
		}

		// Also check periodically - more frequent
		setInterval(processTabs, 500);
		
		// Force process tabs after DOM changes
		const tabObserver = new MutationObserver(() => {
			processTabs();
		});
		
		const tabsContainer = document.querySelector('.tab-header, .tabs');
		if (tabsContainer) {
			tabObserver.observe(tabsContainer, {
				childList: true,
				subtree: true
			});
		}
	}

	/**
	 * Watch for changes and re-setup
	 */
	function watchForChanges(store) {
		let lastTabCount = store.form.layout.tabs?.length || 0;

		// Watch for tab count changes
		setInterval(() => {
			if (!store || !store.form || !store.form.layout) return;

			const currentTabCount = store.form.layout.tabs?.length || 0;
			if (currentTabCount !== lastTabCount) {
				console.log('[Default Tab] Tab count changed from', lastTabCount, 'to', currentTabCount);
				lastTabCount = currentTabCount;
				
				// Aggressive cleanup when tabs change
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 100);
				
				// Also cleanup after Vue renders
				setTimeout(() => {
					removeDuplicateAddTabButtons();
					cleanupAndSetupButtons(store);
				}, 500);
			}
		}, 300);

		// Also watch DOM for new buttons being added - AGGRESSIVE
		const domObserver = new MutationObserver((mutations) => {
			const allButtons = document.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
			if (allButtons.length > 1) {
				console.log('[Default Tab] Detected', allButtons.length, 'Add tab buttons, cleaning up...');
				removeDuplicateAddTabButtons();
			}
		});

		const tabHeader = document.querySelector('.tab-header');
		if (tabHeader) {
			domObserver.observe(tabHeader, {
				childList: true,
				subtree: true,
				attributes: false
			});
		}

		// Also observe the entire form builder
		const formBuilder = document.querySelector('.form-builder-container, .form-builder');
		if (formBuilder) {
			domObserver.observe(formBuilder, {
				childList: true,
				subtree: true,
				attributes: false
			});
		}

		// Periodic cleanup check
		setInterval(() => {
			const allButtons = document.querySelectorAll('.new-tab-btn, .add-tab-btn, .add-tab-default-btn');
			if (allButtons.length > 1) {
				console.log('[Default Tab] Periodic check: Found', allButtons.length, 'buttons, cleaning...');
				removeDuplicateAddTabButtons();
			}
		}, 1000);
	}

	/**
	 * Manually remove tab (fallback if original button doesn't work)
	 */
	function removeTabManually(store, tab) {
		const tabs = store.form.layout.tabs;
		const tabIndex = tabs.indexOf(tab);
		
		if (tabIndex === -1) return;
		
		// Check if tab is empty
		const isEmpty = !tab.sections.some(section => 
			section.columns.some(column => column.fields.length > 0)
		);
		
		if (isEmpty) {
			// Empty tab, remove directly
			tabs.splice(tabIndex, 1);
			if (tabs.length > 0) {
				const prevTabIndex = tabIndex > 0 ? tabIndex - 1 : 0;
				store.form.active_tab = tabs[prevTabIndex].df.name;
			}
			store.form.selected_field = null;
			store.dirty = true;
		} else {
			// Tab has content, show confirmation
			frappe.confirm(
				__('Are you sure you want to delete this tab? All sections and fields will be moved to the previous tab.'),
				() => {
					// Move sections to previous tab
					if (tabIndex > 0) {
						const prevTab = tabs[tabIndex - 1];
						prevTab.sections = [...prevTab.sections, ...tab.sections];
					}
					
					// Remove tab
					tabs.splice(tabIndex, 1);
					
					// Activate previous tab
					if (tabs.length > 0) {
						const prevTabIndex = tabIndex > 0 ? tabIndex - 1 : 0;
						store.form.active_tab = tabs[prevTabIndex].df.name;
					}
					
					store.form.selected_field = null;
					store.dirty = true;
				}
			);
		}
	}

	/**
	 * Setup properties panel
	 */
	function setupPropertiesPanel(store) {
		ensureCloseButtonVisible();

		const observer = new MutationObserver(() => {
			ensureCloseButtonVisible();
			addDefaultTabOptionToProperties(store);
		});

		const propertiesPanel = document.querySelector('.sidebar-container .control-data, .sidebar-container');
		if (propertiesPanel) {
			observer.observe(propertiesPanel, {
				childList: true,
				subtree: true
			});
		}

		const headerObserver = new MutationObserver(() => {
			ensureCloseButtonVisible();
		});

		const header = document.querySelector('.sidebar-container .header');
		if (header) {
			headerObserver.observe(header, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['style', 'class']
			});
		}

		setTimeout(() => {
			ensureCloseButtonVisible();
			addDefaultTabOptionToProperties(store);
		}, 500);
	}

	/**
	 * Ensure close button is always visible
	 */
	function ensureCloseButtonVisible() {
		const closeBtn = document.querySelector('.sidebar-container .header .close-btn');
		if (closeBtn) {
			closeBtn.style.cssText += `
				display: flex !important;
				visibility: visible !important;
				opacity: 1 !important;
				cursor: pointer !important;
				margin: 0 !important;
				padding: 6px 8px !important;
				min-width: 28px !important;
				min-height: 28px !important;
			`;
			
			if (!closeBtn.hasAttribute('data-handler-added')) {
				closeBtn.setAttribute('data-handler-added', 'true');
				closeBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					const store = window.frappe?.form_builder?.store;
					if (store) {
						store.form.selected_field = null;
					}
				});
			}
		}
	}

	/**
	 * Add default tab option to properties panel
	 */
	function addDefaultTabOptionToProperties(store) {
		if (!store) return;

		const selectedField = store.form?.selected_field;
		if (!selectedField) {
			removeDefaultTabOption();
			return;
		}

		if (selectedField.fieldtype !== 'Tab Break') {
			removeDefaultTabOption();
			return;
		}

		makeDefaultFieldWorkForTabs(selectedField, store);

		const existingOption = document.querySelector('.default-tab-option');
		if (existingOption) return;

		const controlData = document.querySelector('.sidebar-container .control-data');
		if (!controlData) return;

		const defaultField = controlData.querySelector('[data-fieldname="default"]')?.closest('.field');
		const optionsField = controlData.querySelector('[data-fieldname="options"]')?.closest('.field');
		
		let insertAfter = defaultField || optionsField;
		if (!insertAfter) {
			insertAfter = controlData.querySelector('.field:last-child');
		}

		const defaultTabOption = createDefaultTabOption(selectedField, store);
		
		if (insertAfter) {
			insertAfter.insertAdjacentElement('afterend', defaultTabOption);
		} else {
			controlData.appendChild(defaultTabOption);
		}
	}

	/**
	 * Make the existing "Default" field work for Tab Break fields
	 */
	function makeDefaultFieldWorkForTabs(selectedField, store) {
		const defaultFieldInput = document.querySelector('[data-fieldname="default"] input, [data-fieldname="default"] .form-control');
		if (!defaultFieldInput) return;

		const isDefault = isDefaultTab(selectedField.name, store);
		
		if (defaultFieldInput.tagName === 'INPUT') {
			if (defaultFieldInput.type === 'checkbox') {
				defaultFieldInput.checked = isDefault;
			} else {
				defaultFieldInput.value = isDefault ? '1' : '';
			}
		}

		const defaultField = defaultFieldInput.closest('.field');
		if (defaultField && !defaultField.querySelector('.default-tab-help')) {
			const helpText = document.createElement('div');
			helpText.className = 'help-text default-tab-help';
			helpText.textContent = __('For Tab Break: Set to 1 to make this the default tab.');
			helpText.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-top: 4px;';
			
			const helpContainer = defaultField.querySelector('.help-text')?.parentElement || defaultField;
			if (!defaultField.querySelector('.help-text')) {
				helpContainer.appendChild(helpText);
			}
		}

		const handleDefaultChange = function() {
			let value = false;
			if (defaultFieldInput.type === 'checkbox') {
				value = defaultFieldInput.checked;
			} else {
				value = defaultFieldInput.value === '1' || defaultFieldInput.value === 'true';
			}

			if (value) {
				setDefaultTab(selectedField.name, store);
				frappe.show_alert({
					message: __('Tab set as default'),
					indicator: 'green'
				});
			} else {
				clearDefaultTab(store);
			}
		};

		defaultFieldInput.removeEventListener('change', handleDefaultChange);
		defaultFieldInput.removeEventListener('input', handleDefaultChange);
		
		defaultFieldInput.addEventListener('change', handleDefaultChange);
		if (defaultFieldInput.type !== 'checkbox') {
			defaultFieldInput.addEventListener('input', handleDefaultChange);
		}
	}

	/**
	 * Create the default tab option element
	 */
	function createDefaultTabOption(selectedField, store) {
		const isDefault = isDefaultTab(selectedField.name, store);
		
		const wrapper = document.createElement('div');
		wrapper.className = 'field default-tab-option';
		wrapper.style.cssText = 'margin-bottom: 1rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);';

		const label = document.createElement('label');
		label.className = 'control-label';
		label.textContent = __('Set as Default Tab');
		label.style.cssText = 'margin-bottom: 4px; font-size: 12px; font-weight: 500; color: var(--text-color);';

		const checkboxWrapper = document.createElement('div');
		checkboxWrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = isDefault;
		checkbox.className = 'form-control';
		checkbox.style.cssText = 'width: auto; margin: 0; cursor: pointer;';

		const helpText = document.createElement('div');
		helpText.className = 'help-text';
		helpText.textContent = __('The default tab will be automatically opened when the form loads.');
		helpText.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-top: 4px;';

		checkbox.addEventListener('change', function() {
			if (this.checked) {
				setDefaultTab(selectedField.name, store);
				frappe.show_alert({
					message: __('Tab set as default'),
					indicator: 'green'
				});
			} else {
				clearDefaultTab(store);
				frappe.show_alert({
					message: __('Default tab removed'),
					indicator: 'blue'
				});
			}
		});

		checkboxWrapper.appendChild(checkbox);
		checkboxWrapper.appendChild(document.createTextNode(__('Default Tab')));

		wrapper.appendChild(label);
		wrapper.appendChild(checkboxWrapper);
		wrapper.appendChild(helpText);

		return wrapper;
	}

	/**
	 * Remove default tab option
	 */
	function removeDefaultTabOption() {
		const existingOption = document.querySelector('.default-tab-option');
		if (existingOption) {
			existingOption.remove();
		}
	}

	/**
	 * Set a tab as default
	 */
	function setDefaultTab(tabName, store) {
		if (!store || !tabName) return;

		if (store.doc) {
			store.doc.__default_tab = tabName;
		}

		if (store.form?.layout) {
			store.form.__default_tab = tabName;
		}

		updateDefaultTabIndicator(tabName);
	}

	/**
	 * Clear default tab
	 */
	function clearDefaultTab(store) {
		if (!store) return;

		if (store.doc) {
			store.doc.__default_tab = null;
		}

		if (store.form?.layout) {
			store.form.__default_tab = null;
		}

		document.querySelectorAll('.tab-default-indicator').forEach(el => el.remove());
	}

	/**
	 * Check if a tab is the default tab
	 */
	function isDefaultTab(tabName, store) {
		if (!store || !tabName) return false;
		const defaultTab = store.doc?.__default_tab || store.form?.__default_tab;
		return defaultTab === tabName;
	}

	/**
	 * Update UI to show default tab indicator
	 */
	function updateDefaultTabIndicator(defaultTabName) {
		document.querySelectorAll('.tab-default-indicator').forEach(el => el.remove());

		if (defaultTabName) {
			const store = window.frappe?.form_builder?.store;
			if (!store) return;

			const tabDf = store.form.layout.tabs.find(t => t.df.name === defaultTabName);
			if (tabDf) {
				const tabs = document.querySelectorAll('.tab-header .tab, .tabs .tab');
				tabs.forEach(tabElement => {
					const tabLabel = tabElement.querySelector('.editable-input, [contenteditable="true"]');
					if (tabLabel && tabLabel.textContent.trim() === (tabDf.df.label || '').trim()) {
						const indicator = document.createElement('span');
						indicator.className = 'tab-default-indicator';
						indicator.textContent = '★';
						indicator.title = __('Default Tab');
						indicator.style.cssText = 'margin-left: 4px; color: var(--primary-color, #5e64ff); font-size: 10px;';
						tabLabel.appendChild(indicator);
					}
				});
			}
		}
	}

	/**
	 * Apply default tab when form loads
	 */
	function applyDefaultTab(store) {
		if (!store) return;

		const defaultTabName = store.doc?.__default_tab || store.form?.__default_tab;
		if (!defaultTabName) return;

		const defaultTab = store.form.layout.tabs.find(tab => tab.df.name === defaultTabName);
		if (defaultTab) {
			setTimeout(() => {
				store.activate_tab(defaultTab);
				updateDefaultTabIndicator(defaultTabName);
			}, 300);
		}
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initDefaultTabFeature);
	} else {
		initDefaultTabFeature();
	}

	// Re-initialize on route changes
	if (window.frappe && frappe.router) {
		frappe.router.on('change', () => {
			if (window.location.hash.includes('form_builder') || 
				window.location.pathname.includes('doctype') ||
				window.location.pathname.includes('customize-form')) {
				setTimeout(() => {
					isInitialized = false;
					initDefaultTabFeature();
				}, 1000);
			}
		});
	}

	// Watch for form_builder object creation
	if (window.frappe) {
		Object.defineProperty(window.frappe, 'form_builder', {
			get: function() {
				return this._form_builder;
			},
			set: function(value) {
				this._form_builder = value;
				if (value && value.store) {
					setTimeout(() => {
						isInitialized = false;
						initDefaultTabFeature();
					}, 500);
				}
			},
			configurable: true
		});
	}

})();
