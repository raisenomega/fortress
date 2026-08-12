# Onboarding

La primera pantalla cuando aún no hay API key configurada: FORTRESS pide la
key para poder hablar con la API de Claude. Es una superficie de arranque,
no una vista dentro de un proyecto.

**Mapeo interno:** NO es una entrada del `ui-store` — es una superficie
transversal que el root de la aplicación muestra ANTES de montar la interfaz
principal, cuando detecta que no hay key. **Componente principal:** la
pantalla de onboarding.

## Ubicación en la navegación

No se navega desde el sidebar: aparece automáticamente al arrancar la
aplicación sin API key. El operador puede saltarla (entrar sin configurar la
key todavía) y configurarla después desde [Ajustes](ajustes.md).

## Estructura principal

- **Logo y bienvenida.**
- **Explicación:** FORTRESS habla directamente con la API de Claude desde
  este equipo; la key se verifica, se cifra con el keychain del sistema y
  nunca sale de la máquina.
- **Formulario de API key:** el mismo que Ajustes, con la etiqueta
  "Empezar".
- **Nota alternativa:** se puede usar la variable de entorno
  `ANTHROPIC_API_KEY` (exportarla y reiniciar).
- **Opción de saltar:** entrar sin configurar la key todavía.

## Elementos interactivos

- **Campo de API key** y **botón "Empezar":** pega la key; se valida contra
  la API y se cifra. Al guardarse con éxito, se entra a la aplicación.
- **Saltar:** entra sin key (la app opera limitada hasta configurarla).

## Estados de la vista

- **Inicial:** el formulario vacío.
- **Validando:** mientras se comprueba la key contra la API.
- **Key inválida:** un aviso del veredicto de validación.
- **Key válida:** se cierra el onboarding y arranca la interfaz principal.

## Flujos que dispara

- La validación y cifrado de la key (el proceso principal la valida y la
  guarda con el keychain).

## Datos que muestra

- La API key NO se persiste en la base: se cifra con el keychain del
  sistema operativo. El renderer solo puede preguntar si existe, nunca
  leerla ([SECURITY-MODEL](../SECURITY-MODEL.md)).

## Canales IPC usados

- `settings:save-api-key`, `settings:check-api-key`, `settings:has-api-key`
  — la captura y validación de la key.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Ajustes](ajustes.md) — donde se cambia la key después.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el manejo cifrado de la key.
