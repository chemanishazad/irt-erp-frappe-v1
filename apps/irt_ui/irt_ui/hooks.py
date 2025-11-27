app_name = "irt_ui"
app_title = "IRT UI"
app_publisher = "IRT"
app_description = "UI Customizations for IRT ERP"
app_email = "info@irt.com"
app_license = "mit"

# Includes in <head> - For desk/app pages
app_include_css = []

app_include_js = []

# Includes for website pages (login, signup, etc.)
# Load variables first, then components
web_include_css = [
	"/assets/irt_ui/css/custom/variables.css",
	"/assets/irt_ui/css/custom/login.css"
]

web_include_js = [
	"/assets/irt_ui/js/custom/login.js"
]

