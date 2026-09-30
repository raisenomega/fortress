/** Absoluta, sin NUL y sin `..`: lo unico que se le pasa a bwrap como ruta. */
export const rutaLimpia = (ruta: string): boolean =>
  ruta.startsWith('/') && !ruta.includes('\0') && !ruta.split('/').includes('..')

/** Si `hija` es `padre` o vive debajo. Por SEGMENTOS: `/home/ana2` no esta
 *  dentro de `/home/ana`, y un `startsWith` a secas diria que si. */
export function dentroDe(padre: string, hija: string): boolean {
  const base = padre.endsWith('/') ? padre : `${padre}/`
  return hija === padre || hija.startsWith(base)
}

export interface RutasDeLaCaja {
  readonly proyecto: string
  readonly cwd: string
  readonly home: string
  readonly otras: readonly string[]
}

/**
 * Por que NO se puede montar esto, o null si se puede.
 *
 * El proyecto se monta en ESCRITURA, asi que su anchura es la anchura de la
 * caja: si es `/`, el HOME o un ancestro suyo, la caja entera queda abierta y el
 * resto de los flags pasan a ser decoracion. No se «acota un poco»: no se monta.
 *
 * Y la anchura NO es solo cosa del proyecto: `otras` son las rutas que se montan
 * en su propio sitio —sistema, solo lectura, escritura, el socket—, y una de
 * ellas ancha abre la caja igual. Medido el 2026-09-29 con un bwrap real: el
 * `--bind` de una lista gana al `--tmpfs` anterior sobre la misma ruta, asi que
 * el HOME «tapado» quedaba visible y ESCRIBIBLE desde dentro. bwrap no lo
 * contiene; la cota es lo unico que lo niega.
 *
 * `r.home` queda fuera de la regla a proposito: no es contenido que se monte,
 * es el destino del tmpfs que TAPA. Y `r.cwd` lo cubre el corte de abajo, que lo
 * obliga a vivir dentro del proyecto, que ya paso por la cota.
 */
export function porQueNoSeMonta(r: RutasDeLaCaja): string | null {
  const todas = [r.proyecto, r.cwd, r.home, ...r.otras]
  const ancha = (ruta: string): boolean => ruta === '/' || dentroDe(ruta, r.home)
  if (!todas.every(rutaLimpia)) return 'ruta-no-absoluta-o-sucia'
  if (ancha(r.proyecto)) return 'proyecto-demasiado-ancho'
  if (r.otras.some(ancha)) return 'ruta-demasiado-ancha'
  if (!dentroDe(r.proyecto, r.cwd)) return 'cwd-fuera-del-proyecto'
  return null
}
