import type { Agent } from './agent'

/** Agentes que existen pero llegan apagados: se encienden cuando hacen falta. */
export const OPTIONAL_AGENTS: readonly Agent[] = [
  {
    id: 'build-error-resolver',
    iconName: 'wrench',
    name: 'Build Error Resolver',
    purpose: 'Diagnostica y arregla fallos de build',
    enabledByDefault: false,
    model: 'sonnet'
  },
  {
    id: 'e2e-runner',
    iconName: 'play',
    name: 'E2E Runner',
    purpose: 'Ejecuta tests end-to-end y verifica flujos completos',
    enabledByDefault: false,
    model: 'sonnet'
  },
  {
    id: 'code-simplifier',
    iconName: 'sparkles',
    name: 'Code Simplifier',
    purpose: 'Reduce complejidad sin cambiar comportamiento',
    enabledByDefault: false,
    model: 'haiku'
  },
  {
    id: 'opensource-sanitizer',
    iconName: 'package',
    name: 'Opensource Sanitizer',
    purpose: 'Prepara el repo para publicarse sin filtrar nada',
    enabledByDefault: false,
    model: 'haiku'
  }
]
