import { useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import { imageToDataUrl, isValidImageFile } from '../../modules/imageProcessor'

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
      const dataUrl = await imageToDataUrl(file)
      updateGameSpec({ background: dataUrl })
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
      <h2>Step 1: Upload Your Game World</h2>
      <p>
        Draw or take a photo of your game background — the world where your characters will move.
        <strong> Don't add characters yet</strong>, we'll place those in the next step!
      </p>

      {status !== 'done' && (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${status === 'error' ? 'has-error' : ''}`}
          onClick={() => status !== 'loading' && inputRef.current?.click()}
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
              <p>Loading image…</p>
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
          <img
            src={gameSpec.background}
            alt="Your game world"
            className="image-preview"
          />
          <button className="btn btn-secondary btn-small" onClick={reset}>
            ↩ Use a different image
          </button>
        </div>
      )}
    </div>
  )
}
