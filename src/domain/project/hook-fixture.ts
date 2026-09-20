import type { BarreraRota } from './barrera-rota'

/**
 * El `.claude/settings.json` REAL de `raisen-nucleo`, copiado tal cual el
 * 2026-09-20: `PreToolUse` sobre `Write|Edit|MultiEdit` invocando `python`, que
 * en esa maquina no existe. El guardian de los invariantes llevaba sin arrancar
 * desde julio y el proyecto se creia protegido.
 *
 * SE COPIA en vez de leerse del disco, y no por comodidad: el fichero de verdad
 * se va a arreglar —es lo que este arco le pide al operador— y un test colgado
 * de que siga roto se pondria verde el dia que deje de estarlo, que es lo
 * contrario de lo que mide.
 *
 * La entrada `Stop` va incluida CON su forma vieja —sin el `hooks[]` de dentro—
 * porque asi esta escrita de verdad: es el caso que tumba a un parser estricto.
 */
export const RAISEN_NUCLEO = {
  hooks: {
    PreToolUse: [
      { matcher: 'Write|Edit|MultiEdit',
        hooks: [{ type: 'command', command: 'python .claude/hooks/protect-invariants.py' }] }
    ],
    PostToolUse: [
      { matcher: 'Write|Edit',
        hooks: [{ type: 'command', command: 'python .claude/hooks/check-file-length.py' }] }
    ],
    Stop: [{ type: 'command', command: 'bash .claude/hooks/verify-on-stop.sh' }]
  }
} // prettier-ignore

/** El PATH de la maquina donde se midio: `python3` si, `python` NO. */
export const soloPython3 = (binario: string): boolean => binario === 'python3' || binario === 'bash'

/** La barrera de arriba, ya detectada. */
export const ROTA: BarreraRota = {
  matcher: 'Write|Edit|MultiEdit',
  guion: 'protect-invariants.py',
  interprete: 'python',
  alternativa: 'python3'
}
