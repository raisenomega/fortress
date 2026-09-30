/**
 * El motivo con el que la huella del trabajo del generador entra en el libro.
 *
 * POR QUE EXISTE. El freno principal del motor es el techo de vueltas del CLI
 * (`--max-turns 30`), y vive DENTRO de la corrida: desde fuera no se ve. Medido
 * el 2026-09-30 sobre 1582 eventos: 20 corridas murieron ahi —con el 84-92 % del
 * presupuesto sin tocar— y ninguna de las tres senales que hay sirve para saber
 * si el fix AVANZABA o daba vueltas:
 *
 * - `edits` de `agent_runs` viene en 0 en las 414 corridas del motor.
 * - `num_turns` NO es comparable con `--max-turns`: son unidades distintas —18
 *   corridas POSTERIORES al techo entregaron fix declarando hasta 46 vueltas—.
 * - la ausencia de «fix generado» es tautologica: si la corrida muere, el motor
 *   no llega a mirar el diff.
 *
 * Con la huella, dos corridas del MISMO hallazgo que propongan lo mismo se
 * reconocen, y ahi se sabe que subir el techo no compraria nada. Es la medida
 * que falta para decidir el freno con dato, no la decision: no toca el techo.
 */
export const MOTIVO_HUELLA = 'HUELLA'
