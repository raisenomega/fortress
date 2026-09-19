import { INNEGOCIABLES_DEL_AUTOMERGE } from './innegociables-del-automerge'

import { DEFENSAS_DEL_DISCO } from './innegociables-disco'
import { DEFENSAS_DE_LA_RED } from './innegociables-red'
/**
 * La TERCERA familia del criterio innegociable: ficheros que IMPLEMENTAN una
 * defensa, sin gobernar la autonomia ni validar una entrada. Ver
 * `criterio-innegociable.ts`.
 *
 * Salen a su propio modulo porque la lista llego a su techo de lineas, y el
 * corte se hace por familia y no por tamano: quien venga a proteger una defensa
 * nueva encuentra aqui a sus hermanas.
 *
 * La lista se queda corta por lo mismo una y otra vez —"al partir un modulo, la
 * mitad que decidia se quedaba fuera"—: `buildEnv` salio de `claude-cli`,
 * `sanearParaPrompt` de `knownFindings`, el turno del arbol de
 * `apply-auto-merge`. Cada extraccion dejo la defensa fuera sin que nadie lo
 * notara, porque la lista sigue al fichero y la defensa se mudo.
 */
export const DEFENSAS_INNEGOCIABLES: readonly string[] = [
  ...DEFENSAS_DEL_DISCO,
  ...DEFENSAS_DE_LA_RED,
  // El ENTORNO de todo hijo: `build-env` recorta la sesion viva del operador
  // —agente ssh, keyring, GPG— y `git-env` hace lo propio para los cinco `git`
  // que corren en el repo auditado y ejecutan sus hooks.
  'src/infrastructure/claude-code/build-env.ts',
  'src/infrastructure/git/git-env.ts',
  // El PERIMETRO del generador. `scope-check` ya estaba —juzga el diff—; estos
  // son la otra punta: `scope-groups` lee los globs del repo AUDITADO,
  // `glob-de-alcance` rechaza los que apagarian la correa, `allowed-files` con
  // `path-hints` la DECIDEN, y `solo-toca-pruebas` juzga la NATURALEZA del diff.
  'src/domain/repair/scope-groups.ts',
  'src/domain/repair/glob-de-alcance.ts',
  'src/domain/repair/allowed-files.ts',
  'src/domain/repair/path-hints.ts',
  'src/domain/repair/solo-toca-pruebas.ts',
  // El SANEADO de texto ajeno que entra en el prompt de un agente. `tool-detail`
  // ya estaba por `redactSecrets`; este es el mismo control para la otra puerta.
  'src/domain/shared/sanear-para-prompt.ts',
  // Los TURNOS sobre lo que no admite dos a la vez. `run-guard` ya estaba;
  // `carril-del-merge` es quien lo toma para el arbol vivo y `loop-fix` quien lo
  // aplica al bucle autonomo. Sin ellos el guard existe y nadie lo pide.
  'src/application/repair/carril-del-merge.ts',
  'src/infrastructure/loop/loop-fix.ts',
  // La PUERTA del plan (ADR-097 §4): en autonomo, un hallazgo del lote no corre
  // sin el ADELANTE de OMEGA. Y quien GUARDA la aprobacion, que vive en el main
  // porque un campo en el mensaje lo escribiria quien pide pasar. Si el
  // auto-merge pudiera tocarlos, el autonomo se abriria a si mismo la puerta.
  'src/infrastructure/plan-guard.ts',
  'src/infrastructure/aprobacion-del-plan.ts',
  // Las HERRAMIENTAS del motor, derivadas del vocabulario del grafo.
  'src/infrastructure/repair/motor-tools.ts',
  // Lo que el AUTO-MERGE no puede integrar, aparte por tamano y por asunto.
  ...INNEGOCIABLES_DEL_AUTOMERGE,
  // El AISLAMIENTO DEL RENDERER, dos mitades de una sola garantia: `main-window`
  // fuerza `sandbox`, `contextIsolation` y `nodeIntegration: false`, y
  // `preload/index` es la UNICA superficie que cruza ese puente. Cambiar
  // `nodeIntegration` es UNA linea. Iba cubierto por `electron/**` en la config
  // del proyecto, y ese patron nunca matcheo: los globs se anclan en la raiz y
  // el codigo vive en `src/infrastructure/electron/`. Un glob muerto no protege
  // pero lo parece, que es peor. La carpeta entera, como `posture/**`.
  'src/infrastructure/electron/**',
  'src/preload/index.ts',
  // El TACHADO de lo que sale en vivo al chat: `tool-detail` ya estaba, pero
  // este es quien lo APLICA, y sin el la funcion existe y nadie la llama.
  'src/application/chat/en-vivo-tachado.ts',
  // Auto-cobertura, por lo mismo que la lista principal se cubre a si misma.
  'src/domain/repair/innegociables-defensa.ts',
  'src/domain/repair/innegociables-del-automerge.ts'
]
