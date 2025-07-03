# Language Flash Cards - User Management System

## Overview

The Language Flash Cards application now includes a comprehensive user management system with server-side data persistence. Users can create accounts, log in, and have their learning progress automatically saved and restored across sessions and devices.

## Features

### 🔐 User Authentication
- **User Registration**: Create new accounts with username and optional email
- **Secure Login**: Password-protected user sessions
- **Session Management**: Automatic session validation and renewal
- **Logout**: Secure session termination

### 💾 Progress Persistence
- **Automatic Saving**: Progress is automatically saved to the server
- **Cross-Device Sync**: Access your progress from any device
- **Learning History**: Track your learning journey over time
- **Statistics**: Detailed learning analytics and progress tracking

### 📊 User Data Stored
Each user's JSON file contains:
- **Learning Progress**: Known cards, cards still learning
- **Preferences**: Theme, settings, last card position
- **Statistics**: Session data, learning streaks, performance metrics
- **Security**: Encrypted passwords with salt-based hashing

## File Structure

```
Language_Flashcards/
├── users/                     # User data directory
│   ├── username1.json         # User 1's progress file
│   ├── username2.json         # User 2's progress file
│   └── ...
├── user_manager.py            # User management backend
├── server_with_users.py       # Enhanced server with user API
├── server_auth.js             # Frontend authentication
├── app.js                     # Main application (updated)
├── index.html                 # Main HTML file (updated)
├── styles.css                 # Styles including login screen
└── start_server_users.bat     # Windows startup script
```

## Getting Started

### 1. Start the Server

**Option A: Using Python directly**
```bash
python server_with_users.py
```

**Option B: Using the batch file (Windows)**
```bash
start_server_users.bat
```

### 2. Open the Application
- The browser will automatically open to `http://localhost:8000`
- If it doesn't open automatically, navigate there manually

### 3. Create an Account
- Click "Sign Up" on the login screen
- Enter a username (3+ characters, alphanumeric/hyphens/underscores)
- Enter a password (6+ characters)
- Optionally enter an email address
- Click "Sign Up"

### 4. Start Learning
- After successful registration, you can immediately sign in
- Your progress will be automatically saved as you learn
- Log out and log back in to see your progress restored

## API Endpoints

The server provides RESTful API endpoints for user management:

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/validate` - Validate session token

### Progress Management
- `GET /api/progress` - Get user's learning progress
- `POST /api/progress` - Save user's learning progress
- `GET /api/user/stats` - Get user's learning statistics

## User Data Structure

Each user's JSON file contains:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2025-07-02T10:00:00",
  "last_login": "2025-07-02T15:30:00",
  "progress": {
    "known_cards": ["card_1", "card_2", "card_5"],
    "learning_cards": ["card_3", "card_4"],
    "total_sessions": 15,
    "total_cards_learned": 25,
    "streak_days": 7,
    "last_session_date": "2025-07-02",
    "preferences": {
      "theme": "dark",
      "auto_play_audio": true,
      "show_pronunciation": true,
      "cards_per_session": 20
    }
  },
  "statistics": {
    "sessions_by_date": {
      "2025-07-02": {
        "sessions": 3,
        "new_cards_learned": 5,
        "cards_reviewed": 12
      }
    },
    "learning_progress": [...],
    "difficulty_ratings": {...}
  }
}
```

## Security Features

### Password Security
- Passwords are hashed using PBKDF2 with SHA-256
- Each password uses a unique random salt
- 100,000 iterations for strong protection against brute force attacks

### Session Management
- Session tokens are cryptographically secure random strings
- Sessions expire after 30 days of inactivity
- Tokens are validated on every API request

### Data Protection
- User files are stored with safe filenames (alphanumeric characters only)
- Input validation on all user data
- Error handling prevents information leakage

## Technical Implementation

### Backend (`user_manager.py`)
- **UserManager Class**: Handles all user operations
- **File-based Storage**: Each user gets their own JSON file
- **Progress Tracking**: Automatic session and learning statistics
- **Security**: Industry-standard password hashing

### Frontend (`server_auth.js`)
- **ServerAuthManager Class**: Handles client-side authentication
- **Session Persistence**: Stores session tokens in localStorage
- **Automatic Login**: Validates and restores sessions on page load
- **Progress Sync**: Automatically saves progress to server

### Server (`server_with_users.py`)
- **Custom HTTP Handler**: Extends basic HTTP server with API endpoints
- **RESTful API**: Standard HTTP methods and JSON responses
- **CORS Support**: Enables cross-origin requests
- **Error Handling**: Comprehensive error responses

## Migration from Previous Version

If you were using the previous version (v1.x) with localStorage-only data:

1. **Your old data is safe**: The old localStorage data remains untouched
2. **Create an account**: Register a new account in the new system
3. **Manual migration**: You can manually recreate your progress, or
4. **Hybrid mode**: The app can work with both systems simultaneously

## Troubleshooting

### Server Won't Start
- **Port in use**: Change the PORT variable in `server_with_users.py`
- **Python not found**: Ensure Python 3.6+ is installed and in PATH
- **Permission errors**: Run as administrator if needed

### Can't Create Account
- **Username taken**: Try a different username
- **Invalid characters**: Use only letters, numbers, hyphens, underscores
- **Password too short**: Use at least 6 characters

### Progress Not Saving
- **Network issues**: Check console for error messages
- **Session expired**: Log out and log back in
- **Server errors**: Check the server terminal for error messages

### Lost Progress
- **User file exists**: Check if your username.json file exists in the `users/` folder
- **File corruption**: User files are human-readable JSON, can be manually edited if needed
- **Backup recommended**: Regularly backup the `users/` folder

## Development

### Adding Features
- **User Manager**: Extend `UserManager` class in `user_manager.py`
- **API Endpoints**: Add new routes in `server_with_users.py`
- **Frontend**: Update `ServerAuthManager` in `server_auth.js`

### Testing
Run the built-in test by executing:
```bash
python user_manager.py
```

This creates a test user, saves progress, and validates all functionality.

## Version History

- **v2.0**: Server-side user management and progress persistence
- **v1.x**: Client-side localStorage-only system

## Support

For issues, questions, or feature requests:
1. Check the browser console for error messages
2. Check the server terminal for server-side errors
3. Verify the `users/` directory has proper permissions
4. Ensure the server is running and accessible

The user management system provides a robust, secure foundation for learning progress that persists across sessions and devices, enabling a seamless language learning experience.
