import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { verificarArbol } from '../build/build-verify'
import { abrirCheckpoint, redDisponible } from '../git/checkpoint-transitorio'

/**
 * La red real del Terminal (ADR-079): el checkpoint transitorio de git y el
 * mismo typecheck con el que Construir verifica su arbol. Se arma aqui y no en
 * el handler para que la aplicacion reciba un puerto y no dos imports de git.
 * `disponible` y `abrir` salen del MISMO modulo: la senal que degrada es
 * exactamente la condicion bajo la que abrir no tendria red.
 */
export const RED_DE_REVERSION: RedDeReversion = {
  disponible: redDisponible,
  abrir: abrirCheckpoint,
  verificar: verificarArbol
}
