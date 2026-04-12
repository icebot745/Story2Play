import { useGame } from '../../context/GameContext'

export default function SpecialRulesForm() {
  const { gameSpec, updateGameSpec } = useGame()
  const rules = gameSpec.rules || {}

  function setRule(key, value) {
    updateGameSpec({ rules: { ...rules, [key]: value } })
  }

  return (
    <div className="step-content">
      <h2>Step 5: Any Special Rules?</h2>
      <p>Add scoring, lives, or a time limit to make your game more exciting!</p>

      <div className="rules-list">

        {/* Scoring */}
        <div className="rule-card">
          <div className="rule-header">
            <span className="rule-icon">⭐</span>
            <div>
              <strong>Scoring</strong>
              <p className="rule-desc">Earn points when you collect things</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!rules.scoring}
                onChange={e => setRule('scoring', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {rules.scoring && (
            <div className="speed-row" style={{ marginTop: '0.75rem' }}>
              <label>Points per collectible</label>
              <input
                type="range"
                min="5" max="100" step="5"
                value={rules.pointsPerCollectible ?? 10}
                onChange={e => setRule('pointsPerCollectible', Number(e.target.value))}
                className="speed-slider"
              />
              <span className="speed-value">{rules.pointsPerCollectible ?? 10}</span>
            </div>
          )}
        </div>

        {/* Lives */}
        <div className="rule-card">
          <div className="rule-header">
            <span className="rule-icon">❤️</span>
            <div>
              <strong>Lives</strong>
              <p className="rule-desc">How many chances does the player get?</p>
            </div>
          </div>
          <div className="lives-row">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`lives-btn ${(rules.lives ?? 3) === n ? 'selected' : ''}`}
                onClick={() => setRule('lives', n)}
              >
                {'❤️'.repeat(n)}
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div className="rule-card">
          <div className="rule-header">
            <span className="rule-icon">⏱️</span>
            <div>
              <strong>Time Limit</strong>
              <p className="rule-desc">Race against the clock!</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!rules.timeLimit}
                onChange={e => setRule('timeLimit', e.target.checked ? 60 : null)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {rules.timeLimit && (
            <div className="speed-row" style={{ marginTop: '0.75rem' }}>
              <label>Seconds</label>
              <input
                type="range"
                min="10" max="180" step="10"
                value={rules.timeLimit}
                onChange={e => setRule('timeLimit', Number(e.target.value))}
                className="speed-slider"
              />
              <span className="speed-value">{rules.timeLimit}s</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
