import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

/**
 * Tests unitarios de dominio y de las piezas puras de infraestructura (armado
 * de argumentos, parsers). Nada que necesite Electron, SQLite o un navegador:
 * eso se cubre en los tests de integracion (`npm test`).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@domain': resolve('src/domain'),
      '@application': resolve('src/application'),
      '@infrastructure': resolve('src/infrastructure')
    }
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    /**
     * VEINTE SEGUNDOS, y no los 5.000 ms por defecto de vitest. Es la DEFENSA de
     * la clase, medida el 2026-09-28 tras dos gates rojos por ruido —uno me
     * llevo a comitear sobre rojo—:
     *
     * 44 ficheros de test lanzan procesos REALES (git, el binario del grafo,
     * procesos en caja), de ellos 41 sin techo propio y ~170 bloques de prueba.
     * Darselo fichero a fichero no escala, y sobre todo NO cubre el que alguien
     * escriba manana: cada test nuevo con proceso volveria a ser intermitente.
     *
     * Y la causa no es que los tests sean lentos: es INANICION DE TURNO. El
     * segundo intermitente medido tarda 118 ms aislado y se paso de 5.000 ms con
     * las 862 suites en paralelo — no es lentitud, es que arrancar un proceso no
     * consigue turno. Un techo global lo cubre; uno por fichero, no.
     *
     * La cuenta del numero, con el dato y no por analogia: el test mas lento de
     * la suite mide 3.256 ms, ya al 65 % del techo por defecto —margen de
     * cuchilla—. La peor degradacion observada fue de unos +5 s absolutos, asi
     * que el peor caso realista aterriza en ~8,3 s y 20 s deja 2,4 veces eso.
     *
     * COSTE ACEPTADO: un test que de verdad se cuelgue tardara 20 s en fallar en
     * vez de 5. Con el mas lento real en 3,3 s, esto no tapa lentitud de nadie.
     *
     * Los dos techos por test de `grafo-instalado` y `grafo-aislado-rechaza` se
     * QUEDAN: alli documentan la medicion donde se lee. Son la explicacion; la
     * defensa es esta linea.
     */
    testTimeout: 20_000
  }
})
