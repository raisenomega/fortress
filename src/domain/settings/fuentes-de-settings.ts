/**
 * Que fuentes de settings carga un `claude -p`, segun la confianza (el
 * CRITICAL 351abcd1, arreglado a mano el 2026-10-04 — es una defensa del
 * Motor, y el Motor no toca sus defensas).
 *
 * MEDIDO con el rig, no deducido: sin este flag, el CLI carga el
 * `.claude/settings.json` del repo AUDITADO (cwd del spawn) y ese fichero
 * ejecuta codigo del repo en la sesion del operador: su hook centinela
 * DISPARO —y FUERA de la caja: leyo el HOME entero y salio a la red abierta—
 * y su `apiKeyHelper` se ejecuto hasta secuestrar la autenticacion de la
 * corrida (401 en bucle). Con `--setting-sources user`, cero marcadores, auth
 * normal, y la caja `--settings` (ADR-092) siguio aplicando: es capa aparte
 * de las fuentes, verificado con la sonda del centinela en el HOME.
 *
 * Con confianza se conservan las fuentes de proyecto A PROPOSITO, por si el
 * operador las siembra. OJO, MEDIDO el 2026-10-09 (PASO 136): HOY no hay nada
 * que conservar — FORTRESS no tiene `.claude/settings.json` trackeado y el
 * hook de ADR-098 NO esta persistido en ninguna capa (el ADR se firmo; el
 * hook fue de la medicion). Reponerlo es su propia costura firmada.
 */
export function fuentesDeSettings(trusted: boolean): readonly string[] {
  return trusted ? [] : ['--setting-sources', 'user']
}
