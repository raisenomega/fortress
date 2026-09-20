import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
const CHAT = 'src/presentation/components/chat/'
const boton = (): string => fuente(`${CHAT}BotonDelPlan.tsx`)
const lote = (): string => fuente(`${CHAT}LoteEnCurso.tsx`)

/**
 * BUG 3. La pildora verde «Plan ejecutandose…» se quedaba FIJA todo el lote en
 * autonomo —linaje del boton de supervisado (ADR-088)— mientras las fases se
 * pintaban en otro componente, en la barra de estado. En autonomo el pie del
 * hilo pasa a texto plano: el lote como ancla y la fase como sufijo.
 */
describe('en autonomo el pie es texto plano, no una pildora', () => {
  it('la rama de autonomo monta LoteEnCurso, con sus dos numeros', () => {
    expect(boton()).toMatch(/pie === 'lote-en-curso'/)
    expect(boton()).toMatch(/<LoteEnCurso hechos=\{enCurso\.hechos\} total=\{enCurso\.total\} \/>/)
  })

  it('el verde NO entra en esa rama: `bg-success` solo vive en la de supervisado', () => {
    // `PLANO` y `BOTON` derivan de VERDE y solo los usa el camino supervisado.
    expect(lote()).not.toMatch(/bg-success|VERDE|PLANO/)
  })

  it('sin barra de progreso: texto y nada mas', () => {
    expect(lote()).not.toMatch(/progress|<progress|role="progressbar"|width:/)
  })
})

describe('el ancla persiste y la fase es solo un sufijo', () => {
  it('el lote se pinta SIEMPRE; la fase solo si la hay', () => {
    // Entre turno y turno el medidor se apaga (`chat-service` lo cierra en el
    // `finally` de CADA envio). Sin el ancla, el pie quedaria en blanco ahi.
    expect(lote()).toMatch(/\{etiquetaDelLote\(hechos, total\)\}/)
    expect(lote()).toMatch(/fase !== undefined &&/)
  })

  it('el color va SOLO en el sufijo: el numero del lote no lo roba', () => {
    // El lote no cambia porque OMEGA este pensando; pintarlo de su color diria
    // que si. El `span` exterior es neutro y el `TONO` cuelga del interior.
    expect(lote()).toMatch(/className="text-muted-foreground text-xs"/)
    expect(lote()).toMatch(/<span className=\{TONO\[fase\]\}>/)
  })
})

describe('lo que NO se toca', () => {
  it('SUPERVISADO INTACTO: la pildora sigue en su rama, con su verde', () => {
    expect(boton()).toMatch(/pie === 'ejecutando'\) return <span className=\{PLANO\}>/)
    expect(boton()).toContain('Plan ejecutandose')
    expect(boton()).toMatch(/const VERDE = 'bg-success/)
  })

  it('la barra de estado global conserva su medidor', () => {
    // Sirve a escaneo, motor y loop, no solo al Terminal: sacarla de ahi los
    // dejaria sin medidor en todas las demas pantallas.
    const pie = fuente('src/presentation/components/layout/FooterMeter.tsx')

    expect(pie).toMatch(/if \(running\) return <RunMeter \/>/)
    expect(fuente('src/presentation/components/layout/StatusBar.tsx')).toContain('<FooterMeter />')
  })

  it('el TONO de las fases vive en UN solo sitio, y los dos lo importan', () => {
    // Copiarlo seria que el naranja del debate cambiara en un pie y no en otro.
    expect(fuente(`${CHAT}tono-de-fase.ts`)).toMatch(/export const TONO/)
    for (const f of [lote(), fuente(`${CHAT}RunMeter.tsx`)]) {
      expect(f).toMatch(/import \{ TONO \} from '\.\/tono-de-fase'/)
      expect(f).not.toMatch(/const TONO/)
    }
  })
})
