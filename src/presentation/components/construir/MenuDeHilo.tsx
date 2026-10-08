import { useState } from 'react'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { eliminarHilo, renombrarHilo } from '../../services/gestionar-hilos'
import { MoverHiloMenu } from './MoverHiloMenu'
import { RenombrarInput } from './RenombrarInput'

interface MenuDeHiloProps {
  readonly hilo: HiloDeChat
  readonly onCerrar: () => void
}

const ITEM = 'block w-full rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10'

/** El ⋯ de un hilo (Revision B): renombrar, mover, eliminar confirmado.
 *  Flota ENCIMA pegado a la derecha; el telon de fondo cierra al clic fuera. */
export function MenuDeHilo({ hilo, onCerrar }: MenuDeHiloProps): React.JSX.Element {
  const [vista, setVista] = useState<'raiz' | 'renombrar' | 'mover'>('raiz')
  return (
    <>
      <button type="button" aria-label="Cerrar menu" onClick={onCerrar} className="fixed inset-0 z-10 cursor-default" /> {/* prettier-ignore */}
      <div className="absolute top-7 right-0 z-20 w-52 rounded-md border border-border bg-background p-1 shadow-lg">
        {vista === 'raiz' && (
          <>
            <button type="button" onClick={() => setVista('renombrar')} className={ITEM}>
              Renombrar
            </button>
            <button type="button" onClick={() => setVista('mover')} className={ITEM}>
              Mover a carpeta
            </button>
            <button
              type="button"
              onClick={() => void eliminarHilo(hilo.id, hilo.titulo).catch(console.error).finally(onCerrar)} // prettier-ignore
              className="block w-full rounded px-2 py-1 text-left text-sm text-critical hover:bg-critical/10"
            >
              Eliminar
            </button>
          </>
        )}
        {vista === 'renombrar' && (
          <RenombrarInput
            inicial={hilo.titulo}
            onCancelar={onCerrar}
            onAceptar={(v) => void renombrarHilo(hilo.id, v).catch(console.error).finally(onCerrar)} // prettier-ignore
          />
        )}
        {vista === 'mover' && <MoverHiloMenu hilo={hilo} onCerrar={onCerrar} />}
      </div>
    </>
  )
}
