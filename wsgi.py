#!/usr/bin/python3
"""
WSGI configuration for PythonAnywhere deployment
INSTRUCTIONS: 
1. Replace 'yourusername' with your actual PythonAnywhere username
2. Change the SECRET_KEY to a long, random string
3. Save this file as your WSGI configuration in PythonAnywhere
"""
import sys
import os

# 🔧 CHANGE THIS: Replace 'yourusername' with your PythonAnywhere username
project_home = '/home/yourusername/mysite'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# 🔐 CHANGE THIS: Set a strong, unique secret key for production
os.environ['FLASK_ENV'] = 'production'
os.environ['SECRET_KEY'] = 'your-super-secret-production-key-change-this-to-something-random-and-long'

# Import your Flask app
from server import app as application

if __name__ == "__main__":
    application.run()
