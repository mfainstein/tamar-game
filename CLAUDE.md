# Tamar Reading Game - Project Documentation

## Overview
A Hebrew reading game for children featuring interactive stories with multiple game modes. The application is designed for teaching Hebrew reading through engaging activities.

## Project Structure

### Main Files
- `index.html` - Main HTML structure with all game screens
- `app.js` - Core game logic and state management
- `styles.css` - All styling and responsive design
- `game-data.json` - Story content and word definitions
- `jigsaw-puzzle.js` - Jigsaw puzzle game implementation
- `server.js` - Simple Express server for local hosting

### Directory Structure
```
tamar-game/
├── images/
│   ├── [story_name]/        # Story-specific images
│   │   ├── [word].png       # Word images
│   │   └── [story]_background.png
│   └── jigsaw/              # Jigsaw puzzle images
└── StoriesForTamari.pdf     # Source material
```

## Game Architecture

### Game Types
The game includes 4 different game types:
1. **Find the Word** - Select the word that matches an image
2. **Match Picture** - Select the image that matches a word
3. **First Letter** - Select the first letter of the word shown in an image
4. **Word Composition** (NEW) - Build the word from a set of letters

### Game Flow
1. Welcome Screen → Story Selection
2. Story Selection → Mode Selection (Read Story / Play Games / Jigsaw)
3. Mode Selection → Game Screen / Reading Screen / Jigsaw Screen
4. Games cycle through all words with different game types
5. Celebration screen upon completion

### Key Classes and Methods

#### TamarReadingGame Class
Main game controller managing:
- Story loading and selection
- Game sequence generation
- Progress tracking
- Audio management
- Screen transitions

#### Important Methods
- `generateGameSequence()` - Creates randomized game order avoiding consecutive same words
- `renderGame()` - Renders current game based on type
- `renderWordCompositionGame()` - New method for word building game
- `setupWordCompositionListeners()` - Handles letter selection and word validation

## New Word Composition Feature

### Implementation Details
- Players select letters from a letter bank to compose words
- Limited set of letters (word letters + 2-4 extra letters)
- Visual feedback for correct/incorrect attempts
- Reset button to clear current attempt
- Check button to validate the composed word

### Letter Selection Logic
- Click letter tiles to add to word slots
- Click used letters to remove them
- Letters fill slots from left to right
- Visual states: normal, used, correct, incorrect

## Technologies Used
- Vanilla JavaScript (ES6+)
- CSS3 with animations and transitions
- Web Speech API for Hebrew text-to-speech
- Web Audio API for sound effects
- Responsive design for mobile/tablet

## Development Notes

### Adding New Stories
1. Add story data to `game-data.json`
2. Add images to `images/[story_name]/`
3. Include background image as `[story_name]_background.png`

### Hebrew Text Direction
- RTL (right-to-left) direction set globally
- Word composition maintains RTL layout

### Mobile Optimizations
- Touch-friendly button sizes
- Viewport meta tags for proper scaling
- Responsive breakpoints at 768px and 480px

## Testing Recommendations
- Test on various screen sizes (mobile, tablet, desktop)
- Verify Hebrew text-to-speech functionality
- Check game progression and scoring
- Validate word composition game with different word lengths

## Future Enhancements
- Drag-and-drop support for letter tiles
- Progress persistence (localStorage)
- Difficulty levels for word composition
- Additional game modes
- Analytics and progress tracking