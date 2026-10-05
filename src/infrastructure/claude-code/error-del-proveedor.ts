/** Cuanto del aviso del proveedor se conserva en el motivo. */
const MUESTRA = 200

/**
 * Si la salida JSON del CLI es un fallo DEL PROVEEDOR (cuota, autenticacion,
 * sobrecarga): `is_error` con un estado HTTP. Devuelve `"<estado>: <aviso>"`.
 *
 * MEDIDO el 2026-10-05: con la cuota agotada el CLI contesta `is_error: true`,
 * `api_error_status: 429` y el aviso en `result`. Quien solo leia `result` lo
 * tomaba por la respuesta del agente — el analista lo llamo «ilegible», una
 * baja de UNA propuesta, y la tanda siguio hasta agotar la baraja. Un fallo del
 * proveedor no es de la propuesta: es de todas las que vienen detras.
 *
 * El estado HTTP es la frontera: `error_max_turns` tambien trae `is_error`,
 * pero es un limite NUESTRO y no lleva estado — no se confunde.
 */
export function errorDelProveedor(j: Record<string, unknown>): string | null {
  if (j.is_error !== true || typeof j.api_error_status !== 'number') return null
  const aviso = typeof j.result === 'string' ? j.result.slice(0, MUESTRA) : ''
  return `${j.api_error_status}: ${aviso}`
}
