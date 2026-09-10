import type { DeclaracionDeModulos } from '@domain/scan/declaracion-de-modulos'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * El operador declara que modulos de la campana aplican a un proyecto
 * (ADR-083, Fase 1). Es la primera de las dos vias para M8 y M3: rapida y sin
 * ambiguedad, como ya se declara `trusted`. La segunda —el juicio con
 * evidencia— es la Fase 4, y solo entra donde el operador no dijo nada.
 *
 * Su declaracion SUSTITUYE lo que el detector no ve, en los dos sentidos:
 * declarar `false` es decidir que no aplica, y eso sale en el manifiesto como
 * un descarte con razon, no como un hueco. Quien declara sabe mejor.
 *
 * Va en columna POR PROYECTO y no en `settings`, que es global —una clave ahi
 * declararia M8 para todos los proyectos a la vez— y ademas innegociable.
 */
export function declararModulos(
  context: AppContext,
  id: string,
  declaracion: DeclaracionDeModulos
): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.setModulosDeclarados(id, declaracion)
  return ok(null)
}
