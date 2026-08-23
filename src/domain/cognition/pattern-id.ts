import type { Severity } from '../shared/severity'

/** Lo minimo que identifica un hallazgo. La LINEA no entra: ver `identity`. */
export interface PatternIdentity {
  readonly severity: Severity
  readonly file: string
  readonly title: string
}

/**
 * FNV-1a de 32 bits. Determinista, puro y sin dependencias: el dominio no
 * importa `crypto` de Node ni nada externo. No es criptografico y no lo
 * necesita: aqui solo distingue hallazgos, no protege nada.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

/** Mismo texto aunque cambie el espaciado o las mayusculas del reporte. */
function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Que hace que dos hallazgos sean el mismo PATRON en el log: severidad, archivo
 * y titulo. La LINEA queda fuera — se mueve con cada edicion.
 *
 * Esto ya NO identifica la fila de la base: eso es `findingIdentity`, que pasa
 * por fichero, tipo y simbolo porque el titulo y la severidad demostraron ser
 * prosa cambiante. Aqui se conserva la formula VIEJA a proposito, y no por
 * inercia: el log solo persiste severidad y titulo —ver `historyKey`—, asi que
 * la clave nueva le seria inservible, y cambiarla renumeraria los `PTN-` de
 * todo el historial dejando huerfana cada entrada ya escrita.
 */
export function identity(f: PatternIdentity): string {
  return [f.severity, normalize(f.file), normalize(f.title)].join('|')
}

/**
 * Clave de HISTORIA. El log solo guarda titulo y severidad de un patron ACTIVE
 * (no el archivo), asi que es lo unico con lo que se puede reconocer una
 * entrada ya escrita y heredar su fecha de primera deteccion.
 */
export function historyKey(severity: Severity, title: string): string {
  return `${severity}|${normalize(title)}`
}

/** El parser del log exige digitos: `PTN-\d{4}-\d+`. */
const DIGITS = 6

/**
 * Sufijo ESTABLE derivado del contenido: el mismo hallazgo da el mismo sufijo
 * en cualquier corrida, sesion o maquina. Sustituye al indice posicional, que
 * reasignaba el id de un hallazgo a otro en cuanto cambiaba el orden.
 */
export function patternSuffix(f: PatternIdentity): string {
  return String(fnv1a(identity(f)) % 10 ** DIGITS).padStart(DIGITS, '0')
}

/**
 * Id completo. El ano es el de PRIMERA deteccion, no el del escaneo: si fuera
 * el del escaneo, el id de un hallazgo vivo cambiaria solo por cruzar de ano.
 */
export function patternId(f: PatternIdentity, year: string): string {
  return `PTN-${year}-${patternSuffix(f)}`
}
