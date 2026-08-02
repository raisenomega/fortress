import type { PostureFinding } from '../posture-finding'

export type Headers = Readonly<Record<string, string>>

interface Rule {
  readonly header: string
  readonly title: string
  readonly fix: string
  readonly severity: PostureFinding['severity']
}

/** Cabeceras que deberia traer toda respuesta, de FORTRESS.md y OWASP. */
const REQUIRED: readonly Rule[] = [
  {
    header: 'strict-transport-security',
    title: 'Sin HSTS',
    severity: 'HIGH',
    fix: 'Anade Strict-Transport-Security: max-age=63072000; includeSubDomains; preload'
  },
  {
    header: 'content-security-policy',
    title: 'Sin Content-Security-Policy',
    severity: 'HIGH',
    fix: "Define una CSP, empieza por default-src 'self'"
  },
  {
    header: 'x-frame-options',
    title: 'Sin X-Frame-Options',
    severity: 'MEDIUM',
    fix: 'Anade X-Frame-Options: DENY para evitar clickjacking'
  },
  {
    header: 'x-content-type-options',
    title: 'Sin X-Content-Type-Options',
    severity: 'MEDIUM',
    fix: 'Anade X-Content-Type-Options: nosniff'
  },
  {
    header: 'referrer-policy',
    title: 'Sin Referrer-Policy',
    severity: 'LOW',
    fix: 'Anade Referrer-Policy: strict-origin-when-cross-origin'
  }
]

/** Cabeceras que revelan que servidor corres: ayudan a quien busca CVEs. */
const LEAKY = ['server', 'x-powered-by', 'x-aspnet-version']

function missing(headers: Headers): PostureFinding[] {
  return REQUIRED.filter((rule) => !(rule.header in headers)).map((rule) => ({
    family: 'headers' as const,
    severity: rule.severity,
    title: rule.title,
    evidence: `La respuesta no incluye ${rule.header}`,
    fix: rule.fix
  }))
}

function leaks(headers: Headers): PostureFinding[] {
  return LEAKY.filter((name) => name in headers).map((name) => ({
    family: 'headers' as const,
    severity: 'LOW' as const,
    title: `Revela ${name}`,
    evidence: `${name}: ${headers[name]}`,
    fix: `Oculta la cabecera ${name}: da pistas de version a un atacante`
  }))
}

export function analyzeHeaders(headers: Headers): readonly PostureFinding[] {
  return [...missing(headers), ...leaks(headers)]
}
