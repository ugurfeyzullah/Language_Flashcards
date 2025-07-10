#!/usr/bin/env python3
"""
User management system for Language Flash Cards application.
Handles user registration, login, and progress persistence.
"""

import json
import os
import hashlib
import secrets
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional, List


class UserManager:
    def __init__(self, users_dir: str = "users"):
        """Initialize the user manager."""
        self.users_dir = Path(users_dir)
        self.users_dir.mkdir(exist_ok=True)
        self.sessions = {}  # In-memory session storage
        
    def _hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash a password with salt."""
        if salt is None:
            salt = secrets.token_hex(16)
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        return password_hash.hex(), salt
    
    def _get_user_file_path(self, username: str) -> Path:
        """Get the file path for a user's data."""
        safe_username = "".join(c for c in username if c.isalnum() or c in "-_")
        return self.users_dir / f"{safe_username}.json"
    
    def _create_default_user_data(self, username: str, email: str = None) -> Dict:
        """Create default user data structure."""
        return {
            "username": username,
            "email": email,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "progress": {
                "known_cards": [],  # List of card IDs the user knows
                "learning_cards": [],  # List of card IDs still learning
                "total_sessions": 0,
                "total_cards_learned": 0,
                "streak_days": 0,
                "last_session_date": None,
                "preferences": {
                    "theme": "dark",
                    "auto_play_audio": True,
                    "show_pronunciation": True,
                    "cards_per_session": 20
                }
            },
            "statistics": {
                "sessions_by_date": {},  # Date -> session data
                "learning_progress": [],  # Historical progress tracking
                "difficulty_ratings": {}  # Card ID -> difficulty (1-5)
            }
        }
    
    def register_user(self, username: str, password: str, email: str = None) -> Dict:
        """Register a new user."""
        print(f"🔍 [DEBUG] Starting user registration for username: '{username}'")
        print(f"🔍 [DEBUG] Email provided: {'Yes' if email else 'No'}")
        print(f"🔍 [DEBUG] Users directory: {self.users_dir}")
        print(f"🔍 [DEBUG] Users directory exists: {self.users_dir.exists()}")
        
        try:
            # Validate username
            print(f"🔍 [DEBUG] Validating username...")
            if not username or len(username) < 3:
                print(f"❌ [DEBUG] Username validation failed: too short ({len(username) if username else 0} chars)")
                return {"success": False, "error": "Username must be at least 3 characters"}
            
            if not username.replace("-", "").replace("_", "").isalnum():
                print(f"❌ [DEBUG] Username validation failed: invalid characters")
                return {"success": False, "error": "Username can only contain letters, numbers, hyphens, and underscores"}
            
            print(f"✅ [DEBUG] Username validation passed")
            
            # Check if user already exists
            user_file = self._get_user_file_path(username)
            print(f"🔍 [DEBUG] User file path: {user_file}")
            
            if user_file.exists():
                print(f"❌ [DEBUG] User file already exists!")
                return {"success": False, "error": "Username already exists"}
            
            print(f"✅ [DEBUG] User file doesn't exist, proceeding with registration")
            
            # Validate password
            print(f"🔍 [DEBUG] Validating password...")
            if len(password) < 6:
                print(f"❌ [DEBUG] Password validation failed: too short ({len(password)} chars)")
                return {"success": False, "error": "Password must be at least 6 characters"}
            
            print(f"✅ [DEBUG] Password validation passed")
            
            # Hash password
            print(f"🔍 [DEBUG] Hashing password...")
            password_hash, salt = self._hash_password(password)
            print(f"✅ [DEBUG] Password hashed successfully (salt length: {len(salt)})")
            
            # Create user data
            print(f"🔍 [DEBUG] Creating user data structure...")
            user_data = self._create_default_user_data(username, email)
            user_data["password_hash"] = password_hash
            user_data["salt"] = salt
            print(f"✅ [DEBUG] User data structure created")
            
            # Save user data
            print(f"🔍 [DEBUG] Attempting to save user data to: {user_file}")
            print(f"🔍 [DEBUG] Parent directory exists: {user_file.parent.exists()}")
            
            # Ensure directory exists
            user_file.parent.mkdir(parents=True, exist_ok=True)
            print(f"✅ [DEBUG] Directory ensured to exist")
            
            with open(user_file, 'w', encoding='utf-8') as f:
                json.dump(user_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ [DEBUG] User data written to file")
            
            # Verify file was created
            if user_file.exists():
                file_size = user_file.stat().st_size
                print(f"✅ [DEBUG] File verification: exists={user_file.exists()}, size={file_size} bytes")
            else:
                print(f"❌ [DEBUG] File verification FAILED: file does not exist after writing!")
                return {"success": False, "error": "Failed to create user file"}
            
            print(f"✅ User registered: {username}")
            return {"success": True, "message": "User registered successfully"}
            
        except Exception as e:
            print(f"❌ Registration error: {e}")
            print(f"❌ [DEBUG] Exception type: {type(e).__name__}")
            print(f"❌ [DEBUG] Exception details: {str(e)}")
            import traceback
            print(f"❌ [DEBUG] Full traceback:")
            traceback.print_exc()
            return {"success": False, "error": f"Registration failed: {str(e)}"}
    
    def login_user(self, username: str, password: str) -> Dict:
        """Login a user and return session token."""
        try:
            user_file = self._get_user_file_path(username)
            
            if not user_file.exists():
                return {"success": False, "error": "Invalid username or password"}
            
            # Load user data
            with open(user_file, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            # Verify password
            password_hash, _ = self._hash_password(password, user_data["salt"])
            if password_hash != user_data["password_hash"]:
                return {"success": False, "error": "Invalid username or password"}
            
            # Create session
            session_token = secrets.token_urlsafe(32)
            session_data = {
                "username": username,
                "created_at": datetime.now().isoformat(),
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat()
            }
            self.sessions[session_token] = session_data
            
            # Update last login
            user_data["last_login"] = datetime.now().isoformat()
            
            # Update streak
            self._update_streak(user_data)
            
            # Save updated user data
            with open(user_file, 'w', encoding='utf-8') as f:
                json.dump(user_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ User logged in: {username}")
            return {
                "success": True, 
                "token": session_token,
                "user": {
                    "username": username,
                    "progress": user_data["progress"],
                    "preferences": user_data["progress"]["preferences"]
                }
            }
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    def _update_streak(self, user_data: Dict):
        """Update user's daily streak."""
        today = datetime.now().date()
        last_session = user_data["progress"].get("last_session_date")
        
        if last_session:
            last_date = datetime.fromisoformat(last_session).date()
            days_diff = (today - last_date).days
            
            if days_diff == 1:
                # Consecutive day
                user_data["progress"]["streak_days"] += 1
            elif days_diff > 1:
                # Streak broken
                user_data["progress"]["streak_days"] = 1
            # Same day = no change
        else:
            # First session
            user_data["progress"]["streak_days"] = 1
        
        user_data["progress"]["last_session_date"] = today.isoformat()
    
    def validate_session(self, session_token: str) -> Optional[str]:
        """Validate session token and return username if valid."""
        print(f"🔍 [SESSION DEBUG] Validating token: {session_token[:20]}...")
        print(f"🔍 [SESSION DEBUG] Active sessions: {len(self.sessions)}")
        print(f"🔍 [SESSION DEBUG] Session tokens: {[token[:20] + '...' for token in self.sessions.keys()]}")
        
        if session_token not in self.sessions:
            print(f"❌ [SESSION DEBUG] Token not found in active sessions")
            return None
        
        session = self.sessions[session_token]
        expires_at = datetime.fromisoformat(session["expires_at"])
        now = datetime.now()
        
        print(f"🔍 [SESSION DEBUG] Session expires at: {expires_at}")
        print(f"🔍 [SESSION DEBUG] Current time: {now}")
        print(f"🔍 [SESSION DEBUG] Time until expiry: {expires_at - now}")
        
        if now > expires_at:
            print(f"❌ [SESSION DEBUG] Session expired, removing from memory")
            del self.sessions[session_token]
            return None
        
        username = session["username"]
        print(f"✅ [SESSION DEBUG] Valid session for user: {username}")
        return username
    
    def logout_user(self, session_token: str) -> Dict:
        """Logout a user by invalidating their session."""
        if session_token in self.sessions:
            username = self.sessions[session_token]["username"]
            del self.sessions[session_token]
            print(f"✅ User logged out: {username}")
            return {"success": True, "message": "Logged out successfully"}
        
        return {"success": False, "error": "Invalid session"}
    
    def get_user_progress(self, username: str) -> Optional[Dict]:
        """Get user progress data."""
        try:
            user_file = self._get_user_file_path(username)
            if not user_file.exists():
                return None
            
            with open(user_file, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            return user_data["progress"]
            
        except Exception as e:
            print(f"❌ Error loading user progress: {e}")
            return None
    
    def save_user_progress(self, username: str, progress_data: Dict) -> bool:
        """Save user progress data."""
        print(f"🔍 [DEBUG] Starting progress save for user: '{username}'")
        print(f"🔍 [DEBUG] Progress data keys: {list(progress_data.keys())}")
        
        try:
            user_file = self._get_user_file_path(username)
            print(f"🔍 [DEBUG] User file path: {user_file}")
            print(f"🔍 [DEBUG] User file exists: {user_file.exists()}")
            
            if not user_file.exists():
                print(f"❌ [DEBUG] User file does not exist!")
                return False
            
            print(f"🔍 [DEBUG] Loading existing user data...")
            with open(user_file, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            print(f"✅ [DEBUG] Existing user data loaded")
            print(f"🔍 [DEBUG] Current known cards: {len(user_data['progress']['known_cards'])}")
            print(f"🔍 [DEBUG] Current learning cards: {len(user_data['progress']['learning_cards'])}")
            
            # Update progress
            old_known_count = len(user_data["progress"]["known_cards"])
            print(f"🔍 [DEBUG] Updating progress data...")
            user_data["progress"].update(progress_data)
            new_known_count = len(user_data["progress"]["known_cards"])
            
            print(f"🔍 [DEBUG] Known cards: {old_known_count} -> {new_known_count}")
            print(f"🔍 [DEBUG] Learning cards: {len(user_data['progress']['learning_cards'])}")
            
            # Update statistics
            today = datetime.now().date().isoformat()
            print(f"🔍 [DEBUG] Updating statistics for date: {today}")
            
            if today not in user_data["statistics"]["sessions_by_date"]:
                user_data["statistics"]["sessions_by_date"][today] = {
                    "sessions": 0,
                    "new_cards_learned": 0,
                    "cards_reviewed": 0
                }
                print(f"✅ [DEBUG] Created new session entry for today")
            
            session_data = user_data["statistics"]["sessions_by_date"][today]
            session_data["sessions"] += 1
            session_data["new_cards_learned"] += max(0, new_known_count - old_known_count)
            session_data["cards_reviewed"] += len(progress_data.get("known_cards", [])) + len(progress_data.get("learning_cards", []))
            
            print(f"🔍 [DEBUG] Session stats updated: sessions={session_data['sessions']}, new_learned={session_data['new_cards_learned']}")
            
            # Update total counters
            user_data["progress"]["total_sessions"] += 1
            user_data["progress"]["total_cards_learned"] = len(user_data["progress"]["known_cards"])
            
            print(f"🔍 [DEBUG] Total sessions: {user_data['progress']['total_sessions']}")
            print(f"🔍 [DEBUG] Total cards learned: {user_data['progress']['total_cards_learned']}")
            
            # Save updated data
            print(f"🔍 [DEBUG] Saving updated data to file...")
            with open(user_file, 'w', encoding='utf-8') as f:
                json.dump(user_data, f, indent=2, ensure_ascii=False)
            
            # Verify save
            if user_file.exists():
                file_size = user_file.stat().st_size
                print(f"✅ [DEBUG] File save verification: size={file_size} bytes")
            else:
                print(f"❌ [DEBUG] File save verification FAILED!")
                return False
            
            print(f"✅ Progress saved for user: {username}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving user progress: {e}")
            print(f"❌ [DEBUG] Exception type: {type(e).__name__}")
            print(f"❌ [DEBUG] Exception details: {str(e)}")
            import traceback
            print(f"❌ [DEBUG] Full traceback:")
            traceback.print_exc()
            return False
    
    def get_user_statistics(self, username: str) -> Optional[Dict]:
        """Get user statistics."""
        try:
            user_file = self._get_user_file_path(username)
            if not user_file.exists():
                return None
            
            with open(user_file, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            stats = user_data["statistics"].copy()
            stats["progress_summary"] = {
                "total_known": len(user_data["progress"]["known_cards"]),
                "total_learning": len(user_data["progress"]["learning_cards"]),
                "streak_days": user_data["progress"]["streak_days"],
                "total_sessions": user_data["progress"]["total_sessions"]
            }
            
            return stats
            
        except Exception as e:
            print(f"❌ Error loading user statistics: {e}")
            return None
    
    def list_users(self) -> List[Dict]:
        """List all users (admin function)."""
        users = []
        for user_file in self.users_dir.glob("*.json"):
            try:
                with open(user_file, 'r', encoding='utf-8') as f:
                    user_data = json.load(f)
                
                users.append({
                    "username": user_data["username"],
                    "created_at": user_data["created_at"],
                    "last_login": user_data.get("last_login"),
                    "total_sessions": user_data["progress"]["total_sessions"],
                    "cards_learned": len(user_data["progress"]["known_cards"])
                })
            except Exception as e:
                print(f"❌ Error reading user file {user_file}: {e}")
        
        return sorted(users, key=lambda x: x["created_at"], reverse=True)


# Global instance
user_manager = UserManager()


if __name__ == "__main__":
    # Test the user manager
    print("🧪 Testing User Manager...")
    
    # Test registration
    result = user_manager.register_user("testuser", "password123", "test@example.com")
    print("Registration:", result)
    
    # Test login
    result = user_manager.login_user("testuser", "password123")
    print("Login:", result)
    
    if result["success"]:
        token = result["token"]
        username = user_manager.validate_session(token)
        print(f"Session validation: {username}")
        
        # Test progress saving
        progress = {
            "known_cards": ["card_1", "card_2"],
            "learning_cards": ["card_3", "card_4", "card_5"]
        }
        success = user_manager.save_user_progress("testuser", progress)
        print(f"Progress saved: {success}")
        
        # Test progress loading
        loaded_progress = user_manager.get_user_progress("testuser")
        print("Loaded progress:", loaded_progress)
        
        # Test logout
        result = user_manager.logout_user(token)
        print("Logout:", result)
