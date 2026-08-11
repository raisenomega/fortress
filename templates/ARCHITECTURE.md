<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# ARCHITECTURE.md — Blueprint del Proyecto
## Mapa estructural para agentes de código y desarrolladores
### Proyecto: [NOMBRE DEL PROYECTO]
### Stack: [TECNOLOGÍAS PRINCIPALES]
### Última actualización: [FECHA]

```
Este archivo es el MAPA del proyecto.
Claude Code lo lee al entrar para entender la arquitectura
SIN tener que abrir y leer cada archivo del codebase.

Mantenerlo actualizado reduce drásticamente el consumo de tokens
y mejora la precisión de cada intervención del agente.

REGLA: actualizar este archivo cada vez que cambie la arquitectura
(nueva tabla, nuevo servicio, nuevo endpoint, nueva integración).
```

---

## 1. VISIÓN GENERAL

```
Nombre:           [nombre del proyecto]
Descripción:      [qué hace el proyecto en 1-2 frases]
Tipo:             [SaaS / API / E-commerce / Landing / Mobile / CLI / otro]
Estado:           [desarrollo / staging / producción / mantenimiento]
Usuarios:         [tipo de usuarios: B2B, B2C, internal, multi-tenant]
Dominio:          [dominio de producción si existe]
Repositorio:      [URL del repo]
```

---

## 2. STACK TECNOLÓGICO

### Frontend
```
Framework:        [React / Vue / Angular / Next.js / Nuxt / Svelte / otro]
Lenguaje:         [TypeScript / JavaScript]
Bundler:          [Vite / Webpack / Turbopack / otro]
Estilos:          [Tailwind / CSS Modules / Styled Components / otro]
State:            [Zustand / Redux / Pinia / Context / otro]
Testing:          [Jest / Vitest / Playwright / Cypress / otro]
Deploy:           [Vercel / Netlify / Cloudflare Pages / otro]
```

### Backend
```
Framework:        [FastAPI / Express / Django / Rails / Spring / otro]
Lenguaje:         [Python / Node.js / Go / Rust / Java / otro]
API Style:        [REST / GraphQL / tRPC / gRPC]
Auth:             [JWT / Session / OAuth / Supabase Auth / otro]
Validación:       [Zod / Pydantic / Joi / class-validator / otro]
Testing:          [pytest / Jest / Go test / otro]
Deploy:           [Railway / AWS / GCP / Docker / otro]
```

### Base de Datos
```
Principal:        [PostgreSQL / MySQL / MongoDB / otro]
Provider:         [Supabase / PlanetScale / Neon / RDS / self-hosted]
ORM:              [Prisma / Drizzle / SQLAlchemy / Django ORM / TypeORM / otro]
Migraciones:      [herramienta de migraciones usada]
RLS:              [sí/no — si sí, describir estrategia]
Caché:            [Redis / Memcached / ninguno]
```

### Servicios Externos
```
IA:               [Anthropic / OpenAI / otro] → propósito: [para qué se usa]
Pagos:            [Stripe / MercadoPago / otro]
Email:            [SendGrid / Resend / SES / otro]
Storage:          [S3 / Supabase Storage / Cloudflare R2 / otro]
Analytics:        [Google Analytics / PostHog / Mixpanel / otro]
Monitoreo:        [Sentry / Datadog / New Relic / otro]
CDN:              [Cloudflare / CloudFront / otro]
DNS:              [Cloudflare / Route53 / otro]
CI/CD:            [GitHub Actions / GitLab CI / otro]
```

---

## 3. ESTRUCTURA DE CARPETAS

```
[NOMBRE-PROYECTO]/
├── src/                          # Código fuente principal
│   ├── app/ o pages/             # Rutas/páginas (frontend)
│   ├── components/               # Componentes UI reutilizables
│   ├── lib/ o utils/             # Utilidades y helpers
│   ├── services/                 # Lógica de negocio
│   ├── api/                      # Endpoints del backend
│   ├── db/ o database/           # Modelos, queries, migraciones
│   ├── auth/                     # Autenticación y autorización
│   ├── config/                   # Configuración del proyecto
│   ├── types/ o interfaces/      # Definiciones de tipos
│   └── hooks/ o composables/     # Hooks reutilizables (frontend)
│
├── tests/ o __tests__/           # Tests
│   ├── unit/                     # Tests unitarios
│   ├── integration/              # Tests de integración
│   └── e2e/                      # Tests end-to-end
│
├── public/ o static/             # Archivos estáticos
├── migrations/ o prisma/         # Migraciones de BD
├── scripts/                      # Scripts de utilidad
├── docs/                         # Documentación del proyecto
│
├── .claude/                      # Configuración de Claude Code
│   ├── agents/                   # Agentes especializados
│   ├── skills/                   # Conocimientos del agente
│   └── commands/                 # Comandos slash custom
│
├── CLAUDE.md                     # Constitución del agente
├── ARCHITECTURE.md               # Este archivo
├── COGNITION-LOG.md              # Cerebro compartido (no commitear)
├── FORTRESS.md                   # Framework de seguridad (no commitear)
├── COGNITION_DEEP.md             # Motor cognitivo (no commitear)
│
├── .env                          # Variables de entorno (no commitear)
├── .env.example                  # Plantilla de variables (sí commitear)
├── .gitignore                    # Exclusiones de git
├── package.json / pyproject.toml # Dependencias
└── README.md                     # Documentación pública

NOTA: adaptar este árbol al proyecto real.
Borrar las carpetas que no apliquen, agregar las que falten.
```

---

## 4. FLUJO DE DATOS

```
Describir cómo fluyen los datos a través del sistema.
Adaptar al proyecto real.

EJEMPLO GENÉRICO:

  Usuario
    │
    ▼
  Frontend (Next.js / React / Vue)
    │ fetch / axios / tRPC
    ▼
  API Gateway / Routes
    │ middleware: auth + rate limit + validation
    ▼
  Services (lógica de negocio)
    │
    ├──► Base de Datos (PostgreSQL + RLS)
    ├──► Servicio de IA (Anthropic API)
    ├──► Payment Gateway (Stripe)
    ├──► Email Service (Resend / SendGrid)
    └──► Storage (S3 / Supabase Storage)
    │
    ▼
  Response → Frontend → Usuario
```

---

## 5. AUTENTICACIÓN Y AUTORIZACIÓN

```
Método:           [JWT / Session / OAuth 2.0 / Supabase Auth / otro]
Proveedor:        [self-hosted / Auth0 / Supabase / Clerk / otro]
Token lifetime:   [access: Xmin, refresh: Xdías]
MFA:              [sí/no — en qué acciones]
Roles definidos:  [listar roles: user, admin, super_admin, etc.]

FLUJO DE AUTH:
  1. Login → [endpoint] → valida credenciales → genera tokens
  2. Cada request → [middleware] → verifica token → extrae user_id
  3. Autorización → [cómo se verifica que user puede hacer la acción]
  4. RLS → [cómo se asegura que user solo ve sus datos]

ENDPOINTS PÚBLICOS (sin auth):
  · [listar endpoints que NO requieren autenticación]

ENDPOINTS ADMIN (requieren rol admin):
  · [listar endpoints que requieren rol admin]
```

---

## 6. MODELOS DE DATOS (TABLAS PRINCIPALES)

```
Listar las tablas/colecciones principales con sus campos clave.
NO incluir el schema completo — solo lo suficiente para que el agente
entienda la estructura sin tener que leer los archivos de migración.

EJEMPLO:

  users
    id (uuid, PK), email (unique), role, created_at
    RLS: cada usuario solo ve su propio registro

  organizations (si multi-tenant)
    id (uuid, PK), name, plan, owner_id (FK users)
    RLS: solo miembros de la org ven sus datos

  [tabla principal del negocio]
    id, user_id (FK), org_id (FK), [campos de negocio]
    RLS: user_id = auth.uid() OR org member

RELACIONES CLAVE:
  users 1──N organizations (vía membership)
  organizations 1──N [recurso principal]
  users 1──N [actividades/logs]
```

---

## 7. ENDPOINTS DE API (principales)

```
Listar los endpoints más importantes.
No necesita ser exhaustivo — el agente puede descubrir los demás.
Foco en los que manejan datos sensibles o lógica de negocio.

EJEMPLO:

  AUTH
    POST   /api/auth/login          → autenticar usuario
    POST   /api/auth/register       → crear cuenta
    POST   /api/auth/refresh        → renovar token
    POST   /api/auth/logout         → cerrar sesión
    POST   /api/auth/reset-password → reset de contraseña

  USERS
    GET    /api/users/me            → perfil del usuario actual
    PATCH  /api/users/me            → actualizar perfil
    DELETE /api/users/me            → eliminar cuenta (MFA requerido)

  [RECURSO PRINCIPAL]
    GET    /api/[recurso]           → listar (paginado, filtrado)
    POST   /api/[recurso]           → crear
    GET    /api/[recurso]/:id       → detalle
    PATCH  /api/[recurso]/:id       → actualizar
    DELETE /api/[recurso]/:id       → eliminar

  ADMIN
    GET    /api/admin/dashboard     → métricas (requiere admin)
    GET    /api/admin/users         → listar usuarios (requiere admin)
```

---

## 8. VARIABLES DE ENTORNO

```
Listar TODAS las variables de entorno que el proyecto necesita.
NUNCA incluir los valores reales — solo nombres y descripción.

VARIABLE                          DESCRIPCIÓN                      REQUERIDA
──────────────────────────────────────────────────────────────────────────────
DATABASE_URL                      Conexión a PostgreSQL             sí
DIRECT_URL                        Conexión directa (migraciones)    sí

AUTH_SECRET / JWT_SECRET           Secret para firmar tokens         sí
AUTH_EXPIRY                        Tiempo de vida del access token   sí

[PROVEEDOR_IA]_API_KEY             API key de Anthropic/OpenAI       sí
[PAYMENT]_SECRET_KEY               Secret key de Stripe/otro         según feature
[PAYMENT]_WEBHOOK_SECRET           Secret del webhook de pagos       según feature

[EMAIL]_API_KEY                    API key del servicio de email     sí
[STORAGE]_ACCESS_KEY               Access key de S3/Storage          según feature
[STORAGE]_SECRET_KEY               Secret key de S3/Storage          según feature

ENVIRONMENT                        production / staging / dev        sí
NEXT_PUBLIC_APP_URL                URL pública del frontend          sí
API_URL                            URL del backend                   sí

Ver .env.example para la lista completa con valores de ejemplo.
```

---

## 9. PUNTOS CRÍTICOS (High Fan-In)

```
Funciones/módulos que si se modifican, rompen muchas cosas.
El Knowledge Graph los detecta automáticamente.
Actualizar después de correr get_architecture() del graph.

FUNCIÓN/MÓDULO              DEPENDIENTES    RIESGO    NOTA
──────────────────────────────────────────────────────────────
(llenar con datos del knowledge graph)

EJEMPLO:
  useI18n()                 646             EXTREME   Toda la UI depende de esto
  current_tenant()          184             CRITICAL  Helper de RLS, tumba todo
  formatCurrency()          122             HIGH      Usado en toda la capa de pagos
  useToast()                98              HIGH      Sistema de notificaciones
  can()                     92              HIGH      Sistema de permisos
```

---

## 10. DECISIONES DE ARQUITECTURA (ADR)

```
Decisiones técnicas importantes que se tomaron y POR QUÉ.
Esto evita que el agente o un dev nuevo deshaga decisiones ya pensadas.

FORMATO:
  ## ADR-[NÚMERO]: [Título]
  Fecha: [fecha]
  Estado: aceptada | reemplazada | deprecada
  Contexto: [por qué se necesitó tomar esta decisión]
  Decisión: [qué se decidió]
  Razón: [por qué se eligió esta opción sobre las alternativas]
  Consecuencias: [qué implica esta decisión]


EJEMPLO:
  ## ADR-001: PostgreSQL con RLS en vez de MongoDB
  Fecha: 2026-03-15
  Estado: aceptada
  Contexto: Necesitábamos multi-tenancy seguro con aislamiento de datos.
  Decisión: PostgreSQL con Row Level Security en todas las tablas.
  Razón: RLS garantiza aislamiento a nivel de BD, no solo de app.
         MongoDB requeriría implementar aislamiento en cada query.
  Consecuencias: Cada tabla nueva DEBE tener política RLS antes de deploy.
                 current_tenant() es el helper central (184 dependientes).
```

---

## 11. CONVENCIONES DEL PROYECTO

```
NAMING:
  Archivos:       [kebab-case / camelCase / PascalCase — cuál se usa]
  Funciones:      [camelCase / snake_case]
  Componentes:    [PascalCase]
  Variables:      [camelCase / snake_case]
  Constantes:     [UPPER_SNAKE_CASE]
  Tablas BD:      [snake_case / plural / singular]
  Endpoints API:  [kebab-case / camelCase]

ESTRUCTURA:
  Un componente por archivo:     [sí/no]
  Barrel exports (index.ts):     [sí/no]
  Colocation de tests:           [junto al código / carpeta tests/]
  Colocation de estilos:         [junto al componente / carpeta styles/]

PATRONES:
  Manejo de errores:             [try/catch / Result type / middleware]
  Validación de input:           [dónde: middleware / controller / service]
  Formato de response API:       [{ data, error, meta } / otro]
  Logging:                       [structured JSON / plain text]
  Internacionalización:          [i18n library / ninguna]

COMMITS:
  Formato: tipo(alcance): descripción
  Tipos: fix, feat, refactor, security, test, docs, chore, perf
  Branch strategy: [trunk-based / gitflow / github flow]
  PR requerido: [sí/no]
  Reviews mínimos: [número]
```

---

## 12. KNOWLEDGE GRAPH

```
Estado del Knowledge Graph del proyecto.
Actualizar después de cada indexado.

Graph instalado:    [sí/no]
Herramienta:        [codebase-memory-mcp / CodeGraph / otro]
Última indexación:   [fecha]
Nodos:              [número]
Aristas:            [número]
Lenguajes:          [lista con conteo de archivos por lenguaje]

Clusters detectados:
  [nombre del cluster]: cohesión [score], nodos principales: [lista]

Fronteras cruzadas (acoplamiento alto):
  [módulo A] → [módulo B]: [número] de llamadas
```

---

## 13. DEUDA TÉCNICA CONOCIDA

```
Problemas conocidos que aún no se han resuelto.
El agente debe conocerlos para no gastar tiempo re-descubriéndolos.

#   PROBLEMA                          SEVERIDAD   ESTADO      NOTA
──────────────────────────────────────────────────────────────────────
1   [descripción del problema]        HIGH        pendiente   [contexto]
2   [descripción del problema]        MEDIUM      en progreso [quién lo trabaja]
3   [descripción del problema]        LOW         aceptada    [por qué se acepta]
```

---

## 14. CÓMO CORRER EL PROYECTO

```
DESARROLLO LOCAL:
  # Instalar dependencias
  [npm install / pip install -r requirements.txt / otro]

  # Variables de entorno
  cp .env.example .env
  # Editar .env con valores reales

  # Base de datos
  [comando para correr migraciones]

  # Iniciar servidor de desarrollo
  [npm run dev / python manage.py runserver / otro]

  # Correr tests
  [npm test / pytest / otro]

  # Build de producción
  [npm run build / otro]

URLS LOCALES:
  Frontend:  http://localhost:[puerto]
  Backend:   http://localhost:[puerto]
  API docs:  http://localhost:[puerto]/api/docs (si aplica)
  Graph UI:  http://localhost:9749 (si codebase-memory-mcp instalado)
```

---

```
ARCHITECTURE.md · Blueprint Universal · v1.0
Llenar las secciones con los datos de tu proyecto.
Borrar los ejemplos y dejar solo los datos reales.
Mantener actualizado con cada cambio de arquitectura.

Este archivo SÍ puede commitearse (no contiene secrets ni estrategia
de seguridad — solo estructura y convenciones).
```
