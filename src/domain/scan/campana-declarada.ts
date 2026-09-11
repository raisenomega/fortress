import type { Manifiesto } from './manifiesto'
import type { ModulosDelCierre } from './modulos-del-cierre'

/**
 * Lo que el MANIFIESTO fija antes de recorrer nada. `temasCorridos` no esta
 * aqui porque no se sabe hasta el final: un tema que aplicaba y no llego a
 * correr —el operador paro antes— aplicaba igual, y el informe tiene que poder
 * decir esa diferencia.
 */
export type CampanaDeclarada = Omit<ModulosDelCierre, 'temasCorridos'>

/**
 * La campana que este manifiesto declara. Es un cambio de nombres y nada mas
 * —el manifiesto ya lo sabia todo— y existe para que el recorrido no tenga que
 * deletrear cuatro campos en medio de su bucle.
 */
export const campanaDe = (manifiesto: Manifiesto): CampanaDeclarada => ({
  aplicables: manifiesto.modulosAplicables,
  descartados: manifiesto.modulosDescartados,
  sinConstancia: manifiesto.modulosSinConstancia,
  plantillasAusentes: manifiesto.plantillasAusentes
})
