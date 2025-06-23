# Debug Mode Instructions

## How to Enable Debug Mode

To enable debug mode and see detailed authentication information:

1. **Open your browser's console** (F12 → Console tab)
2. **Run this command**:
   ```javascript
   localStorage.setItem('flashcards-debug', 'true'); location.reload();
   ```
3. **You'll see a debug panel** in the top-right corner with:
   - Current user status
   - Session information
   - Real-time authentication state

## Available Debug Features

### 🔍 **Debug Panel**
- Shows current user (Anonymous or logged in)
- Shows session status (Active or None)
- Shows authentication state changes

### ⌨️ **Login Access Methods**
1. **Login Prompt Button** - "💾 Log in to save your progress"
2. **Fallback Login Button** - Bottom-left floating button (👤)
3. **Keyboard Shortcut** - `Ctrl+L` for anonymous users
4. **Triple-Click** - Click anywhere 3 times quickly (emergency access)

### 🔧 **Troubleshooting Commands**

**Check session status:**
```javascript
fetch('/api/debug/session', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

**Force login screen:**
```javascript
window.authManager.showLoginScreen();
```

**Check current user:**
```javascript
console.log('Current user:', window.authManager.currentUser);
```

## Common Issues & Solutions

### 🔄 **"Can't access login after refresh"**
- Look for the floating 👤 button (bottom-left)
- Try `Ctrl+L` keyboard shortcut
- Triple-click anywhere on the page
- Check console for error messages

### 💾 **"Sessions not persisting"**
- Enable debug mode to see session status
- Check if SECRET_KEY is consistent on server
- Verify cookies are being set (check Network tab)

### 📱 **"Mobile keyboard issues"**
- Clear browser cache
- Try different mobile browser
- Check if keyboard language is compatible

## Disable Debug Mode

To disable debug mode:
```javascript
localStorage.setItem('flashcards-debug', 'false'); location.reload();
```

Or click the "Disable Debug" button in the debug panel.
