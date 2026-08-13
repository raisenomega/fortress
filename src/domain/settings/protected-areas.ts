/**
 * Areas que nunca se tocan en modo autonomo: al detectarlas el agente vuelve a
 * supervisado. Cubre ES + EN porque el operador escribe en espanol y el freno
 * fallaba en silencio: "autenticacion" no contiene "auth". Sobre-degradar es
 * seguro (como mucho pide permiso de mas); infra-degradar es el peligro. Los
 * terminos van sin tildes; la comparacion normaliza acentos antes de buscar.
 */
// Por categoria (cada linea): auth/sesion · pagos · bd/permisos · secretos/cifrado.
const PROTECTED_WORDS =
  'auth autenticacion autorizacion login sesion credencial contrasena password ' +
  'payment pago cobro facturacion tarjeta checkout ' +
  'rls politica permiso ' +
  'security seguridad secret secreto token clave cifrad encript encrypt'

export const PROTECTED_AREAS = PROTECTED_WORDS.split(' ')

/** Quita tildes/diacriticos: "autenticacion" debe casar con "autenticación". */
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function isProtectedArea(text: string): boolean {
  const lowered = stripAccents(text.toLowerCase())
  return PROTECTED_AREAS.some((area) => lowered.includes(area))
}
