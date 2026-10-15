/**
 * El cierre GARANTIZADO del runner headless: pase lo que pase con el trabajo
 * —aunque el drenaje LANCE—, SIEMPRE cierra (alSalir, via `cerrar`) y sale. Antes
 * una excepcion saltaba el cierre y dejaba el proceso colgado con el `-wal` vivo
 * (el hueco latente que confirmo el forense). El codigo es honesto: 0 si cerro
 * limpio, !=0 si hubo excepcion —senal real para quien lanzo el runner—. Las deps
 * van INYECTADAS: puro (solo `console`), probable sin levantar electron.
 */
export async function cerrarSiempre(
  trabajar: () => Promise<void>,
  cerrar: () => void,
  salir: (codigo: number) => void
): Promise<void> {
  let codigo = 0
  try {
    await trabajar()
  } catch (e) {
    console.error('[headless] el drenaje lanzo:', e)
    codigo = 1
  } finally {
    cerrar()
    salir(codigo)
  }
}
