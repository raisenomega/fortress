/**
 * La CSP EFECTIVA del renderer, leida de la ventana real.
 *
 * La politica no esta escrita a mano en el HTML: la calcula un script en linea
 * segun el protocolo (file:// en el binario, http(s) en `npm run dev`) y la
 * emite con document.write. Eso la deja fuera del alcance de typecheck, de lint
 * y de vitest —es HTML con un script suelto—, asi que una guarda rota ahi no la
 * veria nada: la app arrancaria igual, con `style-src 'unsafe-inline'` metido
 * en el paquete o directamente sin meta. Este es el unico sitio del gate donde
 * esa politica se puede comprobar como la ve el navegador.
 *
 * El smoke carga por loadFile, o sea file://, que es por donde entra el binario
 * del operador: lo que se exige aqui es la rama de PRODUCCION.
 *
 * La politica se escribe aqui a mano A PROPOSITO. Derivarla del propio HTML
 * haria que la comprobacion dijera que si a cualquier cosa que ese HTML dijera,
 * que es exactamente lo que no se quiere: relajarla tiene que costar dos
 * ediciones y una justificacion escrita, no una.
 */
const CSP_PRODUCCION = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

/** Lee la meta que el parser inserto, no el texto del fichero. */
const META_CSP = `document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? ''`

/** El motivo del fallo, o null si la politica es la esperada. */
function revisaCsp(politica) {
  if (politica === '') return 'el renderer cargo SIN meta de Content-Security-Policy'
  if (politica === CSP_PRODUCCION) return null
  return `CSP inesperada en produccion — esperada "${CSP_PRODUCCION}", vista "${politica}"`
}

module.exports = { CSP_PRODUCCION, META_CSP, revisaCsp }
