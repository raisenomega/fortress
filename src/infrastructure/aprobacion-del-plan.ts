/**
 * Las aprobaciones de plan vivas, en el MAIN (ADR-097 §4).
 *
 * Vive aqui y no en el mensaje por la misma razon que `run-control`: «la
 * guardia vivia solo en el renderer, asi que quien llamara al canal IPC
 * directamente podia lanzar diez escaneos simultaneos». Un campo `aprobado:
 * true` en `SendMessageInput` seria exactamente esa puerta: la escribe quien
 * pide pasar. Aqui solo escribe el main, cuando OMEGA dice ADELANTE.
 *
 * Se guarda POR HALLAZGOS y no por proyecto: una aprobacion del lote [A, B] no
 * autoriza a ejecutar C. Si el operador cambia la seleccion, la aprobacion
 * anterior deja de valer sola — sin necesidad de que nadie se acuerde de
 * borrarla.
 *
 * En memoria y no en la base a proposito: una aprobacion es de ESTA sesion. Si
 * la app se reinicia, el plan se vuelve a juzgar. Sobrevivir al reinicio seria
 * ejecutar manana con el permiso de ayer.
 */
const aprobados = new Map<string, ReadonlySet<string>>()

/** OMEGA dijo ADELANTE sobre estos hallazgos: quedan autorizados a ejecutarse. */
export function aprobarLote(projectId: string, ids: readonly string[]): void {
  aprobados.set(projectId, new Set(ids))
}

/** Si ESTE hallazgo esta dentro de un lote aprobado en este proyecto. */
export function hallazgoAprobado(projectId: string, findingId: string): boolean {
  return aprobados.get(projectId)?.has(findingId) === true
}

/** El lote termino, o la seleccion cambio: lo aprobado deja de estarlo. */
export function olvidarAprobacion(projectId: string): void {
  aprobados.delete(projectId)
}
