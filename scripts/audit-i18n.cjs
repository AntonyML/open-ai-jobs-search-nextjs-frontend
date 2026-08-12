// Audit i18n message JSONs for suspicious keys and en/es parity.
// Checks:
//   1. Literal keys containing "." (invalid in next-intl — must be nested objects)
//   2. Keys with spaces / weird characters / surrounding whitespace
//   3. Duplicate keys WITHIN the same namespace object (JSON.parse keeps the last silently)
//   4. en/es parity (keys present in one but not the other)
//   5. Empty string values
//   6. Placeholder {name} parity per key (en vs es)
const fs = require('fs')

const en = JSON.parse(fs.readFileSync('messages/en.json'))
const es = JSON.parse(fs.readFileSync('messages/es.json'))

let errors = 0
function fail(msg) {
  errors++
  console.log('  ❌ ' + msg)
}

// ── 1. Literal dotted keys (deep scan of raw object keys) ────────────
console.log('=== 1. CLAVES LITERALES CON PUNTO (objetos anidados) ===')
;(function walk(obj, prefix) {
  for (const k of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + k : k
    if (k.includes('.')) fail(`clave con punto en "${path}" (debe ser objeto anidado)`)
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) walk(obj[k], path)
  }
})(en, '')
;(function walk(obj, prefix) {
  for (const k of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + k : k
    if (k.includes('.')) fail(`clave con punto en es: "${path}" (debe ser objeto anidado)`)
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) walk(obj[k], path)
  }
})(es, '')
if (errors === 0) console.log('  ✅ OK')

// ── 2. Weird keys ────────────────────────────────────────────────────
console.log('\n=== 2. CLAVES CON ESPACIOS / CARACTERES RAROS / TRIM ===')
let weird = 0
for (const [name, data] of [['en', en], ['es', es]]) {
  ;(function walk(obj, prefix) {
    for (const k of Object.keys(obj)) {
      const path = prefix ? prefix + '.' + k : k
      if (/[\s\\/$'"()[\]{}*]/.test(k)) { fail(`${name}: clave rara "${path}"`); weird++ }
      if (k !== k.trim()) { fail(`${name}: clave con espacios en extremos "${path}"`); weird++ }
      if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) walk(obj[k], path)
    }
  })(data, '')
}
if (weird === 0) console.log('  ✅ OK')

// ── 3. Duplicate keys within the same namespace ──────────────────────
console.log('\n=== 3. CLAVES DUPLICADAS DENTRO DEL MISMO NAMESPACE ===')
let dups = 0
for (const [name, data] of [['en', en], ['es', es]]) {
  ;(function walk(obj, prefix) {
    const seen = new Set()
    for (const k of Object.keys(obj)) {
      const path = prefix ? prefix + '.' + k : k
      if (seen.has(k)) { fail(`${name}: clave duplicada "${path}"`); dups++ }
      seen.add(k)
      if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) walk(obj[k], path)
    }
  })(data, '')
}
if (dups === 0) console.log('  ✅ OK')

// ── 4. en/es parity ──────────────────────────────────────────────────
function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + k : k
    const v = obj[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out)
    else out[path] = v
  }
  return out
}
const flatEn = flatten(en, '', {})
const flatEs = flatten(es, '', {})
const keysEn = Object.keys(flatEn)
const keysEs = Object.keys(flatEs)

console.log('\n=== 4. PARIDAD en/es ===')
const missingEs = keysEn.filter((k) => !(k in flatEs))
const missingEn = keysEs.filter((k) => !(k in flatEn))
if (missingEs.length) missingEs.forEach((k) => fail(`en tiene "${k}" que falta en es`))
if (missingEn.length) missingEn.forEach((k) => fail(`es tiene "${k}" que falta en en`))
if (!missingEs.length && !missingEn.length) console.log('  ✅ Paridad total (' + keysEn.length + ' claves)')

// ── 5. Empty values ──────────────────────────────────────────────────
console.log('\n=== 5. VALORES VACIOS ===')
const empty = [...new Set([...keysEn, ...keysEs])].filter((k) => flatEn[k] === '' || flatEs[k] === '')
if (empty.length) empty.forEach((k) => fail(`valor vacio en "${k}"`))
else console.log('  ✅ OK')

// ── 6. Placeholder parity ────────────────────────────────────────────
console.log('\n=== 6. PLACEHOLDERS {x}: paridad por clave ===')
const mismatch = []
for (const k of keysEn) {
  if (!(k in flatEs)) continue
  const pEn = (String(flatEn[k]).match(/\{[a-zA-Z_]+\}/g) || []).sort().join(',')
  const pEs = (String(flatEs[k]).match(/\{[a-zA-Z_]+\}/g) || []).sort().join(',')
  if (pEn !== pEs) mismatch.push(`${k}: EN={${pEn}} ES={${pEs}}`)
}
if (mismatch.length) mismatch.forEach((m) => fail(m))
else console.log('  ✅ OK')

console.log('\n' + (errors === 0 ? '🎉 AUDITORÍA LIMPIA' : `⚠️  ${errors} problema(s) encontrado(s)`))
process.exit(errors === 0 ? 0 : 1)
