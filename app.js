class TamarReadingGame {
    constructor() {
        this.gameData = null;
        this.currentStory = null;
        this.gameSequence = []; // Array of {word, gameType} objects
        this.currentGameIndex = 0;
        this.totalGames = 0;
        this.completedGames = 0;
        this.audioEnabled = true;
        
        this.gameTypeNames = [
            'מצאי את המילה',
            'מצאי את התמונה', 
            'מצאי את האות הראשונה'
        ];
        
        this.init();
    }

    async init() {
        try {
            // Load game data
            const response = await fetch('./game-data.json');
            this.gameData = await response.json();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start with welcome screen
            this.showScreen('welcome-screen');
            
        } catch (error) {
            console.error('Error loading game:', error);
            alert('שגיאה בטעינת המשחק. אנא נסי שוב.');
        }
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('play-btn').addEventListener('click', () => {
            this.showStorySelection();
        });

        // Navigation buttons
        document.getElementById('back-to-welcome').addEventListener('click', () => {
            this.showScreen('welcome-screen');
        });

        document.getElementById('back-to-stories').addEventListener('click', () => {
            this.showStorySelection();
        });

        // Celebration screen buttons
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startStory(this.currentStory);
        });

        document.getElementById('choose-story-btn').addEventListener('click', () => {
            this.showStorySelection();
        });

        // Audio toggle
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.toggleAudio();
        });
    }

    showScreen(screenId) {
        // Remove active class from all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Clear story background if not on game or celebration screen
        if (screenId !== 'game-screen' && screenId !== 'celebration-screen') {
            this.clearStoryBackground();
        }
        
        // Add active class to target screen
        setTimeout(() => {
            document.getElementById(screenId).classList.add('active');
        }, 100);
    }

    setStoryBackground(backgroundImage) {
        if (!backgroundImage) return;
        
        // Set the background image on body::after pseudo-element
        document.body.style.setProperty('--story-background', `url('${backgroundImage}')`);
        document.body.classList.add('story-active');
        
        // Show overlay for better contrast
        const overlay = document.getElementById('story-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    clearStoryBackground() {
        document.body.classList.remove('story-active');
        
        // Hide overlay
        const overlay = document.getElementById('story-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Clear the background after transition
        setTimeout(() => {
            document.body.style.removeProperty('--story-background');
        }, 800);
    }

    showStorySelection() {
        this.renderStoryCards();
        this.showScreen('story-selection');
    }

    renderStoryCards() {
        const storiesGrid = document.getElementById('stories-grid');
        storiesGrid.innerHTML = '';

        this.gameData.stories.forEach((story, index) => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';
            storyCard.style.animationDelay = `${index * 0.1}s`;
            
            storyCard.innerHTML = `
                <img src="${story.image}" alt="${story.title}" class="story-image" 
                     onerror="this.style.display='none'">
                <div class="story-info">
                    <div class="story-title">${story.title}</div>
                    <div class="story-word-count">${story.words.length} מילים</div>
                </div>
            `;
            
            storyCard.addEventListener('click', () => {
                this.startStory(story);
            });
            
            storiesGrid.appendChild(storyCard);
        });
    }

    startStory(story) {
        this.currentStory = story;
        this.currentGameIndex = 0;
        this.completedGames = 0;
        
        // Generate shuffled game sequence
        this.gameSequence = this.generateGameSequence(story);
        this.totalGames = this.gameSequence.length;
        
        // Set story background
        this.setStoryBackground(story.background);
        
        this.showScreen('game-screen');
        this.updateProgress();
        this.renderGame();
    }

    generateGameSequence(story) {
        // Create all possible game combinations
        const allGames = [];
        story.words.forEach(word => {
            for (let gameType = 0; gameType < 3; gameType++) {
                allGames.push({ word, gameType });
            }
        });

        // Shuffle to create random order while avoiding consecutive same words
        const shuffledGames = this.shuffleAvoidingConsecutive(allGames);
        
        return shuffledGames;
    }

    shuffleAvoidingConsecutive(games) {
        // First, do a basic shuffle
        let shuffled = this.shuffle([...games]);
        
        // Try to avoid consecutive games with the same word
        let maxAttempts = 100;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            let hasConsecutive = false;
            
            // Check for consecutive same words
            for (let i = 0; i < shuffled.length - 1; i++) {
                if (shuffled[i].word.word === shuffled[i + 1].word.word) {
                    hasConsecutive = true;
                    
                    // Try to find a non-consecutive position for the second game
                    for (let j = i + 2; j < shuffled.length; j++) {
                        if (shuffled[j].word.word !== shuffled[i].word.word && 
                            (j === shuffled.length - 1 || shuffled[j + 1].word.word !== shuffled[i + 1].word.word)) {
                            // Swap positions
                            [shuffled[i + 1], shuffled[j]] = [shuffled[j], shuffled[i + 1]];
                            break;
                        }
                    }
                }
            }
            
            if (!hasConsecutive) break;
            attempts++;
        }
        
        return shuffled;
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const gameTypeBadge = document.getElementById('game-type');
        
        const progressPercent = (this.completedGames / this.totalGames) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        progressText.textContent = `${this.completedGames + 1} / ${this.totalGames}`;
        
        if (this.currentGameIndex < this.gameSequence.length) {
            const currentGame = this.gameSequence[this.currentGameIndex];
            gameTypeBadge.textContent = this.gameTypeNames[currentGame.gameType];
        }
    }

    renderGame() {
        if (this.currentGameIndex >= this.gameSequence.length) {
            this.showCelebration();
            return;
        }

        const currentGame = this.gameSequence[this.currentGameIndex];
        const currentWord = currentGame.word;
        const gameType = currentGame.gameType;
        
        const gameArea = document.getElementById('game-area');
        
        let gameHTML = '';
        
        switch (gameType) {
            case 0:
                gameHTML = this.renderFindWordGame(currentWord);
                break;
            case 1:
                gameHTML = this.renderMatchPictureGame(currentWord);
                break;
            case 2:
                gameHTML = this.renderFirstLetterGame(currentWord);
                break;
        }
        
        gameArea.innerHTML = gameHTML;
        
        // Add event listeners after rendering
        setTimeout(() => {
            this.addGameEventListeners(currentWord);
            // Speak the word
            if (this.audioEnabled) {
                this.speakHebrew(currentWord.word);
            }
        }, 100);
    }

    renderFindWordGame(correctWord) {
        const choices = this.generateWordChoices(correctWord);
        
        return `
            <div class="game-question">
                <img src="${correctWord.image}" alt="${correctWord.word}" 
                     class="game-image" onerror="this.style.display='none'">
                <div class="game-instruction">איזו מילה מתאימה לתמונה?</div>
                <button class="audio-btn" data-word="${correctWord.word}">🔊</button>
            </div>
            <div class="choices-grid">
                ${choices.map(choice => `
                    <button class="choice-btn" data-type="word" 
                            data-value="${choice.word}" data-correct="${correctWord.word}">
                        <div class="choice-text">${choice.word}</div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderMatchPictureGame(correctWord) {
        const choices = this.generateImageChoices(correctWord);
        
        return `
            <div class="game-question">
                <div class="game-text">${correctWord.word}</div>
                <div class="game-instruction">איזו תמונה מתאימה למילה?</div>
                <button class="audio-btn" data-word="${correctWord.word}">🔊</button>
            </div>
            <div class="choices-grid">
                ${choices.map(choice => `
                    <button class="choice-btn" data-type="image" 
                            data-value="${choice.image}" data-correct="${correctWord.image}">
                        <img src="${choice.image}" alt="" class="choice-image" 
                             onerror="this.style.display='none'">
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderFirstLetterGame(correctWord) {
        const choices = this.generateLetterChoices(correctWord);
        
        return `
            <div class="game-question">
                <img src="${correctWord.image}" alt="${correctWord.word}" 
                     class="game-image" onerror="this.style.display='none'">
                <div class="game-instruction">באיזו אות מתחילה המילה?</div>
                <button class="audio-btn" data-word="${correctWord.word}">🔊</button>
            </div>
            <div class="choices-grid">
                ${choices.map(choice => `
                    <button class="choice-btn" data-type="letter" 
                            data-value="${choice}" data-correct="${correctWord.firstLetter}">
                        <div class="choice-letter">${choice}</div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    generateWordChoices(correctWord) {
        const allWords = this.currentStory.words.filter(w => w.word !== correctWord.word);
        const shuffled = this.shuffle([...allWords]);
        const otherWords = shuffled.slice(0, Math.min(2, allWords.length));
        const choices = [correctWord, ...otherWords];
        return this.shuffle(choices);
    }

    generateImageChoices(correctWord) {
        const allWords = this.currentStory.words.filter(w => w.image !== correctWord.image);
        const shuffled = this.shuffle([...allWords]);
        const otherWords = shuffled.slice(0, Math.min(2, allWords.length));
        const choices = [correctWord, ...otherWords];
        return this.shuffle(choices);
    }

    generateLetterChoices(correctWord) {
        const allLetters = [...new Set(this.currentStory.words.map(w => w.firstLetter))];
        const otherLetters = allLetters.filter(l => l !== correctWord.firstLetter);
        const shuffled = this.shuffle([...otherLetters]);
        const selectedOthers = shuffled.slice(0, Math.min(2, otherLetters.length));
        const choices = [correctWord.firstLetter, ...selectedOthers];
        return this.shuffle(choices);
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    addGameEventListeners(currentWord) {
        // Audio button
        const audioBtn = document.querySelector('.audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                if (this.audioEnabled) {
                    this.speakHebrew(audioBtn.dataset.word);
                }
            });
        }

        // Choice buttons
        const choiceBtns = document.querySelectorAll('.choice-btn[data-type]');
        choiceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleChoice(btn);
            });
        });
    }

    handleChoice(buttonElement) {
        const isCorrect = buttonElement.dataset.value === buttonElement.dataset.correct;
        
        // Disable all choice buttons
        document.querySelectorAll('.choice-btn[data-type]').forEach(btn => {
            btn.style.pointerEvents = 'none';
        });

        if (isCorrect) {
            buttonElement.classList.add('correct');
            this.playCorrectSound();
            
            setTimeout(() => {
                this.nextGame();
            }, 1500);
        } else {
            buttonElement.classList.add('incorrect');
            this.playIncorrectSound();
            
            // Re-enable buttons after feedback
            setTimeout(() => {
                document.querySelectorAll('.choice-btn[data-type]').forEach(btn => {
                    btn.style.pointerEvents = 'auto';
                    btn.classList.remove('incorrect');
                });
            }, 1000);
        }
    }

    nextGame() {
        this.completedGames++;
        this.currentGameIndex++;
        
        this.updateProgress();
        
        setTimeout(() => {
            this.renderGame();
        }, 500);
    }

    showCelebration() {
        // Keep story background active during celebration
        this.showScreen('celebration-screen');
        this.playCelebrationSound();
    }

    speakHebrew(text) {
        if (!this.audioEnabled || !('speechSynthesis' in window)) return;
        
        speechSynthesis.cancel(); // Cancel any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        
        speechSynthesis.speak(utterance);
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const audioIcon = document.querySelector('.audio-icon');
        audioIcon.textContent = this.audioEnabled ? '🔊' : '🔇';
    }

    playCorrectSound() {
        if (!this.audioEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Fallback for browsers that don't support Web Audio API
            console.log('Audio feedback not available');
        }
    }

    playIncorrectSound() {
        if (!this.audioEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (error) {
            console.log('Audio feedback not available');
        }
    }

    playCelebrationSound() {
        if (!this.audioEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.2);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.3);
                
                oscillator.start(audioContext.currentTime + index * 0.2);
                oscillator.stop(audioContext.currentTime + index * 0.2 + 0.3);
            });
        } catch (error) {
            console.log('Audio feedback not available');
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TamarReadingGame();
});