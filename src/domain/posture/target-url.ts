import { err, ok, type Result } from '../shared/result'
import { isPrivateHost } from './private-host'

const ALLOWED = new Set(['http:', 'https:'])

export interface Target {
  readonly url: string
  readonly host: string
  readonly https: boolean
}

/**
 * Normaliza y valida la URL a auditar. Solo web (http/https): el escaner lee
 * paginas, no abre archivos del disco ni esquemas raros. Se rechaza todo lo
 * que no se pueda tratar como una direccion web normal.
 */
export function parseTarget(raw: string): Result<Target> {
  const trimmed = raw.trim()

  // Un esquema explicito que no sea web se rechaza aqui: sin esto, anteponer
  // https:// a "file://..." lo colaba como si fuera una direccion valida.
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(trimmed)
  if (scheme && !ALLOWED.has(`${scheme[1].toLowerCase()}:`)) {
    return err('Solo se pueden auditar direcciones web')
  }

  const withScheme = scheme ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    if (!ALLOWED.has(parsed.protocol)) return err('Solo se pueden auditar direcciones web')
    if (parsed.hostname === '') return err('Escribe la direccion de tu sitio')
    if (isPrivateHost(parsed.hostname)) {
      return err('No se pueden auditar direcciones internas o privadas')
    }

    return ok({
      url: `${parsed.protocol}//${parsed.host}`,
      host: parsed.host,
      https: parsed.protocol === 'https:'
    })
  } catch {
    return err('Esa direccion no es valida')
  }
}
