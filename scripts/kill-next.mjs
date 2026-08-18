/**
 * Mata TODOS los procesos de desarrollo de Next.js de este proyecto — no solo
 * el que escucha en el puerto.
 *
 * Por qué existe (y por qué matar solo el puerto no basta):
 * en Windows, `next dev` deja huérfanos (npx → next → start-server.js →
 * workers) que NO escuchan en ningún puerto pero siguen escribiendo en
 * `.next`. El caso típico de corrupción recurrente:
 *
 *   1. Se arranca `next dev` y el puerto :3000 ya estaba ocupado → Next se
 *      mueve a :3001 y sigue corriendo (nadie lo nota).
 *   2. Se arranca un segundo `next dev` en :3000.
 *   3. DOS servidores comparten el mismo `.next` y se pisan los chunks →
 *      caché corrupta ("Cannot read properties of undefined (reading 'call')",
 *      vendor-chunks que no existen, etc.).
 *
 * `kill-next` solo mataba el listener de :3000 y dejaba vivo el de :3001 →
 * la corrupción volvía a la siguiente ejecución.
 *
 * Qué mata ahora:
 *   1. Todo proceso node/npm/npx/pnpm cuyo CommandLine mencione "next"
 *      (next dev / next-server / next start / next build) o la ruta de este
 *      proyecto — tengan o no puerto abierto. Así también mata un dev server
 *      que se haya corrido a :3001, build de opennextjs en curso, etc.
 *   2. El árbol completo (taskkill /T) de cualquier proceso escuchando en el
 *      puerto indicado, por si quedara algo no cubierto por el filtro.
 *   3. Se excluye el propio script (su CommandLine contiene "kill-next").
 *
 * Nota: en una máquina con varios proyectos Next corriendo a la vez, esto los
 * detendrá todos. Es intencional: dos servidores Next compartiendo un mismo
 * `.next` es exactamente el escenario que corrompe la caché.
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
    const out = run(`lsof -ti tcp:${port}`)
    for (const line of out.split(/\r?\n/)) {
      const pid = line.trim()
      if (/^\d+$/.test(pid)) pids.add(pid)
    }
  }
  return [...pids]
}

/**
 * PIDs de procesos de este proyecto: node/npm/npx/pnpm cuyo CommandLine
 * mencione "next" o contenga la ruta del proyecto.
 */
function projectDevProcessPids() {
  const pids = new Set()
  const cwd = process.cwd().replace(/'/g, "''")

  if (platform() === 'win32') {
    // Una sola línea: PowerShell 5.1 vía -Command ignora scripts multilínea.
    // Ojo: `$_.X` NO lleva backtick — aquí no hay interpolación JS (solo ${...}).
    const ps = `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} -and ($_.Name -in @('node.exe','npm.exe','npx.exe','pnpm.exe')) -and ($_.CommandLine -match 'next' -or $_.CommandLine -like '*${cwd}*') } | ForEach-Object { $_.ProcessId }`
    const out = run(`powershell -NoProfile -NonInteractive -Command "${ps}"`)
    for (const line of out.split(/\r?\n/)) {
      const pid = line.trim()
      if (/^\d+$/.test(pid)) pids.add(pid)
    }
  } else {
    const out = run(`ps -eo pid,args | awk '$2 ~ /node|npm|npx|pnpm/ && ($0 ~ /next/ || $0 ~ /${process.cwd().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/) {print $1}'`)
    for (const line of out.split(/\r?\n/)) {
      const pid = line.trim()
      if (/^\d+$/.test(pid) && Number(pid) !== process.pid) pids.add(pid)
    }
  }
  return [...pids]
}

function killPids(pids) {
  for (const pid of pids) {
    if (platform() === 'win32') {
      // /T mata el árbol de procesos (hijos), no solo el PID.
      const out = run(`taskkill /F /T /PID ${pid}`)
      if (/SUCCESS|success/i.test(out)) {
        console.log(`[kill-next] Árbol del PID ${pid} terminado.`)
      } else {
        console.log(`[kill-next] PID ${pid}: ${out.trim() || 'ya no existía'}`)
      }
    } else {
      run(`kill -9 ${pid}`)
      console.log(`[kill-next] PID ${pid} terminado.`)
    }
  }
}

const projectPids = projectDevProcessPids()
const portPids = listenersOnPort().filter((pid) => !projectPids.includes(pid))
const allPids = [...new Set([...projectPids, ...portPids])]

if (allPids.length === 0) {
  console.log('[kill-next] No hay procesos de Next.js de este proyecto ni listeners en el puerto.')
} else {
  killPids(allPids)
  // Da tiempo a Windows a liberar los handles de archivos antes de borrar .next.
  spawnSync('powershell -NoProfile -NonInteractive -Command "Start-Sleep -Milliseconds 400"', {
    encoding: 'utf8',
    shell: true,
  })
  console.log(`[kill-next] ${allPids.length} proceso(s) terminado(s).`)
}