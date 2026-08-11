# Flujo: auditoría de superficie externa (posture)

FORTRESS puede auditar la superficie externa de un proyecto — los dominios
y URLs que expone a internet — verificando headers de seguridad,
configuración TLS, cookies, CORS y exposición de rutas. Es el flujo que más
cerca opera del modelo de amenazas: dispara peticiones contra sistemas
externos reales, así que sus guards son estrictos por diseño y se aplican
ANTES de tocar la red. Este documento describe qué es, qué verifica y con
qué salvaguardas.

## Qué es posture — escáner mecánico de solo lectura

Posture NO es un agente LLM, pese al identificador interno del scanner que
incluye "claude" por razones históricas. Hoy el scanner ejecuta lectura
mecánica: fetch de la raíz de la URL, seguimiento controlado de redirects
HTTP, sondeo de rutas conocidas. **Cero tokens, cero prompt, cero
invocación a la API de Anthropic.**

El dominio interpreta los datos crudos (headers, certificado, cuerpo de
respuesta truncado) y produce hallazgos más un score, con reglas
deterministas en código puro. El coste de una corrida es de TIEMPO (I/O de
red), no de tokens. La guardia de corrida protege el handler contra clics
accidentales concurrentes, pero no hay presupuesto de tokens que consumir.

Y una regla de fondo, citada del código: "leer si la puerta cede, no
derribarla." Posture observa; no manda nada que modifique el sistema
auditado.

## Cobertura por profundidad

Cuatro niveles que amplían COBERTURA, no intensidad — cita del código:
"más profundidad = mira MÁS sitios, no golpea más fuerte; la intensidad no
existe a propósito".

| Profundidad | Familias que activa |
|---|---|
| baja | headers, tls |
| media | headers, tls, cookies, cors |
| alta | headers, tls, cookies, cors, exposed |
| ultra | headers, tls, cookies, cors, exposed, recon |

Un posture-ultra no hace peticiones más agresivas que un posture-baja:
hace MÁS peticiones en más rutas. El principio de diseño es "no forzar,
solo observar más".

## Las 6 familias de check

1. **headers** — presencia y configuración de headers HTTP de seguridad
   (HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy,
   Permissions-Policy).
2. **tls** — HTTPS disponible y el redirect de HTTP a HTTPS.
3. **cookies** — flags de seguridad (Secure, HttpOnly, SameSite) en las
   cookies que la respuesta expone.
4. **cors** — configuración CORS (origen permisivo, comodín).
5. **exposed** — rutas o archivos que no deberían ser accesibles desde
   fuera.
6. **recon** — reconocimiento pasivo (banners, versiones y tecnologías
   detectables sin forzar nada).

Nota: DNS no es una familia de check. Las verificaciones DNS-relacionadas
(validación de host, resolución antes del fetch) son GUARDS previos al
escaneo, no parte del escaneo — ver abajo.

## Diagrama del flujo

```
 Operador dispara posture (vista del proyecto)
      |
      v
 [Guard 1: ¿el operador declaro el target como propio?]
      |
      +--- no --> rechazo, sin tocar la red
      |
      v
 [Guard 2: ¿es una direccion web (http/https)?]
      |
      +--- no --> rechazo (esquemas no-web fuera)
      |
      v
 [Guard 3: resolver DNS y ¿alguna IP es privada?]
      |
      +--- si --> rechazo (SSRF a host interno)
      |
      v
 [Escaneo mecanico: fetch raiz + redirect + rutas segun profundidad]
      |    (timeout duro, cuerpo truncado, solo GET/HEAD)
      v
 [El dominio interpreta: hallazgos + score]
      |
      v
 Resultado devuelto a la vista (efimero: no se persiste)
```

## Guards en orden estricto — el núcleo de este flujo

Los tres se aplican EN ESTE ORDEN antes de que salga cualquier petición. Si
cualquiera rechaza, no hay fetch.

### Guard 1 — Confirmación de propiedad

Antes de tocar la red se verifica que el operador declaró el target como
propio. Mensaje del sistema, literal: **"FORTRESS solo revisa lo que es
tuyo."**

Un escáner de postura que dispara sobre lo que el operador no reclamó como
suyo es un bot de reconocimiento, no una herramienta de auditoría. La
confirmación es la línea que separa uno de otro.

### Guard 2 — Validación de esquema

Solo se aceptan `http://` y `https://`. Cualquier otro esquema (file, ftp,
javascript, gopher…) se rechaza.

Historia de origen: hubo que endurecer el parser porque anteponer
`https://` a un target `file://...` lo colaba como si fuera una dirección
web. Un esquema explícito no-web ahora se detecta y se rechaza antes de
normalizar. Posture es un escáner web: otros esquemas no aplican y solo
abrirían superficie.

### Guard 3 — Resolución segura contra DNS-rebinding

La capa más fina del sistema. El Guard 2 solo ve el TEXTO del host: un
dominio público cuyo registro DNS apunte a una IP interna lo atravesaría.
Por eso se resuelve el DNS y se examina la IP real, rechazando si CUALQUIERA
es privada:

- loopback (127.0.0.0/8, ::1)
- RFC1918 (10/8, 172.16/12, 192.168/16)
- link-local, incluida `169.254.169.254` (el endpoint de metadatos de
  AWS/GCP/Azure — vector clásico de SSRF en la nube)
- IPv4-mapped a IPv6 en hexadecimal (`::ffff:7f00:1` y formas equivalentes)

Dos propiedades estructurales de este diseño, ambas deliberadas:

**Una sola regla para "privado".** El desenmascarado de IPv4-mapped vive
DENTRO del predicado de host privado (ver [GLOSSARY](../GLOSSARY.md),
`isPrivateHost`). Consecuencia: la validación de texto y la de IP resuelta
no pueden discrepar sobre si `::ffff:7f00:1` es privada — usan la misma
función. Si aparece una forma nueva de máscara, se corrige en un solo lugar
y ambas capas quedan al día a la vez. Es el principio de "verificar todas
las formas del input" ([PRINCIPLES](../PRINCIPLES.md), principio 1)
aplicado con un solo punto de verdad.

**Sin segunda consulta DNS.** La resolución ya validada es la que se usa
para conectar; no hay una segunda consulta entre validar y conectar. Un
atacante que respondiera "IP pública" en la primera consulta y "127.0.0.1"
en la segunda (DNS-rebinding) se encuentra con que la segunda consulta
simplemente no ocurre: la conexión reutiliza el resultado ya comprobado.
DNS-rebinding es una técnica documentada públicamente; que este documento
diga que el vector está cerrado es defensa por transparencia — un pentester
puede verificar que la mitigación es real.

## Límites de fetch

Verificados contra el código:

- **Timeout por petición:** 12.000 ms (12 segundos).
- **Cuerpo máximo leído:** 200.000 bytes; la lectura se trunca al superar.
- **Métodos:** solo GET y HEAD, sin cuerpo en la petición.
- **Guardia de corrida** bajo clave sintética de posture: comparte el tope
  diario y el límite de concurrencia con el escaneo y el chat.

Doce segundos es tiempo razonable para una respuesta legítima; 200 KB basta
para analizar headers y estructura sin descargar contenido pesado; GET/HEAD
sin cuerpo evita que un bug de interfaz dispare una escritura accidental
sobre el target.

## Modos de disparo

Solo se verifica el modo **manual**: el operador dispara la auditoría desde
la vista del proyecto. No hay una pasada automática post-escaneo en el
código actual. Si en el futuro se añade un disparo automático, este
documento debe actualizarse.

## Persistencia: efímera por diseño

Los resultados de posture NO se guardan en la base local. Viven en el
estado de la vista mientras el operador los consulta y desaparecen al
cerrar la vista o al correr una auditoría nueva. No hay tablas de posture.

Posture es diagnóstico ahora, no bitácora. Persistir cada auditoría
añadiría tabla, migraciones, ciclo de vida y política de retención —
infraestructura sin caso de uso: quien necesita evidencia histórica de
superficie tiene herramientas externas de monitoreo continuo; FORTRESS es
el cuchillo de bolsillo para la auditoría puntual. La ausencia de
persistencia es una decisión, no una carencia.

## Qué NO hace posture

- NO ejecuta escaneos activos de vulnerabilidades (no es un pentest tool).
- NO prueba credenciales, no fuerza logins, no intenta bypasses de auth.
- NO opera sobre dominios que el operador no confirmó como propios.
- NO opera sobre IPs privadas ni loopback.
- NO reemplaza una auditoría profesional de seguridad web — es
  verificación de higiene observable desde fuera.

## Salvaguardas (resumen)

- Los tres guards, en orden, antes de cualquier petición.
- Solo lectura, bajo volumen; nada que modifique el sistema auditado.
- Cero telemetría externa: el resultado no sale del equipo del operador.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — el modelo de amenazas completo
  (SSRF, aislamiento, prompt injection).
- [PRINCIPLES](../PRINCIPLES.md) — principio 1 (todas las formas del
  input) y 6 (datos vs metadatos).
- [IPC](../IPC.md) — el canal `posture:run` y su guardia.
- [GLOSSARY](../GLOSSARY.md) — SSRF, superficie externa, isPrivateHost.
- [FLOWS/SCAN](SCAN.md) — el escaneo de seguridad del código (flujo
  distinto y complementario).
