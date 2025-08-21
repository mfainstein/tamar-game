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
    }

    async init(imagePath, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="puzzle-canvas-container">
                <canvas id="jigsaw-canvas"></canvas>
            </div>
        `;

        this.canvas = document.getElementById('jigsaw-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        await this.loadImage(imagePath);
        this.setupCanvas();
        this.createPieces();
        this.shufflePieces();
        this.setupEventListeners();
        this.draw();
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
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
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
        
        if (distance < this.snappingThreshold) {
            piece.currentX = correctX;
            piece.currentY = correctY;
            piece.isPlaced = true;
            this.playSnapSound();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.globalAlpha = 0.2;
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1.0;
        
        this.pieces.forEach(piece => {
            const sourceX = piece.correctCol * (this.image.width / this.cols);
            const sourceY = piece.correctRow * (this.image.height / this.rows);
            const sourceWidth = this.image.width / this.cols;
            const sourceHeight = this.image.height / this.rows;
            
            this.ctx.save();
            
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
            
            this.ctx.restore();
        });
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