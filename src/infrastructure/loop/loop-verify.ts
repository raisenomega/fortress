import { execFile } from 'child_process'

/**
 * Verifica que el arbol sigue compilando tras un arreglo. typecheck es rapido y
 * caza lo que rompe de verdad; lint y test los corre el propio agente al
 * autoverificarse. Si el proyecto no tiene el script, no se puede comprobar
 * aqui y se da por bueno (no se bloquea el loop por falta de tooling).
 */
export function loopVerify(cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('npm', ['run', 'typecheck'], { cwd, timeout: 180_000 }, (error, _stdout, stderr) => {
      if (!error) return resolve(true)
      if (/missing script/i.test(stderr)) return resolve(true)
      resolve(false)
    })
  })
}
