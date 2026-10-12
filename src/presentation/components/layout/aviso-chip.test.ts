import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 172c: el aviso de contaminación del cliente pasó de banner (en el
 *  Terminal) a chip [Aviso] anaranjado en el header, con el detalle en diálogo. */
const L = 'src/presentation/components/layout'
const read = (p: string): string => readFileSync(p, 'utf8')

describe('aviso de contaminación del cliente = chip en el header', () => {
  it('T1: el chip gatea SOLO un cliente contaminado y es anaranjado (medium)', () => {
    const src = read(`${L}/AvisoChip.tsx`)
    expect(src).toContain('!project.contaminated || project.esRepoPropio')
    expect(src).toContain('text-medium')
  })

  it('T2: el chip abre el diálogo, que muestra el contamination_detail', () => {
    expect(read(`${L}/AvisoChip.tsx`)).toContain('AvisoContaminacionDialog')
    expect(read(`${L}/AvisoContaminacionDialog.tsx`)).toContain('project.contaminationDetail')
  })

  it('T3: el banner YA NO está en el Terminal; FORTRESS "Motor detenido" intacto', () => {
    expect(read('src/presentation/components/chat/ChatWindow.tsx')).not.toContain('AvisoClienteContaminado') // prettier-ignore
    expect(read(`${L}/MotorChip.tsx`)).toContain('project.contaminated && project.esRepoPropio')
  })

  it('T4: el chip está montado en el header (TopBar)', () => {
    expect(read(`${L}/TopBar.tsx`)).toContain('<AvisoChip')
  })
})
