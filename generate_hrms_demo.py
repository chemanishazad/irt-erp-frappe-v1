#!/usr/bin/env python3
"""
Generate comprehensive HRMS demo data
Run with: bench --site irt execute irt_ui.generate_hrms_demo.generate_hrms_demo_data
Or: bench --site irt console < generate_hrms_demo.py
"""

import frappe
from frappe.utils import getdate, add_days
import random

def generate_hrms_demo_data():
	"""Generate comprehensive HRMS demo data"""
	
	print("=" * 80)
	print("Generating HRMS Demo Data")
	print("=" * 80)
	
	if not frappe.db:
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
		
		# 1. Create Employees
		print("[1/4] Creating Employees...")
		employees = create_employees(demo_company)
		
		# 2. Create Leave Applications
		print("\n[2/4] Creating Leave Applications...")
		create_leave_applications(demo_company, employees)
		
		# 3. Create Expense Claims
		print("\n[3/4] Creating Expense Claims...")
		create_expense_claims(demo_company, employees)
		
		# 4. Create Attendance Records
		print("\n[4/4] Creating Attendance Records...")
		create_attendance_records(demo_company, employees)
		
		frappe.db.commit()
		
		print("\n" + "=" * 80)
		print("HRMS Demo Data Generation Complete!")
		print("=" * 80)
		print(f"\nSummary:")
		print(f"  - Employees created: {len(employees)}")
		print(f"  - Leave Applications: {frappe.db.count('Leave Application')}")
		print(f"  - Expense Claims: {frappe.db.count('Expense Claim')}")
		print(f"  - Attendance Records: {frappe.db.count('Attendance')}")
		
	except Exception as e:
		frappe.db.rollback()
		print(f"\n❌ Error: {str(e)}")
		import traceback
		traceback.print_exc()
		raise


def create_employees(company):
	"""Create multiple employees"""
	
	# Get existing departments and designations
	departments = frappe.get_all("Department", filters={"company": company}, limit=10)
	designations = frappe.get_all("Designation", limit=10)
	employment_types = frappe.get_all("Employment Type", limit=5)
	
	if not departments:
		print("  ⚠ No departments found. Creating default department...")
		dept = frappe.get_doc({
			"doctype": "Department",
			"department_name": "General",
			"company": company
		})
		dept.insert(ignore_permissions=True)
		departments = [dept]
	
	if not designations:
		print("  ⚠ No designations found. Creating default designation...")
		desig = frappe.get_doc({
			"doctype": "Designation",
			"designation": "Employee"
		})
		desig.insert(ignore_permissions=True)
		designations = [desig]
	
	employee_data = [
		("John", "Doe", "Male"),
		("Jane", "Smith", "Female"),
		("Michael", "Johnson", "Male"),
		("Sarah", "Williams", "Female"),
		("David", "Brown", "Male"),
		("Emily", "Davis", "Female"),
		("Robert", "Miller", "Male"),
		("Lisa", "Wilson", "Female"),
		("James", "Moore", "Male"),
		("Patricia", "Taylor", "Female"),
		("William", "Anderson", "Male"),
		("Jennifer", "Thomas", "Female"),
		("Richard", "Jackson", "Male"),
		("Maria", "White", "Female"),
		("Charles", "Harris", "Male")
	]
	
	created_employees = []
	
	for i, (first_name, last_name, gender) in enumerate(employee_data):
		# Check if employee already exists
		existing = frappe.db.get_value("Employee", {"first_name": first_name, "last_name": last_name}, "name")
		if existing:
			created_employees.append(existing)
			continue
		
		try:
			employee = frappe.get_doc({
				"doctype": "Employee",
				"first_name": first_name,
				"last_name": last_name,
				"company": company,
				"date_of_joining": add_days(getdate(), -random.randint(30, 1095)),  # 1 month to 3 years ago
				"date_of_birth": add_days(getdate(), -random.randint(7300, 18250)),  # Age 20-50
				"gender": gender,
				"department": departments[i % len(departments)].name,
				"designation": designations[i % len(designations)].name,
				"employment_type": employment_types[i % len(employment_types)].name if employment_types else "Full-time",
				"status": "Active"
			})
			employee.insert(ignore_permissions=True)
			created_employees.append(employee.name)
			print(f"  ✓ Created employee: {first_name} {last_name} ({employee.name})")
		except Exception as e:
			print(f"  ⚠ Skipped employee {first_name} {last_name}: {str(e)}")
	
	return created_employees


def create_leave_applications(company, employees):
	"""Create leave applications"""
	
	if not employees:
		print("  ⚠ No employees found. Skipping leave applications.")
		return
	
	leave_types = frappe.get_all("Leave Type", limit=5)
	if not leave_types:
		print("  ⚠ No leave types found. Skipping leave applications.")
		return
	
	created_count = 0
	for i, emp_name in enumerate(employees[:10]):  # Create for first 10 employees
		try:
			leave_type = leave_types[i % len(leave_types)]
			from_date = add_days(getdate(), random.randint(1, 60))
			to_date = add_days(from_date, random.randint(1, 5))
			
			leave_app = frappe.get_doc({
				"doctype": "Leave Application",
				"employee": emp_name,
				"leave_type": leave_type.name,
				"from_date": from_date,
				"to_date": to_date,
				"half_day": random.choice([0, 1]),
				"half_day_date": from_date if random.choice([True, False]) else None,
				"status": random.choice(["Open", "Approved"]),
				"company": company
			})
			leave_app.insert(ignore_permissions=True)
			created_count += 1
		except Exception as e:
			print(f"  ⚠ Skipped leave application for {emp_name}: {str(e)}")
	
	print(f"  ✓ Created {created_count} leave applications")


def create_expense_claims(company, employees):
	"""Create expense claims"""
	
	if not employees:
		print("  ⚠ No employees found. Skipping expense claims.")
		return
	
	expense_types = frappe.get_all("Expense Claim Type", limit=5)
	if not expense_types:
		print("  ⚠ No expense claim types found. Skipping expense claims.")
		return
	
	company_currency = frappe.db.get_value("Company", company, "default_currency")
	
	created_count = 0
	for i, emp_name in enumerate(employees[:8]):  # Create for first 8 employees
		try:
			expense_type = expense_types[i % len(expense_types)]
			amount = random.randint(100, 2000)
			
			expense_claim = frappe.get_doc({
				"doctype": "Expense Claim",
				"employee": emp_name,
				"expense_approver": "Administrator",
				"company": company,
				"currency": company_currency,
				"exchange_rate": 1,
				"expenses": [{
					"expense_type": expense_type.name,
					"amount": amount,
					"sanctioned_amount": amount,
					"description": f"Expense claim for {emp_name}"
				}]
			})
			expense_claim.insert(ignore_permissions=True)
			created_count += 1
		except Exception as e:
			print(f"  ⚠ Skipped expense claim for {emp_name}: {str(e)}")
	
	print(f"  ✓ Created {created_count} expense claims")


def create_attendance_records(company, employees):
	"""Create attendance records"""
	
	if not employees:
		print("  ⚠ No employees found. Skipping attendance records.")
		return
	
	created_count = 0
	# Create attendance for last 30 days for first 5 employees
	for emp_name in employees[:5]:
		for day_offset in range(30):
			try:
				attendance_date = add_days(getdate(), -day_offset)
				# Skip weekends (Saturday=5, Sunday=6)
				if attendance_date.weekday() >= 5:
					continue
				
				# Check if attendance already exists
				if frappe.db.exists("Attendance", {
					"employee": emp_name,
					"attendance_date": attendance_date
				}):
					continue
				
				attendance = frappe.get_doc({
					"doctype": "Attendance",
					"employee": emp_name,
					"attendance_date": attendance_date,
					"status": random.choice(["Present", "Present", "Present", "Absent"]),  # Mostly present
					"company": company
				})
				attendance.insert(ignore_permissions=True)
				created_count += 1
			except Exception as e:
				# Skip if error (might be duplicate or validation issue)
				pass
	
	print(f"  ✓ Created {created_count} attendance records")


if __name__ == "__main__":
	generate_hrms_demo_data()

