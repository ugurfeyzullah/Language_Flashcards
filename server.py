#!/usr/bin/env python3
"""
Flask server for the Language Flash Cards web application.
Handles user authentication, progress tracking, and API endpoints.
"""

from flask import Flask, request, jsonify, session, send_from_directory, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import sys
import json
import webbrowser
from pathlib import Path
import logging

# Configuration
app = Flask(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)

# Get configuration from environment variables for production
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///flashcards.db')
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

# Session configuration for better persistence
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Only set secure cookies if using HTTPS
if FLASK_ENV == 'production':
    # PythonAnywhere provides HTTPS, so we can use secure cookies
    app.config['SESSION_COOKIE_SECURE'] = True
else:
    # For local development (HTTP), don't require secure cookies
    app.config['SESSION_COOKIE_SECURE'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Get the directory where the script is located
BASE_DIR = Path(__file__).parent

@app.before_request
def log_request_info():
    """Log session and cookie info for debugging."""
    app.logger.info(f'Path: {request.path}')
    app.logger.info(f'Session: {session}')
    app.logger.info(f'Cookies: {request.cookies}')

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    progress = db.relationship('UserProgress', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('UserFavorite', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat()
        }

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.String(50), nullable=False)
    
    # Progress tracking
    known_count = db.Column(db.Integer, default=0)
    learning_count = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)
    correct_attempts = db.Column(db.Integer, default=0)
    
    # Timestamps
    first_seen = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    last_known = db.Column(db.DateTime)
    last_learning = db.Column(db.DateTime)
    
    # Study statistics
    study_streak = db.Column(db.Integer, default=0)
    difficulty_rating = db.Column(db.Float, default=0.5)  # 0.0 = easy, 1.0 = hard
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'card_id', name='_user_card_progress'),)
    
    def to_dict(self):
        return {
            'card_id': self.card_id,
            'known_count': self.known_count,
            'learning_count': self.learning_count,
            'total_attempts': self.total_attempts,
            'correct_attempts': self.correct_attempts,
            'accuracy': self.correct_attempts / max(self.total_attempts, 1),
            'first_seen': self.first_seen.isoformat(),
            'last_seen': self.last_seen.isoformat(),
            'study_streak': self.study_streak,
            'difficulty_rating': self.difficulty_rating
        }

class UserFavorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'card_id', name='_user_card_favorite'),)

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_start = db.Column(db.DateTime, default=datetime.utcnow)
    session_end = db.Column(db.DateTime)
    cards_studied = db.Column(db.Integer, default=0)
    cards_known = db.Column(db.Integer, default=0)
    cards_learning = db.Column(db.Integer, default=0)
    total_time_seconds = db.Column(db.Integer, default=0)

# Helper Functions
def get_current_user():
    """Get the current logged-in user."""
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

def require_auth():
    """Decorator to require authentication."""
    def decorator(f):
        def wrapper(*args, **kwargs):
            if not get_current_user():
                return jsonify({'error': 'Authentication required'}), 401
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# API Routes

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('username') or not data.get('password') or not data.get('email'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log the user in
        session.clear()
        session['user_id'] = user.id
        session.permanent = True
        session.modified = True # Ensure cookie is set
        app.logger.info(f"User {user.username} registered and session created: {session}")
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login a user."""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username.lower())
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create session
        session.clear()
        session['user_id'] = user.id
        session.permanent = True
        session.modified = True # Ensure cookie is set
        app.logger.info(f"User {user.username} logged in and session created: {session}")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout the current user."""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
@require_auth()
def get_user():
    """Get current user info."""
    user = get_current_user()
    return jsonify({'user': user.to_dict()})

@app.route('/api/session/status', methods=['GET'])
def session_status():
    """Check the current session status."""
    app.logger.info(f"Checking session status. Session content: {session}")
    user = get_current_user()
    if user:
        app.logger.info(f"Session valid for user: {user.username}")
        return jsonify({
            'is_logged_in': True,
            'user': user.to_dict()
        })
    else:
        app.logger.info("No valid user session found.")
        return jsonify({'is_logged_in': False})

@app.route('/api/progress', methods=['GET'])
@require_auth()
def get_progress():
    """Get user's learning progress."""
    user = get_current_user()
    progress_records = UserProgress.query.filter_by(user_id=user.id).all()
    
    progress = {}
    for record in progress_records:
        progress[record.card_id] = record.to_dict()
    
    return jsonify({'progress': progress})

@app.route('/api/progress', methods=['POST'])
@require_auth()
def save_progress():
    """Save user's learning progress."""
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not data or 'card_id' not in data:
            return jsonify({'error': 'Card ID is required'}), 400
        
        card_id = data['card_id']
        action = data.get('action')  # 'known', 'learning', 'attempt'
        
        # Find or create progress record
        progress = UserProgress.query.filter_by(
            user_id=user.id, 
            card_id=card_id
        ).first()
        
        if not progress:
            progress = UserProgress(user_id=user.id, card_id=card_id)
            db.session.add(progress)
        
        # Update progress based on action
        progress.last_seen = datetime.utcnow()
        progress.total_attempts += 1
        
        if action == 'known':
            progress.known_count += 1
            progress.correct_attempts += 1
            progress.last_known = datetime.utcnow()
            progress.study_streak += 1
            # Decrease difficulty if consistently correct
            progress.difficulty_rating = max(0.0, progress.difficulty_rating - 0.1)
            
        elif action == 'learning':
            progress.learning_count += 1
            progress.last_learning = datetime.utcnow()
            progress.study_streak = 0
            # Increase difficulty if struggling
            progress.difficulty_rating = min(1.0, progress.difficulty_rating + 0.1)
            
        elif action == 'attempt':
            # Just tracking an attempt without specific outcome
            pass
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'progress': progress.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save progress: {str(e)}'}), 500

@app.route('/api/favorites', methods=['GET'])
@require_auth()
def get_favorites():
    """Get user's favorite cards."""
    user = get_current_user()
    favorites = UserFavorite.query.filter_by(user_id=user.id).all()
    
    favorite_cards = [fav.card_id for fav in favorites]
    return jsonify({'favorites': favorite_cards})

@app.route('/api/favorites', methods=['POST'])
@require_auth()
def toggle_favorite():
    """Toggle a card as favorite."""
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not data or 'card_id' not in data:
            return jsonify({'error': 'Card ID is required'}), 400
        
        card_id = data['card_id']
        
        # Check if already favorite
        favorite = UserFavorite.query.filter_by(
            user_id=user.id, 
            card_id=card_id
        ).first()
        
        if favorite:
            # Remove from favorites
            db.session.delete(favorite)
            is_favorite = False
        else:
            # Add to favorites
            favorite = UserFavorite(user_id=user.id, card_id=card_id)
            db.session.add(favorite)
            is_favorite = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'is_favorite': is_favorite,
            'card_id': card_id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to toggle favorite: {str(e)}'}), 500

@app.route('/api/session/start', methods=['POST'])
@require_auth()
def start_session():
    """Start a new study session."""
    try:
        user = get_current_user()
        
        # Create new session
        session_record = UserSession(user_id=user.id)
        db.session.add(session_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session_record.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to start session: {str(e)}'}), 500

@app.route('/api/session/end', methods=['POST'])
@require_auth()
def end_session():
    """End the current study session."""
    try:
        user = get_current_user()
        data = request.get_json()
        
        session_id = data.get('session_id')
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        # Find the session
        session_record = UserSession.query.filter_by(
            id=session_id, 
            user_id=user.id
        ).first()
        
        if not session_record:
            return jsonify({'error': 'Session not found'}), 404
        
        # Update session with end data
        session_record.session_end = datetime.utcnow()
        session_record.cards_studied = data.get('cards_studied', 0)
        session_record.cards_known = data.get('cards_known', 0)
        session_record.cards_learning = data.get('cards_learning', 0)
        session_record.total_time_seconds = data.get('total_time_seconds', 0)
        
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to end session: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
@require_auth()
def get_stats():
    """Get user's learning statistics."""
    user = get_current_user()
    
    # Get progress stats
    progress_records = UserProgress.query.filter_by(user_id=user.id).all()
    total_cards = len(progress_records)
    known_cards = len([p for p in progress_records if p.known_count > 0])
    learning_cards = len([p for p in progress_records if p.learning_count > 0])
    
    # Get session stats
    sessions = UserSession.query.filter_by(user_id=user.id).all()
    total_sessions = len(sessions)
    total_study_time = sum(s.total_time_seconds or 0 for s in sessions)
    
    # Get recent activity
    recent_progress = UserProgress.query.filter_by(user_id=user.id)\
        .order_by(UserProgress.last_seen.desc()).limit(10).all()
    
    return jsonify({
        'stats': {
            'total_cards_studied': total_cards,
            'known_cards': known_cards,
            'learning_cards': learning_cards,
            'total_sessions': total_sessions,
            'total_study_time_seconds': total_study_time,
            'average_accuracy': sum(p.correct_attempts / max(p.total_attempts, 1) for p in progress_records) / max(total_cards, 1),
            'study_streak': max((p.study_streak for p in progress_records), default=0)
        },
        'recent_activity': [p.to_dict() for p in recent_progress]
    })

# Static file serving
@app.route('/')
def index():
    """Serve the main application."""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory(BASE_DIR, filename)

# Initialize database
def init_db():
    """Initialize the database."""
    with app.app_context():
        db.create_all()
        print("✅ Database initialized successfully")

def main():
    """Start the Flask development server."""
    try:
        # Initialize database
        init_db()
        
        # Configuration
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('DEBUG', 'True').lower() == 'true'
        
        server_url = f"http://localhost:{port}"
        
        print(f"🚀 Language Flash Cards Server (Flask + Database)")
        print(f"📍 Serving from: {BASE_DIR}")
        print(f"🌐 Server running at: {server_url}")
        print(f"🗄️  Database: SQLite (flashcards.db)")
        print(f"📱 Open the app in your browser")
        print(f"⏹️  Press Ctrl+C to stop the server")
        print("-" * 60)
        
        # Try to open browser automatically
        if not os.environ.get('NO_BROWSER'):
            try:
                webbrowser.open(server_url)
                print(f"✅ Opened {server_url} in your default browser")
            except Exception as e:
                print(f"⚠️  Could not open browser automatically: {e}")
                print(f"💡 Please manually open: {server_url}")
        
        print("-" * 60)
        
        # Start the Flask server
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
