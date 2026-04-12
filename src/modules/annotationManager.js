/**
 * Computes the bounding box of a set of points (canvas pixels).
 */
export function getBoundingBox(points) {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  }
}

/**
 * Normalises a pixel bounding box to 0–1 relative to the canvas dimensions.
 * This makes positions resolution-independent for the game engine.
 */
export function normalizeBox(box, canvasW, canvasH) {
  return {
    x: box.x / canvasW,
    y: box.y / canvasH,
    w: box.w / canvasW,
    h: box.h / canvasH,
  }
}

/**
 * Creates a new element entry for the GameSpec.
 */
export function createElement({ name, role, normalizedBox, canvasW, canvasH }) {
  return {
    id: `${role}-${Date.now()}`,
    name,
    role,
    ...normalizedBox,
  }
}

export const ROLES = [
  { value: 'player',      label: '🧍 Player',      color: '#4caf50' },
  { value: 'enemy',       label: '👾 Enemy',       color: '#f44336' },
  { value: 'collectible', label: '⭐ Collectible',  color: '#ffc107' },
  { value: 'obstacle',    label: '🧱 Obstacle',    color: '#795548' },
]

export function getRoleColor(role) {
  return ROLES.find(r => r.value === role)?.color ?? '#999'
}
