/**
 * Authentication system for Flash Cards App v1.0.1
 * Handles user registration, login, and session management using localStorage
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        
        // Remove any existing login screen immediately
        document.addEventListener('DOMContentLoaded', () => {
            const existingLoginScreen = document.getElementById('loginScreen');
            if (existingLoginScreen) {
                existingLoginScreen.remove();
            }
        });
        
        this.initializeAuth();
    }

    initializeAuth() {
        console.log('🔐 Initializing authentication system...');
        
        // Automatically use the default user without login
        this.currentUser = 'user';
        console.log(`✅ Auto-login with default user: ${this.currentUser}`);
        
        // Create and save a session
        const session = {
            username: this.currentUser,
            timestamp: Date.now()
        };
        localStorage.setItem('flashcard-session', JSON.stringify(session));
        
        // Show the app directly
        this.showApp();
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
        console.log(`� Resetting user session to default`);
        this.currentUser = 'user';
        
        // Create new session with default user
        const session = {
            username: this.currentUser,
            timestamp: Date.now()
        };
        localStorage.setItem('flashcard-session', JSON.stringify(session));
        
        // Refresh the app
        this.showApp();
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
        // Bypass login screen completely and show the app directly
        console.log('Login screen bypassed');
        this.currentUser = 'user';
        
        // Create new session with default user if needed
        const session = {
            username: this.currentUser,
            timestamp: Date.now()
        };
        localStorage.setItem('flashcard-session', JSON.stringify(session));
        
        // Show the app directly instead of the login screen
        this.showApp();
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        
        document.getElementById('app').style.display = 'flex';
        
        // Hide login-related UI elements if they exist
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.style.display = 'none';
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        
        // Trigger app initialization
        const authReadyEvent = new CustomEvent('authReady');
        document.dispatchEvent(authReadyEvent);
        
        // Initialize flash card app if it doesn't exist
        if (typeof FlashCardApp !== 'undefined' && !window.flashCardApp) {
            window.flashCardApp = new FlashCardApp();
        }
    }

    updateUserInfo() {
        // Hide user info element
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.style.display = 'none';
        }
        
        // Hide logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        
        // Data is still tracked in the background using the default user
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
    // Hide any login screen immediately
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    
    // Show the app container immediately
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.style.display = 'flex';
    }
    
    // Initialize the auth manager
    authManager = new AuthManager();
});
