/**
 * Los tipos que salieron de los 34 defectos reales del PROPIO repositorio
 * (ADR-067). Hablan de FORTRESS: `project.trusted`, `guardRun`, el `.mcp.json`
 * del repo auditado. Se quedan aunque el escaneo mas frecuente sea sobre codigo
 * de un cliente: una lista cerrada puede tener ceros sobre codigo ajeno, y el
 * escaner se corre tambien sobre esta casa.
 *
 * La definicion vive AQUI, en el valor, no en un docblock: es lo que viaja al
 * prompt (ADR-081). Un tipo cuya definicion el modelo nunca ve es un slug que
 * elige por su nombre.
 */
export const DEFECTOS_DE_CASA = {
  'missing-trust-check': 'codigo del repo auditado corriendo sin exigir project.trusted.',
  'missing-run-guard': 'una corrida de agente de FORTRESS que no pasa por guardRun.',
  'path-traversal': 'ruta que admite .. o absolutos: lectura, listado o escritura fuera.',
  'secret-in-env': 'se hereda el entorno del operador —API key, keyring— a codigo ajeno.',
  'secret-in-argv': 'un secreto viaja en argv y queda visible en ps.',
  'secreto-sin-redactar': 'un secreto se persiste o se muestra sin pasar por el redactor.',
  'mcp-no-acotado': 'el .mcp.json del repo auditado entra sin acotar y puede suplantar.',
  // Ensanchada por ADR-081: decia "una allowlist de tools", y la misma clase la
  // pidio seis veces el saneador de HTML de un cliente. La clase es la lista de
  // permitidos, no lo que la lista permite.
  'allowlist-permisiva': 'una lista de permitidos que readmite lo que decia excluir.',
  'ssrf-ipv6-mapped': 'el filtro anti-SSRF no cubre IPv4 mapeada en IPv6.',
  'ssrf-ipv4-formatos': 'el filtro anti-SSRF no cubre IPv4 en decimal, hexadecimal u octal.',
  'ssrf-capa-no-alcanzada': 'una capa anti-SSRF existe pero nunca llega a ejecutarse.',
  'doc-contradice-codigo': 'la documentacion o un comentario afirman una garantia que el codigo no da.', // prettier-ignore
  'tope-no-consultado': 'se gasta sin consultar el tope que gobierna ese gasto.',
  'validacion-asimetrica': 'se valida al leer pero no al escribir, o al reves.',
  'alcance-de-proyecto-ignorado': 'una operacion por proyecto que alcanza a todos.'
} as const
