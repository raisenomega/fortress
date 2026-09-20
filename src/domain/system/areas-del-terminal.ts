/**
 * De que habla una observacion que solo el TERMINAL puede hacer: el estado del
 * PROYECTO donde trabaja, no el de FORTRESS ni el de un agente topandose con un
 * limite.
 *
 * TERCERA familia del vocabulario, y vive aparte por lo mismo que `AREAS_DE_FALLO`
 * vive aparte de `AREAS_DEL_CORPUS`: no son la misma clase de cosa ni se cierran
 * por el mismo camino. Las once del corpus se derivaron de 350 observaciones ya
 * escritas; las de fallo son provisionales y esperan al corpus del embudo; estas
 * nacen de un emisor NUEVO —el pre-vuelo del turno— que mira donde ninguno de los
 * otros dos mira.
 *
 * POR QUE SE AMPLIA UN VOCABULARIO CERRADO, que es la pregunta que toca hacerse:
 *
 * `area-de-observacion` no esta cerrado contra clases nuevas, esta cerrado contra
 * TEXTO LIBRE — las 26 formas de escribir «permisos» que hacian imposible
 * deduplicar. Una clase nueva con emisor determinista no es lo que aquel cierre
 * vino a impedir; 190 valores distintos escritos por un modelo, si.
 *
 * Y la alternativa era peor: la deduplicacion de ADR-085 funde por `(kind, area)`,
 * asi que una barrera rota en `otro` se fundiria con TODO lo demas que cae en el
 * cajon y su avistamiento quedaria enterrado en una fila que habla de otra cosa.
 * Con area propia, dos clientes con la barrera rota suman avistamientos JUNTOS y
 * `vistaEn: 2` dice lo unico que este backlog existe para decir: cuantos proyectos
 * distintos se toparon con lo mismo. La barrera rota es una CLASE que se va a
 * repetir —cada cliente tiene sus hooks— y meterla en el cajon perderia la senal.
 *
 * NACE CON SU EMISOR, igual que las de fallo: `barreras-del-proyecto` la emite
 * desde hoy. Ninguna clase sin quien la escriba.
 */
export const AREAS_DEL_TERMINAL = ['barrera-del-proyecto'] as const
