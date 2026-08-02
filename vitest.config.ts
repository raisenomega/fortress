import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

/**
 * Tests unitarios de la capa de dominio. Es codigo puro: no necesita Electron,
 * ni SQLite, ni un navegador. Lo que si necesita infraestructura se cubre en
 * los tests de integracion (`npm test`).
 */
export default defineConfig({
  resolve: {
    alias: { '@domain': resolve('src/domain') }
  },
  test: {
    include: ['src/domain/**/*.test.ts'],
    environment: 'node'
  }
})
