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

  async tail (opts = {}) {
    let startIndex
    let endIndex
    if (opts.gte) {
      const index = await hisect(this.session, (block) => {
        const value = Number(block.timestamp)
        if (value < opts.gte) return -1
        if (value > opts.gte) return 1
        return 0
      })

      if (index !== -1) {
        startIndex = index
      }
    } else if (opts.gt) {
      const gt = Number(opts.gt)
      const index = await hisect(this.session, (block) => {
        const value = Number(block.timestamp)
        return value <= gt ? -1 : 0
      })

      if (index !== -1) {
        startIndex = index
      }
    }

    if (opts.lt) {
      const lt = Number(opts.lt)
      const index = await hisect(this.session, (block) => {
        const value = Number(block.timestamp)
        if (value < lt) return -1
        if (value > lt) return 1
        return 0
      })

      if (index !== -1) {
        endIndex = index
      }
    } else if (opts.lte) {
      const lte = Number(opts.lte)
      const index = await hisect(this.session, (block) => {
        const value = Number(block.timestamp)
        return value <= lte ? -1 : 0
      })

      if (index !== -1) {
        endIndex = index
      }
    }

    return this.session.createReadStream({ live: true, start: startIndex, end: endIndex })
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
