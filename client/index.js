window.__ModuleLoader__.load({
  id: '_turn-sound',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports

var BASE = '/_turn-sound'
var ROOT = 'ts-root'
var TOAST = 'ts-toast'
var VER = '0.3.0'
var REPO = 'Buir5/_turn-sound'
var st = {
  cfg: { enabled: true, volume: 0.7, sound: '', opacity: 0.9, x: null, y: null },
  sounds: [], dir: '', audio: null, stamp: 0, primed: false, booted: false, hideTimer: 0
}
var CSS = [
  '#' + ROOT + '{position:fixed;right:14px;bottom:14px;z-index:2147483000;font:13px/1.5 system-ui,-apple-system,sans-serif}',
  '#' + ROOT + ' .bell{width:38px;height:38px;padding:0;margin:0;border:0;outline:0;background:none;cursor:pointer;font-size:22px;line-height:38px;text-align:center;text-shadow:0 0 6px rgba(255,196,90,.55););opacity:.95;transition:transform .15s}',
  '#' + ROOT + ' .bell:hover{transform:scale(1.12)}',
  '#' + ROOT + ' .panel{display:none;position:absolute;right:0;bottom:46px;width:310px;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(16,19,25,.98);color:#e7edf6;box-shadow:0 10px 30px rgba(0,0,0,.5)}',
  '#' + ROOT + ' .panel.open{display:block}',
  '#' + ROOT + ' .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:9px 0}',
  '#' + ROOT + ' select{background:rgba(255,255,255,.07);color:#e7edf6;border:1px solid rgba(255,255,255,.16);border-radius:6px;padding:3px 5px;max-width:172px}',
  '#' + ROOT + ' input[type=range]{width:120px}',
  '#' + ROOT + ' .acts{display:flex;gap:8px;margin-top:12px}',
  '#' + ROOT + ' .act{flex:1;padding:7px 0;border-radius:7px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#e7edf6;cursor:pointer;font-size:12px}',
  '#' + ROOT + ' .act:hover{background:rgba(255,255,255,.16)}',
  '#' + ROOT + ' .tip{margin-top:9px;font-size:11px;color:#8f9bb0;word-break:break-all}',
  '#' + TOAST + '{position:fixed;left:18px;top:18px;z-index:2147483001;min-width:118px;max-width:172px;padding:7px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.18);color:#ffe6ae;font:11px/1.5 ui-monospace,Consolas,monospace;opacity:0;transform:translateY(-6px);transition:opacity .32s,transform .32s,visibility 0s .32s;cursor:move;visibility:hidden;pointer-events:none;user-select:none;',
  '#' + TOAST + '.show{opacity:1;transform:none;visibility:visible;pointer-events:auto;transition:opacity .32s,transform .32s,visibility 0s 0s}',
  '#' + ROOT + ' .bell.upd::after{content:"";position:absolute;margin:-2px 0 0 30px;width:9px;height:9px;border-radius:50%;background:#ff5a4d;box-shadow:0 0 6px #ff5a4d}',
  '#' + ROOT + ' .vrow{margin-top:8px;font-size:11px;color:#7f8b9e}',
  '#' + ROOT + ' .vrow a{color:#7aa7ff;text-decoration:none}',
  '#' + ROOT + ' .vrow a:hover{text-decoration:underline}',
  '#' + ROOT + ' .vnew{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:9px;background:#e0a23c;color:#1b1206;font-weight:700}',
].join('')
function money(v) { return '¥' + (Number(v) || 0).toFixed(4) }
function toks(v) {
  var n = Number(v) || 0
  if (n >= 100000000) return (n / 100000000).toFixed(2) + ' 亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + ' 万'
  return String(n)
}
function play() {
  try {
    var a = st.audio || (st.audio = new Audio())
    a.src = BASE + '/audio?name=' + encodeURIComponent(st.cfg.sound || '') + '&t=' + Date.now()
    a.volume = Math.max(0, Math.min(1, Number(st.cfg.volume)))
    var p = a.play()
    if (p && p.catch) p.catch(function () {})
  } catch (e) {}
}
function toastEl() {
  var el = document.getElementById(TOAST)
  if (el) return el
  el = document.createElement('div')
  el.id = TOAST
  el.addEventListener('mousedown', dragIt)
  document.body.appendChild(el)
  return el
}
function dragIt(ev) {
  if (ev.button !== 0) return
  var el = toastEl()
  var r = el.getBoundingClientRect()
  var ox = ev.clientX - r.left
  var oy = ev.clientY - r.top
  function mv(e) {
    el.style.right = 'auto'
    el.style.left = Math.max(0, e.clientX - ox) + 'px'
    el.style.top = Math.max(0, e.clientY - oy) + 'px'
  }
  function up() {
    document.removeEventListener('mousemove', mv)
    document.removeEventListener('mouseup', up)
    var lx = parseFloat(el.style.left)
    var ly = parseFloat(el.style.top)
    if (!isFinite(lx)) lx = el.getBoundingClientRect().left
    if (!isFinite(ly)) ly = el.getBoundingClientRect().top
    st.cfg.x = Math.round(lx)
    st.cfg.y = Math.round(ly)
    writePos(st.cfg.x, st.cfg.y)
    save(true)
  }
  document.addEventListener('mousemove', mv)
  document.addEventListener('mouseup', up)
}
var POS_KEY = 'ts_pos'
function readPos() {
  try {
    var s = window.localStorage.getItem(POS_KEY)
    if (s) {
      var a = JSON.parse(s)
      if (a && isFinite(Number(a[0])) && isFinite(Number(a[1]))) return { x: Number(a[0]), y: Number(a[1]) }
    }
  } catch (e) {}
  return null
}
function writePos(x, y) {
  try { window.localStorage.setItem(POS_KEY, JSON.stringify([Math.round(x), Math.round(y)])) } catch (e) {}
}
function wantPos() {
  var p = readPos()
  if (p) return p
  var cx = Number(st.cfg.x)
  var cy = Number(st.cfg.y)
  if (isFinite(cx) && isFinite(cy)) return { x: cx, y: cy }
  return null
}
function applyPos(el) {
  var p = wantPos()
  if (!p) { el.style.left = '18px'; el.style.top = '18px'; el.style.right = 'auto'; return }
  var w = el.offsetWidth || 120
  var h = el.offsetHeight || 40
  var maxX = Math.max(0, (window.innerWidth || 1280) - w - 2)
  var maxY = Math.max(0, (window.innerHeight || 800) - h - 2)
  el.style.left = Math.round(Math.min(Math.max(0, p.x), maxX)) + 'px'
  el.style.top = Math.round(Math.min(Math.max(0, p.y), maxY)) + 'px'
  el.style.right = 'auto'
}
function look(el) {
  var op = Number(st.cfg.opacity)
  if (!isNaN(op)) el.style.background = 'rgba(16,20,28,' + op.toFixed(2) + ')'
  applyPos(el)
}
function showToast(w) {
  w = w || {}
  var el = toastEl()
  var cost = Number(w.cost) || 0
  var bal = (w.balance === null || w.balance === undefined) ? null : Number(w.balance)
  var rows = []
  rows.push('<div>扣费  <b style="color:#ff8f6b">-¥' + cost.toFixed(4) + '</b></div>')
  rows.push('<div>余额  <b style="color:#7ee0a6">' + (bal === null || !isFinite(bal) ? "—" : "¥" + bal.toFixed(2)) + '</b></div>')
  el.innerHTML = rows.join('')
  look(el)
  el.classList.add('show')
  clearTimeout(st.hideTimer)
  st.hideTimer = setTimeout(function () { el.classList.remove('show') }, 10000)
}
function api(path, opt) {
  return fetch(BASE + path, opt).then(function (r) { return r.json() })
}
function save(quiet) {
  var en = document.getElementById('ts-en')
  var so = document.getElementById('ts-sound')
  var vo = document.getElementById('ts-vol')
  var op = document.getElementById('ts-op')
  var body = {
    enabled: !!(en && en.checked),
    sound: so ? so.value : st.cfg.sound,
    volume: vo ? Number(vo.value) : st.cfg.volume,
    opacity: op ? Number(op.value) : st.cfg.opacity,
    x: st.cfg.x,
    y: st.cfg.y
  }
  var tip = document.getElementById('ts-tip')
  api('/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    .then(function (j) {
      if (j && j.config) st.cfg = j.config
      if (!quiet && tip) tip.textContent = '已保存 · 音量 ' + Math.round((st.cfg.volume || 0) * 100) + '% · 浮层 ' + Math.round((st.cfg.opacity || 0) * 100) + '%'
    }).catch(function (e) {
      if (!quiet && tip) tip.textContent = '保存失败：' + (e && e.message ? e.message : e)
    })
}
function syncUI() {
  var en = document.getElementById('ts-en')
  var vo = document.getElementById('ts-vol')
  var op = document.getElementById('ts-op')
  var so = document.getElementById('ts-sound')
  var tip = document.getElementById('ts-tip')
  if (en) en.checked = !!st.cfg.enabled
  if (vo) vo.value = String(st.cfg.volume == null ? 0.7 : st.cfg.volume)
  if (op) op.value = String(st.cfg.opacity == null ? 0.9 : st.cfg.opacity)
  if (so) {
    var html = '<option value="">内置 ding</option>'
    for (var i = 0; i < st.sounds.length; i++) {
      var n = st.sounds[i].name
      html += '<option value="' + n.replace(/</g, '&lt;') + '">' + n + '</option>'
    }
    so.innerHTML = html
    so.value = st.cfg.sound || ''
  }
  if (tip) tip.textContent = '目录 ' + (st.dir || '?') + ' ｜ 当前 ' + (st.cfg.sound || '内置 ding')
}
function refresh() {
  return api('/state').then(function (j) {
    if (j && j.config) st.cfg = j.config
    st.sounds = (j && j.sounds) || []
    st.dir = (j && j.dataDir) || ''
    syncUI()
  }).catch(function () {})
}
function upload(file) {
  var tip = document.getElementById('ts-tip')
  if (tip) tip.textContent = '上传中… ' + file.name
  file.arrayBuffer().then(function (buf) {
    return fetch(BASE + '/upload?name=' + encodeURIComponent(file.name), {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: buf
    }).then(function (r) { return r.json() })
  }).then(function (j) {
    if (j && j.config) st.cfg = j.config
    return refresh()
  }).then(function () {
    if (tip) tip.textContent = '已上传：' + file.name
  }).catch(function (e) {
    if (tip) tip.textContent = '上传失败：' + (e && e.message ? e.message : e)
  })
}

function vcmp(a, b) {
  var x = String(a || '0').split('.'), y = String(b || '0').split('.')
  for (var i = 0; i < 3; i++) {
    var n = parseInt(x[i] || '0', 10) || 0, m = parseInt(y[i] || '0', 10) || 0
    if (n > m) return 1
    if (n < m) return -1
  }
  return 0
}
function checkUpdate() {
  try {
    fetch('https://raw.githubusercontent.com/' + REPO + '/main/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (j) {
        var ver = document.getElementById('ts-ver')
        var rel = 'https://github.com/' + REPO + '/releases'
        if (ver) ver.innerHTML = 'v' + VER + ' · <a href="' + rel + '" target=_blank rel="noopener noreferrer">更新日志</a>'
        if (!j || !j.version) return
        if (vcmp(j.version, VER) > 0) {
          var bell = document.getElementById('ts-bell')
          if (bell) { bell.classList.add('upd'); bell.title = '有新版本 v' + j.version + '（当前 v' + VER + '）点开可看说明' }
          if (ver) ver.innerHTML = 'v' + VER + ' → <span class=vnew>v' + j.version + '</span> · <a href="' + (j.url || rel) + '" target=_blank rel="noopener noreferrer">去更新</a>'
        }
      })
      .catch(function () {})
  } catch (e) {}
}
function build() {
  var old = document.getElementById(ROOT)
  if (old) old.parentNode.removeChild(old)
  var root = document.createElement('div')
  root.id = ROOT
  root.innerHTML = [
    '<div class=panel id=ts-panel>',
    '<div class=row><span>启用</span><input type=checkbox id=ts-en></div>',
    '<div class=row><span>声音</span><select id=ts-sound></select></div>',
    '<div class=row><span>音量</span><input type=range id=ts-vol min=0 max=1 step=0.05></div>',
    '<div class=row><span>浮层不透明</span><input type=range id=ts-op min=0 max=1 step=0.05></div>',
    '<div class=row><span>音频文件</span><button class=act id=ts-pick>选择 MP3/WAV</button></div>',
    '<div class=acts><button class=act id=ts-test>试听</button><button class=act id=ts-save>保存</button><button class=act id=ts-show>测浮层</button></div>',
    '<div class=tip id=ts-tip></div>',
    '<div class=vrow id=ts-ver>v' + VER + '</div>',
    '<input type=file id=ts-file accept=audio/* style=display:none>',
    '</div>',
    '<button class=bell id=ts-bell title=回合结束提示音>🔔</button>'
  ].join('')
  document.body.appendChild(root)
  root.querySelector('#ts-bell').addEventListener('click', function () {
    root.querySelector('#ts-panel').classList.toggle('open')
  })
  root.querySelector('#ts-test').addEventListener('click', play)
  root.querySelector('#ts-save').addEventListener('click', function () { save(false) })
  root.querySelector('#ts-show').addEventListener('click', function () {
    api('/usage').then(function (j) {
      var d = payload(j)
      play()
      showToast(d)
      var tip = document.getElementById('ts-tip')
      if (tip) tip.textContent = '浮层测试 · 本轮 ' + money(d.cost) + ' · ' + toks(d.tokens) + ' tokens · 今日 ' + money(d.today)
    }).catch(function () {})
  })
  root.querySelector('#ts-en').addEventListener('change', function () { save(true) })
  root.querySelector('#ts-sound').addEventListener('change', function () { save(false) })
  root.querySelector('#ts-vol').addEventListener('change', function () { save(true) })
  root.querySelector('#ts-op').addEventListener('change', function () { save(true) })
  root.querySelector('#ts-pick').addEventListener('click', function () {
    root.querySelector('#ts-file').click()
  })
  root.querySelector('#ts-file').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0]
    if (f) upload(f)
    ev.target.value = ''
  })
}
function payload(j) {
  var L = (j && j.ledger && j.ledger.last) || null
  var w = (j && j.whale) || null
  return {
    cost: L ? Number(L.cost) || 0 : 0,
    tokens: L ? Number(L.tokens) || 0 : 0,
    model: L ? String(L.model || '') : '',
    today: j && j.ledger ? Number(j.ledger.used) || 0 : 0,
    turns: j && j.ledger ? Number(j.ledger.turns) || 0 : 0,
    balance: j && isFinite(Number(j.balance)) ? Number(j.balance) : (j && isFinite(Number(j.whaleBalance)) ? Number(j.whaleBalance) : null)
  }
}
function busyUI() {
  try {
    var sels = ['button[aria-label*="停止"]', 'button[aria-label*="Stop"]', 'button[aria-label*="终止"]', '[data-testid="stop-button"]']
    for (var i = 0; i < sels.length; i++) { if (document.querySelector(sels[i])) return true }
    var btns = document.querySelectorAll('button')
    for (var b = 0; b < btns.length; b++) {
      var t = String(btns[b].textContent || '').trim()
      if (t === '停止' || t === 'Stop' || t === '停止生成') return true
    }
  } catch (e) {}
  return false
}
function quietArm() {
  if (st.timer) { clearTimeout(st.timer); st.timer = null }
  st.timer = setTimeout(function () { fireOnce() }, 5000)
}
function fireOnce() {
  st.timer = null
  if (busyUI()) { st.timer = setTimeout(function () { fireOnce() }, 2000); return }
  var now = Date.now()
  if (st.lastPlay && now - st.lastPlay < 8000) return
  api('/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }).then(function (r) {
    if (!r || !r.play) return
    st.lastPlay = Date.now()
    if (st.cfg.enabled) play()
    api('/usage').then(function (k) {
      var d = payload(k)
      showToast(d)
      var tip = document.getElementById('ts-tip')
      if (tip) tip.textContent = '上一轮 -' + money(d.cost) + ' · 余额 ' + (d.balance === null ? '—' : '¥' + Number(d.balance).toFixed(2))
    }).catch(function () {})
  }).catch(function () {})
}
function poll() {
  if (document.hidden) return
  var nb = busyUI()
  if (st.busy === true && nb === false) quietArm()
  st.busy = nb
  api('/usage').then(function (j) {
    var L = j && j.ledger && j.ledger.last
    var ts = L ? Number(L.ts) || 0 : 0
    if (ts > st.stamp) { st.stamp = ts; quietArm() }
  }).catch(function () {})
}
function perfKill() {
  try {
    if (document.getElementById('ts-perf')) return
    var pst = document.createElement('style')
    pst.id = 'ts-perf'
    pst.textContent = '*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}'
    document.head.appendChild(pst)
  } catch (e) {}
}
function boot() {
  perfKill()
  if (st.booted) return
  if (window.__tsMounted) return
  if (!document.body) { setTimeout(boot, 200); return }
  window.__tsMounted = true
  st.booted = true
  try {
    var s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
    build()
    refresh().then(function () {
      return api('/usage').then(function (j) {
        var L = j && j.ledger && j.ledger.last
        st.stamp = L ? Number(L.ts) || 0 : 0
      })
    }).then(function () {
      st.busy = busyUI()
    setInterval(poll, 5000)
    checkUpdate()
    })
    window.dshTurnSound = { play: play, show: showToast, refresh: refresh, poll: poll }
  } catch (e) {
    if (window.console) console.error('[turn-sound] boot failed', e)
  }
}

exports.apply = function () { boot() }
exports.default = { name: '_turn-sound', apply: exports.apply }
try {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
} catch (e) {}

    return module.exports
  }
})