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
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
