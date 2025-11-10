# Trapped in a Dream - Interactive Horror Experience

An immersive 3D horror experience where you're trapped in a nightmare you can't wake up from. Navigate through a dark, dreamlike room and make choices that lead to three different endings.

## Storyline

You slowly wake up in what feels like a dream. Your eyes open to find yourself in a dark, abstract room—quiet but unsettling. The space feels alive but not quite real. There are mirrors on the walls, a faint meowing sound echoing around, and a small door with a crack of light leaking through it.

Your goal is to try to escape the dream... or at least find out what's real. But depending on the choices you make, the dream reacts differently.

### Three Paths:

1. **The Mirror** - Approach your reflection and discover you're trapped in a loop
2. **The Cat** - Follow the three-eyed cat and experience a shocking awakening
3. **The Door** - Walk toward the light and question if you've truly escaped

## Features

- **First-person 3D environment** built with Three.js
- **WASD + Mouse controls** for intuitive navigation
- **Atmospheric horror** with fog, particles, and dynamic lighting
- **Three unique endings** based on your choices
- **Immersive sound design** and visual effects
- **Psychological horror** - subtle, disturbing, not violent

## How to Play

### Controls:
- **WASD** - Move around
- **Mouse** - Look around (click to lock cursor)
- **E** - Interact with objects
- **ESC** - Unlock cursor

### Instructions:
1. Click "Wake Up" to begin
2. Click on the screen to lock your cursor and start looking around
3. Explore the room and find three interactive elements
4. Get close to an object and press **E** to interact
5. Each choice leads to a different ending

## Running the Project

### Option 1: Simple HTTP Server

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server -p 8000
```

Then open your browser to `http://localhost:8000`

### Option 2: Live Server (VS Code)

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Access

Simply open `index.html` in a modern web browser. Note: Some browsers may block certain features when opening files directly. Using a local server is recommended.

## Technical Details

### Built With:
- **Three.js** (v0.160.0) - 3D graphics library
- **JavaScript (ES6+)** - Game logic
- **HTML5/CSS3** - UI and styling

### Key Features Implemented:
- Pointer Lock API for first-person controls
- Dynamic lighting system with multiple light sources
- Particle system for atmospheric dust
- Fog effects for depth and mystery
- Collision detection and boundary system
- Interactive object system
- Multiple ending states
- Responsive design

### Browser Compatibility:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires a modern browser with WebGL support.

## Project Structure

```
.
├── index.html          # Main HTML entry point with UI
├── main.js            # Three.js game logic and scene setup
└── README.md          # This file
```

## Artistic Vision

The experience is inspired by:
- Liminal spaces and dream logic
- Psychological horror (not jump scares)
- The feeling of being trapped between sleep and waking
- Surreal and distorted reality
- The question: "Am I really awake?"

## Credits

Created for IXP1 Project 3 - Interactive Nightmare Experience

## Future Enhancements

Potential additions:
- Audio files for cat meowing and ambient sounds
- More complex room geometry
- Additional interactive objects
- Save system for multiple playthroughs
- Enhanced particle effects
- Post-processing effects (chromatic aberration, vignette)
