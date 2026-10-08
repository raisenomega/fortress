import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 116/120: pins a la INVOCACION del cableado del ARBOL (clase 91/96). */
const fuente = (nombre: string): string =>
  readFileSync(`src/presentation/components/construir/${nombre}`, 'utf8')

describe('la barra del Chat, cableada como ARBOL', () => {
  it('la vista pasa a FILA con la barra y su toggle; la principal ni se toca', () => {
    const vista = fuente('ConstruirView.tsx')
    expect(vista).toContain('flex-row')
    expect(vista).toContain('<BarraDelChat')
    expect(vista).toContain('<BarraToggle')
    expect(vista).not.toContain('useSidebarStore')
  })

  it('Revision A: la vista barre los vacios ANTES de rehidratar y ya no hay pagina', () => {
    const vista = fuente('ConstruirView.tsx')
    expect(vista).toContain('barrerVaciosUnaVez(')
    expect(vista).not.toContain('PaginaDeCarpeta')
  })

  it('la barra es arbol: carpetas-acordeon y sueltos; cero pagina, cero busqueda', () => {
    const barra = fuente('BarraDelChat.tsx')
    expect(barra).toContain('cargarListas(')
    expect(barra).toContain('<FilaDeCarpeta')
    expect(barra).toContain('<FilaDeHilo')
    expect(barra).not.toContain('abrirCarpeta')
    expect(barra).not.toContain('buscarHilos')
  })

  it('ACORDEON: la carpeta DESPLIEGA (toggleCarpeta) y pare dentro; jamas entra al chat', () => {
    const carpeta = fuente('FilaDeCarpeta.tsx')
    expect(carpeta).toContain('toggleCarpeta(')
    expect(carpeta).toContain('hilosDeCarpeta(')
    expect(carpeta).toContain('nuevoHiloEnCarpeta(')
    expect(carpeta).toContain('<FilaDeHilo')
    expect(carpeta).not.toContain('elegirHilo') // entrar al chat es de la FILA de hilo
    expect(fuente('FilaDeHilo.tsx')).toContain('elegirHilo(')
  })

  it('cabecera: nuevo EAGER y crear-carpeta-con-hilo; sin busqueda', () => {
    const cabecera = fuente('CabeceraDeLaBarra.tsx')
    expect(cabecera).toContain('nuevoHiloSuelto(')
    expect(cabecera).toContain('crearCarpetaConHilo(')
    expect(cabecera).not.toContain('Buscar')
  })

  it('el toggle vive del store PROPIO de la barra', () => {
    const toggle = fuente('BarraToggle.tsx')
    expect(toggle).toContain('useBarraStore')
    expect(toggle).toContain('toggle')
  })
})

describe('la gestion del ⋯, cableada (Revision B)', () => {
  it('el ⋯ del hilo gestiona de verdad (renombrar, mover, eliminar)', () => {
    expect(fuente('FilaDeHilo.tsx')).toContain('<MenuDeHilo')
    const menu = fuente('MenuDeHilo.tsx')
    expect(menu).toContain('renombrarHilo(')
    expect(menu).toContain('eliminarHilo(')
    expect(menu).toContain('<MoverHiloMenu')
    expect(fuente('MoverHiloMenu.tsx')).toContain('moverHilo(')
  })

  it('el ⋯ de la carpeta renombra y borra con ELECCION', () => {
    expect(fuente('FilaDeCarpeta.tsx')).toContain('<MenuDeCarpeta')
    const menu = fuente('MenuDeCarpeta.tsx')
    expect(menu).toContain('renombrarCarpeta(')
    expect(menu).toContain('borrarCarpetaMoviendo(')
    expect(menu).toContain('borrarCarpetaConTodo(')
  })
})
