/**
 * QUE clase de muerte tuvo un hallazgo extinto, para que su historia no afirme
 * mas de lo que puede (ADR-087).
 *
 * Las cincuenta y cinco extinciones de la base del operador no son cincuenta y
 * cinco resoluciones. Medido el 2026-09-12:
 *
 *   8   `juicio_obsoleto`        un agente miro el fichero y encontro el marcador
 *   20  `fusionada-con-<uuid>`   duplicado absorbido por ADR-084: NO se resolvio
 *   27  NULL                     de agosto, de cuando la AUSENCIA extinguia
 *
 * Solo la primera es una resolucion. Las otras dos son, respectivamente, una
 * unificacion y un cierre sin prueba — y las 27 vienen justo de la regla que
 * mato dos hallazgos de la CSP porque alguien anadio un COMENTARIO al fichero,
 * con el `unsafe-inline` que denunciaban todavia en `main`. Una pantalla que
 * pintara las 55 como «resuelto» repetiria esa mentira en un sitio nuevo.
 */
export const CLASES_DE_EXTINCION = ['verificado', 'fusionado', 'sin-prueba'] as const

export type ClaseDeExtincion = (typeof CLASES_DE_EXTINCION)[number]

const FUSION = 'fusionada-con-'

/**
 * POR PREFIJO, y no por un mapa contra `MOTIVOS_EXTINCION`.
 *
 * Dos razones, y las dos salen del dato. La fusion escribe VEINTE cadenas
 * distintas —`fusionada-con-<uuid de la superviviente>`— porque lo hace por SQL
 * directo, saltandose el puerto que tipa el motivo; un mapa por valor exacto las
 * perderia todas. Y `ausencia_historica`, que el vocabulario declara, tiene CERO
 * filas: aquellas 27 se escribieron como NULL a secas, asi que esperar esa
 * palabra no habria encontrado ninguna.
 *
 * EL CAJON NO ES NEUTRO, y ahi esta la diferencia con `aArea`. Aquel cae a
 * `otro`, que no afirma nada de nadie. Aqui un motivo que no se reconozca —uno
 * futuro, uno escrito a mano— NO puede caer en `verificado`: seria la pantalla
 * diciendo que alguien comprobo algo que nadie comprobo. Cae a `sin-prueba`,
 * que es el lado que no afirma. Es la doctrina del `false` de `changedSince`
 * —sin evidencia no se cierra nada— aplicada a como se pinta.
 *
 * Tolerante a proposito: no lanza con nada. Una fila rara no puede tumbar la
 * pagina que existe para leerla.
 */
export function clasificarExtincion(extinctReason: string | null | undefined): ClaseDeExtincion {
  if (extinctReason === 'juicio_obsoleto') return 'verificado'
  if (typeof extinctReason === 'string' && extinctReason.startsWith(FUSION)) return 'fusionado'
  return 'sin-prueba'
}

/** El id de la fila que absorbio a esta, si la absorbio alguna. Sale del mismo
 *  motivo: sin el, «fusionado» dice que desaparecio y no adonde fue. */
export function ganadoraDeLaFusion(extinctReason: string | null | undefined): string | null {
  if (typeof extinctReason !== 'string' || !extinctReason.startsWith(FUSION)) return null
  return extinctReason.slice(FUSION.length) || null
}
