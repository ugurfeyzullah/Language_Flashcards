# 🎴 Language Flash Cards v1.0.2

A simple German language flashcard application for learning vocabulary.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   python app.py
   ```

2. **Open your browser to:** `http://localhost:8000`

3. **Login with built-in account:**
   - Username: `user`
   - Password: `password123`

## ✨ Features

- **German flashcards** with audio and images
- **Local storage** - your progress is saved in your browser
- **Multiple accounts** - create and switch between users
- **Progress tracking** - known vs learning cards
- **Favorites** - star important cards
- **Responsive design** - works on mobile and desktop

## 📁 File Structure

```
Language_Flashcards/
├── app.py              # Simple HTTP server
├── index.html          # Main application
├── app.js              # Application logic
├── auth.js             # Authentication system
├── styles.css          # Styling
├── flashcards.json     # Flashcard data
├── word_audio/         # Audio files
├── word_images/        # Image files
└── README.md           # This file
```

## 🎯 How to Use

1. **Cards show German words first** - tap to flip and see English translation
2. **Swipe right** (or click ▶️) when you know the word
3. **Swipe left** when you need more practice
4. **Tap the star** to add cards to favorites
5. **Click the speaker** to hear pronunciation

## 💾 Data Storage

All user data is stored locally in your browser's localStorage:
- User accounts and passwords
- Learning progress (known/learning cards)
- Favorites and settings
- Session information

## 🔧 Technical Notes

- No database required - everything runs locally
- Uses browser localStorage for persistence
- Simple Python HTTP server for file serving
- Works offline once loaded

---

**Version:** 1.0.2  
**Built-in Account:** user / password123
