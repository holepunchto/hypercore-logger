import HypercoreLogger from './index.js'
import Hypercore from 'hypercore'

const logger = new HypercoreLogger(new Hypercore('/tmp/core'))

logger.tail()
  .on('data', console.log)

let tick = 0

setInterval(() => {
  logger.log({ tick: tick++ })
}, 1000)
