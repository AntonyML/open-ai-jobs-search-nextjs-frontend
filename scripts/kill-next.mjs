/**
 * Mata cualquier proceso que esté escuchando en el puerto del dev server
 * (por defecto 3000), incluyendo su ÁRBOL completo en Windows (taskkill /T).
 *
 * Por qué existe: en Windows, `next dev` deja procesos huérfanos
 * (npx → next → start-server.js → workers) que siguen escribiendo en `.next`
 * aunque mates el PID que escucha. Dos "servidores" compartiendo `.next`
 * corrompen el caché (chunks desaparecidos, vendor-chunks que no existen).
 *
 * Uso: node scripts/kill-next.mjs [port]
 */
import { spawnSync } from 'node:child_process'
import { platform } from 'node:os'

const port = process.argv[2] ?? '3000'

function run(command) {
  try {
    const r = spawnSync(command, { encoding: 'utf8', shell: true })
    return r.stdout ?? ''
  } catch {
    return ''
  }
}

function listenersOnPort() {
  const pids = new Set()
  if (platform() === 'win32') {
    // Windows: "TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING 1234"
    const out = run('netstat -ano -p tcp')
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTEN/i.test(line)) continue
      const parts = line.trim().split(/\s+/)
      if ((parts[1] ?? '').endsWith(`:${port}`)) {
        const pid = parts[parts.length - 1]
        if (/^\d+$/.test(pid)) pids.add(pid)
      }
    }
  } else {
    // macOS/Linux: lsof imprime un PID por línea.
    const out = run(`lsof -ti tcp:${port}`)
    for (const line of out.split(/\r?\n/)) {
      const pid = line.trim()
      if (/^\d+$/.test(pid)) pids.add(pid)
    }
  }
  return [...pids]
}

const pids = listenersOnPort()

if (pids.length === 0) {
  console.log(`[kill-next] Nada escuchando en :${port} — no hay nada que matar.`)
  process.exit(0)
}

for (const pid of pids) {
  if (platform() === 'win32') {
    // /T mata el árbol de procesos (hijos), no solo el PID que escucha.
    run(`taskkill /F /T /PID ${pid}`)
    console.log(`[kill-next] Árbol del PID ${pid} terminado (puerto :${port}).`)
  } else {
    run(`kill -9 ${pid}`)
    console.log(`[kill-next] PID ${pid} terminado (puerto :${port}).`)
  }
}
