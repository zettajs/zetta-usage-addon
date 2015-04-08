var zetta = require('zetta');
var MemDeviceRegistry = require('./memory_device_registry');
var MemPeerRegistry = require('./memory_peer_registry');
var UsageApp = require('zetta-usage-addon');
var Rx = require('rx');

var app = new UsageApp()

app.on('data', function(d) {
  //plug into addon data events for more real time statistics.
});



zetta({registry: new MemDeviceRegistry(), peerRegistry: new MemPeerRegistry()})
  .name('server.1')
  .use(app.collect())
  .listen(1338);


