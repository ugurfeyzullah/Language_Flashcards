/**
 * Server-side Authentication system for Flash Cards App v2.0
 * Handles user registration, login, and session management with server-side persistence
 */

class ServerAuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.isAnonymous = false;  // New flag to track anonymous status
        this.apiBase = window.location.origin + '/api';
        this.initializeAuth();
    }

    async initializeAuth() {
        console.log('🔐 Initializing server-side authentication system...');
        
        // Check if user has a saved session token
        const savedToken = localStorage.getItem('flashcard-session-token');
        if (savedToken) {
            try {
                const isValid = await this.validateSession(savedToken);
                if (isValid) {
                    if (this.isAnonymous) {
                        console.log(`✅ Restored anonymous session`);
                    } else {
                        console.log(`✅ Restored session for user: ${this.currentUser}`);
                    }
                    this.showApp();
                    return;
                }
            } catch (error) {
                console.error('Session validation failed:', error);
                localStorage.removeItem('flashcard-session-token');
            }
        }
        
        try {
            // Request a new anonymous session
            const response = await fetch(`${this.apiBase}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Empty body to request anonymous session
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.valid && data.anonymous && data.token) {
                    console.log('✅ Created anonymous session');
                    this.sessionToken = data.token;
                    localStorage.setItem('flashcard-session-token', data.token);
                    this.isAnonymous = true;
                    this.userProgress = data.progress;
                    this.showApp();
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to create anonymous session:', error);
        }
        
        // Show login screen if everything else fails
        this.showLoginScreen();
    }

    async validateSession(token) {
        try {
            const response = await fetch(`${this.apiBase}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    this.sessionToken = token;
                    this.isAnonymous = data.anonymous || false;
                    
                    if (!this.isAnonymous) {
                        this.currentUser = data.username;
                    } else {
                        this.currentUser = null;
                    }
                    
                    this.userProgress = data.progress;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    async register(username, password, email = '') {
        console.log('🔍 [CLIENT DEBUG] Starting registration process');
        console.log('🔍 [CLIENT DEBUG] Username:', username);
        console.log('🔍 [CLIENT DEBUG] Email:', email);
        console.log('🔍 [CLIENT DEBUG] API endpoint:', `${this.apiBase}/register`);
        
        try {
            const requestData = {
                username: username.trim(),
                password: password,
                email: email.trim()
            };
            
            console.log('🔍 [CLIENT DEBUG] Request data:', {
                username: requestData.username,
                email: requestData.email,
                password: '***'
            });
            
            console.log('🔍 [CLIENT DEBUG] Making fetch request...');
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('🔍 [CLIENT DEBUG] Response status:', response.status);
            console.log('🔍 [CLIENT DEBUG] Response ok:', response.ok);
            
            const data = await response.json();
            console.log('🔍 [CLIENT DEBUG] Response data:', data);
            
            if (response.ok) {
                console.log('✅ User registered successfully');
                return { success: true, message: data.message };
            } else {
                console.error('❌ Registration failed:', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            console.error('❌ [CLIENT DEBUG] Error type:', error.name);
            console.error('❌ [CLIENT DEBUG] Error message:', error.message);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async login(username, password) {
        try {
            const loginData = {
                username: username.trim(),
                password: password
            };
            
            // If we have an anonymous session, include the token
            if (this.isAnonymous && this.sessionToken) {
                loginData.anonymousToken = this.sessionToken;
                console.log('🔄 Including anonymous token in login request to transfer progress');
            }
            
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.sessionToken = data.token;
                this.currentUser = data.user.username;
                this.userProgress = data.user.progress;
                this.isAnonymous = false; // User is now logged in
                
                // Save session token
                localStorage.setItem('flashcard-session-token', this.sessionToken);
                
                console.log(`✅ User logged in: ${this.currentUser}`);
                return { success: true, user: data.user };
            } else {
                console.error('❌ Login failed:', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async logout() {
        try {
            if (this.sessionToken) {
                await fetch(`${this.apiBase}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.sessionToken}`
                    },
                    body: JSON.stringify({ token: this.sessionToken })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data regardless of server response
            this.currentUser = null;
            this.sessionToken = null;
            this.userProgress = null;
            localStorage.removeItem('flashcard-session-token');
            
            console.log('✅ User logged out');
            this.showLoginScreen();
        }
    }

    async saveProgress(progressData) {
        console.log('🔍 [CLIENT DEBUG] Starting progress save');
        console.log('🔍 [CLIENT DEBUG] Session token available:', !!this.sessionToken);
        console.log('🔍 [CLIENT DEBUG] Progress data keys:', Object.keys(progressData));
        
        if (!this.sessionToken) {
            console.warn('⚠️ No active session, cannot save progress');
            return false;
        }

        try {
            console.log('🔍 [CLIENT DEBUG] Making save progress request...');
            const response = await fetch(`${this.apiBase}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify({ progress: progressData })
            });

            console.log('🔍 [CLIENT DEBUG] Save response status:', response.status);
            console.log('🔍 [CLIENT DEBUG] Save response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Progress saved to server');
                console.log('🔍 [CLIENT DEBUG] Save response data:', data);
                return true;
            } else {
                const data = await response.json();
                console.error('❌ Failed to save progress:', data.error);
                console.error('❌ [CLIENT DEBUG] Error response:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Save progress error:', error);
            console.error('❌ [CLIENT DEBUG] Error type:', error.name);
            console.error('❌ [CLIENT DEBUG] Error message:', error.message);
            return false;
        }
    }

    async loadProgress() {
        if (!this.sessionToken) {
            console.warn('⚠️ No active session, cannot load progress');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/progress`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userProgress = data.progress;
                console.log('✅ Progress loaded from server');
                return data.progress;
            } else {
                const data = await response.json();
                console.error('❌ Failed to load progress:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Load progress error:', error);
            return null;
        }
    }

    async getUserStatistics() {
        if (!this.sessionToken) {
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/user/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.statistics;
            }
            return null;
        } catch (error) {
            console.error('❌ Statistics error:', error);
            return null;
        }
    }

    isLoggedIn() {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProgress() {
        return this.userProgress;
    }

    showLoginScreen() {
        // Hide the main app
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';
        
        // Hide user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) userInfo.style.display = 'none';
        
        // Hide logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Show or create login screen
        this.createLoginScreen();
    }

    showApp() {
        // Hide login screen
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) loginScreen.style.display = 'none';
        
        // Show the main app
        const app = document.getElementById('app');
        if (app) app.style.display = 'block';
        
        // Show login prompt for anonymous users
        const loginPrompt = document.getElementById('loginPrompt');
        const fallbackLoginBtn = document.getElementById('fallbackLoginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isAnonymous) {
            // Show login prompt for anonymous users
            if (loginPrompt) {
                loginPrompt.style.display = 'block';
                const promptLoginBtn = document.getElementById('promptLoginBtn');
                if (promptLoginBtn) {
                    promptLoginBtn.onclick = () => this.showLoginScreen();
                }
            }
            
            // Show fallback login button
            if (fallbackLoginBtn) {
                fallbackLoginBtn.style.display = 'block';
                fallbackLoginBtn.onclick = () => this.showLoginScreen();
            }
            
            // Hide logout button for anonymous users
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // Hide user info for anonymous users
            const userInfo = document.getElementById('userInfo');
            if (userInfo) userInfo.style.display = 'none';
        } else {
            // Show user info for logged in users
            this.updateUserInfo();
            
            // Hide login prompts for logged in users
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (fallbackLoginBtn) fallbackLoginBtn.style.display = 'none';
            
            // Show logout button for logged in users
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                logoutBtn.onclick = () => this.logout();
            }
        }
        
        // Trigger app initialization if available
        if (typeof window.initializeFlashCardApp === 'function') {
            window.initializeFlashCardApp();
        }
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            const progress = this.userProgress;
            const knownCount = progress ? progress.known_cards.length : 0;
            const learningCount = progress ? progress.learning_cards.length : 0;
            const streak = progress ? progress.streak_days : 0;
            
            userInfo.innerHTML = `
                <span class="user-name">👤 ${this.currentUser}</span>
                <span class="user-stats">
                    🎯 ${knownCount} known • 📚 ${learningCount} learning • 🔥 ${streak} day streak
                </span>
            `;
            userInfo.style.display = 'flex';
        }
    }

    createLoginScreen() {
        let loginScreen = document.getElementById('loginScreen');
        
        if (!loginScreen) {
            loginScreen = document.createElement('div');
            loginScreen.id = 'loginScreen';
            loginScreen.className = 'login-screen';
            document.body.appendChild(loginScreen);
        }
        
        loginScreen.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h1>🎴 Language Flash Cards</h1>
                    <p>Sign in to save your progress across devices</p>
                </div>
                
                <div class="login-tabs">
                    <button class="tab-btn active" data-tab="login">Sign In</button>
                    <button class="tab-btn" data-tab="register">Sign Up</button>
                </div>
                
                <div class="login-forms">
                    <!-- Login Form -->
                    <form class="login-form active" id="loginForm">
                        <div class="form-group">
                            <label for="loginUsername">Username</label>
                            <input type="text" id="loginUsername" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" required autocomplete="current-password">
                        </div>
                        <button type="submit" class="btn btn-primary">Sign In</button>
                        <div class="error-message" id="loginError"></div>
                    </form>
                    
                    <!-- Register Form -->
                    <form class="login-form" id="registerForm">
                        <div class="form-group">
                            <label for="registerUsername">Username</label>
                            <input type="text" id="registerUsername" required autocomplete="username">
                            <small>3+ characters, letters/numbers/hyphens/underscores only</small>
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">Email (optional)</label>
                            <input type="email" id="registerEmail" autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Password</label>
                            <input type="password" id="registerPassword" required autocomplete="new-password">
                            <small>Minimum 6 characters</small>
                        </div>
                        <button type="submit" class="btn btn-primary">Sign Up</button>
                        <div class="error-message" id="registerError"></div>
                        <div class="success-message" id="registerSuccess"></div>
                    </form>
                </div>
                
                <div class="login-footer">
                    <p><small>Your progress is saved securely on the server</small></p>
                </div>
            </div>
        `;
        
        loginScreen.style.display = 'flex';
        
        // Add event listeners
        this.setupLoginEventListeners();
    }

    setupLoginEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.login-form');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update active tab
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding form
                forms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tab}Form`) {
                        form.classList.add('active');
                    }
                });
                
                // Clear error messages
                this.clearMessages();
            });
        });
        
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        this.clearMessages();
        this.showLoading('loginForm');
        
        const result = await this.login(username, password);
        
        this.hideLoading('loginForm');
        
        if (result.success) {
            this.showApp();
        } else {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const email = document.getElementById('registerEmail').value;
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        
        this.clearMessages();
        this.showLoading('registerForm');
        
        const result = await this.register(username, password, email);
        
        this.hideLoading('registerForm');
        
        if (result.success) {
            successDiv.textContent = 'Account created successfully! You can now sign in.';
            successDiv.style.display = 'block';
            
            // Switch to login tab after 2 seconds
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                document.getElementById('loginUsername').value = username;
            }, 2000);
        } else {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    }

    clearMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
        });
    }

    showLoading(formId) {
        const form = document.getElementById(formId);
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Please wait...';
    }

    hideLoading(formId) {
        const form = document.getElementById(formId);
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = formId === 'loginForm' ? 'Sign In' : 'Sign Up';
    }
}

// Initialize the auth manager
const authManager = new ServerAuthManager();

// Make it globally available
window.authManager = authManager;
