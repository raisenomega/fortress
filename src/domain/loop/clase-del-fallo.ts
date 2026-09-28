/** Un nombre de clase de error: `TypeError`, `SqliteError`. Acotado, para que una
 *  cadena kilometrica o con datos dentro caiga al centinela. Molde de `tipoDeFallo`. */
const NOMBRE_DE_CLASE = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/

/** Un codigo de sistema: `ENOENT`, `SQLITE_BUSY`. MAYUSCULAS y nada mas, que es
 *  lo que separa un codigo de un dato del cliente — `pacientes.dni` no pasa. */
const CODIGO = /^[A-Z][A-Z0-9_]{1,31}$/

/**
 * Las clases transitorias del proveedor, las MISMAS que usa `observacionDeStandby`
 * doce lineas mas abajo: un fallo de red llega como un `Error` a secas, y sin este
 * eje la nota diria solo «Error», que no explica nada.
 */
const TRANSITORIAS: ReadonlyArray<readonly [RegExp, string]> = [
  [/credit|balance|insufficient|saldo|agotad|quota|cuota/i, 'credito o cuota'],
  [/rate.?limit|too many requests|429/i, 'limite de tasa'],
  [/overloaded|503|502|500|unavailable|no disponible/i, 'proveedor caido o sobrecargado'],
  [/network|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout/i, 'red o timeout']
]

/**
 * De QUE se rompio el loop, en vocabulario cerrado y SIN una palabra del mensaje.
 *
 * Existe porque la nota de la parada por error metia el `message` CRUDO, y era la
 * UNICA rama del sistema nervioso que lo hacia: su gemela del standby clasifica, y
 * las cuatro hermanas —fallo, IPC, render, denial— derivan todas de dato
 * clasificado. Medido el 2026-09-28, el crudo costaba tres cosas a la vez:
 *
 * BAILABA. El mensaje lleva la hora y el numero de intento, asi que cambiaba en
 * cada reintento y el UNIQUE de avistamientos —que incluye la nota— sembraba una
 * fila por vuelta: diez reintentos, diez avistamientos donde debia haber uno. Y la
 * nota del avistamiento existe para guardar «el material con el que alguien
 * entiende el limite», asi que diez copias casi iguales inundan justo eso.
 *
 * NO TENIA TOPE. Un mensaje de 5.000 caracteres se guardaba entero: el tope de 500
 * solo alcanza a las notas que vienen parseadas de un modelo, y esta se construye
 * en codigo. Aqui el tope sale gratis: un vocabulario cerrado no puede crecer.
 *
 * LLEVABA DATOS DEL CLIENTE. El cerco de `add` si tacha rutas, citas y tokens
 * —medido—, pero NO alcanza a un nombre de tabla, un correo ni un fragmento de
 * SQL, y su propio docblock lo admite. Un error de la base del cliente los metia
 * enteros en una nota que se persiste y se exporta.
 *
 * Los TRES ejes son cerrados o validados, y ese es el cerco: el codigo pasa solo si
 * parece un codigo de sistema, asi que `pacientes.dni` no entra. El mensaje crudo
 * sigue en `stoppedReasonDetail`, que el operador ve en la sesion y NO se exporta.
 */
export function claseDelFallo(error: unknown): string {
  const e = error as { name?: unknown; code?: unknown; message?: unknown }
  const clase = typeof e?.name === 'string' && NOMBRE_DE_CLASE.test(e.name) ? e.name : 'desconocido'
  const codigo = typeof e?.code === 'string' && CODIGO.test(e.code) ? e.code : null
  const mensaje = typeof e?.message === 'string' ? e.message : ''
  const transitoria = TRANSITORIAS.find(([re]) => re.test(mensaje))?.[1] ?? null

  return [clase, codigo, transitoria].filter((x) => x !== null).join(', ')
}
