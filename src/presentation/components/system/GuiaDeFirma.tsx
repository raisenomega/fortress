import { useEffect, useState } from 'react'
import type { ResultadoDeTanda } from '@application/repair/medir-la-tanda'
import type { GuiaDeOrden } from '@domain/repair/orden-de-firma'
import { api } from '../../adapters/fortress-api'
import { AvisosDeLaGuia } from './AvisosDeLaGuia'
import { ResultadoDeLaTanda } from './ResultadoDeLaTanda'

const corto = (id: string): string => id.slice(0, 8)

/**
 * La guia del orden de firma (deuda #2): el orden sugerido y los grupos salen
 * GRATIS de las reglas que ya existian; el boton corre la sonda del conjunto
 * y, si sale roja, nombra a los culpables ANTES de que una firma los caduque.
 * Aqui no se firma ni se integra nada: solo se lee y se mide.
 */
export function GuiaDeFirma({
  projectId
}: {
  readonly projectId: string
}): React.JSX.Element | null {
  const [guia, setGuia] = useState<GuiaDeOrden | null>(null)
  const [midiendo, setMidiendo] = useState(false)
  const [tanda, setTanda] = useState<ResultadoDeTanda | null>(null)

  useEffect(() => {
    let vivo = true
    void api()
      .tanda.guia(projectId)
      .then((r) => {
        if (!vivo) return
        setGuia(r.n >= 2 ? r.guia : null)
        setTanda(null)
      })
    return (): void => {
      vivo = false
    }
  }, [projectId])
  if (guia === null) return null

  const medir = async (): Promise<void> => {
    setMidiendo(true)
    try {
      const r = await api().tanda.medir(projectId)
      if (r.ok) setTanda(r.value)
    } finally {
      setMidiendo(false)
    }
  }

  return (
    <section className="border-border bg-card space-y-1 rounded-lg border p-3 text-xs">
      <p className="text-foreground">Orden sugerido: {guia.orden.map(corto).join(' → ')}</p>
      <AvisosDeLaGuia guia={guia} />
      <button
        type="button"
        onClick={() => void medir()}
        disabled={midiendo}
        className="border-border text-foreground hover:bg-secondary rounded border px-2 py-1 disabled:opacity-50"
      >
        {midiendo ? 'Midiendo la tanda (cada medida es un gate)...' : 'Medir la tanda'}
      </button>
      {tanda !== null && <ResultadoDeLaTanda tanda={tanda} />}
    </section>
  )
}
