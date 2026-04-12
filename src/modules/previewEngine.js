/**
 * Triggers a browser download of the generated game HTML as a .html file.
 */
export function downloadGame(htmlString, filename = 'my-game.html') {
  const blob = new Blob([htmlString], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
