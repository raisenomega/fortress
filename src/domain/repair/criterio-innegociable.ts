/**
 * Archivos que el motor NO puede integrar sin que un humano los mire.
 *
 * Principio 21: un sistema no aplica por su cuenta un cambio a las reglas que
 * gobiernan lo que puede aplicar por su cuenta. Proponer si —son codigo y pueden
 * tener defectos—; integrarlo sin que un humano lo mire, no.
 *
 * NO es configurable: un proyecto anade entradas a su blacklist, nunca quita
 * estas. Si la proteccion fuese declarativa bastaria una propuesta que la
 * borrase para abrir todo lo demas.
 *
 * EL CRITERIO PARA ENTRAR: si cambiar ese archivo DEBILITA una defensa, entra.
 * Tres familias, y ninguna es mas importante que las otras:
 *
 *   - gobierna la AUTONOMIA: que puede hacer el sistema por su cuenta.
 *   - VALIDA LO QUE ENTRA: rutas, URLs, herramientas — lo que llega del
 *     renderer, del operador o de la red y no es fuente de confianza.
 *   - implementa una DEFENSA de seguridad, aunque no sea ninguna de las dos.
 *
 * La lista se quedo corta TRES veces por el mismo motivo, y conviene nombrarlo:
 * la proteccion seguia al NOMBRE del archivo y no a su responsabilidad. Primero
 * al partir un modulo, la mitad que decidia se quedaba fuera; despues, porque el
 * barrido buscaba "puertas de autonomia" y las guardas de validacion no se
 * llaman asi aunque defiendan lo mismo. Al escribir o mover una guarda —de lo
 * que sea— mirar aqui antes de cerrar la pieza.
 */
export const CRITERIO_INNEGOCIABLE = 'autonomia, validacion de entrada o defensa de seguridad'
