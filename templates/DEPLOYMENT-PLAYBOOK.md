<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# DEPLOYMENT-PLAYBOOK — De Cero a FORTRESS Completo
## Guía paso a paso · Cualquier proyecto · Cualquier stack
### Versión 1.0 · Agosto 2026

```
Esta guía te lleva de un proyecto sin protección a un sistema
FORTRESS completo con los 5 pilares activos en 4 semanas.

Cada paso tiene:
  · Qué hacer (acción concreta)
  · Cómo verificar (que funcionó)
  · Tiempo estimado
  · Dependencias (qué necesitas antes)

No saltar pasos. El orden importa.
```

---

## REQUISITOS PREVIOS

```
Antes de empezar, verificar:

  □ Node.js >= 18 instalado
    Verificar: node --version

  □ Claude Code instalado
    Instalar: npm install -g @anthropic-ai/claude-code
    Verificar: claude --version

  □ Git instalado y configurado
    Verificar: git --version
    Configurar: git config user.name "Tu Nombre"
                git config user.email "tu@email.com"

  □ Un proyecto con código fuente (nuevo o existente)

  □ Cuenta de Anthropic (Pro o Max)
    Verificar: claude y hacer login

TIEMPO TOTAL ESTIMADO:
  Semana 1: Fundación (2-3 horas)
  Semana 2: Seguridad + SAST (3-4 horas)
  Semana 3: Agentes + Cognition (2-3 horas)
  Semana 4: Automatización + Producción (2-3 horas)
```

---

## SEMANA 1 — FUNDACIÓN

### Día 1: Documentos base (30 min)

```
PASO 1.1 — Copiar CLAUDE.md a la raíz del proyecto
  
  cp /ruta/donde/lo/descargaste/CLAUDE.md ~/tu-proyecto/CLAUDE.md

  Verificar: cat ~/tu-proyecto/CLAUDE.md | head -5
  Debe mostrar: "# CLAUDE.md — Configuración Universal para Claude Code"


PASO 1.2 — Copiar documentos locales (NO commiteables)

  cp FORTRESS_UNIVERSAL_SECURITY_FRAMEWORK.md ~/tu-proyecto/
  cp COGNITION_DEEP.md ~/tu-proyecto/
  cp COGNITION-LOG.md ~/tu-proyecto/

  Verificar que están en .gitignore:
  
  echo "FORTRESS*.md" >> ~/tu-proyecto/.gitignore
  echo "COGNITION*.md" >> ~/tu-proyecto/.gitignore
  echo ".mcp.json" >> ~/tu-proyecto/.gitignore

  Verificar: git status (no deben aparecer los FORTRESS/COGNITION)


PASO 1.3 — Crear ARCHITECTURE.md con datos reales

  cp ARCHITECTURE.md ~/tu-proyecto/
  
  Abrir y llenar CADA sección con los datos reales del proyecto:
  · Stack tecnológico (frontend, backend, BD, servicios)
  · Estructura de carpetas real
  · Modelos de datos principales
  · Endpoints de API principales
  · Variables de entorno (nombres, no valores)
  · Convenciones del proyecto

  ESTE SÍ se commitea — no contiene secrets.

  Verificar: revisar que no tiene valores de .env reales
```

### Día 2: Knowledge Graph (20 min)

```
PASO 2.1 — Abrir Claude Code en el proyecto

  cd ~/tu-proyecto
  claude

PASO 2.2 — Instalar Knowledge Graph

  Pegar en Claude Code:

  "Install and set up codebase-memory-mcp into my current project.
   Repo: https://github.com/DeusData/codebase-memory-mcp
   Install method: release-binary. Index the entire codebase
   after installation."

  Esperar a que termine. Aprobar los permisos que pida.

PASO 2.3 — Verificar instalación

  Preguntar: "¿Cuál es la arquitectura de este proyecto?"
  
  Si responde usando el graph (rápido, sin abrir archivos) → OK
  Si abre archivos uno por uno → el graph no está activo,
  salir con /exit y volver a entrar para cargar el MCP.

PASO 2.4 — Agregar .mcp.json a .gitignore

  Verificar: grep ".mcp.json" .gitignore
  Si no está: echo ".mcp.json" >> .gitignore

PASO 2.5 — Instalar monitor de tokens (opcional pero recomendado)

  Dentro de Claude Code:
  /plugin marketplace add jasonjmcghee/claude-hud
  /plugin install claude-hud@claude-hud
  /reload-plugins
```

### Día 3: Primer scan de seguridad (30 min)

```
PASO 3.1 — Ejecutar scan de seguridad

  Dentro de Claude Code:

  "Ejecuta FASE 1 del protocolo de limpieza de CLAUDE.md:
   1. Buscar secrets hardcodeados en todo el codebase
   2. Buscar vulnerabilidades de inyección (SQL, XSS, command injection)
   3. Verificar autenticación y autorización en todos los endpoints
   4. Verificar headers de seguridad
   5. Verificar rate limiting
   Genera reporte en FORTRESS-REPORT.md
   Registra cada hallazgo en COGNITION-LOG.md como patrón nuevo."

PASO 3.2 — Revisar el reporte

  El reporte está en FORTRESS-REPORT.md
  Revisar cada hallazgo CRITICAL y HIGH
  Decidir cuáles resolver ahora y cuáles pueden esperar

PASO 3.3 — Resolver CRITICALs

  Para cada CRITICAL:

  "Corrige [descripción del CRITICAL] siguiendo el protocolo
   de corrección de CLAUDE.md. Corre tests antes y después.
   Si no hay tests, escribe uno primero."

PASO 3.4 — Usar /compact al terminar

  /compact
```

---

## SEMANA 2 — SEGURIDAD Y SAST

### Día 4: Pre-commit hooks (15 min)

```
PASO 4.1 — Instalar Gitleaks como pre-commit hook

  # Instalar Gitleaks
  # Linux:
  curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_amd64.tar.gz | tar xz
  sudo mv gitleaks /usr/local/bin/

  # Mac:
  brew install gitleaks

  Verificar: gitleaks version

PASO 4.2 — Crear pre-commit hook

  cat > ~/tu-proyecto/.git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔐 FORTRESS: Escaneando secrets..."
gitleaks protect --staged --verbose
if [ $? -ne 0 ]; then
    echo "⛔ FORTRESS: Secrets detectados. Commit bloqueado."
    echo "   Remueve los secrets y vuelve a intentar."
    exit 1
fi
echo "✅ FORTRESS: Sin secrets detectados."
EOF

  chmod +x ~/tu-proyecto/.git/hooks/pre-commit

  Verificar: crear un archivo con "password=test123" e intentar commit
  Debe bloquear el commit.
  Borrar el archivo de prueba después.
```

### Día 5: CI/CD con GitHub Actions (30 min)

```
PASO 5.1 — Crear workflow de seguridad

  mkdir -p .github/workflows

  cat > .github/workflows/fortress-scan.yml << 'EOF'
name: FORTRESS Security Scan
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 5 * * 1'  # Lunes 5am UTC

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Gitleaks Secret Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Trivy Vulnerability Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'HIGH,CRITICAL'
          exit-code: '1'
EOF

  git add .github/workflows/fortress-scan.yml
  git commit -m "security(ci): agregar FORTRESS scan en CI/CD"

  Verificar: hacer push y ver que el workflow corre en GitHub Actions


PASO 5.2 — Agregar Claude Code Action (si lo deseas)

  Agregar al workflow:

      - name: Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

  Agregar ANTHROPIC_API_KEY en Settings → Secrets del repo en GitHub.
```

### Día 6: Scan de dependencias (15 min)

```
PASO 6.1 — Instalar Trivy localmente

  # Linux:
  curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin

  # Mac:
  brew install trivy

PASO 6.2 — Primer scan de dependencias

  cd ~/tu-proyecto
  trivy fs --scanners vuln,secret,misconfig .

  Revisar resultados. Resolver HIGH y CRITICAL.

PASO 6.3 — Registrar hallazgos en COGNITION-LOG.md

  Dentro de Claude Code:

  "Registra los hallazgos de Trivy en COGNITION-LOG.md
   como patrones nuevos. Para cada dependencia vulnerable,
   documenta: paquete, versión actual, CVE, versión que lo resuelve."
```

---

## SEMANA 3 — AGENTES Y COGNITION

### Día 7: Instalar agentes seleccionados (20 min)

```
PASO 7.1 — Crear estructura de agentes

  mkdir -p ~/tu-proyecto/.claude/agents

PASO 7.2 — Crear cada agente

  Copiar el contenido de cada agente de AGENTS-SELECTED.md
  en archivos individuales:

  # Copiar el contenido del bloque de cada agente:
  # (el bloque markdown entre los ---)

  nano .claude/agents/security-reviewer.md    # pegar contenido
  nano .claude/agents/code-reviewer.md        # pegar contenido
  nano .claude/agents/refactor-cleaner.md     # pegar contenido
  nano .claude/agents/tdd-guide.md            # pegar contenido
  nano .claude/agents/planner.md              # pegar contenido
  nano .claude/agents/build-error-resolver.md # pegar contenido
  nano .claude/agents/e2e-runner.md           # pegar contenido
  nano .claude/agents/code-simplifier.md      # pegar contenido
  nano .claude/agents/opensource-sanitizer.md  # pegar contenido
  nano .claude/agents/cognition.md            # pegar contenido

PASO 7.3 — Verificar que Claude Code los detecta

  Reiniciar Claude Code (/exit y volver a entrar)
  Preguntar: "¿Qué agentes tengo disponibles?"
  Debe listar los 10 agentes.

PASO 7.4 — Probar un agente

  "Usa el agente security-reviewer para revisar src/auth/"

  Debe activar el agente con el protocolo completo.
```

### Día 8: Activar COGNITION (30 min)

```
PASO 8.1 — Llenar COGNITION-LOG.md con datos iniciales

  Dentro de Claude Code:

  "Lee COGNITION-LOG.md y llena la sección 'Generación Actual'
   con los datos reales del proyecto. Luego ejecuta un scan
   completo y registra cada hallazgo como patrón nuevo.
   Calcula el attention map basado en lo que encuentres."

PASO 8.2 — Verificar que el loop funciona

  Hacer un cambio en el código que introduzca un problema conocido
  (ej: agregar un console.log de debugging)

  Pedirle a Claude Code: "Usa el agente cognition para analizar
  la sesión de hoy"

  Debe: detectar el console.log → razonar causa raíz →
  crear regla → registrar en COGNITION-LOG.md

PASO 8.3 — Verificar el attention map

  "Muéstrame el attention map actual del proyecto"

  Debe mostrar zonas con pesos asignados basados en los hallazgos.
```

### Día 9: Configurar Routines (20 min)

```
PASO 9.1 — Crear directorio de routines

  mkdir -p ~/tu-proyecto/.claude/routines

PASO 9.2 — Copiar las routines de DREAMING-CONFIG.md

  Crear cada archivo según DREAMING-CONFIG.md:
  · .claude/routines/dreaming.md
  · .claude/routines/security-daily.md
  · .claude/routines/cleanup-weekly.md
  · .claude/routines/deps-check.md
  · .claude/routines/outcomes-check.md
  · .claude/routines/graph-reindex.md

PASO 9.3 — Si Routines no está disponible, usar cron

  crontab -e

  # Agregar:
  0 2 * * * cd ~/tu-proyecto && claude --headless "Ejecuta routine dreaming"
  0 5 * * * cd ~/tu-proyecto && claude --headless "Ejecuta routine security-daily-scan"
  0 4 * * 1 cd ~/tu-proyecto && claude --headless "Ejecuta routine cleanup-weekly"

PASO 9.4 — Ejecutar una routine manualmente para verificar

  Dentro de Claude Code:
  "Ejecuta la routine dreaming ahora como prueba"
```

---

## SEMANA 4 — PRODUCCIÓN

### Día 10: Scan pre-producción completo (1 hora)

```
PASO 10.1 — Ejecutar las 5 fases completas

  Dentro de Claude Code:

  "Ejecuta limpieza completa del proyecto:
   FASE 1: Seguridad
   FASE 2: Código muerto
   FASE 3: Bugs
   FASE 4: Consistencia
   FASE 5: Performance
   Genera reporte completo en FORTRESS-REPORT.md
   Registra todo en COGNITION-LOG.md"

PASO 10.2 — Revisar el reporte

  Abrir FORTRESS-REPORT.md
  Verificar que:
  · 0 hallazgos CRITICAL (bloqueante para producción)
  · Todos los HIGH tienen fix aplicado o justificación
  · MEDIUM y LOW están trackeados

PASO 10.3 — Verificar checklist pre-producción

  □ Tests corriendo y pasando
  □ Build exitoso
  □ No hay secrets en el código (Gitleaks verificó)
  □ No hay dependencias con CVEs CRITICAL (Trivy verificó)
  □ Security headers presentes en todas las respuestas
  □ Rate limiting activo en endpoints sensibles
  □ RLS activado en todas las tablas con datos de usuario
  □ .env.example actualizado (sin valores reales)
  □ ARCHITECTURE.md actualizado con la estructura final
  □ COGNITION-LOG.md tiene baseline de patrones
  □ Knowledge Graph indexado y actualizado
  □ CI/CD pipeline activo (GitHub Actions)
  □ Pre-commit hook activo (Gitleaks)
```

### Día 11: Multi-repo (si aplica) (30 min)

```
PASO 11.1 — Instalar fortress-orchestrator.sh

  chmod +x fortress-orchestrator.sh
  cp fortress-orchestrator.sh ~/.local/bin/

PASO 11.2 — Agregar repos

  fortress-orchestrator.sh add ~/projects/nucleo
  fortress-orchestrator.sh add ~/projects/wudi
  fortress-orchestrator.sh add ~/projects/omega

PASO 11.3 — Verificar estado

  fortress-orchestrator.sh list
  fortress-orchestrator.sh status

PASO 11.4 — Primer scan multi-repo

  fortress-orchestrator.sh scan security

PASO 11.5 — Verificar push coordinado

  fortress-orchestrator.sh push
  (solo debe permitir push de repos sin CRITICALs)
```

### Día 12: Verificación final (30 min)

```
PASO 12.1 — Preguntarle a Claude Code

  "¿Está este proyecto listo para producción?
   Evalúa contra los 5 pilares de FORTRESS y dame
   un veredicto honesto con score."

PASO 12.2 — Verificar que el sistema completo funciona

  □ CLAUDE.md: Claude Code lo lee al entrar
  □ Knowledge Graph: consultas responden sin leer archivos
  □ Agentes: se activan cuando los invocas
  □ COGNITION-LOG.md: tiene patrones registrados
  □ Pre-commit hooks: bloquean secrets
  □ CI/CD: workflow corre en cada push/PR
  □ Routines: programadas o cron activo
  □ FORTRESS-REPORT.md: último reporte sin CRITICALs
  □ fortress-orchestrator.sh: funciona (si multi-repo)

PASO 12.3 — Commit de documentación

  git add CLAUDE.md ARCHITECTURE.md .claude/ .github/
  git commit -m "docs: implementar FORTRESS framework completo"

  (NO commitear: FORTRESS.md, COGNITION_DEEP.md, COGNITION-LOG.md, .mcp.json)
```

---

## PARA PROYECTOS NUEVOS (después del primero)

```
Una vez que tienes el primer proyecto configurado, los siguientes
son mucho más rápidos porque ya tienes todos los archivos template:

  1. Copiar CLAUDE.md al nuevo proyecto              → 1 min
  2. Copiar documentos locales (FORTRESS, COGNITION) → 1 min
  3. Llenar ARCHITECTURE.md con datos del proyecto   → 15 min
  4. Abrir Claude Code e instalar Knowledge Graph     → 10 min
  5. Copiar .claude/agents/ del proyecto anterior     → 2 min
  6. Copiar .claude/routines/ del proyecto anterior   → 2 min
  7. Copiar .github/workflows/ del proyecto anterior  → 2 min
  8. Primer scan de seguridad                         → 20 min
  9. Agregar al fortress-orchestrator.sh              → 1 min

  TOTAL: ~55 minutos para un proyecto nuevo completo

  vs. 4 semanas del primero → 95% más rápido a partir del segundo
```

---

## RESUMEN VISUAL

```
SEMANA 1                SEMANA 2                SEMANA 3                SEMANA 4
Fundación               Seguridad               Agentes                 Producción
                                                                        
CLAUDE.md        ──►    Gitleaks         ──►    10 agentes       ──►    Scan completo
ARCHITECTURE.md  ──►    CI/CD GitHub     ──►    COGNITION activo ──►    Checklist
Knowledge Graph  ──►    Trivy            ──►    Routines         ──►    Multi-repo
Primer scan      ──►    Dependencias     ──►    Dreaming         ──►    Deploy ✓

Estado:                 Estado:                 Estado:                 Estado:
Protección básica       SAST + CI activo        Sistema cognitivo       FORTRESS
                                                funcionando             COMPLETO
```

---

```
DEPLOYMENT-PLAYBOOK · De Cero a FORTRESS · v1.0
4 semanas · 12 pasos · Cualquier proyecto · Cualquier stack
Segundo proyecto en adelante: ~55 minutos

Archivos que SÍ se commitean:
  CLAUDE.md, ARCHITECTURE.md, .claude/agents/, .claude/routines/,
  .github/workflows/, .env.example

Archivos que NO se commitean:
  FORTRESS.md, COGNITION_DEEP.md, COGNITION-LOG.md,
  .mcp.json, .env, FORTRESS-REPORT.md
```
