# Story2Play

## Overview

A web app that lets users create a single-screen game by describing it through images and drawing — no coding required. Targeted at kids aged 6–14. Session-based: no accounts, no server, no saved data. The output is a downloadable `.html` file the user opens in any browser to play their game.

## User Flow

The app guides the user conversationally through each step, one at a time.

### Step 1: Upload Screen Image
- User uploads an image of what the game screen should look like.
- The image is converted to SVG client-side using ImageTracer.js.
- The SVG becomes the visual reference and background for the game.

### Step 2: Identify Character Elements
- The app prompts the user to identify the character elements on the screen.
- User draws a freehand circle on the image around an element (HTML5 Canvas overlay).
- A popup then asks: "What is this?" — user types a name and role (e.g. "hero", "enemy", "coin").
- The bounding box of the circle sets the element's starting position in the game.
- User repeats until all elements are labeled.
- Input method: **text only** for now.

### Step 3: Define Character Movements
- The app asks the user to explain how characters move and behave.
- Examples: reacts to arrow keys, auto-moves left/right, jumps, follows the player, etc.

### Step 4: Define Win Condition
- The app asks the user how the game is won.
- Examples: reach the end, collect all items, defeat all enemies, survive for X seconds.

### Step 5: Special Rules / How to Play
- The app asks for any additional gameplay rules.
- Examples: how scoring works, lives/health system, power-ups, time limits.

### Step 6: Preview & Iterate
- The user can preview the generated game before downloading.
- They can go back to any step and adjust, then re-preview.
- When satisfied, they download the game as a single self-contained `.html` file.

## Technical Architecture

### Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React | Simple wizard UI, one component per step |
| Annotation | HTML5 Canvas overlay | Freehand circle drawing on the uploaded image |
| Image → SVG | ImageTracer.js | Client-side rasterimage to SVG conversion |
| Game engine | SVG + vanilla JS | Embedded in the output `.html` file |
| Output | Single `.html` file | Self-contained, downloadable, no server needed |
| Backend | None | Fully client-side, session-based |

### Key Decisions
- **No AI for now.** Game logic is generated from structured rule templates based on user input. AI can be layered in later.
- **No sound.** Out of scope for initial version.
- **No accounts or persistence.** Everything lives in the browser session. Output is the downloaded file.
- **SVG-based game output.** Characters are SVG elements that move around the SVG background — simpler to manipulate than Canvas sprites.
- **Responsive web app.** Works on desktop and tablet browsers.
- **Single viewport.** The entire game fits in one screen — no scrolling levels.

### Game Engine (inside output `.html`)
- SVG render loop driven by `requestAnimationFrame`
- Keyboard event handling (arrow keys, etc.)
- Character/element system using SVG elements (position, velocity, type)
- Collision detection between elements
- Score tracking and display
- Win/loss condition evaluation

## Future Enhancements (not in scope now)
- Voice input (speech-to-text) for all text fields
- AI vision to auto-detect and label elements from the image
- AI-enhanced game logic generation from natural language
- Sound effects
- Multi-screen / scrolling levels
- Save and share games online

## Notes
- Best suited for simple illustrations and cartoon-style images (ImageTracer.js works poorly on photos).
- The app should feel playful and approachable for kids — minimal jargon, encouraging tone.
