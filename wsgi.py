#!/usr/bin/python3
"""
WSGI configuration for PythonAnywhere deployment
Uses the file-based user management system.
INSTRUCTIONS: 
1. Replace 'yourusername' with your actual PythonAnywhere username
2. Change the SECRET_KEY to a long, random string
3. Save this file as your WSGI configuration in PythonAnywhere
"""
import sys
import os
from pathlib import Path

# 🔧 CHANGE THIS: Replace 'yourusername' with your PythonAnywhere username
project_home = '/home/yourusername/mysite'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# 🔐 CHANGE THIS: Set a strong, unique secret key for production
os.environ['FLASK_ENV'] = 'production'
os.environ['SECRET_KEY'] = 'ugur-flashcards-secret-key-2025-change-this-to-something-even-more-random-and-long-12345'

# Create users directory if it doesn't exist
users_dir = Path(project_home) / "users"
users_dir.mkdir(exist_ok=True)

# Import your Flask app - using app.py (file-based user management)
from app import app as application

if __name__ == "__main__":
    application.run()
