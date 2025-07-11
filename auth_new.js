/**
 * Authentication system for Flash Cards App v1.0.1
 * Handles user registration, login, and session management using localStorage
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.initializeAuth();
    }

    initializeAuth() {
        console.log('🔐 Initializing authentication system...');
        
        // Check if user is already logged in
        const savedSession = localStorage.getItem('flashcard-session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (this.validateSession(session)) {
                    this.currentUser = session.username;
                    console.log(`✅ Restored session for user: ${this.currentUser}`);
                    this.showApp();
                    return;
                }
            } catch (error) {
                console.error('Invalid session data:', error);
                localStorage.removeItem('flashcard-session');
            }
        }
        
        // Show login screen if no valid session
        this.showLoginScreen();
    }

    validateSession(session) {
        // Check if session is valid (not expired, user exists)
        if (!session.username || !session.timestamp) return false;
        
        // Session expires after 30 days
        const sessionAge = Date.now() - session.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (sessionAge > maxAge) return false;
        
        // Check if user still exists
        return this.users.hasOwnProperty(session.username);
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('flashcard-users');
        if (savedUsers) {
            try {
                const users = JSON.parse(savedUsers);
                console.log('✅ Loaded users from localStorage:', Object.keys(users));
                return users;
            } catch (error) {
                console.error('Error loading users from localStorage:', error);
                return this.createDefaultUsers();
            }
        } else {
            console.log('📝 No users found, creating defaults');
            return this.createDefaultUsers();
        }
    }

    createDefaultUsers() {
        // Create built-in demo account
        const defaultUsers = {
            'user': {
                password: this.hashPassword('password123'),
                email: 'user@flashcards.local',
                createdAt: Date.now(),
                progress: {
                    knownIds: [],
                    learningIds: [],
                    history: [],
                    favourites: [],
                    lastCardIndex: 0,
                    totalSessionTime: 0,
                    streakDays: 0,
                    lastActiveDate: Date.now()
                }
            }
        };
        
        this.saveUsers(defaultUsers);
        console.log('✅ Created default built-in account: user / password123');
        return defaultUsers;
    }

    saveUsers(users = this.users) {
        try {
            localStorage.setItem('flashcard-users', JSON.stringify(users));
            console.log('💾 Users saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error saving users to localStorage:', error);
            return false;
        }
    }

    hashPassword(password) {
        // Simple hash function for demo purposes
        // In production, use a proper hashing library
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    register(username, password, email) {
        if (!username || !password || !email) {
            throw new Error('Username, password, and email are required');
        }

        username = username.trim();
        email = email.trim().toLowerCase();

        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        if (this.users[username]) {
            throw new Error('Username already exists');
        }

        // Check if email is already registered
        for (const user of Object.values(this.users)) {
            if (user.email === email) {
                throw new Error('Email already registered');
            }
        }

        // Create new user
        this.users[username] = {
            password: this.hashPassword(password),
            email: email,
            createdAt: Date.now(),
            progress: {
                knownIds: [],
                learningIds: [],
                history: [],
                favourites: [],
                lastCardIndex: 0,
                totalSessionTime: 0,
                streakDays: 0,
                lastActiveDate: Date.now()
            }
        };

        this.saveUsers();
        console.log(`✅ User registered: ${username}`);
        return true;
    }

    login(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        username = username.trim();
        console.log(`🔍 Login attempt for: ${username}`);

        const user = this.users[username];
        if (!user) {
            console.log(`❌ User not found: ${username}`);
            throw new Error('Invalid username or password');
        }

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            console.log(`❌ Password incorrect for: ${username}`);
            throw new Error('Invalid username or password');
        }

        // Create session
        this.currentUser = username;
        const session = {
            username: username,
            timestamp: Date.now()
        };

        localStorage.setItem('flashcard-session', JSON.stringify(session));
        console.log(`✅ User logged in: ${username}`);
        return true;
    }

    logout() {
        console.log(`👋 User logged out: ${this.currentUser}`);
        this.currentUser = null;
        localStorage.removeItem('flashcard-session');
        this.showLoginScreen();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProgress(username = this.currentUser) {
        if (!username || !this.users[username]) {
            return null;
        }
        return this.users[username].progress;
    }

    saveUserProgress(progress, username = this.currentUser) {
        if (!username || !this.users[username]) {
            return false;
        }

        this.users[username].progress = {
            ...this.users[username].progress,
            ...progress,
            lastActiveDate: Date.now()
        };

        this.saveUsers();
        console.log(`💾 Progress saved for user: ${username}`);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoginScreen() {
        document.getElementById('app').style.display = 'none';
        
        // Create login screen if it doesn't exist
        let loginScreen = document.getElementById('loginScreen');
        if (!loginScreen) {
            loginScreen = this.createLoginScreen();
            document.body.appendChild(loginScreen);
        }
        
        loginScreen.style.display = 'flex';
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        
        document.getElementById('app').style.display = 'flex';
        
        // Update user info in the app
        this.updateUserInfo();
        
        // Trigger app initialization
        const authReadyEvent = new CustomEvent('authReady');
        document.dispatchEvent(authReadyEvent);
        
        // Initialize flash card app if it doesn't exist
        if (typeof FlashCardApp !== 'undefined' && !window.flashCardApp) {
            window.flashCardApp = new FlashCardApp();
        }
    }

    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement && this.currentUser) {
            const user = this.users[this.currentUser];
            const progress = user.progress;
            
            userInfoElement.innerHTML = `
                <div class="user-welcome">Welcome, ${this.currentUser}!</div>
                <div class="user-stats">
                    <span class="stat">Known: ${progress.knownIds.length}</span>
                    <span class="stat">Learning: ${progress.learningIds.length}</span>
                    <span class="stat">Favorites: ${progress.favourites.length}</span>
                </div>
            `;
            userInfoElement.style.display = 'block';
            
            // Show logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }
    }

    createLoginScreen() {
        const loginScreen = document.createElement('div');
        loginScreen.id = 'loginScreen';
        loginScreen.className = 'login-screen';
        
        loginScreen.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h1>🎴 Language Flash Cards</h1>
                    <p>Sign in to save your progress</p>
                </div>
                
                <div class="login-tabs">
                    <button class="tab-btn active" id="loginTab">Sign In</button>
                    <button class="tab-btn" id="registerTab">Sign Up</button>
                </div>
                
                <!-- Login Form -->
                <form class="auth-form" id="loginForm">
                    <div class="form-group">
                        <label for="loginUsername">Username</label>
                        <input type="text" id="loginUsername" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    
                    <button type="submit" class="auth-btn">Sign In</button>
                    
                    <div class="demo-account">
                        <p>Built-in account available:</p>
                        <div class="demo-credentials">
                            <strong>Username:</strong> user<br>
                            <strong>Password:</strong> password123
                        </div>
                        <button type="button" class="demo-btn" id="demoBtn">Use Built-in Account</button>
                    </div>
                </form>
                
                <!-- Register Form -->
                <form class="auth-form hidden" id="registerForm">
                    <div class="form-group">
                        <label for="registerUsername">Username</label>
                        <input type="text" id="registerUsername" required minlength="3">
                    </div>
                    
                    <div class="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerPassword">Password</label>
                        <input type="password" id="registerPassword" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" required minlength="6">
                    </div>
                    
                    <button type="submit" class="auth-btn">Sign Up</button>
                </form>
                
                <div class="error-message" id="authError"></div>
            </div>
        `;
        
        this.setupLoginEventListeners(loginScreen);
        return loginScreen;
    }

    setupLoginEventListeners(loginScreen) {
        // Tab switching
        const loginTab = loginScreen.querySelector('#loginTab');
        const registerTab = loginScreen.querySelector('#registerTab');
        const loginForm = loginScreen.querySelector('#loginForm');
        const registerForm = loginScreen.querySelector('#registerForm');
        
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            this.clearError();
        });
        
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            this.clearError();
        });
        
        // Form submissions
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Demo button
        const demoBtn = loginScreen.querySelector('#demoBtn');
        demoBtn.addEventListener('click', () => {
            this.setupDemoAccount();
        });
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            this.login(username, password);
            this.showApp();
            this.clearError();
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        try {
            this.register(username, password, email);
            this.login(username, password);
            this.showApp();
            this.clearError();
        } catch (error) {
            this.showError(error.message);
        }
    }

    setupDemoAccount() {
        try {
            // Fill in the built-in account credentials
            document.getElementById('loginUsername').value = 'user';
            document.getElementById('loginPassword').value = 'password123';
            
            // Show a message about using the built-in account
            this.showError('Built-in account credentials filled. Click "Sign In" to continue.', 'info');
        } catch (error) {
            console.error('Error setting up built-in account:', error);
            this.showError('Failed to set up built-in account');
        }
    }

    showError(message, type = 'error') {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = `error-message ${type}`;
            errorElement.style.display = 'block';
        }
    }

    clearError() {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    deleteAccount(username = this.currentUser) {
        if (!username || !this.users[username]) {
            return false;
        }

        delete this.users[username];
        this.saveUsers();
        
        if (username === this.currentUser) {
            this.logout();
        }
        
        return true;
    }

    exportUserData(username = this.currentUser) {
        if (!username || !this.users[username]) {
            return null;
        }

        const userData = {
            username: username,
            user: this.users[username],
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(userData, null, 2);
    }
}

// Initialize the auth manager when the script loads
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});
