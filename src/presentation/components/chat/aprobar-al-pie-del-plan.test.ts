import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El layout leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const BOTON = 'src/presentation/components/chat/BotonDelPlan.tsx'

describe('la firma del lote va AL PIE del plan, dentro del hilo', () => {
  it('se pinta entre el ultimo mensaje y el fondo, no sobre el input', () => {
    const lista = fuente('src/presentation/components/chat/ChatMessageList.tsx')

    // Dentro del contenedor que scrollea: el pie va tras los mensajes y antes
    // del ancla del fondo. Sobre el input seria una franja fija que tapa.
    expect(lista).toMatch(/\{pie\}\s*<div ref=\{bottomRef\} \/>/)
    // El pie admite hermanos (PASO 87 sumo el carril de vuelta); lo que se fija
    // es que la firma del lote siga DENTRO del pie, no el literal exacto.
    expect(fuente('src/presentation/components/chat/ChatWindow.tsx')).toMatch(
      /pie=\{<>?.*<BotonDelPlan projectId=\{project\.id\} \/>/
    )
  })

  it('el verde es el token que ya existe, no un color inventado', () => {
    // --success: el mismo de los estados buenos. El dorado es marca, no «adelante».
    expect(fuente(BOTON)).toContain('bg-success')
    expect(fuente(BOTON)).not.toMatch(/bg-primary|#[0-9a-fA-F]{3,6}/)
  })

  it('mientras la cola corre NO es pulsable: una linea plana, mismo verde', () => {
    const boton = fuente(BOTON)

    // Un boton vivo durante la ejecucion invita a re-pulsarlo, y cada pulsacion
    // encolaria la misma orden. El progreso lo lleva el indicador de abajo.
    expect(boton).toMatch(/if \(pie === 'ejecutando'\) return <span className=\{PLANO\}>/)
    expect(boton).toContain('Plan ejecutandose')
    expect(boton).toMatch(/const PLANO = `\$\{VERDE\} inline-block opacity-70`/)
    // El mismo verde que el boton, sin `tap` ni hover: no se puede pulsar.
    expect(boton).toMatch(/const BOTON = `tap \$\{VERDE\} hover:brightness-110`/)
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
