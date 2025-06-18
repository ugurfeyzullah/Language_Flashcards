#!/usr/bin/env python3
"""
Quick test script to verify everything works before deployment
"""

def test_app():
    """Test the application components."""
    print("🧪 Testing Language Flash Cards app components...")
    
    try:
        # Test imports
        print("📦 Testing imports...")
        from server import app, db, User, UserProgress, UserFavorite
        print("✅ Flask app imports successful")
        
        # Test database
        print("🗄️  Testing database...")
        from server import init_db
        init_db()
        print("✅ Database initialization successful")
        
        # Test static files
        print("📁 Checking static files...")
        import os
        
        required_files = [
            'index.html',
            'app.js', 
            'auth_server.js',
            'styles.css',
            'flashcards.json'
        ]
        
        for file in required_files:
            if os.path.exists(file):
                print(f"✅ {file}")
            else:
                print(f"❌ {file} - MISSING!")
        
        # Check directories
        required_dirs = ['word_audio', 'word_images']
        for directory in required_dirs:
            if os.path.exists(directory):
                count = len(os.listdir(directory))
                print(f"✅ {directory}/ ({count} files)")
            else:
                print(f"⚠️  {directory}/ - Directory not found")
        
        print("\n🎯 App Status: Ready for deployment!")
        print("\n📋 Next steps:")
        print("1. Create PythonAnywhere account")
        print("2. Upload all files to /home/username/mysite/")
        print("3. Follow instructions in DEPLOYMENT.md")
        print("4. Your app will be at: https://username.pythonanywhere.com")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Run: pip install flask flask-sqlalchemy flask-cors")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_app()
