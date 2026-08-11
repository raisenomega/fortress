<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# COGNITION DEEP — Motor Cognitivo Profundo para Agentes de Código
## 8 Pilares Científicos · Razonamiento Multi-Hop · Atención Focalizada · Memoria Evolutiva
### Versión 1.0 · Agosto 2026
### Clasificación: MÁXIMA SEGURIDAD · INTERNO ABSOLUTO

```
╔═══════════════════════════════════════════════════════════════════╗
║                ⛔ CLASIFICACIÓN: INTERNO ABSOLUTO ⛔              ║
║  JAMÁS se commitea · JAMÁS se pushea · JAMÁS se sube a repos     ║
║  SOLO vive en la raíz local de la máquina del operador           ║
║  Incluir en .gitignore: COGNITION*.md                            ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## QUÉ ES COGNITION DEEP

COGNITION DEEP es el cerebro profundo de FORTRESS. Mientras los 4 pilares
reactivos (SENTINEL, GUARDIAN, HERMES, SHIELD) detectan y bloquean amenazas,
COGNITION DEEP razona POR QUÉ existen, CÓMO prevenirlas permanentemente,
y GARANTIZA que nunca vuelvan a ocurrir.

COGNITION DEEP no es una lista de reglas. Es un motor de razonamiento que
piensa como un auditor senior de seguridad con 20 años de experiencia:
focaliza dónde mirar, traza flujos de datos entre archivos, explora múltiples
hipótesis en paralelo, consulta bases de conocimiento de vulnerabilidades
reales, debate consigo mismo para eliminar falsos positivos, reflexiona
sobre sus errores para no repetirlos, y evoluciona con cada sesión.

```
SIN COGNITION DEEP:
  Error detectado → bloqueado → reportado → FIN
  (mañana aparece el mismo error y se repite infinito)

CON COGNITION DEEP:
  Error detectado → razonado paso a paso → múltiples hipótesis exploradas →
  cruzado con CVEs reales → verificado por debate adversarial → reflexión
  sobre qué se aprendió → regla permanente creada → memoria evolutiva →
  error EXTINTO para siempre → siguiente sesión es más inteligente
```

---

## FUNDAMENTOS CIENTÍFICOS

```
PILAR    PAPER FUNDACIONAL                                    AÑO    VENUE
─────────────────────────────────────────────────────────────────────────────
①        Attention Is All You Need (Vaswani et al.)           2017   NeurIPS
②        HotpotQA: Multi-Hop QA (Yang et al.)                2018   EMNLP
③        Evolution Tree / Scaling Laws (Kaplan et al.)        2020   arXiv
④        Chain-of-Thought Prompting (Wei et al.)              2022   NeurIPS
⑤        Tree of Thoughts (Yao et al.)                        2023   NeurIPS
⑥        Reflexion: Verbal Reinforcement (Shinn et al.)       2023   NeurIPS
⑦        Vul-RAG: Knowledge-level RAG (Zhou et al.)           2024   TOSEM
⑧        VulTrial: Adversarial Multi-Agent (ICSE)             2026   ICSE

PAPERS COMPLEMENTARIOS:
  · FGDM: Multi-Agentic Bug Detection with CoT+ToT           2026   COMSNETS
  · MAVUL: Multi-Agent Vulnerability Detection                2025   arXiv
  · FuzzingBrain V2: Multi-Agent Vulnerability Discovery      2026   arXiv
  · VIC-RAGENT: Multi-Stage Reasoning for VICs                2026   arXiv
  · Gödel Agent: Self-Referential Self-Improvement            2025   ACL
  · ReflexiCoder: Internalized Reflection (94.5% HumanEval)  2025   arXiv
  · Self-RAG: Retrieve, Generate, Critique                    2024   ICLR
  · Graph of Thoughts (Besta et al.)                          2024   AAAI
  · VulReaD: Knowledge-Graph Vulnerability Reasoning          2026   arXiv
  · CRAKEN: Cybersecurity Agent with Knowledge Execution      2026   arXiv
```

---

## ARQUITECTURA DE LOS 8 PILARES

```
                    ┌─────────────────────┐
                    │   ERROR / TAREA     │
                    │   DETECTADA         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ① ATTENTION MAP    │
                    │  ¿DÓNDE mirar?      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ② MULTI-HOP TRACE  │
                    │  ¿CÓMO se conecta?  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ④ CHAIN OF THOUGHT │
                    │  Razonar paso a paso│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ⑤ TREE OF THOUGHTS │
                    │  Explorar hipótesis │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ⑦ VUL-RAG          │
                    │  Consultar CVEs     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ⑧ ADVERSARIAL      │
                    │  Debate y verificar │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ⑥ REFLEXION        │
                    │  ¿Qué aprendí?      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ③ EVOLUTION        │
                    │  Dreaming → memoria │
                    │  evolutiva → la     │
                    │  siguiente sesión   │
                    │  es más inteligente │
                    └─────────────────────┘
```

---

# PILAR ① — ATTENTION MAP
## Fundamento: "Attention Is All You Need" (Vaswani et al., 2017)
## Principio: No mirar todo por igual. Focalizar donde importa.

### Concepto Científico

En el paper original de Transformers, la función de atención se define como:

```
Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V

Donde:
  Q = Query (lo que estoy buscando)
  K = Key (lo que cada elemento ofrece)
  V = Value (el contenido real de cada elemento)
  dₖ = dimensión de las keys (factor de escala)

La multiplicación QKᵀ calcula la RELEVANCIA de cada elemento respecto
a la query. softmax normaliza para que sume 1. El resultado es un
weighted average donde los elementos más relevantes pesan más.
```

### Aplicación a COGNITION DEEP

En el contexto de código, redefinimos los términos:

```
Q (Query)   = "¿Dónde hay riesgo de seguridad?"
K (Key)     = Características de cada archivo/función:
                - ¿Toca datos de usuario?
                - ¿Recibe input externo?
                - ¿Tiene historial de bugs?
                - ¿Maneja autenticación?
                - ¿Procesa pagos?
                - ¿Fue modificado recientemente?
V (Value)   = El código real del archivo/función

Attention Score por archivo:
  score(archivo) = sigmoid(
    w₁ × toca_input_usuario      +
    w₂ × tiene_historial_bugs    +
    w₃ × maneja_auth             +
    w₄ × procesa_pagos           +
    w₅ × modificado_reciente     +
    w₆ × tiene_dependencias_ext  +
    w₇ × complejidad_ciclomática +
    w₈ × falta_tests
  )
```

### Pesos de Atención por Zona

```
ZONA DE CÓDIGO                    PESO BASE    AJUSTE DINÁMICO
─────────────────────────────────────────────────────────────────
Endpoints que reciben input       0.9          +0.1 si no tiene validación
Funciones de autenticación        0.9          +0.1 si tuvo bugs previos
Queries a base de datos           0.8          +0.2 si usa concatenación
Manejo de sesiones/tokens         0.8          +0.1 si no tiene expiración
Procesamiento de pagos            0.9          (siempre máximo)
Funciones con eval/exec           1.0          (siempre máximo, no negociable)
Serialización/deserialización     0.7          +0.2 si acepta input externo
Archivos de configuración         0.6          +0.3 si contienen secrets
Funciones utilitarias puras       0.2          -0.1 si tiene 100% test coverage
Componentes UI sin lógica         0.1          +0.3 si renderiza user content
Archivos estáticos (CSS, assets)  0.05         (mínimo, casi ignorar)
```

### Mapa de Atención Visual

```
COGNITION DEEP genera un mapa de atención del proyecto:

  src/
  ├── auth/
  │   ├── login.py          ██████████████████  0.95  ← MÁXIMA
  │   ├── session.py        █████████████████   0.90
  │   └── middleware.py     ████████████████    0.85
  ├── api/
  │   ├── routes/users.py   █████████████████   0.88
  │   ├── routes/payments.py██████████████████  0.95  ← MÁXIMA
  │   └── validators.py     ████████████       0.65
  ├── db/
  │   ├── queries.py        ████████████████    0.82
  │   ├── migrations/       ████████           0.45
  │   └── models.py         ██████████         0.55
  ├── services/
  │   ├── ai_agent.py       █████████████████   0.90
  │   ├── email.py          ██████████         0.55
  │   └── cache.py          ████████           0.40
  ├── utils/
  │   ├── helpers.py        ████               0.20
  │   └── constants.py      ██                 0.10
  └── components/
      ├── UserProfile.tsx   ████████████       0.60  (renderiza PII)
      └── Header.tsx        █                  0.05

  El agente NO gasta el mismo esfuerzo en Header.tsx que en login.py.
  Focaliza donde el riesgo es mayor.
```

### Recálculo Dinámico

```
El mapa de atención NO es estático. Se recalcula cuando:

  EVENTO                                      AJUSTE
  ──────────────────────────────────────────────────────────
  Un archivo recibe un commit                  atención +0.1 (temporal, 48h)
  Un bug se detecta en un archivo              atención +0.3 (permanente)
  Un archivo pasa 90 días sin bugs             atención -0.1
  Un test de seguridad falla                   atención de la zona +0.2
  Un nuevo endpoint se crea                    atención 0.7 (baseline)
  Una dependencia con CVE se detecta           atención del archivo +0.3
  COGNITION marca un patrón como EXTINTO       atención del archivo -0.1

  DECAY: los ajustes temporales decaen 10% cada 7 días
  FLOOR: ningún archivo baja de 0.05 (siempre un mínimo de vigilancia)
  CEILING: ningún archivo supera 1.0
```

---

# PILAR ② — MULTI-HOP REASONING
## Fundamento: HotpotQA (Yang et al., 2018)
## Principio: Las vulnerabilidades viven ENTRE archivos, no dentro de uno.

### Concepto Científico

HotpotQA demostró que las preguntas complejas requieren razonamiento
multi-salto: conectar información de múltiples documentos para llegar
a una respuesta que ningún documento individual contiene.

```
EJEMPLO HOTPOTQA:
  Pregunta: "¿El director de Jaws y el director de E.T. son la misma persona?"
  
  Documento A: "Jaws fue dirigida por Steven Spielberg"
  Documento B: "E.T. fue dirigida por Steven Spielberg"
  
  Hop 1: Jaws → director = Spielberg (Documento A)
  Hop 2: E.T. → director = Spielberg (Documento B)
  Hop 3: Comparar → Spielberg == Spielberg → SÍ
  
  Ningún documento solo tiene la respuesta. Se necesitan 3 saltos.
```

### Aplicación a COGNITION DEEP

```
EJEMPLO DE VULNERABILIDAD MULTI-HOP:

  Pregunta: "¿Hay SQL injection en el endpoint /api/users?"

  Archivo A (routes/users.py):
    @app.get("/api/users")
    def get_users(search: str):
        return user_service.search(search)

  Archivo B (services/user_service.py):
    def search(self, query):
        return self.db.execute_query(query)

  Archivo C (db/database.py):
    def execute_query(self, query):
        cursor.execute(f"SELECT * FROM users WHERE name LIKE '%{query}%'")

  HOP 1: /api/users recibe parámetro 'search' sin validación
  HOP 2: search() pasa 'query' directo a execute_query() sin sanitizar
  HOP 3: execute_query() usa f-string para construir SQL
  HOP 4: El input del usuario llega DIRECTO a la query SQL

  CONCLUSIÓN: SQL Injection confirmado en 4 hops, 3 archivos.
  
  Un scanner que mira SOLO routes/users.py no ve nada malo.
  Un scanner que mira SOLO database.py ve un f-string pero no sabe
  si el input viene de un usuario o de una fuente confiable.
  Solo el razonamiento multi-hop conecta las piezas.
```

### Protocolo Multi-Hop de COGNITION DEEP

```
CUANDO COGNITION DEEP ANALIZA UNA FUNCIÓN:

  PASO 1 — ENTRY POINT IDENTIFICATION
    ¿Esta función recibe datos de fuentes externas?
    · Parámetros de request (query, body, headers, cookies)
    · Datos de formularios
    · Archivos subidos
    · Respuestas de APIs externas
    · Datos de websockets
    · Variables de entorno (¿pueden ser manipuladas?)

  PASO 2 — DATA FLOW TRACING (hacia adelante)
    ¿A dónde viajan esos datos?
    · ¿Se pasan a otra función? → SALTAR a esa función
    · ¿Se guardan en BD? → ¿cómo se construye la query?
    · ¿Se renderizan en HTML? → ¿hay escape/sanitización?
    · ¿Se pasan a un comando de shell? → ¿hay escape?
    · ¿Se serializan/deserializan? → ¿hay validación de tipo?
    · ¿Se loguean? → ¿contienen datos sensibles?
    Cada destino es un HOP. Seguir hasta el final del flujo.

  PASO 3 — TAINT ANALYSIS (hacia atrás)
    Desde un punto peligroso (query SQL, render HTML, exec),
    rastrear HACIA ATRÁS: ¿de dónde viene este dato?
    · ¿Viene de input de usuario? → TAINTED (contaminado)
    · ¿Pasó por sanitización en algún hop? → VERIFICAR la sanitización
    · ¿La sanitización es adecuada para el contexto? 
      (escape SQL ≠ escape HTML ≠ escape shell)
    · Si el dato llega tainted al punto peligroso → VULNERABILIDAD

  PASO 4 — CROSS-FILE DEPENDENCY MAP
    Construir mapa de dependencias para el flujo:
    
    routes/users.py  ──imports──►  services/user_service.py
                                          │
                                    ──imports──►  db/database.py
                                          │
                                    ──imports──►  utils/sanitizer.py
    
    Si sanitizer.py NO está en el flujo → el dato no se limpia
    Si sanitizer.py SÍ está pero usa escape incorrecto → igualmente vulnerable

  PASO 5 — EVIDENCIA COMPLETA
    Documentar la cadena completa:
    {
      "vulnerability": "SQL Injection",
      "hops": [
        {"file": "routes/users.py",    "line": 12, "action": "recibe 'search' sin validación"},
        {"file": "services/user.py",   "line": 28, "action": "pasa 'query' sin sanitizar"},
        {"file": "db/database.py",     "line": 15, "action": "usa f-string en SQL query"}
      ],
      "total_hops": 3,
      "taint_source": "request.query.search",
      "taint_sink": "cursor.execute()",
      "sanitization_present": false,
      "confidence": 0.97
    }
```

### Tipos de Cadenas Multi-Hop

```
TIPO           EJEMPLO                                    HOPS TÍPICOS
──────────────────────────────────────────────────────────────────────────
SQL Injection  input → service → query builder → DB       3-5
XSS            input → controller → template → render     2-4
SSRF           input → URL builder → HTTP client → fetch   3-4
Path Traversal input → file path builder → fs.read         2-3
Command Inj.   input → command builder → exec/spawn        2-4
Deserialization input → parser → object creation           2-3
Auth Bypass    request → middleware → route (skip check)   2-4
IDOR           request → controller → query (no owner chk) 2-3
Race Condition request A + request B → shared state        3-6 (paralelo)
Supply Chain   package.json → node_modules → vulnerable fn 2-4
```

---

# PILAR ③ — EVOLUTION TREE
## Fundamento: Evolución de LLMs + Scaling Laws
## Principio: Cada generación hereda y mejora el conocimiento anterior.

### Concepto

```
El Evolution Tree de LLMs muestra un patrón universal:

  Word2Vec (2013)
    └── GloVe (2014)
        └── ELMo (2018)
            └── BERT (2018)
                └── GPT-2 (2019)
                    └── GPT-3 (2020)
                        └── Claude (2023)
                            └── Claude Opus 4.6 (2026)

Cada nodo hereda el conocimiento del anterior y agrega capacidades.
BERT no existiría sin Word2Vec. Claude no existiría sin BERT.
```

### Aplicación a COGNITION DEEP

```
COGNITION DEEP aplica el mismo patrón al conocimiento del proyecto:

  Generación 0 (día 1):
    "No sé nada de este proyecto"
    → Baseline: reglas genéricas de CLAUDE.md
    
  Generación 1 (semana 1):
    "Detecté 3 SQL injections por f-strings"
    → Regla: buscar f-strings en queries
    → Heredado de Gen 0 + nuevo conocimiento
    
  Generación 2 (semana 2):
    "Detecté SQL injection por .format()"
    → Regla EVOLUCIONADA: buscar TODA string interpolation en queries
    → La regla de Gen 1 era correcta pero INCOMPLETA
    → Gen 2 la subsume (incluye f-strings + .format + concatenación)
    
  Generación 3 (mes 1):
    "Detecté SQL injection a través de ORM mal usado"
    → Regla EVOLUCIONADA: verificar que ORM se use correctamente
    → Incluye raw queries, filter() con input directo, extra() deprecado
    → Gen 3 sabe MÁS que cualquier scanner estático
    
  Generación N:
    "Conozco TODOS los patrones de SQL injection de este proyecto"
    → La probabilidad de que uno pase es casi cero
    → Cada generación es estrictamente más inteligente que la anterior
    → El conocimiento NUNCA se pierde, solo se expande


ESTRUCTURA DE LA MEMORIA EVOLUTIVA:

  evolution_tree/
  ├── gen_000/                    # Día 1 — baseline
  │   └── rules_baseline.md
  ├── gen_001/                    # Semana 1
  │   ├── rules_evolved.md        # Reglas nuevas
  │   ├── patterns_learned.md     # Patrones detectados
  │   └── diff_from_gen_000.md    # Qué cambió respecto a Gen 0
  ├── gen_002/                    # Semana 2
  │   ├── rules_evolved.md
  │   ├── patterns_learned.md
  │   ├── subsumptions.md         # Qué reglas viejas fueron reemplazadas
  │   └── diff_from_gen_001.md
  └── current/                    # Siempre apunta a la generación más reciente
      └── → gen_002/


REGLA DE EVOLUCIÓN:
  · Una regla nueva puede SUBSUMIR (reemplazar) una regla vieja
    si la nueva cubre todos los casos de la vieja + casos nuevos
  · Una regla vieja NUNCA se borra, solo se marca como subsumida
  · Si la regla nueva falla en un caso que la vieja cubría,
    la vieja se RESTAURA y la nueva se marca como defectuosa
  · El árbol de evolución es AUDITABLE: siempre se puede ver
    por qué se tomó cada decisión
```

### Integración con Dreaming de Anthropic

```
DREAMING (oficial Anthropic) ES EL MOTOR DE EVOLUCIÓN:

  1. Claude Code trabaja en tu proyecto durante el día
  2. Dreaming se ejecuta como cron job (ej: cada noche a las 2am)
  3. Dreaming revisa hasta 100 sesiones pasadas
  4. Extrae patrones: "en las últimas 10 sesiones, el agente
     encontró 3 veces el mismo tipo de error en auth/"
  5. Consolida: elimina duplicados, resuelve contradicciones,
     actualiza el CLAUDE.md con las nuevas reglas
  6. La siguiente sesión de Claude Code hereda ese conocimiento

  COGNITION DEEP + DREAMING = evolución automática del proyecto

  Harvey (startup legal) reportó 6x mejora en tasa de completación
  de tareas después de activar Dreaming. Esto es porque el agente
  dejó de cometer los mismos errores que ya había aprendido a evitar.
```

---

# PILAR ④ — CHAIN OF THOUGHT (CoT)
## Fundamento: Wei et al., 2022 (NeurIPS)
## Principio: Razonar paso a paso. Cada paso es verificable.

### Concepto Científico

```
SIN Chain of Thought:
  Input:  "¿Hay vulnerabilidad en este código?"
  Output: "Sí, SQL injection en línea 42"
  
  Problema: ¿cómo llegó a esa conclusión? No se sabe.
  ¿Es correcto? No se puede verificar sin repetir todo el análisis.

CON Chain of Thought:
  Input:  "¿Hay vulnerabilidad en este código?"
  Output:
    Paso 1: Identifico que la función get_user() recibe un parámetro 'id'
            del request query string.
    Paso 2: Ese 'id' se pasa directamente a build_query() sin validación
            de tipo ni sanitización.
    Paso 3: build_query() construye la query SQL usando f-string:
            f"SELECT * FROM users WHERE id = {id}"
    Paso 4: La query se ejecuta con cursor.execute() sin parametrizar.
    Paso 5: Un atacante puede enviar id = "1; DROP TABLE users; --"
            y la query se convertiría en:
            "SELECT * FROM users WHERE id = 1; DROP TABLE users; --"
    Conclusión: SQL Injection confirmado. Severidad CRITICAL.
    
  Cada paso es verificable independientemente.
  Si el Paso 2 es incorrecto (sí hay sanitización),
  toda la cadena de razonamiento cae y se sabe EXACTAMENTE dónde falló.
```

### Protocolo CoT de COGNITION DEEP

```
PARA CADA HALLAZGO, COGNITION DEEP DOCUMENTA:

  CADENA DE RAZONAMIENTO:
  ┌─────────────────────────────────────────────────┐
  │ PASO 1: OBSERVACIÓN                             │
  │   ¿Qué veo en el código?                        │
  │   Dato concreto: función, línea, variable        │
  ├─────────────────────────────────────────────────┤
  │ PASO 2: CONTEXTO                                │
  │   ¿De dónde viene este dato?                     │
  │   ¿Quién lo llama? ¿Con qué parámetros?         │
  ├─────────────────────────────────────────────────┤
  │ PASO 3: ANÁLISIS                                │
  │   ¿Hay sanitización/validación en el camino?     │
  │   ¿Es adecuada para el contexto?                │
  ├─────────────────────────────────────────────────┤
  │ PASO 4: HIPÓTESIS                               │
  │   Si no hay protección → ¿qué podría pasar?     │
  │   Construir un escenario de ataque concreto      │
  ├─────────────────────────────────────────────────┤
  │ PASO 5: VERIFICACIÓN                            │
  │   ¿El escenario de ataque es realmente posible?  │
  │   ¿Hay algún control que no vi?                  │
  │   ¿Un WAF lo bloquearía? ¿Un middleware?         │
  ├─────────────────────────────────────────────────┤
  │ PASO 6: CONCLUSIÓN                              │
  │   VULNERABLE / NO VULNERABLE / INCONCLUSO        │
  │   Con nivel de confianza (0.0 a 1.0)             │
  │   Si < 0.7 → requiere verificación humana        │
  └─────────────────────────────────────────────────┘

  REGLA: Si algún paso no tiene evidencia concreta,
  COGNITION DEEP NO avanza al siguiente. Se detiene y
  marca como INCONCLUSO en vez de adivinar.
  
  Preferimos un falso negativo honesto ("no estoy seguro")
  a un falso positivo fabricado ("es una vulnerabilidad"
  sin evidencia suficiente).
```

---

# PILAR ⑤ — TREE OF THOUGHTS (ToT)
## Fundamento: Yao et al., 2023 (NeurIPS)
## Principio: Explorar múltiples hipótesis en paralelo. Podar las falsas.

### Concepto Científico

```
CHAIN OF THOUGHT = un camino lineal de razonamiento
TREE OF THOUGHTS = múltiples caminos explorados en paralelo

  CoT:    A → B → C → D → CONCLUSIÓN

  ToT:         ┌→ B₁ → C₁ → ✗ (descartado)
          A →  ├→ B₂ → C₂ → D₂ → ✓ CONCLUSIÓN
               └→ B₃ → ✗ (podado temprano)

  ToT explora 3 hipótesis, descarta 2, y converge en la correcta.
  Esto es DELIBERACIÓN: pensar antes de concluir.
```

### Aplicación a COGNITION DEEP

```
CUANDO COGNITION DEEP ENCUENTRA ALGO SOSPECHOSO:

  En vez de asumir la primera hipótesis, abre un árbol:

  SOSPECHA: "La función process_payment() podría ser vulnerable"

  ┌─ Hipótesis 1: SQL Injection
  │   Paso 1: ¿usa string interpolation en queries? → NO
  │   Paso 2: ¿usa ORM correctamente? → SÍ
  │   RESULTADO: DESCARTADA (evidencia negativa)
  │
  ├─ Hipótesis 2: Race Condition
  │   Paso 1: ¿hay operaciones no-atómicas? → SÍ
  │   Paso 2: ¿se lee balance → se verifica → se debita? → SÍ
  │   Paso 3: ¿hay lock/mutex/transacción? → NO
  │   Paso 4: ¿dos requests simultáneos podrían pasar la verificación? → SÍ
  │   RESULTADO: CONFIRMADA (confianza 0.92)
  │
  ├─ Hipótesis 3: Insufficient Authorization
  │   Paso 1: ¿verifica que el usuario es dueño de la cuenta? → SÍ
  │   Paso 2: ¿el middleware de auth está presente? → SÍ
  │   RESULTADO: DESCARTADA (evidencia negativa)
  │
  └─ Hipótesis 4: Amount Manipulation
      Paso 1: ¿el monto viene del frontend? → SÍ
      Paso 2: ¿se re-valida en backend? → NO
      Paso 3: ¿un atacante podría enviar un monto negativo? → POSIBLE
      RESULTADO: SOSPECHOSA (confianza 0.65, requiere más investigación)

  CONCLUSIONES DEL ÁRBOL:
    · Race Condition: CONFIRMADA → FIX INMEDIATO
    · Amount Manipulation: SOSPECHOSA → INVESTIGAR MÁS
    · SQL Injection: DESCARTADA
    · Auth Bypass: DESCARTADA

  Sin ToT, COGNITION DEEP habría probado solo la primera hipótesis
  (SQL Injection), la habría descartado, y habría marcado la función
  como "limpia" — perdiendo la Race Condition y la manipulación de monto.
```

### Estrategias de Poda

```
COGNITION DEEP poda ramas del árbol basándose en:

  PODA POR EVIDENCIA NEGATIVA:
    Si los primeros 2 pasos de una hipótesis no encuentran evidencia → PODAR
    No gastar más tokens explorando un callejón sin salida

  PODA POR PRIORIDAD:
    Si ya se encontró un CRITICAL → seguir explorando pero con menos profundidad
    El CRITICAL ya justifica acción; las demás hipótesis son bonus

  PODA POR COSTO:
    Si el árbol tiene >6 ramas activas → podar las de menor confianza
    Máximo 4-5 hipótesis activas simultáneamente

  NO PODAR:
    Si la hipótesis involucra seguridad de datos financieros → NUNCA podar
    Si la hipótesis involucra datos de usuarios (PII) → NUNCA podar
    Si la hipótesis involucra autenticación → NUNCA podar
```

---

# PILAR ⑥ — REFLEXION
## Fundamento: Shinn et al., 2023 (NeurIPS)
## Principio: Después de cada intento, reflexionar y mejorar.

### Concepto Científico

```
Reflexion demostró que un agente que reflexiona sobre sus errores
mejora DRAMÁTICAMENTE sin cambiar el modelo subyacente:

  HumanEval (benchmark de código):
    Sin Reflexion:  67.0% pass rate
    Con Reflexion:  91.0% pass rate (+24 puntos con el MISMO modelo)

  El secreto: después de cada intento fallido, el agente genera
  una reflexión en lenguaje natural ("¿qué hice mal? ¿qué debería
  hacer diferente?") y la guarda en memoria episódica para el
  siguiente intento.
```

### Aplicación a COGNITION DEEP

```
DESPUÉS DE CADA SESIÓN DE ANÁLISIS, COGNITION DEEP REFLEXIONA:

  REFLEXIÓN POST-SESIÓN:
  ┌─────────────────────────────────────────────────────┐
  │ SESIÓN: 2026-08-01 · Proyecto: OmegaRaisen          │
  │                                                     │
  │ ¿QUÉ ENCONTRÉ?                                     │
  │   · 2 SQL injections (confirmadas)                   │
  │   · 1 XSS (confirmado)                               │
  │   · 3 falsos positivos que descarté con ToT           │
  │                                                     │
  │ ¿QUÉ HICE BIEN?                                     │
  │   · Multi-hop tracing detectó la SQL injection        │
  │     que el scanner estático no vio                    │
  │   · ToT correctamente descartó 3 hipótesis falsas     │
  │                                                     │
  │ ¿QUÉ HICE MAL?                                       │
  │   · No detecté el XSS en la primera pasada            │
  │   · Lo encontré solo cuando analicé los templates     │
  │   · Mi mapa de atención daba peso bajo a templates/   │
  │                                                     │
  │ ¿QUÉ DEBO CAMBIAR?                                   │
  │   · Subir peso de atención de templates/ de 0.3 a 0.7 │
  │   · Agregar regla: todo archivo que renderiza          │
  │     variables de usuario necesita atención alta        │
  │   · Agregar hop obligatorio: siempre trazar            │
  │     hasta el punto de render, no solo hasta la DB     │
  │                                                     │
  │ ACCIÓN CONCRETA:                                     │
  │   1. Actualizar attention_map: templates/ → 0.7       │
  │   2. Agregar regla a CLAUDE.md: "Trazar flujo de      │
  │      datos hasta el render final, no solo hasta DB"   │
  │   3. Crear test de regresión para XSS en templates    │
  │                                                     │
  │ CONFIANZA EN ESTA REFLEXIÓN: 0.88                    │
  └─────────────────────────────────────────────────────┘

  Esta reflexión se almacena en la memoria episódica.
  La siguiente sesión lee TODAS las reflexiones anteriores
  ANTES de empezar a analizar.
  
  Resultado: el mismo error nunca se comete dos veces.
```

### Memoria Episódica

```
ESTRUCTURA DE LA MEMORIA EPISÓDICA:

  episodic_memory/
  ├── session_001.md    # Reflexión de sesión 1
  ├── session_002.md    # Reflexión de sesión 2
  ├── ...
  └── consolidated.md   # Dreaming consolida todas las reflexiones
                        # en un documento limpio y deduplicado

  Dreaming (Anthropic) lee las reflexiones episódicas y genera
  consolidated.md — que es la "sabiduría acumulada" del agente.
  
  Cada nueva sesión lee consolidated.md ANTES de empezar.
  Resultado: el agente de la sesión 50 sabe todo lo que aprendieron
  las sesiones 1 a 49.
```

---

# PILAR ⑦ — VUL-RAG (Knowledge-Level RAG)
## Fundamento: Vul-RAG (2024, TOSEM/SIGIR 2026)
## Principio: No razonar en el vacío. Consultar conocimiento real.

### Concepto Científico

```
Vul-RAG demostró que LLMs solos tienen precisión MUY BAJA distinguiendo
código vulnerable de código similar-pero-seguro (0.06 a 0.14 accuracy).

Pero cuando se les da acceso a una knowledge base de vulnerabilidades
reales (CVEs con sus causas raíz y fixes), la precisión sube 16-24%.

ARQUITECTURA VUL-RAG:
  1. INDEXING: Construir base de conocimiento desde CVEs reales
     · Para cada CVE: extraer causa raíz, patrón vulnerable,
       fix aplicado, lenguaje, framework, CWE category
  2. RETRIEVAL: Cuando se analiza código nuevo, buscar en la KB
     · "¿Este patrón se parece a algún CVE conocido?"
     · Buscar por semántica funcional, no por keywords
  3. GENERATION: El LLM razona con el CVE recuperado como contexto
     · "Este código tiene el mismo patrón que CVE-2024-27956,
        que era SQL injection en WordPress. La causa raíz era
        input no sanitizado pasado a una query dinámica."
```

### Aplicación a COGNITION DEEP

```
COGNITION DEEP MANTIENE UNA KNOWLEDGE BASE DE VULNERABILIDADES:

  FUENTES:
    · CVEs del NVD (National Vulnerability Database)
    · OWASP Top 10 (Web, API, LLM, Agentic)
    · CWE (Common Weakness Enumeration)
    · Vulnerabilidades encontradas previamente en ESTE proyecto
    · Reflexiones de sesiones anteriores

  ESTRUCTURA DE UN REGISTRO DE KNOWLEDGE BASE:
  {
    "kb_id": "KB-2026-0142",
    "source": "CVE-2024-27956",
    "cwe": "CWE-89 (SQL Injection)",
    "pattern": {
      "description": "Input de usuario pasado a query dinámica sin parametrizar",
      "code_pattern": "cursor.execute(f'... {user_input} ...')",
      "variants": [
        "f-string interpolation",
        "str.format()",
        "concatenación con +",
        ".format_map()",
        "% formatting"
      ]
    },
    "root_cause": "Falta de separación entre datos y código SQL",
    "fix": "Usar queries parametrizadas: cursor.execute('... %s ...', (user_input,))",
    "languages": ["python", "javascript", "java", "php", "ruby"],
    "frameworks": ["django", "flask", "fastapi", "express", "rails"],
    "severity": "CRITICAL",
    "exploitability": "TRIVIAL"
  }


FLUJO DE CONSULTA:

  1. COGNITION DEEP encuentra código sospechoso
  2. Extrae el patrón funcional (qué hace el código, no cómo se ve)
  3. Busca en la knowledge base por similitud semántica
  4. Si encuentra match → agrega el CVE como contexto al razonamiento
  5. El razonamiento ahora incluye: "Este patrón es similar a CVE-X,
     que causó Y. Verifico si las mismas condiciones aplican aquí."
  6. Resultado: detección más precisa Y explicación más rica
```

---

# PILAR ⑧ — ADVERSARIAL VERIFICATION
## Fundamento: VulTrial (ICSE 2026), MAVUL (2025), GPTLENS (2023)
## Principio: Un hallazgo no es verdad hasta que sobrevive un debate.

### Concepto Científico

```
VulTrial (ICSE 2026) introdujo un modelo de tribunal:

  🔴 FISCAL (Security Researcher)
     Argumenta POR QUÉ el código es vulnerable.
     Presenta evidencia de ataque.
  
  🔵 DEFENSOR (Code Author)
     Argumenta POR QUÉ el código NO es vulnerable.
     Presenta controles existentes, validaciones, contexto.
  
  ⚖️ JUEZ (Moderator)
     Evalúa ambos argumentos contra la evidencia.
     Pide más información si necesita.
     Emite veredicto.
  
  👥 JURADO (Review Board)
     Vota sobre el veredicto del juez.
     Puede apelar si hay desacuerdo.

GPTLENS demostró que separar detección en 2 agentes
(uno que busca, otro que verifica) minimiza falsos positivos.

MAVUL mostró que agentes especializados por tipo de vulnerabilidad
(uno para memoria, otro para auth, otro para crypto) detectan
más que un solo agente generalista.
```

### Aplicación a COGNITION DEEP

```
CUANDO COGNITION DEEP TIENE UN HALLAZGO CON CONFIANZA > 0.6:

  FASE 1 — FISCAL PRESENTA CASO
  ┌──────────────────────────────────────────────────┐
  │ 🔴 FISCAL:                                       │
  │ "Encontré SQL injection en get_user().            │
  │  Evidencia:                                       │
  │  - El parámetro 'id' viene del request            │
  │  - No hay validación de tipo                      │
  │  - Se pasa a una f-string en la query             │
  │  - No hay middleware de sanitización en la ruta   │
  │  - El patrón coincide con CVE-2024-27956"         │
  └──────────────────────────────────────────────────┘

  FASE 2 — DEFENSOR RESPONDE
  ┌──────────────────────────────────────────────────┐
  │ 🔵 DEFENSOR:                                      │
  │ "La función tiene un decorator @validate_int      │
  │  que convierte 'id' a integer antes de llegar     │
  │  a la función. Un integer no puede contener       │
  │  SQL injection. Además, el ORM de Django          │
  │  parametriza automáticamente las queries.          │
  │  La f-string está en un logging statement,        │
  │  no en la query real."                             │
  └──────────────────────────────────────────────────┘

  FASE 3 — JUEZ EVALÚA
  ┌──────────────────────────────────────────────────┐
  │ ⚖️ JUEZ:                                          │
  │ "Verifico los argumentos:                         │
  │  1. ¿Existe @validate_int? → SÍ, en decorators.py│
  │  2. ¿Convierte a int? → SÍ, con int() + catch    │
  │  3. ¿La f-string es en query o logging? → LOGGING │
  │  4. ¿El ORM parametriza? → SÍ, es Django ORM     │
  │                                                   │
  │  VEREDICTO: NO VULNERABLE                          │
  │  El fiscal tenía razón sobre el patrón pero        │
  │  ignoró el decorator y confundió logging con query │
  │  Confianza: 0.93                                   │
  │                                                   │
  │  APRENDIZAJE: Verificar SIEMPRE si hay decorators  │
  │  de validación antes de marcar como vulnerable.    │
  │  Distinguir f-strings en queries vs en logging."   │
  └──────────────────────────────────────────────────┘

  RESULTADO: Falso positivo ELIMINADO por debate adversarial.
  Sin este debate, el fiscal habría reportado un CRITICAL
  que habría gastado tiempo del equipo en algo que no es problema.
```

### Cuándo Activar Debate Adversarial

```
  CONFIANZA DEL HALLAZGO     ACCIÓN
  ─────────────────────────────────────────────────
  0.95 - 1.0                 Reportar directamente (casi seguro)
  0.70 - 0.94                DEBATE ADVERSARIAL obligatorio
  0.50 - 0.69                Debate + marcar como "requiere revisión humana"
  0.00 - 0.49                Descartar (evidencia insuficiente)

  El rango 0.70-0.94 es donde el debate más valor aporta:
  es lo suficientemente sospechoso para investigar pero
  no lo suficientemente seguro para reportar sin verificar.
```

---

# INTEGRACIÓN COMPLETA: LOS 8 PILARES EN ACCIÓN

### Ejemplo Real End-to-End

```
ESCENARIO: COGNITION DEEP analiza un endpoint de pagos

═══════════════════════════════════════════════════════════════

① ATTENTION MAP selecciona:
   "payments/ tiene peso 0.95 → analizar con máxima profundidad"

② MULTI-HOP TRACE:
   HOP 1: POST /api/checkout recibe {amount, card_token, user_id}
   HOP 2: checkout_service.process(amount, card_token, user_id)
   HOP 3: payment_gateway.charge(card_token, amount)
   HOP 4: db.save_transaction(user_id, amount, status)

④ CHAIN OF THOUGHT:
   Paso 1: 'amount' viene del frontend → NO es confiable
   Paso 2: checkout_service NO re-valida 'amount' contra el carrito
   Paso 3: Un atacante podría enviar amount=0.01 para un producto de $100
   Paso 4: payment_gateway.charge() cobraría $0.01
   Paso 5: db.save_transaction() guardaría la transacción como exitosa

⑤ TREE OF THOUGHTS:
   Hipótesis A: Price manipulation (amount del frontend)     → CONFIRMADA
   Hipótesis B: Race condition (dos checkouts simultáneos)   → INVESTIGAR
   Hipótesis C: IDOR (user_id manipulable)                   → DESCARTADA
   Hipótesis D: Card token replay attack                     → POSIBLE

⑦ VUL-RAG consulta:
   "Patrón similar a KB-2025-0089: Price manipulation en e-commerce.
    Causa raíz: confiar en el precio enviado por el cliente.
    Fix: siempre calcular el precio en el backend desde el catálogo."

⑧ ADVERSARIAL VERIFICATION:
   🔴 Fiscal: "El amount viene del frontend sin re-validación"
   🔵 Defensor: "Hay un webhook de Stripe que verifica el monto"
   ⚖️ Juez: "Verifico: el webhook es POST-cobro, no PRE-cobro.
            La validación ocurre DESPUÉS de cobrar. El fiscal tiene razón."
   VEREDICTO: VULNERABLE (confianza 0.94)

⑥ REFLEXION:
   "Aprendí que los webhooks de payment gateways NO son validación
    pre-transacción. Son notificación post-transacción. Debo distinguir
    entre controles preventivos (pre) y detectivos (post).
    Agregar a la knowledge base: webhooks ≠ validación de input."

③ EVOLUTION:
   → Regla nueva: "SIEMPRE verificar precio en backend contra catálogo"
   → Regla nueva: "webhooks son controles detectivos, no preventivos"
   → Attention map: payments/ se mantiene en 0.95
   → Knowledge base: nuevo registro KB-LOCAL-001
   → Generación 1 → Generación 2 (más inteligente)

═══════════════════════════════════════════════════════════════

REPORTE FINAL:

  VULNERABILIDAD: Price Manipulation en /api/checkout
  SEVERIDAD: CRITICAL
  CADENA: 4 hops, 3 archivos
  EVIDENCIA: CoT de 5 pasos verificables
  HIPÓTESIS EXPLORADAS: 4 (1 confirmada, 1 en investigación, 2 descartadas)
  DEBATE: Fiscal ganó con evidencia de webhook post-cobro
  CVE SIMILAR: KB-2025-0089
  CONFIANZA: 0.94
  FIX: Calcular precio en backend desde catálogo, no aceptar del frontend
  REGLA CREADA: no-client-side-pricing
  GENERACIÓN: 2 (evolucionó de la generación 1)
  STATUS: ACTIVO → pendiente de fix → monitorear 30 días → EXTINTO
```

---

# MÉTRICAS DE COGNITION DEEP

```
MÉTRICAS DE EFECTIVIDAD:

  · TASA DE EXTINCIÓN: % de patrones que llegan a EXTINTO
    Target: >90% en 30 días

  · TASA DE FALSOS POSITIVOS: % de hallazgos descartados por debate
    Target: <10% (el debate adversarial debe filtrar antes de reportar)

  · PROFUNDIDAD PROMEDIO DE HOPS: cuántos archivos se trazan por hallazgo
    Target: 3-5 hops por vulnerabilidad

  · COBERTURA DE ATENCIÓN: % del codebase con peso asignado
    Target: 100% (todo tiene un peso, aunque sea 0.05)

  · TASA DE RECURRENCIA POST-FIX: % de patrones que vuelven
    Target: <5%

  · GENERACIONES POR MES: cuántas evoluciones del conocimiento
    Target: 2-4 por mes (no más, para estabilidad)

  · CALIDAD DE REFLEXIÓN: % de reflexiones que generan acción concreta
    Target: >80% (reflexiones sin acción son ruido)

  · KB HITS: % de hallazgos que matchean con un CVE/patrón en la KB
    Target: >30% (indica que la KB es útil y está siendo consultada)

  · DEBATES GANADOS POR DEFENSOR: % de veces que el debate eliminó
    un falso positivo que hubiera sido reportado sin debate
    Target: 15-25% (suficiente para justificar el costo del debate,
    no tanto que indique que el fiscal es muy impreciso)
```

---

# REGLAS INVIOLABLES DE COGNITION DEEP

```
CD1 — EVIDENCIA ANTES QUE CONCLUSIÓN
     Ningún hallazgo se reporta sin cadena de razonamiento verificable.
     Si no puedes mostrar los pasos, no puedes afirmar el resultado.

CD2 — MULTI-HOP OBLIGATORIO PARA VULNERABILIDADES
     Toda vulnerabilidad de seguridad DEBE trazarse desde el entry point
     hasta el sink. Un hallazgo en un solo archivo es incompleto.

CD3 — TREE OF THOUGHTS OBLIGATORIO PARA CONFIANZA < 0.95
     Si no estás casi seguro, explora hipótesis alternativas.
     La primera hipótesis no siempre es la correcta.

CD4 — DEBATE ADVERSARIAL OBLIGATORIO PARA CONFIANZA 0.70-0.94
     El rango de incertidumbre es donde más valor aporta la verificación.
     Un fiscal y un defensor ven cosas diferentes.

CD5 — REFLEXION DESPUÉS DE CADA SESIÓN
     Siempre reflexionar: ¿qué hice bien? ¿qué hice mal?
     ¿qué debo cambiar? La reflexión sin acción concreta es inútil.

CD6 — EVOLUTION NUNCA PIERDE CONOCIMIENTO
     Las reglas evolucionan pero nunca se borran.
     Una regla subsumida se archiva, no se elimina.

CD7 — VUL-RAG ANTES DE REPORTAR
     Siempre consultar la knowledge base antes de finalizar un hallazgo.
     Un CVE conocido como contexto hace el reporte 10x más útil.

CD8 — HONESTIDAD SOBRE INCERTIDUMBRE
     Si la confianza es < 0.5, NO reportar como hallazgo.
     Marcar como "área de investigación" y seguir adelante.
     Preferimos un falso negativo honesto a un falso positivo fabricado.

CD9 — ATTENTION MAP SE RECALCULA, NUNCA SE IGNORA
     Si el mapa dice que auth/ tiene peso 0.95, se analiza con máxima
     profundidad. No importa si "parece que está bien".
     El mapa refleja la historia real del proyecto.

CD10 — DREAMING ALIMENTA, NUNCA REEMPLAZA
      Dreaming consolida el conocimiento entre sesiones.
      Pero no reemplaza el razonamiento en vivo.
      Si Dreaming dice "este patrón es seguro" pero el análisis
      en vivo encuentra evidencia contraria → la evidencia en vivo gana.
```

---

# IMPLEMENTACIÓN CON HERRAMIENTAS ANTHROPIC

```
PILAR              IMPLEMENTACIÓN ANTHROPIC               CÓMO USARLO
──────────────────────────────────────────────────────────────────────────
① Attention         Agent Teams (asignar tareas           Crear agentes con
                    por peso de atención)                  foco en zonas específicas

② Multi-Hop         Claude 1M tokens                      Pasar contexto multi-archivo
                    (todo el proyecto en contexto)         en una sola sesión

③ Evolution         Dreaming (memoria evolutiva           Activar Dreaming como
                    entre sesiones)                        cron job nocturno

④ CoT               Extended Thinking                     Activar thinking mode
                    (razonamiento explícito)               en Claude Code

⑤ ToT               Agent Teams (múltiples                Lanzar 3-4 teammates
                    teammates con hipótesis                con hipótesis diferentes
                    diferentes)

⑥ Reflexion         Dreaming + Outcomes                   Outcomes evalúa calidad,
                    (auto-evaluación +                     Dreaming consolida
                    consolidación)                         las reflexiones

⑦ Vul-RAG           Defending Code Harness                Alimentar con CVEs del
                    (knowledge base de vulns)              proyecto + NVD

⑧ Adversarial       Agent Teams                           3 teammates: fiscal,
                    (roles adversariales)                  defensor, juez

⑨ Knowledge Graph   codebase-memory-mcp / CodeGraph       Graph como memoria
                    + token-optimizer-mcp                  persistente, 90-99%
                    + context-mode                         reducción de tokens
```

---

# PILAR ⑨ — SISTEMA CIRCULATORIO: KNOWLEDGE GRAPH + TOKEN OPTIMIZATION
## Fundamento: Graph Neural Networks + RAG + Prompt Caching
## Principio: Lo que ya sabes no se re-deriva. Lo que ya leíste no se re-lee.

> Sin este pilar, COGNITION DEEP es un cerebro brillante que se desangra.
> Cada análisis consume 200K-500K tokens. A $3-5 por análisis, 10 análisis
> por día = $30-50 diarios = $900-1,500 mensuales. INSOSTENIBLE.
>
> Con este pilar, el mismo análisis consume 15K-25K tokens.
> $0.20-0.50 por análisis. 10 por día = $2-5 diarios. VIABLE.
>
> El Knowledge Graph es el sistema circulatorio de COGNITION DEEP:
> transporta información donde se necesita sin reconstruirla cada vez.

---

## EL PROBLEMA: POR QUÉ LOS TOKENS EXPLOTAN

```
ANATOMÍA DEL DESPERDICIO DE TOKENS:

  1. RE-LECTURA DE ARCHIVOS
     Claude Code lee un archivo de 300 líneas = 5,000 tokens
     5 minutos después necesita ver la misma función
     → RE-LEE el archivo completo = otros 5,000 tokens
     En una sesión de 1 hora, el mismo archivo se lee 8-12 veces
     → 40,000-60,000 tokens en UN SOLO ARCHIVO

  2. CONTEXTO ACUMULATIVO
     Cada mensaje nuevo INCLUYE todo el historial anterior
     Mensaje 1:  5,000 tokens
     Mensaje 10: 50,000 tokens (acumulado)
     Mensaje 30: 150,000 tokens (acumulado)
     Mensaje 40: contexto AGOTADO, sesión muerta
     → Cada mensaje es más caro que el anterior

  3. OUTPUTS DE HERRAMIENTAS
     Un `git status` devuelve 2,000 tokens de output crudo
     Un `npm test` devuelve 10,000 tokens de logs
     Una consulta MCP devuelve 5,000-50,000 tokens de JSON
     → Todo se mete al contexto y NUNCA sale

  4. RE-DERIVACIÓN DE CONOCIMIENTO
     Sesión 1: Claude Code descubre que auth/ usa JWT con RS256
     (le costó leer 4 archivos = 20,000 tokens)
     Sesión 2: Claude Code necesita la misma info
     → RE-LEE los 4 archivos = otros 20,000 tokens
     → Descubre EXACTAMENTE lo mismo
     → 20,000 tokens TIRADOS A LA BASURA

  COSTO REAL MEDIDO:
  · Sin optimización: sesiones de 30 min, 200K-500K tokens
  · Con Knowledge Graph: sesiones de 3+ horas, 15K-50K tokens
  · Ahorro: 90-99% dependiendo del tamaño del proyecto
```

---

## ARQUITECTURA DEL SISTEMA CIRCULATORIO

```
┌─────────────────────────────────────────────────────────┐
│                  COGNITION DEEP                          │
│                                                         │
│  Los 8 pilares consumen tokens para razonar.             │
│  El Pilar ⑨ OPTIMIZA ese consumo.                       │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │         KNOWLEDGE GRAPH (SQLite)             │        │
│  │                                             │        │
│  │  Nodos:                                     │        │
│  │  · Archivos, funciones, clases, variables   │        │
│  │  · Endpoints, rutas, middlewares            │        │
│  │  · Tests, fixtures, mocks                   │        │
│  │                                             │        │
│  │  Relaciones (edges):                        │        │
│  │  · CALLS (función A llama a función B)      │        │
│  │  · IMPORTS (archivo A importa archivo B)    │        │
│  │  · HTTP_CALLS (endpoint A llama API B)      │        │
│  │  · IMPLEMENTS (clase implementa interface)  │        │
│  │  · INHERITS (clase hereda de otra)          │        │
│  │  · READS/WRITES (función accede a tabla)    │        │
│  │  · VALIDATES (middleware valida request)     │        │
│  │                                             │        │
│  │  Hallazgos (findings):                      │        │
│  │  · Decisiones tomadas en sesiones previas   │        │
│  │  · Vulnerabilidades encontradas y fixes     │        │
│  │  · Callejones sin salida (dead ends)        │        │
│  │  · Patrones aprendidos por COGNITION        │        │
│  │                                             │        │
│  │  COSTO: 150 tokens por consulta al graph    │        │
│  │  VS: 5,000-50,000 tokens leyendo archivos   │        │
│  └─────────────────────────────────────────────┘        │
│                          │                               │
│         ┌────────────────┼────────────────┐              │
│         ▼                ▼                ▼              │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐        │
│  │ ATTENTION  │  │  MULTI-HOP  │  │  VUL-RAG  │        │
│  │ Consulta   │  │  Traza en   │  │  Consulta │        │
│  │ pesos del  │  │  graph, no  │  │  KB en    │        │
│  │ graph, no  │  │  leyendo    │  │  graph,   │        │
│  │ leyendo    │  │  archivos   │  │  no re-   │        │
│  │ archivos   │  │  completos  │  │  derivando│        │
│  │ 2K tokens  │  │  1K tokens  │  │  1K tokens│        │
│  └────────────┘  └─────────────┘  └───────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘


COMPARACIÓN DE COSTOS POR PILAR:

  PILAR              SIN GRAPH          CON GRAPH        AHORRO
  ──────────────────────────────────────────────────────────────
  ① Attention Map     100K tokens       2K tokens        98%
  ② Multi-Hop Trace   40K tokens        1K tokens        97%
  ④ Chain of Thought  20K tokens        5K tokens        75%
  ⑤ Tree of Thoughts  80K tokens        10K tokens       87%
  ⑦ Vul-RAG           20K tokens        1K tokens        95%
  ⑧ Adversarial       150K tokens       15K tokens       90%
  ⑥ Reflexion         10K tokens        3K tokens        70%
  ──────────────────────────────────────────────────────────────
  TOTAL POR ANÁLISIS  ~420K tokens      ~37K tokens      91%
  COSTO ESTIMADO      ~$4.00            ~$0.35           91%
```

---

## LAS 3 CAPAS DEL SISTEMA CIRCULATORIO

### CAPA 9A — KNOWLEDGE GRAPH (memoria estructural)

```
QUÉ ES:
  Un grafo de conocimiento que mapea TODA la estructura de tu proyecto:
  qué funciones existen, quién llama a quién, qué importa qué,
  qué endpoints exponen qué datos, qué tests cubren qué código.

CÓMO SE CONSTRUYE:
  1. tree-sitter parsea CADA archivo del proyecto
  2. Extrae: funciones, clases, imports, exports, calls
  3. Construye relaciones: A llama a B, C importa D
  4. Almacena en SQLite local (graph.db)
  5. Se actualiza AUTOMÁTICAMENTE cuando el código cambia

HERRAMIENTAS:
  · codebase-memory-mcp (reporta 99.2% reducción)
    github.com/DeusData/codebase-memory-mcp
  · CodeGraph (reporta 60% menos costo, 69% menos tokens)
    github.com/colbymchenry/codegraph
  · token-optimizer-mcp (95%+ reducción con graph + cache + compresión)
    github.com/ooples/token-optimizer-mcp

QUERIES QUE EL GRAPH RESUELVE EN 150 TOKENS
(vs 50,000 tokens leyendo archivos):

  get_architecture()      → visión general del proyecto
  get_callers("fn")       → quién llama a esta función
  get_callees("fn")       → a quién llama esta función
  trace_path("A", "B")    → cómo se conectan A y B
  get_function_body("fn") → código de UNA función específica
  find_endpoints()        → todos los endpoints HTTP
  find_db_queries()       → todas las queries a base de datos
  find_auth_checks()      → dónde se verifica autenticación

EJEMPLO CONCRETO:

  SIN GRAPH (Multi-Hop Tracing):
    "¿Quién llama a execute_query()?"
    → Claude lee database.py (8K tokens)
    → Claude lee user_service.py (6K tokens)
    → Claude lee payment_service.py (7K tokens)
    → Claude lee admin_service.py (5K tokens)
    → Respuesta: "user_service y payment_service la llaman"
    → COSTO: 26,000 tokens

  CON GRAPH (Multi-Hop Tracing):
    "¿Quién llama a execute_query()?"
    → Claude consulta: get_callers("execute_query")
    → Graph responde: [{caller: "user_service.search", line: 28},
                        {caller: "payment_service.charge", line: 42}]
    → COSTO: 150 tokens

  MISMO RESULTADO. 173x MÁS BARATO.
```

### CAPA 9B — CONTEXT SANDBOX (protección del contexto)

```
QUÉ ES:
  Un sandbox que intercepta outputs grandes de herramientas
  (MCP responses, logs de tests, git diffs) y los INDEXA
  en vez de meterlos crudos al contexto.

CÓMO FUNCIONA:
  1. Una herramienta MCP devuelve 10,000 tokens de JSON
  2. SIN sandbox: los 10,000 tokens entran al contexto
     y se quedan ahí PARA SIEMPRE en la sesión
  3. CON sandbox: los 10,000 tokens se indexan
     Claude recibe un resumen de 200 tokens
     Si necesita un detalle específico, consulta el índice

HERRAMIENTA:
  · context-mode MCP
    Reporta 90-98% reducción en outputs de herramientas

EJEMPLO:

  SIN CONTEXT SANDBOX:
    Claude corre `npm test`
    → Output: 15,000 tokens de logs
    → TODO entra al contexto
    → Los siguientes 20 mensajes pagan por esos 15,000 tokens

  CON CONTEXT SANDBOX:
    Claude corre `npm test`
    → Output: 15,000 tokens de logs
    → Sandbox indexa e inyecta resumen: "47 tests passed, 2 failed:
      test_auth_login (assertion error line 42), test_payment_refund
      (timeout after 5s)"
    → Resumen: 50 tokens
    → Si Claude necesita el stack trace del fallo: consulta sandbox

  AHORRO: 99.7% en este ejemplo
```

### CAPA 9C — COMPRESIÓN Y CACHE NATIVO

```
QUÉ ES:
  Estrategias para reducir tokens SIN herramientas adicionales.
  Son hábitos y configuraciones del propio Claude Code.

ESTRATEGIA 1: /compact (oficial Anthropic)
  · Comprime 10,000-20,000 tokens de historial a 1,000-3,000
  · Preserva el contexto accionable, descarta la conversación
  · USAR entre tareas (como hacer "git commit" del contexto)
  · Comando: /compact

ESTRATEGIA 2: CLAUDE.md mínimo
  · Tu CLAUDE.md se carga en CADA mensaje de CADA sesión
  · Un CLAUDE.md de 5,000 tokens = 5,000 tokens de baseline constante
  · TARGET: CLAUDE.md < 2,000 tokens
  · Las reglas detalladas van en archivos separados que el graph indexa
  · CLAUDE.md solo tiene las reglas ESENCIALES y punteros a los detalles

ESTRATEGIA 3: Prompt Caching nativo de Anthropic
  · Anthropic cachea automáticamente los prefijos estables del contexto
  · Para que funcione: no cambiar CLAUDE.md entre mensajes,
    no reordenar archivos, no tomar breaks largos mid-sesión
  · Reducción: hasta 90% en tokens repetidos
  · Es GRATIS — solo hay que no romper el cache

ESTRATEGIA 4: Sesiones cortas y focalizadas
  · Sesión larga (2h, 100 mensajes) = contexto acumulativo explosivo
  · Mejor: 4 sesiones de 30 min con /compact entre cada una
  · Cada sesión empieza "limpia" pero con el graph como memoria
  · El graph persiste entre sesiones SIN costo de contexto

ESTRATEGIA 5: RTK (Rust Token Killer)
  · Hook que comprime outputs de bash antes de que entren al contexto
  · Un `git status` de 2,000 tokens → 200 tokens de señal útil
  · Un `cargo test` de 10,000 tokens → 500 tokens de resultados
```

---

## INTEGRACIÓN GRAPH ↔ COGNITION DEEP: FLUJO COMPLETO

```
SESIÓN NUEVA EN UN PROYECTO:

  1. Claude Code entra al proyecto
     │
  2. Lee CLAUDE.md (< 2,000 tokens, reglas esenciales)
     │
  3. Consulta Knowledge Graph:
     │  · get_architecture() → visión general (500 tokens)
     │  · get_findings() → hallazgos previos de COGNITION (300 tokens)
     │  · get_attention_map() → pesos de atención actuales (200 tokens)
     │  · get_extinctions() → patrones ya extintos (100 tokens)
     │
     │  TOTAL de "ponerse al día": ~1,100 tokens
     │  SIN graph: re-leer todo = 100,000-500,000 tokens
     │
  4. COGNITION DEEP ejecuta los 8 pilares usando el graph:
     │  · Attention consulta pesos del graph, no lee archivos
     │  · Multi-Hop traza en el graph, no abriendo archivos
     │  · Vul-RAG consulta la KB indexada en el graph
     │  · Adversarial debate con contexto del graph (preciso y pequeño)
     │
  5. Hallazgos nuevos se GUARDAN en el graph:
     │  · Nuevos findings (150 tokens cada uno)
     │  · Nuevas reglas creadas
     │  · Nuevos patrones aprendidos
     │  · Updates al attention map
     │
  6. /compact entre tareas (comprimir historial)
     │
  7. Fin de sesión → graph persiste TODO
     │
  8. Dreaming consolida reflexiones → actualiza CLAUDE.md
     │
  9. Próxima sesión: PASO 1 otra vez, pero el graph tiene
     TODO lo anterior. El agente NUNCA empieza de cero.


EL GRAPH ES LA SANGRE DEL SISTEMA:
  · Transporta conocimiento entre pilares (sin re-derivar)
  · Transporta conocimiento entre sesiones (sin re-leer)
  · Transporta conocimiento entre agentes (shared memory)
  · Reduce el costo de CADA operación de COGNITION DEEP
  · Sin el graph, COGNITION DEEP es brillante pero carísimo
  · Con el graph, COGNITION DEEP es brillante Y sostenible
```

---

## MÉTRICAS DEL SISTEMA CIRCULATORIO

```
  · TOKENS POR SESIÓN: target < 50K (vs 200K-500K sin graph)
  · CACHE HIT RATE: target > 80% (consultas resueltas por graph)
  · GRAPH FRESHNESS: < 5 min desde último cambio de código
  · RE-READS: target 0 (nunca re-leer un archivo ya indexado)
  · CONTEXT OVERFLOW: target 0 (nunca agotar contexto)
  · COSTO POR ANÁLISIS: target < $0.50 (vs $3-5 sin graph)
  · SESIONES POR DÍA: target 8-12 (vs 2-3 sin graph)
```

---

# INSTALACIÓN PASO A PASO

## Requisitos previos
```
  · Claude Code instalado (npm install -g @anthropic-ai/claude-code)
  · Node.js >= 18
  · Un proyecto con código fuente
```

## Paso 1 — Instalar Knowledge Graph

```bash
# Opción A: codebase-memory-mcp (recomendado, 99% reducción)
# Dentro de Claude Code, ejecutar:
/plugin marketplace add DeusData/codebase-memory-mcp
/plugin install codebase-memory@codebase-memory
/reload-plugins

# Opción B: CodeGraph (60% reducción, auto-sync)
# Dentro de Claude Code:
/plugin marketplace add colbymchenry/codegraph
/plugin install codegraph@codegraph
/reload-plugins

# Opción C: token-optimizer-mcp (95% reducción, incluye graph + cache)
# Dentro de Claude Code:
/plugin marketplace add ooples/token-optimizer-mcp
/plugin install token-optimizer@token-optimizer
/reload-plugins
```

## Paso 2 — Indexar tu proyecto

```bash
# Dentro de Claude Code, una vez instalado el plugin:
# Pedirle a Claude que indexe el proyecto:

"Indexa todo el codebase en el knowledge graph.
 Mapea todas las funciones, clases, imports,
 endpoints, queries a BD, y relaciones entre archivos."

# Esto genera graph.db en tu proyecto
# Se ejecuta UNA VEZ, luego se auto-actualiza con cambios
```

## Paso 3 — Instalar Context Sandbox (opcional pero recomendado)

```bash
# Instala context-mode para sandboxear outputs grandes
/plugin marketplace add contextmode/context-mode
/plugin install context-mode@context-mode
/reload-plugins
```

## Paso 4 — Crear hooks para forzar uso del graph

```bash
# Crear archivo: .claude/hooks/preToolUse.js
# Este hook intercepta lecturas de archivos y redirige al graph

mkdir -p .claude/hooks
```

```javascript
// .claude/hooks/preToolUse.js
// Fuerza a Claude Code a usar el graph en vez de leer archivos crudos
export default {
  name: "graph-first",
  description: "Redirect file reads to knowledge graph when possible",
  hooks: {
    PreToolUse: async (event) => {
      // Si Claude intenta leer un archivo que el graph ya conoce
      // redirigir a consulta del graph
      if (event.tool_name === "Read" || event.tool_name === "Grep") {
        return {
          decision: "suggest",
          message: "El knowledge graph tiene esta información indexada. " +
                   "Usa get_architecture(), get_callers(), o trace_path() " +
                   "del graph en vez de leer el archivo completo. " +
                   "Solo lee el archivo si necesitas el código EXACTO de una función específica."
        };
      }
      return { decision: "allow" };
    }
  }
};
```

## Paso 5 — Configurar /compact como hábito

```bash
# Agregar a tu CLAUDE.md:
echo '
## Regla de tokens
- Usar /compact después de completar cada tarea
- Consultar el knowledge graph ANTES de leer archivos
- Si el graph tiene la info, NO leer el archivo
- Mantener este CLAUDE.md < 2,000 tokens
' >> CLAUDE.md
```

## Paso 6 — Verificar que funciona

```bash
# Dentro de Claude Code, probar:

# 1. Verificar que el graph está activo
"¿Cuál es la arquitectura general del proyecto?"
# Debe responder usando el graph, NO leyendo archivos

# 2. Verificar Multi-Hop via graph
"¿Quién llama a la función [nombre_de_funcion]?"
# Debe usar get_callers(), NO grep

# 3. Verificar ahorro de tokens
claude --verbose
# El flag --verbose muestra tokens por mensaje
# Comparar antes y después de instalar el graph

# 4. Verificar /compact
/compact
# Debe comprimir el historial sin perder contexto útil
```

## Paso 7 — Monitorear costos

```bash
# Instalar claude-hud para ver tokens en tiempo real
/plugin marketplace add jasonjmcghee/claude-hud
/plugin install claude-hud@claude-hud
/reload-plugins

# Ahora verás en tu terminal:
# [tokens: 12,450 | cost: $0.12 | cache: 87%]
# En cada mensaje, sabes cuánto estás gastando
```

---

```
COGNITION DEEP · Motor Cognitivo Profundo · v1.1
9 Pilares Científicos · Stack-agnostic · Nivel Gubernamental
Integrado con: FORTRESS Framework · CLAUDE.md · Dreaming (Anthropic)

Papers fundacionales:
  Vaswani et al. 2017 · Yang et al. 2018 · Kaplan et al. 2020
  Wei et al. 2022 · Yao et al. 2023 · Shinn et al. 2023
  Vul-RAG 2024 · VulTrial 2026

Herramientas del Sistema Circulatorio:
  codebase-memory-mcp · CodeGraph · token-optimizer-mcp
  context-mode · RTK · claude-hud · /compact

Clasificación: MÁXIMA SEGURIDAD · INTERNO ABSOLUTO
NO COMMITEAR · NO PUSHEAR · NO SUBIR · NO COMPARTIR
SOLO VIVE EN LA RAÍZ LOCAL DEL OPERADOR
```
