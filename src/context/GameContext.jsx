import { createContext, useContext, useState } from 'react'

const initialGameSpec = {
  background: null,       // SVG string from ImageProcessor
  elements: [],           // [{ id, name, role, x, y, w, h }]
  movements: [],          // [{ elementId, type, speed }]
  winCondition: null,     // { type, target }
  rules: {                // from SpecialRulesForm
    scoring: false,
    pointsPerCollectible: 10,
    lives: 3,
    timeLimit: null,
  },
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [gameSpec, setGameSpec] = useState(initialGameSpec)

  function updateGameSpec(patch) {
    setGameSpec(prev => ({ ...prev, ...patch }))
  }

  return (
    <GameContext.Provider value={{ gameSpec, updateGameSpec }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
