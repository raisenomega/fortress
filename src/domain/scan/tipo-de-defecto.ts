/**
 * Vocabulario CERRADO de tipos de defecto. El escaner ELIGE de esta lista; no
 * redacta. Es la pieza que hace estable la identidad de un hallazgo.
 *
 * Sale de agrupar los 34 defectos reales del propio repo, no de una lista
 * generica: cada tipo existe porque hay al menos un defecto que lo pedia. Los
 * que aparecen una sola vez se conservan a proposito — son clases que pueden
 * repetirse, y mandarlas a `otro` habria escondido justo lo que distinguen.
 *
 * Congelado aqui como decision de producto. Anadir un tipo es cambiar el
 * contrato del escaner, y por eso no se hace a la ligera.
 */
export const TIPOS_DE_DEFECTO = [
  /** Codigo del repo auditado corriendo sin exigir project.trusted. */
  'missing-trust-check',
  /** Una corrida de agente que no pasa por guardRun: evade tope y carril. */
  'missing-run-guard',
  /** Ruta que admite `..` o absolutos: lectura, listado o escritura fuera. */
  'path-traversal',
  /** Se hereda el entorno del operador —API key, keyring— a codigo ajeno. */
  'secret-in-env',
  /** Un secreto viaja en argv y queda visible en `ps`. Otro canal, otro fix. */
  'secret-in-argv',
  /** Algo con secretos se persiste o se muestra sin pasar por redactSecrets. */
  'secreto-sin-redactar',
  /** El .mcp.json del repo auditado entra sin acotar y puede suplantar. */
  'mcp-no-acotado',
  /** Una allowlist de tools que readmite lo que decia excluir. */
  'allowlist-permisiva',
  /** El filtro anti-SSRF no cubre IPv4 mapeada en IPv6. */
  'ssrf-ipv6-mapped',
  /** El filtro anti-SSRF no cubre IPv4 en decimal, hexadecimal u octal. */
  'ssrf-ipv4-formatos',
  /** Una capa anti-SSRF existe pero nunca llega a ejecutarse. */
  'ssrf-capa-no-alcanzada',
  /** La documentacion o un comentario afirman una garantia que el codigo no da. */
  'doc-contradice-codigo',
  /** Se gasta sin consultar el tope que gobierna ese gasto. */
  'tope-no-consultado',
  /** Se valida al leer pero no al escribir (o al reves). */
  'validacion-asimetrica',
  /** Una operacion por proyecto que alcanza a todos. */
  'alcance-de-proyecto-ignorado',
  /** Lo genuinamente inclasificable. Que crezca es senal de que falta un tipo. */
  'otro'
] as const

export type TipoDeDefecto = (typeof TIPOS_DE_DEFECTO)[number]

/** Fuera del vocabulario no se inventa nada: cae a `otro`, y se nota. */
export function aTipoDeDefecto(value: unknown): TipoDeDefecto {
  return (TIPOS_DE_DEFECTO as readonly string[]).includes(value as string)
    ? (value as TipoDeDefecto)
    : 'otro'
}
