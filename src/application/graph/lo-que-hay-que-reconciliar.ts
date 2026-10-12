import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

/** Lo que hace falta para reconciliar: el proyecto y el HEAD que hay que alcanzar. */
export interface Reconciliable {
  readonly project: Project
  readonly currentSha: string
}

/**
 * Las tres razones por las que NO hay nada que reconciliar, en un solo sitio.
 * Devuelve null dejando dicho cual fue; el caller solo tiene que rendirse.
 *
 * La de CONTAMINADO es una defensa LATENTE, y por eso llevaba tanto sin estar:
 * con ningun proyecto marcado no se nota que falte. Las tres puertas del reindex
 * —el arranque, el chip del grafo y el foco de proyecto— pasan por aqui, y
 * ninguna consultaba el circuit breaker de la Capa 4. Un proyecto que una
 * auditoria dejo alterado se reindexaba igual, y sobre todo al arrancar, que es
 * donde nadie esta mirando.
 *
 * No condena a nadie, y esa es la diferencia con cuando esto se penso la primera
 * vez. `contaminated` se relee en cada llamada, asi que en cuanto el operador
 * desbloquea —`projects:unblock`, que limpia la marca con `markClean`— la
 * siguiente reconciliacion entra sin mas. No frena para siempre: frena hasta que
 * alguien mire el forense.
 *
 * Se mira ANTES que el HEAD a proposito: leerlo lanza git, y un proyecto
 * bloqueado no merece ni el proceso.
 *
 * No se usa `guardRun`, que es el guard de los otros canales del grafo, y no es
 * un descuido: ese ademas comprueba el tope diario y RESERVA el carril. El
 * reindex no gasta un token —corre el binario del grafo, no un agente— y su
 * trabajo se va a una cola en background, donde un carril reservado no tendria
 * quien lo soltara. De ese guard aqui solo vale la primera pregunta.
 */
export function loQueHayQueReconciliar(
  context: AppContext,
  projectId: string
): Reconciliable | null {
  const project = context.projects.findById(projectId)
  if (project === null) return null

  // PASO 172a: la contaminacion congela solo el mundo FORTRESS; un cliente no
  // deja de reindexar por esa marca (su freno vive en el self-repair).
  if (project.contaminated && context.esRepoPropio(project.path)) {
    console.info('[graph-reindex]', project.name, 'SKIP: proyecto CONTAMINADO')
    return null
  }

  const currentSha = context.headSha(project.path)
  if (currentSha === null) {
    console.info('[graph-reindex]', project.name, 'SKIP: sin repo git')
    return null
  }
  return { project, currentSha }
}
