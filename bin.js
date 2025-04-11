#!/usr/bin/env node

const paparam = require('paparam')
const Hyperswarm = require('hyperswarm')
const HypercoreId = require('hypercore-id-encoding')
const goodbye = require('graceful-goodbye')
const Hypercore = require('hypercore')
const HypercoreLogger = require('./')

paparam.command(
  'hypercore-logger',
  paparam.flag('--key, -k <key>', 'log core key'),
  paparam.flag('--peer, -p <key>', 'noise key of peer'),
  paparam.flag('--storage, -s <dir>', 'where to store the core, defaults to /tmp/hypercore-logger'),
  run
).parse()

async function run (r) {
  const storage = r.flags.storage || '/tmp/hypercore-logger'

  let [key, peer] = r.flags.key.split('@')
  if (!peer) peer = r.flags.peer

  const core = new Hypercore(storage, key)
  const logger = new HypercoreLogger(core)
  const swarm = new Hyperswarm()

  swarm.on('connection', (c) => {
    console.log('[connected to ' + HypercoreId.encode(c.remotePublicKey) + ']')
    c.on('close', () => {
      console.log('[disconnected from ' + HypercoreId.encode(c.remotePublicKey) + ']')
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

  for await (const { timestamp, stats, message } of logger.tail()) {
    console.log('???')
    console.log((new Date(timestamp)).toISOString() + ' ' + formatStats(stats) + ': ' + message)
  }
}

function formatStats () {
  return '[todo]'
}
