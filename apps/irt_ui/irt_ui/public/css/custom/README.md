# IRT UI Customization - Folder Structure

## 📁 Folder Organization

All UI components are organized into 7 main categories:

### ✅ Completed
- `login.css` - Login screen styling
- `sidebar.css` - Sidebar styling
- `variables.css` - Global CSS variables
- `main.css` - Main import file

### 📂 01-core-layout/
Core layout components visible on every page
- `03-top-navigation.css` - Top navbar, search, user menu
- `04-main-content.css` - Main content area
- `05-page-headers.css` - Page titles and headers

### 📂 02-form-components/
Form-related components (most used)
- `06-form-inputs.css` - Inputs, selects, checkboxes
- `07-buttons.css` - All button styles
- `08-form-layout.css` - Form sections, tabs, fields

### 📂 03-data-display/
Data presentation components
- `09-tables-list-views.css` - Tables and list views
- `10-cards-panels.css` - Cards and panels
- `11-data-tables.css` - Data table styling

### 📂 04-interactive/
Interactive UI components
- `12-modals-dialogs.css` - Modals and dialogs
- `13-dropdowns-menus.css` - Dropdowns and menus
- `14-tooltips.css` - Tooltip styling
- `15-notifications-toasts.css` - Notifications and alerts

### 📂 05-advanced/
Advanced UI components
- `16-filters-search.css` - Filters and search bars
- `17-tabs.css` - Tab navigation
- `18-accordions-collapsible.css` - Accordions
- `19-progress-indicators.css` - Loading spinners, progress bars
- `20-badges-labels.css` - Badges and labels

### 📂 06-dashboard/
Dashboard-specific components
- `21-dashboard-layout.css` - Dashboard grid and layout
- `22-charts-graphs.css` - Charts and graphs

### 📂 07-global/
Global styling elements
- `23-typography.css` - Typography (headings, text, links)
- `24-colors-theme.css` - Color overrides (most in variables.css)
- `25-spacing-layout.css` - Spacing and layout utilities

---

## 🚀 Usage

1. Work on components **one at a time** in order
2. Each file has TODO comments for what to style
3. Use CSS variables from `variables.css` for consistency
4. Update `main.css` to import completed files
5. Test each component before moving to next

---

## 📝 Status Legend

- ✅ **Completed** - Fully styled and working
- 🚧 **In Progress** - Currently being worked on
- 📋 **TODO** - Not started yet

---

## 🎯 Next Steps

Start with: **03-top-navigation.css** (most visible component)

