#!/usr/bin/env python3
"""
Generate additional demo data for HRMS + CRM + Accounting
This script adds to existing ERPNext demo data
"""

import frappe
from frappe.utils import getdate, add_days
import random

def generate_additional_demo_data():
	"""Generate additional demo data"""
	
	print("=" * 80)
	print("Generating Additional Demo Data (HRMS + CRM + Accounting)")
	print("=" * 80)
	
	frappe.connect(site="irt")
	frappe.set_user("Administrator")
	
	try:
		# Get demo company
		demo_company = frappe.db.get_single_value("Global Defaults", "demo_company")
		if not demo_company:
			companies = frappe.get_all("Company", limit=1)
			if companies:
				demo_company = companies[0].name
			else:
				print("⚠ No company found. Exiting.")
				return
		
		print(f"\nUsing company: {demo_company}\n")
		
		# 1. Generate HRMS Data
		print("[1/3] Generating HRMS Demo Data...")
		generate_hrms_data(demo_company)
		
		# 2. Generate CRM Data
		print("\n[2/3] Generating CRM Demo Data...")
		generate_crm_data(demo_company)
		
		# 3. Generate Accounting Data
		print("\n[3/3] Generating Additional Accounting Data...")
		generate_accounting_data(demo_company)
		
		frappe.db.commit()
		
		print("\n" + "=" * 80)
		print("Additional Demo Data Generation Complete!")
		print("=" * 80)
		
	except Exception as e:
		frappe.db.rollback()
		print(f"\n❌ Error: {str(e)}")
		import traceback
		traceback.print_exc()


def generate_hrms_data(company):
	"""Generate HRMS data"""
	
	# Create Departments
	departments = ["Sales", "Marketing", "IT", "HR", "Finance", "Operations"]
	created_depts = 0
	for dept_name in departments:
		if not frappe.db.exists("Department", dept_name):
			try:
				frappe.get_doc({
					"doctype": "Department",
					"department_name": dept_name,
					"company": company
				}).insert(ignore_permissions=True)
				created_depts += 1
			except Exception as e:
				print(f"  ⚠ Skipped department {dept_name}: {str(e)}")
	
	# Create Designations
	designations = ["Manager", "Senior Developer", "Developer", "Analyst", "Executive", "Assistant"]
	created_desigs = 0
	for desig_name in designations:
		if not frappe.db.exists("Designation", desig_name):
			try:
				frappe.get_doc({
					"doctype": "Designation",
					"designation": desig_name
				}).insert(ignore_permissions=True)
				created_desigs += 1
			except Exception as e:
				print(f"  ⚠ Skipped designation {desig_name}: {str(e)}")
	
	# Create Employees
	employee_names = [
		("John", "Doe"), ("Jane", "Smith"), ("Michael", "Johnson"),
		("Sarah", "Williams"), ("David", "Brown"), ("Emily", "Davis"),
		("Robert", "Miller"), ("Lisa", "Wilson"), ("James", "Moore"),
		("Patricia", "Taylor")
	]
	
	departments_list = frappe.get_all("Department", filters={"company": company}, limit=6)
	designations_list = frappe.get_all("Designation", limit=6)
	
	created_emps = 0
	for i, (first_name, last_name) in enumerate(employee_names[:10]):
		employee_id = f"EMP-{str(i+1).zfill(4)}"
		if not frappe.db.exists("Employee", employee_id):
			try:
				employee = frappe.get_doc({
					"doctype": "Employee",
					"employee": employee_id,
					"first_name": first_name,
					"last_name": last_name,
					"company": company,
					"date_of_joining": add_days(getdate(), -random.randint(30, 365)),
					"date_of_birth": add_days(getdate(), -random.randint(7300, 14600)),
					"gender": random.choice(["Male", "Female", "Other"]),
					"department": departments_list[i % len(departments_list)].name if departments_list else None,
					"designation": designations_list[i % len(designations_list)].name if designations_list else None,
					"employment_type": "Full-time",
					"status": "Active"
				})
				employee.insert(ignore_permissions=True)
				created_emps += 1
			except Exception as e:
				print(f"  ⚠ Skipped employee {employee_id}: {str(e)}")
	
	# Create Leave Applications
	employees = frappe.get_all("Employee", filters={"company": company}, limit=5)
	leave_types = frappe.get_all("Leave Type", limit=3)
	created_leaves = 0
	
	if employees and leave_types:
		for i, emp in enumerate(employees[:3]):
			try:
				leave_app = frappe.get_doc({
					"doctype": "Leave Application",
					"employee": emp.name,
					"leave_type": leave_types[i % len(leave_types)].name,
					"from_date": add_days(getdate(), random.randint(1, 30)),
					"to_date": add_days(getdate(), random.randint(2, 35)),
					"half_day": random.choice([0, 1]),
					"status": random.choice(["Open", "Approved"])
				})
				leave_app.insert(ignore_permissions=True)
				created_leaves += 1
			except Exception as e:
				print(f"  ⚠ Skipped leave application: {str(e)}")
	
	print(f"  ✓ Created {created_depts} departments")
	print(f"  ✓ Created {created_desigs} designations")
	print(f"  ✓ Created {created_emps} employees")
	print(f"  ✓ Created {created_leaves} leave applications")


def generate_crm_data(company):
	"""Generate CRM data"""
	
	# Create Leads
	lead_data = [
		{"lead_name": "Tech Solutions Inc", "email": "contact@techsolutions.com", "phone": "+1-555-0101"},
		{"lead_name": "Global Enterprises", "email": "info@globalent.com", "phone": "+1-555-0102"},
		{"lead_name": "Innovation Labs", "email": "hello@innovationlabs.com", "phone": "+1-555-0103"},
		{"lead_name": "Future Systems", "email": "sales@futuresystems.com", "phone": "+1-555-0104"},
		{"lead_name": "Digital Dynamics", "email": "contact@digitaldynamics.com", "phone": "+1-555-0105"}
	]
	
	created_leads = 0
	for lead_info in lead_data:
		if not frappe.db.exists("Lead", {"lead_name": lead_info["lead_name"]}):
			try:
				lead = frappe.get_doc({
					"doctype": "Lead",
					"lead_name": lead_info["lead_name"],
					"email_id": lead_info["email"],
					"phone": lead_info["phone"],
					"company": company,
					"status": random.choice(["Lead", "Open", "Replied", "Opportunity", "Converted"])
				})
				lead.insert(ignore_permissions=True)
				created_leads += 1
			except Exception as e:
				print(f"  ⚠ Skipped lead {lead_info['lead_name']}: {str(e)}")
	
	# Create Opportunities
	customers = frappe.get_all("Customer", limit=5)
	created_opps = 0
	
	if customers:
		opportunity_data = [
			{"opportunity_type": "Sales", "probability": 70},
			{"opportunity_type": "Sales", "probability": 50},
			{"opportunity_type": "Sales", "probability": 80},
			{"opportunity_type": "Sales", "probability": 60},
			{"opportunity_type": "Sales", "probability": 90}
		]
		
		for i, customer in enumerate(customers[:5]):
			try:
				opp = frappe.get_doc({
					"doctype": "Opportunity",
					"opportunity_from": "Customer",
					"party_name": customer.name,
					"opportunity_type": opportunity_data[i]["opportunity_type"],
					"probability": opportunity_data[i]["probability"],
					"expected_closing": add_days(getdate(), random.randint(7, 90)),
					"company": company
				})
				opp.insert(ignore_permissions=True)
				created_opps += 1
			except Exception as e:
				print(f"  ⚠ Skipped opportunity: {str(e)}")
	
	# Create Quotations
	customers = frappe.get_all("Customer", limit=3)
	created_quots = 0
	
	if customers:
		for i, customer in enumerate(customers[:3]):
			items = frappe.get_all("Item", filters={"is_sales_item": 1}, limit=2)
			if items:
				try:
					quotation = frappe.get_doc({
						"doctype": "Quotation",
						"party_name": customer.name,
						"quotation_to": "Customer",
						"company": company,
						"transaction_date": getdate(),
						"valid_till": add_days(getdate(), 30),
						"items": [{
							"item_code": items[j % len(items)].name,
							"qty": random.randint(1, 10),
							"rate": random.randint(100, 1000)
						} for j in range(min(2, len(items)))]
					})
					quotation.insert(ignore_permissions=True)
					created_quots += 1
				except Exception as e:
					print(f"  ⚠ Skipped quotation: {str(e)}")
	
	print(f"  ✓ Created {created_leads} leads")
	print(f"  ✓ Created {created_opps} opportunities")
	print(f"  ✓ Created {created_quots} quotations")


def generate_accounting_data(company):
	"""Generate accounting data"""
	
	# Create Journal Entries (use non-receivable/payable accounts)
	accounts = frappe.get_all("Account", 
		filters={
			"company": company, 
			"is_group": 0,
			"account_type": ["not in", ["Receivable", "Payable"]]
		}, 
		limit=5)
	
	created_jes = 0
	if len(accounts) >= 2:
		for i in range(3):
			try:
				amount = random.randint(1000, 5000)
				je = frappe.get_doc({
					"doctype": "Journal Entry",
					"company": company,
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
				created_jes += 1
			except Exception as e:
				print(f"  ⚠ Skipped journal entry: {str(e)}")
	
	# Create Payment Entries
	customers = frappe.get_all("Customer", limit=3)
	suppliers = frappe.get_all("Supplier", limit=3)
	
	# Get accounts
	debtors_account = frappe.db.get_value("Company", company, "default_receivable_account")
	creditors_account = frappe.db.get_value("Company", company, "default_payable_account")
	cash_account = frappe.get_all("Account", 
		filters={"company": company, "account_type": "Cash", "is_group": 0}, 
		limit=1)
	bank_account = frappe.get_all("Account", 
		filters={"company": company, "account_type": "Bank", "is_group": 0}, 
		limit=1)
	
	created_pes = 0
	
	if customers and debtors_account and (cash_account or bank_account):
		paid_to = (cash_account[0].name if cash_account else bank_account[0].name) if (cash_account or bank_account) else None
		if paid_to:
			for customer in customers[:2]:
				try:
					amount = random.randint(500, 2000)
					pe = frappe.get_doc({
						"doctype": "Payment Entry",
						"payment_type": "Receive",
						"party_type": "Customer",
						"party": customer.name,
						"company": company,
						"posting_date": add_days(getdate(), -random.randint(1, 30)),
						"paid_from": debtors_account,
						"paid_to": paid_to,
						"paid_amount": amount,
						"received_amount": amount,
						"source_exchange_rate": 1,
						"target_exchange_rate": 1
					})
					pe.insert(ignore_permissions=True)
					created_pes += 1
				except Exception as e:
					print(f"  ⚠ Skipped payment entry: {str(e)}")
	
	if suppliers and creditors_account and (cash_account or bank_account):
		paid_from = (cash_account[0].name if cash_account else bank_account[0].name) if (cash_account or bank_account) else None
		if paid_from:
			for supplier in suppliers[:2]:
				try:
					amount = random.randint(500, 2000)
					pe = frappe.get_doc({
						"doctype": "Payment Entry",
						"payment_type": "Pay",
						"party_type": "Supplier",
						"party": supplier.name,
						"company": company,
						"posting_date": add_days(getdate(), -random.randint(1, 30)),
						"paid_from": paid_from,
						"paid_to": creditors_account,
						"paid_amount": amount,
						"received_amount": amount,
						"source_exchange_rate": 1,
						"target_exchange_rate": 1
					})
					pe.insert(ignore_permissions=True)
					created_pes += 1
				except Exception as e:
					print(f"  ⚠ Skipped payment entry: {str(e)}")
	
	print(f"  ✓ Created {created_jes} journal entries")
	print(f"  ✓ Created {created_pes} payment entries")


if __name__ == "__main__":
	generate_additional_demo_data()

