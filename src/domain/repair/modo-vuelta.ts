/**
 * Hasta donde llega una vuelta del motor.
 *
 * Los tres cortes son los tres sitios donde el riesgo cambia de naturaleza, no
 * tres niveles de lo mismo:
 *
 * - `hasta-gate` para antes del juicio. Todo lo hecho vive en un worktree y no
 *   ha costado un revisor. Es el modo del loop sobre el repo propio.
 * - `hasta-omega` deja juzgar y para antes de integrar. El fix esta juzgado y
 *   esperando la firma humana, que es la unica puerta al arbol vivo.
 * - `completo` integra si la politica del proyecto lo permite. Es el unico que
 *   puede mover el repo sin que nadie lo autorice, y por eso es el que el cerco
 *   existe para acotar.
 *
 * Un booleano no daba para esto: `stopAtGate` solo sabia decir "antes del
 * juicio o hasta el final", y el sitio interesante —juzgado pero sin integrar—
 * no tenia nombre.
 */
export type ModoDeVuelta = 'completo' | 'hasta-gate' | 'hasta-omega'
