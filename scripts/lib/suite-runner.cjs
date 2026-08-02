/**
 * Una suite es o un string que se evalua dentro del renderer, o una funcion de
 * node que necesita tocar la base entre una asercion y la siguiente (por
 * ejemplo para sembrar hallazgos sin esperar un escaneo real).
 */
async function runSuite(window, checks) {
  if (typeof checks === 'function') return checks(window)
  return window.webContents.executeJavaScript(checks)
}

function report(title, results) {
  console.log(`\n${title}`)
  let failed = 0

  for (const { name, pass, detail } of results) {
    console.log(`  ${pass ? 'PASS' : 'FAIL'} ${name}${pass ? '' : ` — ${detail}`}`)
    if (!pass) failed += 1
  }

  return failed
}

module.exports = { runSuite, report }
