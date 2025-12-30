
app_name = "irt_hrms"
app_title = "IRT HRMS"
app_publisher = "irt"
app_description = "hrms"
app_email = "hrms@gmail.com"
app_license = "mit"

override_whitelisted_methods = {
    "frappe.model.workflow.apply_workflow":
        "irt_hrms.overrides.apply_workflow"
}


