# 🚀 PythonAnywhere Deployment - Quick Start

Your Language Flash Cards app is ready for deployment! Here's the quickest path to get it online:

## 🎯 5-Minute Deployment Steps

### 1. Create Account (2 minutes)
- Go to [pythonanywhere.com](https://www.pythonanywhere.com)
- Sign up for free account
- Choose a username (this becomes your URL)

### 2. Upload Files (1 minute)
**Option A - Git (Recommended):**
```bash
# In PythonAnywhere console:
git clone https://github.com/yourusername/your-repo.git
mv your-repo/* /home/yourusername/mysite/
```

**Option B - Manual Upload:**
- Files tab → Create `/home/yourusername/mysite/`
- Upload all your project files there

### 3. Install Dependencies (1 minute)
```bash
# In PythonAnywhere console:
cd /home/yourusername/mysite
pip3.10 install --user flask flask-sqlalchemy flask-cors werkzeug==2.2.3
```

### 4. Configure Web App (1 minute)
- Web tab → "Add new web app" → Manual → Python 3.10
- Click WSGI file link, replace content with:
```python
import sys
import os

# Replace 'yourusername' with YOUR username
project_home = '/home/yourusername/mysite'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

os.environ['FLASK_ENV'] = 'production'
os.environ['SECRET_KEY'] = 'your-random-secret-key-here'

from server import app as application
```

- Add static files:
  - `/word_audio/` → `/home/yourusername/mysite/word_audio/`
  - `/word_images/` → `/home/yourusername/mysite/word_images/`

### 5. Initialize & Launch (30 seconds)
```bash
# In console:
cd /home/yourusername/mysite
python3.10 deploy.py
```
- Web tab → Click "Reload"
- Visit: `https://yourusername.pythonanywhere.com`

## 🎉 You're Live!

Your app will be available at: **`https://yourusername.pythonanywhere.com`**

### Features Working:
- ✅ Direct app access (no login required)
- ✅ Anonymous flashcard usage  
- ✅ Login prompt when saving progress
- ✅ User registration & authentication
- ✅ Progress tracking & favorites
- ✅ Audio & image support
- ✅ Responsive mobile design

## 🔧 Troubleshooting

**App not loading?**
- Check Web tab → Error log
- Verify username in WSGI file
- Run: `python3.10 -c "from server import app"`

**Database issues?**
- Run: `python3.10 deploy.py`
- Check: `ls -la flashcards.db`

**Static files not loading?**
- Verify paths in Web tab → Static files
- Check files exist in directories

## 📚 Detailed Guides
- `DEPLOYMENT.md` - Complete step-by-step guide
- `deployment-checklist.md` - Checklist format
- `test_deployment.py` - Test before deploying

---

**Need help?** Check the error logs or try the test script first!
