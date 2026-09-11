import { NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'

/** Que se le pregunta de cada modulo, en una linea y sin margen. */
const PREGUNTA: Readonly<Partial<Record<ModuloAuditoria, string>>> = {
  M8: 'crea, debita, acredita, transfiere o reembolsa VALOR (dinero, creditos, puntos, inventario, cuotas)', // prettier-ignore
  M3: 'almacena o procesa DATOS PERSONALES de un titular (PII/PHI: identidad, contacto, salud, ubicacion)' // prettier-ignore
}

const linea = (modulo: ModuloAuditoria): string =>
  `- ${modulo} (${NOMBRE_MODULO[modulo]}): ¿este proyecto ${PREGUNTA[modulo] ?? 'aplica'}?`

/**
 * La pregunta de aplicabilidad, para el clasificador (ADR-083, Fase 4).
 *
 * Barato a proposito: la pregunta, las carpetas del manifiesto y nada mas. NO
 * viaja contenido de ficheros —el agente ya esta dentro del repo y puede mirar
 * lo que necesite—, y por eso este prompt cabe donde el del escaneo no cabria.
 *
 * Pide UN bloque delimitado y nada fuera de el, molde `buildOmegaPrompt`. Y
 * exige la cita: sin `fichero.ext:linea` el veredicto no se usa, asi que
 * pedirla explicitamente es mas barato que descartar respuestas despues.
 */
export function buildJuicioPrompt(
  modulos: readonly ModuloAuditoria[],
  carpetas: readonly string[]
): string {
  return [
    'Clasificas el ALCANCE de una auditoria. No auditas: solo decides que',
    'modulos le tocan a este proyecto. No edites ni ejecutes nada.',
    '',
    'Carpetas del proyecto:',
    carpetas.join(', '),
    '',
    'Responde por cada uno:',
    ...modulos.map(linea),
    '',
    'REGLA: cada respuesta necesita una CITA de codigo real —`fichero.ext:linea`—',
    'que la respalde. Sin cita comprobable responde "no-consta": una afirmacion',
    'sin prueba no se puede auditar y se descarta igual.',
    '',
    'Responde SOLO con el bloque siguiente, sin texto fuera de el:',
    'APLICA:[{"modulo":"M8","aplica":"si|no|no-consta","porque":"fichero.ext:linea"}]:END-APLICA'
  ].join('\n')
}
