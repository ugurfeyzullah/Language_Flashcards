# Language Flash Cards - Server Edition

A language learning application with user authentication and progress tracking, powered by Flask and SQLite.

## Features

### 🎯 **Learning Experience**
- **4,074 German-English flashcards** from real educational content
- **Audio pronunciation** for German words (auto-play on new cards)
- **Visual images** to enhance learning
- **Level-based progression** (A1, A2, B1)
- **Swipe gestures** for mobile-friendly interaction

### 👤 **User Management**
- **User registration and login**
- **Secure password hashing**
- **Session management**
- **Individual progress tracking**

### 📊 **Progress Tracking**
- **Card statistics** (known, learning, attempts, accuracy)
- **Study sessions** with time tracking
- **Favorites system**
- **Learning analytics**
- **Progress export/import**

### 🗄️ **Database Features**
- **SQLite database** for persistence
- **User progress** saved automatically
- **Session tracking** for study analytics
- **Favorite cards** management

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python server.py
```

### 3. Open Your Browser
Navigate to: **http://localhost:5000**

## File Structure

```
Language_Flashcards/
├── server.py              # Flask server with database
├── app.py                 # Original simple HTTP server (backup)
├── auth_server.js         # Client-side authentication for Flask
├── auth.js                # Original client-side auth (backup)
├── app.js                 # Main application logic
├── index.html             # Application interface
├── styles.css             # Application styling
├── data_processor.py      # Excel to JSON converter
├── requirements.txt       # Python dependencies
├── flashcards.json        # Processed flashcard data (4,074 cards)
├── flashcards.db          # SQLite database (auto-created)
├── word_audio/            # German pronunciation files (.mp3)
├── word_images/           # Visual learning aids (.jpg, .png)
└── English Compass Wordlist A1_A2_B1 21 06 11.xlsx  # Source data
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Securely hashed password
- `created_at` - Registration date
- `last_login` - Last login timestamp

### User Progress Table
- `user_id` - Foreign key to users
- `card_id` - Flashcard identifier
- `known_count` - Times marked as "known"
- `learning_count` - Times marked as "still learning"
- `total_attempts` - Total interactions
- `correct_attempts` - Successful attempts
- `first_seen` - First interaction date
- `last_seen` - Last interaction date
- `study_streak` - Consecutive correct answers
- `difficulty_rating` - Adaptive difficulty (0.0-1.0)

### User Favorites Table
- `user_id` - Foreign key to users
- `card_id` - Flashcard identifier
- `created_at` - When favorited

### User Sessions Table
- `user_id` - Foreign key to users
- `session_start` - Session start time
- `session_end` - Session end time
- `cards_studied` - Cards viewed in session
- `cards_known` - Cards marked as known
- `cards_learning` - Cards marked as learning
- `total_time_seconds` - Session duration

## API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Progress Management
- `GET /api/progress` - Get user's learning progress
- `POST /api/progress` - Save progress for a card
- `GET /api/favorites` - Get user's favorite cards
- `POST /api/favorites` - Toggle card as favorite

### Session Tracking
- `POST /api/session/start` - Start new study session
- `POST /api/session/end` - End current study session
- `GET /api/stats` - Get learning statistics

## Usage Instructions

### First Time Setup
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Start Learning**: Begin studying German vocabulary

### Learning Flow
1. **View Card**: German word appears with image and pronunciation
2. **Listen**: Audio plays automatically
3. **Flip Card**: Click/tap to see English translation
4. **Swipe Decision**:
   - **Swipe Right** → "I know this word"
   - **Swipe Left** → "Still learning"
5. **Continue**: Move to next card automatically

### Progress Tracking
- **Know Counter**: Shows words you've mastered
- **Learning Counter**: Shows words you're still practicing
- **Progress Bar**: Your position in the deck
- **Session Stats**: Time spent and cards studied

### Keyboard Shortcuts
- **Space** - Flip card
- **Arrow Right** - Mark as known
- **Arrow Left** - Mark as learning
- **A** - Play audio
- **U** - Undo last action

## Deployment

### Local Development
The current setup uses Flask's development server on `localhost:5000`.

### Production Deployment
For production deployment, consider:

1. **Use a production WSGI server** (e.g., Gunicorn, uWSGI)
2. **Configure a reverse proxy** (e.g., Nginx)
3. **Use a production database** (e.g., PostgreSQL)
4. **Set environment variables**:
   - `SECRET_KEY` - Flask secret key
   - `DATABASE_URL` - Database connection string
   - `DEBUG=False` - Disable debug mode

### Environment Variables
```bash
export SECRET_KEY="your-secret-key-here"
export DATABASE_URL="sqlite:///flashcards.db"
export DEBUG=False
export PORT=5000
```

## Data Management

### Adding New Flashcards
1. Update the Excel file with new vocabulary
2. Run `python data_processor.py` to regenerate JSON
3. Restart the server

### Exporting User Data
Users can export their progress via the settings menu, which downloads a JSON file containing:
- User information
- Learning progress
- Study statistics
- Favorite cards

### Database Backup
```bash
# Backup SQLite database
cp flashcards.db flashcards_backup_$(date +%Y%m%d).db

# View database structure
sqlite3 flashcards.db ".schema"

# Query user stats
sqlite3 flashcards.db "SELECT username, COUNT(*) as progress_entries FROM user LEFT JOIN user_progress ON user.id = user_progress.user_id GROUP BY username;"
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `server.py` or stop other services
2. **Database locked**: Restart the server
3. **Audio not playing**: Check browser auto-play policies
4. **Images not loading**: Verify file paths in `word_images/` directory

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction for audio)
- **Mobile browsers**: Full support with touch gestures

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make changes**
4. **Test thoroughly**
5. **Submit a pull request**

## License

Educational use only. Please respect the source materials and audio/image copyrights.

---

## Technical Architecture

### Frontend
- **Vanilla JavaScript** for interactivity
- **CSS Grid/Flexbox** for responsive layout
- **Touch/Mouse events** for swipe gestures
- **Web Audio API** for pronunciation playback
- **Fetch API** for server communication

### Backend
- **Flask** web framework
- **SQLAlchemy** ORM for database operations
- **Werkzeug** for password hashing
- **Flask-CORS** for cross-origin requests
- **SQLite** for data persistence

### Security Features
- **Password hashing** with Werkzeug
- **Session management** with secure cookies
- **CSRF protection** via Flask sessions
- **SQL injection prevention** via SQLAlchemy ORM
- **XSS protection** via template escaping

Your language learning app is now a full-featured web application with user authentication and progress tracking! 🎉
