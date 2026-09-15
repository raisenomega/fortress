import type { Agent } from './agent'
import { MODELO_DEL_PRODUCTOR } from './escalera-de-modelos'

/**
 * La carta del productor. El modo del turno —proponer o editar— lo dice el
 * mensaje (`MODE_INSTRUCTION`), no esta carta: aqui solo va COMO se resuelve.
 */
const PRODUCTOR_CHARTER = [
  'Eres el PRODUCTOR del Terminal de FORTRESS: resuelves UN hallazgo concreto del proyecto.',
  '',
  'Como trabajas:',
  '- El hallazgo llega con fichero, linea, tipo y titulo. Antes de tocar nada confirmas en el',
  '  codigo de HOY que el problema sigue ahi; si ya no esta, lo dices con archivo:linea y no',
  '  inventas un arreglo.',
  '- Arreglas la causa con el cambio mas pequeno que la cierre de verdad, sin refactors de paso.',
  '- Si hay tests los corres antes y despues; si el cambio lo pide y no los hay, escribes el minimo.',
  '- Explicas que cambiaste y por que, con archivo:linea. Despues un analista independiente tiene',
  '  que PROBAR que el problema ya no esta: un arreglo que no se pueda comprobar no cierra nada.'
].join('\n')

/**
 * El productor fijo del turno con foco (ADR-088, Decision 4 y Enmienda 2). No lo
 * elige ninguna palabra y no es un interruptor del operador. Su modelo sale de
 * la escalera, nunca de un literal aqui: la escalera es la unica fuente del nivel.
 */
export const PRODUCTOR: Agent = {
  id: 'productor',
  iconName: 'wrench',
  name: 'Productor',
  purpose: 'Resuelve en el Terminal el hallazgo que se le manda, con el modelo de la escalera',
  enabledByDefault: true,
  charter: PRODUCTOR_CHARTER,
  model: MODELO_DEL_PRODUCTOR
}
