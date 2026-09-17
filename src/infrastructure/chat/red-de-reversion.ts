import type { CheckpointDelTurno, RedDeReversion } from '@domain/chat/red-de-reversion'
import { verificarArbol } from '../build/build-verify'
import { abrirCheckpoint, redDisponible } from '../git/checkpoint-transitorio'
import { leerTrabajo } from '../git/trabajo-del-turno'

/**
 * La red real del Terminal (ADR-079): el checkpoint transitorio de git y el
 * mismo typecheck con el que Construir verifica su arbol. Se arma aqui y no en
 * el handler para que la aplicacion reciba un puerto y no dos imports de git.
 * `disponible` y `abrir` salen del MISMO modulo: la senal que degrada es
 * exactamente la condicion bajo la que abrir no tendria red.
 */
export const RED_DE_REVERSION: RedDeReversion = {
  disponible: redDisponible,
  abrir: conElTrabajoALaVista,
  verificar: verificarArbol
}

/**
 * Abrir y cerrar es una cosa; LEER lo que el agente dejo escrito es otra, y vive
 * en su propio modulo. Se componen aqui, que es donde la infraestructura se
 * vuelve puerto, y no dentro del checkpoint: alli `redDisponible` y
 * `abrirCheckpoint` comparten fichero por invariante del ADR-079, y meterles un
 * tercer asunto es justo lo que esa invariante existe para evitar.
 */
function conElTrabajoALaVista(cwd: string): CheckpointDelTurno | null {
  const cp = abrirCheckpoint(cwd)
  return cp === null ? null : { ...cp, diff: () => leerTrabajo(cwd, cp.sha) }
}
