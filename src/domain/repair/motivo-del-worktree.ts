/**
 * El motivo con el que nace el worktree en el libro. Lo comparten quien lo
 * escribe (`generate-setup`) y quien lo LEE (`collect-post-omega-state`, para
 * armar el expediente de la firma): un literal repetido se desfasa.
 *
 * POR QUE EXISTE, y es una regresion medida (DEUDAS §13). Este asiento es el
 * unico que lleva `branch` y `baseSha`, y la firma los necesita. Se buscaba
 * cogiendo el ULTIMO `GENERATE DECISION`, dando por hecho que seria este. Dos
 * arcos BUENOS le pusieron asientos detras —la correa en el libro el 28-sep
 * (`SCOPE`) y la huella del trabajo el 30-sep (`HUELLA`)—, el ultimo paso a ser
 * otro, y el expediente salia incompleto: la firma contestaba
 * `incomplete-state` y NINGUNA propuesta del Motor se podia integrar.
 *
 * Once dias sin que nadie lo viera, porque el gate estaba ciego y ninguna
 * propuesta llegaba a OMEGA. La primera que llego lo destapo.
 *
 * LA LECCION, que es la de toda la sesion: un asiento se busca por lo que ES,
 * nunca por su POSICION. Y anadir un dato al libro obliga a mirar quien lo lee.
 */
export const MOTIVO_WORKTREE = 'WORKTREE_CREATE'
