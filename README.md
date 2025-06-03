# hypercore-logger

Distributed logger

```
npm install hypercore-logger
```

## Usage

``` js
const Logger = require('hypercore-logger')

// pass backing hypercore
const log = new Logger(core)

// add a log message
await log.log({ hello: 'world' })
```

Setup swarming with Hyperswarm on the core and somewhere else

```js
const log = new Logger(core)

for await (const { timestamp, stats, message } of log.tail()) {
  console.log(timestamp, stats, message)
}
```

## API

### `Logger`

#### `const log = new Logger(core)`

Create a new logger backed by a [Hypercore](https://github.com/holepunchto/hypercore) (`core`).

#### `log.discoveryKey`

The [`discoverKey`](https://github.com/holepunchto/hypercore#corediscoverykey) of the Hypercore backing the log.

#### `log.key`

The [`key`](https://github.com/holepunchto/hypercore#corekey) of the Hypercore backing the log.

#### `await log.ready()`

Wait for the log to fully open.

#### `await log.log(...msg)`

Log the `msg` arguments as a string representation intended for debugging, like `console.log()`'s output.

In addition to the string representation, metadata is automatically added to each log. Each appended to the backing Hypercore will look like:

```
{
  timestamp: Date.now(),
  stats: Stats,
  subsystem: log.subsystem,
  message: '' // String representation of msg
}
```

`Stats` includes:

```
stats: {
  cpus: number, // Number of avaliable cpus
  cpu: number, // Precent of CPU usage
  cpuThread: number, // Percent of thread usage
  cpuDelay: number, // Event loop delay the last ~5s
  rss: integer, // Resident Set Size
  heapUsed: integer, // Amount of heap used in js engine
  heapTotal: integer, // Total size of heap in js engine
  external: integer, // Memory usage of C++ objects bound to JavaScript objects
}
```

The block is encoded via the [Hyperschema](https://github.com/holepunchto/hyperschema) schema [`@logger/entry`](./build.js).

#### `const stream = log.tail(opts)`

Returns a live Readable Stream of the contents of the log. Acts like `tail -f`
on a file, showing new data as it's appended.

- start: Index of the starting block
- end: Index of the end block

Example:
```js
for await (const { timestamp, stats, message } of log.tail()) {
  console.log(timestamp, stats, message)
}
```

#### `await logger.find(opts)`

Find start and end blocks to apply filters

- opts.gte: Start at the first entry with a timestamp >= gte
  
- opts.gt: Start at the first entry with a timestamp > gt

- opts.lte: End before the first entry with timestamp > lte

- opts.lt: End before the first entry with timestamp >= lt


#### `await log.close()`

Fully close the log and the Hypercore backing it.

## CLI

Comes with a CLI tool for tailing a hypercore-logger.

```
npm install -g hypercore-logger
hypercore-logger --key <key>
```

Usage:

```
hypercore-logger [flags]

Flags:
  --key, -k <key>       log core key
  --peer, -p <key>      noise key of peer
  --storage, -s <dir>   where to store the core, defaults to /tmp/hypercore-logger
  --help|-h             Show help
```

## License

Apache-2.0
