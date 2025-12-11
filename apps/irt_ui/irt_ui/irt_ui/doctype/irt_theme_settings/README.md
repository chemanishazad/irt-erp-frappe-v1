# IRT Theme Settings

Dynamic theme customization system for IRT ERP. This doctype allows you to change theme colors dynamically through the UI, and the changes are applied instantly across the entire application.

## Features

- **Dynamic Color Management**: Change theme colors through a user-friendly interface
- **Real-time Preview**: See color changes instantly as you modify them
- **Comprehensive Color Control**: Manage primary, secondary, accent, text, background, sidebar, border, status, and avatar colors
- **Automatic Application**: Colors are automatically applied across all CSS components
- **Cache Management**: Efficient caching system for optimal performance

## Usage

1. **Access Theme Settings**:
   - Go to: `IRT Theme Settings` (Single doctype)
   - Navigate via: Search for "IRT Theme Settings" in the search bar

2. **Modify Colors**:
   - Use the color picker fields to select new colors
   - Changes are previewed in real-time
   - Click "Save" to apply changes globally

3. **Preview Theme**:
   - Click the "Preview Theme" button to reload theme without saving
   - Useful for testing color combinations

4. **Reset to Defaults**:
   - Click "Reset to Defaults" to restore all colors to original values

## Color Categories

### Primary Colors
- Primary Color (main brand color)
- Primary Dark, Light, Lighter, Lightest variants

### Secondary Colors
- Secondary Color (complementary brand color)
- Secondary Dark, Light, Lighter, Lightest variants

### Accent Colors
- Accent Color (highlight/emphasis color)
- Accent Dark, Light, Lighter, Lightest variants

### Text Colors
- Text Primary, Secondary, Tertiary
- Text Light, Lighter

### Background Colors
- Background White, Gray variants
- Background Light Blue

### Sidebar Colors
- Sidebar Background, Border, Hover, Active states

### Border Colors
- Border, Border Dark, Border Light

### Status Colors
- Success, Error, Warning, Info

### Avatar Colors
- Avatar Background, Color, Border

## Technical Details

### How It Works

1. **Backend (Python)**:
   - Theme settings are stored in the `IRT Theme Settings` single doctype
   - Settings are cached for performance
   - Boot session hook adds settings to `frappe.boot.irt_theme_settings`

2. **Frontend (JavaScript)**:
   - `theme-settings.js` reads settings from boot data
   - CSS variables are dynamically updated using `document.documentElement.style.setProperty()`
   - Real-time updates via Frappe's realtime system

3. **CSS Variables**:
   - All colors are mapped to CSS custom properties (variables)
   - Variables are defined in `variables.css` and overridden dynamically
   - Components use these variables, so changes apply automatically

### File Structure

```
irt_ui/
├── irt_ui/
│   ├── doctype/
│   │   └── irt_theme_settings/
│   │       ├── irt_theme_settings.json (doctype definition)
│   │       ├── irt_theme_settings.py (backend logic)
│   │       └── irt_theme_settings.js (client script)
│   ├── boot.py (boot session hook)
│   └── hooks.py (app configuration)
└── public/
    └── js/
        └── custom/
            └── theme-settings.js (main theme application logic)
```

### API

**Get Theme Settings**:
```javascript
frappe.call({
    method: 'irt_ui.irt_ui.doctype.irt_theme_settings.irt_theme_settings.get_theme_settings_api',
    callback: function(r) {
        console.log(r.message); // Theme settings object
    }
});
```

**Reload Theme Programmatically**:
```javascript
if (window.irtTheme && window.irtTheme.reload) {
    window.irtTheme.reload();
}
```

**Apply Custom Theme Settings**:
```javascript
if (window.irtTheme && window.irtTheme.apply) {
    window.irtTheme.apply({
        color_primary: '#FF0000',
        color_secondary: '#00FF00'
    });
}
```

## Notes

- Theme settings are cached for 1 hour
- Cache is automatically cleared when settings are updated
- All connected users receive theme updates via realtime events
- Default values are used if doctype doesn't exist or fields are empty

## Permissions

Only users with "System Manager" role can modify theme settings.

