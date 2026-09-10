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
  },
  {
    // `haiku` a proposito: solo tiene que leer el arbol y responder dos
    // preguntas con una cita. El modelo caro es para auditar, no para
    // clasificar, y este corre en CADA escaneo que deje algo sin resolver.
    id: 'scope-classifier',
    iconName: 'shield',
    name: 'Scope Classifier',
    purpose: 'Decide que modulos de la campana de auditoria aplican, con evidencia',
    enabledByDefault: false,
    model: 'haiku'
  }
]
