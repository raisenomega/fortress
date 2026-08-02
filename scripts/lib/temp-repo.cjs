/**
 * Repo git real con un remoto local ya configurado. Sirve para comprobar que
 * un proyecto sin CRITICAL no solo "no queda bloqueado", sino que el push
 * llega a git y funciona de verdad.
 */
const { execFileSync } = require('child_process')
const { mkdtempSync, rmSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')

function createTempRepo() {
  const remote = mkdtempSync(join(tmpdir(), 'fortress-remoto-'))
  execFileSync('git', ['init', '--bare', '--quiet', remote])

  const dir = mkdtempSync(join(tmpdir(), 'fortress-repo-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })

  git('init', '--quiet')
  git('config', 'user.email', 'test@fortress.local')
  git('config', 'user.name', 'FORTRESS Test')
  git('commit', '--allow-empty', '--quiet', '-m', 'init')
  git('remote', 'add', 'origin', remote)

  // El nombre de la rama inicial depende de la config de git del equipo.
  const branch = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
    cwd: dir,
    encoding: 'utf8'
  }).trim()

  // Sin upstream, `git push` a secas falla por configuracion y no por FORTRESS.
  git('config', `branch.${branch}.remote`, 'origin')
  git('config', `branch.${branch}.merge`, `refs/heads/${branch}`)

  return { dir, remote, branch }
}

/** Commits que llegaron al remoto: la prueba de que el push ocurrio. */
function remoteCommits(remote) {
  const log = execFileSync('git', ['--git-dir', remote, 'log', '--oneline'], { encoding: 'utf8' })
  return log.trim().split('\n').filter(Boolean).length
}

function removeRepo({ dir, remote }) {
  rmSync(dir, { recursive: true, force: true })
  rmSync(remote, { recursive: true, force: true })
}

module.exports = { createTempRepo, remoteCommits, removeRepo }
