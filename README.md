# Zetta Usage Resource

API Driven analytics collection for the Z2Z protocol.

## Install

`npm install zetta-usage-addon --save`

## Usage

```javascript
var zetta = require('zetta');
var MemDeviceRegistry = require('./memory_device_registry');
var MemPeerRegistry = require('./memory_peer_registry');
var UsageApp = require('zetta-usage-addon');

var options = {};

// Once hub is connected only send metrics every 30 seconds
//options.publishFrequency = 30000;
//options.publishHeaders  = true|falsey
//options.ignoredHeaders = []; Headers to stripout 
//options.enableApi = true|false. Usage api /usage

var app = new UsageApp(options)

zetta({registry: new MemDeviceRegistry(), peerRegistry: new MemPeerRegistry()})
  .name('server.1')
  .use(app.collect())
  .listen(1338);
```

