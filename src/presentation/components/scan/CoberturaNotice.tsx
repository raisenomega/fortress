import type { CoberturaDeclarada } from '@application/scan/scan-types'
import { Notice } from '../common/Notice'
import { lineaDeCobertura, tonoDeCobertura } from './cobertura-linea'

interface CoberturaNoticeProps {
  readonly cobertura: CoberturaDeclarada
}

/** La cuenta del ultimo escaneo. Calla cuando no hay cobertura que declarar. */
export function CoberturaNotice({ cobertura }: CoberturaNoticeProps): React.JSX.Element | null {
  const linea = lineaDeCobertura(cobertura)
  if (linea === null) return null

  return <Notice tone={tonoDeCobertura(cobertura)}>{linea}</Notice>
}
