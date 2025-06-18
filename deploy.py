#!/usr/bin/env python3
"""
Deployment script for PythonAnywhere
Run this script after uploading files to initialize the database
"""

import os
import sys
from pathlib import Path

def setup_production():
    """Setup the application for production deployment."""
    print("🚀 Setting up Language Flash Cards for production...")
    
    try:
        # Import after setting up path
        from server import init_db, app
        
        print("📚 Initializing database...")
        init_db()
        print("✅ Database initialized successfully!")
        
        print("🔧 Checking configuration...")
        
        # Check if running in production environment
        flask_env = os.environ.get('FLASK_ENV', 'development')
        print(f"   Environment: {flask_env}")
        
        # Check database file
        if os.path.exists('flashcards.db'):
            print("✅ Database file exists")
        else:
            print("⚠️  Database file not found")
            
        # Check static files
        static_dirs = ['word_audio', 'word_images']
        for directory in static_dirs:
            if os.path.exists(directory):
                file_count = len(os.listdir(directory))
                print(f"✅ {directory}/ directory exists ({file_count} files)")
            else:
                print(f"⚠️  {directory}/ directory not found")
        
        # Check main files
        main_files = ['flashcards.json', 'index.html', 'app.js', 'auth_server.js', 'styles.css']
        for file in main_files:
            if os.path.exists(file):
                print(f"✅ {file} exists")
            else:
                print(f"❌ {file} missing!")
        
        print("\n🎉 Setup complete! Your app should be ready for deployment.")
        print("\n📝 Next steps:")
        print("1. Go to PythonAnywhere Web tab")
        print("2. Click 'Reload yourusername.pythonanywhere.com'")
        print("3. Visit your app URL")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you've installed all dependencies:")
        print("pip3.10 install --user flask flask-sqlalchemy flask-cors werkzeug==2.2.3")
        return False
    except Exception as e:
        print(f"❌ Setup error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    setup_production()
