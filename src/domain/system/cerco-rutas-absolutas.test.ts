import { describe, expect, it } from 'vitest'
import { redactarObservacion, RUTA_REDACTADA } from './cerco-de-observacion'

describe('la cuarta regla: rutas absolutas que ninguna de las tres alcanzaba', () => {
  it('una ruta que termina en DIRECTORIO: las 40 que sobrevivieron al barrido', () => {
    // Verbatim de la base del operador tras el arranque del 2026-09-11.
    const nota = 'el repo de trabajo /home/jojo/Escritorio/Raisen_FCC/fortress-command-center NO esta indexado' // prettier-ignore

    const limpia = redactarObservacion(nota)

    expect(limpia).not.toContain('/home/jojo')
    expect(limpia).toContain(RUTA_REDACTADA)
    expect(limpia).toContain('NO esta indexado')
  })

  it('LA RUTA DE UN CLIENTE, con ESPACIOS: el caso que hoy se colaria entero', () => {
    // Es el hueco de verdad. Sin admitir espacios, el cerco tajaria
    // `/media/disco/Cliente` y dejaria «ACME» —el nombre del cliente— suelto.
    const nota = 'el repo /media/disco/Cliente ACME no esta indexado'

    const limpia = redactarObservacion(nota)

    expect(limpia).not.toContain('/media/disco')
    expect(limpia).not.toContain('ACME')
    expect(limpia).toBe(`el repo ${RUTA_REDACTADA} no esta indexado`)
  })

  it('y la ruta REAL de tu disco, que lleva tres palabras', () => {
    const nota = 'no pude leer /media/jojo/Jorge_Ibrain/Health Flow V1_FINAL entero'

    expect(redactarObservacion(nota)).toBe(`no pude leer ${RUTA_REDACTADA} entero`)
  })

  it('una ruta de OTRO proyecto, que `ocultarRaiz` no alcanza aunque haya projectPath', () => {
    // `ocultarRaiz` taja la raiz EXACTA del proyecto actual. Una nota que
    // menciona de paso la carpeta de otro cliente se le escapaba.
    const nota = 'el agente intento leer /opt/otro-cliente/data y se le nego'

    expect(redactarObservacion(nota, '/media/disco/ACME')).not.toContain('/opt/otro-cliente')
  })
})

describe('y NO taja de mas: el sistema no identifica a nadie', () => {
  it('/usr, /etc, /tmp y /bin pasan enteros', () => {
    for (const nota of [
      'la libreria vive en /usr/lib/x86_64-linux-gnu y no se encontro',
      'el fichero /etc/hosts no era legible',
      'escribio en /tmp/fcc-rama-abc y no limpio',
      'el binario /bin/sh no responde'
    ]) {
      expect(redactarObservacion(nota)).toBe(nota)
    }
  })

  it('un texto sin ninguna ruta absoluta queda intacto', () => {
    const nota = 'plan-mode impidio escribir el plan y no hubo forma de seguir'

    expect(redactarObservacion(nota)).toBe(nota)
  })

  it('la prosa en minuscula corta la ruta: no se come la frase', () => {
    const nota = 'fallo en /home/ana/proyecto porque el indice estaba frio'

    expect(redactarObservacion(nota)).toBe(`fallo en ${RUTA_REDACTADA} porque el indice estaba frio`) // prettier-ignore
  })
})
