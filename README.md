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

## License

Apache-2.0
