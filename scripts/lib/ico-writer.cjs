/**
 * Escritores de .ico (Windows) y .icns (macOS). Ambos formatos son contenedores
 * de PNG, asi que se arman a mano y no hace falta ImageMagick ni iconutil.
 */

const ICO_HEADER = 6
const ICO_ENTRY = 16

/** ICO: cabecera + una entrada por tamano + los PNG concatenados. */
function buildIco(images) {
  const header = Buffer.alloc(ICO_HEADER)
  header.writeUInt16LE(0, 0) // reservado
  header.writeUInt16LE(1, 2) // tipo 1 = icono
  header.writeUInt16LE(images.length, 4)

  let offset = ICO_HEADER + ICO_ENTRY * images.length
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ICO_ENTRY)
    // 256 se codifica como 0: el campo es de un solo byte.
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4) // planos
    entry.writeUInt16LE(32, 6) // bits por pixel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)])
}

/** Tipo de chunk ICNS por tamano, en las variantes que aceptan PNG. */
const ICNS_TYPES = {
  16: 'icp4',
  32: 'icp5',
  64: 'icp6',
  128: 'ic07',
  256: 'ic08',
  512: 'ic09',
  1024: 'ic10'
}

function buildIcns(images) {
  const chunks = images
    .filter(({ size }) => ICNS_TYPES[size])
    .map(({ size, png }) => {
      const head = Buffer.alloc(8)
      head.write(ICNS_TYPES[size], 0, 4, 'ascii')
      head.writeUInt32BE(png.length + 8, 4)
      return Buffer.concat([head, png])
    })

  const body = Buffer.concat(chunks)
  const header = Buffer.alloc(8)
  header.write('icns', 0, 4, 'ascii')
  header.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([header, body])
}

module.exports = { buildIco, buildIcns }
