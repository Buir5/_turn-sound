/**
 * dsh-turn-sound - 对话结束后播放提示音（宿主半区）
 * 数据目录：$DSH_HOME/turn-sound/
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const DATA_DIR = path.join(DSH_HOME, 'turn-sound')
const SOUND_DIR = path.join(DATA_DIR, 'sounds')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')
const BUILTIN_FILE = path.join(DATA_DIR, 'builtin-ding.wav')
const BASE = '/_turn-sound'
const MAX_BYTES = 20 * 1024 * 1024

const MIME = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.oga': 'audio/ogg',
  '.opus': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.webm': 'audio/webm',
}
const ALLOWED = Object.keys(MIME)
const DEFAULTS = { enabled: true, volume: 0.7, sound: '', x: null, y: null, opacity: 0.95, lastEventTs: 0 }
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }) } catch (err) {}
}

function readConfig() {
  ensureDir(SOUND_DIR)
  try {
    const obj = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    return Object.assign({}, DEFAULTS, obj && typeof obj === 'object' ? obj : {})
  } catch (err) {
    return Object.assign({}, DEFAULTS)
  }
}

function writeConfig(cfg) {
  ensureDir(DATA_DIR)
  const merged = Object.assign({}, DEFAULTS, cfg || {})
  merged.volume = Math.min(1, Math.max(0, Number(merged.volume) || 0))
  merged.enabled = !!merged.enabled
  merged.sound = typeof merged.sound === 'string' ? merged.sound : ''
  merged.opacity = Math.min(1, Math.max(0, merged.opacity === null || merged.opacity === undefined ? 0.95 : Number(merged.opacity)))
  merged.x = merged.x === null || merged.x === undefined || merged.x === '' ? null : Number(merged.x)
  merged.y = merged.y === null || merged.y === undefined || merged.y === '' ? null : Number(merged.y)
  merged.lastEventTs = Number(merged.lastEventTs) || 0
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8')
  return merged
}

/** 合成一段 0.5 秒双音 ding（16bit 单声道 PCM），仓库里不塞二进制素材 */
function makeDingWav() {
  const rate = 44100
  const count = Math.floor(rate * 0.5)
  const pcm = Buffer.alloc(count * 2)
  for (let i = 0; i < count; i++) {
    const t = i / rate
    const env = Math.exp(-t * 9)
    const s = 0.62 * Math.sin(2 * Math.PI * 880 * t) + 0.28 * Math.sin(2 * Math.PI * 1320 * t)
    const v = Math.max(-1, Math.min(1, s * env))
    pcm.writeInt16LE(Math.round(v * 32000), i * 2)
  }
  const h = Buffer.alloc(44)
  h.write('RIFF', 0, 'ascii')
  h.writeUInt32LE(36 + pcm.length, 4)
  h.write('WAVE', 8, 'ascii')
  h.write('fmt ', 12, 'ascii')
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(1, 22)
  h.writeUInt32LE(rate, 24)
  h.writeUInt32LE(rate * 2, 28)
  h.writeUInt16LE(2, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36, 'ascii')
  h.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([h, pcm])
}

function ensureBuiltin() {
  try {
    if (!fs.existsSync(BUILTIN_FILE)) {
      ensureDir(DATA_DIR)
      fs.writeFileSync(BUILTIN_FILE, makeDingWav())
    }
  } catch (err) {}
  return BUILTIN_FILE
}
function safeName(name) {
  const raw = String(name || '')
  let base = raw.replace(/\\/g, '/').split('/').pop() || ''
  base = base.replace(/[\x00-\x1f<>:"|?*]/g, '_').trim()
  while (base.startsWith('.')) base = base.slice(1)
  if (!base) base = 'sound'
  if (base.length > 120) {
    const dot = base.lastIndexOf('.')
    const ext = dot > 0 ? base.slice(dot) : ''
    base = base.slice(0, 120 - ext.length) + ext
  }
  return base
}

function listSounds() {
  ensureDir(SOUND_DIR)
  let names = []
  try {
    names = fs.readdirSync(SOUND_DIR)
  } catch (err) {
    names = []
  }
  const out = [{
    name: '(内置 ding)',
    file: '',
    size: 0,
    builtin: true,
  }]
  for (const n of names) {
    const ext = path.extname(n).toLowerCase()
    if (!MIME[ext]) continue
    try {
      const st = fs.statSync(path.join(SOUND_DIR, n))
      if (!st.isFile()) continue
      out.push({ name: n, file: n, size: st.size, builtin: false })
    } catch (err) {}
  }
  out.sort((a, b) => (a.builtin === b.builtin ? a.name.localeCompare(b.name) : a.builtin ? -1 : 1))
  return out
}

function userDing() {
  const p2 = path.join(DSH_HOME, 'ding.wav')
  try { return fs.statSync(p2).isFile() ? p2 : null } catch (err) { return null }
}

function resolveAudio(file) {
  const cfg = readConfig()
  const pick = typeof file === 'string' && file ? file : cfg.sound
  if (!pick) {
    const builtin = ensureBuiltin()
    return { path: builtin, name: 'ding.wav', builtin: true }
  }
  const name = safeName(pick)
  const full = path.join(SOUND_DIR, name)
  const root = path.resolve(SOUND_DIR)
  if (!path.resolve(full).startsWith(root)) return null
  if (!MIME[path.extname(name).toLowerCase()]) return null
  try {
    const st = fs.statSync(full)
    if (!st.isFile()) return null
    return { path: full, name, builtin: false, size: st.size }
  } catch (err) {
    return null
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
function sendJson(res, status, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8')
  res.writeHead(status, Object.assign({}, JSON_HEADERS, { 'Content-Length': body.length }))
  res.end(body)
}

function sendAudio(req, res, target) {
  const st = fs.statSync(target.path)
  const ext = path.extname(target.name).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  const range = req.headers.range
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(String(range))
    const start = m && m[1] ? parseInt(m[1], 10) : 0
    const end = m && m[2] ? parseInt(m[2], 10) : st.size - 1
    const from = Math.max(0, Math.min(start, st.size - 1))
    const to = Math.max(from, Math.min(end, st.size - 1))
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Length': to - from + 1,
      'Content-Range': 'bytes ' + from + '-' + to + '/' + st.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    })
    fs.createReadStream(target.path, { start: from, end: to }).pipe(res)
    return
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': st.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  })
  fs.createReadStream(target.path).pipe(res)
}

function makeHandler(ctx) {
  return async function handler(req, res) {
    let url
    try {
      url = new URL(req.url || '/', 'http://127.0.0.1')
    } catch (err) {
      sendJson(res, 400, { ok: false, error: 'bad url' })
      return true
    }
    let p = url.pathname
    while (p.length > 1 && p.endsWith('/')) { p = p.slice(0, -1) }
    const method = (req.method || 'GET').toUpperCase()
    try {
      if (method === 'GET' && (p === BASE + '/ping' || p === BASE)) {
        sendJson(res, 200, { ok: true, pong: true, at: Date.now() })
        return true
      }
      if (method === 'GET' && p === BASE + '/usage') {
        const u = readUsage()
        const cfgU = readConfig()
        const budget = Number(cfgU.budgetTokens || 0)
        const used = u.in + u.out
        sendJson(res, 200, { ok: true, day: u.day, used: used, budget: budget, remaining: budget > 0 ? Math.max(0, budget - used) : -1, last: u.last, ledger: readLedger(), balance: currentBalance(), balanceAt: BAL_CACHE.at, balanceErr: BAL_CACHE.err, balanceSrc: BAL_CACHE.src || null, whaleBalance: (function () { try { const w = readWhale(); const v = Number(w && w.balance); return isFinite(v) ? v : null } catch (err) { return null } })(), balanceErr: BAL_CACHE.err, turns: u.turns, cache: u.cache, config: cfgU, whale: whaleTurn(url.searchParams.get('advance') === '1') })
        return true
      }
      if (method === 'GET' && p === BASE + '/state') {
        const cfg = readConfig()
        sendJson(res, 200, {
          ok: true,
          config: cfg,
          sounds: listSounds(),
          dataDir: DATA_DIR,
          version: '0.1.0',
        })
        return true
      }
      if (method === 'GET' && p === BASE + '/sounds') {
        sendJson(res, 200, { ok: true, sounds: listSounds() })
        return true
      }
      if (method === 'POST' && p === BASE + '/claim') {
        const doc = readLedger()
        const t = doc && doc.last ? Number(doc.last.ts) || 0 : 0
        const play = t > LAST_ANNOUNCED
        if (play) LAST_ANNOUNCED = t
        sendJson(res, 200, { ok: true, play: play, ts: t, last: doc && doc.last ? doc.last : null })
        return true
      }
      if (method === 'POST' && p === BASE + '/config') {
        const raw = await readBody(req, 65536)
        let body = {}
        try {
          body = JSON.parse(raw.toString('utf8') || '{}')
        } catch (err) {
          sendJson(res, 400, { ok: false, error: 'bad json' })
          return true
        }
        const cfg = writeConfig(Object.assign({}, readConfig(), body))
        sendJson(res, 200, { ok: true, config: cfg, sounds: listSounds() })
        return true
      }
      if (method === 'GET' && p === BASE + '/audio') {
        const target = resolveAudio(url.searchParams.get('f') || '')
        if (!target) {
          sendJson(res, 404, { ok: false, error: 'not found' })
          return true
        }
        sendAudio(req, res, target)
        return true
      }
      if (method === 'POST' && p === BASE + '/upload') {
        const raw = await readBody(req, MAX_BYTES)
        if (!raw || raw.length < 64) {
          sendJson(res, 400, { ok: false, error: 'empty file' })
          return true
        }
        const want = safeName(url.searchParams.get('name') || '')
        const ext = path.extname(want).toLowerCase()
        if (!MIME[ext]) {
          sendJson(res, 400, { ok: false, error: 'unsupported type', allowed: ALLOWED })
          return true
        }
        ensureDir(SOUND_DIR)
        fs.writeFileSync(path.join(SOUND_DIR, want), raw)
        const cfg = writeConfig(Object.assign({}, readConfig(), { sound: want, enabled: true }))
        sendJson(res, 200, { ok: true, name: want, size: raw.length, config: cfg, sounds: listSounds() })
        return true
      }
      if (method === 'POST' && p === BASE + '/delete') {
        const raw = await readBody(req, 4096)
        let body = {}
        try {
          body = JSON.parse(raw.toString('utf8') || '{}')
        } catch (err) {}
        const name = safeName(body.name || '')
        if (name && MIME[path.extname(name).toLowerCase()]) {
          try {
            fs.unlinkSync(path.join(SOUND_DIR, name))
          } catch (err) {}
        }
        const cfg = readConfig()
        if (cfg.sound === name) writeConfig(Object.assign({}, cfg, { sound: '' }))
        sendJson(res, 200, { ok: true, sounds: listSounds() })
        return true
      }
      sendJson(res, 404, { ok: false, error: 'no route', path: p })
      return true
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err && err.message ? err.message : err) })
      return true
    }
  }
}

const END_EVENTS = ['turn/end', 'turn-end', 'agent/turn-end', 'agent/turnEnd', 'session/turn-end', 'conversation/turn-end']

function prepare() {
  ensureDir(DATA_DIR)
  ensureDir(SOUND_DIR)
  ensureBuiltin()
  readConfig()
}

function usagePath() { return path.join(DATA_DIR, 'usage.json') }
function dayKey() { const d = new Date(); return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const WHALE_FILE = path.join(DSH_HOME, '.dshw-usage.json')

function readWhale() {
  try { return JSON.parse(fs.readFileSync(WHALE_FILE, 'utf8')) } catch (err) { return null }
}

function whaleTurn(advance) {
  const w = readWhale()
  if (!w) return null
  const cfg = readConfig()
  let marker = Number(cfg.lastEventTs || 0)
  const allEv = w.events || []
  if (!marker && allEv.length) {
    marker = Number(allEv[allEv.length - 1].ts) || 0
    cfg.lastEventTs = marker
    writeConfig(cfg)
  }
  const evs = (w.events || []).filter(function (e) { return Number(e.ts) > marker })
  let cost = 0
  let tokens = 0
  let maxTs = marker
  for (const e of evs) {
    cost += Number(e.cost) || 0
    tokens += Number(e.tokens) || 0
    if (Number(e.ts) > maxTs) maxTs = Number(e.ts)
  }
  if (advance && maxTs > marker) {
    cfg.lastEventTs = maxTs
    writeConfig(cfg)
  }
  return {
    cost: cost,
    tokens: tokens,
    events: evs.length,
    model: evs.length ? String(evs[evs.length - 1].model || '') : '',
    balance: Number(w.lastBalance) || 0,
    todayUsage: Number(w.todayUsage) || 0,
    day: String(w.date || ''),
  }
}

function readUsage() {
  let doc = null
  try { if (fs.existsSync(usagePath())) doc = JSON.parse(fs.readFileSync(usagePath(), 'utf8')) } catch (err) {}
  if (!doc || typeof doc !== 'object') doc = {}
  if (!doc.day || doc.day !== dayKey()) doc = { day: dayKey(), in: 0, out: 0, cache: 0, turns: 0, last: null }
  if (!doc.last || typeof doc.last !== 'object') doc.last = null
  return doc
}
function writeUsage(doc) { try { prepare(); fs.writeFileSync(usagePath(), JSON.stringify(doc), 'utf8') } catch (err) {} }
function numOf(obj, keys) { if (!obj || typeof obj !== 'object') return 0; for (const k of keys) { const v = obj[k]; if (typeof v === 'number' && isFinite(v)) return v } return 0 }
function findUsage(node, depth) {
  if (!node || typeof node !== 'object' || depth > 4) return null
  if (Array.isArray(node)) { for (const it of node) { const r = findUsage(it, depth + 1); if (r) return r } return null }
  const keys = Object.keys(node)
  const hasTok = keys.indexOf('inputTokens') !== -1 || keys.indexOf('outputTokens') !== -1 || keys.indexOf('promptTokens') !== -1 || keys.indexOf('completionTokens') !== -1 || keys.indexOf('totalTokens') !== -1
  if (hasTok) {
    const i1 = numOf(node, ['inputTokens', 'promptTokens', 'input_tokens'])
    const o1 = numOf(node, ['outputTokens', 'completionTokens', 'output_tokens'])
    const c1 = numOf(node, ['cacheReadTokens', 'cache_read_input_tokens', 'cachedTokens'])
    const t1 = numOf(node, ['totalTokens', 'total_tokens']) || (i1 + o1)
    return { in: i1, out: o1, cache: c1, total: t1, model: typeof node.model === 'string' ? node.model : '' }
  }
  for (const k of keys) { const r = findUsage(node[k], depth + 1); if (r) return r }
  return null
}
function recordTurnUsage(event) {
  let u = null
  try { u = findUsage(event, 0) } catch (err) { u = null }
  if (!u) return
  const doc = readUsage()
  doc.in += u.in; doc.out += u.out; doc.cache += u.cache; doc.turns += 1
  doc.last = { at: Date.now(), in: u.in, out: u.out, cache: u.cache, total: u.total, model: u.model || '', type: String(event && event.type ? event.type : '') }
  writeUsage(doc)
}
function hookEvents(ctx) {
  if (typeof ctx.on !== 'function') return
  try {
    ctx.on('event', (event) => {
      const type = event && typeof event === 'object' ? String(event.type || '') : ''
      if (END_EVENTS.indexOf(type) === -1) return
      if (typeof ctx.emit === 'function') {
        try {
          ctx.emit('dsh-turn-sound/turn-end', { at: Date.now(), type })
        } catch (err) {}
      }
    })
  } catch (err) {}
}


let LAST_ANNOUNCED = 0
const LEDGER_FILE = path.join(DATA_DIR, 'ledger.json')
const PRICE_FLASH = { hit: [0.02, 0.04], miss: [1, 2], out: [4, 8] }
const PRICE_PRO = { hit: [0.15, 0.3], miss: [4.5, 9.0], out: [13.5, 27.0] }
function isPeakTime() {
  const d = new Date(Date.now() + 28800000)
  const m = d.getUTCHours() * 60 + d.getUTCMinutes()
  return !(m >= 30 && m < 510)
}
function priceFor(model) {
  const s = String(model || '').toLowerCase()
  return s.indexOf('pro') !== -1 ? PRICE_PRO : PRICE_FLASH
}
function emptyLedger() { return { day: dayKey(), used: 0, turns: 0, last: null } }
function readLedger() {
  try {
    const d = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'))
    if (d && d.day === dayKey()) return d
  } catch (err) {}
  return emptyLedger()
}
function writeLedger(d) { try { prepare(); fs.writeFileSync(LEDGER_FILE, JSON.stringify(d), 'utf8') } catch (err) {} }
const turnAggs = new Map()
function finalizeTurn(sid) {
  const a = turnAggs.get(sid)
  turnAggs.delete(sid)
  if (!a || !a.tokens) return
  const doc = readLedger()
  if (doc.last && Number(doc.last.turn) === Number(a.turn)) { /* __turnDedupe */ return }
  doc.used = Math.round(((Number(readLedger().used) || 0) + a.cost) * 1e8) / 1e8
  doc.turns = Number(doc.turns || 0) + 1
  doc.last = { ts: a.ts, turn: a.turn, tokens: a.tokens, cost: Math.round(a.cost * 1e8) / 1e8, model: a.model }
  writeLedger(doc)
  setTimeout(function () { if (typeof refreshBalance === 'function') void refreshBalance(true) }, 2200)
}
function hookSessions(ctx) {
  if (typeof ctx.on !== 'function') return
  try {
    ctx.on('session/event', (session, event) => {
      try {
        const sid = (session && (session.id || session.sessionId || session.key)) || 'main'
        const type = event && event.type
        const d = event && event.data
        if (!d || typeof d !== 'object') return
        if (type === 'turn/end') { finalizeTurn(sid); return }
        if (type !== 'assistant/message') return
        const turn = Number(d.turn)
        const u = d.usage
        if (!u || typeof u !== 'object' || !isFinite(turn)) return
        let agg = turnAggs.get(sid)
        if (!agg || agg.turn !== turn) {
          if (agg) finalizeTurn(sid)
          agg = { turn: turn, tokens: 0, cost: 0, model: '', ts: Date.now() }
          turnAggs.set(sid, agg)
        }
        const input = Number(u.inputTokens) || 0
        const cache = Number(u.cacheReadTokens) || 0
        const output = Number(u.outputTokens) || 0
        const model = (d.message && d.message.source && d.message.source.model) || ''
        const p = priceFor(model)
        const off = isPeakTime() ? 1 : 0
        agg.cost += (cache / 1e6) * p.hit[off] + (input / 1e6) * p.miss[off] + (output / 1e6) * p.out[off]
        agg.tokens += input + cache + output
        if (model) agg.model = model
        agg.ts = Date.now()
      } catch (err) {}
    })
  } catch (err) {}
}


let CRED_CTX = null
const BAL_CACHE = { at: 0, val: null, err: null }
async function keyBalance(force) {
  const now = Date.now()
  if (!force && BAL_CACHE.val !== null && now - BAL_CACHE.at < 30000) return BAL_CACHE.val
  try {
    let cred = null
    if (CRED_CTX && CRED_CTX.credentials && typeof CRED_CTX.credentials.resolve === 'function') {
      cred = await CRED_CTX.credentials.resolve('DEEPSEEK_API_KEY')
    }
    if (!cred || !cred.value) { BAL_CACHE.at = now; BAL_CACHE.err = 'no-key'; return null }
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: 'Bearer ' + cred.value },
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) { BAL_CACHE.at = now; BAL_CACHE.err = 'HTTP ' + res.status; return null }
    const data = await res.json()
    const arr = (data && data.balance_infos) || []
    let info = null
    for (const it of arr) { if (String(it && it.currency).toUpperCase() === 'CNY') { info = it; break } }
    if (!info && arr.length) info = arr[0]
    const v = info ? Number(info.total_balance) : NaN
    BAL_CACHE.at = now
    if (isFinite(v)) { BAL_CACHE.val = v; BAL_CACHE.err = null; return v }
    BAL_CACHE.err = 'shape'
    return null
  } catch (err) {
    BAL_CACHE.at = now
    BAL_CACHE.err = String((err && err.message) || err)
    return null
  }
}
async function accountBalance() {
  try {
    let acc = null
    if (CRED_CTX && typeof CRED_CTX.get === 'function') acc = CRED_CTX.get('deepseekAccount')
    if (!acc || typeof acc.getBalance !== 'function') { BAL_CACHE.err = 'account:no-service'; return null }
    const r = await acc.getBalance({
      version: String(process.env.DSH_CLIENT_VERSION || process.env.DSH_VERSION || 'unknown'),
      locale: String(process.env.DSH_LOCALE || 'zh_CN'),
      timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
    })
    if (!r) { BAL_CACHE.err = 'account:null'; return null }
    if (r.status !== 'ready') { BAL_CACHE.err = 'account:' + String(r.status || 'unknown'); return null }
    const norm = Array.isArray(r.value) ? r.value : []
    const bonus = Array.isArray(r.bonusWallets) ? r.bonusWallets : []
    const all = norm.concat(bonus)
    let sum = 0
    let cur = null
    for (const w of all) {
      const n = Number(w && w.balance)
      if (!isFinite(n)) continue
      const c = String((w && w.currency) || 'CNY').toUpperCase()
      if (cur === null) cur = c
      if (c === cur) sum += n
    }
    if (cur === null) { BAL_CACHE.err = 'account:no-wallet'; return null }
    return sum
  } catch (err) { BAL_CACHE.err = 'account:' + String((err && err.message) || err); return null }
}
async function refreshBalance(force) {
  const now = Date.now()
  if (!force && BAL_CACHE.val !== null && now - BAL_CACHE.at < 30000) return BAL_CACHE.val
  const acc = await accountBalance()
  if (acc !== null) { BAL_CACHE.at = Date.now(); BAL_CACHE.val = acc; BAL_CACHE.src = 'account'; return acc }
  const k = await keyBalance(force)
  if (k !== null) BAL_CACHE.src = 'key'
  return k
}
function currentBalance() { return BAL_CACHE.val }

export function apply(ctx, config) {
  prepare()
  CRED_CTX = ctx
  hookEvents(ctx)
  hookSessions(ctx)
  const handler = makeHandler(ctx)
  void refreshBalance()
  const balTimer = setInterval(function () { void refreshBalance() }, 30000)
  if (balTimer && typeof balTimer.unref === 'function') balTimer.unref()
  const routes = ['/ping', '/state', '/usage', '/config', '/claim', '/sounds', '/audio', '/upload', '/delete']
  const bind = (scope) => {
    const offs = []
    for (const r of routes) {
      try {
        const off = scope.webServer.register({ kind: 'exact', path: BASE + r, handler })
        if (typeof off === 'function') offs.push(off)
      } catch (err) {
        console.error('[_turn-sound] route register failed:', r, err && err.message ? err.message : err)
      }
    }
    return () => {
      for (const off of offs) { try { off() } catch (err) {} }
      offs.length = 0
    }
  }
  if (typeof ctx.inject === 'function') {
    try {
      ctx.inject(['credentials'], (scope) => {
        CRED_CTX = scope
        void refreshBalance(true)
      })
    } catch (err) { BAL_CACHE.err = 'inject-cred: ' + String((err && err.message) || err) }
    ctx.inject(['webServer'], (scope) => {
      const dispose = bind(scope)
      if (typeof scope.effect === 'function') scope.effect(() => dispose)
    })
  } else if (ctx.webServer) {
    return bind(ctx)
  }
}

export default { name: '_turn-sound', apply, BASE }