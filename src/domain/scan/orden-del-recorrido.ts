import { esDeCarpeta, esDeTema, type Parada } from './parada'
import { ordenarPorSensibilidad } from './prioridad-de-paradas'

/**
 * El orden en que se recorren las paradas de las dos clases (ADR-083, Fase 3):
 * las de CARPETA primero —con lo sensible delante— y los TEMAS al final.
 *
 * Los temas cierran, y es por la misma doctrina que puso `auth/` delante de
 * `utils/`: esto decide que alcanza a mirarse si el operador para a mitad, y
 * mas vale haber leido el login linea por linea que haber hecho la pasada de
 * observabilidad. Son ademas la vista panoramica, y mirarla despues de haber
 * recorrido el arbol por partes es el orden en que el kit numera sus pasadas.
 *
 * La concatenacion vive AQUI y no dentro de `ordenarPorSensibilidad`, que sigue
 * recibiendo solo carpetas: igual que repartir no sabe de prioridad, la
 * prioridad no tiene por que saber de temas. Su heuristica es de nombres de
 * carpeta y un tema no tiene ninguno que puntuar.
 */
export function ordenDelRecorrido(paradas: readonly Parada[]): readonly Parada[] {
  return [...ordenarPorSensibilidad(paradas.filter(esDeCarpeta)), ...paradas.filter(esDeTema)]
}
