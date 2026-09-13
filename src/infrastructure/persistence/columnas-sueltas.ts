/**
 * Las columnas que fueron llegando de una en una, aparte de las migraciones que
 * hacen algo mas que anadir. La lista crece con cada pieza que necesita
 * recordar algo nuevo, y por eso vive sola: mezclarla con el orden de las
 * migraciones hacia que ese orden se leyera peor cada vez.
 */
/**
 * Columnas sueltas que fueron llegando. Cada default es el lado SEGURO: sin
 * confianza no se auto-ejecuta nada, sin loop no arranca nada, y una capacidad
 * nace propuesta porque nada asciende hasta que se apruebe el salto.
 */
export const SUELTAS: ReadonlyArray<readonly [string, string, string]> = [
  ['projects', 'trusted', 'ALTER TABLE projects ADD COLUMN trusted INTEGER NOT NULL DEFAULT 0'],
  ['projects', 'loop_enabled', 'ALTER TABLE projects ADD COLUMN loop_enabled INTEGER NOT NULL DEFAULT 0'], // prettier-ignore
  ['projects', 'general_quality', 'ALTER TABLE projects ADD COLUMN general_quality INTEGER'],
  ['projects', 'config_state', "ALTER TABLE projects ADD COLUMN config_state TEXT NOT NULL DEFAULT 'CONFIGURADO'"], // prettier-ignore
  ['capabilities', 'phase', "ALTER TABLE capabilities ADD COLUMN phase TEXT NOT NULL DEFAULT 'propuesta'"], // prettier-ignore
  // Nullable a proposito: una sesion anterior no tiene motivo que contar.
  ['loop_sessions', 'stopped_reason', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_reason_detail', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason_detail TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_at', 'ALTER TABLE loop_sessions ADD COLUMN stopped_at TEXT'],
  ['scans', 'dossier_count', 'ALTER TABLE scans ADD COLUMN dossier_count INTEGER NOT NULL DEFAULT 0'], // prettier-ignore
  // El recorrido por paradas (ADR-082). `estado` es el unico NOT NULL, y su
  // default es el lado seguro: las filas que ya existian son escaneos
  // TERMINADOS, y llamarlas abiertas las dejaria esperando un cierre que nunca
  // va a llegar. Las demas nullables porque ausente es "no se midio" — que es
  // la verdad de todo lo anterior a esta pieza, y no es lo mismo que cero.
  // `score` NO se toca: sigue NOT NULL, y quien dice que es provisional es
  // `estado`. Quitarle el NOT NULL exigiria el recambio de tabla de ADR-077.
  ['scans', 'estado', "ALTER TABLE scans ADD COLUMN estado TEXT NOT NULL DEFAULT 'CERRADO'"], // prettier-ignore
  ['scans', 'started_at', 'ALTER TABLE scans ADD COLUMN started_at TEXT'],
  ['scans', 'paradas_total', 'ALTER TABLE scans ADD COLUMN paradas_total INTEGER'],
  ['scans', 'paradas_hechas', 'ALTER TABLE scans ADD COLUMN paradas_hechas INTEGER'],
  ['scans', 'ficheros_total', 'ALTER TABLE scans ADD COLUMN ficheros_total INTEGER'],
  ['scans', 'ficheros_cubiertos', 'ALTER TABLE scans ADD COLUMN ficheros_cubiertos INTEGER'], // prettier-ignore
  ['scans', 'motivo_cierre', 'ALTER TABLE scans ADD COLUMN motivo_cierre TEXT'],
  // La campana de auditoria de ese escaneo (ADR-083, Fase 5): que modulos
  // aplicaron, cuales se descartaron y por que, que temas corrieron y que
  // plantillas faltaban. TEXT con su JSON y NULL por defecto: las filas
  // anteriores a la campana no la tuvieron, y null es «no consta» — el informe
  // de un escaneo viejo dice eso, no inventa una campana que nadie corrio.
  ['scans', 'modulos', 'ALTER TABLE scans ADD COLUMN modulos TEXT'],
  // La declaracion del operador sobre los modulos de la campana (ADR-083). TEXT
  // con el JSON de {M8?:bool, M3?:bool} y NULL por defecto, que es el lado
  // honesto: sin declarar no es «no aplica», es «no consta».
  ['projects', 'modulos_declarados', 'ALTER TABLE projects ADD COLUMN modulos_declarados TEXT'], // prettier-ignore
  // Nullables: sin marca no hay nada que contar, y `resolved_at` no sirve para
  // esto — ahi vive la extincion, que afirma otra cosa.
  ['findings', 'mitigated_at', 'ALTER TABLE findings ADD COLUMN mitigated_at TEXT'], // prettier-ignore
  ['findings', 'mitigated_note', 'ALTER TABLE findings ADD COLUMN mitigated_note TEXT'], // prettier-ignore
  // El dictamen de la ultima re-verificacion (ADR-087). Columna PROPIA y no
  // `mitigated_note`: aquella es lo que el OPERADOR declaro al marcarlo, y
  // escribir el dictamen encima la borraba — paso de verdad el 13-sep, con una
  // nota que llevaba el sha del fix. Son dos afirmaciones de dos autores, y
  // ademas esta sobrevive al ciclo de vida: cuando el hallazgo vuelve a la cola
  // porque el analista dijo que el problema sigue, la razon tiene que seguir
  // legible. Nullable: sin verificacion no hay nada que contar.
  ['findings', 'verificacion_note', 'ALTER TABLE findings ADD COLUMN verificacion_note TEXT'] // prettier-ignore
]
