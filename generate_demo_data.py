#!/usr/bin/env python3
"""
Generate comprehensive demo data for ERPNext + HRMS + CRM + Accounting
This script creates sample data across all modules
"""

import frappe
from frappe.utils import now_datetime, getdate, add_days, add_months
from datetime import datetime, timedelta
import random

def generate_demo_data():
	"""Generate comprehensive demo data for all modules"""
	
	print("=" * 80)
	print("Generating Comprehensive Demo Data")
	print("=" * 80)
	
	# Ensure we're connected to the site
	frappe.connect(site="irt")
	frappe.set_user("Administrator")
	
	try:
		# 1. Generate ERPNext Demo Data (includes Accounting, CRM, Inventory, etc.)
		print("\n[1/4] Generating ERPNext Demo Data (ERP + Accounting + CRM + Inventory)...")
		demo_company = frappe.db.get_single_value("Global Defaults", "demo_company")
		if not demo_company:
			from erpnext.setup.demo import setup_demo_data
			setup_demo_data()
			print("✓ ERPNext demo data generated successfully")
		else:
			print(f"✓ Demo company '{demo_company}' already exists. Using existing demo data.")
		
		# 2. Generate HRMS Demo Data
		print("\n[2/4] Generating HRMS Demo Data...")
		generate_hrms_demo_data()
		print("✓ HRMS demo data generated successfully")
		
		# 3. Generate Additional CRM Data
		print("\n[3/4] Generating Additional CRM Data...")
		generate_crm_demo_data()
		print("✓ CRM demo data generated successfully")
		
		# 4. Generate Additional Accounting Data
		print("\n[4/4] Generating Additional Accounting Data...")
		generate_accounting_demo_data()
		print("✓ Accounting demo data generated successfully")
		
		frappe.db.commit()
		
		print("\n" + "=" * 80)
		print("Demo Data Generation Complete!")
		print("=" * 80)
		print("\nSummary:")
		print("- ERPNext Demo Data: ✓")
		print("- HRMS Demo Data: ✓")
		print("- CRM Demo Data: ✓")
		print("- Accounting Demo Data: ✓")
		print("\nYou can now explore the system with comprehensive sample data.")
		
	except Exception as e:
		frappe.db.rollback()
		print(f"\n❌ Error generating demo data: {str(e)}")
		import traceback
		traceback.print_exc()
		raise


def generate_hrms_demo_data():
	"""Generate HRMS specific demo data"""
	
	# Get the demo company
	demo_company = frappe.db.get_single_value("Global Defaults", "demo_company")
	if not demo_company:
		# Use first available company
		companies = frappe.get_all("Company", limit=1)
		if companies:
			demo_company = companies[0].name
		else:
			print("⚠ No company found. Skipping HRMS demo data.")
			return
	
	# Create Departments if they don't exist
	departments = ["Sales", "Marketing", "IT", "HR", "Finance", "Operations"]
	for dept_name in departments:
		if not frappe.db.exists("Department", dept_name):
			frappe.get_doc({
				"doctype": "Department",
				"department_name": dept_name,
				"company": demo_company
			}).insert(ignore_permissions=True)
	
	# Create Designations
	designations = ["Manager", "Senior Developer", "Developer", "Analyst", "Executive", "Assistant"]
	for desig_name in designations:
		if not frappe.db.exists("Designation", desig_name):
			frappe.get_doc({
				"doctype": "Designation",
				"designation": desig_name
			}).insert(ignore_permissions=True)
	
	# Create Employees
	employee_names = [
		("John", "Doe"), ("Jane", "Smith"), ("Michael", "Johnson"),
		("Sarah", "Williams"), ("David", "Brown"), ("Emily", "Davis"),
		("Robert", "Miller"), ("Lisa", "Wilson"), ("James", "Moore"),
		("Patricia", "Taylor")
	]
	
	departments_list = frappe.get_all("Department", filters={"company": demo_company}, limit=6)
	designations_list = frappe.get_all("Designation", limit=6)
	
	for i, (first_name, last_name) in enumerate(employee_names[:10]):
		employee_id = f"EMP-{str(i+1).zfill(4)}"
		if not frappe.db.exists("Employee", employee_id):
			employee = frappe.get_doc({
				"doctype": "Employee",
				"employee": employee_id,
				"first_name": first_name,
				"last_name": last_name,
				"company": demo_company,
				"date_of_joining": add_days(getdate(), -random.randint(30, 365)),
				"date_of_birth": add_days(getdate(), -random.randint(7300, 14600)),  # Age 20-40
				"gender": random.choice(["Male", "Female", "Other"]),
				"department": departments_list[i % len(departments_list)].name if departments_list else None,
				"designation": designations_list[i % len(designations_list)].name if designations_list else None,
				"employment_type": "Full-time",
				"status": "Active"
			})
			employee.insert(ignore_permissions=True)
	
	# Create Leave Applications
	employees = frappe.get_all("Employee", filters={"company": demo_company}, limit=5)
	leave_types = frappe.get_all("Leave Type", limit=3)
	
	if employees and leave_types:
		for i, emp in enumerate(employees[:3]):
			leave_app = frappe.get_doc({
				"doctype": "Leave Application",
				"employee": emp.name,
				"leave_type": leave_types[i % len(leave_types)].name,
				"from_date": add_days(getdate(), random.randint(1, 30)),
				"to_date": add_days(getdate(), random.randint(2, 35)),
				"half_day": random.choice([0, 1]),
				"status": random.choice(["Open", "Approved", "Rejected"])
			})
			leave_app.insert(ignore_permissions=True)
	
	# Create Expense Claims
	if employees:
		company_currency = frappe.db.get_value("Company", demo_company, "default_currency")
		for i, emp in enumerate(employees[:3]):
			try:
				expense_claim = frappe.get_doc({
					"doctype": "Expense Claim",
					"employee": emp.name,
					"expense_approver": "Administrator",
					"company": demo_company,
					"currency": company_currency,
					"exchange_rate": 1,
					"expenses": [{
						"expense_type": "Travel",
						"amount": random.randint(100, 1000),
						"sanctioned_amount": random.randint(100, 1000),
						"description": f"Travel expense for {emp.name}"
					}]
				})
				expense_claim.insert(ignore_permissions=True)
			except Exception as e:
				print(f"  ⚠ Skipped expense claim for {emp.name}: {str(e)}")
	
	print(f"  - Created {len(departments)} departments")
	print(f"  - Created {len(designations)} designations")
	print(f"  - Created {min(10, len(employee_names))} employees")
	print(f"  - Created leave applications")
	print(f"  - Created expense claims")


def generate_crm_demo_data():
	"""Generate additional CRM demo data"""
	
	demo_company = frappe.db.get_single_value("Global Defaults", "demo_company")
	if not demo_company:
		companies = frappe.get_all("Company", limit=1)
		if companies:
			demo_company = companies[0].name
		else:
			print("⚠ No company found. Skipping CRM demo data.")
			return
	
	# Create Leads
	lead_data = [
		{"lead_name": "Tech Solutions Inc", "email": "contact@techsolutions.com", "phone": "+1-555-0101"},
		{"lead_name": "Global Enterprises", "email": "info@globalent.com", "phone": "+1-555-0102"},
		{"lead_name": "Innovation Labs", "email": "hello@innovationlabs.com", "phone": "+1-555-0103"},
		{"lead_name": "Future Systems", "email": "sales@futuresystems.com", "phone": "+1-555-0104"},
		{"lead_name": "Digital Dynamics", "email": "contact@digitaldynamics.com", "phone": "+1-555-0105"}
	]
	
	for lead_info in lead_data:
		if not frappe.db.exists("Lead", {"lead_name": lead_info["lead_name"]}):
			lead = frappe.get_doc({
				"doctype": "Lead",
				"lead_name": lead_info["lead_name"],
				"email_id": lead_info["email"],
				"phone": lead_info["phone"],
				"company": demo_company,
				"status": random.choice(["Lead", "Open", "Replied", "Opportunity", "Converted"])
			})
			lead.insert(ignore_permissions=True)
	
	# Create Opportunities
	customers = frappe.get_all("Customer", limit=5)
	if customers:
		opportunity_data = [
			{"opportunity_type": "Sales", "probability": 70},
			{"opportunity_type": "Sales", "probability": 50},
			{"opportunity_type": "Sales", "probability": 80},
			{"opportunity_type": "Sales", "probability": 60},
			{"opportunity_type": "Sales", "probability": 90}
		]
		
		for i, customer in enumerate(customers[:5]):
			opp = frappe.get_doc({
				"doctype": "Opportunity",
				"opportunity_from": "Customer",
				"party_name": customer.name,
				"opportunity_type": opportunity_data[i]["opportunity_type"],
				"probability": opportunity_data[i]["probability"],
				"expected_closing": add_days(getdate(), random.randint(7, 90)),
				"company": demo_company
			})
			opp.insert(ignore_permissions=True)
	
	# Create Quotations
	if customers:
		for i, customer in enumerate(customers[:3]):
			items = frappe.get_all("Item", filters={"is_sales_item": 1}, limit=2)
			if items:
				quotation = frappe.get_doc({
					"doctype": "Quotation",
					"party_name": customer.name,
					"quotation_to": "Customer",
					"company": demo_company,
					"transaction_date": getdate(),
					"valid_till": add_days(getdate(), 30),
					"items": [{
						"item_code": items[j % len(items)].name,
						"qty": random.randint(1, 10),
						"rate": random.randint(100, 1000)
					} for j in range(min(2, len(items)))]
				})
				quotation.insert(ignore_permissions=True)
	
	print(f"  - Created {len(lead_data)} leads")
	print(f"  - Created opportunities")
	print(f"  - Created quotations")


def generate_accounting_demo_data():
	"""Generate additional accounting demo data"""
	
	demo_company = frappe.db.get_single_value("Global Defaults", "demo_company")
	if not demo_company:
		companies = frappe.get_all("Company", limit=1)
		if companies:
			demo_company = companies[0].name
		else:
			print("⚠ No company found. Skipping Accounting demo data.")
			return
	
	# Create Journal Entries (use non-receivable/payable accounts)
	accounts = frappe.get_all("Account", 
		filters={
			"company": demo_company, 
			"is_group": 0,
			"account_type": ["not in", ["Receivable", "Payable"]]
		}, 
		limit=5)
	if len(accounts) >= 2:
		for i in range(3):
			amount = random.randint(1000, 5000)
			je = frappe.get_doc({
				"doctype": "Journal Entry",
				"company": demo_company,
				"posting_date": add_days(getdate(), -random.randint(1, 30)),
				"accounts": [
					{
						"account": accounts[0].name,
						"debit_in_account_currency": amount,
						"credit_in_account_currency": 0
					},
					{
						"account": accounts[1].name,
						"debit_in_account_currency": 0,
						"credit_in_account_currency": amount
					}
				]
			})
			je.insert(ignore_permissions=True)
	
	# Create Payment Entries
	customers = frappe.get_all("Customer", limit=3)
	suppliers = frappe.get_all("Supplier", limit=3)
	
	# Get accounts for payment entries
	company_currency = frappe.db.get_value("Company", demo_company, "default_currency")
	debtors_account = frappe.db.get_value("Company", demo_company, "default_receivable_account")
	creditors_account = frappe.db.get_value("Company", demo_company, "default_payable_account")
	cash_account = frappe.get_all("Account", 
		filters={"company": demo_company, "account_type": "Cash", "is_group": 0}, 
		limit=1)
	bank_account = frappe.get_all("Account", 
		filters={"company": demo_company, "account_type": "Bank", "is_group": 0}, 
		limit=1)
	
	if customers and debtors_account and (cash_account or bank_account):
		paid_to = (cash_account[0].name if cash_account else bank_account[0].name) if (cash_account or bank_account) else None
		if paid_to:
			for customer in customers[:2]:
				amount = random.randint(500, 2000)
				pe = frappe.get_doc({
					"doctype": "Payment Entry",
					"payment_type": "Receive",
					"party_type": "Customer",
					"party": customer.name,
					"company": demo_company,
					"posting_date": add_days(getdate(), -random.randint(1, 30)),
					"paid_from": debtors_account,
					"paid_to": paid_to,
					"paid_amount": amount,
					"received_amount": amount,
					"source_exchange_rate": 1,
					"target_exchange_rate": 1
				})
				pe.insert(ignore_permissions=True)
	
	if suppliers and creditors_account and (cash_account or bank_account):
		paid_from = (cash_account[0].name if cash_account else bank_account[0].name) if (cash_account or bank_account) else None
		if paid_from:
			for supplier in suppliers[:2]:
				amount = random.randint(500, 2000)
				pe = frappe.get_doc({
					"doctype": "Payment Entry",
					"payment_type": "Pay",
					"party_type": "Supplier",
					"party": supplier.name,
					"company": demo_company,
					"posting_date": add_days(getdate(), -random.randint(1, 30)),
					"paid_from": paid_from,
					"paid_to": creditors_account,
					"paid_amount": amount,
					"received_amount": amount,
					"source_exchange_rate": 1,
					"target_exchange_rate": 1
				})
				pe.insert(ignore_permissions=True)
	
	print(f"  - Created journal entries")
	print(f"  - Created payment entries")


if __name__ == "__main__":
	generate_demo_data()

