app_name = "irt_ui"
app_title = "IRT UI"
app_publisher = "IRT"
app_description = "UI Customizations for IRT ERP"
app_email = "info@irt.com"
app_license = "mit"

# Includes in <head> - For desk/app pages
# Order: variables first, then main.css (which imports all components)
app_include_css = [
	"/assets/irt_ui/css/custom/variables.css?v=1.1.5",
	"/assets/irt_ui/css/custom/main.css?v=1.2.0",
	"/assets/irt_ui/css/custom/table-filter/list-view-custom.css?v=2.7.0",
]

app_include_js = [
	"/assets/irt_ui/js/custom/sidebar.js?v=1.1.6",
	"/assets/irt_ui/js/custom/default-route-handler.js?v=1.0.0",
	"/assets/irt_ui/js/custom/01-core-layout/03-top-navigation.js?v=1.1.6",
	"/assets/irt_ui/js/custom/01-core-layout/04-main-content.js?v=1.1.6",
	"/assets/irt_ui/js/custom/01-core-layout/05-page-headers.js?v=1.1.6",
	"/assets/irt_ui/js/custom/02-form-components/06-form-inputs.js?v=1.1.6",
	"/assets/irt_ui/js/custom/02-form-components/10-hide-form-sidebar.js?v=1.0.0",
	"/assets/irt_ui/js/custom/02-form-components/11-form-activity-tab.js?v=1.1.6",
	"/assets/irt_ui/js/custom/02-form-components/12-form-builder-default-tab.js?v=3.0.0",
	"/assets/irt_ui/js/custom/02-form-components/13-global-workflow-actions.js?v=1.0.3",
	"/assets/irt_ui/js/custom/02-form-components/99-force-dropdown-styles.js?v=1.0.0",
	"/assets/irt_ui/js/custom/03-data-display/12-form-activity.js?v=1.1.6",
	"/assets/irt_ui/js/custom/03-data-display/13-global-list-workflow-actions.js?v=1.0.0",
	"/assets/irt_ui/js/custom/05-advanced/16-filters-search.js?v=1.1.6",
	"/assets/irt_ui/js/custom/03-data-display/pagination-override.js?v=2.3.0",
	"/assets/irt_ui/js/custom/table-filter/list-view-custom.js?v=2.0.0",
]

# Includes for website pages (login, signup, etc.)
# Load variables first, then components
web_include_css = [
	"/assets/irt_ui/css/custom/variables.css",
	"/assets/irt_ui/css/custom/login.css"
]

web_include_js = [
	"/assets/irt_ui/js/custom/login.js"
]

# Boot session hook to load role-based sidebars
boot_session = [
	"irt_ui.startup.boot.load_role_based_sidebars"
]

