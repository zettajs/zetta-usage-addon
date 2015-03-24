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

var app = new UsageApp()


zetta({registry: new MemDeviceRegistry(), peerRegistry: new MemPeerRegistry()})
  .name('server.1')
  .use(app.collect())
  .listen(1338);
```

