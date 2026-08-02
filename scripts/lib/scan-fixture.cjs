/**
 * Resultado de escaneo de mentira para el preview, con hallazgos plausibles.
 *
 * Los scores no son inventados: salen de la misma formula que usa el dominio,
 * 100 menos 25 por CRITICAL, 8 por HIGH, 3 por MEDIUM y 1 por LOW. Si la UI
 * mostrara un score que no cuadra con sus hallazgos, la captura estaria
 * ensenando algo que la app real nunca produce.
 */
const RESULTS = [
  {
    // 100 - 1 = 99
    score: 99,
    findings: [['LOW', 'console.log olvidado en el arranque', 'src/main.ts', 12]]
  },
  {
    // 100 - (2 x 8) - (3 x 3) = 75
    score: 75,
    findings: [
      ['HIGH', 'Endpoint sin verificar la sesion', 'api/routes.py', 42],
      ['HIGH', 'Falta rate limiting en el login', 'api/auth.py', 18],
      ['MEDIUM', 'CORS abierto a cualquier origen', 'api/main.py', 7],
      ['MEDIUM', 'Respuesta sin cabecera HSTS', 'api/main.py', 9],
      ['MEDIUM', 'Cookie de sesion sin SameSite', 'api/auth.py', 55]
    ]
  },
  {
    // 100 - (2 x 25) - 8 = 42
    score: 42,
    findings: [
      ['CRITICAL', 'SQL injection por concatenacion de input', 'api/routes.py', 42],
      ['CRITICAL', 'Secret hardcodeado en el codigo fuente', 'config.py', 18],
      ['HIGH', 'Tabla de usuarios sin RLS', 'db/schema.sql', 3]
    ]
  }
]

module.exports = { RESULTS }
