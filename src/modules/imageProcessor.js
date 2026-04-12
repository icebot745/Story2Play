/**
 * Reads an image File and returns a data URL (base64).
 * No conversion — the original image is used as-is as the game background.
 */
export function imageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Could not read the image file. Please try again.'))
    reader.readAsDataURL(file)
  })
}

/** Returns true if the file is an accepted image type */
export function isValidImageFile(file) {
  return ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)
}
