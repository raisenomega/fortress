/**
 * Emblema de FORTRESS: torre almenada dorada sobre el negro-navy de Raisen.
 * Colores tomados del contrato de tokens: --background 225 15% 5% y
 * --primary 38 85% 55%.
 */
const BACKGROUND = '#0b0c0f'
const GOLD = '#eea72b'

const MERLONS = [136, 188, 240, 292, 344]
  .map((x) => `<rect x="${x}" y="152" width="32" height="56" rx="4" fill="${GOLD}"/>`)
  .join('')

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${BACKGROUND}"/>
  ${MERLONS}
  <rect x="136" y="200" width="240" height="208" rx="10" fill="${GOLD}"/>
  <path d="M216 408 V338 a40 40 0 0 1 80 0 v70 Z" fill="${BACKGROUND}"/>
  <rect x="168" y="240" width="28" height="40" rx="6" fill="${BACKGROUND}"/>
  <rect x="316" y="240" width="28" height="40" rx="6" fill="${BACKGROUND}"/>
</svg>`

const PAGE = `<style>
  html,body{margin:0;padding:0;background:transparent}
  svg{display:block}
</style>${SVG}`

module.exports = { PAGE, SIZE: 512 }
