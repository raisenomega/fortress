/**
 * El `.git` del repo auditado se monta ESCRIBIBLE —el motor commitea, hace
 * `worktree add` y toca objects/ refs/ index—, pero sus superficies de
 * EJECUCION van en SOLO LECTURA montadas ENCIMA: un hook en `hooks/`, o un
 * `core.fsmonitor`/`core.hooksPath` en `config`, los correria el siguiente
 * `git` con la identidad del operador. Es el gemelo de ESCRITURA del fix del
 * orchestrator (ADR-092): alla se neutralizaba la LECTURA de hooks del cliente;
 * aqui se niega que el codigo auditado los PLANTE. `info/` por si un atributo
 * apunta a un filtro.
 *
 * `--ro-bind` ENCIMA del `--bind` del `.git`: bwrap monta de izquierda a derecha
 * y el ultimo gana, asi que estos flags SOLO valen si van DESPUES del `--bind`
 * del `.git`. El `.git` tiene que ser UN montaje escribible —medido con bwrap
 * real: el rename atomico de git (`index.lock` -> `index`) no cruza un montaje
 * de fichero suelto (EBUSY), y un `.git` de raiz en solo-lectura corta los locks
 * de raiz—, por eso se abre entero y se recapan estas tres rutas.
 *
 * `hooks` y `config` con `--ro-bind` (falla-cerrado: un repo de verdad SIEMPRE
 * los tiene; si faltan, la caja no arranca y no se audita sin proteccion).
 * `info/` con `-try`: no es superficie de ejecucion por si sola una vez `config`
 * esta en solo lectura, y su ausencia no debe tumbar la caja.
 */
export function sinEjecucionGit(gitDirs: readonly string[]): readonly string[] {
  return gitDirs.flatMap((g) => [
    ...['--ro-bind', `${g}/hooks`, `${g}/hooks`],
    ...['--ro-bind', `${g}/config`, `${g}/config`],
    ...['--ro-bind-try', `${g}/info`, `${g}/info`]
  ])
}
