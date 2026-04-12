/**
 * Movement types available for each element.
 * Not all types make sense for every role — defaults are suggested per role.
 */
export const MOVEMENT_TYPES = [
  { value: 'arrow-keys',     label: '🎮 Arrow keys',       description: 'Player controls with keys or buttons' },
  { value: 'auto-patrol',    label: '↔️ Patrol L/R',       description: 'Moves left and right on its own' },
  { value: 'auto-patrol-v',  label: '↕️ Patrol U/D',       description: 'Moves up and down on its own' },
  { value: 'follows-player', label: '🏃 Follows player',   description: 'Chases the player around' },
  { value: 'stationary',     label: '🗿 Stays still',      description: 'Does not move' },
]

export const DEFAULT_MOVEMENT_BY_ROLE = {
  player:      'arrow-keys',
  enemy:       'auto-patrol',
  collectible: 'stationary',
  obstacle:    'stationary',
}

/**
 * Win condition types.
 */
export const WIN_TYPES = [
  { value: 'collect-all',      label: '⭐ Collect all',       description: 'Collect every collectible' },
  { value: 'reach-goal',       label: '🏁 Reach the goal',    description: 'Player touches a specific element' },
  { value: 'defeat-all-enemies', label: '⚔️ Defeat all enemies', description: 'Remove all enemies from the screen' },
  { value: 'survive-timer',    label: '⏱️ Survive!',          description: 'Stay alive for a set time' },
]

/**
 * Builds the initial movements array from the element list,
 * applying sensible defaults per role.
 */
export function buildDefaultMovements(elements) {
  return elements.map(el => ({
    elementId: el.id,
    type: DEFAULT_MOVEMENT_BY_ROLE[el.role] ?? 'stationary',
    speed: el.role === 'player' ? 5 : 3,
  }))
}

/**
 * Returns true if the GameSpec has enough data to generate a game.
 */
export function isGameSpecComplete(gameSpec) {
  return (
    !!gameSpec.background &&
    gameSpec.elements?.length > 0 &&
    gameSpec.movements?.length > 0 &&
    !!gameSpec.winCondition?.type
  )
}
