import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Donde viven los directorios por turno del grafo (ADR-095, enmienda). La raiz
 * la FIJA el arranque de la app con su `userData` —como los worktrees del
 * motor—; hasta entonces (los tests, que no tienen Electron) vale un rincon del
 * tmp. Se resuelve al usarla y no al importar: ningun modulo probado en vitest
 * importa `electron` por culpa de esto.
 */
let raiz: string | null = null

export function fijarRaizDeGrafosDeTurno(userData: string): string {
  raiz = join(userData, 'grafo-por-turno')
  return raiz
}

export function raizDeGrafosDeTurno(): string {
  return raiz ?? join(tmpdir(), 'fortress-grafo-por-turno')
}
