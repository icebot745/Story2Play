# Story2Play — Implementation Plan

## Guiding Principles
- Build one module at a time, test before moving on.
- Each phase produces something runnable.
- Keep it simple — no over-engineering.
- This is also a learning project for multiagent Claude development.

---

## Phase 1: Project Scaffold
**Goal:** Running Vite + React app with wizard shell and shared state.

### Tasks
- [ ] Initialize Vite + React project
- [ ] Install dependencies: `imagetracerjs`
- [ ] Set up folder structure (`modules/`, `components/steps/`, `context/`)
- [ ] Create `GameContext.jsx` — holds `GameSpec` state, shared across all steps
- [ ] Create `Wizard.jsx` — step router, renders one step at a time, handles next/back
- [ ] Create placeholder components for all 6 steps (empty shells)
- [ ] Basic styling: clean, kid-friendly, responsive layout

**Done when:** App runs, you can click Next/Back through 6 empty steps.

---

## Phase 2: Image Upload & SVG Conversion
**Goal:** User uploads an image, app converts it to SVG and displays it.

### Tasks
- [ ] Build `ImageUpload.jsx` — drag-and-drop or file picker
- [ ] Build `imageProcessor.js` — wraps ImageTracer.js, takes image file, returns SVG string
- [ ] Display the converted SVG in the UI
- [ ] Store SVG in `GameContext`
- [ ] Handle edge cases: wrong file type, very large image, conversion failure

**Done when:** User uploads an image, sees it rendered as SVG, clicks Next.

---

## Phase 3: Annotation — Freehand Circle + Label
**Goal:** User can circle elements on the image and label them.

### Tasks
- [ ] Build `AnnotationCanvas.jsx` — HTML5 Canvas overlaid on the SVG
- [ ] Implement freehand drawing on canvas (mousedown → mousemove → mouseup)
- [ ] On mouseup: detect bounding box of drawn path
- [ ] Show label popup: "What is this?" with name + role fields (player / enemy / collectible / obstacle)
- [ ] Build `annotationManager.js` — manages element list, computes bounding boxes
- [ ] Display labeled element list below the canvas
- [ ] Allow deleting a labeled element
- [ ] Store element list in `GameContext`

**Done when:** User circles 2–3 elements, labels them, sees the list, clicks Next.

---

## Phase 4: Movement, Win Condition & Rules Forms
**Goal:** User fills in game behavior through structured forms.

### Tasks
- [ ] Build `MovementForm.jsx`
  - Per-element movement type: arrow-keys / auto-patrol / follows-player / stationary
  - Speed slider per element
- [ ] Build `WinConditionForm.jsx`
  - Win type: collect-all / reach-end / defeat-all-enemies / survive-timer
  - Target element selector (from element list)
- [ ] Build `SpecialRulesForm.jsx`
  - Scoring toggle + points per collectible
  - Lives counter (1–5)
  - Time limit (optional)
- [ ] Build `gameDefinitionBuilder.js` — assembles `GameSpec` from context state
- [ ] Store completed `GameSpec` in `GameContext`

**Done when:** User fills all three forms, `GameSpec` is complete and logged to console.

---

## Phase 5: Game Generator
**Goal:** `GameSpec` → working `.html` game file.

### Tasks
- [ ] Build `gameGenerator.js`
  - SVG background from `GameSpec.background`
  - SVG elements for each character (colored rectangles for now, positioned from annotation)
  - Vanilla JS game loop (`requestAnimationFrame`)
  - Keyboard event handling (arrow keys)
  - Movement logic per element type (arrow-keys, auto-patrol, follows-player)
  - Collision detection (bounding box overlap)
  - Scoring display (SVG text overlay)
  - Lives display
  - Win condition evaluation + win screen
  - Loss condition (lives = 0) + game over screen
- [ ] Output is a single self-contained HTML string (no external dependencies)

**Done when:** `gameGenerator.js` takes a hardcoded `GameSpec` and produces a playable `.html` file.

---

## Phase 6: Preview & Download
**Goal:** User previews the game in the app and can download it.

### Tasks
- [ ] Build `Preview.jsx`
  - Render generated `.html` in a sandboxed `<iframe>`
  - "Download Game" button — triggers `.html` file download
  - "Go Back" links to return to any previous step
- [ ] Build `previewEngine.js` — handles iframe injection and file download logic
- [ ] Wire up full flow: all steps → generate → preview → download
- [ ] Test the downloaded file opens and plays correctly in a browser

**Done when:** User completes all steps, previews a working game, downloads the `.html` file, and plays it.

---

## Phase 7: Polish & Testing
**Goal:** App is solid, kid-friendly, and handles edge cases.

### Tasks
- [ ] Responsive layout — works on tablet and desktop
- [ ] Kid-friendly UI copy — encouraging tone, no jargon
- [ ] Loading states (SVG conversion can take a moment)
- [ ] Error messages for common failures
- [ ] Test with several different image types and game configurations
- [ ] Cross-browser test the downloaded game file (Chrome, Firefox, Safari)
- [ ] Accessibility basics: keyboard navigation, readable font sizes

**Done when:** Full end-to-end flow works reliably with no rough edges.

---

## Future Phases (post-MVP)

### Phase 8: Voice Input
- Add microphone button to text fields
- Use Web Speech API (browser built-in, free) for speech-to-text
- Transcription fills the text field; user can edit before confirming

### Phase 9: AI Enhancements
- AI vision (Claude) to auto-detect and label elements from the uploaded image
- Natural language movement/rule descriptions interpreted by Claude
- Cost-per-session estimate: ~$0.01–$0.05

### Phase 10: Share & Save
- Generate a shareable URL (encode GameSpec in URL or use a simple backend)
- Save game to local storage for later editing

---

## Module Build Order Summary

```
Phase 1  →  GameContext + Wizard shell
Phase 2  →  ImageProcessor
Phase 3  →  AnnotationManager + AnnotationCanvas
Phase 4  →  GameDefinitionBuilder + MovementForm + WinConditionForm + SpecialRulesForm
Phase 5  →  GameGenerator
Phase 6  →  PreviewEngine + Preview
Phase 7  →  Polish
```
