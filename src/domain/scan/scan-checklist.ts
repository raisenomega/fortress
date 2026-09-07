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
  '- El eje estado vale explotable-hoy SOLO para lo explotable tal y como esta el',
  '  codigo hoy. La banda la deriva FORTRESS de los tres ejes, no la eliges tu.',
  // Los dos falsos positivos que mas ha cometido, y los dos son de lectura
  // superficial: marcar ausente un control que estaba un salto mas abajo, y
  // nombrar como control esperado algo que solo existe en un comentario.
  '- Antes de marcar "falta el control C", sigue la llamada UN salto: el control',
  '  puede estar aplicado en el ayudante al que la funcion delega, y penalizarlo',
  '  ahi castiga justo el patron correcto.',
  '- Si nombras un control —una funcion, una politica, una cabecera— comprueba que',
  '  existe en el repo antes de citarlo. Un comentario que describe algo que nunca',
  '  se implemento no prueba que exista, y mandar a buscarlo es mandar a buscar un',
  '  fantasma.'
].join('\n')
