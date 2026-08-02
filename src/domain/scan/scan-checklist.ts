/**
 * FASE 1 del protocolo FORTRESS: seguridad. Es lo unico que audita el escaneo,
 * y por eso el score que produce es un score de seguridad, no de calidad
 * general. Mezclar codigo muerto con SQL injection en un mismo numero haria
 * que un proyecto explotable pareciera aceptable por estar limpio de imports.
 */
export const SECURITY_CHECKLIST = [
  '1. Secrets hardcodeados: API keys, tokens, passwords o JWT secrets en el codigo.',
  '2. Inyeccion: SQL por concatenacion, XSS sin sanitizar, eval/exec o comandos',
  '   de shell con input de usuario, y path traversal.',
  '3. Autenticacion y autorizacion: endpoints que no verifican la sesion, y',
  '   usuarios que pueden alcanzar datos de otros usuarios.',
  '4. Deserializacion insegura y CORS permisivo (Allow-Origin: *).',
  '5. Falta de headers de seguridad HTTP y de rate limiting en las APIs.'
].join('\n')

export const SCAN_RULES = [
  '- Solo lectura: no modifiques ni crees ningun archivo.',
  '- Ignora node_modules, dist, build, .git y el codigo de terceros.',
  '- Cada hallazgo necesita archivo y linea concretos. Si no puedes senalarlos,',
  '  no lo reportes: una sospecha sin evidencia no es un hallazgo.',
  '- No inventes problemas. Un proyecto limpio se reporta como limpio.',
  '- CRITICAL es solo lo explotable tal y como esta el codigo hoy.'
].join('\n')
