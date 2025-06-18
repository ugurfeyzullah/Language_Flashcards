# PythonAnywhere Deployment Guide for Language Flash Cards

## Prerequisites
1. Create a free account at [PythonAnywhere](https://www.pythonanywhere.com/)
2. Choose a username (this will be part of your app URL)

## Step 1: Upload Your Files

### Option A: Using Git (Recommended)
1. Upload your code to GitHub first
2. In PythonAnywhere console, clone your repository:
```bash
git clone https://github.com/yourusername/language-flashcards.git
cd language-flashcards
```

### Option B: Manual Upload
1. Go to **Files** tab in PythonAnywhere
2. Create a new directory: `/home/yourusername/mysite/`
3. Upload all your project files to this directory

## Step 2: Install Dependencies

1. Go to **Tasks** → **Console** → **Bash**
2. Navigate to your project directory:
```bash
cd /home/yourusername/mysite
```
3. Install required packages:
```bash
pip3.10 install --user flask flask-sqlalchemy flask-cors werkzeug==2.2.3
```

## Step 3: Configure Web App

1. Go to **Web** tab in PythonAnywhere dashboard
2. Click **"Add a new web app"**
3. Choose **"Manual configuration"**
4. Select **Python 3.10**
5. Click **"Next"**

## Step 4: Configure WSGI File

1. In the **Web** tab, find the **WSGI configuration file** link
2. Click on it to edit
3. Replace ALL content with:

```python
#!/usr/bin/python3
import sys
import os

# Replace 'yourusername' with your actual PythonAnywhere username
project_home = '/home/yourusername/mysite'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# Production environment variables
os.environ['FLASK_ENV'] = 'production'
os.environ['SECRET_KEY'] = 'your-super-secret-production-key-12345-change-this'

from server import app as application

if __name__ == "__main__":
    application.run()
```

## Step 5: Configure Static Files

In the **Web** tab, scroll down to **Static files** section:

| URL | Directory |
|-----|-----------|
| `/word_audio/` | `/home/yourusername/mysite/word_audio/` |
| `/word_images/` | `/home/yourusername/mysite/word_images/` |
| `/static/` | `/home/yourusername/mysite/static/` |

## Step 6: Initialize Database

1. Go to **Tasks** → **Console** → **Bash**
2. Navigate to your project:
```bash
cd /home/yourusername/mysite
```
3. Initialize the database:
```bash
python3.10 -c "from server import init_db; init_db()"
```

## Step 7: Reload and Test

1. Go back to **Web** tab
2. Click **"Reload yourusername.pythonanywhere.com"**
3. Visit your app at: `https://yourusername.pythonanywhere.com`

## Troubleshooting

### Check Error Logs
- **Web** tab → **Log files** → **Error log**
- **Web** tab → **Log files** → **Access log**

### Common Issues

**Import Error:**
```bash
# In console, test imports:
cd /home/yourusername/mysite
python3.10 -c "from server import app; print('✅ Import successful')"
```

**Database Issues:**
```bash
# Check if database file exists:
ls -la /home/yourusername/mysite/flashcards.db

# Recreate database if needed:
python3.10 -c "from server import init_db; init_db()"
```

**Static Files Not Loading:**
- Check that all paths in **Static files** section are correct
- Ensure files exist in the specified directories

### Environment Variables
To set production environment variables:
1. **Files** tab → **mysite** directory
2. Create `.env` file (optional, for local reference)

## Security Notes for Production

1. **Change the SECRET_KEY** in wsgi.py to a long, random string
2. **Never commit** sensitive keys to Git
3. **Enable HTTPS** (automatic on PythonAnywhere)

## Your App URLs

After deployment, your app will be available at:
- **Main App**: `https://yourusername.pythonanywhere.com`
- **API Endpoints**: `https://yourusername.pythonanywhere.com/api/...`

## File Structure on PythonAnywhere

```
/home/yourusername/mysite/
├── server.py              # Main Flask app
├── wsgi.py               # WSGI configuration  
├── requirements.txt      # Dependencies
├── flashcards.json       # Card data
├── word_audio/           # Audio files
├── word_images/          # Image files
├── static/               # CSS, JS files
├── *.html               # HTML templates
├── *.js                 # JavaScript files
├── *.css                # Stylesheets
└── flashcards.db        # SQLite database (created automatically)
```

## Updating Your App

To update your deployed app:

1. Upload new files or use `git pull`
2. If you changed Python dependencies, run:
   ```bash
   pip3.10 install --user [new-package]
   ```
3. **Web** tab → Click **"Reload yourusername.pythonanywhere.com"**

---

**🎉 Your Language Flash Cards app should now be live!**

Visit: `https://yourusername.pythonanywhere.com`
