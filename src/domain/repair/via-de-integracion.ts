/**
 * Por donde entro un fix al repo. Dos vias, y el historial tiene que
 * distinguirlas: la politica integra sola dentro del cerco; la firma la integra
 * un humano que miro el diff. Confundirlas en el mensaje del commit borra la
 * unica diferencia que importa cuando alguien pregunte, dentro de un ano, quien
 * autorizo ese cambio.
 *
 * Viaja como dato explicito y no se deduce de la PolicyEvaluation: casar por el
 * texto de un motivo ata el historial de git a una cadena que alguien puede
 * reescribir sin enterarse de lo que rompe.
 *
 * Vive en el DOMINIO y no junto a las deps del caso de uso porque el asiento del
 * Libro de la Vida tambien tiene que nombrarla, y el dominio no importa de la
 * aplicacion. Los tres sitios que cuentan la misma integracion —el asunto del
 * commit, el Libro de la propuesta y el de OMEGA— hablan asi del mismo dato.
 */
export type ViaDeIntegracion = 'automatica' | 'firmada'
