import { sanearParaPrompt } from '../shared/sanear-para-prompt'

/**
 * El REPLANTEA de OMEGA convertido en el mensaje siguiente para el productor
 * (ADR-097 §3.1). Hermano de `vetoComoPedido`, y la diferencia es el objeto:
 * aquel corrige un fix ya escrito; este corrige una direccion antes de escribir
 * nada.
 *
 * El debate al denegar un plan es productor ↔ OMEGA y NO el tribunal: el
 * critico ataca un diff, y aqui no hay diff que atacar. `tribunalConCritico` ya
 * se autoexcluye devolviendo lista vacia, asi que no hay que impedirselo — pero
 * conviene decir por que, para que nadie lo «arregle» metiendolo.
 *
 * Y se le recuerda que NO ha tocado nada: sin eso, un productor que lee «fue
 * revisado y denegado» puede creer que su trabajo se perdio y empezar a
 * defenderlo en vez de replantearlo.
 */
export function replanteoComoPedido(razon: string): string {
  return [
    'Tu PLAN fue revisado antes de ejecutarlo, y OMEGA pide replantearlo. La',
    'objecion, literal:',
    '',
    sanearParaPrompt(razon),
    '',
    'No has tocado ningun fichero todavia: no hay nada que deshacer. Propon otra',
    'DIRECCION que atienda esa objecion concreta. Si vuelves a proponer lo mismo,',
    'el ciclo se cierra sin resolver.'
  ].join('\n')
}
