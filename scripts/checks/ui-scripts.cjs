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

/**
 * Comprueba que el circulo de cada switch cae dentro de su pista. Devuelve la
 * lista de infracciones, vacia si todo esta bien.
 *
 * El circulo se posiciona en absoluto: si alguien quita el `left`, cae en su
 * posicion estatica y se sale de la pista. Paso, y a simple vista solo se nota
 * en el estado encendido.
 */
const TOGGLES_INSIDE_TRACK = `(() => {
  const problemas = []
  for (const boton of document.querySelectorAll('button[role="switch"]')) {
    const circulo = boton.querySelector('span')
    if (!circulo) { problemas.push('switch sin circulo'); continue }
    const p = boton.getBoundingClientRect()
    const c = circulo.getBoundingClientRect()
    const margenes = {
      izq: c.left - p.left, der: p.right - c.right,
      arriba: c.top - p.top, abajo: p.bottom - c.bottom
    }
    const fuera = Object.entries(margenes).filter(([, v]) => v < -0.5)
    if (fuera.length > 0) {
      problemas.push(
        \`switch \${boton.getAttribute('aria-checked')}: \` +
        fuera.map(([lado, v]) => \`\${lado} \${v.toFixed(1)}px\`).join(', ')
      )
    }
  }
  return problemas
})()`

module.exports = { BODY_TEXT, clickByText, clickSelector, TOGGLES_INSIDE_TRACK }
