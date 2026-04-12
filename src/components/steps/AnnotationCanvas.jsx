import { useRef, useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import {
  getBoundingBox,
  normalizeBox,
  createElement,
  ROLES,
  OBSTACLE_SUBTYPES,
  getRoleColor,
} from '../../modules/annotationManager'

export default function AnnotationCanvas() {
  const { gameSpec, updateGameSpec } = useGame()
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const drawingRef = useRef(false)
  const pointsRef = useRef([])

  const [pendingBox, setPendingBox] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('player')
  const [subtype, setSubtype] = useState('brickwall')
  const nameInputRef = useRef(null)

  const elements = gameSpec.elements || []

  // ── Resize canvas to match the rendered image ─────
  useEffect(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    function syncSize() {
      canvas.width = img.offsetWidth
      canvas.height = img.offsetHeight
    }
    syncSize()
    window.addEventListener('resize', syncSize)
    return () => window.removeEventListener('resize', syncSize)
  }, [gameSpec.background])

  // ── Drawing helpers ───────────────────────────────
  function getPos(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function startDraw(pos) {
    drawingRef.current = true
    pointsRef.current = [pos]
    redrawCanvas([pos])
  }

  function continueDraw(pos) {
    if (!drawingRef.current) return
    pointsRef.current.push(pos)
    redrawCanvas(pointsRef.current)
  }

  function finishDraw() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const pts = pointsRef.current
    if (pts.length < 3) return

    const canvas = canvasRef.current
    const box = getBoundingBox(pts)

    // Ignore tiny accidental taps
    if (box.w < 10 || box.h < 10) {
      clearCanvas()
      return
    }

    const normalized = normalizeBox(box, canvas.width, canvas.height)
    setPendingBox(normalized)
    setShowPopup(true)
    setName('')
    setRole('player')
    setSubtype('brickwall')
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function redrawCanvas(pts) {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw saved elements
    elements.forEach(el => drawElement(ctx, el, canvas.width, canvas.height))

    // Draw current stroke
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  function drawElement(ctx, el, w, h) {
    const x = el.x * w
    const y = el.y * h
    const ew = el.w * w
    const eh = el.h * h
    const color = getRoleColor(el.role)

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.setLineDash([6, 3])
    ctx.strokeRect(x, y, ew, eh)
    ctx.setLineDash([])

    ctx.fillStyle = color + '33'
    ctx.fillRect(x, y, ew, eh)

    ctx.fillStyle = color
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(el.name, x + 4, y + 16)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    elements.forEach(el => drawElement(ctx, el, canvas.width, canvas.height))
  }

  // ── Touch listeners (non-passive to allow preventDefault) ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onTouchStart = e => { e.preventDefault(); const t = e.touches[0]; startDraw(getPos(t.clientX, t.clientY)) }
    const onTouchMove  = e => { e.preventDefault(); const t = e.touches[0]; continueDraw(getPos(t.clientX, t.clientY)) }
    const onTouchEnd   = e => { e.preventDefault(); finishDraw() }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  })

  // Redraw when elements change
  useEffect(() => {
    if (!canvasRef.current) return
    clearCanvas()
  }, [elements])

  // ── Popup confirm ─────────────────────────────────
  function confirmElement() {
    if (!name.trim()) return
    const el = createElement({ name: name.trim(), role, subtype, normalizedBox: pendingBox })
    updateGameSpec({ elements: [...elements, el] })
    setShowPopup(false)
    setPendingBox(null)
  }

  function cancelPopup() {
    setShowPopup(false)
    setPendingBox(null)
    clearCanvas()
  }

  function deleteElement(id) {
    updateGameSpec({ elements: elements.filter(el => el.id !== id) })
  }

  if (!gameSpec.background) {
    return (
      <div className="step-content">
        <h2>Step 2: Place Your Characters</h2>
        <p className="error-msg">Please go back and upload a background image first.</p>
      </div>
    )
  }

  return (
    <div className="step-content">
      <h2>Step 2: Place Your Characters</h2>
      <p>Draw a circle around where each character starts. Then tell us who they are!</p>

      <div className="annotation-wrap">
        <img
          ref={imageRef}
          src={gameSpec.background}
          alt="Game world"
          className="annotation-image"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="annotation-canvas"
          onMouseDown={e => startDraw(getPos(e.clientX, e.clientY))}
          onMouseMove={e => continueDraw(getPos(e.clientX, e.clientY))}
          onMouseUp={finishDraw}
          onMouseLeave={finishDraw}
        />
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>What is this?</h3>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Hero, Monster, Coin…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmElement()}
              className="popup-input"
            />
            <div className="role-grid">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  className={`role-btn ${role === r.value ? 'selected' : ''}`}
                  style={{ '--role-color': r.color }}
                  onClick={() => setRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {role === 'obstacle' && (
              <div className="subtype-row">
                <p className="subtype-label">Obstacle style:</p>
                <div className="subtype-btns">
                  {OBSTACLE_SUBTYPES.map(s => (
                    <button
                      key={s.value}
                      className={`subtype-btn ${subtype === s.value ? 'selected' : ''}`}
                      onClick={() => setSubtype(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="popup-actions">
              <button className="btn btn-secondary" onClick={cancelPopup}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmElement} disabled={!name.trim()}>
                Add Character
              </button>
            </div>
          </div>
        </div>
      )}

      {elements.length > 0 && (
        <div className="element-list">
          <h3>Your characters ({elements.length})</h3>
          {elements.map(el => (
            <div key={el.id} className="element-item" style={{ borderColor: getRoleColor(el.role) }}>
              <span className="element-dot" style={{ background: getRoleColor(el.role) }} />
              <span className="element-name">{el.name}</span>
              <span className="element-role">{el.role}</span>
              <button className="element-delete" onClick={() => deleteElement(el.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {elements.length === 0 && (
        <p className="upload-hint" style={{ marginTop: '0.75rem' }}>
          Draw a circle on the image above to place your first character.
        </p>
      )}
    </div>
  )
}
