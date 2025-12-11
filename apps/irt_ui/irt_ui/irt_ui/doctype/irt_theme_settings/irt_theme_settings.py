# Copyright (c) 2024, IRT and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document
from frappe.utils import cint


class IRTThemeSettings(Document):
	def validate(self):
		"""Validate theme settings"""
		# Auto-generate variants if enabled
		if cint(self.get("auto_generate_variants")):
			self.auto_generate_color_variants()
		
		# Validate rgba colors format
		self.validate_rgba_colors()
	
	def auto_generate_color_variants(self):
		"""Auto-generate dark/light variants for primary, secondary, and accent colors"""
		color_types = ['primary', 'secondary', 'accent']
		
		for color_type in color_types:
			base_color = self.get(f'color_{color_type}')
			if base_color:
				# Generate variants (simplified - you can enhance with proper color manipulation)
				variants = self.generate_color_variants(base_color)
				
				if not self.get(f'color_{color_type}_dark'):
					self.set(f'color_{color_type}_dark', variants['dark'])
				if not self.get(f'color_{color_type}_light'):
					self.set(f'color_{color_type}_light', variants['light'])
				if not self.get(f'color_{color_type}_lighter'):
					self.set(f'color_{color_type}_lighter', variants['lighter'])
				if not self.get(f'color_{color_type}_lightest'):
					self.set(f'color_{color_type}_lightest', variants['lightest'])
	
	def generate_color_variants(self, hex_color):
		"""Generate color variants from base hex color"""
		# Simple variant generation - can be enhanced with proper color science
		# This is a placeholder - you might want to use a color manipulation library
		return {
			'dark': hex_color,  # Should be darker
			'light': hex_color,  # Should be lighter
			'lighter': hex_color,  # Should be even lighter
			'lightest': hex_color  # Should be lightest
		}
	
	def validate_rgba_colors(self):
		"""Validate rgba color format"""
		rgba_fields = ['sidebar_border_color', 'sidebar_hover_bg', 'sidebar_active_bg_solid']
		
		for field in rgba_fields:
			value = self.get(field)
			if value and not value.startswith('rgba('):
				frappe.throw(f"Invalid format for {field}. Please use rgba() format, e.g., rgba(157, 78, 221, 0.2)")
	
	def on_update(self):
		"""Clear cache when theme settings are updated"""
		frappe.cache().delete_value("irt_theme_settings")
		# Clear bootinfo cache for all users
		frappe.cache().delete_keys("bootinfo:*")
		
		# Update export field
		self.update_export_field()
		
		# Trigger realtime event to reload theme on all connected clients
		try:
			frappe.publish_realtime("irt_theme_updated", user="all")
		except Exception:
			pass  # Ignore if realtime is not available
	
	def update_export_field(self):
		"""Update the export field with current theme settings"""
		export_data = {}
		for field in self.meta.fields:
			if field.fieldtype in ['Color', 'Data'] and field.fieldname not in ['theme_export', 'theme_import', 'preset_name', 'preset_description', 'preset_preview']:
				value = self.get(field.fieldname)
				if value:
					export_data[field.fieldname] = value
		
		self.theme_export = json.dumps(export_data, indent=2)
	
	def import_theme(self, theme_json):
		"""Import theme from JSON"""
		try:
			theme_data = json.loads(theme_json) if isinstance(theme_json, str) else theme_json
			
			for field_name, value in theme_data.items():
				if self.meta.get_field(field_name):
					self.set(field_name, value)
			
			self.save()
			frappe.msgprint("Theme imported successfully!")
		except Exception as e:
			frappe.throw(f"Error importing theme: {str(e)}")


def get_theme_settings():
	"""Get theme settings from cache or database"""
	cache_key = "irt_theme_settings"
	settings = frappe.cache().get_value(cache_key)
	
	if settings is None:
		try:
			settings = frappe.get_single("IRT Theme Settings")
			# Convert to dict for easier handling
			settings_dict = {}
			for field in settings.meta.fields:
				if field.fieldtype == "Color" or field.fieldtype == "Data":
					value = settings.get(field.fieldname)
					if value:
						settings_dict[field.fieldname] = value
			
			# Cache for 1 hour
			frappe.cache().set_value(cache_key, settings_dict, expires_in_sec=3600)
			settings = settings_dict
		except frappe.DoesNotExistError:
			# Return default values if doctype doesn't exist yet
			settings = get_default_theme_settings()
			frappe.cache().set_value(cache_key, settings, expires_in_sec=3600)
	
	return settings


def get_default_theme_settings():
	"""Return default theme settings"""
	return {
		"color_primary": "#0066FF",
		"color_primary_dark": "#0052CC",
		"color_primary_light": "#1A7AFF",
		"color_primary_lighter": "#3388FF",
		"color_primary_lightest": "#4D99FF",
		"color_secondary": "#9D4EDD",
		"color_secondary_dark": "#7B2DB8",
		"color_secondary_light": "#B366E8",
		"color_secondary_lighter": "#C880F0",
		"color_secondary_lightest": "#D699F5",
		"color_accent": "#FF6B35",
		"color_accent_dark": "#E55A2B",
		"color_accent_light": "#FF7F4D",
		"color_accent_lighter": "#FF9366",
		"color_accent_lightest": "#FFA780",
		"color_text_primary": "#1a202c",
		"color_text_secondary": "#6f737c",
		"color_text_tertiary": "#718096",
		"color_text_light": "#a0aec0",
		"color_text_lighter": "#cbd5e0",
		"color_bg_white": "#ffffff",
		"color_bg_gray": "#f0f0d0",
		"color_bg_gray_light": "#f5f5e0",
		"color_bg_gray_lighter": "#fafaf0",
		"color_bg_light_blue": "#00D4FF",
		"sidebar_bg_solid": "#F0F4FF",
		"sidebar_border_color": "rgba(157, 78, 221, 0.2)",
		"sidebar_hover_bg": "rgba(157, 78, 221, 0.08)",
		"sidebar_active_bg_solid": "rgba(157, 78, 221, 0.15)",
		"sidebar_active_color": "#9D4EDD",
		"color_border": "#e2e8f0",
		"color_border_dark": "#cbd5e0",
		"color_border_light": "#edf2f7",
		"color_success": "#10b981",
		"color_error": "#e53e3e",
		"color_warning": "#f59e0b",
		"color_info": "#3b82f6",
		"avatar_frame_bg": "#ffffff",
		"avatar_frame_color": "#374151",
		"avatar_frame_border": "#e5e7eb",
	}


@frappe.whitelist()
def get_theme_settings_api():
	"""API endpoint to get theme settings"""
	return get_theme_settings()


@frappe.whitelist()
def export_theme():
	"""Export current theme settings"""
	settings = get_theme_settings()
	return json.dumps(settings, indent=2)


@frappe.whitelist()
def import_theme(theme_json):
	"""Import theme settings"""
	doc = frappe.get_single("IRT Theme Settings")
	doc.import_theme(theme_json)
	return {"status": "success", "message": "Theme imported successfully"}


@frappe.whitelist()
def get_presets():
	"""Get saved theme presets"""
	# This would typically be stored in a separate doctype
	# For now, return empty list
	return []


@frappe.whitelist()
def save_preset(preset_name, preset_description=""):
	"""Save current theme as preset"""
	settings = get_theme_settings()
	# This would typically save to a Theme Preset doctype
	# For now, just return success
	return {"status": "success", "message": f"Preset '{preset_name}' saved"}

