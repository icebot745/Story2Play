import { useEffect, useState } from 'react'
import { useGame } from '../../context/GameContext'
import { generateGame } from '../../modules/gameGenerator'
import { downloadHtml } from '../../modules/previewEngine'
import { isGameSpecComplete } from '../../modules/gameDefinitionBuilder'

export default function Preview() {
  const { gameSpec } = useGame()
  const [htmlOutput, setHtmlOutput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isGameSpecComplete(gameSpec)) return
    try {
      setHtmlOutput(generateGame(gameSpec))
      setError('')
    } catch (err) {
      setError('Could not generate game: ' + err.message)
    }
  }, [gameSpec])

  if (!isGameSpecComplete(gameSpec)) {
    return (
      <div className="step-content">
        <h2>Step 6: Preview Your Game</h2>
        <p className="error-msg">Please complete all previous steps first.</p>
      </div>
    )
  }

  return (
    <div className="step-content">
      <h2>Your Game is Ready! 🎉</h2>
      <p>Try it below — use arrow keys or the on-screen buttons. When you're happy, download it!</p>

      {error && <p className="error-msg">{error}</p>}

      {htmlOutput && (
        <>
          <div className="preview-wrap">
            <iframe
              className="game-iframe"
              title="Game Preview"
              srcDoc={htmlOutput}
              sandbox="allow-scripts"
            />
          </div>
          <button
            className="btn btn-primary preview-download-btn"
            onClick={() => downloadHtml(htmlOutput)}
          >
            ⬇️ Download My Game!
          </button>
        </>
      )}
    </div>
  )
}
