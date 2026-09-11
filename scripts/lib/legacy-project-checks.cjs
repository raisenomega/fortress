/**
 * Lo que las migraciones hacen con la FILA del proyecto: conservar lo que ya
 * habia y rellenar lo que nacio despues. Van juntos porque todos son backfills
 * de la misma fila y todos responden a la misma pregunta —que valor merece un
 * proyecto que existia antes de que la columna existiera.
 */
function checkProjectBackfills(check, proyectos) {
  const p = proyectos[0]

  check('conserva los proyectos', proyectos.length === 1, JSON.stringify(proyectos))
  check('conserva el score anterior', p?.fortressScore === 64)
  // Backfill del ciclo de vida: un proyecto que ya existia esta CONFIGURADO.
  check('backfill de config_state a CONFIGURADO', p?.configState === 'CONFIGURADO')
  // Backfill del score integral: sin auditar aun, dimensiones null y no parcial.
  check('backfill score integral: sin dimensiones', p?.qualityDimensions === null)
  check('backfill score integral: no parcial', p?.qualityPartial === false)
  // Backfill del circuit breaker: un proyecto viejo no esta contaminado.
  check('backfill circuit breaker: no contaminado', p?.contaminated === false)
}

module.exports = { checkProjectBackfills }
