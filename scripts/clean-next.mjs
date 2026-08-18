import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { platform } from 'node:os'

/**
 * Borra `.next` de forma fiable en Windows.
 *
 * - Vía rápida: fs.rm con reintentos acotados (normalmente tarda <1s).
 * - Si un proceso retiene archivos (ver kill-next.mjs), fs.rm puede quedarse
 *   enganchado: se corta y se delega en `rd /s /q` (cmd), que falla limpio y
 *   rápido, y se reintenta un número acotado de veces.
 * - Si sigue existiendo tras los reintentos, sale con error y mensaje claro.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// maxRetries solo reintenta en EBUSY/EMFILE. Un handle retenido de forma
// "suave" (sin EBUSY pero tampoco liberado) puede colgar el rm: se corta con
// timeout y se cae al respaldo rd /s /q. Nota: el kill del race no cancela el
// rm subyacente, solo deja de esperar; el fallback reintenta y verifica.
const rmWithTimeout = (path, ms = 3000) =>
  Promise.race([
    rm(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])

function rdQuiet() {
  try {
    const r = spawnSync('cmd /d /c "rd /s /q .next"', { encoding: 'utf8', shell: true })
    return r.status
  } catch {
    return -1
  }
}

try {
  await rmWithTimeout('.next', 3000)
} catch {
  // fs.rm falló o se quedó enganchado: respaldo con cmd.
}

if (!existsSync('.next')) {
  console.log('Next.js cache cleaned')
  process.exit(0)
}

if (platform() === 'win32') {
  for (let i = 1; i <= 5; i++) {
    rdQuiet()
    if (!existsSync('.next')) {
      console.log('Next.js cache cleaned (retry)')
      process.exit(0)
    }
    await sleep(500)
  }
}

console.error('[clean-next] No se pudo limpiar .next: hay un proceso reteniendo archivos.')
console.error('[clean-next] Ejecuta: node scripts/kill-next.mjs  y reintenta.')
process.exit(1)