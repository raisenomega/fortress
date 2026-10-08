import { useState } from 'react'
import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import { borrarCarpetaConTodo, borrarCarpetaMoviendo, renombrarCarpeta } from '../../services/gestionar-carpetas' // prettier-ignore
import { RenombrarInput } from './RenombrarInput'

interface MenuDeCarpetaProps {
  readonly carpeta: Carpeta
  readonly onCerrar: () => void
}

const ITEM = 'block w-full rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10'

/** El ⋯ de una carpeta (Revision B): renombrar y borrar con ELECCION —
 *  mover sus chats a Sin carpeta (no pierde nada) o borrarlo todo. */
export function MenuDeCarpeta({ carpeta, onCerrar }: MenuDeCarpetaProps): React.JSX.Element {
  const [vista, setVista] = useState<'raiz' | 'renombrar' | 'borrar'>('raiz')
  const corre = (op: Promise<unknown>): void => void op.catch(console.error).finally(onCerrar)
  return (
    <>
      <button type="button" aria-label="Cerrar menu" onClick={onCerrar} className="fixed inset-0 z-10 cursor-default" /> {/* prettier-ignore */}
      <div className="absolute top-7 right-0 z-20 w-56 rounded-md border border-border bg-background p-1 shadow-lg">
        {vista === 'raiz' && (
          <>
            <button type="button" onClick={() => setVista('renombrar')} className={ITEM}>
              Renombrar carpeta
            </button>
            <button type="button" onClick={() => setVista('borrar')} className={ITEM}>
              Borrar carpeta
            </button>
          </>
        )}
        {vista === 'renombrar' && (
          <RenombrarInput
            inicial={carpeta.nombre}
            onCancelar={onCerrar}
            onAceptar={(v) => corre(renombrarCarpeta(carpeta.id, v))}
          />
        )}
        {vista === 'borrar' && (
          <>
            <button type="button" onClick={() => corre(borrarCarpetaMoviendo(carpeta.id, carpeta.nombre))} className={ITEM}> {/* prettier-ignore */}
              Mover sus chats a Sin carpeta
            </button>
            <button
              type="button"
              onClick={() => corre(borrarCarpetaConTodo(carpeta.id, carpeta.nombre))}
              className="block w-full rounded px-2 py-1 text-left text-sm text-critical hover:bg-critical/10"
            >
              Borrar tambien sus chats
            </button>
          </>
        )}
      </div>
    </>
  )
}
