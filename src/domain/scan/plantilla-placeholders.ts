/**
 * Las plantillas del kit vienen con huecos `{{ASI}}` que alguien tiene que
 * rellenar. Sin rellenar no son prosa decorativa: viajan DENTRO de comandos
 * —`grep -rniE '...' {{SERVER_DIRS}}`— y llegarian al agente literales.
 *
 * Los que nombran carpetas se rellenan con la carpeta de ESTA parada. Es una
 * degradacion honesta y deliberada: FORTRESS todavia no clasifica que carpeta
 * es de servidor, cual de cliente y cual de datos —eso es un arco posterior—,
 * y acotar el comando a la parada que se esta auditando es exactamente su
 * alcance. Mejor un `grep` acotado de verdad que uno que promete un mapa que
 * nadie ha dibujado.
 */
const POR_CARPETA: readonly string[] = [
  'SERVER_DIRS',
  'CLIENT_DIRS',
  'DB_SCHEMA_DIRS',
  'IAC_DIRS',
  'DATA_STORES',
  'PKG_MANIFESTS',
  'PROTECTED_PATHS',
  'REPO_ROOT'
]

const POR_NOMBRE: readonly string[] = ['PROJECT_NAME', 'PROJECT']

/**
 * Lo que no se sabe se DICE, no se adivina: el centinela de `aTipoDeDefecto`
 * aplicado a un hueco. Un `{{TENANCY_MODEL}}` inventado mandaria al agente a
 * auditar un modelo de inquilinos que nadie ha declarado.
 */
const SIN_DECLARAR = 'sin declarar'

const DE_REGEX = /[.*+?^${}()|[\]\\/]/g

/** Dos huecos de carpeta seguidos dan la misma ruta dos veces; el comando la
 *  recorreria —y contaria— dos veces. */
function colapsarRepetidas(texto: string, carpeta: string): string {
  const escapada = carpeta.replace(DE_REGEX, '\\$&')
  return texto.replace(new RegExp(`${escapada}(?: ${escapada})+`, 'g'), carpeta)
}

/**
 * Rellena TODOS los huecos, tambien los que no estan en las tablas: un hueco
 * desconocido cae en el centinela en vez de sobrevivir al prompt. La regex es
 * la ultima palabra, asi que una plantilla nueva con un `{{HUECO}}` inventado
 * no puede colarlo.
 */
export function sustituirHuecos(texto: string, carpeta: string, projectName: string): string {
  const relleno = texto.replace(/\{\{([A-Z_]+)\}\}/g, (_todo, clave: string) => {
    if (POR_CARPETA.includes(clave)) return carpeta
    return POR_NOMBRE.includes(clave) ? projectName : SIN_DECLARAR
  })
  return colapsarRepetidas(relleno, carpeta)
}
