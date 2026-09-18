/**
 * El texto de un fichero CREADO, con forma de diff (ADR-093 §4.4, enmienda).
 *
 * `git diff` no ve los untracked, asi que un fichero que el agente crea no
 * aparece en `diffText` — y de `diffText` sale la huella de convergencia
 * (`juez-del-turno.ts:57`). Sin esto, dos intentos que solo cambian un fichero
 * nuevo dan la MISMA huella y el ciclo los toma por vueltas en redondo
 * (`ciclo-de-convergencia.ts:60-61`): cerraria sin resolver un turno que si
 * avanzo.
 *
 * Va el CONTENIDO y no solo el nombre, y esa es la decision que lo hace
 * funcionar: con el nombre a secas, dos versiones distintas del mismo fichero
 * nuevo volverian a dar la misma huella — la misma ceguera, mas sutil.
 *
 * INNEGOCIABLE DE METODO: se compone a mano y NO con `git add -N`, que daria un
 * diff nativo pero MUTA EL INDICE. El checkpoint dejo ahi el WIP del operador
 * stageado a proposito (`checkpoint-transitorio.ts:43-45`), y tocarlo arriesga
 * `conservar()` y `revertir()` — la red entera del ADR-079. Nunca se cambia el
 * estado de git para mejorar un formato de lectura.
 *
 * La forma es la que git daria para un alta, para que quien lo lea —OMEGA— no
 * tenga que aprender un formato nuevo.
 */
export function diffDeCreado(rel: string, contenido: string): string {
  const lineas = contenido === '' ? [] : contenido.replace(/\n$/, '').split('\n')
  const cabecera = `diff --git a/${rel} b/${rel}\nnew file mode 100644\n--- /dev/null\n+++ b/${rel}\n`
  const hunk = `@@ -0,0 +1,${lineas.length} @@\n`
  return cabecera + hunk + lineas.map((l) => `+${l}\n`).join('')
}
