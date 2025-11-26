# UI Customizations Documentation

This document tracks all UI customizations made to the IRT HRMS application.

## Folder Structure

```
irt_hrms/
├── public/
│   ├── css/
│   │   └── custom/
│   │       ├── login.css          # Login page custom styles
│   │       └── README.md          # CSS folder documentation
│   ├── js/
│   │   └── custom/
│   │       ├── login.js           # Login page custom JavaScript
│   │       └── README.md          # JS folder documentation
│   └── images/
│       └── logo.png               # Custom logo for login page
└── www/
    ├── login.html                 # Custom login template
    └── login.py                   # Custom login context override
```

## Changes Made

### Login Page (`/login`)

#### Files Modified/Created:
1. **`www/login.html`** - Custom login template
2. **`www/login.py`** - Login context override for custom logo
3. **`public/css/custom/login.css`** - All login page styling
4. **`public/js/custom/login.js`** - Login page JavaScript functionality

#### Features Implemented:
- ✅ Custom logo from `/assets/irt_hrms/images/logo.png`
- ✅ Modern gradient background (purple/blue)
- ✅ Enhanced card design with shadows
- ✅ Improved input fields with focus states
- ✅ Eye icon toggle for password visibility (replaced show/hide text)
- ✅ Removed "Forgot Password" functionality completely
- ✅ Removed "Login with Email Link" functionality completely
- ✅ Removed all sign-up functionality
- ✅ Responsive design for mobile devices
- ✅ Smooth animations and transitions
- ✅ Better hover states and interactions

#### Removed Features:
- ❌ Forgot Password section
- ❌ Login with Email Link section
- ❌ Sign up section
- ❌ Forgot password links and handlers

#### UI Improvements:
- Modern glassmorphism-style card
- Gradient background with overlay effects
- Larger, more accessible input fields
- Eye icon for password toggle (instead of text)
- Better button styling with hover effects
- Improved spacing and typography
- Enhanced visual feedback on interactions

## How to Track Future Changes

1. **Add new CSS files** to `public/css/custom/` and document in folder README
2. **Add new JS files** to `public/js/custom/` and document in folder README
3. **Update this document** when making new UI customizations
4. **Use descriptive file names** that indicate what they customize
5. **Add comments** in code files explaining changes

## Notes

- All custom files are organized by functionality
- Each folder contains a README for documentation
- CSS and JS are separated for better maintainability
- Templates override Frappe defaults via `www/` directory
- Context overrides use hooks in `hooks.py`

## Maintenance

When updating UI:
1. Keep changes organized by page/feature
2. Update relevant README files
3. Update this main documentation
4. Test on multiple screen sizes
5. Ensure compatibility with Frappe updates

