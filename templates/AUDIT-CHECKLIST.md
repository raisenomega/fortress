<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# AUDIT-CHECKLIST — Verificación Pre-Producción
## Las 43 Capas de FORTRESS · Checklist Ejecutable
### Versión 1.0 · Agosto 2026
### Usar antes de CADA deploy a producción

```
INSTRUCCIONES:
  1. Copiar este archivo para cada deploy
  2. Renombrar: AUDIT_[fecha]_[proyecto].md
  3. Marcar cada item con [x] cuando esté verificado
  4. Si un CRITICAL no está marcado → NO DEPLOYAR
  5. Archivar el checklist completado como evidencia

NIVELES:
  🔴 CRITICAL  — si no cumple, NO se deploya. Sin excepciones.
  🟠 HIGH      — debe cumplir. Excepciones requieren aprobación escrita.
  🟡 MEDIUM    — debería cumplir. Documentar si no aplica.
  🟢 LOW       — recomendado. Resolver en próximo sprint.
  🔵 INFO      — informativo. No bloquea.
```

---

## DATOS DEL DEPLOY

```
Proyecto:       ___________________________________
Fecha:          ___________________________________
Versión:        ___________________________________
Branch:         ___________________________________
Responsable:    ___________________________________
Aprobado por:   ___________________________________
FORTRESS Score: _______ / 100
Veredicto:      APROBADO / RECHAZADO / CONDICIONAL
```

---

## PILAR I — SENTINEL: Infraestructura y Código

### Capa S1 — Infraestructura

```
🔴 [ ] S1.1  Archivos de configuración críticos tienen hash SHA-256 registrado
🔴 [ ] S1.2  TODAS las tablas con datos de usuario tienen RLS o equivalente
🔴 [ ] S1.3  TODAS las variables de entorno requeridas están presentes
🟠 [ ] S1.4  Certificado SSL válido con >30 días de vida
🟠 [ ] S1.5  Cron jobs / workers críticos están corriendo
🟡 [ ] S1.6  Monitoreo de costos/consumo configurado
```

### Capa S2 — Auditoría de Código

```
🔴 [ ] S2.4  CERO secrets hardcodeados en todo el codebase (Gitleaks verificó)
🟠 [ ] S2.1  No hay archivos >300 líneas sin justificación
🟠 [ ] S2.2  Dependencias fluyen en la dirección correcta (no circular)
🟠 [ ] S2.5  No hay eval(), exec(), @ts-ignore sin justificación
🟠 [ ] S2.6  Cobertura de tests >80% en lógica crítica
🟡 [ ] S2.3  Solo proveedores autorizados importados
```

### Capa S3 — Red y HTTP

```
🔴 [ ] S3.2a Strict-Transport-Security presente (HSTS)
🔴 [ ] S3.2b Content-Security-Policy presente (CSP)
🔴 [ ] S3.2c X-Frame-Options: DENY
🔴 [ ] S3.2d X-Content-Type-Options: nosniff
🟠 [ ] S3.1  Rate limiting activo en endpoints de auth (3-5/min)
🟠 [ ] S3.1  Rate limiting activo en endpoints de registro (3/min)
🟠 [ ] S3.1  Rate limiting activo en API general (100-200/min)
🟠 [ ] S3.3  Headers Server y X-Powered-By removidos o vacíos
🟡 [ ] S3.2e Referrer-Policy configurado
🟡 [ ] S3.2f Permissions-Policy configurado
🟡 [ ] S3.2g Cache-Control: no-store en páginas con datos sensibles
🟡 [ ] S3.5  Monitoreo de latencia anómala configurado
```

### Capa S4 — Dependencias y CVEs

```
🔴 [ ] S4.1  CERO dependencias con CVEs CRITICAL (Trivy verificó)
🔴 [ ] S4.3  CERO secrets en historial Git (TruffleHog/Gitleaks)
🟠 [ ] S4.1  CERO dependencias con CVEs HIGH
🟠 [ ] S4.2  SAST pasó sin errores CRITICAL (Semgrep/CodeQL)
🟡 [ ] S4.4  Integridad de paquetes verificada (checksums)
```

### Capa S5 — Secrets

```
🔴 [ ] S5.1  NINGÚN secret en código, repos, ni logs
🔴 [ ] S5.2  Secrets almacenados en vault/env vars, NO en código
🟠 [ ] S5.3  Secrets dentro de fecha de rotación vigente
🟡 [ ] S5.4  Log de rotación actualizado
```

### Capa S6 — Base de Datos

```
🔴 [ ] S6.1  RLS activo en TODA tabla con datos de usuario
🔴 [ ] S6.2  Rol de servicio NO expuesto al frontend
🔴 [ ] S6.5  SSL/TLS obligatorio para conexiones a BD
🟠 [ ] S6.3  No hay queries sin WHERE en tablas grandes
🟠 [ ] S6.4  Backup automático diario verificado
🟠 [ ] S6.5  Datos ultra-sensibles (PII, financieros) encriptados a nivel campo
🟡 [ ] S6.3  Queries lentas (>1s) identificadas y optimizadas
```

### Capa S7 — Resiliencia

```
🟠 [ ] S7.1  No hay single point of failure en servicios críticos
🟠 [ ] S7.2  Fallbacks configurados para servicios externos
🟠 [ ] S7.3  Circuit breaker implementado para APIs externas
🟡 [ ] S7.4  Graceful degradation: sistema funciona si IA/payment cae
```

### Capa S8 — Chaos y Pentesting

```
🟡 [ ] S8.1  Pentesting interno ejecutado este trimestre
🟡 [ ] S8.2  Simulación de fallo de BD exitosa
🔵 [ ] S8.3  Red team exercise ejecutado este año
```

### Capa S9 — Observabilidad

```
🟠 [ ] S9.1  Exception tracking activo (Sentry o similar)
🟠 [ ] S9.2  Logs estructurados sin datos sensibles
🟡 [ ] S9.3  Frontend error reporting activo
🟡 [ ] S9.5  Dashboard de estado visible para el equipo
```

### Capa S10 — Performance

```
🟠 [ ] S10.1 Latencia p95 <1s en endpoints principales
🟡 [ ] S10.2 No hay slow queries sin plan de optimización
🟡 [ ] S10.4 CPU <80%, memoria <85%, disco <90%
🔵 [ ] S10.3 Bundle frontend <800KB
```

### Capa S11 — Integraciones

```
🟠 [ ] S11.2 Tokens OAuth con auto-refresh implementado
🟠 [ ] S11.4 Último deploy exitoso verificado
🟡 [ ] S11.1 Webhooks procesándose correctamente
🟡 [ ] S11.3 Health check de servicios externos activo
```

### Capa S12 — Agentes IA (si aplica)

```
🟠 [ ] S12.1 Success rate >95% en últimas 24h
🟠 [ ] S12.4 Guardrails de IA activos y verificados
🟡 [ ] S12.3 Costo por agente dentro de límites
🔵 [ ] S12.2 Feedback loop activo y midiendo accuracy
```

---

## PILAR II — GUARDIAN: Comportamiento Humano

### Capa G1 — Zero Trust

```
🔴 [ ] G1.1  Token/sesión verificado en CADA request autenticado
🔴 [ ] G1.1  Usuario suspendido/baneado NO puede acceder
🔴 [ ] G1.3  Cada endpoint verifica rol ANTES de ejecutar
🟠 [ ] G1.2  Señales contextuales registradas (IP, user agent, país)
🟡 [ ] G1.3  Principio de mínimo privilegio implementado
```

### Capa G2 — Behavioral

```
🟡 [ ] G2.1  Baseline de comportamiento por usuario definido
🟡 [ ] G2.2  Detección de anomalías configurada
🔵 [ ] G2.3  ML para anomaly detection (si hay volumen suficiente)
```

### Capa G3 — Semantic Firewall (si tiene IA)

```
🟠 [ ] G3.1  Detección de prompt injection activa
🟠 [ ] G3.3  Output filtering para contenido peligroso
🟡 [ ] G3.2  Protección contra data extraction
🟡 [ ] G3.4  Rate limiting semántico implementado
```

### Capa G4 — Multi-tenant (si aplica)

```
🔴 [ ] G4.2  Aislamiento de datos entre tenants verificado
🟠 [ ] G4.1  Correlación cross-tenant para ataques coordinados
🟡 [ ] G4.3  Rate limiting por tenant
```

### Capa G5-G6 — Threat Score y Respuesta

```
🟠 [ ] G5.1  Threat score implementado con decay
🟠 [ ] G6    Respuesta proporcional: observar → friccionar → restringir → contener
🟡 [ ] G5.2  Umbrales calibrados (30/60/85/95)
```

### Capa G7-G8 — Memoria y Forensics

```
🟠 [ ] G7.1  Historial de incidentes persistente
🟡 [ ] G7.2  IP watchlist actualizada
🟡 [ ] G8.1  Protocolo forense definido para incidentes CRITICAL
🔵 [ ] G8.2  Formato de exportación legal preparado
```

---

## PILAR III — HERMES: Conectividad Externa

### Capas H1-H6

```
🟠 [ ] H1    Health check de cada servicio externo (cada 5 min)
🟠 [ ] H2    Tokens OAuth auto-refresh verificado (cada 30 min)
🟠 [ ] H3    Alertas de cuota configuradas (70%, 85%, 95%)
🟡 [ ] H4    Cuentas OAuth de usuarios monitoreadas (cada 6h)
🟡 [ ] H5    Validación de schema de respuestas de APIs (cada 12h)
🔵 [ ] H6    Dashboard de costo por servicio externo
```

---

## PILAR IV — SHIELD: Superficie Externa

### Capas E1-E10

```
🔴 [ ] E1    HTTPS forzado, TLS 1.2+, HSTS configurado
🔴 [ ] E2    Headers de seguridad presentes (CSP, X-Frame, etc.)
🟠 [ ] E3    Versiones de software no expuestas públicamente
🟠 [ ] E7    No hay emails del dominio en brechas conocidas
🟠 [ ] E8    .git/, .env, backups NO accesibles públicamente
🟡 [ ] E4    Subdominios shadow IT identificados y asegurados
🟡 [ ] E9    SPF, DKIM, DMARC configurados
🟡 [ ] E10   Dependencias de terceros mapeadas
🔵 [ ] E5    Servicios expuestos auditados (Shodan/Censys)
🔵 [ ] E6    Versiones cruzadas con CVE/NVD
```

---

## PILAR V — COGNITION: Aprendizaje

### Estado Cognitivo

```
🟠 [ ] C1    COGNITION-LOG.md existe y tiene patrones registrados
🟠 [ ] C2    Attention map actualizado con datos del último scan
🟡 [ ] C3    Patrones ACTIVE tienen plan de resolución
🟡 [ ] C4    Generación actual > 0 (el sistema aprendió algo)
🟡 [ ] C5    Última reflexión de sesión tiene <7 días
🔵 [ ] C6    Dreaming consolidó en los últimos 7 días
🔵 [ ] C7    FORTRESS Score mejorando vs. semana anterior
```

---

## KNOWLEDGE GRAPH Y TOKENS

```
🟠 [ ] KG1   Knowledge Graph instalado e indexado
🟠 [ ] KG2   .mcp.json en .gitignore
🟡 [ ] KG3   Graph actualizado con últimos cambios de código
🟡 [ ] KG4   claude-hud instalado para monitorear tokens
🔵 [ ] KG5   Sessions usando <50K tokens promedio
```

---

## CI/CD Y AUTOMATIZACIÓN

```
🔴 [ ] CI1   Pre-commit hook activo (Gitleaks)
🔴 [ ] CI2   CI pipeline corre en cada push/PR
🟠 [ ] CI3   SAST (Semgrep/Trivy) en CI con quality gates
🟠 [ ] CI4   Claude Code Action revisando PRs (si GitHub)
🟡 [ ] CI5   Routines programadas (security, cleanup, dreaming)
🟡 [ ] CI6   Dependency scan semanal automatizado
🔵 [ ] CI7   Defending Code Harness ejecutado este mes
```

---

## DOCUMENTACIÓN

```
🔴 [ ] D1    CLAUDE.md presente en la raíz del proyecto
🟠 [ ] D2    ARCHITECTURE.md actualizado con datos reales
🟠 [ ] D3    .env.example actualizado (sin valores reales)
🟠 [ ] D4    README.md con instrucciones de setup
🟡 [ ] D5    COGNITION-LOG.md con baseline de patrones
🟡 [ ] D6    Agentes instalados en .claude/agents/
🔵 [ ] D7    FORTRESS.md presente en raíz local (no en repo)
🔵 [ ] D8    COGNITION_DEEP.md presente en raíz local
```

---

## CONTEO FINAL

```
NIVEL       TOTAL    CUMPLIDOS    PENDIENTES    % CUMPLIMIENTO
─────────────────────────────────────────────────────────────────
CRITICAL    ___      ___          ___           ___%
HIGH        ___      ___          ___           ___%
MEDIUM      ___      ___          ___           ___%
LOW         ___      ___          ___           ___%
INFO        ___      ___          ___           ___%
─────────────────────────────────────────────────────────────────
TOTAL       ___      ___          ___           ___%

REGLA DE DEPLOY:
  🔴 CRITICAL:  100% cumplimiento obligatorio para deployar
  🟠 HIGH:      95%+ cumplimiento recomendado
  🟡 MEDIUM:    Documentar excepciones
  🟢 LOW:       Trackear en backlog
  🔵 INFO:      Sin impacto en decisión de deploy
```

---

## VEREDICTO

```
[ ] APROBADO — Todos los CRITICAL cumplidos. Score ≥95.
               Autorizado para deploy a producción.

[ ] CONDICIONAL — Todos los CRITICAL cumplidos, pero HIGH pendientes.
                  Deploy autorizado con plan de resolución en <48h.
                  Listar pendientes:
                  · _______________________________________________
                  · _______________________________________________
                  · _______________________________________________

[ ] RECHAZADO — CRITICAL(s) sin cumplir. NO deployar.
                Listar blockers:
                · _______________________________________________
                · _______________________________________________
                · _______________________________________________


Firma del responsable:     ___________________________________
Fecha de verificación:     ___________________________________
Próxima auditoría:         ___________________________________
```

---

## HISTORIAL DE AUDITORÍAS

```
FECHA          PROYECTO       SCORE    VEREDICTO     BLOCKERS
──────────────────────────────────────────────────────────────
(registrar cada auditoría completada)
```

---

```
AUDIT-CHECKLIST · Verificación Pre-Producción · v1.0
43 capas de FORTRESS + Knowledge Graph + CI/CD + Documentación
Usar antes de CADA deploy · Archivar como evidencia
Compatible con SOC 2, ISO 27001, NIST CSF para auditorías
```
