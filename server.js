var zetta = require('zetta');
var MemDeviceRegistry = require('./memory_device_registry');
var MemPeerRegistry = require('./memory_peer_registry');
var UsageApp = require('./usage-app');
var Collector = require('./sqs-collector');

var app = new UsageApp()
var opts = {
  queueUrl: process.env.QUEUE_URL,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  collector: app
}
Collector(app);

zetta({registry: new MemDeviceRegistry(), peerRegistry: new MemPeerRegistry()})
  .name('server.1')
  .use(app.collect())
  .listen(1338);


