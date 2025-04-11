const Hyperschema = require('hyperschema')

const SPEC = './spec/hyperschema'

const schema = Hyperschema.from(SPEC, { versioned: false })
const logger = schema.namespace('logger')

logger.register({
  name: 'stats',
  fields: [{
    name: 'cpus',
    type: 'uint',
    required: true
  }, {
    name: 'cpu',
    type: 'uint', // 10000 * pct
    required: true
  }, {
    name: 'cpuThread',
    type: 'uint', // 10000 * pct
    required: true
  }, {
    name: 'cpuDelay',
    type: 'uint',
    required: true
  }, {
    name: 'rss',
    type: 'uint',
    required: true
  }, {
    name: 'heapUsed',
    type: 'uint',
    required: true
  }, {
    name: 'heapTotal',
    type: 'uint',
    required: true
  }, {
    name: 'external',
    type: 'uint',
    required: true
  }]
})

logger.register({
  name: 'entry',
  fields: [{
    name: 'timestamp',
    type: 'uint',
    required: true
  }, {
    name: 'stats',
    type: '@logger/stats'
  }, {
    name: 'subsystem',
    type: 'string'
  }, {
    name: 'message',
    type: 'string'
  }]
})

Hyperschema.toDisk(schema, SPEC)
