#!/usr/bin/env node

const paparam = require('paparam')
const Hyperswarm = require('hyperswarm')
const HypercoreId = require('hypercore-id-encoding')
const goodbye = require('graceful-goodbye')
const Hypercore = require('hypercore')
const tiny = require('tiny-byte-size')
const crayon = require('tiny-crayon')
const HypercoreLogger = require('./')

paparam.command(
  'hypercore-logger',
  paparam.flag('--key, -k <key>', 'log core key'),
  paparam.flag('--peer, -p <key>', 'noise key of peer'),
  paparam.flag('--storage, -s <dir>', 'where to store the core, defaults to /tmp/hypercore-logger'),
  paparam.flag('--since, -sin <timestamp>', 'unix timestamp in seconds'),
  run
).parse()

async function run (r) {
  const storage = r.flags.storage || '/tmp/hypercore-logger'

  let [key, peer] = r.flags.key.split('@')
  if (!peer) peer = r.flags.peer
  const since = r.flags.since
  console.log(since)

  const core = new Hypercore(storage, key)
  const logger = new HypercoreLogger(core)
  const swarm = new Hyperswarm()

  swarm.on('connection', (c) => {
    console.log(crayon.blue('[connected to ' + HypercoreId.encode(c.remotePublicKey) + ']'))
    c.on('close', () => {
      console.log(crayon.blue('[disconnected from ' + HypercoreId.encode(c.remotePublicKey) + ']'))
    })
    core.replicate(c)
  })

  await core.ready()
  swarm.join(core.discoveryKey)

  if (peer) {
    swarm.joinPeer(HypercoreId.decode(peer))
  }

  goodbye(() => swarm.destroy())

  console.log('Tailing', core.id)

  for await (const { timestamp, stats, subsystem, message } of await logger.tail(since)) {
    console.log(crayon.gray(formatStats(timestamp, stats)))
    console.log(crayon.yellow('[' + (subsystem || 'default') + '] ') + crayon.green(message))
  }
}

function formatStats (timestamp, stats) {
  const cpu = 'cpu: ' + (stats.cpu / 100) + '%/' + stats.cpus + ' (' + ((stats.cpuThread / 100) + '% bare)')
  const mem = 'rss: ' + tiny(stats.rss)
  const heap = 'heap: ' + tiny(stats.heapUsed) + ' / ' + tiny(stats.heapTotal)
  const ext = 'ext: ' + tiny(stats.external)
  const delay = 'delay: ' + stats.cpuDelay + ' ms'
  return (new Date(timestamp).toISOString()) + ' | ' + cpu + ' | ' + mem + ' | ' + heap + ' | ' + ext + ' | ' + delay
}
