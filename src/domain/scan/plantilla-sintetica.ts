import type { ModuloAuditoria } from './modulo-auditoria'
import type { PlantillaDeModulo } from './resumen-de-modulo'

/**
 * Una plantilla MINIMA escrita PARA los tests del extractor (ADR-108 §5).
 *
 * POR QUE EXISTE. Los tests del extractor leian la plantilla REAL de
 * `internal/AUDIT-KIT/`, que esta en `.gitignore` y por tanto NO viaja a un
 * worktree. El gate del Motor corre en worktree, asi que `test:unit` estaba rojo
 * ahi desde el 2026-09-10 —medido: ultimo verde del gate el 04-sep, trece rojos
 * despues— y nadie lo vio porque desde el 21-sep moria antes, en `npm ci`.
 *
 * NO ES UN RECORTE de una plantilla real, y es deliberado: un recorte seria
 * producto en git, y envejeceria con los documentos del operador sin que nadie
 * se enterara. Esto es un documento de laboratorio con las CUATRO ANCLAS del
 * contrato y nada mas.
 *
 * Que las doce plantillas de verdad sigan encajando es OTRA pregunta, y tiene su
 * propio test: `plantilla-contrato`, que lee el kit y se SALTA DICIENDOLO donde
 * el kit no esta. Ese no se puede sintetizar: su sujeto son los documentos.
 */
const PRIMER_PARRAFO =
  'Solo-lectura repo; escritura solo en {{OUTPUT_DIR}}. Carga informes previos.'

/**
 * El orden importa y lo fija el extractor: el primer parrafo tras INICIO se
 * cae, el cuerpo viaja, y de `**Entregable:**` al FIN se poda. Cada trozo de
 * aqui esta para que un test pueda ver una de esas tres cosas.
 */
export const PLANTILLA_SINTETICA = [
  '# PLANTILLA DE LABORATORIO — no es del kit',
  '',
  '## 1 · POR QUE',
  'Prosa que no viaja: el extractor solo se queda con la seccion 3.',
  '',
  '## 3 · PROMPT DE AUDITORÍA (pegar · solo-lectura)',
  '═══ INICIO ═══',
  PRIMER_PARRAFO,
  '',
  '**A.** Dos huecos de carpeta SEGUIDOS, para ver que la ruta no se repite:',
  "grep -rniE 'uno|dos' {{SERVER_DIRS}} {{CLIENT_DIRS}} | head -7",
  '',
  '**B.** Un hueco que el centinela tiene que atrapar: {{NO_DECLARADO}}.',
  '',
  '**C.** El ultimo paso del cuerpo, para ver que viaja entero.',
  '',
  '**Entregable:** escribi un informe en {{OUTPUT_DIR}} con su contrato propio.',
  'Severidades S0 a S4. Firma al pie.',
  '═══ FIN ═══',
  '',
  '## 4 · REMEDIACION',
  'Tampoco viaja.'
].join('\n')

/** La sintetica como plantilla de un modulo: lo que los tests del codigo leen. */
export const sintetica = (modulo: ModuloAuditoria): PlantillaDeModulo => ({
  modulo,
  texto: PLANTILLA_SINTETICA
})

/**
 * Las TRES ramas `null` del extractor, cada una con su documento roto. Son
 * tres y no cuatro: la falta de `═══ FIN ═══` NO devuelve `null` —`split(FIN)[0]`
 * se queda con todo lo que haya— y eso conviene saberlo, porque un documento sin
 * cierre produce cuerpo en vez de silencio.
 */
export const ROTAS: Readonly<Record<string, string>> = {
  'sin seccion 3': '# nada\n═══ INICIO ═══\nuno\n\ndos\n═══ FIN ═══\n',
  'sin INICIO': '## 3 · PROMPT DE AUDITORÍA\nuno\n\ndos\n',
  'con un solo parrafo': '## 3 · PROMPT DE AUDITORÍA\n═══ INICIO ═══\nsolo uno\n═══ FIN ═══\n'
}
