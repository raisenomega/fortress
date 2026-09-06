/**
 * La TERCERA familia del criterio innegociable: ficheros que IMPLEMENTAN una
 * defensa, sin gobernar la autonomia ni validar una entrada. Ver
 * `criterio-innegociable.ts`.
 *
 * Salen a su propio modulo porque la lista llego a su techo de lineas, y el
 * corte se hace por familia y no por tamano: quien venga a proteger una defensa
 * nueva encuentra aqui a sus hermanas.
 *
 * Casi todas nacieron el 04 y el 05 de septiembre, cerrando el frente de
 * seguridad, y NINGUNA estaba protegida: es la cuarta vez que la lista se queda
 * corta por lo mismo que ya avisaba su criterio —"al partir un modulo, la mitad
 * que decidia se quedaba fuera"—. `buildEnv` salio de `claude-cli`, que SI
 * estaba; `sanearParaPrompt` salio de `knownFindings`; el turno del arbol salio
 * de `apply-auto-merge`. Cada extraccion dejo la defensa fuera de la lista sin
 * que nadie lo notara, porque la lista sigue al fichero y la defensa se mudo.
 */
export const DEFENSAS_INNEGOCIABLES: readonly string[] = [
  // El ENTORNO de todo hijo: `build-env` recorta la sesion viva del operador
  // —agente ssh, keyring, GPG— y `git-env` hace lo propio para los cinco `git`
  // que corren en el repo auditado y ejecutan sus hooks.
  'src/infrastructure/claude-code/build-env.ts',
  'src/infrastructure/git/git-env.ts',
  // El PERIMETRO del generador. `scope-check` ya estaba; estos dos son la otra
  // mitad: `scope-groups` lee los globs que declara el repo AUDITADO y
  // `glob-de-alcance` es quien rechaza los que apagarian la correa entera.
  'src/domain/repair/scope-groups.ts',
  'src/domain/repair/glob-de-alcance.ts',
  // El SANEADO de texto ajeno que entra en el prompt de un agente. `tool-detail`
  // ya estaba por `redactSecrets`; este es el mismo control para la otra puerta.
  'src/domain/shared/sanear-para-prompt.ts',
  // Los TURNOS sobre lo que no admite dos a la vez. `run-guard` ya estaba;
  // `carril-del-merge` es quien lo toma para el arbol vivo y `loop-fix` quien lo
  // aplica al bucle autonomo. Sin ellos el guard existe y nadie lo pide.
  'src/application/repair/carril-del-merge.ts',
  'src/infrastructure/loop/loop-fix.ts',
  // Las HERRAMIENTAS del motor, derivadas del vocabulario del grafo.
  'src/infrastructure/repair/motor-tools.ts',
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
  'src/application/repair/judge-and-integrate.ts',
  // El AISLAMIENTO DEL RENDERER, que son dos mitades de una sola garantia y por
  // eso entran juntas: `main-window` fuerza `sandbox`, `contextIsolation` y
  // `nodeIntegration: false` sobre la ventana, y `preload/index` es la UNICA
  // superficie que cruza ese puente —su propio comentario se apoya en la
  // primera: "contextIsolation esta forzado a true en main-window.ts, asi que
  // este es el unico camino"—. Cambiar `nodeIntegration` a true es UNA linea en
  // UN fichero: cabe de sobra en cualquier cerco por tamano.
  //
  // Iba cubierto por `electron/**` en la configuracion del proyecto, y ese
  // patron nunca matcheo nada: los globs se anclan en la raiz del repo y el
  // codigo vive en `src/infrastructure/electron/`. Un glob muerto no protege,
  // pero lo parece, que es peor que no tenerlo. La carpeta entera y no solo el
  // fichero, por lo mismo que `posture/**`: quien anada ahi otra pieza de la
  // ventana la encuentra protegida sin acordarse.
  'src/infrastructure/electron/**',
  'src/preload/index.ts',
  // Auto-cobertura, por lo mismo que la lista principal se cubre a si misma.
  'src/domain/repair/innegociables-defensa.ts'
]
