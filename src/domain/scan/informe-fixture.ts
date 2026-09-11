import type { DetectedFinding } from './detected-finding'
import type { DatosDelInforme } from './informe-datos'
import type { ModulosDelCierre } from './modulos-del-cierre'

const HALLAZGO = (severity: DetectedFinding['severity'], file: string): DetectedFinding => ({
  severity,
  title: `Algo en ${file}`,
  file,
  line: 42,
  tipo: 'secreto-versionado'
})

/** Una campana de verdad: aplicables, descartados, sin constar y una sin plantilla. */
export const CAMPANA: ModulosDelCierre = {
  aplicables: ['M1', 'M2', 'M6', 'M9', 'M10'],
  descartados: [{ modulo: 'M8', razon: 'M8 Integridad de negocio: no aplica, juzgado con evidencia — src/index.ts:1' }], // prettier-ignore
  sinConstancia: [{ modulo: 'M3', razon: 'M3 Privacidad: no consta, el juicio no trajo una cita' }], // prettier-ignore
  temasCorridos: ['M2'],
  plantillasAusentes: ['M9']
}

/** El informe de un recorrido COMPLETO sobre un repo con git. */
export const COMPLETO: DatosDelInforme = {
  projectName: 'Health Flow',
  scanId: 'scan-1',
  at: '2026-09-10T20:00:00.000Z',
  headSha: 'a'.repeat(40),
  version: '1.0.0',
  estado: 'CERRADO',
  motivo: 'completo',
  score: 74,
  expediente: 12,
  reportados: [HALLAZGO('CRITICAL', 'src/pay/charge.ts'), HALLAZGO('LOW', 'src/ui/App.tsx')],
  paradasHechas: 10,
  paradasTotal: 10,
  ficherosCubiertos: 1730,
  ficherosTotal: 1730,
  modulos: CAMPANA,
  huellas: []
}
