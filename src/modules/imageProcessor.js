import ImageTracer from 'imagetracerjs'

// Max dimension before tracing — keeps canvas within mobile browser limits
// and makes ImageTracer run much faster
const MAX_SIZE = 1200

/**
 * Scales width/height down so neither exceeds MAX_SIZE, preserving aspect ratio.
 */
function scaledDimensions(w, h) {
  if (w <= MAX_SIZE && h <= MAX_SIZE) return { w, h }
  const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h)
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

/**
 * Converts an image File to an SVG string using ImageTracer.js.
 * Resizes large images before tracing to avoid mobile canvas limits.
 */
export function imageToSvg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const { w, h } = scaledDimensions(img.naturalWidth, img.naturalHeight)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)

      try {
        const imageData = ctx.getImageData(0, 0, w, h)
        const options = {
          numberofcolors: 16,
          strokewidth: 1,
          scale: 1,
          ltres: 1,
          qtres: 1,
          pathomit: 8,
        }
        const svgString = ImageTracer.imagedataToSVG(imageData, options)
        resolve(svgString)
      } catch (err) {
        reject(new Error('Failed to convert image to SVG: ' + err.message))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load the image. Please try a different file.'))
    }

    img.src = url
  })
}

/** Returns true if the file is an accepted image type */
export function isValidImageFile(file) {
  return ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)
}
