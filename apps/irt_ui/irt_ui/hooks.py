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
	"/assets/irt_ui/css/custom/main.css?v=1.1.5",
	"/assets/irt_ui/css/custom/role_sidebar.css?v=1.0.0"
]

app_include_js = [
	"/assets/irt_ui/js/custom/sidebar.js",
	"/assets/irt_ui/js/custom/01-core-layout/03-top-navigation.js",
	"/assets/irt_ui/js/custom/01-core-layout/04-main-content.js",
	"/assets/irt_ui/js/custom/02-form-components/06-form-inputs.js",
	"/assets/irt_ui/js/custom/05-advanced/16-filters-search.js",
	"/assets/irt_ui/js/custom/role_sidebar.js"
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

# Boot session hook for role-based sidebar
boot_session = "irt_ui.startup.boot.boot_session"

# Page routes
page_js = {
	"role-sidebar-builder": "irt_ui/page/role_sidebar_builder/role_sidebar_builder.js"
}

# DocType JavaScript
doctype_js = {
	"IRT Role Sidebar": "irt_ui/doctype/irt_role_sidebar/irt_role_sidebar.js"
}

