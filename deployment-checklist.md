# PythonAnywhere Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Create PythonAnywhere account
- [ ] Choose username (will be in your URL: `username.pythonanywhere.com`)
- [ ] Upload all project files to `/home/username/mysite/`
- [ ] Install Python packages: `pip3.10 install --user flask flask-sqlalchemy flask-cors`

## ✅ Configuration Checklist

- [ ] Edit WSGI file with your username and secret key
- [ ] Configure static files mapping in Web tab
- [ ] Set production environment variables
- [ ] Run database initialization: `python3.10 deploy.py`

## ✅ Testing Checklist

- [ ] Reload web app from Web tab
- [ ] Visit your app URL: `https://username.pythonanywhere.com`
- [ ] Test app loads without login (anonymous mode)
- [ ] Test user registration works
- [ ] Test user login works
- [ ] Test card swiping triggers login prompt
- [ ] Test progress saving after login
- [ ] Test audio playback works
- [ ] Test image loading works

## ✅ Troubleshooting Checklist

If something doesn't work:

- [ ] Check error logs in Web tab
- [ ] Verify all files uploaded correctly
- [ ] Test imports in console: `python3.10 -c "from server import app"`
- [ ] Check database exists: `ls -la flashcards.db`
- [ ] Verify static file paths in Web tab
- [ ] Reload web app after any changes

## 🔐 Security Checklist

- [ ] Change SECRET_KEY in wsgi.py to a random string
- [ ] Don't commit sensitive data to Git
- [ ] Use .gitignore for database and config files

## 📱 Final URLs

After successful deployment:
- **App**: `https://username.pythonanywhere.com`
- **API**: `https://username.pythonanywhere.com/api/user`

---

**Need help?** Check the detailed instructions in `DEPLOYMENT.md`
