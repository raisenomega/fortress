# Superficie externa

La vista para auditar cómo ve el mundo el sitio del proyecto desde fuera:
headers de seguridad, TLS, cookies, CORS, rutas expuestas. La cabecera lo
deja claro — mira, no ataca; solo lectura, sin volumen ni cargas que rompan
nada. Es la superficie del flujo de postura.

**Nombre interno del view:** `exposicion`. **Componente principal:** la
vista de superficie externa. **Etiqueta en el sidebar:** "Superficie
externa".

## Ubicación en la navegación

Botón "Superficie externa" en el cuerpo del sidebar.

## Estructura principal

- **Cabecera:** el propósito explícito ("revisa tu sitio desde fuera y te
  dice qué puertas cerrar; solo lectura").
- **Formulario:** la URL a auditar, la confirmación de propiedad y la
  profundidad del escaneo.
- **Resultado:** los hallazgos de la corrida, con su severidad y detalle.

## Elementos interactivos

- **Campo de URL** y **confirmación de propiedad:** el escaneo no arranca
  sin declarar el sitio como propio ("FORTRESS solo revisa lo que es
  tuyo").
- **Selector de profundidad:** cuatro niveles que amplían COBERTURA, no
  intensidad (más profundidad mira más sitios, no golpea más fuerte).
- **Disparo de la auditoría:** ejecuta la corrida, tras pasar los tres
  guards (propiedad, esquema web, resolución segura anti-rebinding).

## Estados de la vista

- **Inicial:** solo el formulario; sin resultados.
- **Rechazo por guard:** un aviso de error si falta la confirmación de
  propiedad, el esquema no es web, o el host resuelve a una IP privada.
- **Con resultado:** los hallazgos de la corrida.
- **Efímera por diseño:** no hay historial. Cada corrida sobrescribe la
  anterior; al cambiar de vista, el resultado se pierde (posture es
  diagnóstico ahora, no bitácora).

## Flujos que dispara

- La auditoría completa, sus guards y límites →
  [FLOWS/POSTURE](../FLOWS/POSTURE.md).

## Datos que muestra

- El resultado de la corrida — que vive en el estado de la vista, NO en la
  base. Postura no persiste (ver el flujo).

## Canales IPC usados

- `posture:run` — la auditoría, bajo la guardia de corrida del sistema.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [FLOWS/POSTURE](../FLOWS/POSTURE.md) — los tres guards, la protección
  anti-rebinding y por qué no persiste.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el modelo de amenazas de la
  superficie externa.
- [GLOSSARY](../GLOSSARY.md) — SSRF, superficie externa.
