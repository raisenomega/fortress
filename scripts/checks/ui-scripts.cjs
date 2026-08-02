/** Fragmentos que se evaluan dentro del renderer desde los scripts de preview. */

const BODY_TEXT = 'document.body.innerText'

/** Pulsa el primer boton cuyo texto contenga `text`. Devuelve si lo encontro. */
const clickByText = (text) => `(() => {
  const target = Array.from(document.querySelectorAll('button'))
    .find((button) => button.textContent.includes(${JSON.stringify(text)}))
  if (!target) return false
  target.click()
  return true
})()`

const clickSelector = (selector) => `(() => {
  const target = document.querySelector(${JSON.stringify(selector)})
  if (!target) return false
  target.click()
  return true
})()`

module.exports = { BODY_TEXT, clickByText, clickSelector }
