<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# FORTRESS — FRAMEWORK UNIVERSAL DE SEGURIDAD, CALIDAD Y RESILIENCIA
## 36 Capas Reactivas + Capa Cognitiva Profunda · 5 Pilares · Stack-Agnostic · Nivel Gubernamental
### Versión 1.0 · 14 julio 2026
### Clasificación: MÁXIMA SEGURIDAD · INTERNO ABSOLUTO

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    ⛔  CLASIFICACIÓN: INTERNO ABSOLUTO  ⛔              ║
║                                                                          ║
║  ESTE DOCUMENTO:                                                         ║
║    · JAMÁS se commitea a ningún repositorio                              ║
║    · JAMÁS pasa un push (a ningún remote, ningún branch, ningún fork)    ║
║    · JAMÁS se sube a GitHub, GitLab, Bitbucket ni ningún hosting de      ║
║      código — ni público, ni privado, ni enterprise                      ║
║    · JAMÁS se comparte por Slack, Discord, email, drive ni ningún        ║
║      canal digital rastreable sin autorización explícita del operador    ║
║    · JAMÁS se referencia en código, comments, PRs, issues ni docs       ║
║      del repositorio                                                     ║
║    · NO EXISTE en el repo. Punto. Su existencia es local.               ║
║                                                                          ║
║  DÓNDE VIVE:                                                             ║
║    · SOLO en la raíz local de la máquina del operador                    ║
║    · SOLO como archivo de referencia de diseño y arquitectura            ║
║    · Si se usa .gitignore, incluir: FORTRESS*.md                         ║
║    · Si se usa .cursorignore o similar, incluir también                   ║
║                                                                          ║
║  POR QUÉ:                                                                ║
║    · Este documento ES el mapa completo de seguridad del proyecto        ║
║    · Contiene la arquitectura de defensa, las capas, los umbrales,       ║
║      las herramientas, los scores y las reglas de respuesta              ║
║    · En manos de un atacante, es la guía perfecta para saber             ║
║      exactamente QUÉ se vigila y CÓMO evadirlo                          ║
║    · Un blueprint de seguridad expuesto anula su propia seguridad        ║
║                                                                          ║
║  VIOLACIÓN DE ESTA REGLA:                                                ║
║    · Se considera incidente de seguridad CRITICAL                        ║
║    · Requiere rotación inmediata de toda estrategia expuesta             ║
║    · Se registra en el log forense del proyecto                          ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

> **Qué es:** FORTRESS es un framework de seguridad enterprise completo que
> combina las mejores prácticas de OWASP, NIST, ISO 27001, CIS Controls,
> MITRE ATT&CK, y la experiencia operativa de sistemas de producción reales
> en un solo documento aplicable a CUALQUIER proyecto, de CUALQUIER stack,
> en CUALQUIER industria — sin degradar jamás de nivel enterprise.
>
> **La promesa:** Si aplicas este framework completo, tu proyecto tendrá el
> mismo nivel de seguridad y resiliencia que los sistemas de instituciones
> financieras, agencias gubernamentales y infraestructura crítica.
>
> **Frameworks de referencia integrados:**
> OWASP Top 10 (Web + API + LLM 2025) · OWASP Agentic Top 10 2026
> NIST SP 800-207 Zero Trust · NIST AI RMF · NIST CSF 2.0
> CIS Controls v8 · MITRE ATT&CK · MITRE ATLAS (IA)
> Google SAIF · ISO 27001 · ISO 42001 · CSA MAESTRO
> SOC 2 Type II · PTES · EASM

---

## ÍNDICE MAESTRO

```
PILAR I    — SENTINEL: Seguridad de Infraestructura y Código (12 capas)
PILAR II   — GUARDIAN: Seguridad de Comportamiento Humano (8 capas)
PILAR III  — HERMES: Salud de Conectividad y Dependencias Externas (6 capas)
PILAR IV   — SHIELD: Análisis de Superficie de Ataque Externa (10 capas)

PILAR V    — COGNITION: Capa Cognitiva Profunda (aprendizaje permanente)

MÓDULO A   — Arsenal de Herramientas (27+ herramientas recomendadas)
MÓDULO B   — Pipeline CI/CD de Seguridad (implementación paso a paso)
MÓDULO C   — Scoring Unificado y Dashboard
MÓDULO D   — Plan de Implementación (de cero a producción)
MÓDULO E   — Reglas Inviolables del Framework
MÓDULO F   — BC_COGNITION: Arquitectura DDD del Agente Cognitivo
MÓDULO G   — Knowledge Graph y Optimización de Tokens
MÓDULO H   — Orquestación Multi-Repo
MÓDULO I   — Dreaming / Routines / Outcomes (Automatización Cognitiva)
```

---

# ARQUITECTURA GLOBAL

```
┌──────────────────────────────────────────────────────────────────┐
│                    OPERADOR / EQUIPO LÍDER                       │
│       Dashboard de Seguridad · Alertas · Reportes · CLI         │
└───────────────────────────┬──────────────────────────────────────┘
                            │ reporta
                   ┌────────▼────────┐
                   │   COORDINADOR   │
                   │   (Orquestador) │
                   │  Combina los 4  │
                   └─┬────┬────┬──┬─┘
                     │    │    │  │
        ┌────────────▼┐ ┌▼───┐│ ┌▼────────────┐
        │  SENTINEL   │ │    ││ │  GUARDIAN    │
        │  12 capas   │ │    ││ │  8 capas     │
        │  Código     │ │    ││ │  Humanos     │
        │  Infra      │ │    ││ │  Sesiones    │
        └──────┬──────┘ │    ││ └──────┬───────┘
               │     ┌──▼──┐ │        │
               │     │HERMES│ │        │
               │     │6 cap │ │        │
               │     │Conex.│ │        │
               │     └──┬──┘ │        │
               │        │  ┌─▼──────┐ │
               │        │  │ SHIELD │ │
               │        │  │10 cap  │ │
               │        │  │Superf. │ │
               │        │  │Externa │ │
               │        │  └───┬────┘ │
    ┌──────────▼────────▼──────▼──────▼────────────┐
    │             TU PROYECTO (cualquier stack)      │
    │  Backend · Frontend · DB · APIs · Containers   │
    │  Servicios · Agentes IA · Infraestructura      │
    └──────────────────────────────────────────────────┘

LOS 4 PILARES Y SUS DOMINIOS:

  SENTINEL  → mira HACIA ADENTRO   (¿el código y la infraestructura están sanos?)
  GUARDIAN  → mira A LAS PERSONAS  (¿los usuarios y operadores son legítimos?)
  HERMES    → mira HACIA AFUERA    (¿las APIs y servicios de los que dependemos responden?)
  SHIELD    → mira DESDE AFUERA    (¿qué ve un atacante mirando nuestro sistema?)
  COGNITION → mira HACIA SÍ MISMO (¿qué aprendí? ¿cómo evito que se repita?)

  Los 4 primeros son el MURO REACTIVO — atrapan todo.
  COGNITION es el CEREBRO — aprende, corrige, implementa y garantiza
  que lo que atrapó una vez NUNCA vuelva a ocurrir.

  Ninguno reemplaza a otro. Juntos cubren las 5 superficies de riesgo.
```

---

# PILAR I — SENTINEL
## Seguridad de Infraestructura y Código
## Misión: Que ninguna vulnerabilidad técnica exista más de 24 horas

---

### CAPA S1 — Infraestructura en Tiempo Real (cada 5 min)

**Qué vigila:** El estado vivo de la infraestructura del proyecto.

```
CHECKS UNIVERSALES (adaptar variables al stack):

  S1.1 — INTEGRIDAD DE ARCHIVOS CRÍTICOS
    · Calcular SHA-256 de archivos de configuración críticos
    · Cualquier archivo de reglas, límites, permisos o seguridad
      que NO deba cambiar sin proceso formal → monitorear hash
    · Si el hash cambia sin commit aprobado → CRITICAL
    · Herramientas: script custom, AIDE, OSSEC, Tripwire

  S1.2 — SEGURIDAD DE BASE DE DATOS
    · Verificar que TODAS las tablas con datos de usuario tengan
      Row Level Security (RLS) activado — o equivalente:
      - PostgreSQL/Supabase: RLS policies
      - MongoDB: field-level encryption + app-level auth
      - MySQL: views con permisos + app-level auth
      - DynamoDB: IAM policies + condition expressions
    · Tablas nuevas sin protección → CRITICAL, bloquear deploy

  S1.3 — VARIABLES DE ENTORNO
    · Verificar presencia de TODAS las variables requeridas
    · Adaptar lista al stack:
      - Claves API (del proveedor de IA, payment, email, etc.)
      - Conexiones de BD (URL, keys, roles)
      - Secrets de autenticación (JWT secret, encryption key)
      - Configuración de entorno (ENVIRONMENT=production)
    · Variable faltante → HIGH, variable incorrecta → MEDIUM

  S1.4 — CERTIFICADO SSL/TLS
    · Verificar expiración del certificado
    · < 30 días → HIGH, < 7 días → CRITICAL
    · Verificar que no use TLS 1.0/1.1 (obsoletos)

  S1.5 — JOBS PROGRAMADOS ACTIVOS
    · Verificar que TODOS los cron jobs/workers críticos estén corriendo
    · Un job de seguridad que no corre es un punto ciego

  S1.6 — COSTOS Y LÍMITES DE CONSUMO
    · Monitorear gasto por usuario/cliente vs. límites definidos
    · Alertar antes de que un consumo descontrolado queme presupuesto
```

**Herramientas recomendadas:** Script custom (Python/Go/Bash), Prometheus + Alertmanager, Datadog, New Relic, Grafana.

---

### CAPA S2 — Auditoría de Código (en cada commit/push)

**Qué vigila:** Que el código que entra al repo cumple estándares de seguridad.

```
CHECKS UNIVERSALES (pre-push hook + CI):

  S2.1 — COMPLEJIDAD Y TAMAÑO DE ARCHIVOS
    · Archivos excesivamente largos → difíciles de auditar → riesgo
    · Definir límite por convención del equipo (75-200 líneas)
    · Funciones excesivamente complejas (cyclomatic complexity)

  S2.2 — PUREZA ARQUITECTÓNICA
    · Capas internas (domain/core) no deben importar capas externas
    · Verificar que las dependencias fluyan en la dirección correcta
    · Adaptar al patrón: Clean Architecture, Hexagonal, DDD, MVC

  S2.3 — PROVEEDORES RESTRINGIDOS
    · Si el proyecto define proveedores autorizados (ej. solo un
      proveedor de IA, solo un gateway de pago), verificar que
      no se importen otros sin autorización explícita

  S2.4 — SECRETS HARDCODEADOS (CRITICAL)
    · Detectar API keys, tokens, passwords, JWTs en código fuente
    · Patrones universales a buscar:
      - sk-ant-*, sk_live_*, sk_test_* (claves de API)
      - ghp_*, github_pat_* (tokens de GitHub)
      - AIzaSy* (Google API keys)
      - eyJhbGciOi* (JWTs hardcodeados)
      - password=, api_key=, secret= con valores literales
    · Herramientas: Gitleaks, TruffleHog, detect-secrets

  S2.5 — SEGURIDAD ESPECÍFICA DEL LENGUAJE
    · TypeScript/JS: prohibir `any`, `@ts-ignore`, `eval()`
    · Python: prohibir `exec()`, `eval()`, `pickle.loads()` sin sanitización
    · SQL: verificar que toda tabla nueva tenga seguridad a nivel fila
    · Go: verificar error handling (no ignorar errores)
    · Rust: verificar bloques `unsafe` justificados
    · Adaptar al lenguaje del proyecto

  S2.6 — CALIDAD DE TESTS
    · Cobertura mínima definida (recomendado: 80%+ para lógica crítica)
    · Tests de seguridad presentes para endpoints sensibles
    · No permitir merge sin tests para funcionalidad nueva
```

**Herramientas recomendadas:**

| Categoría | Herramientas |
|-----------|-------------|
| Secrets en código | Gitleaks (pre-commit), TruffleHog (CI), GitGuardian |
| Linting universal | MegaLinter (100+ linters, 50+ lenguajes), ESLint, Pylint, RuboCop |
| SAST | Semgrep (reglas custom), SonarQube CE, CodeQL, Bandit (Python), Brakeman (Rails) |
| Complejidad | CodeClimate, SonarQube, radon (Python) |

---

### CAPA S3 — Red y HTTP (en cada request)

**Qué vigila:** Que cada request HTTP cumpla estándares de seguridad.

```
CHECKS UNIVERSALES (middleware/interceptor):

  S3.1 — RATE LIMITING POR ENDPOINT
    · Endpoints de auth: MUY restrictivo (3-5/min)
    · Endpoints de registro: restrictivo (3/min)
    · Endpoints de generación/IA: moderado (10-30/hora)
    · API general: estándar (100-200/min)
    · Adaptar al perfil de tráfico del proyecto

  S3.2 — SECURITY HEADERS OBLIGATORIOS EN TODA RESPUESTA
    · X-Frame-Options: DENY
    · X-Content-Type-Options: nosniff
    · Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    · Content-Security-Policy: (adaptado al proyecto)
    · Referrer-Policy: strict-origin-when-cross-origin
    · Permissions-Policy: camera=(), microphone=(), geolocation=()
    · X-XSS-Protection: 1; mode=block
    · Cache-Control: no-store (para datos sensibles)

  S3.3 — SANITIZACIÓN DE HEADERS QUE REVELAN TECNOLOGÍA
    · Remover Server:, X-Powered-By:, cualquier header que revele
      versión de framework, lenguaje o servidor

  S3.4 — BLOQUEO DE IPs MALICIOSAS
    · Mantener watchlist de IPs atacantes (actualizar con intel de amenazas)
    · Bloquear rangos conocidos de botnets y data centers abusivos
    · Integrar con servicios de threat intelligence

  S3.5 — DETECCIÓN DE LATENCIA ANÓMALA
    · Request que tarda >10s → posible DoS o query pesada → alertar
    · Picos de latencia sostenidos → posible ataque → escalar
```

**Herramientas:** WAF (Cloudflare, AWS WAF), Nginx rate limiting, Express-rate-limit, FastAPI SlowAPI, middleware custom.

---

### CAPA S4 — Dependencias y CVEs (semanal + en cada push que cambie deps)

**Qué vigila:** Que las dependencias del proyecto no tengan vulnerabilidades conocidas.

```
CHECKS UNIVERSALES (CI + cron semanal):

  S4.1 — ESCANEO DE DEPENDENCIAS POR ECOSISTEMA
    · Python: safety, pip-audit, Snyk
    · Node.js: npm audit, Snyk, socket.dev
    · Go: govulncheck, Nancy
    · Ruby: bundler-audit
    · Java/Kotlin: OWASP Dependency-Check, Snyk
    · Rust: cargo-audit
    · .NET: dotnet list package --vulnerable
    · Universal: Trivy fs, Snyk, Dependabot

  S4.2 — SAST COMPLETO
    · Semgrep con rulesets: p/owasp-top-ten, p/xss, p/sql-injection
    · Bandit (Python), Brakeman (Rails), gosec (Go)
    · CodeQL para análisis semántico profundo (GitHub)

  S4.3 — DETECCIÓN DE SECRETS EN HISTORIAL
    · TruffleHog escanea todo el historial Git
    · No solo el commit actual — secrets antiguos también son riesgo

  S4.4 — VERIFICACIÓN DE SUPPLY CHAIN
    · Verificar integridad de paquetes (checksums, firmas)
    · Detectar typosquatting y paquetes maliciosos
    · Herramientas: Socket.dev, Phylum, npm provenance
```

**Pipeline CI recomendado (universal, adaptar al stack):**

```yaml
# .github/workflows/fortress-dependency-scan.yml
name: FORTRESS Security Scan
on:
  schedule:
    - cron: '0 5 * * 1'  # Lunes 5am UTC
  push:
    paths:
      - '**/requirements*.txt'
      - '**/package*.json'
      - '**/go.sum'
      - '**/Cargo.lock'
      - '**/Gemfile.lock'
      - '**/pom.xml'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trivy Filesystem Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'HIGH,CRITICAL'
          exit-code: '1'

      - name: Semgrep SAST
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/xss
            p/sql-injection
            p/secrets

      - name: Gitleaks Secret Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Checkov IaC Scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: dockerfile,kubernetes,terraform
          soft_fail: true
```

---

### CAPA S5 — Secrets Rotation (proceso continuo)

**Qué vigila:** Que los secrets se roten según política y nunca se expongan.

```
POLÍTICA UNIVERSAL DE ROTACIÓN:

  FRECUENCIA RECOMENDADA POR TIPO:
    · API keys de IA (Anthropic, OpenAI, etc.)    → cada 90 días
    · Claves de base de datos                      → cada 90 días
    · Tokens de OAuth                              → auto-refresh antes de expirar
    · Webhooks secrets (Stripe, etc.)              → cada 180 días
    · JWT signing keys                             → cada 90 días
    · Encryption keys                              → cada 365 días (con re-encrypt)
    · Service account keys (cloud)                 → cada 90 días

  REGLAS:
    · Alertar 14 días antes de la fecha de rotación
    · Alertar DIARIO cuando un secret pasa su fecha sin rotar
    · NUNCA almacenar secrets en código, repos, o logs
    · Usar vault/secret manager: AWS Secrets Manager, HashiCorp Vault,
      GCP Secret Manager, Azure Key Vault, Doppler, 1Password
    · Registrar CADA rotación: quién, cuándo, por qué

  PROCESO DE ROTACIÓN:
    1. Generar nuevo secret
    2. Configurar en el vault/environment
    3. Verificar que el sistema funciona con el nuevo secret
    4. Revocar el secret anterior (no antes de verificar)
    5. Registrar en log de rotación
    6. Actualizar hash de referencia si aplica
```

---

### CAPA S6 — Seguridad de Base de Datos (continua)

**Qué vigila:** Que la base de datos esté blindada a nivel de datos.

```
CHECKS UNIVERSALES:

  S6.1 — ROW LEVEL SECURITY / ACCESO A NIVEL FILA
    · PostgreSQL: RLS policies en TODA tabla con datos de usuario
    · MongoDB: field-level encryption, app-level authorization
    · MySQL: views restrictivas + app-level auth
    · Regla: un usuario NUNCA debe poder leer/escribir datos de otro

  S6.2 — SEPARACIÓN DE ROLES DE ACCESO
    · Rol de servicio (backend) → acceso completo controlado
    · Rol público/anónimo → acceso mínimo, solo lo necesario
    · NUNCA usar el rol de servicio desde el frontend
    · NUNCA exponer claves de servicio al cliente

  S6.3 — AUDITORÍA DE QUERIES
    · Queries lentas (>1s) → optimizar o alertar
    · Queries sin WHERE en tablas grandes → bloquear
    · Queries que retornan datos masivos sin paginación → alertar

  S6.4 — BACKUPS Y RECUPERACIÓN
    · Backup automático diario mínimo
    · Backup verificado (restaurar periódicamente para confirmar integridad)
    · Point-in-time recovery habilitado
    · Backups encriptados en reposo y en tránsito

  S6.5 — ENCRIPTACIÓN
    · En reposo: encriptación a nivel disco/volumen
    · En tránsito: SSL/TLS obligatorio para conexiones
    · A nivel campo: datos ultra-sensibles (PII, financieros) encriptados
      individualmente en la columna
```

---

### CAPA S7 — Failover y Resiliencia (diseño + monitoreo)

**Qué vigila:** Que el sistema sobreviva fallos de cualquier componente.

```
PRINCIPIOS UNIVERSALES:

  S7.1 — NO SINGLE POINT OF FAILURE
    · Cada servicio crítico debe tener fallback o redundancia
    · BD: réplica de lectura o failover automático
    · Hosting: multi-zona o multi-región
    · CDN: fallback a origin directo si CDN cae
    · DNS: múltiples nameservers

  S7.2 — FALLBACKS EN CASCADA PARA SERVICIOS EXTERNOS
    · Si usas IA: proveedor primario → proveedor secundario → modo degradado
    · Si usas búsqueda: proveedor A → proveedor B → cache local
    · Si usas email: proveedor A → proveedor B → cola retry
    · REGLA: los fallbacks degradan con HONESTIDAD
      (nunca fingir que el servicio funciona si está degradado)

  S7.3 — CIRCUIT BREAKER
    · Si un servicio externo falla >3 veces en 1 minuto → abrir circuito
    · No seguir enviando requests a un servicio muerto
    · Reintentar gradualmente (half-open) después de cooldown
    · Herramientas: Resilience4j (Java), pybreaker (Python), cockatiel (JS)

  S7.4 — GRACEFUL DEGRADATION
    · Si el servicio de IA cae → el sistema sigue funcionando sin IA
    · Si la BD de lectura cae → failover a la primaria
    · Si el payment gateway cae → encolar cobros para retry
    · Principio: degradar funcionalidad, NUNCA perder datos
```

---

### CAPA S8 — Chaos Engineering y Pentesting (periódico)

**Qué vigila:** Que el sistema resiste ataques reales y fallos inesperados.

```
PROGRAMA UNIVERSAL:

  S8.1 — PENTESTING PERIÓDICO
    · Interno (con herramientas): trimestral mínimo
    · Externo (profesionales certificados): anual mínimo
    · Herramientas: OWASP ZAP (DAST), Burp Suite, Nuclei
    · Alcance: OWASP Top 10 completo

  S8.2 — CHAOS ENGINEERING
    · Simular fallo de base de datos → ¿el sistema se recupera?
    · Simular fallo de servicio de IA → ¿activa fallback?
    · Simular latencia extrema de red → ¿timeouts correctos?
    · Simular agotamiento de memoria → ¿OOM killer es graceful?
    · Herramientas: Chaos Monkey, Litmus, Gremlin, Toxiproxy

  S8.3 — RED TEAM EXERCISES
    · Simular un atacante real intentando comprometer el sistema
    · Incluir: social engineering, phishing simulado, lateral movement
    · Para nivel gubernamental: ejercicios anuales con equipo dedicado
```

---

### CAPA S9 — Observabilidad Runtime (continua)

**Qué vigila:** Errores, excepciones y anomalías en tiempo real.

```
CHECKS UNIVERSALES:

  S9.1 — EXCEPTION TRACKING
    · Capturar TODA excepción no manejada (backend + frontend)
    · Spike de excepciones (>X en 5 min) → alertar
    · Herramientas: Sentry, Bugsnag, Datadog APM

  S9.2 — STRUCTURED LOGGING
    · Logs estructurados (JSON) con campos estándar:
      timestamp, level, service, trace_id, user_id (hashed), message
    · NUNCA loggear: passwords, tokens, PII, datos financieros
    · Retención: 30 días hot, 1 año cold mínimo

  S9.3 — FRONTEND ERROR REPORTING
    · Global error handler que reporta al backend
    · window.onerror / React ErrorBoundary / Vue errorHandler
    · Incluir: stack trace, URL, user agent, firma de deduplicación

  S9.4 — PATRONES RECURRENTES
    · Mismo error >5 veces en 5 min = bug recurrente → alertar
    · Endpoint con >50 errores 5xx en 5 min → CRITICAL

  S9.5 — HEALTH CHECKS DE INFRAESTRUCTURA
    · Monitorear logs del hosting (Railway, AWS, GCP, Vercel)
    · Alertar en spikes de 5xx
    · Dashboard de estado visible para el equipo
```

---

### CAPA S10 — Performance y APM (cada 5 min)

```
CHECKS UNIVERSALES:

  S10.1 — LATENCIA POR ENDPOINT
    · p95 y p99 por endpoint · umbrales adaptados:
      - Auth: <500ms
      - Lectura de datos: <1s
      - Generación con IA: <30s (pero monitorear)
      - API general: <1s

  S10.2 — SLOW QUERIES
    · Queries >1s → optimizar (índices, refactoring, caching)
    · Herramientas: pg_stat_statements, MongoDB profiler, explain plans

  S10.3 — BUNDLE SIZE (frontend)
    · Bundle inicial <500-800KB recomendado
    · Code splitting para rutas pesadas
    · Monitorear regresiones en cada build

  S10.4 — RECURSOS DEL SERVIDOR
    · CPU >80% sostenido → alertar
    · Memoria >85% → alertar
    · Disco >90% → CRITICAL
    · Herramientas: Prometheus, Grafana, CloudWatch, Datadog
```

---

### CAPA S11 — Salud de Integraciones (cada 15 min)

```
CHECKS UNIVERSALES:

  S11.1 — WEBHOOKS
    · Monitorear webhooks no procesados (payment, auth, etc.)
    · Verificar idempotencia de procesamiento
    · Webhooks fallando >1h → HIGH

  S11.2 — TOKENS OAUTH
    · Monitorear tokens próximos a expirar
    · Auto-refresh preventivo antes de expiración
    · Token expirado sin refresh → alerta inmediata

  S11.3 — SERVICIOS EXTERNOS
    · Health check de cada API/servicio externo
    · Si el proveedor de IA primario no responde → activar fallback
    · Si el proveedor de hosting falla deploy → CRITICAL

  S11.4 — DEPLOYS
    · Verificar último deploy exitoso
    · Deploy fallido → CRITICAL, bloquear tráfico al build roto
```

---

### CAPA S12 — Salud de Agentes IA (cada hora) — SI APLICA

```
CHECKS (solo para proyectos con agentes IA):

  S12.1 — SUCCESS RATE POR AGENTE
    · Cada agente debe mantener >95% de éxito en 24h
    · <80% → HIGH, <50% → CRITICAL (agente degradado)

  S12.2 — ACCURACY / FEEDBACK LOOP
    · Si el proyecto tiene loop de feedback (was_correct, thumbs up/down):
      - >30% de feedback nulo en 30 días → loop roto, arreglar
      - accuracy <70% en 30 días → agente necesita re-tuning

  S12.3 — COST PER AGENT
    · Monitorear tokens/costo por agente
    · Un agente que de repente consume 10x → posible loop infinito

  S12.4 — GUARDRAILS DE IA
    · Verificar que los guardrails (content filtering, token limits,
      output validation) estén activos y funcionando
    · Un guardrail desactivado → CRITICAL
```

---

# PILAR II — GUARDIAN
## Seguridad de Comportamiento Humano
## Misión: Que ningún actor malicioso o comprometido pase desapercibido

---

### CAPA G1 — Zero Trust Identity (en cada request autenticado)

```
PRINCIPIOS UNIVERSALES:

  G1.1 — VERIFICACIÓN EN CADA REQUEST
    · NUNCA confiar en una sesión por el solo hecho de existir
    · Verificar token en cada request (JWT validation, session check)
    · Verificar que el usuario sigue activo y no suspendido/baneado
    · Verificar que el plan/rol sigue vigente

  G1.2 — SEÑALES CONTEXTUALES
    · Registrar en cada request: IP, user agent, país, timestamp
    · Comparar con el perfil normal del usuario
    · IP nueva + user agent nuevo + hora inusual → elevar vigilancia

  G1.3 — SEPARACIÓN DE ROLES
    · Definir roles claros: usuario, admin, operador, super_admin
    · Cada endpoint verifica rol ANTES de ejecutar
    · Principio de mínimo privilegio: cada rol accede solo a lo necesario
    · RBAC (Role-Based) o ABAC (Attribute-Based) según complejidad
```

---

### CAPA G2 — Behavioral Profiling (continuo, pasivo)

```
PRINCIPIOS UNIVERSALES:

  G2.1 — PERFIL DE COMPORTAMIENTO POR USUARIO
    · Construir baseline de: horarios, frecuencia, endpoints usados,
      volumen de datos, patrones de navegación
    · Detectar desviaciones significativas del baseline
    · Desviación fuerte no = ban, desviación fuerte = vigilancia elevada

  G2.2 — DETECCIÓN DE ANOMALÍAS
    · Uso a las 3AM cuando siempre usa de 9-5 → flag
    · 100 requests/min cuando normalmente hace 5/min → flag
    · Acceso a datos de otros usuarios → CRITICAL
    · Descarga masiva de datos → flag + posible exfiltración

  G2.3 — MACHINE LEARNING (nivel avanzado)
    · Para proyectos con suficiente volumen de datos:
      - Isolation Forest para anomaly detection
      - Clustering de comportamiento normal
      - Scoring de riesgo continuo basado en features
```

---

### CAPA G3 — Semantic Firewall (para proyectos con IA)

```
SI EL PROYECTO TIENE INTERACCIÓN CON LLMs:

  G3.1 — DETECCIÓN DE PROMPT INJECTION
    · Analizar input del usuario ANTES de enviarlo al LLM
    · Patrones a detectar:
      - "Ignore previous instructions"
      - "You are now a different assistant"
      - "System: " embedded en user input
      - Encoding tricks (base64, rot13, unicode)
    · Herramientas: Rebuff, LLM Guard, Vigil, custom regex + ML

  G3.2 — DETECCIÓN DE DATA EXTRACTION
    · Intentos de hacer que el LLM revele datos de otros usuarios
    · "Show me all users", "What's the admin password"
    · Intentos de acceder a system prompts

  G3.3 — DETECCIÓN DE JAILBREAKING
    · Intentos de hacer que el LLM ignore restricciones
    · Monitorear outputs del LLM por contenido prohibido
    · Output filtering: si el LLM genera algo peligroso → interceptar

  G3.4 — RATE LIMITING SEMÁNTICO
    · Demasiados intentos de injection en X minutos → bloquear
    · Misma técnica de injection repetida → ban temporal
```

---

### CAPA G4 — Cross-Client Intelligence (multi-tenant)

```
PARA PROYECTOS MULTI-TENANT / MULTI-CLIENTE:

  G4.1 — CORRELACIÓN CROSS-TENANT
    · Si la misma IP ataca a 3+ clientes → ataque coordinado
    · Si el mismo patrón de abuse aparece en múltiples cuentas → bot
    · Alertar y bloquear a nivel de infraestructura, no solo por usuario

  G4.2 — AISLAMIENTO DE DATOS
    · Un tenant NUNCA debe acceder a datos de otro tenant
    · Verificar aislamiento en cada query (RLS, app-level, API-level)
    · Test periódico: intentar acceso cross-tenant → debe fallar

  G4.3 — RATE LIMITING POR TENANT
    · Un tenant abusivo no debe afectar el performance de otros
    · Quotas por tenant para recursos compartidos
```

---

### CAPA G5 — Threat Score Continuo

```
PRINCIPIO UNIVERSAL:

  G5.1 — SCORING ACUMULATIVO
    · Cada usuario tiene un threat_score (0-100)
    · Eventos de riesgo SUMAN puntos:
      - Login fallido: +5
      - Intento de injection: +15
      - Acceso fuera de horario: +3
      - IP de VPN/Tor: +5
      - Descarga masiva: +10
      - Rate limit excedido: +8
    · DECAY: los puntos decaen -10% diario si no hay actividad maliciosa
    · 0-30: normal · 30-60: vigilancia elevada · 60-85: restricciones · 85+: bloqueo

  G5.2 — RESPUESTA PROPORCIONAL
    · 30-60:  logging detallado, alertas internas
    · 60-85:  CAPTCHAs, delays, funcionalidad reducida
    · 85-95:  bloqueo temporal, notificar al usuario
    · 95-100: bloqueo permanente, registro forense, notificar operador
```

---

### CAPA G6 — Respuesta Proporcional

```
PRINCIPIO: la respuesta NUNCA debe ser más dañina que la amenaza.

  NIVEL 1 (threat 30-60) — OBSERVAR
    · Logging detallado de todas las acciones
    · Alertas internas al equipo de seguridad
    · NO se toca la experiencia del usuario

  NIVEL 2 (threat 60-85) — FRICCIONAR
    · Agregar CAPTCHAs en acciones sensibles
    · Rate limiting más agresivo
    · Re-autenticación para operaciones críticas
    · Delays artificiales en respuestas

  NIVEL 3 (threat 85-95) — RESTRINGIR
    · Bloquear acciones de escritura/modificación
    · Modo read-only forzado
    · Notificar al usuario: "actividad inusual detectada"
    · Solicitar verificación de identidad

  NIVEL 4 (threat 95-100) — CONTENER
    · Suspender cuenta temporalmente
    · Revocar todas las sesiones activas
    · Crear registro forense completo
    · Notificar al operador/equipo inmediatamente
    · Preservar evidencia para posible acción legal
```

---

### CAPA G7 — Memoria Permanente de Amenazas

```
  G7.1 — HISTORIAL PERSISTENTE
    · Historial de incidentes NUNCA se borra
    · Un usuario baneado que crea cuenta nueva → detectar por señales:
      IP, device fingerprint, behavioral patterns, email patterns

  G7.2 — IP WATCHLIST
    · IPs con historial de ataques → watchlist permanente
    · Compartir inteligencia entre instancias del proyecto si aplica
```

---

### CAPA G8 — Forensic Evidence

```
  G8.1 — REGISTRO FORENSE
    · Para incidentes CRITICAL: crear registro completo que incluye:
      - Timeline del ataque (todas las acciones del actor)
      - Evidencia hasheada (SHA-256 de contenido malicioso)
      - Metadatos: IP, user agent, endpoint, método HTTP, timestamps
      - Acciones tomadas por el sistema en respuesta
    · NUNCA almacenar contenido malicioso crudo → solo hashes

  G8.2 — EXPORTACIÓN LEGAL
    · Reporte exportable para presentar a autoridades si necesario
    · Formato compatible con procesos legales
    · Incluye: incident_id, timeline, evidence_hashes, audit_trail
    · Certificado por el sistema con timestamp UTC
```

---

# PILAR III — HERMES
## Salud de Conectividad y Dependencias Externas
## Misión: Enterarnos nosotros primero, nunca el cliente/usuario

---

### CAPA H1 — Conectividad (cada 5 min)

```
  · Ping de salud a cada API/servicio externo del que el proyecto depende
  · Medir: latencia, código de respuesta, disponibilidad
  · Si un servicio no responde → alertar en <5 min
  · Mantener inventario vivo de TODAS las dependencias externas
```

### CAPA H2 — Autenticación (cada 30 min)

```
  · ¿Las credenciales de cada servicio externo siguen válidas?
  · ¿Algún token expira pronto? → renovar preventivamente ANTES de que muera
  · OAuth tokens: auto-refresh implementado y verificado
  · API keys: verificar que la key responde con permisos correctos
```

### CAPA H3 — Cuotas y Límites (cada hora)

```
  · ¿Cuánto del límite mensual/diario de cada servicio llevamos?
  · Proyección: "a este ritmo, el servicio X se agota el día Y"
  · Alertar al 70%, 85%, 95% del límite
  · Si se agota → activar fallback automáticamente
```

### CAPA H4 — Cuentas de Usuario Conectadas (cada 6h)

```
  · SI el proyecto maneja cuentas OAuth de usuarios (redes sociales, etc.):
    - Verificar que cada cuenta conectada sigue activa
    - Detectar desconexiones que el usuario hizo sin avisar
    - Token revocado + IP rara → posible compromiso de cuenta → alertar
```

### CAPA H5 — Integridad de Datos (cada 12h)

```
  · ¿Lo que recibimos de cada API tiene sentido?
  · ¿Analytics devuelve ceros sospechosos?
  · ¿Las respuestas tienen el schema esperado?
  · API que "responde OK" pero devuelve basura → detectar y alertar
```

### CAPA H6 — Costo y Eficiencia (diaria)

```
  · ¿Cuánto cuesta cada integración vs. el valor que entrega?
  · ¿Hay un proveedor caro con un fallback más barato disponible?
  · Dashboard de costo por servicio externo
  · Recomendaciones de optimización basadas en uso real
```

---

# PILAR IV — SHIELD
## Análisis de Superficie de Ataque Externa (EASM)
## Misión: Ver nuestro sistema como lo ve un atacante

**Disciplina:** External Attack Surface Management (EASM)
**Frameworks:** OWASP WSTG · NIST CSF · PTES (fases 1-3)
**Regla de oro:** 100% pasivo y no intrusivo. Identificar el bug sin tocar la herida.

---

### Las 10 Capas de Inspección Externa

```
CAPA E1 — TRANSPORTE Y CIFRADO
  · HTTPS forzado · TLS 1.2+ obligatorio · HSTS configurado
  · Certificado: validez, cadena, emisor, expiración
  · Perfect Forward Secrecy · cifrados débiles detectados

CAPA E2 — CABECERAS DE SEGURIDAD HTTP
  · CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
  · Headers que FILTRAN información (Server:, X-Powered-By:)

CAPA E3 — FINGERPRINTING DE TECNOLOGÍA
  · CMS, framework, servidor, CDN, WAF detectables
  · Versiones expuestas → cruzar con CVE conocidas
  · JavaScript/librerías de terceros con versiones vulnerables

CAPA E4 — DESCUBRIMIENTO DE SUPERFICIE
  · Subdominios (certificate transparency, DNS pasivo)
  · Shadow IT: activos olvidados (dev., staging., api., admin.)
  · Activos de terceros asociados al dominio

CAPA E5 — EXPOSICIÓN DE RED
  · Servicios visibles públicamente (vía Shodan/Censys, NO escaneo propio)
  · Bases de datos expuestas, paneles admin sin protección
  · Servicios que NO deberían estar en internet

CAPA E6 — CORRELACIÓN CVE/NVD
  · Versiones detectadas → cruzar con base de datos de vulnerabilidades
  · "Tu framework X versión Y tiene Z CVEs críticos conocidos"
  · SIN explotar → solo correlación versión expuesta ↔ fallo conocido

CAPA E7 — FUGAS DE DATOS Y CREDENCIALES
  · Emails del dominio en brechas conocidas (HaveIBeenPwned)
  · API keys o secrets filtrados en repos públicos
  · Documentación interna accidentalmente pública

CAPA E8 — CONFIGURACIÓN Y ARCHIVOS EXPUESTOS
  · .git/, .env, backups, /admin, directorios listables
  · robots.txt revelador, sitemap con endpoints sensibles
  · Endpoints de API expuestos sin autenticación

CAPA E9 — REPUTACIÓN Y LISTAS NEGRAS
  · ¿El dominio/IP está en listas negras de spam o malware?
  · SPF, DKIM, DMARC configurados (email security)
  · Presencia en feeds de inteligencia de amenazas

CAPA E10 — CADENA DE SUMINISTRO (nivel enterprise)
  · ¿De qué terceros depende el sistema públicamente?
  · Un fallo en ellos nos afecta → mapear superficie completa
  · Compatible con SOC 2, ISO 27001, NIST CSF para auditorías
```

**Herramientas pasivas recomendadas:** SSL Labs, SecurityHeaders.com, Shodan, Censys, crt.sh, BuiltWith, Wappalyzer, HaveIBeenPwned API, VirusTotal, MXToolbox, DNSDumpster.

---

# MÓDULO A — ARSENAL DE HERRAMIENTAS

## Herramientas por Categoría (todas stack-agnostic)

### Revisión de Código con IA (instalar en el repo)

| # | Herramienta | Tipo | Precio | Lo mejor para |
|---|-------------|------|--------|---------------|
| 1 | **Claude Code + Action** | Agente IA oficial Anthropic | API tokens | Revisión profunda, entiende todo el codebase |
| 2 | **Defending Code Harness** | Vulnerability discovery autónomo | API tokens | Deep scan con PoC verificables |
| 3 | **Qodo Merge (PR-Agent)** | AI review open source | Gratis self-hosted | Control total de datos, multi-plataforma |
| 4 | **CodeRabbit** | AI review SaaS | Gratis (OSS) / $12-24/dev | El más instalado, fácil setup |
| 5 | **Greptile** | AI review contexto completo | $30/dev | Indexa todo el codebase con grafos |
| 6 | **Gitar** | AI review + autofix | Gratis | Arregla código automáticamente |

### Análisis Estático de Seguridad (SAST)

| # | Herramienta | Lenguajes | Precio | Lo mejor para |
|---|-------------|-----------|--------|---------------|
| 7 | **Semgrep** | 30+ | CE gratis | Reglas custom, velocidad, pre-commit |
| 8 | **SonarQube** | 40+ | CE gratis | Dashboard, quality gates, deuda técnica |
| 9 | **CodeQL** | 12 | Gratis en GitHub | Análisis semántico profundo |
| 10 | **Snyk Code** | 10+ | Free tier | Developer-first, IDE integrado |
| 11 | **DeepSource** | 16 | Free tier | Autofix AI, bajo false positive |
| 12 | **Bandit** | Python | 100% gratis | Estándar Python SAST |
| 13 | **Brakeman** | Ruby/Rails | 100% gratis | Estándar Rails SAST |

### Multi-Linters (recorren TODO el proyecto)

| # | Herramienta | Cobertura | Precio | Lo mejor para |
|---|-------------|-----------|--------|---------------|
| 14 | **MegaLinter** | 50+ lenguajes, 100+ linters | 100% gratis | Un solo archivo, cubre TODO |
| 15 | **Codacy** | 49 lenguajes | $18/dev | Cloud-first, AI reviewer add-on |
| 16 | **CodeAnt AI** | Multi-plataforma | $10/dev | Más asequible con SAST |

### Seguridad Especializada

| # | Herramienta | Foco | Precio | Lo mejor para |
|---|-------------|------|--------|---------------|
| 17 | **Trivy** | Vuln + containers + IaC + secrets | 100% gratis | All-in-one, zero setup |
| 18 | **Gitleaks** | Secrets en código/git history | 100% gratis | Pre-commit hook, milisegundos |
| 19 | **GitGuardian** | Secrets enterprise | Free tier | 500+ tipos, monitoreo público |
| 20 | **Checkov** | IaC (Terraform, K8s, Docker) | 100% gratis | Seguridad de infraestructura |
| 21 | **OWASP ZAP** | DAST (ataques en runtime) | 100% gratis | Complemento esencial al SAST |
| 22 | **Aikido Security** | All-in-one (SAST+SCA+secrets+IaC) | $15/dev | Reduce tool sprawl |

### Agentes y Frameworks

| # | Herramienta | Tipo | Stars | Lo mejor para |
|---|-------------|------|-------|---------------|
| 23 | **Everything Claude Code** | Harness 135 agentes | 100k+ | Orquestación enterprise |
| 24 | **Anthropic Cybersecurity Skills** | 753+ skills seguridad | 15.7k+ | Skills instalables en Claude Code |
| 25 | **Superpowers** | Framework TDD | 94k+ | Metodología 7 fases |
| 26 | **Understand-Anything** | Knowledge graphs | 64k+ | Comprensión profunda de codebase |
| 27 | **Claude-flow** | Orquestación enterprise | 59k+ | Multi-agente coordinado |

---

# MÓDULO B — PIPELINE CI/CD DE SEGURIDAD

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐    ┌───────────┐
│  Pre-commit │───►│  CI: Lint    │───►│ CI: SAST  │───►│CI: Security│───►│PR Review │───►│ Deep Scan │
│             │    │  Total       │    │           │    │            │    │   IA     │    │ (semanal) │
│ Gitleaks    │    │ MegaLinter   │    │ SonarQube │    │ Trivy      │    │ Claude   │    │ Defending │
│ ESLint      │    │ (100+        │    │ CodeQL    │    │ Checkov    │    │ Code     │    │ Code      │
│ Semgrep     │    │  linters)    │    │ Semgrep   │    │ Snyk       │    │ Action   │    │ Harness   │
│ Prettier    │    │              │    │           │    │            │    │ PR-Agent │    │           │
└─────────────┘    └──────────────┘    └───────────┘    └────────────┘    └──────────┘    └───────────┘
     5 min              10 min            30 min           15 min           15 min          medio día
```

---

# MÓDULO C — SCORING UNIFICADO

```
FORTRESS_SCORE = weighted_average(
    sentinel_score,     // Código e infraestructura (peso: 30%)
    guardian_score,     // Comportamiento humano (peso: 25%)
    hermes_score,       // Dependencias externas (peso: 25%)
    shield_score        // Superficie de ataque (peso: 20%)
)

REGLA DE DEPLOY:
  FORTRESS_SCORE ≥ 95 para aprobar deploy a producción.

  Esto significa que:
  · Una tabla sin RLS (sentinel bajo) → bloquea deploy
  · Un patrón de ataque activo (guardian bajo) → bloquea deploy
  · Una API crítica caída (hermes bajo) → bloquea deploy
  · Un certificado expirado visible (shield bajo) → bloquea deploy

  Los 4 pilares tienen poder de veto. La integridad es indivisible.

SEVERIDADES:
  CRITICAL → score -20 a -30 · respuesta inmediata · bloquea deploy
  HIGH     → score -10 a -15 · respuesta en <4h · puede bloquear deploy
  MEDIUM   → score -3 a -5   · respuesta en <24h · no bloquea
  LOW      → score -1 a -2   · trackear · resolver en sprint
```

---

# MÓDULO D — PLAN DE IMPLEMENTACIÓN

### Fase 1: Fundación (Semana 1)

```
DÍA 1 — Pre-commit hooks (5 min)
  · Instalar Gitleaks como pre-commit hook
  · Instalar linter de tu lenguaje principal (ESLint, Pylint, etc.)
  · Resultado: ningún secret ni error de estilo llega al repo

DÍA 2 — MegaLinter en CI (10 min)
  · npx mega-linter-runner --install en la raíz
  · .mega-linter.yml con APPLY_FIXES: all
  · Resultado: 100+ linters corren en cada PR automáticamente

DÍA 3 — AI Code Review (15 min)
  · Opción A: anthropics/claude-code-action@v1 (con CLAUDE.md)
  · Opción B: Qodo PR-Agent self-hosted (si necesitas control total)
  · Resultado: cada PR recibe revisión IA contextual automática
```

### Fase 2: SAST + Seguridad (Semana 2)

```
DÍA 4 — Semgrep + Trivy en CI (30 min)
  · Semgrep con --config auto (OWASP Top 10, XSS, SQL injection)
  · Trivy con --scanners vuln,secret,misconfig
  · Quality gates: CRITICAL y HIGH bloquean merge

DÍA 5 — Checkov para IaC (15 min)
  · Si tienes Dockerfiles, Terraform, K8s manifests → Checkov
  · Si no → skip esta parte por ahora

DÍA 6-7 — SonarQube + Dashboard (2h)
  · docker run -d sonarqube:community
  · Conectar repo · Configurar quality gates
  · Resultado: dashboard visual con métricas de todo el proyecto
```

### Fase 3: Profundización (Semana 3-4)

```
SEMANA 3 — GUARDIAN
  · Implementar Zero Trust middleware (verificar en cada request)
  · Implementar threat_score con respuesta proporcional
  · Security headers en toda respuesta
  · Rate limiting por endpoint

SEMANA 4 — HERMES + SHIELD
  · Health checks de servicios externos (cada 5 min)
  · Monitoreo de tokens OAuth (cada 30 min)
  · SHIELD: primer scan pasivo de superficie externa
  · Defending Code Harness: primer deep scan
```

### Fase 4: Maduración (Mes 2+)

```
  · Chaos engineering: simular fallos
  · Pentesting: OWASP ZAP contra staging
  · Behavioral profiling: si tienes suficientes datos
  · Semantic firewall: si tienes interacción con LLMs
  · Cross-client intelligence: si eres multi-tenant
  · Forensic evidence: para incidentes CRITICAL
```

---

# MÓDULO E — REGLAS INVIOLABLES

```
F1 — FORTRESS NUNCA SE DESACTIVA.
     Misión vitalicia. Solo se mejora, nunca se apaga.

F2 — LOS 4 PILARES SON INDEPENDIENTES Y COMPLEMENTARIOS.
     Ninguno reemplaza a otro. Juntos cubren las 4 superficies de riesgo.

F3 — LA RESPUESTA ES PROPORCIONAL A LA AMENAZA.
     Nunca causar más daño que el que se previene. Bloquear solo cuando
     la evidencia lo justifica.

F4 — VERDAD BRUTAL, CERO ALARMISMO.
     Los hallazgos se reportan con su nivel de confianza real.
     Un "potencial" no se vende como "confirmado". No vendemos miedo.

F5 — EL SCORE GLOBAL TIENE PODER DE VETO SOBRE DEPLOYS.
     FORTRESS_SCORE < 95 → NO se despliega a producción. Sin excepciones.

F6 — AUDITORÍA TOTAL.
     Todo evento, toda alerta, todo comando del operador → registrado.
     Sin privilegios de invisibilidad. Ni el operador se esconde del log.

F7 — FALLBACKS DEGRADAN CON HONESTIDAD.
     Nunca se finge que un servicio funciona si está degradado.
     El usuario recibe la verdad de lo que funciona y lo que no.

F8 — LOS SECRETS NUNCA TOCAN EL CÓDIGO.
     Variables de entorno, vaults, secret managers. NUNCA en repositorio.
     NUNCA en logs. NUNCA en responses. NUNCA en frontend.

F9 — SHIELD ES PASIVO SIEMPRE.
     El análisis externo NUNCA penetra, explota, ni accede a sistemas
     privados. La frontera con la intrusión es absoluta.

F10 — EL FRAMEWORK ES STACK-AGNOSTIC.
      Cada capa define QUÉ verificar, no CÓMO. El CÓMO se adapta al
      stack. Los principios son universales; la implementación es local.
```

---

# PILAR V — COGNITION
## Capa Cognitiva Profunda · Aprendizaje Permanente · Atención Focalizada
## Misión: Lo que FORTRESS atrapa una vez, NUNCA vuelve a ocurrir

> COGNITION es lo que convierte a FORTRESS de un muro reactivo en un
> organismo que evoluciona. Los 4 pilares anteriores DETECTAN y BLOQUEAN.
> COGNITION APRENDE por qué nació el error, CREA defensas permanentes,
> IMPLEMENTA prevención automática, y VERIFICA que nunca se repita.
>
> Sin COGNITION: el mismo error aparece 100 veces, se bloquea 100 veces.
> Con COGNITION: el error aparece 1 vez, se bloquea, se analiza, se crea
> una regla permanente, y las 99 veces restantes NUNCA llegan a existir.

---

## EL LOOP COGNITIVO CENTRAL

```
FORTRESS sin COGNITION (reactivo puro):

  Error → Detectar → Bloquear → Reportar → FIN
  Error → Detectar → Bloquear → Reportar → FIN   (se repite infinito)
  Error → Detectar → Bloquear → Reportar → FIN


FORTRESS con COGNITION (cognitivo profundo):

  Error → Detectar → Bloquear → Reportar →
    → COGNITION: ¿POR QUÉ nació? (razonar causa raíz)
    → COGNITION: ¿CÓMO evitarlo? (generar prevención)
    → COGNITION: IMPLEMENTAR defensa permanente (regla, test, doc)
    → COGNITION: VERIFICAR que no se repite
    → Error EXTINTO. Nunca más.

  El loop completo:

    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    ▼                                                     │
  DETECTAR ──► RAZONAR ──► APRENDER ──► ACTUAR ──► VERIFICAR
   (qué)      (por qué)   (memorizar)  (prevenir)  (¿se repitió?)
                                                      │
                                                      ├─ NO → EXTINTO
                                                      │       (caso cerrado
                                                      │        para siempre)
                                                      │
                                                      └─ SÍ → volver a
                                                              RAZONAR con
                                                              más contexto
                                                              (la defensa
                                                              no fue
                                                              suficiente)
```

---

## COGNITION CAPA C1 — DETECCIÓN ENRIQUECIDA

Los 4 pilares ya detectan. COGNITION enriquece cada detección con contexto.

```
CUANDO CUALQUIER PILAR DETECTA UN ERROR/VULNERABILIDAD:

  C1.1 — CLASIFICAR EL TIPO DE ERROR
    · ¿Es de código? (syntax, lógica, seguridad, performance)
    · ¿Es de configuración? (env vars, IaC, permisos)
    · ¿Es de dependencia? (CVE, versión obsoleta, supply chain)
    · ¿Es de comportamiento? (ataque, abuso, anomalía)
    · ¿Es de integración? (API caída, token expirado, cuota)
    · ¿Es de superficie? (exposición, misconfiguration externa)

  C1.2 — BUSCAR EN MEMORIA: ¿ESTO YA PASÓ ANTES?
    · Consultar la base de conocimiento de errores pasados
    · Si ya pasó → ¿la defensa anterior funcionó? ¿por qué falló ahora?
    · Si es nuevo → registrar como patrón nuevo para aprender

  C1.3 — CALCULAR RECURRENCIA
    · ¿Cuántas veces ha ocurrido este patrón en 7/30/90 días?
    · Recurrencia alta = la defensa actual NO es suficiente
    · Recurrencia cero = la defensa anterior SÍ funcionó
```

---

## COGNITION CAPA C2 — RAZONAMIENTO DE CAUSA RAÍZ

**COGNITION no se queda en el síntoma. Busca POR QUÉ nació el error.**

```
ANÁLISIS DE CAUSA RAÍZ (5 WHYS AUTOMATIZADO):

  Ejemplo real:

  SÍNTOMA: "API key hardcodeada en archivo X, línea 42"

  WHY 1: ¿Por qué está hardcodeada?
    → El desarrollador la puso directamente en el código.

  WHY 2: ¿Por qué la puso directamente?
    → No sabía cómo acceder al vault/secret manager.

  WHY 3: ¿Por qué no sabía?
    → La documentación de onboarding no lo menciona.

  WHY 4: ¿Por qué la documentación no lo menciona?
    → Nunca se documentó el proceso de secrets.

  WHY 5: CAUSA RAÍZ ENCONTRADA
    → Falta documentación de manejo de secrets + acceso al vault.

  ACCIONES QUE COGNITION GENERA:
    1. Crear regla Semgrep que bloquee el patrón (defensa inmediata)
    2. Documentar proceso de secrets en onboarding (prevención de raíz)
    3. Dar acceso al vault al desarrollador (eliminar la causa)
    4. Actualizar CLAUDE.md / FORTRESS rules (memoria permanente)

  RESULTADO: este error no vuelve a nacer. No porque lo bloqueamos,
  sino porque eliminamos la RAZÓN por la que existía.


MÉTODOS DE RAZONAMIENTO QUE COGNITION USA:

  · 5 WHYS: para errores humanos y de proceso
  · ANÁLISIS DE PATRÓN: para errores que se repiten en distintos archivos
  · CORRELACIÓN TEMPORAL: ¿el error aparece después de deploys? ¿Lunes?
  · CORRELACIÓN DE AUTORÍA: ¿siempre el mismo dev? ¿nuevo en el equipo?
  · ANÁLISIS DE CONTEXTO: ¿el archivo no tiene tests? ¿falta linter rule?
  · RAZONAMIENTO CON LLM: para causas complejas, usar Claude/LLM para
    analizar el código, el diff y la historia del archivo y razonar
    la causa más probable
```

---

## COGNITION CAPA C3 — MEMORIA PERMANENTE

**COGNITION nunca olvida. Cada error y cada solución quedan registrados.**

```
BASE DE CONOCIMIENTO (knowledge_base):

  ESTRUCTURA DE UN REGISTRO DE APRENDIZAJE:
  {
    "pattern_id":       "PTN-2026-0042",
    "first_seen":       "2026-07-14T03:22:00Z",
    "last_seen":        "2026-07-14T03:22:00Z",
    "times_detected":   1,
    "times_after_fix":  0,          // si > 0, el fix no funcionó
    "status":           "EXTINTO",  // ACTIVE | MITIGATED | EXTINTO

    "detection": {
      "pilar":          "SENTINEL",
      "capa":           "S2 — Auditoría de Código",
      "severity":       "CRITICAL",
      "signature":      "hardcoded_api_key_in_source",
      "file_pattern":   "*/services/*.py",
      "description":    "API key hardcodeada en código fuente"
    },

    "root_cause": {
      "method":         "5_WHYS",
      "cause":          "Falta documentación de secrets + acceso a vault",
      "category":       "PROCESS_GAP",
      "confidence":     0.92
    },

    "prevention": {
      "rules_created":  ["semgrep:no-hardcoded-keys-v2"],
      "docs_updated":   ["onboarding/secrets-management.md"],
      "tests_created":  ["test_no_secrets_in_source.py"],
      "claude_md_updated": true,
      "pr_id":          "PR-847"
    },

    "verification": {
      "recurrence_after_fix": 0,
      "days_since_fix":       30,
      "verdict":              "EXTINTO"  // nunca más apareció
    }
  }


ESTADOS DE UN PATRÓN:

  ACTIVE    → el error sigue ocurriendo, aún no hay defensa completa
  MITIGATED → hay defensa, pero se ha repetido al menos 1 vez después
  EXTINTO   → no se ha repetido en 30+ días después del fix → CERRADO

  Un patrón MITIGATED que se repite → COGNITION re-analiza y crea
  una defensa más fuerte. El loop no para hasta EXTINTO.
```

---

## COGNITION CAPA C4 — ATENCIÓN FOCALIZADA (Attention Is All You Need)

**COGNITION no vigila todo por igual. Aprende DÓNDE mirar más fuerte.**

```
SISTEMA DE ATENCIÓN:

  Cada zona del proyecto tiene un PESO DE ATENCIÓN (0.0 a 1.0).
  COGNITION ajusta los pesos según la historia de errores.

  FACTORES QUE AUMENTAN ATENCIÓN:
    · Archivo con 3+ errores en 30 días          → atención +0.3
    · Directorio con vulnerabilidades recurrentes → atención +0.2
    · Código tocado por dev nuevo/junior          → atención +0.1
    · Código que toca datos financieros/PII       → atención +0.2 (fijo)
    · Día después de deploy grande                → atención global +0.1
    · Dependency con CVE reciente                 → atención +0.3
    · Integración que falló esta semana           → atención +0.2

  FACTORES QUE REDUCEN ATENCIÓN:
    · Archivo sin errores en 90 días              → atención -0.1
    · Directorio con 100% tests passing           → atención -0.1
    · Código escrito por dev senior estable        → atención -0.05

  CÓMO SE USA LA ATENCIÓN:
    · SENTINEL prioriza sus scans por peso de atención
      (archivos con atención alta se escanean con más profundidad)
    · GUARDIAN prioriza vigilancia de users con atención alta
    · Claude Code Action revisa con más detalle los archivos
      con atención alta (instrucciones dinámicas en el prompt)
    · Deep scans semanales focalizan en zonas de atención alta

  ANALOGÍA:
    Un guardia humano experimentado no mira todo por igual:
    sabe que la puerta trasera tiene más intentos de robo que la principal,
    entonces la vigila más. COGNITION hace lo mismo pero con datos.


MAPA DE ATENCIÓN (ejemplo visual):

  src/
  ├── auth/           ████████████  0.9  (3 vulns este mes)
  ├── payments/       ██████████    0.8  (datos financieros, siempre alto)
  ├── api/routes/     ████████      0.7  (2 rate-limit bypasses)
  ├── services/       ██████        0.5  (1 error, corregido)
  ├── utils/          ████          0.3  (estable)
  └── components/ui/  ██            0.1  (sin errores en 90 días)
```

---

## COGNITION CAPA C5 — GENERACIÓN DE DEFENSAS PERMANENTES

**Cuando COGNITION entiende un error, CREA defensas para que nunca vuelva a nacer.**

```
TIPOS DE DEFENSA QUE COGNITION GENERA AUTOMÁTICAMENTE:

  TIPO 1 — REGLA DE LINTER / SAST
    · Genera regla Semgrep, ESLint, Pylint, o del linter del stack
    · La regla bloquea el PATRÓN EXACTO que causó el error
    · Se agrega al repo como archivo de configuración
    · A partir de ahora, el pre-commit o CI lo bloquea automáticamente
    · Ejemplo:
      Error: "fetch() con HTTP en vez de HTTPS"
      Regla generada:
        rules:
          - id: no-http-fetch
            pattern: fetch("http://$URL")
            message: "Usar HTTPS. HTTP no es seguro."
            severity: ERROR

  TIPO 2 — TEST DE REGRESIÓN
    · Genera test que verifica que el error específico no existe
    · El test se ejecuta en cada CI run
    · Si el error vuelve a aparecer, el test falla y bloquea merge
    · Ejemplo:
      def test_no_hardcoded_secrets():
          for file in get_all_source_files():
              content = read(file)
              assert not contains_secret_pattern(content), \
                  f"Secret encontrado en {file}"

  TIPO 3 — ACTUALIZACIÓN DE CLAUDE.MD / REGLAS DEL PROYECTO
    · Agrega la nueva regla al archivo de estándares del proyecto
    · El AI reviewer (Claude Code Action, PR-Agent, etc.)
      ahora CONOCE esta regla y la aplica en futuras revisiones
    · Ejemplo agregado a CLAUDE.md:
      "## Regla: Toda URL en fetch/axios/requests debe usar HTTPS.
       Origen: PTN-2026-0042. Causa raíz: dev copió ejemplo con HTTP."

  TIPO 4 — ACTUALIZACIÓN DE DOCUMENTACIÓN
    · Si la causa raíz fue falta de documentación → generar la doc
    · Si fue falta de onboarding → actualizar guía de onboarding
    · Si fue falta de proceso → proponer proceso nuevo

  TIPO 5 — PULL REQUEST PREVENTIVO
    · COGNITION genera un PR con TODAS las defensas anteriores:
      - Regla de linter nueva
      - Test de regresión nuevo
      - Actualización de CLAUDE.md
      - Actualización de docs si aplica
    · El PR incluye en su descripción:
      - Qué error se detectó
      - Cuál fue la causa raíz
      - Qué defensas se crearon
      - Por qué esto garantiza que no se repite
    · El operador/equipo revisa y aprueba el PR
    · Una vez mergeado → la defensa es parte del proyecto para siempre


FLUJO COMPLETO DE GENERACIÓN:

  Error detectado
    │
    ▼
  COGNITION analiza causa raíz
    │
    ▼
  COGNITION genera:
    ├── Regla de linter (bloqueo automático)
    ├── Test de regresión (verificación en CI)
    ├── Actualización CLAUDE.md (IA lo conoce)
    ├── Documentación (humanos lo conocen)
    └── PR con todo lo anterior
    │
    ▼
  PR aprobado y mergeado
    │
    ▼
  Defensa permanente ACTIVA
    │
    ▼
  COGNITION monitorea 30 días
    │
    ├── ¿Se repitió? → NO → marcar EXTINTO ✓
    └── ¿Se repitió? → SÍ → re-analizar, defensa más fuerte
```

---

## COGNITION CAPA C6 — VERIFICACIÓN Y EXTINCIÓN

**COGNITION no da por cerrado un caso hasta que VERIFICA que el error murió.**

```
PROCESO DE VERIFICACIÓN:

  DESPUÉS DE IMPLEMENTAR UNA DEFENSA:

  Día 1-7:   MONITOREO INTENSIVO
    · COGNITION busca activamente el mismo patrón en todo el proyecto
    · Cada commit se escanea con atención extra en ese patrón
    · Si aparece → la defensa NO fue suficiente → re-analizar

  Día 7-14:  MONITOREO ACTIVO
    · Se reduce la intensidad pero sigue buscando
    · Se verifica que los tests de regresión pasan

  Día 14-30: MONITOREO PASIVO
    · Los scans normales de SENTINEL son suficientes
    · La regla de linter ya está activa, si el patrón aparece lo bloquea

  Día 30+:   VERIFICACIÓN FINAL
    · Si el patrón NO se repitió en 30 días → marcar EXTINTO
    · Cerrar el registro de aprendizaje con verdict: "EXTINTO"
    · Reducir atención en esa zona (ya está protegida)

  NUNCA:
    · COGNITION NUNCA borra un registro de aprendizaje
    · COGNITION NUNCA desactiva una regla que creó (solo la mejora)
    · COGNITION NUNCA cierra un caso que se repitió (re-analiza)


MÉTRICAS DE ÉXITO DE COGNITION:

  · TASA DE EXTINCIÓN: % de patrones que llegan a EXTINTO
    Target: >90% en 30 días

  · TASA DE RECURRENCIA POST-FIX: % de patrones que vuelven
    después de implementar defensa
    Target: <5%

  · TIEMPO A EXTINCIÓN: días promedio desde detección a EXTINTO
    Target: <14 días

  · REGLAS GENERADAS: número de reglas permanentes creadas
    Más reglas = sistema más inteligente con el tiempo

  · COBERTURA DE ATENCIÓN: % del codebase con peso de atención asignado
    Target: 100% (todo tiene un peso, aunque sea bajo)
```

---

## COGNITION CAPA C7 — EVOLUCIÓN CONTINUA DEL FRAMEWORK

**COGNITION no solo aprende sobre errores individuales. Evoluciona el framework entero.**

```
META-APRENDIZAJE:

  C7.1 — ANÁLISIS DE TENDENCIAS
    · ¿Los errores de seguridad aumentan o disminuyen con el tiempo?
    · ¿Qué TIPO de error es el más frecuente este mes vs. el pasado?
    · ¿Qué pilar está atrapando más cosas? (¿SENTINEL? ¿GUARDIAN?)
    · Si un pilar atrapa poco → ¿es porque no hay errores, o porque
      no los está detectando? COGNITION investiga.

  C7.2 — RECOMENDACIONES DE EVOLUCIÓN
    · "Este mes, el 60% de los errores fueron secrets hardcodeados.
       Recomendación: implementar vault obligatorio + pre-commit hook."
    · "GUARDIAN no ha detectado anomalías en 30 días. Verificar que
       el behavioral profiling sigue activo y calibrado."
    · "HERMES activó fallback 14 veces este mes para Servicio X.
       Recomendación: evaluar cambio de proveedor."

  C7.3 — AUTO-CALIBRACIÓN DE UMBRALES
    · Si el rate limiting bloquea a muchos usuarios legítimos →
      COGNITION recomienda relajar el umbral
    · Si el threat_score nunca pasa de 30 → COGNITION recomienda
      bajar los thresholds de alerta para ser más sensible
    · Si los quality gates bloquean demasiados deploys por MEDIUM →
      COGNITION recomienda ajustar a solo HIGH+CRITICAL

  C7.4 — BRIEFING COGNITIVO SEMANAL
    · COGNITION genera un reporte semanal que incluye:
      - Errores detectados esta semana
      - Patrones nuevos registrados
      - Defensas creadas
      - Patrones que pasaron a EXTINTO
      - Mapa de atención actualizado
      - Recomendaciones de evolución
      - FORTRESS_SCORE con tendencia (mejorando/empeorando)
```

---

# MÓDULO F — BC_COGNITION: ARQUITECTURA DDD DEL AGENTE COGNITIVO

**Estructura de Bounded Context para proyectos que usan DDD/Clean Architecture.**
**Adaptar nomenclatura al estilo arquitectónico del proyecto.**

```
BC_COGNITION/
│
├── domain/
│   │
│   ├── entities/
│   │   ├── error_pattern.py          # Un patrón de error conocido
│   │   │   · pattern_id (único)
│   │   │   · signature (hash del patrón)
│   │   │   · detection_source (pilar + capa)
│   │   │   · times_detected
│   │   │   · status (ACTIVE | MITIGATED | EXTINTO)
│   │   │
│   │   ├── learned_rule.py           # Una regla que COGNITION creó
│   │   │   · rule_id
│   │   │   · rule_type (LINTER | TEST | DOC | CLAUDE_MD)
│   │   │   · generated_from (pattern_id)
│   │   │   · content (la regla en sí)
│   │   │   · effectiveness (% de bloqueo exitoso)
│   │   │
│   │   ├── attention_focus.py        # Un punto de atención
│   │   │   · target (file_path | directory | user | integration)
│   │   │   · weight (0.0 a 1.0)
│   │   │   · reason (por qué se asignó este peso)
│   │   │   · last_updated
│   │   │
│   │   └── root_cause_analysis.py    # Análisis de causa raíz
│   │       · analysis_id
│   │       · pattern_id (referencia)
│   │       · method (FIVE_WHYS | PATTERN | CORRELATION | LLM)
│   │       · cause (texto de la causa raíz)
│   │       · confidence (0.0 a 1.0)
│   │       · actions_recommended (lista)
│   │
│   ├── value_objects/
│   │   ├── severity.py               # CRITICAL | HIGH | MEDIUM | LOW
│   │   ├── confidence_score.py       # 0.0 a 1.0 (qué tan seguro)
│   │   ├── recurrence_rate.py        # veces/período
│   │   ├── extinction_status.py      # ACTIVE → MITIGATED → EXTINTO
│   │   └── attention_weight.py       # 0.0 a 1.0
│   │
│   └── services/
│       ├── pattern_recognizer.py     # Reconoce patrones en errores
│       │   · Compara nuevo error con knowledge_base
│       │   · Determina si es patrón nuevo o recurrencia
│       │   · Calcula signature para deduplicación
│       │
│       ├── cause_analyzer.py         # Analiza causa raíz
│       │   · Implementa 5 Whys automatizado
│       │   · Correlación temporal y de autoría
│       │   · Puede invocar LLM para análisis complejo
│       │   · Retorna causa raíz con nivel de confianza
│       │
│       ├── defense_generator.py      # Genera defensas permanentes
│       │   · Genera reglas Semgrep/ESLint/linter del stack
│       │   · Genera tests de regresión
│       │   · Genera actualizaciones de CLAUDE.md
│       │   · Genera actualizaciones de docs
│       │   · Empaqueta todo en un PR
│       │
│       ├── attention_allocator.py    # Gestiona el mapa de atención
│       │   · Recalcula pesos después de cada incidente
│       │   · Aplica decay (atención se reduce con el tiempo sin errores)
│       │   · Genera mapa de atención visual para el briefing
│       │
│       └── extinction_verifier.py    # Verifica que el error murió
│           · Monitorea recurrencia post-fix (7/14/30 días)
│           · Cambia status: ACTIVE → MITIGATED → EXTINTO
│           · Si se repite: dispara re-análisis
│
├── application/
│   │
│   ├── learn_from_error.py           # USE CASE: error → aprendizaje completo
│   │   · Input: detección de cualquier pilar
│   │   · Orquesta: classify → search_memory → analyze_cause → learn
│   │   · Output: registro en knowledge_base
│   │
│   ├── generate_prevention.py        # USE CASE: crear defensa permanente
│   │   · Input: root_cause_analysis
│   │   · Orquesta: generate_rule → generate_test → update_docs → create_PR
│   │   · Output: PR listo para review
│   │
│   ├── reallocate_attention.py       # USE CASE: recalcular mapa de atención
│   │   · Input: nuevo incidente o paso de tiempo
│   │   · Orquesta: recalculate_weights → update_scan_priorities
│   │   · Output: mapa de atención actualizado
│   │
│   ├── verify_extinction.py          # USE CASE: verificar que el error murió
│   │   · Input: pattern_id + días transcurridos
│   │   · Orquesta: check_recurrence → update_status
│   │   · Output: EXTINTO o re-análisis
│   │
│   └── generate_weekly_briefing.py   # USE CASE: briefing cognitivo semanal
│       · Input: todos los datos de la semana
│       · Output: reporte con tendencias, extinctiones, recomendaciones
│
├── infrastructure/
│   │
│   ├── knowledge_store.py            # Persistencia de la knowledge_base
│   │   · Almacena: patrones, análisis, reglas, atención
│   │   · Puede ser: tabla en BD, archivo JSON, vector store
│   │   · NUNCA se borra. Solo se marca como EXTINTO.
│   │
│   ├── semgrep_rule_writer.py        # Escribe reglas Semgrep reales
│   │   · Genera archivo .yml con la regla
│   │   · Lo agrega al directorio de reglas del proyecto
│   │
│   ├── eslint_rule_writer.py         # Escribe reglas ESLint (si JS/TS)
│   ├── pylint_rule_writer.py         # Escribe reglas Pylint (si Python)
│   ├── generic_linter_writer.py      # Adaptador genérico para otros linters
│   │
│   ├── test_generator.py            # Genera tests de regresión
│   │   · Crea test en el framework del proyecto (pytest, jest, etc.)
│   │   · El test verifica que el patrón no existe
│   │
│   ├── claude_md_updater.py          # Actualiza CLAUDE.md con nuevas reglas
│   │   · Agrega la regla aprendida al final de CLAUDE.md
│   │   · El AI reviewer ahora la conoce para siempre
│   │
│   ├── docs_updater.py               # Actualiza documentación del proyecto
│   │   · Si la causa raíz fue falta de docs → genera la doc
│   │
│   ├── pr_creator.py                 # Crea PRs con todas las defensas
│   │   · Empaqueta: regla + test + docs + CLAUDE.md update
│   │   · Crea PR con descripción completa del aprendizaje
│   │   · Asigna al operador/equipo para review
│   │
│   └── llm_reasoning_adapter.py      # Adaptador para usar LLM en análisis
│       · Envía código + contexto al LLM para análisis de causa raíz
│       · Parsea respuesta en formato estructurado
│       · Modelo configurable (Claude, etc.)
│
└── workers/
    │
    ├── cognition_learning_worker.py   # Worker que procesa cada error nuevo
    │   · Se dispara con cada detección de los 4 pilares
    │   · Ejecuta el loop: detectar → razonar → aprender → actuar
    │   · Cron: en cada evento (event-driven)
    │
    ├── cognition_verification_worker.py # Worker de verificación
    │   · Revisa patrones en estado MITIGATED
    │   · Verifica recurrencia a los 7, 14, 30 días
    │   · Marca EXTINTO o dispara re-análisis
    │   · Cron: diario
    │
    ├── cognition_attention_worker.py  # Worker de recálculo de atención
    │   · Recalcula pesos de atención del mapa completo
    │   · Aplica decay a zonas sin errores
    │   · Aumenta zonas con errores recientes
    │   · Cron: cada 6 horas
    │
    └── cognition_briefing_worker.py   # Worker de briefing semanal
        · Genera el reporte cognitivo semanal
        · Incluye: tendencias, extinctiones, mapa, recomendaciones
        · Envía al operador/equipo
        · Cron: lunes 8am
```

---

## REGLAS INVIOLABLES DE COGNITION

```
C1 — COGNITION NUNCA BORRA CONOCIMIENTO.
     Un patrón aprendido es permanente. Se marca EXTINTO, nunca se borra.
     La memoria del sistema solo crece.

C2 — COGNITION NUNCA DESACTIVA UNA DEFENSA QUE CREÓ.
     Las reglas, tests y docs que genera son permanentes.
     Solo se pueden MEJORAR, nunca eliminar.

C3 — COGNITION NUNCA CIERRA UN CASO QUE SE REPITE.
     Si un patrón marcado MITIGATED vuelve a aparecer, se re-abre
     y se re-analiza con más contexto. El loop no para hasta EXTINTO.

C4 — COGNITION GENERA, NUNCA EJECUTA SOLO.
     Las defensas que genera (PRs, reglas, tests) requieren aprobación
     humana antes de mergearse. COGNITION propone, el humano dispone.

C5 — COGNITION RESPETA LA ARQUITECTURA DEL PROYECTO.
     Las reglas que genera siguen el estilo del proyecto.
     Los tests usan el framework del proyecto.
     Los docs siguen el formato del proyecto.
     COGNITION se adapta al proyecto, no al revés.

C6 — COGNITION ES TRANSPARENTE.
     Cada decisión que toma (por qué esta causa raíz, por qué esta regla,
     por qué este peso de atención) está documentada y explicada.
     El operador siempre puede auditar el razonamiento.

C7 — COGNITION MEJORA EL FORTRESS_SCORE CON EL TIEMPO.
     Cada patrón EXTINTO es un error que nunca volverá a bajar el score.
     Con el tiempo, FORTRESS se vuelve más fuerte porque COGNITION
     eliminó las causas raíz de los problemas recurrentes.
     El sistema no solo resiste — EVOLUCIONA.
```

---

# MÓDULO G — KNOWLEDGE GRAPH Y OPTIMIZACIÓN DE TOKENS

```
EL PROBLEMA:
  Sin optimización, cada sesión de Claude Code consume 200K-500K tokens.
  El agente re-lee archivos que ya leyó, acumula contexto infinito,
  y re-deriva conocimiento que ya descubrió en sesiones anteriores.

LA SOLUCIÓN: KNOWLEDGE GRAPH
  Un grafo de conocimiento (SQLite) que mapea toda la estructura del
  proyecto: funciones, clases, imports, endpoints, queries, relaciones.
  El agente consulta el graph (150 tokens) en vez de leer archivos (50K tokens).

HERRAMIENTAS:
  · codebase-memory-mcp: reducción reportada del 99.2%
    github.com/DeusData/codebase-memory-mcp
  · CodeGraph: 60% menos costo, 69% menos tokens
    github.com/colbymchenry/codegraph
  · token-optimizer-mcp: 95%+ reducción con graph + cache + compresión
    github.com/ooples/token-optimizer-mcp

CAPAS DE OPTIMIZACIÓN:
  1. Knowledge Graph (graph-first, read-second)      → 90-99% reducción
  2. Context Sandbox (outputs grandes → resumen)      → 90-98% reducción
  3. /compact entre tareas (comprimir historial)      → 80-90% reducción
  4. Prompt Caching nativo de Anthropic (gratis)      → hasta 90% en repetidos
  5. CLAUDE.md mínimo (<2,000 tokens ideal)           → baseline constante bajo

MÉTRICAS TARGET:
  · Tokens por sesión: <50K (vs 200K-500K sin graph)
  · Cache hit rate: >80%
  · Re-reads de archivos: 0
  · Costo por análisis: <$0.50 (vs $3-5 sin graph)
  · Sesiones por día: 8-12 (vs 2-3 sin graph)

DETALLE COMPLETO: ver COGNITION_DEEP.md, Pilar ⑨
```

---

# MÓDULO H — ORQUESTACIÓN MULTI-REPO

```
PARA PROYECTOS QUE MANEJAN MÚLTIPLES REPOSITORIOS:

ARQUITECTURA:
  ┌─────────────────────────┐
  │  FORTRESS ORCHESTRATOR  │
  │  (coordinador central)  │
  └─────┬───────┬───────┬───┘
        │       │       │
  ┌─────▼──┐ ┌──▼────┐ ┌▼──────┐
  │ REPO A │ │ REPO B│ │ REPO C│
  │ Claude │ │ Claude│ │ Claude│
  │ Code   │ │ Code  │ │ Code  │
  │ git@A  │ │ git@B │ │ git@C │
  └────────┘ └───────┘ └───────┘

PRINCIPIOS:
  · Cada repo tiene su propio .git, remote e identity
  · NUNCA se cruzan commits, branches ni remotes
  · Cada repo tiene su propio CLAUDE.md y Knowledge Graph
  · COGNITION-LOG.md puede ser compartido o independiente por repo
  · El orquestador coordina scans paralelos y orden de push

HERRAMIENTA: fortress-orchestrator.sh
  · add <ruta>     → agregar un repo
  · status         → ver estado de todos
  · scan [tipo]    → escanear todos en paralelo
  · push           → push coordinado (bloquea repos con CRITICALs)
  · report         → reporte unificado

REGLA DE PUSH COORDINADO:
  1. ¿Algún repo tiene CRITICAL? → bloqueado, no pushear
  2. ¿Algún repo depende de otro? → push la dependencia primero
  3. Si todos limpios → push en orden de FORTRESS score (más alto primero)

IMPLEMENTACIÓN: Claude Code en modo headless (claude --headless)
  permite lanzar N instancias en paralelo desde un script bash.
```

---

# MÓDULO I — DREAMING / ROUTINES / OUTCOMES

```
FEATURES OFICIALES DE ANTHROPIC PARA AUTOMATIZACIÓN COGNITIVA:

DREAMING (memoria evolutiva entre sesiones):
  · Proceso programado que revisa hasta 100 sesiones pasadas
  · Consolida conocimiento: elimina duplicados, resuelve contradicciones
  · Actualiza CLAUDE.md y COGNITION-LOG.md automáticamente
  · Harvey (startup legal) reportó 6x mejora en completación de tareas
  · Ejecutar: cron nocturno (2 AM) o manualmente

OUTCOMES (auto-evaluación de calidad):
  · Loop donde un agente evaluador califica el trabajo contra una rúbrica
  · 5 criterios: seguridad (30%), tests (25%), código limpio (20%),
    cognition (15%), documentación (10%)
  · Score FORTRESS_QUALITY de 0-100
  · Ejecutar: semanal (lunes 6 AM)

ROUTINES (tareas programadas):
  · Security scan diario (5 AM)
  · Cleanup semanal (lunes 4 AM)
  · Dependency check semanal (lunes 5 AM)
  · Graph reindex diario (3 AM)
  · Dreaming nocturno (2 AM)
  · Outcomes semanal (lunes 6 AM)

CONFIGURACIÓN DETALLADA: ver DREAMING-CONFIG.md
FALLBACK SI NO HAY ROUTINES: usar cron + claude --headless
```

---

# SCORECARD DE MADUREZ

```
PILAR                                           PESO    CAPAS
────────────────────────────────────────────────────────────────
SENTINEL  — Infraestructura y Código              25%    12
GUARDIAN  — Comportamiento Humano                  20%    8
HERMES    — Dependencias Externas                  20%    6
SHIELD    — Superficie de Ataque Externa           15%    10
COGNITION — Capa Cognitiva Profunda                20%    7+9*
────────────────────────────────────────────────────────────────
TOTAL                                            100%    43+ capas

* COGNITION tiene 7 capas base (en este documento) +
  9 pilares científicos profundos (en COGNITION_DEEP.md) +
  Knowledge Graph como sistema circulatorio

MÓDULOS OPERATIVOS:
  A — Arsenal de Herramientas (27+ herramientas)
  B — Pipeline CI/CD
  C — Scoring Unificado
  D — Plan de Implementación
  E — Reglas Inviolables
  F — BC_COGNITION (arquitectura DDD)
  G — Knowledge Graph y Tokens
  H — Orquestación Multi-Repo
  I — Dreaming / Routines / Outcomes

DOCUMENTOS COMPLEMENTARIOS:
  CLAUDE.md            → constitución del agente (v2.0)
  COGNITION_DEEP.md    → 9 pilares científicos del motor cognitivo
  COGNITION-LOG.md     → cerebro compartido del proyecto
  ARCHITECTURE.md      → blueprint de arquitectura
  AGENTS-SELECTED.md   → 10 agentes especializados
  DREAMING-CONFIG.md   → configuración de automatización cognitiva
  DEPLOYMENT-PLAYBOOK  → guía de implementación paso a paso
  fortress-orchestrator.sh → orquestador multi-repo
  fortress-shield-cli.sh   → scanner EASM desde terminal
  AUDIT-CHECKLIST.md   → checklist pre-producción 43 capas

NOTA SOBRE COGNITION EN EL SCORING:
  COGNITION no baja el score por errores (eso lo hacen los otros 4).
  COGNITION SUBE el score con el tiempo al extinguir patrones.
  Un FORTRESS con COGNITION activo tiene un score que MEJORA solo.
  Un FORTRESS sin COGNITION tiene un score que depende de vigilancia constante.

NIVEL DE MADUREZ:
  Nivel 0 (0-20%)   — Sin protección formal
  Nivel 1 (20-40%)  — Protección básica (pre-commits, linting)
  Nivel 2 (40-60%)  — Protección intermedia (SAST, CI security)
  Nivel 3 (60-80%)  — Enterprise (behavioral, monitoring, EASM)
  Nivel 4 (80-95%)  — Gubernamental (chaos, forensics, threat intel)
  Nivel 5 (95-100%) — Cognitivo (auto-aprendizaje, extinción de patrones,
                       evolución autónoma del framework, compliance total)

TARGET: Nivel 4 mínimo para producción enterprise.
        Nivel 5 para infraestructura crítica / financiera / gubernamental.
        Nivel 5 es INALCANZABLE sin COGNITION activo — el sistema
        necesita aprender y evolucionar para llegar al máximo.
```

---

```
FORTRESS — Framework Universal de Seguridad, Calidad y Resiliencia
Versión 2.0 · Agosto 2026

Fuentes integradas:
  · SENTINEL_GUARDIAN_ENTERPRISE_COMPLETE.md (v2.1)
  · HERMES_END_TO_END_COMPLETE.md (v1.0)
  · OMEGA_SENTINEL_SHIELD.md (v1.0)
  · COGNITION_DEEP.md (v1.1 — 9 pilares científicos)
  · Investigación de 27+ herramientas de código abierto y enterprise
  · OWASP, NIST, ISO, CIS, MITRE frameworks

Documentos complementarios:
  · CLAUDE.md v2.0 (constitución del agente)
  · COGNITION-LOG.md (cerebro compartido)
  · ARCHITECTURE.md (blueprint de proyecto)
  · AGENTS-SELECTED.md (10 agentes especializados)
  · DREAMING-CONFIG.md (automatización cognitiva)
  · DEPLOYMENT-PLAYBOOK.md (guía de implementación)
  · fortress-orchestrator.sh (multi-repo)
  · fortress-shield-cli.sh (scanner EASM terminal)
  · AUDIT-CHECKLIST.md (checklist pre-producción)

Aplicable a: cualquier proyecto, cualquier stack, cualquier industria.
Nivel: enterprise / gubernamental / infraestructura crítica.
No degrada. Solo escala.

Clasificación: MÁXIMA SEGURIDAD · INTERNO ABSOLUTO
NO COMMITEAR · NO PUSHEAR · NO SUBIR · NO COMPARTIR
SOLO VIVE EN LA RAÍZ LOCAL DEL OPERADOR
Incluir en .gitignore: FORTRESS*.md
```
