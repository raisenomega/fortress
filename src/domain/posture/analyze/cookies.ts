import type { PostureFinding } from '../posture-finding'

/** Una cookie sin sus flags es una sesion que se puede robar o falsificar. */
function auditCookie(raw: string): PostureFinding[] {
  const name = raw.split('=')[0]?.trim() ?? 'cookie'
  const lower = raw.toLowerCase()
  const faltan: string[] = []

  if (!lower.includes('secure')) faltan.push('Secure')
  if (!lower.includes('httponly')) faltan.push('HttpOnly')
  if (!lower.includes('samesite')) faltan.push('SameSite')

  if (faltan.length === 0) return []

  return [
    {
      family: 'cookies',
      severity: faltan.includes('HttpOnly') ? 'MEDIUM' : 'LOW',
      title: `Cookie ${name} sin ${faltan.join(', ')}`,
      evidence: raw.slice(0, 80),
      fix: `Anade ${faltan.join(', ')} a la cookie ${name}`
    }
  ]
}

export function analyzeCookies(setCookies: readonly string[]): readonly PostureFinding[] {
  return setCookies.flatMap(auditCookie)
}
