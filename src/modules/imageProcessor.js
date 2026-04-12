import ImageTracer from 'imagetracerjs'

/**
 * Converts an image File to an SVG string using ImageTracer.js.
 * Returns a promise that resolves to the SVG string.
 */
export function imageToSvg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      // Draw image onto an offscreen canvas
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        // Fewer colors = simpler SVG, better for game backgrounds
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
