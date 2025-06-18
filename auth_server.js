/**
 * Authentication system for Flash Cards App - Server Version
 * Handles user registration, login, and session management with Flask backend
 */

class AuthManager {    constructor() {
        this.currentUser = null;
        this.apiBase = '/api';  // Flask API base URL
        this.initializeAuth();
        this.setupUIEventListeners();
    }async initializeAuth() {
        try {
            // Check if user is already logged in on server
            const response = await fetch(`${this.apiBase}/user`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showApp();
                console.log('✅ User authenticated:', this.currentUser.username);
                return;
            }
        } catch (error) {
            console.log('No existing session found');
        }
        
        // Show app directly without login requirement
        this.currentUser = null;
        this.showApp();        console.log('📱 Starting app in anonymous mode');
    }

    setupUIEventListeners() {
        // Login prompt button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'promptLoginBtn') {
                this.showLoginScreen();
            }
            if (e.target.id === 'logoutBtn') {
                this.logout();
            }
        });
    }

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email, 
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showApp();
                this.updateUserInfo();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error during registration' };
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showApp();
                this.updateUserInfo();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error during login' };
        }
    }

    async logout() {
        try {
            await fetch(`${this.apiBase}/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.currentUser = null;
            this.showLoginScreen();
            
            // Clear any local storage
            localStorage.removeItem('flashcard-session');
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    }

    async saveUserProgress(progressData) {
        if (!this.currentUser) return;

        try {
            // Save individual progress items
            for (const [cardId, action] of Object.entries(progressData.actions || {})) {
                await fetch(`${this.apiBase}/progress`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        card_id: cardId,
                        action: action
                    })
                });
            }

            // Save favorites
            for (const cardId of progressData.favorites || []) {
                await fetch(`${this.apiBase}/favorites`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        card_id: cardId
                    })
                });
            }

            console.log('✅ Progress saved to server');
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    async getUserProgress() {
        if (!this.currentUser) return null;

        try {
            const [progressResponse, favoritesResponse] = await Promise.all([
                fetch(`${this.apiBase}/progress`, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(`${this.apiBase}/favorites`, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                })
            ]);

            const progressData = await progressResponse.json();
            const favoritesData = await favoritesResponse.json();

            return {
                progress: progressData.progress || {},
                favorites: favoritesData.favorites || [],
                knownIds: [],
                learningIds: [],
                totalSessionTime: 0
            };
        } catch (error) {
            console.error('Failed to load progress:', error);
            return null;
        }
    }

    async getUserStats() {
        if (!this.currentUser) return null;

        try {
            const response = await fetch(`${this.apiBase}/stats`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
        
        return null;
    }

    async startSession() {
        if (!this.currentUser) return null;

        try {
            const response = await fetch(`${this.apiBase}/session/start`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                return data.session_id;
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        }
        
        return null;
    }

    async endSession(sessionId, sessionData) {
        if (!this.currentUser || !sessionId) return;

        try {
            await fetch(`${this.apiBase}/session/end`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    ...sessionData
                })
            });
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    showLoginScreen() {
        // Hide the main app
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';

        // Hide user info and logout button
        const userInfo = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');
        if (userInfo) userInfo.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Create or show login screen
        this.createLoginScreen();
    }    showApp() {
        // Show the main app
        const app = document.getElementById('app');
        if (app) app.style.display = 'flex';

        // Show/hide user info and logout button based on login status
        const userInfo = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (this.currentUser) {
            // User is logged in
            if (userInfo) userInfo.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';
        } else {
            // Anonymous user
            if (userInfo) userInfo.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
        }

        // Hide login screen
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) loginScreen.style.display = 'none';

        // Dispatch auth ready event
        document.dispatchEvent(new CustomEvent('authReady'));
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <div class="user-welcome">
                    <span class="user-greeting">Welcome back,</span>
                    <span class="user-name">${this.currentUser.username}</span>
                </div>
            `;
        }
    }

    createLoginScreen() {
        // Remove existing login screen
        const existingScreen = document.getElementById('loginScreen');
        if (existingScreen) {
            existingScreen.remove();
        }

        // Create login screen HTML
        const loginScreen = document.createElement('div');
        loginScreen.id = 'loginScreen';
        loginScreen.className = 'login-screen';
          loginScreen.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h1>🃏 Language Flash Cards</h1>
                    <p>Learn German vocabulary with interactive flashcards</p>
                </div>
                
                <div class="auth-forms">
                    <!-- Login Form -->
                    <div class="auth-form" id="loginForm">
                        <h2>Sign In</h2>
                        <form id="loginFormElement">
                            <div class="form-group">
                                <input type="text" 
                                       id="loginUsername" 
                                       placeholder="Username or Email" 
                                       autocomplete="username"
                                       autocapitalize="none"
                                       autocorrect="off"
                                       spellcheck="false"
                                       required>
                            </div>
                            <div class="form-group">
                                <input type="password" 
                                       id="loginPassword" 
                                       placeholder="Password" 
                                       autocomplete="current-password"
                                       required>
                            </div>
                            <button type="submit" class="auth-btn primary">Sign In</button>
                        </form>
                        <p class="auth-switch">
                            New here? <a href="#" id="showRegister">Create an account</a>
                        </p>
                    </div>

                    <!-- Register Form -->
                    <div class="auth-form hidden" id="registerForm">
                        <h2>Create Account</h2>
                        <form id="registerFormElement">
                            <div class="form-group">
                                <input type="text" 
                                       id="registerUsername" 
                                       placeholder="Username" 
                                       autocomplete="username"
                                       autocapitalize="none"
                                       autocorrect="off"
                                       spellcheck="false"
                                       required>
                            </div>
                            <div class="form-group">
                                <input type="email" 
                                       id="registerEmail" 
                                       placeholder="Email" 
                                       autocomplete="email"
                                       autocapitalize="none"
                                       autocorrect="off"
                                       spellcheck="false"
                                       required>
                            </div>
                            <div class="form-group">
                                <input type="password" 
                                       id="registerPassword" 
                                       placeholder="Password" 
                                       autocomplete="new-password"
                                       required>
                            </div>
                            <div class="form-group">
                                <input type="password" 
                                       id="registerConfirmPassword" 
                                       placeholder="Confirm Password" 
                                       autocomplete="new-password"
                                       required>
                            </div>
                            <button type="submit" class="auth-btn primary">Create Account</button>
                        </form>
                        <p class="auth-switch">
                            Already have an account? <a href="#" id="showLogin">Sign in here</a>
                        </p>
                    </div>
                </div>

                <!-- Error/Success Messages -->
                <div id="authMessage" class="auth-message hidden"></div>
            </div>
        `;

        document.body.appendChild(loginScreen);
        this.setupAuthEventListeners();
        this.addAuthStyles();
    }

    setupAuthEventListeners() {
        // Form switching
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
            this.clearMessage();
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            this.clearMessage();
        });

        // Login form
        document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            this.showMessage('Signing in...', 'info');
            const result = await this.login(username, password);

            if (result.success) {
                this.showMessage('Welcome back!', 'success');
            } else {
                this.showMessage(result.error, 'error');
            }
        });

        // Register form
        document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;

            if (!username || !email || !password || !confirmPassword) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showMessage('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                this.showMessage('Password must be at least 6 characters long', 'error');
                return;
            }

            this.showMessage('Creating account...', 'info');
            const result = await this.register(username, email, password);

            if (result.success) {
                this.showMessage('Account created successfully!', 'success');
            } else {
                this.showMessage(result.error, 'error');
            }
        });
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
            messageEl.classList.remove('hidden');
        }
    }

    clearMessage() {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.classList.add('hidden');
        }
    }

    addAuthStyles() {
        // Only add styles if they don't exist
        if (document.getElementById('authStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'authStyles';
        styles.textContent = `
            .login-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .login-container {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
                margin: 1rem;
            }

            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .login-header h1 {
                color: #333;
                margin-bottom: 0.5rem;
                font-size: 1.8rem;
            }

            .login-header p {
                color: #666;
                font-size: 0.9rem;
            }

            .auth-form {
                transition: all 0.3s ease;
            }

            .auth-form.hidden {
                display: none;
            }

            .auth-form h2 {
                color: #333;
                margin-bottom: 1.5rem;
                text-align: center;
            }

            .form-group {
                margin-bottom: 1rem;
            }

            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }

            .auth-btn {
                width: 100%;
                padding: 0.75rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }

            .auth-btn.primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .auth-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .auth-switch {
                text-align: center;
                color: #666;
                font-size: 0.9rem;
            }

            .auth-switch a {
                color: #667eea;
                text-decoration: none;
                font-weight: 600;
            }

            .auth-switch a:hover {
                text-decoration: underline;
            }

            .auth-message {
                padding: 0.75rem;
                border-radius: 8px;
                text-align: center;
                margin-top: 1rem;
                font-weight: 500;
            }

            .auth-message.hidden {
                display: none;
            }

            .auth-message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .auth-message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .auth-message.info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            .user-info {
                position: fixed;
                top: 1rem;
                left: 1rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 0.5rem 1rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .user-welcome {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }

            .user-greeting {
                font-size: 0.8rem;
                opacity: 0.8;
                margin-bottom: 0.2rem;
            }

            .user-name {
                font-weight: 600;
                color: var(--text-primary);
            }

            .logout-btn {
                position: fixed;
                top: 1rem;
                right: 1rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .logout-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }
        `;
        
        document.head.appendChild(styles);
    }

    async exportUserData() {
        if (!this.currentUser) return null;

        try {
            const stats = await this.getUserStats();
            const progress = await this.getUserProgress();
            
            const exportData = {
                user: this.currentUser,
                stats: stats,
                progress: progress,
                exported_at: new Date().toISOString()
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    async deleteAccount() {
        if (!this.currentUser) return false;

        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return false;
        }

        try {
            const response = await fetch(`${this.apiBase}/user`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                this.currentUser = null;
                this.showLoginScreen();
                return true;
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
        
        return false;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
