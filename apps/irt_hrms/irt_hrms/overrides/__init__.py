# Copyright (c) 2025, IRT and contributors
# License: MIT. See LICENSE

import frappe
from frappe import _
from frappe.model.docstatus import DocStatus

# Import workflow helper functions
from frappe.model.workflow import (
	get_workflow,
	get_transitions,
	has_approval_access,
	WorkflowTransitionError,
	DEFAULT_WORKFLOW_TASKS,
)


@frappe.whitelist()
def apply_workflow(doc, action, remark=None):
	"""
	Override for frappe.model.workflow.apply_workflow
	Allows custom workflow logic to be applied before/after the standard workflow action

	This override bypasses write permissions when saving during workflow transitions,
	allowing users with workflow action permissions to save documents even if they
	don't have direct write permissions on the doctype.
	"""
	doc = frappe.get_doc(frappe.parse_json(doc))
	doc.load_from_db()
	workflow = get_workflow(doc.doctype)
	transitions = get_transitions(doc, workflow)
	user = frappe.session.user

	# find the transition
	transition = None
	for t in transitions:
		if t.action == action:
			transition = t

	if not transition:
		frappe.throw(_("Not a valid Workflow Action"), WorkflowTransitionError)

	if not has_approval_access(user, doc, transition):
		frappe.throw(_("Self approval is not allowed"))

	# update workflow state field
	doc.set(workflow.workflow_state_field, transition.next_state)

	# find settings for the next state
	next_state = next(d for d in workflow.states if d.state == transition.next_state)

	doc.save(ignore_permissions=True)

	# update any additional field
	if next_state.update_field:
		doc.set(next_state.update_field, next_state.update_value)

	# Handle transition tasks (same as original)
	if transition.transition_tasks:
		workflow_transitions = frappe.db.get_all(
			"Workflow Transition Task",
			{"parent": transition.transition_tasks, "enabled": True},
			["task", "link", "asynchronous"],
			order_by="idx",
		)

		tasks = {i["name"]: i["method"] for i in frappe.get_hooks("workflow_methods")}

		sync_tasks = []
		async_tasks = []
		for workflow_transition in workflow_transitions:
			if workflow_transition.task in DEFAULT_WORKFLOW_TASKS:
				match workflow_transition.task:
					case "Webhook":
						webhook = frappe.get_doc("Webhook", workflow_transition.link)
						task_method = webhook.execute_for_doc

					case "Server Script":
						server_script = frappe.get_doc("Server Script", workflow_transition.link)
						task_method = server_script.execute_workflow_task

			else:
				try:
					task_method = frappe.get_attr(tasks[workflow_transition.task])
				except KeyError:
					frappe.throw(_('There is no task called "{}"').format(workflow_transition.task))

			if workflow_transition.asynchronous:
				async_tasks.append(task_method)
			else:
				sync_tasks.append(task_method)

		# Execute sync tasks
		for sync_task in sync_tasks:
			sync_task(doc)

		# Execute async tasks
		for async_task in async_tasks:
			frappe.enqueue(async_task, doc=doc, enqueue_after_commit=True)

	# Set ignore_permissions flag to allow workflow actions even without write permission
	# This is safe because the user has already been validated for workflow action permission
	doc.flags.ignore_permissions = True

	# Save or submit based on new docstatus
	new_docstatus = DocStatus(next_state.doc_status or 0)
	if doc.docstatus.is_draft() and new_docstatus.is_draft():
		doc.save(ignore_permissions=True)
	elif doc.docstatus.is_draft() and new_docstatus.is_submitted():
		from frappe.core.doctype.submission_queue.submission_queue import queue_submission
		from frappe.utils.scheduler import is_scheduler_inactive

		if doc.meta.queue_in_background and not is_scheduler_inactive():
			queue_submission(doc, "Submit")
			return

		doc.submit()
	elif doc.docstatus.is_submitted() and new_docstatus.is_submitted():
		doc.save(ignore_permissions=True)
	elif doc.docstatus.is_submitted() and new_docstatus.is_cancelled():
		doc.cancel()
	else:
		frappe.throw(_("Illegal Document Status for {0}").format(next_state.state))

	doc.add_comment("Workflow", _(next_state.state))

	return doc


def allow_desk_access():
	"""
	Override for frappe.app.is_allowed_to_view_desk
	Controls whether a user is allowed to view the desk

	Returns True to allow all users to access the desk.
	This can be customized based on specific requirements.
	"""
	# For now, allow all users to access the desk
	# This can be customized based on specific requirements
	return True
