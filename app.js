// FlashCard type definition (in TypeScript style comments)
/**
 * @typedef {Object} FlashCard
 * @property {string} id
 * @property {Object} front
 * @property {string} front.primaryText
 * @property {string} [front.secondaryText]
 * @property {string} [front.audioUrl]
 * @property {Object} back
 * @property {string} back.translation
 * @property {string} [back.example]
 * @property {string} [back.notes]
 * @property {boolean} isFavourite
 */

/**
 * @typedef {Object} AppState
 * @property {FlashCard[]} cards
 * @property {number} index
 * @property {string[]} knownIds
 * @property {string[]} learningIds
 * @property {Array<{action: 'left'|'right', card: FlashCard}>} history
 * @property {boolean} isFlipped
 * @property {string} theme
 */

class FlashCardApp {
    constructor() {
        // Wait for auth manager to be ready
        this.waitForAuth();
    }

    waitForAuth() {
        if (typeof authManager !== 'undefined') {
            this.initializeApp();
        } else {
            setTimeout(() => this.waitForAuth(), 100);
        }
    }    initializeApp() {
        this.authManager = authManager;
        this.loginPromptTimeout = null;
        this.progressLoaded = false; // Flag to prevent saving before loading
          this.state = {
            cards: [],
            index: 0,
            knownIds: [],
            learningIds: [],
            history: [],
            isFlipped: false,
            theme: localStorage.getItem('flashcard-theme') || 'dark',
            reviewQueue: [], // Queue of cards to review mixed in randomly
            cardsSinceLastReview: 0, // Counter for when to inject review cards
            nextReviewInterval: this.getRandomReviewInterval() // Random interval between 5-50
        };

        // Initialize last saved progress state
        this.lastSavedProgress = {
            knownIds: [],
            learningIds: [],
            favourites: []
        };

        // Load cards from JSON file
        this.loadCards();

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        this.currentAudio = null;
        this.sessionStartTime = Date.now();
    }    async loadCards() {
        try {
            const response = await fetch('./flashcards.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cards = await response.json();
            
            this.state.cards = cards;
            console.log(`📚 [CARD LOAD] Loaded ${cards.length} flashcards from JSON`);
            console.log(`📚 [CARD LOAD] Card IDs: ${cards.map(c => c.id).join(', ')}`);
            
            // Initialize the app after cards are loaded
            this.initializeElements();
            this.setupEventListeners();
            await this.loadUserProgress(); // Make sure this completes first
            this.applyTheme();
            this.render();
        } catch (error) {
            console.error('Error loading flashcards:', error);
            // Fallback to sample cards if loading fails
            this.state.cards = this.generateSampleCards();
            console.log('Using sample cards as fallback');
            
            this.initializeElements();
            this.setupEventListeners();
            await this.loadUserProgress(); // Make sure this completes first
            this.applyTheme();
            this.render();
        }
    }

    generateSampleCards() {
        return [
            {
                id: '1',
                front: {
                    primaryText: 'Hallo',
                    secondaryText: 'greeting',
                    audioUrl: null,
                    imageUrl: null
                },
                back: {
                    translation: 'Hello',
                    example: 'Hallo, wie geht es dir?',
                    notes: 'Common greeting'
                },
                isFavourite: false,
                level: 'A1'
            },
            {
                id: '2',
                front: {
                    primaryText: 'Danke',
                    secondaryText: 'expression of gratitude',
                    audioUrl: null,
                    imageUrl: null
                },
                back: {
                    translation: 'Thank you',
                    example: 'Danke für deine Hilfe!',
                    notes: 'Polite expression'
                },
                isFavourite: true,
                level: 'A1'
            },
            {
                id: '3',
                front: {
                    primaryText: 'Lernen',
                    secondaryText: 'verb (infinitive)',
                    audioUrl: null,
                    imageUrl: null
                },
                back: {
                    translation: 'To learn',
                    example: 'Ich möchte Deutsch lernen.',
                    notes: 'Regular verb'
                },
                isFavourite: false,
                level: 'A2'
            },
            {
                id: '4',
                front: {
                    primaryText: 'Haus',
                    secondaryText: 'noun (neuter)',
                    audioUrl: null,
                    imageUrl: null
                },
                back: {
                    translation: 'House',
                    example: 'Das Haus ist sehr groß.',
                    notes: 'Das Haus, die Häuser'
                },
                isFavourite: false,
                level: 'A1'
            },
            {
                id: '5',
                front: {
                    primaryText: 'Schön',
                    secondaryText: 'adjective',
                    audioUrl: null,
                    imageUrl: null
                },
                back: {
                    translation: 'Beautiful / Nice',
                    example: 'Das ist ein schönes Bild.',
                    notes: 'Can mean beautiful, nice, or lovely'
                },
                isFavourite: false,
                level: 'A2'
            }
        ];
    }

    initializeElements() {        this.elements = {
            closeBtn: document.getElementById('closeBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            progressLabel: document.getElementById('progressLabel'),
            knowPill: document.getElementById('knowPill'),
            learningPill: document.getElementById('learningPill'),
            knowCounter: document.getElementById('knowCounter'),
            learningCounter: document.getElementById('learningCounter'),
            cardContainer: document.getElementById('cardContainer'),
            flashcard: document.getElementById('flashcard'),
            audioBtn: document.getElementById('audioBtn'),
            starBtn: document.getElementById('starBtn'),
            audioBtnBack: document.getElementById('audioBtnBack'),
            starBtnBack: document.getElementById('starBtnBack'),
            cardImageContainer: document.getElementById('cardImageContainer'),
            cardImage: document.getElementById('cardImage'),
            cardImageContainerBack: document.getElementById('cardImageContainerBack'),
            cardImageBack: document.getElementById('cardImageBack'),
            primaryText: document.getElementById('primaryText'),
            secondaryText: document.getElementById('secondaryText'),
            translation: document.getElementById('translation'),
            example: document.getElementById('example'),
            notes: document.getElementById('notes'),
            undoBtn: document.getElementById('undoBtn'),
            nextBtn: document.getElementById('nextBtn'),
            themeToggle: document.getElementById('themeToggle')        };
    }    showLoginPrompt() {
        const loginPrompt = document.getElementById('loginPrompt');
        if (loginPrompt && (!this.authManager || !this.authManager.getCurrentUser())) {
            // Show the prompt
            loginPrompt.style.display = 'block';
            
            // Clear any existing timeout
            if (this.loginPromptTimeout) {
                clearTimeout(this.loginPromptTimeout);
            }
            
            // Hide it after 8 seconds if still anonymous
            this.loginPromptTimeout = setTimeout(() => {
                if (!this.authManager || !this.authManager.getCurrentUser()) {
                    loginPrompt.style.display = 'none';
                }
            }, 8000);
        }
    }

    setupEventListeners() {
        // Card flip on tap
        this.elements.flashcard.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-icon')) return;
            this.flipCard();
        });

        // Touch events for swiping
        this.elements.flashcard.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.elements.flashcard.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.elements.flashcard.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Mouse events for desktop swiping
        this.elements.flashcard.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Button controls
        this.elements.undoBtn.addEventListener('click', this.undo.bind(this));
        this.elements.nextBtn.addEventListener('click', () => this.swipeCard('right'));

        // Audio buttons
        this.elements.audioBtn.addEventListener('click', this.playAudio.bind(this));
        this.elements.audioBtnBack.addEventListener('click', this.playAudio.bind(this));

        // Star buttons
        this.elements.starBtn.addEventListener('click', this.toggleFavourite.bind(this));
        this.elements.starBtnBack.addEventListener('click', this.toggleFavourite.bind(this));

        // Theme toggle
        this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Close button
        this.elements.closeBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to close the app?')) {
                window.close();
            }
        });

        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => {
            this.showAccountSettings();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
            logoutBtn.style.display = 'block';
        }

        // Account settings
        this.setupAccountSettingsListeners();

        // Auto-save progress periodically
        setInterval(() => {
            this.saveUserProgress();
        }, 30000); // Save every 30 seconds

        // Save progress when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.saveUserProgress();
        });
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;

        // Only start dragging if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.isDragging = true;
            e.preventDefault();

            // Visual feedback during drag
            const progress = Math.min(Math.abs(deltaX) / 100, 1);
            const rotation = deltaX > 0 ? progress * 12 : -progress * 12;
            const opacity = 1 - progress * 0.3;

            this.elements.flashcard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
            this.elements.flashcard.style.opacity = opacity;
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) {
            this.touchStartX = null;
            this.touchStartY = null;
            return;
        }

        const touchX = e.changedTouches[0].clientX;
        const deltaX = touchX - this.touchStartX;
        const threshold = 80;

        // Reset visual state
        this.elements.flashcard.style.transform = '';
        this.elements.flashcard.style.opacity = '';

        if (Math.abs(deltaX) > threshold) {
            this.swipeCard(deltaX > 0 ? 'right' : 'left');
        }

        this.isDragging = false;
        this.touchStartX = null;
        this.touchStartY = null;
    }

    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.isDragging = false;
    }

    handleMouseMove(e) {
        if (!this.touchStartX) return;

        const deltaX = e.clientX - this.touchStartX;
        const deltaY = e.clientY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.isDragging = true;

            const progress = Math.min(Math.abs(deltaX) / 100, 1);
            const rotation = deltaX > 0 ? progress * 12 : -progress * 12;
            const opacity = 1 - progress * 0.3;

            this.elements.flashcard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
            this.elements.flashcard.style.opacity = opacity;
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging) {
            this.touchStartX = null;
            this.touchStartY = null;
            return;
        }

        const deltaX = e.clientX - this.touchStartX;
        const threshold = 80;

        this.elements.flashcard.style.transform = '';
        this.elements.flashcard.style.opacity = '';

        if (Math.abs(deltaX) > threshold) {
            this.swipeCard(deltaX > 0 ? 'right' : 'left');
        }

        this.isDragging = false;
        this.touchStartX = null;
        this.touchStartY = null;
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.swipeCard('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.swipeCard('right');
                break;
            case ' ':
                e.preventDefault();
                this.flipCard();
                break;
            case 'u':
            case 'U':
                e.preventDefault();
                this.undo();
                break;
            case 'a':
            case 'A':
                e.preventDefault();
                this.playAudio();
                break;
        }
    }

    flipCard() {
        this.state = {
            ...this.state,
            isFlipped: !this.state.isFlipped
        };
        this.renderCardFlip();
    }    swipeCard(direction) {
        const currentCard = this.getCurrentCard();
        if (!currentCard) return;

        const newState = { ...this.state };
        const isReviewCard = currentCard._isReviewCard;
        
        // If this card was previously marked as "still learning", remove it from that list first
        if (newState.learningIds.includes(currentCard.id)) {
            newState.learningIds = newState.learningIds.filter(id => id !== currentCard.id);
        }
        
        // If this card was previously marked as "known", remove it from that list first  
        if (newState.knownIds.includes(currentCard.id)) {
            newState.knownIds = newState.knownIds.filter(id => id !== currentCard.id);
        }

        // Add to appropriate array based on current swipe
        if (direction === 'right') {
            newState.knownIds = [...newState.knownIds, currentCard.id];
        } else {
            newState.learningIds = [...newState.learningIds, currentCard.id];
        }

        // Add to history
        newState.history = [...newState.history, { action: direction, card: currentCard }];

        // Handle progression logic
        if (isReviewCard) {
            // This was a review card, don't advance the main index
            // Reset the review counter and get a new interval
            newState.cardsSinceLastReview = 0;
            newState.nextReviewInterval = this.getRandomReviewInterval();
        } else {
            // This was a regular card, advance the index
            newState.index = newState.index + 1;
            newState.cardsSinceLastReview = newState.cardsSinceLastReview + 1;
        }
        
        newState.isFlipped = false;

        this.state = newState;
        this.animateCardExit(direction);
        this.saveUserProgress();
    }

    animateCardExit(direction) {
        const card = this.elements.flashcard;
        const className = direction === 'right' ? 'slide-right' : 'slide-left';
        
        card.classList.add(className);
        
        setTimeout(() => {
            card.classList.remove(className);
            this.render();
            this.animateCounterPulse(direction === 'right' ? 'know' : 'learning');
        }, 300);
    }

    animateCounterPulse(type) {
        const pill = type === 'know' ? this.elements.knowPill : this.elements.learningPill;
        pill.classList.add('pulse');
        setTimeout(() => pill.classList.remove('pulse'), 300);
    }    undo() {
        if (this.state.history.length === 0) return;

        const newState = { ...this.state };
        const lastAction = newState.history.pop();
        const wasReviewCard = lastAction.card._isReviewCard;
        
        // Remove from appropriate array
        if (lastAction.action === 'right') {
            newState.knownIds = newState.knownIds.filter(id => id !== lastAction.card.id);
        } else {
            newState.learningIds = newState.learningIds.filter(id => id !== lastAction.card.id);
        }

        // Handle going back based on card type
        if (wasReviewCard) {
            // This was a review card, increment the counter back
            newState.cardsSinceLastReview = Math.max(0, newState.cardsSinceLastReview + 1);
        } else {
            // This was a regular card, go back one position
            newState.index = Math.max(0, newState.index - 1);
            newState.cardsSinceLastReview = Math.max(0, newState.cardsSinceLastReview - 1);
        }
        
        newState.isFlipped = false;

        this.state = newState;
        this.animateCardEnter(lastAction.action);
        this.saveUserProgress();
    }

    animateCardEnter(fromDirection) {
        const card = this.elements.flashcard;
        const className = fromDirection === 'right' ? 'slide-right' : 'slide-left';
        
        card.classList.add(className);
        this.render();
        
        // Force reflow
        card.offsetHeight;
        
        setTimeout(() => {
            card.classList.remove(className);
        }, 50);
    }    toggleFavourite() {
        const currentCard = this.getCurrentCard();
        if (!currentCard) return;

        const newCards = this.state.cards.map(card => 
            card.id === currentCard.id 
                ? { ...card, isFavourite: !card.isFavourite }
                : card
        );

        this.state = { ...this.state, cards: newCards };
        this.renderStarButtons();
        this.saveUserProgress();
    }

    playAudio() {
        const currentCard = this.getCurrentCard();
        if (!currentCard || !currentCard.front.audioUrl) {
            // Simulate audio playback with a beep
            this.playBeep();
            return;
        }

        if (this.currentAudio) {
            this.currentAudio.pause();
        }

        this.currentAudio = new Audio(currentCard.front.audioUrl);
        this.currentAudio.play().catch(console.error);
    }

    playBeep() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    autoPlayAudio() {
        // Auto-play audio when a new card appears
        const currentCard = this.getCurrentCard();
        if (!currentCard || !currentCard.front.audioUrl) {
            return; // No audio available, don't play anything
        }

        // Small delay to ensure the card is rendered
        setTimeout(() => {
            if (this.currentAudio) {
                this.currentAudio.pause();
            }

            this.currentAudio = new Audio(currentCard.front.audioUrl);
            this.currentAudio.play().catch(error => {
                console.warn('Auto-play failed:', error);
                // Auto-play might be blocked by browser policy
            });
        }, 300); // 300ms delay
    }toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveUserProgress();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.state.theme);
        this.elements.themeToggle.textContent = this.state.theme === 'dark' ? '☀️' : '🌙';
    }    getCurrentCard() {
        console.log('🔍 [CARD DEBUG] getCurrentCard called');
        console.log('🔍 [CARD DEBUG] Current index:', this.state.index);
        console.log('🔍 [CARD DEBUG] Known cards:', this.state.knownIds);
        console.log('🔍 [CARD DEBUG] Learning cards:', this.state.learningIds);
        
        // First check if we should inject a review card
        if (this.shouldInjectReviewCard()) {
            console.log('🔍 [CARD DEBUG] Should inject review card');
            const reviewCard = this.getRandomReviewCard();
            if (reviewCard) {
                console.log('🔍 [CARD DEBUG] Injecting review card:', reviewCard.id);
                // Mark this as a review card injection
                reviewCard._isReviewCard = true;
                return reviewCard;
            }
        }
        
        // Find the next card that hasn't been marked as known
        while (this.state.index < this.state.cards.length) {
            const nextCard = this.state.cards[this.state.index];
            console.log('🔍 [CARD DEBUG] Checking card at index', this.state.index, ':', nextCard.id);
            
            // Skip known cards
            if (this.state.knownIds.includes(nextCard.id)) {
                console.log('🔍 [CARD DEBUG] Skipping known card:', nextCard.id);
                this.state.index++;
                continue;
            }
            
            console.log('🔍 [CARD DEBUG] Returning card:', nextCard.id);
            // Return the next unseen or learning card
            if (nextCard) {
                nextCard._isReviewCard = false;
            }
            return nextCard;
        }
        
        console.log('🔍 [CARD DEBUG] Reached end of deck, checking for review cards');
        // If we're at the end of the deck, check if there are still learning cards
        const reviewCards = this.getCardsForReview();
        if (reviewCards.length > 0) {
            console.log('🔍 [CARD DEBUG] Found', reviewCards.length, 'review cards');
            // Show a random review card
            const randomCard = this.getRandomReviewCard();
            if (randomCard) {
                console.log('🔍 [CARD DEBUG] Returning random review card:', randomCard.id);
                randomCard._isReviewCard = true;
                return randomCard;
            }
        }
        
        console.log('🔍 [CARD DEBUG] No more cards to show');
        return null; // No more cards to show
    }

    getAvailableCards() {
        // Cards that haven't been seen yet
        const unseenCards = this.state.cards.filter((card, index) => 
            index >= this.state.index && 
            !this.state.knownIds.includes(card.id) && 
            !this.state.learningIds.includes(card.id)
        );
        
        // Cards marked as "still learning" that should be reviewed
        const reviewCards = this.getCardsForReview();
        
        return [...unseenCards, ...reviewCards];
    }    getCardsForReview() {
        // Return cards that are marked as "still learning" for review
        return this.state.cards.filter(card => 
            this.state.learningIds.includes(card.id)
        );
    }

    getRandomReviewInterval() {
        // Return a random number between 5 and 50
        return Math.floor(Math.random() * (50 - 5 + 1)) + 5;
    }

    shouldInjectReviewCard() {
        // Check if we should inject a review card
        return this.state.cardsSinceLastReview >= this.state.nextReviewInterval && 
               this.state.learningIds.length > 0;
    }

    getRandomReviewCard() {
        // Get a random card from the "still learning" list
        const reviewableCards = this.getCardsForReview();
        if (reviewableCards.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * reviewableCards.length);
        return reviewableCards[randomIndex];
    }

    render() {
        this.renderProgress();
        this.renderCounters();
        this.renderCard();
        this.renderControls();
    }    renderProgress() {
        const totalCards = this.state.cards.length;
        const currentCard = this.getCurrentCard();
        
        if (!currentCard) {
            // All cards completed
            this.elements.progressLabel.textContent = `${totalCards} / ${totalCards}`;
        } else if (currentCard._isReviewCard) {
            // Showing a review card
            const current = Math.min(this.state.index + 1, totalCards);
            this.elements.progressLabel.textContent = `${current} / ${totalCards} (Review)`;
        } else {
            // In normal learning mode
            const current = Math.min(this.state.index + 1, totalCards);
            this.elements.progressLabel.textContent = `${current} / ${totalCards}`;
        }
    }

    renderCounters() {
        this.elements.knowCounter.textContent = this.state.knownIds.length;
        this.elements.learningCounter.textContent = this.state.learningIds.length;
    }    renderCard() {
        const currentCard = this.getCurrentCard();
        
        if (!currentCard) {
            this.renderEmptyState();
            return;
        }

        // ENSURE GERMAN WORD IS ALWAYS SHOWN FIRST
        // Force the card to always start on the front side (German)
        this.state.isFlipped = false;

        // Add review indicator if this is a review card
        const cardContainer = document.getElementById('cardContainer');
        if (currentCard._isReviewCard) {
            cardContainer.classList.add('review-card');
        } else {
            cardContainer.classList.remove('review-card');
        }

        // Front side
        this.elements.primaryText.textContent = currentCard.front.primaryText;
        this.elements.secondaryText.textContent = currentCard.front.secondaryText || '';
        this.elements.secondaryText.style.display = currentCard.front.secondaryText ? 'block' : 'none';

        // Handle front image
        if (currentCard.front.imageUrl) {
            this.elements.cardImage.src = currentCard.front.imageUrl;
            this.elements.cardImage.alt = `Image for ${currentCard.front.primaryText}`;
            this.elements.cardImageContainer.style.display = 'block';
            
            // Handle image load errors
            this.elements.cardImage.onerror = () => {
                console.warn(`Failed to load image: ${currentCard.front.imageUrl}`);
                this.elements.cardImageContainer.style.display = 'none';
            };
        } else {
            this.elements.cardImageContainer.style.display = 'none';
        }

        // Back side
        this.elements.translation.textContent = currentCard.back.translation;
        this.elements.example.textContent = currentCard.back.example || '';
        this.elements.example.style.display = currentCard.back.example ? 'block' : 'none';
        this.elements.notes.textContent = currentCard.back.notes || '';
        this.elements.notes.style.display = currentCard.back.notes ? 'block' : 'none';

        // Handle back image (same as front for now)
        if (currentCard.front.imageUrl) {
            this.elements.cardImageBack.src = currentCard.front.imageUrl;
            this.elements.cardImageBack.alt = `Image for ${currentCard.front.primaryText}`;
            this.elements.cardImageContainerBack.style.display = 'block';
            
            // Handle image load errors
            this.elements.cardImageBack.onerror = () => {
                console.warn(`Failed to load back image: ${currentCard.front.imageUrl}`);
                this.elements.cardImageContainerBack.style.display = 'none';
            };
        } else {
            this.elements.cardImageContainerBack.style.display = 'none';
        }        this.renderStarButtons();
        this.renderCardFlip();
        
        // Auto-play audio when a new card is shown
        this.autoPlayAudio();
    }

    renderCardFlip() {
        if (this.state.isFlipped) {
            this.elements.flashcard.classList.add('flipping');
        } else {
            this.elements.flashcard.classList.remove('flipping');
        }
    }

    renderStarButtons() {
        const currentCard = this.getCurrentCard();
        const isActive = currentCard && currentCard.isFavourite;
        
        this.elements.starBtn.textContent = isActive ? '★' : '☆';
        this.elements.starBtnBack.textContent = isActive ? '★' : '☆';
        
        if (isActive) {
            this.elements.starBtn.classList.add('active');
            this.elements.starBtnBack.classList.add('active');
        } else {
            this.elements.starBtn.classList.remove('active');
            this.elements.starBtnBack.classList.remove('active');
        }
    }

    renderControls() {
        this.elements.undoBtn.disabled = this.state.history.length === 0;
    }    renderEmptyState() {
        const stillLearningCount = this.state.learningIds.length;
        
        if (stillLearningCount > 0) {
            this.elements.primaryText.textContent = 'Review Complete! 📚';
            this.elements.secondaryText.textContent = `You still have ${stillLearningCount} card${stillLearningCount > 1 ? 's' : ''} to master`;
            this.elements.translation.textContent = 'Keep practicing to improve your retention!';
            this.elements.example.textContent = 'Swipe left on cards you need more practice with';
            this.elements.notes.textContent = 'Swipe right when you know them well';
        } else {
            this.elements.primaryText.textContent = 'All Done! 🎉';
            this.elements.secondaryText.textContent = 'You\'ve mastered all cards!';
            this.elements.translation.textContent = 'Excellent work!';
            this.elements.example.textContent = 'All cards are now in your "Known" collection';
            this.elements.notes.textContent = 'Come back later for more practice';
        }
        
        this.elements.starBtn.style.display = 'none';
        this.elements.starBtnBack.style.display = 'none';
        this.elements.audioBtn.style.display = 'none';
        this.elements.audioBtnBack.style.display = 'none';
        this.elements.cardImageContainer.style.display = 'none';
        this.elements.cardImageContainerBack.style.display = 'none';
    }saveStateToStorage() {
        // This method is now handled by saveUserProgress
        this.saveUserProgress();
    }

    loadStateFromStorage() {
        // This method is now handled by loadUserProgress
        this.loadUserProgress();
    }    async saveUserProgress() {
        console.log('🔍 [CLIENT DEBUG] saveUserProgress called, progressLoaded:', this.progressLoaded);
        
        if (!this.progressLoaded) {
            console.log('🔍 [CLIENT DEBUG] Progress not yet loaded, skipping save to prevent overwrite');
            return;
        }
        
        if (!this.authManager || !this.authManager.getCurrentUser()) {
            // Show login prompt for anonymous users
            this.showLoginPrompt();
            return;
        }

        try {
            const sessionTime = Date.now() - this.sessionStartTime;
            
            // Get favorite cards
            const favourites = this.state.cards.filter(card => card.isFavourite).map(card => card.id);
              const progressData = {
                known_cards: [...this.state.knownIds],
                learning_cards: [...this.state.learningIds],
                favourites: favourites,
                preferences: {
                    theme: this.state.theme,
                    last_card_index: this.state.index,
                    cards_since_last_review: this.state.cardsSinceLastReview,
                    next_review_interval: this.state.nextReviewInterval
                },
                session_time: sessionTime
            };

            console.log('🔍 [CLIENT DEBUG] Saving progress:', {
                known_cards: progressData.known_cards.length,
                learning_cards: progressData.learning_cards.length,
                favourites: progressData.favourites.length
            });

            await this.authManager.saveProgress(progressData);
            
            // Update last saved state
            this.lastSavedProgress = {
                knownIds: [...this.state.knownIds],
                learningIds: [...this.state.learningIds],
                favourites: [...favourites]
            };
            
            this.sessionStartTime = Date.now(); // Reset session timer
            
            console.log('✅ Progress saved to server');
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
        }
    }

    async loadUserProgress() {
        console.log('🔍 [CLIENT DEBUG] Starting loadUserProgress...');
        if (!this.authManager || !this.authManager.getCurrentUser()) {
            console.log('🔍 [CLIENT DEBUG] No authenticated user, skipping progress load');
            this.progressLoaded = true;
            return;
        }

        try {
            console.log('🔍 [CLIENT DEBUG] Loading progress from server...');
            const progress = await this.authManager.loadProgress();
            if (progress) {
                console.log('🔍 [CLIENT DEBUG] Progress loaded from server:', progress);
                console.log('🔍 [CLIENT DEBUG] Known cards from server:', progress.known_cards);
                console.log('🔍 [CLIENT DEBUG] Learning cards from server:', progress.learning_cards);
                console.log('🔍 [CLIENT DEBUG] Current state before update:');
                console.log('🔍 [CLIENT DEBUG] - knownIds:', this.state.knownIds);
                console.log('🔍 [CLIENT DEBUG] - learningIds:', this.state.learningIds);
                console.log('🔍 [CLIENT DEBUG] - current index:', this.state.index);
                
                this.state = {
                    ...this.state,
                    knownIds: progress.known_cards || [],
                    learningIds: progress.learning_cards || [],
                    theme: progress.preferences?.theme || 'dark',
                    cardsSinceLastReview: progress.preferences?.cards_since_last_review || 0,
                    nextReviewInterval: progress.preferences?.next_review_interval || this.getRandomReviewInterval()
                };

                console.log('🔍 [CLIENT DEBUG] State after update:');
                console.log('🔍 [CLIENT DEBUG] - knownIds:', this.state.knownIds);
                console.log('🔍 [CLIENT DEBUG] - learningIds:', this.state.learningIds);
                console.log('🔍 [CLIENT DEBUG] - current index:', this.state.index);

                // Restore favorites
                if (progress.favourites) {
                    this.state.cards = this.state.cards.map(card => ({
                        ...card,
                        isFavourite: progress.favourites.includes(card.id)
                    }));
                }

                // Restore last card index if available
                if (progress.preferences?.last_card_index !== undefined && progress.preferences.last_card_index < this.state.cards.length) {
                    console.log('🔍 [CLIENT DEBUG] Restoring last card index:', progress.preferences.last_card_index);
                    this.state.index = progress.preferences.last_card_index;
                }
                
                // Reset index to skip known cards
                this.resetCardIndexToNextUnknown();
                
                // Initialize last saved progress
                this.lastSavedProgress = {
                    knownIds: [...(progress.known_cards || [])],
                    learningIds: [...(progress.learning_cards || [])],
                    favourites: [...(progress.favourites || [])]
                };
                
                console.log('✅ Progress loaded from server');
                console.log('Known cards:', this.state.knownIds.length);
                console.log('Learning cards:', this.state.learningIds.length);
                console.log('Favorite cards:', progress.favourites?.length || 0);
                console.log('🔍 [CLIENT DEBUG] Current card after loading:', this.getCurrentCard()?.id);
            } else {
                console.log('🔍 [CLIENT DEBUG] No progress data found on server');
                // Initialize empty progress for new users
                this.lastSavedProgress = {
                    knownIds: [],
                    learningIds: [],
                    favourites: []
                };
            }
        } catch (error) {
            console.error('❌ Failed to load progress:', error);
            // Initialize empty progress on error
            this.lastSavedProgress = {
                knownIds: [],
                learningIds: [],
                favourites: []
            };
        } finally {
            this.progressLoaded = true;
            console.log('🔍 [CLIENT DEBUG] Progress loading complete, progressLoaded flag set to true');
            
            // Force the card index to move past known cards
            console.log('🔍 [CLIENT DEBUG] Checking if current card is known...');
            const currentCard = this.getCurrentCard();
            console.log('🔍 [CLIENT DEBUG] Current card after progress load:', currentCard?.id || 'null');
            
            // Re-render the UI to reflect loaded progress
            this.render();
            this.authManager.updateUserInfo();
        }
    }

    resetCardIndexToNextUnknown() {
        console.log('🔍 [INDEX RESET] Starting card index reset...');
        console.log('🔍 [INDEX RESET] Current index:', this.state.index);
        console.log('🔍 [INDEX RESET] Known cards:', this.state.knownIds);
        console.log('🔍 [INDEX RESET] Total cards:', this.state.cards.length);
        
        // Find the first card that is not known
        for (let i = 0; i < this.state.cards.length; i++) {
            const card = this.state.cards[i];
            if (!this.state.knownIds.includes(card.id)) {
                console.log('🔍 [INDEX RESET] Found first unknown card at index:', i, 'card:', card.id);
                this.state.index = i;
                return;
            }
        }
        
        // If all cards are known, set index to end
        console.log('🔍 [INDEX RESET] All cards are known, setting index to end');
        this.state.index = this.state.cards.length;
    }

    handleLogout() {
        if (confirm('Are you sure you want to sign out? Your progress has been saved.')) {
            this.saveUserProgress();
            this.authManager.logout();
        }
    }    setupAccountSettingsListeners() {
        const exportBtn = document.getElementById('exportBtn');
        const resetSessionBtn = document.getElementById('resetSessionBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        const closeSettings = document.getElementById('closeSettings');
        const accountSettings = document.getElementById('accountSettings');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUserData();
            });
        }

        if (resetSessionBtn) {
            resetSessionBtn.addEventListener('click', () => {
                this.handleResetSession();
            });
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.handleDeleteAccount();
            });
        }

        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                accountSettings.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        if (accountSettings) {
            accountSettings.addEventListener('click', (e) => {
                if (e.target === accountSettings) {
                    accountSettings.style.display = 'none';
                }
            });
        }
    }

    showAccountSettings() {
        const accountSettings = document.getElementById('accountSettings');
        if (accountSettings) {
            accountSettings.style.display = 'flex';
        }
    }

    exportUserData() {
        const userData = this.authManager.exportUserData();
        if (userData) {
            const blob = new Blob([userData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flashcard-progress-${this.authManager.getCurrentUser()}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Your progress has been exported successfully!');
        }
    }    handleDeleteAccount() {
        const confirmation = prompt(
            'Are you sure you want to delete your account? This action cannot be undone.\n\n' +
            'Type "DELETE" to confirm:'
        );
        
        if (confirmation === 'DELETE') {
            try {
                this.authManager.deleteAccount();
                alert('Your account has been deleted successfully.');
            } catch (error) {
                alert('Failed to delete account: ' + error.message);
            }
        }
    }

    handleResetSession() {
        const confirmation = confirm(
            'Are you sure you want to reset your current session?\n\n' +
            'This will:\n' +
            '• Start over from the first card\n' +
            '• Keep your overall progress (Known/Still Learning)\n' +
            '• Allow you to review all cards again\n\n' +
            'Your progress data will be saved.'
        );
        
        if (confirmation) {
            // Save current progress first
            this.saveUserProgress();
              // Reset session state
            this.state.index = 0;
            this.state.history = [];
            this.state.isFlipped = false;
            this.state.cardsSinceLastReview = 0;
            this.state.nextReviewInterval = this.getRandomReviewInterval();
            this.sessionStartTime = Date.now();
            
            // Re-render everything
            this.render();
            
            // Close settings modal
            const accountSettings = document.getElementById('accountSettings');
            if (accountSettings) {
                accountSettings.style.display = 'none';
            }
            
            console.log('✅ Session reset successfully');
        }
    }startStudySession() {
        if (!this.authManager || !this.authManager.getCurrentUser()) {
            return;
        }

        // Session tracking is handled locally
        console.log('✅ Study session started (local tracking)');
    }

    endStudySession() {
        if (!this.authManager || !this.authManager.getCurrentUser()) {
            return;
        }

        const sessionTime = Date.now() - this.sessionStartTime;
        console.log(`✅ Study session ended - Duration: ${Math.floor(sessionTime / 1000)}s`);
    }
}

// Global function for server auth to call when user logs in
window.initializeFlashCardApp = function() {
    console.log('🔍 [CLIENT DEBUG] initializeFlashCardApp called from server auth');
    if (!window.flashCardApp) {
        console.log('🔍 [CLIENT DEBUG] Creating new FlashCardApp instance');
        window.flashCardApp = new FlashCardApp();
    } else {
        console.log('🔍 [CLIENT DEBUG] FlashCardApp already exists, reloading progress');
        window.flashCardApp.loadUserProgress();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authentication to complete before initializing the app
    const initializeAppWhenReady = () => {
        if (typeof authManager !== 'undefined') {
            // The auth manager will handle showing login screen or app
            // We just need to make sure it's ready
            if (!window.flashCardApp) {
                window.flashCardApp = new FlashCardApp();
            }
        } else {
            setTimeout(initializeAppWhenReady, 100);
        }
    };
    
    // Start checking for auth readiness
    initializeAppWhenReady();
});

// Also listen for custom auth events
document.addEventListener('authReady', () => {
    window.initializeFlashCardApp();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashCardApp;
}
