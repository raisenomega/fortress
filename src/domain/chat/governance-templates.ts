/** Los 3 archivos que la app genera por plantilla (no los redacta el agente). */

export const GITIGNORE_TEMPLATE = `# Marco interno de FORTRESS: se queda en el equipo.
FORTRESS*.md
COGNITION*.md
CONSTITUTION.md
SECURITY-BASELINE.md
.mcp.json
.env
*.db
*.db-shm
*.db-wal
node_modules
dist
*.pem
*.key
*.p12
*.keystore
`

export const ENV_EXAMPLE_TEMPLATE = `# Plantilla de variables de entorno. Copia a .env y rellena con valores reales.
# El .env con valores NUNCA se sube (esta en .gitignore).
`

/** COGNITION-LOG en generacion 0: cerebro vacio que se llena con el uso. */
export function cognitionTemplate(projectName: string): string {
  return `# COGNITION-LOG — ${projectName}

## GENERACION ACTUAL

Generacion: 0

## MAPA DE ATENCION

## REFLEXIONES POR SESION
`
}
