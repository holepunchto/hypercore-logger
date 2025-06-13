const processTop = require('process-top')
const { getStruct } = require('./spec/hyperschema/index.js')
const inspect = require('./inspect.js')

const encoding = getStruct('@logger/entry')
const hisect = require('hisect')

module.exports = class HypercoreLogger {
  constructor (core) {
    this.core = core
    this.session = core.session({ valueEncoding: encoding })
    this.session.download({ start: 0, end: -1 })
    this.top = processTop()
    this.subsystem = ''
  }

  get discoveryKey () {
    return this.core.discoveryKey
  }

  get key () {
    return this.core.key
  }

  ready () {
    return this.core.ready()
  }

  log (...msg) {
    let s = ''

    for (const m of msg) {
      if (s) s += ' '
      s += inspect(m)
    }

    return this.session.append({
      timestamp: Date.now(),
      stats: this._getStats(),
      subsystem: this.subsystem,
      message: s
    })
  }

  async find (opts) {
    let start
    let end
    if (opts.gte) {
      const target = opts.gte
      const index = await hisect.gte(this.session, target, cmp)

      if (index !== -1) {
        start = index
      }
    } else if (opts.gt) {
      const target = opts.gt
      const index = await hisect.gt(this.session, target, cmp)

      if (index !== -1) {
        start = index
      }
    }

    if (opts.lt) {
      const target = opts.lt
      const index = await hisect.lt(this.session, target, cmp)

      if (index !== -1) {
        end = index + 1
      }
    } else if (opts.lte) {
      const target = opts.lte
      const index = await hisect.lte(this.session, target, cmp)

      if (index !== -1) {
        end = index + 1
      }
    }

    return { start, end }
  }

  tail (opts = {}) {
    return this.session.createReadStream({ live: true, start: opts.start, end: opts.end })
  }

  close () {
    return Promise.all([this.core.close(), this.session.close()])
  }

  _getStats () {
    const cpu = this.top.cpu()
    const cpuThread = this.top.cpuThread()
    const mem = this.top.memory()

    return {
      cpus: this.top.cpus,
      cpu: (cpu.percent * 10_000) | 0,
      cpuThread: (cpuThread.percent * 10_000) | 0,
      cpuDelay: this.top.delay(),
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external
    }
  }
}

function cmp (target, block) {
  return block.timestamp - target
}
