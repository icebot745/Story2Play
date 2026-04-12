import { useGame } from '../../context/GameContext'
import { WIN_TYPES } from '../../modules/gameDefinitionBuilder'
import { getRoleColor } from '../../modules/annotationManager'

export default function WinConditionForm() {
  const { gameSpec, updateGameSpec } = useGame()
  const elements = gameSpec.elements || []
  const win = gameSpec.winCondition || {}

  function setWinType(type) {
    updateGameSpec({ winCondition: { ...win, type, target: null } })
  }

  function setTarget(target) {
    updateGameSpec({ winCondition: { ...win, target } })
  }

  function setDuration(seconds) {
    updateGameSpec({ winCondition: { ...win, duration: Number(seconds) } })
  }

  // Elements relevant to each win type
  const targetableElements = {
    'reach-goal':         elements.filter(e => ['obstacle', 'collectible'].includes(e.role)),
    'defeat-all-enemies': elements.filter(e => e.role === 'enemy'),
    'collect-all':        elements.filter(e => e.role === 'collectible'),
  }

  const needsTarget = ['reach-goal'].includes(win.type)
  const needsDuration = win.type === 'survive-timer'

  return (
    <div className="step-content">
      <h2>Step 4: How Do You Win?</h2>
      <p>What does the player need to do to win your game?</p>

      <div className="win-grid">
        {WIN_TYPES.map(wt => (
          <button
            key={wt.value}
            className={`win-btn ${win.type === wt.value ? 'selected' : ''}`}
            onClick={() => setWinType(wt.value)}
          >
            <span className="win-icon">{wt.label.split(' ')[0]}</span>
            <span className="win-label">{wt.label.split(' ').slice(1).join(' ')}</span>
            <span className="win-desc">{wt.description}</span>
          </button>
        ))}
      </div>

      {needsTarget && (
        <div className="form-group">
          <label>Which element is the goal?</label>
          <div className="target-list">
            {(targetableElements[win.type] || elements).map(el => (
              <button
                key={el.id}
                className={`target-btn ${win.target === el.id ? 'selected' : ''}`}
                style={{ '--role-color': getRoleColor(el.role) }}
                onClick={() => setTarget(el.id)}
              >
                {el.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {needsDuration && (
        <div className="form-group">
          <label>Survive for how many seconds?</label>
          <div className="speed-row">
            <input
              type="range"
              min="10" max="120" step="5"
              value={win.duration ?? 30}
              onChange={e => setDuration(e.target.value)}
              className="speed-slider"
            />
            <span className="speed-value">{win.duration ?? 30}s</span>
          </div>
        </div>
      )}
    </div>
  )
}
