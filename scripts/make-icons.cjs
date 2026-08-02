/**
 * Genera todos los formatos de icono a partir de la UNICA imagen oficial:
 * resources/fortress-logo.jpeg. No se inventa ni se dibuja nada.
 *
 *   resources/icon.png            icono de ventana en Linux
 *   build/icon.png                fuente del build (Linux / AppImage)
 *   build/icon.ico                Windows
 *   build/icon.icns               macOS
 *   src/presentation/assets/...   logo cuadrado y wordmark para la UI
 *
 * Uso: npm run icons
 */
const { app, nativeImage } = require('electron')
const { join } = require('path')
const { writeFileSync, mkdirSync } = require('fs')
const { buildIco, buildIcns } = require('./lib/ico-writer.cjs')
const { WORDMARK_CROP, ICO_SIZES, ICNS_SIZES } = require('./lib/icon-sizes.cjs')

const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'resources', 'fortress-logo.jpeg')
const ASSETS = join(ROOT, 'src', 'presentation', 'assets')

const square = (image, size) => image.resize({ width: size, height: size, quality: 'best' }).toPNG()

app.whenReady().then(() => {
  const source = nativeImage.createFromPath(SOURCE)
  if (source.isEmpty()) {
    console.error(`ICONS FAIL: no se pudo leer ${SOURCE}`)
    return app.exit(1)
  }

  mkdirSync(ASSETS, { recursive: true })

  writeFileSync(join(ROOT, 'resources', 'icon.png'), square(source, 512))
  writeFileSync(join(ROOT, 'build', 'icon.png'), square(source, 1024))
  writeFileSync(join(ASSETS, 'fortress-logo.png'), square(source, 512))

  // El wordmark recortado, para cabeceras anchas donde el cuadrado no cabe.
  const wordmark = source.crop(WORDMARK_CROP)
  writeFileSync(join(ASSETS, 'fortress-wordmark.png'), wordmark.toPNG())

  const withSizes = (sizes) => sizes.map((size) => ({ size, png: square(source, size) }))
  writeFileSync(join(ROOT, 'build', 'icon.ico'), buildIco(withSizes(ICO_SIZES)))
  writeFileSync(join(ROOT, 'build', 'icon.icns'), buildIcns(withSizes(ICNS_SIZES)))

  const { width, height } = source.getSize()
  console.log(`ICONS OK: origen ${width}x${height} -> png, ico, icns y assets de UI`)
  app.exit(0)
})
