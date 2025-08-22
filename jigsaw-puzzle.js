class JigsawPuzzle {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.pieces = [];
        this.draggedPiece = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.cols = 3;
        this.rows = 3;
        this.pieceWidth = 0;
        this.pieceHeight = 0;
        this.isCompleted = false;
        this.snappingThreshold = 30;
        this.difficulty = 'medium';
        this.rotation = false;
        
        // Difficulty settings
        this.difficultySettings = {
            veryEasy: { cols: 2, rows: 2, snapping: 40, rotation: false, name: 'קל מאוד' },
            easy: { cols: 3, rows: 2, snapping: 35, rotation: false, name: 'קל' },
            medium: { cols: 3, rows: 3, snapping: 30, rotation: false, name: 'בינוני' },
            hard: { cols: 4, rows: 4, snapping: 25, rotation: false, name: 'קשה' },
            veryHard: { cols: 5, rows: 5, snapping: 20, rotation: true, name: 'קשה מאוד' }
        };
    }

    async init(imagePath, containerId, difficulty = 'medium') {
        this.setDifficulty(difficulty);
        
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="puzzle-difficulty-selector">
                <label>רמת קושי:</label>
                <div class="difficulty-buttons">
                    <button class="difficulty-btn ${difficulty === 'veryEasy' ? 'active' : ''}" data-difficulty="veryEasy">קל מאוד (2×2)</button>
                    <button class="difficulty-btn ${difficulty === 'easy' ? 'active' : ''}" data-difficulty="easy">קל (3×2)</button>
                    <button class="difficulty-btn ${difficulty === 'medium' ? 'active' : ''}" data-difficulty="medium">בינוני (3×3)</button>
                    <button class="difficulty-btn ${difficulty === 'hard' ? 'active' : ''}" data-difficulty="hard">קשה (4×4)</button>
                    <button class="difficulty-btn ${difficulty === 'veryHard' ? 'active' : ''}" data-difficulty="veryHard">קשה מאוד (5×5)</button>
                </div>
            </div>
            <div class="puzzle-canvas-container">
                <canvas id="jigsaw-canvas"></canvas>
            </div>
        `;

        this.canvas = document.getElementById('jigsaw-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup difficulty selector
        this.setupDifficultySelector(imagePath, containerId);
        
        await this.loadImage(imagePath);
        this.setupCanvas();
        this.createPieces();
        this.shufflePieces();
        this.setupEventListeners();
        this.draw();
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        const settings = this.difficultySettings[difficulty];
        this.cols = settings.cols;
        this.rows = settings.rows;
        this.snappingThreshold = settings.snapping;
        this.rotation = settings.rotation;
    }
    
    setupDifficultySelector(imagePath, containerId) {
        const buttons = document.querySelectorAll('.difficulty-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const newDifficulty = e.target.dataset.difficulty;
                if (newDifficulty !== this.difficulty) {
                    // Update active button
                    buttons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Save difficulty preference
                    localStorage.setItem('jigsawDifficulty', newDifficulty);
                    
                    // Reinitialize with new difficulty
                    this.setDifficulty(newDifficulty);
                    this.setupCanvas();
                    this.createPieces();
                    this.shufflePieces();
                    this.isCompleted = false;
                    this.draw();
                }
            });
        });
    }

    async loadImage(imagePath) {
        return new Promise((resolve, reject) => {
            this.image = new Image();
            this.image.onload = () => resolve();
            this.image.onerror = reject;
            this.image.src = imagePath;
        });
    }

    setupCanvas() {
        const maxWidth = Math.min(window.innerWidth * 0.9, 600);
        const maxHeight = Math.min(window.innerHeight * 0.6, 400);
        
        const scale = Math.min(maxWidth / this.image.width, maxHeight / this.image.height);
        
        this.canvas.width = this.image.width * scale;
        this.canvas.height = this.image.height * scale;
        
        this.pieceWidth = this.canvas.width / this.cols;
        this.pieceHeight = this.canvas.height / this.rows;
    }

    createPieces() {
        this.pieces = [];
        let id = 0;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.pieces.push({
                    id: id++,
                    correctCol: col,
                    correctRow: row,
                    currentX: 0,
                    currentY: 0,
                    width: this.pieceWidth,
                    height: this.pieceHeight,
                    rotation: 0,
                    isPlaced: false
                });
            }
        }
    }

    shufflePieces() {
        const margin = 20;
        const availableWidth = this.canvas.width - margin * 2;
        const availableHeight = this.canvas.height - margin * 2;
        
        this.pieces.forEach(piece => {
            piece.currentX = margin + Math.random() * (availableWidth - piece.width);
            piece.currentY = margin + Math.random() * (availableHeight - piece.height);
            piece.isPlaced = false;
            
            // Add rotation for very hard difficulty
            if (this.rotation) {
                piece.rotation = Math.floor(Math.random() * 4) * 90;
            } else {
                piece.rotation = 0;
            }
        });
        
        // For harder difficulties, ensure pieces are more spread out
        if (this.difficulty === 'hard' || this.difficulty === 'veryHard') {
            this.spreadPieces();
        }
    }
    
    spreadPieces() {
        // Spread pieces more evenly to avoid overlapping
        const gridCols = Math.ceil(Math.sqrt(this.pieces.length));
        const gridRows = Math.ceil(this.pieces.length / gridCols);
        const cellWidth = (this.canvas.width - 40) / gridCols;
        const cellHeight = (this.canvas.height - 40) / gridRows;
        
        const shuffledPieces = [...this.pieces].sort(() => Math.random() - 0.5);
        
        shuffledPieces.forEach((piece, index) => {
            const gridX = index % gridCols;
            const gridY = Math.floor(index / gridCols);
            
            piece.currentX = 20 + gridX * cellWidth + Math.random() * (cellWidth - piece.width);
            piece.currentY = 20 + gridY * cellHeight + Math.random() * (cellHeight - piece.height);
            
            // Ensure piece stays within canvas
            piece.currentX = Math.max(10, Math.min(piece.currentX, this.canvas.width - piece.width - 10));
            piece.currentY = Math.max(10, Math.min(piece.currentY, this.canvas.height - piece.height - 10));
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevent context menu for right-click rotation
        this.canvas.addEventListener('contextmenu', (e) => {
            if (this.rotation) {
                e.preventDefault();
            }
        });
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Double tap for rotation on mobile (very hard mode)
        let lastTap = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0 && this.rotation) {
                e.preventDefault();
                const pos = this.getTouchPos(e);
                const piece = this.getPieceAtPosition(pos.x, pos.y);
                if (piece && !piece.isPlaced) {
                    piece.rotation = (piece.rotation + 90) % 360;
                    this.draw();
                }
            }
            lastTap = currentTime;
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }

    getPieceAtPosition(x, y) {
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const piece = this.pieces[i];
            if (!piece.isPlaced &&
                x >= piece.currentX && x <= piece.currentX + piece.width &&
                y >= piece.currentY && y <= piece.currentY + piece.height) {
                return piece;
            }
        }
        return null;
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        // Check for right click to rotate (only in very hard mode)
        if (e.button === 2 && this.rotation) {
            e.preventDefault();
            const piece = this.getPieceAtPosition(pos.x, pos.y);
            if (piece && !piece.isPlaced) {
                piece.rotation = (piece.rotation + 90) % 360;
                this.draw();
            }
            return;
        }
        
        this.draggedPiece = this.getPieceAtPosition(pos.x, pos.y);
        
        if (this.draggedPiece) {
            this.offsetX = pos.x - this.draggedPiece.currentX;
            this.offsetY = pos.y - this.draggedPiece.currentY;
            
            const index = this.pieces.indexOf(this.draggedPiece);
            this.pieces.splice(index, 1);
            this.pieces.push(this.draggedPiece);
        }
    }

    handleMouseMove(e) {
        if (this.draggedPiece) {
            const pos = this.getMousePos(e);
            this.draggedPiece.currentX = pos.x - this.offsetX;
            this.draggedPiece.currentY = pos.y - this.offsetY;
            this.draw();
        }
    }

    handleMouseUp(e) {
        if (this.draggedPiece) {
            this.checkSnapping(this.draggedPiece);
            this.draggedPiece = null;
            this.draw();
            this.checkCompletion();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.draggedPiece = this.getPieceAtPosition(pos.x, pos.y);
        
        if (this.draggedPiece) {
            this.offsetX = pos.x - this.draggedPiece.currentX;
            this.offsetY = pos.y - this.draggedPiece.currentY;
            
            const index = this.pieces.indexOf(this.draggedPiece);
            this.pieces.splice(index, 1);
            this.pieces.push(this.draggedPiece);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.draggedPiece) {
            const pos = this.getTouchPos(e);
            this.draggedPiece.currentX = pos.x - this.offsetX;
            this.draggedPiece.currentY = pos.y - this.offsetY;
            this.draw();
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.draggedPiece) {
            this.checkSnapping(this.draggedPiece);
            this.draggedPiece = null;
            this.draw();
            this.checkCompletion();
        }
    }

    checkSnapping(piece) {
        const correctX = piece.correctCol * this.pieceWidth;
        const correctY = piece.correctRow * this.pieceHeight;
        
        const distance = Math.sqrt(
            Math.pow(piece.currentX - correctX, 2) +
            Math.pow(piece.currentY - correctY, 2)
        );
        
        // Check rotation for very hard mode
        const correctRotation = !this.rotation || piece.rotation % 360 === 0;
        
        if (distance < this.snappingThreshold && correctRotation) {
            piece.currentX = correctX;
            piece.currentY = correctY;
            piece.rotation = 0;
            piece.isPlaced = true;
            this.playSnapSound();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw guide image with lower opacity for harder difficulties
        const guideOpacity = this.difficulty === 'veryHard' ? 0.1 : 
                           this.difficulty === 'hard' ? 0.15 : 0.2;
        this.ctx.globalAlpha = guideOpacity;
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1.0;
        
        this.pieces.forEach(piece => {
            const sourceX = piece.correctCol * (this.image.width / this.cols);
            const sourceY = piece.correctRow * (this.image.height / this.rows);
            const sourceWidth = this.image.width / this.cols;
            const sourceHeight = this.image.height / this.rows;
            
            this.ctx.save();
            
            // Apply rotation if needed
            if (piece.rotation && !piece.isPlaced) {
                const centerX = piece.currentX + piece.width / 2;
                const centerY = piece.currentY + piece.height / 2;
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(piece.rotation * Math.PI / 180);
                this.ctx.translate(-centerX, -centerY);
            }
            
            if (!piece.isPlaced) {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                this.ctx.shadowBlur = 5;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
            }
            
            this.ctx.strokeStyle = piece.isPlaced ? '#4CAF50' : '#333';
            this.ctx.lineWidth = piece.isPlaced ? 2 : 1;
            
            this.ctx.drawImage(
                this.image,
                sourceX, sourceY, sourceWidth, sourceHeight,
                piece.currentX, piece.currentY, piece.width, piece.height
            );
            
            this.ctx.strokeRect(piece.currentX, piece.currentY, piece.width, piece.height);
            
            // Add rotation indicator for very hard mode
            if (this.rotation && !piece.isPlaced && piece.rotation % 360 !== 0) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(piece.currentX + piece.width - 10, piece.currentY + 10, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
        
        // Draw difficulty indicator
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = '14px Heebo';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.difficultySettings[this.difficulty].name, 10, 20);
        this.ctx.restore();
    }

    checkCompletion() {
        const allPlaced = this.pieces.every(piece => piece.isPlaced);
        
        if (allPlaced && !this.isCompleted) {
            this.isCompleted = true;
            this.onComplete();
        }
    }

    onComplete() {
        setTimeout(() => {
            this.playCelebrationSound();
            
            // Add completion effect
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = 'rgba(103, 126, 234, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw celebration text
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 48px Heebo';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('🎉 כל הכבוד! 🎉', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.restore();
            
            const event = new CustomEvent('puzzleCompleted', {
                detail: { puzzleName: this.image.src }
            });
            document.dispatchEvent(event);
        }, 300);
    }

    playSnapSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio not available');
        }
    }

    playCelebrationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
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
            console.log('Audio not available');
        }
    }

    reset() {
        this.shufflePieces();
        this.pieces.forEach(piece => piece.isPlaced = false);
        this.isCompleted = false;
        this.draw();
    }
}