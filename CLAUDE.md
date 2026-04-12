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

## Module Architecture

The app is composed of logical modules coordinated by a central orchestrator.
Each module has a clear input/output interface and can be built and tested independently.

```
┌─────────────────────────────────────────────────┐
│              WizardOrchestrator                  │
│  Manages step flow, holds game state, triggers   │
│  other modules in sequence                       │
└──────┬──────────────────────────────────────────┘
       │ calls
       ▼
┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ ImageProcessor│   │AnnotationManager│   │GameDefinition    │
│              │   │                 │   │Builder           │
│ image → SVG  │   │ Canvas drawing  │   │ Collects steps   │
│ (Step 1)     │   │ circle → label  │   │ 3, 4, 5 into     │
│              │   │ + position      │   │ structured spec  │
│ ImageTracer  │   │ (Step 2)        │   │                  │
└──────────────┘   └─────────────────┘   └────────┬─────────┘
                                                   │ outputs GameSpec
                                                   ▼
                                         ┌──────────────────┐
                                         │  GameGenerator   │
                                         │                  │
                                         │ GameSpec → .html │
                                         │ SVG + JS engine  │
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  PreviewEngine   │
                                         │                  │
                                         │ Renders in iframe│
                                         │ + download button│
                                         └──────────────────┘
```

### Module Responsibilities

| Module | Input | Output |
|---|---|---|
| **WizardOrchestrator** | User actions | Step transitions, shared state |
| **ImageProcessor** | Raw image file | SVG string |
| **AnnotationManager** | SVG + user drawing | `[{name, role, x, y, w, h}]` |
| **GameDefinitionBuilder** | Steps 3–5 form data | `GameSpec` object |
| **GameGenerator** | `GameSpec` | `.html` string |
| **PreviewEngine** | `.html` string | Live iframe + download button |

### The `GameSpec` Object

```js
{
  background: "<svg>...</svg>",
  elements: [
    { id: "hero", role: "player", x: 120, y: 80, w: 40, h: 40 },
    { id: "coin", role: "collectible", x: 300, y: 150, w: 20, h: 20 }
  ],
  movements: [
    { elementId: "hero", type: "arrow-keys", speed: 5 },
    { elementId: "enemy", type: "auto-patrol", speed: 2 }
  ],
  winCondition: { type: "collect-all", target: "coin" },
  rules: { scoring: true, lives: 3 }
}
```

### Folder Structure

```
src/
  modules/
    imageProcessor.js        ← image → SVG (ImageTracer.js)
    annotationManager.js     ← canvas drawing + label extraction
    gameDefinitionBuilder.js ← assembles GameSpec from form data
    gameGenerator.js         ← GameSpec → .html output
    previewEngine.js         ← iframe render + download
  components/
    Wizard.jsx               ← orchestrator UI + step router
    steps/
      ImageUpload.jsx
      AnnotationCanvas.jsx
      MovementForm.jsx
      WinConditionForm.jsx
      SpecialRulesForm.jsx
      Preview.jsx
  context/
    GameContext.jsx           ← shared GameSpec state across steps
```

## Technical Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React | Simple wizard UI, one component per step |
| Annotation | HTML5 Canvas overlay | Freehand circle drawing on the uploaded image |
| Image → SVG | ImageTracer.js | Client-side raster-to-SVG conversion |
| Game engine | SVG + vanilla JS | Embedded in the output `.html` file |
| Output | Single `.html` file | Self-contained, downloadable, no server needed |
| Backend | None | Fully client-side, session-based |

## Key Decisions
- **No AI in the web app.** Game logic is generated from structured rule templates. API cost = $0 per user.
- **No sound.** Out of scope for initial version.
- **No accounts or persistence.** Everything lives in the browser session.
- **SVG-based game output.** Characters are SVG elements — simpler to move than Canvas sprites.
- **Responsive web app.** Works on desktop and tablet browsers.
- **Single viewport.** The entire game fits in one screen — no scrolling levels.

## Game Engine (inside output `.html`)
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
