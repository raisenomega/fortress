import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'

/** El layout leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const BOTON = 'src/presentation/components/chat/BotonDelPlan.tsx'

describe('la firma del lote va AL PIE del plan, dentro del hilo', () => {
  it('se pinta entre el ultimo mensaje y el fondo, no sobre el input', () => {
    const lista = fuente('src/presentation/components/chat/ChatMessageList.tsx')

    // Dentro del contenedor que scrollea: el pie va tras los mensajes y antes
    // del ancla del fondo. Sobre el input seria una franja fija que tapa.
    expect(lista).toMatch(/\{pie\}\s*<div ref=\{bottomRef\} \/>/)
    expect(fuente('src/presentation/components/chat/ChatWindow.tsx')).toMatch(
      /pie=\{<BotonDelPlan projectId=\{project\.id\} \/>\}/
    )
  })

  it('el verde es el token que ya existe, no un color inventado', () => {
    // --success: el mismo de los estados buenos. El dorado es marca, no «adelante».
    expect(fuente(BOTON)).toContain('bg-success')
    expect(fuente(BOTON)).not.toMatch(/bg-primary|#[0-9a-fA-F]{3,6}/)
  })

  it('dice cuantos resuelve y que Detener lo corta', () => {
    expect(fuente(BOTON)).toContain('Ejecutar plan ({cuantos})')
    expect(fuente(BOTON)).toContain('Resuelve los {cuantos}. Detener lo corta.')
  })

  it('dispara la MISMA llamada de siempre: no recablea la cola', () => {
    expect(fuente(BOTON)).toMatch(/resolverLotePendiente\(projectId\)/)
    // Y ya no cuelga del tablero: alli obligaba a volver del Terminal a firmar.
    expect(fuente('src/presentation/hooks/useLoteDelTablero.ts')).not.toMatch(/ejecutar/)
  })
})

describe('solo aparece cuando hay un plan de ESTE proyecto esperando', () => {
  const lee = (projectId: string): unknown => {
    const s = useColaDelLoteStore.getState()
    return s.pendiente?.projectId === projectId && s.pendiente.planeado ? s.pendiente : null
  }

  it('sin nada pendiente no hay pie que pintar', () => {
    useColaDelLoteStore.getState().descartar()

    expect(lee('p1')).toBeNull()
  })

  it('precargado pero SIN plan todavia: aun no hay nada que firmar', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])

    expect(lee('p1')).toBeNull()
  })

  it('con el plan ya escrito, el pie sale con sus N', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])
    useColaDelLoteStore.getState().marcarPlaneado('p1')

    expect(lee('p1')).toMatchObject({ planeado: true, ids: ['f1', 'f2'] })
  })

  it('y en OTRO proyecto no sale: se firma el lote de quien lo pidio', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])
    useColaDelLoteStore.getState().marcarPlaneado('p1')

    expect(lee('p2')).toBeNull()
  })
})
