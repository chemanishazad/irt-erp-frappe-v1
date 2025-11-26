# IRT ERP v3 - Frappe Bench

Welcome! This is your custom Frappe/ERPNext setup with all IRT-specific customizations.

## 📁 Project Structure

```
frappe-bench/
├── apps/
│   ├── frappe/          # Frappe Framework (core)
│   ├── erpnext/         # ERPNext (core)
│   ├── hrms/            # HRMS (core)
│   └── irt_hrms/        # ✨ Your custom app (all customizations here!)
├── sites/
│   └── irt/             # Your site
├── env/                 # Python virtual environment
└── config/              # Bench configuration
```

## 🚀 Quick Commands

### Start Development Server
```bash
bench start
```
Access at: `http://localhost:8000`

### Update System
```bash
# Pull latest code from upstream
cd apps/frappe && git pull upstream develop && cd ../..
cd apps/erpnext && git pull upstream develop && cd ../..
cd apps/hrms && git pull upstream develop && cd ../..

# Update dependencies
bench setup requirements

# Build assets
bench build --force

# Run migrations
bench --site irt migrate
```

### Common Bench Commands
```bash
# Clear cache
bench --site irt clear-cache

# Restart bench
bench restart

# Check bench status
bench status

# List installed apps
bench --site irt list-apps

# Open console
bench --site irt console
```

## 📝 Where to Make Changes

### ✅ DO: Make changes in `apps/irt_hrms/`
All your customizations should go here:
- Custom DocTypes
- Custom Reports
- Custom Scripts
- Custom Forms
- Custom Workflows
- Any module customizations

### ❌ DON'T: Modify core apps directly
- `apps/frappe/` - Don't modify (upgrades will overwrite)
- `apps/erpnext/` - Don't modify (upgrades will overwrite)
- `apps/hrms/` - Don't modify (upgrades will overwrite)

**Why?** Keeping customizations in `irt_hrms` allows you to upgrade core apps without losing your work!

## 🔍 Tracking Changes with Git

All files are tracked in git so you can see every change:

```bash
# See what files changed
git status

# See changes in your custom app
git diff apps/irt_hrms/

# See changes in core apps (if you accidentally modified them)
git diff apps/frappe/
git diff apps/erpnext/
git diff apps/hrms/

# Commit your changes
git add .
git commit -m "Description of your changes"
```

### What's Ignored (not tracked)
- `env/` - Virtual environment
- `logs/` - Log files
- `*.pyc`, `__pycache__/` - Python cache
- `node_modules/` - Node dependencies
- `sites/*/site_config.json` - Contains passwords
- `sites/*/private/` - Private files

## 🛠️ Development Workflow

1. **Make changes** in `apps/irt_hrms/`
2. **Test locally** with `bench start`
3. **Check changes** with `git status`
4. **Commit changes** with `git commit`
5. **Deploy** to production

## 📦 Installed Apps

- **frappe** - Framework (v15.x.x-develop)
- **erpnext** - ERP System (v15.x.x-develop)
- **hrms** - HR Management (v16.0.0-dev)
- **irt_hrms** - Your customizations (v0.0.1)

## 🔧 Troubleshooting

### Port already in use
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or kill all bench processes
pkill -f "bench start"
```

### Clear everything and restart
```bash
bench --site irt clear-cache
bench restart
```

### Database issues
```bash
# Backup first!
bench --site irt backup

# Then migrate
bench --site irt migrate
```

## 📚 Useful Links

- [Frappe Documentation](https://frappeframework.com/docs)
- [ERPNext Documentation](https://docs.erpnext.com)
- [Frappe Forum](https://discuss.frappe.io)

## 💡 Tips

- Always backup before major changes: `bench --site irt backup`
- Use `bench --site irt console` for Python debugging
- Check logs in `logs/` directory if something goes wrong
- Keep your `irt_hrms` app updated in git regularly

---

**Happy Coding! 🎉**
