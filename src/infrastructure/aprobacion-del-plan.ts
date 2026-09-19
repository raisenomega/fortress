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

/**
 * El permiso se GASTA al usarse (BUG 1, caducidad (b)): el hallazgo que ya
 * arranco su turno sale del conjunto, asi que el MISMO hallazgo no corre dos
 * veces con una sola aprobacion.
 *
 * Es inocuo cuando no hay nada que gastar —un turno suelto, o supervisado, donde
 * nadie aprueba— y por eso quien llama no necesita preguntar antes: si el id no
 * estaba, no pasa nada. Una guarda que hay que recordar activar es media guarda.
 *
 * SE GASTA AUNQUE EL TURNO FALLE DESPUES, y es deliberado: el permiso autoriza
 * UN intento, no un resultado. Un fix que revienta y se reintenta solo con el
 * permiso viejo estaria ejecutando dos veces lo que OMEGA aprobo una.
 */
export function gastarAprobacion(projectId: string, findingId: string): void {
  const suyos = aprobados.get(projectId)
  if (suyos === undefined || !suyos.has(findingId)) return

  const quedan = new Set(suyos)
  quedan.delete(findingId)
  aprobados.set(projectId, quedan)
}

/**
 * Lo aprobado deja de estarlo. Lo llama el main al empezar a juzgar un plan
 * NUEVO (BUG 1, caducidad (a)): proponer otro plan invalida el permiso anterior
 * aunque el nuevo todavia no tenga veredicto.
 *
 * SU DOCBLOCK PROMETIA OTRA COSA, y esa promesa es la que abrio el BUG 1. Decia
 * «el lote termino, o la seleccion cambio», y los tres momentos viven en el
 * RENDERER —`cola-del-lote.ts`, `lote-store.ts`— mientras esta funcion vive en
 * el MAIN, sin ningun canal IPC que los una. No estaba sin llamar: estaba sin
 * PODER llamarse. Un docblock que promete una garantia por una via imposible es
 * peor que no prometer nada, porque nadie va a buscar al llamador que falta.
 *
 * Ahora dice lo que hace, y lo que hace se alcanza desde donde vive.
 */
export function olvidarAprobacion(projectId: string): void {
  aprobados.delete(projectId)
}
