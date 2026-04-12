import { useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { MOVEMENT_TYPES, buildDefaultMovements } from '../../modules/gameDefinitionBuilder'
import { getRoleColor } from '../../modules/annotationManager'

export default function MovementForm() {
  const { gameSpec, updateGameSpec } = useGame()
  const elements = gameSpec.elements || []
  const movements = gameSpec.movements || []

  // Seed movements from elements if not yet set
  useEffect(() => {
    if (elements.length > 0 && movements.length === 0) {
      updateGameSpec({ movements: buildDefaultMovements(elements) })
    }
  }, [])

  function getMovement(elementId) {
    return movements.find(m => m.elementId === elementId) ?? { type: 'stationary', speed: 3 }
  }

  function setType(elementId, type) {
    const updated = movements.map(m =>
      m.elementId === elementId ? { ...m, type } : m
    )
    updateGameSpec({ movements: updated })
  }

  function setSpeed(elementId, speed) {
    const updated = movements.map(m =>
      m.elementId === elementId ? { ...m, speed: Number(speed) } : m
    )
    updateGameSpec({ movements: updated })
  }

  if (elements.length === 0) {
    return (
      <div className="step-content">
        <h2>Step 3: How Do They Move?</h2>
        <p className="error-msg">Please go back and add some characters first.</p>
      </div>
    )
  }

  return (
    <div className="step-content">
      <h2>Step 3: How Do They Move?</h2>
      <p>Tell us how each character moves around your game world!</p>

      <div className="movement-list">
        {elements.map(el => {
          const mv = getMovement(el.id)
          return (
            <div key={el.id} className="movement-card" style={{ borderColor: getRoleColor(el.role) }}>
              <div className="movement-header">
                <span className="element-dot" style={{ background: getRoleColor(el.role) }} />
                <strong>{el.name}</strong>
                <span className="element-role">{el.role}</span>
              </div>

              <div className="movement-types">
                {MOVEMENT_TYPES.map(mt => (
                  <button
                    key={mt.value}
                    className={`movement-btn ${mv.type === mt.value ? 'selected' : ''}`}
                    onClick={() => setType(el.id, mt.value)}
                    title={mt.description}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>

              {mv.type !== 'stationary' && (
                <div className="speed-row">
                  <label>Speed</label>
                  <input
                    type="range"
                    min="1" max="10"
                    value={mv.speed}
                    onChange={e => setSpeed(el.id, e.target.value)}
                    className="speed-slider"
                  />
                  <span className="speed-value">{mv.speed}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
