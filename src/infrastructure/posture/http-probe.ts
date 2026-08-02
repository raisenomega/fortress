import { request } from 'https'
import { request as httpRequest } from 'http'

export interface Probe {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly setCookies: readonly string[]
  readonly body: string
}

const TIMEOUT_MS = 12_000
const MAX_BODY = 200_000

function flatten(headers: NodeJS.Dict<string | string[]>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'set-cookie') continue
    out[key] = Array.isArray(value) ? value.join(', ') : (value ?? '')
  }
  return out
}

/**
 * Una peticion de lectura. GET o HEAD, sin cuerpo, con timeout y con el body
 * acotado: es un diagnostico, no una descarga. No sigue redirecciones a
 * proposito, para poder ver el 301 de http a https tal cual.
 */
export function probe(url: string, method: 'GET' | 'HEAD' = 'GET'): Promise<Probe> {
  const secure = url.startsWith('https:')
  const send = secure ? request : httpRequest

  return new Promise((resolve, reject) => {
    const req = send(url, { method, timeout: TIMEOUT_MS }, (res) => {
      const cookies = res.headers['set-cookie'] ?? []
      let body = ''
      res.on('data', (chunk: Buffer) => {
        if (body.length < MAX_BODY) body += chunk.toString()
      })
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: flatten(res.headers),
          setCookies: cookies,
          body: body.slice(0, MAX_BODY)
        })
      )
    })

    req.on('timeout', () => req.destroy(new Error('La direccion no respondio a tiempo')))
    req.on('error', reject)
    req.end()
  })
}
