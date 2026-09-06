/**
 * La QUINTA familia del criterio innegociable: la cadena que mantiene la API key
 * cifrada fuera del alcance del renderer. Ver `criterio-innegociable.ts`.
 *
 * `settings-repository` declara QUE claves son publicas, y su docblock dice
 * exactamente lo que esta en juego: "los handlers settings:get y settings:set
 * aceptaban cualquier clave, asi que desde el renderer se podia leer la key
 * cifrada y sobrescribirla; esta lista es lo que hace que eso siga siendo
 * cierto". Una defensa cuyo texto afirma "esto es lo que lo hace cierto",
 * desprotegida.
 *
 * Van las TRES y no solo la lista, que es la leccion que ya costo dos veces hoy:
 * `settings-handlers` es quien la APLICA —y sin esa llamada la lista existe y no
 * frena nada—, y `api-key-store` es quien cifra y descifra contra el llavero del
 * sistema. Proteger la regla y dejar suelto a quien la ejecuta no protege nada.
 *
 * `save-api-key` queda fuera a proposito: valida antes de guardar, pero guarda a
 * traves del puerto. No es guardian, es llamante.
 */
export const DEFENSAS_DE_SECRETOS: readonly string[] = [
  'src/domain/settings/settings-repository.ts',
  'src/infrastructure/ipc/settings-handlers.ts',
  'src/infrastructure/security/api-key-store.ts',
  'src/domain/repair/innegociables-secretos.ts'
]
