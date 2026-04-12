import { useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import { imageToSvg, isValidImageFile } from '../../modules/imageProcessor'

export default function ImageUpload() {
  const { gameSpec, updateGameSpec } = useGame()
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!isValidImageFile(file)) {
      setErrorMsg('Please upload a PNG, JPG, GIF, or WebP image.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const svg = await imageToSvg(file)
      updateGameSpec({ background: svg })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function onFileInput(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  function reset() {
    updateGameSpec({ background: null })
    setStatus('idle')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="step-content">
      <h2>Step 1: Upload Your Game Screen</h2>
      <p>Upload a picture of what you want your game to look like — a drawing, screenshot, or any image!</p>

      {status !== 'done' && (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${status === 'error' ? 'has-error' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={onFileInput}
            style={{ display: 'none' }}
          />
          {status === 'loading' ? (
            <>
              <div className="spinner" />
              <p>Converting to SVG…</p>
            </>
          ) : (
            <>
              <div className="upload-icon">🖼️</div>
              <p><strong>Tap to choose an image</strong></p>
              <p className="upload-hint">or drag and drop here</p>
              <p className="upload-hint">PNG, JPG, GIF, WebP</p>
            </>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="error-msg">{errorMsg}</p>
      )}

      {status === 'done' && gameSpec.background && (
        <div className="svg-preview">
          <div
            className="svg-container"
            dangerouslySetInnerHTML={{ __html: gameSpec.background }}
          />
          <button className="btn btn-secondary btn-small" onClick={reset}>
            ↩ Use a different image
          </button>
        </div>
      )}
    </div>
  )
}
