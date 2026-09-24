import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SIN_BARRERAS } from '@domain/project/barreras-declaradas'
import { barrerasDeclaradasDelProyecto } from './barreras-declaradas-del-proyecto'

const dirs: string[] = []
const repo = (): string => { const d = mkdtempSync(join(tmpdir(), 'barreras-')); dirs.push(d); return d } // prettier-ignore
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) }) // prettier-ignore

describe('barrerasDeclaradasDelProyecto: lo que el pre-vuelo ya lee, para el prompt (ADR-104 §3)', () => {
  it('lee los hooks PreToolUse de .claude/settings.json, dice si arrancan, y si hay .fortress/config', () => {
    const d = repo()
    mkdirSync(join(d, '.claude'), { recursive: true })
    mkdirSync(join(d, '.fortress')) // prettier-ignore
    writeFileSync(join(d, '.claude', 'settings.json'), JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Write|Edit', hooks: [{ command: 'sh .claude/hooks/vigilar.sh' }, { command: 'noexiste-xyz-123 guard.py' }] }] } })) // prettier-ignore
    writeFileSync(join(d, '.fortress', 'config'), '{"autoMerge":{"enabled":false}}')
    const b = barrerasDeclaradasDelProyecto(d)
    expect(b.config).toBe('presente')
    expect(b.hooks).toEqual([
      { matcher: 'Write|Edit', guion: 'vigilar.sh', interprete: 'sh', arranca: true },
      { matcher: 'Write|Edit', guion: 'guard.py', interprete: 'noexiste-xyz-123', arranca: false }
    ])
  })

  it('sin settings ni config: SIN_BARRERAS, sin inventar nada', () => {
    expect(barrerasDeclaradasDelProyecto(repo())).toEqual(SIN_BARRERAS)
  })
})
