// prettier-ignore
import { verificadosDe, type FinDeVerificacion, type ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import type { NoticeTone } from '../components/common/Notice'

/**
 * Por que se cerro el barrido. Solo `completado` es verde: un recorrido cortado
 * no es un error —lo verificado vale y esta escrito— pero tampoco un exito, y
 * pintarlo de verde afirmaria que se reviso lo que nadie reviso. Es el mismo
 * criterio que `tonoDeCobertura` aplica al escaneo abortado.
 */
const CIERRE: Record<FinDeVerificacion, { texto: string; tono: NoticeTone }> = {
  completado: { texto: 'completado', tono: 'ok' },
  detenido: { texto: 'lo detuviste', tono: 'aviso' },
  // No es un fallo: es un freno del sistema. Aviso y no error — pintarlo de rojo
  // mandaba a buscar una averia que nunca existio.
  ocupado: { texto: 'no arranco: el proyecto esta ocupado', tono: 'aviso' },
  averia: { texto: 'cortado por una averia', tono: 'error' }
}

/** El reparto, casilla a casilla, nombrando a donde fue cada uno. `sin_prueba` y
 *  `sigue_vivo` van en lineas distintas: son la diferencia entre «no se pudo
 *  comprobar» y «tu arreglo no sirvio», y fundirlos borra ese dato. */
const LINEAS: ReadonlyArray<readonly [keyof ResultadoVerificacionMasiva, (n: number) => string]> = [
  ['extinguidos', (n) => `${n} extinguido${n > 1 ? 's' : ''} -> Historia`],
  ['sinPrueba', (n) => `${n} sin prueba`],
  ['siguenVivos', (n) => `${n} sigue${n > 1 ? 'n' : ''} vivo${n > 1 ? 's' : ''} -> cola`],
  [
    'noMitigados',
    (n) => `${n} sin verificar: no estaba${n > 1 ? 'n' : ''} mitigado${n > 1 ? 's' : ''}`
  ],
  ['yaTrabajados', (n) => `${n} sin verificar: ya lo trabaja una propuesta`],
  ['sinClasificar', (n) => `${n} con un desenlace que no sabemos nombrar`]
]

const reparto = (r: ResultadoVerificacionMasiva): string =>
  LINEAS.filter(([k]) => (r[k] as number) > 0)
    .map(([k, texto]) => texto(r[k] as number))
    .join(' · ')

/**
 * LA COBERTURA DECLARADA del barrido: cuantos de cuantos, por que paro, y en que
 * quedo cada uno. La cuenta sale de lo que de verdad se verifico —el reparto— y
 * no de la lista del arranque, que es lo que hace que un barrido cortado no
 * pueda decir que los miro todos.
 */
export function parteDeLaVerificacion(r: ResultadoVerificacionMasiva): {
  texto: string
  tono: NoticeTone
} {
  const { texto: cierre, tono } = CIERRE[r.fin]
  const detalle = r.detalle === undefined ? '' : ` ${r.detalle}`
  const hechos = verificadosDe(r)
  if (hechos === 0 && r.noMitigados === 0 && r.yaTrabajados === 0) {
    return { texto: `Sin verificar nada de ${r.total}: ${cierre}.${detalle}`, tono }
  }
  return { texto: `Verifique ${hechos} de ${r.total} · ${cierre}. ${reparto(r)}.${detalle}`, tono }
}
