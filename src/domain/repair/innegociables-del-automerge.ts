/**
 * Lo que el AUTO-MERGE no puede integrar, separado de `innegociables-defensa`
 * el 2026-09-19 porque aquel paso de 75 lineas al entrar la puerta del plan.
 *
 * La costura no es de tamano: son dos asuntos. Alli se protege lo que un
 * proceso hijo puede VER —entornos, saneado, aislamiento del renderer—; aqui lo
 * que el motor puede INTEGRAR solo. Juntos se leian como una lista sin criterio.
 */
export const INNEGOCIABLES_DEL_AUTOMERGE: readonly string[] = [
  // La MEDIDA del arbol integrado: quien decide si hay que volver a medir antes
  // de tocar el arbol vivo, quien lo mide, y quien lo cuenta sin exagerar el
  // alcance. `apply-auto-merge` entra con ellas porque es donde se INVOCA el
  // freno: protegerlo a el y no al sitio que lo llama dejaria quitar la llamada
  // sin tocar un solo fichero protegido, que es el hueco de siempre.
  'src/domain/repair/arbol-que-se-movio.ts',
  'src/domain/repair/asiento-de-la-medida.ts',
  'src/application/repair/integrar-midiendo-el-arbol.ts',
  'src/infrastructure/repair/medir-arbol-integrado.ts',
  'src/application/repair/apply-auto-merge.ts',
  // La garantia del CODIGO PROPIO: sobre el repo de FORTRESS la puerta
  // automatica no vale, la pida quien la pida. `loop-gate` —donde vive la
  // regla— ya estaba; estos dos son quien la consulta y quien la aplica, que es
  // por donde se escapo la vez anterior.
  'src/application/repair/integrable-sin-firma.ts',
  'src/application/repair/judge-and-integrate.ts'
]
