import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import { generateGame } from '../../modules/gameGenerator'
import { downloadGame } from '../../modules/previewEngine'

export default function Preview() {
  const { gameSpec } = useGame()
  const iframeRef   = useRef(null)
  const [html, setHtml] = useState('')

  useEffect(() => {
    const generated = generateGame(gameSpec)
    setHtml(generated)
  }, [gameSpec])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    iframe.srcdoc = html
  }, [html])

  return (
    <div className="step-content">
      <h2>🎮 Play Your Game!</h2>
      <p>
        Try it out below — use the <strong>arrow keys</strong> to move.
        On mobile, use the on-screen buttons inside the game.
      </p>

      <div className="preview-wrap">
        <iframe
          ref={iframeRef}
          className="game-preview"
          title="Game Preview"
          sandbox="allow-scripts"
        />
      </div>

      <div className="preview-actions">
        <button
          className="btn btn-primary"
          onClick={() => downloadGame(html)}
          disabled={!html}
        >
          ⬇️ Download Game
        </button>
        <p className="preview-tip">
          Save the file and open it in any browser to play — no internet needed!
        </p>
      </div>
    </div>
  )
}
