class FlashCardApp {
    constructor() {
        this.currentCardIndex = 0;
        this.flashcards = [];
        this.userProgress = {
            known_cards: [],
            learning_cards: [],
            favorites: []
        };
        this.authToken = null;
        this.isAnonymous = true;
        this.isCardFlipped = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFlashcards();
        this.validateSession();
    }

    initializeElements() {
        // Card elements
        this.flashcard = document.getElementById('flashcard');
        this.frontText = document.getElementById('frontText');
        this.frontSubtext = document.getElementById('frontSubtext');
        this.backText = document.getElementById('backText');
        this.pronunciation = document.getElementById('pronunciation');
        this.notes = document.getElementById('notes');
        this.cardImage = document.getElementById('cardImage');
        this.cardAudio = document.getElementById('cardAudio');
        this.exampleSentence = document.getElementById('exampleSentence');
        
        // Control elements
        this.flipBtn = document.getElementById('flipBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.knownBtn = document.getElementById('knownBtn');
        this.learningBtn = document.getElementById('learningBtn');
        this.favoriteBtn = document.getElementById('favoriteBtn');
        
        // Progress elements
        this.cardCounter = document.getElementById('cardCounter');
        this.progressFill = document.getElementById('progressFill');
        
        // User elements
        this.userDisplay = document.getElementById('userDisplay');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Modal elements
        this.loginModal = document.getElementById('loginModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerBtn = document.getElementById('registerBtn');
        this.closeModal = document.querySelector('.close');
    }

    setupEventListeners() {
        // Card flip functionality
        this.flashcard.addEventListener('click', () => this.flipCard());
        this.flipBtn.addEventListener('click', () => this.flipCard());
        
        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousCard());
        this.nextBtn.addEventListener('click', () => this.nextCard());
        
        // Card actions
        this.knownBtn.addEventListener('click', () => this.markAsKnown());
        this.learningBtn.addEventListener('click', () => this.markAsLearning());
        this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        
        // User authentication
        this.loginBtn.addEventListener('click', () => this.showLoginModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.closeModal.addEventListener('click', () => this.hideLoginModal());
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerBtn.addEventListener('click', () => this.handleRegister());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadFlashcards() {
        try {
            const response = await fetch('./flashcards.json');
            if (response.ok) {
                this.flashcards = await response.json();
                console.log(`✅ Loaded ${this.flashcards.length} flashcards`);
                this.shuffleCards();
                this.displayCurrentCard();
                this.updateProgress();
            } else {
                console.error('Failed to load flashcards');
                this.showError('Failed to load flashcards');
            }
        } catch (error) {
            console.error('Error loading flashcards:', error);
            this.showError('Error loading flashcards');
        }
    }

    shuffleCards() {
        for (let i = this.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcards[i], this.flashcards[j]] = [this.flashcards[j], this.flashcards[i]];
        }
    }

    flipCard() {
        console.log('🔄 Card flip requested');
        this.isCardFlipped = !this.isCardFlipped;
        
        if (this.isCardFlipped) {
            this.flashcard.classList.add('flipped');
            this.flipBtn.textContent = '🔄 Flip Back';
        } else {
            this.flashcard.classList.remove('flipped');
            this.flipBtn.textContent = '🔄 Flip Card';
        }
        
        // Send flip event to server
        this.sendCardFlip();
    }

    async sendCardFlip() {
        if (!this.authToken || this.flashcards.length === 0) return;
        
        const currentCard = this.flashcards[this.currentCardIndex];
        try {
            const response = await fetch('/api/cards/flip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    cardId: currentCard.id,
                    token: this.authToken
                })
            });
            
            if (response.ok) {
                console.log('✅ Card flip logged');
            }
        } catch (error) {
            console.error('Error logging card flip:', error);
        }
    }

    displayCurrentCard() {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentCardIndex];
        console.log('🎴 Displaying card:', card.id);
        
        // Reset card flip state
        this.isCardFlipped = false;
        this.flashcard.classList.remove('flipped');
        this.flipBtn.textContent = '🔄 Flip Card';
        
        // Update front of card
        this.frontText.textContent = card.front.primaryText;
        this.frontSubtext.textContent = card.front.secondaryText || '';
        this.exampleSentence.textContent = card.front.example || '';
        
        // Update back of card
        this.backText.textContent = card.back.translation;
        this.pronunciation.textContent = card.back.pronunciation || '';
        this.notes.textContent = card.back.notes || '';
        
        // Handle media
        if (card.front.imageUrl) {
            this.cardImage.src = card.front.imageUrl;
            this.cardImage.style.display = 'block';
        } else {
            this.cardImage.style.display = 'none';
        }
        
        if (card.front.audioUrl) {
            this.cardAudio.src = card.front.audioUrl;
            this.cardAudio.style.display = 'block';
        } else {
            this.cardAudio.style.display = 'none';
        }
        
        // Update favorite button
        const isFavorite = this.userProgress.favorites.includes(card.id);
        this.favoriteBtn.classList.toggle('active', isFavorite);
        
        // Update card actions based on progress
        this.updateCardActions(card);
    }

    updateCardActions(card) {
        const isKnown = this.userProgress.known_cards.includes(card.id);
        const isLearning = this.userProgress.learning_cards.includes(card.id);
        
        this.knownBtn.style.opacity = isKnown ? '1' : '0.7';
        this.learningBtn.style.opacity = isLearning ? '1' : '0.7';
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.displayCurrentCard();
            this.updateProgress();
        }
    }

    nextCard() {
        if (this.currentCardIndex < this.flashcards.length - 1) {
            this.currentCardIndex++;
            this.displayCurrentCard();
            this.updateProgress();
        }
    }

    async markAsKnown() {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentCardIndex];
        console.log('✅ Marking card as known:', card.id);
        
        try {
            const response = await fetch('/api/cards/mark-known', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    cardId: card.id,
                    token: this.authToken
                })
            });
            
            if (response.ok) {
                // Update local progress
                if (!this.userProgress.known_cards.includes(card.id)) {
                    this.userProgress.known_cards.push(card.id);
                }
                
                // Remove from learning cards
                const learningIndex = this.userProgress.learning_cards.indexOf(card.id);
                if (learningIndex > -1) {
                    this.userProgress.learning_cards.splice(learningIndex, 1);
                }
                
                this.updateCardActions(card);
                this.nextCard();
            }
        } catch (error) {
            console.error('Error marking card as known:', error);
        }
    }

    async markAsLearning() {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentCardIndex];
        console.log('📚 Marking card as learning:', card.id);
        
        try {
            const response = await fetch('/api/cards/mark-learning', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    cardId: card.id,
                    token: this.authToken
                })
            });
            
            if (response.ok) {
                // Update local progress
                if (!this.userProgress.learning_cards.includes(card.id)) {
                    this.userProgress.learning_cards.push(card.id);
                }
                
                // Remove from known cards
                const knownIndex = this.userProgress.known_cards.indexOf(card.id);
                if (knownIndex > -1) {
                    this.userProgress.known_cards.splice(knownIndex, 1);
                }
                
                this.updateCardActions(card);
                this.nextCard();
            }
        } catch (error) {
            console.error('Error marking card as learning:', error);
        }
    }

    async toggleFavorite() {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentCardIndex];
        console.log('⭐ Toggling favorite for card:', card.id);
        
        try {
            const response = await fetch('/api/cards/toggle-favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    cardId: card.id,
                    token: this.authToken
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Update local progress
                if (result.isFavorite) {
                    if (!this.userProgress.favorites.includes(card.id)) {
                        this.userProgress.favorites.push(card.id);
                    }
                } else {
                    const favIndex = this.userProgress.favorites.indexOf(card.id);
                    if (favIndex > -1) {
                        this.userProgress.favorites.splice(favIndex, 1);
                    }
                }
                
                this.favoriteBtn.classList.toggle('active', result.isFavorite);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    updateProgress() {
        if (this.flashcards.length === 0) return;
        
        this.cardCounter.textContent = `Card ${this.currentCardIndex + 1} of ${this.flashcards.length}`;
        const progress = ((this.currentCardIndex + 1) / this.flashcards.length) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    handleKeyboard(event) {
        switch(event.key) {
            case ' ':
            case 'Enter':
                event.preventDefault();
                this.flipCard();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousCard();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextCard();
                break;
            case '1':
                event.preventDefault();
                this.markAsKnown();
                break;
            case '2':
                event.preventDefault();
                this.markAsLearning();
                break;
            case '3':
                event.preventDefault();
                this.toggleFavorite();
                break;
        }
    }

    async validateSession() {
        // Try to get token from localStorage
        this.authToken = localStorage.getItem('authToken');
        
        if (!this.authToken) {
            // Create anonymous session
            this.authToken = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('authToken', this.authToken);
        }
        
        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.authToken
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.isAnonymous = result.anonymous;
                
                if (!this.isAnonymous) {
                    this.userDisplay.textContent = result.username;
                    this.loginBtn.style.display = 'none';
                    this.logoutBtn.style.display = 'block';
                }
                
                this.userProgress = result.progress || {
                    known_cards: [],
                    learning_cards: [],
                    favorites: []
                };
                
                console.log('✅ Session validated:', this.isAnonymous ? 'Anonymous' : result.username);
            }
        } catch (error) {
            console.error('Error validating session:', error);
        }
    }

    showLoginModal() {
        this.loginModal.style.display = 'block';
    }

    hideLoginModal() {
        this.loginModal.style.display = 'none';
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    anonymousToken: this.isAnonymous ? this.authToken : null
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.authToken = result.token;
                localStorage.setItem('authToken', this.authToken);
                
                this.isAnonymous = false;
                this.userDisplay.textContent = result.user.username;
                this.loginBtn.style.display = 'none';
                this.logoutBtn.style.display = 'block';
                
                this.userProgress = result.user.progress;
                this.hideLoginModal();
                
                console.log('✅ Login successful');
            } else {
                alert('Login failed: ' + result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async handleRegister() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    email
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Registration successful! Please login.');
                document.getElementById('email').value = '';
            } else {
                alert('Registration failed: ' + result.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    }

    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.authToken
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('authToken');
        this.authToken = null;
        this.isAnonymous = true;
        this.userDisplay.textContent = 'Anonymous User';
        this.loginBtn.style.display = 'block';
        this.logoutBtn.style.display = 'none';
        
        this.userProgress = {
            known_cards: [],
            learning_cards: [],
            favorites: []
        };
        
        this.validateSession();
    }

    showError(message) {
        alert('Error: ' + message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashCardApp();
});
