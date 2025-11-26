# SCSS Component-Based Design System

## Structure

This directory contains a component-based SCSS architecture following standard UI patterns.

### Core Files
- `_variables.scss` - Design tokens (colors, spacing, typography, etc.)
- `_mixins.scss` - Reusable mixins for common patterns
- `main.scss` - Main import file that combines all components

### Component Files
- `02-global.scss` - Base styles and resets
- `03-sidebar.scss` - Sidebar navigation component
- `04-layout.scss` - Main layout and filter components
- `05-header.scss` - Header/navbar component
- `06-buttons.scss` - Button components
- `07-forms.scss` - Form input components
- `08-tables.scss` - Table/list view components
- `09-cards.scss` - Card/panel components
- `10-modals.scss` - Modal dialog components
- `11-badges-alerts.scss` - Badge and alert components
- `12-scrollbar.scss` - Custom scrollbar styling
- `13-utilities.scss` - Utility classes (minimal)
- `14-responsive.scss` - Responsive breakpoints

## Compilation

To compile SCSS to CSS:
```bash
cd apps/irt_hrms/irt_hrms/public/css/custom/sections
sass main.scss main.css --style compressed
bench build --app irt_hrms
```

## Design Principles

- **Component-Based**: Each file represents a distinct UI component
- **DRY**: Variables and mixins eliminate code duplication
- **Standard Patterns**: Follows Frappe and modern UI best practices
- **Minimal !important**: Only used when necessary for overrides
- **Consistent**: Unified design system with shared variables

## Variables

All design tokens are defined in `_variables.scss`:
- Colors (primary, secondary, status, backgrounds, text, borders)
- Spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- Typography (sizes, weights, line-heights)
- Borders & radius
- Shadows
- Layout dimensions
- Transitions
- Z-index layers

## Mixins

Reusable patterns in `_mixins.scss`:
- `border()` - Standard border
- `border-top/bottom/left/right()` - Directional borders
- `border-radius()` - Border radius
- `flex-center()` - Flexbox centering
- `flex-between()` - Flexbox space-between
- `shadow()` - Box shadows (sm, md, lg, xl)
- `transition()` - CSS transitions
- `focus-ring()` - Focus states
- `button-base()` - Base button styles
- `input-base()` - Base input styles
- `input-focus()` - Input focus states
- `input-hover()` - Input hover states

## Usage

Import in your SCSS files:
```scss
@import 'variables';
@import 'mixins';

.my-component {
	@include flex-center;
	@include border;
	@include shadow(md);
}
```

