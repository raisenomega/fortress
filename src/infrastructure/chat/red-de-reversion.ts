import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { verificarArbol } from '../build/build-verify'
import { abrirCheckpoint } from '../git/checkpoint-transitorio'

/**
 * La red real del Terminal (ADR-079): el checkpoint transitorio de git y el
 * mismo typecheck con el que Construir verifica su arbol. Se arma aqui y no en
 * el handler para que la aplicacion reciba un puerto y no dos imports de git.
 */
export const RED_DE_REVERSION: RedDeReversion = {
  abrir: abrirCheckpoint,
  verificar: verificarArbol
}
