/**
 * Tamanos y recortes usados al derivar los iconos de la imagen oficial.
 * El recorte del wordmark esta medido sobre el original de 1231x1277.
 */

/** Encierra "FORTRESS." y "by Raisen" dejando algo de aire alrededor. */
const WORDMARK_CROP = { x: 70, y: 590, width: 1120, height: 380 }

const ICO_SIZES = [16, 32, 48, 64, 128, 256]
const ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024]

module.exports = { WORDMARK_CROP, ICO_SIZES, ICNS_SIZES }
