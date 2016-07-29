var UsageResource = require('./usage_resource');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

// Headers to strip

var IGNORED_HEADERS = ['connection',
                      'sec-websocket-version',
                      'upgrade',
                      'sec-websocket-key',
                      'authorization',
                      'host'];

var Usage = module.exports = function(options) {
  if (options === undefined) {
    options = {};
  }

  // Once hub is connected only send metrics every 30 seconds
  this.publishFrequency = options.publishFrequency || 30000; // 30s

  this.publishHeaders = (options.publishHeaders === undefined) ? true : !!(options.publishHeaders);
  this.ignoredHeaders = options.ignoredHeaders || IGNORED_HEADERS;
  this.enableApi = (options.enableApi === undefined) ? true : !!(options.enableApi);

  EventEmitter.call(this);
};
util.inherits(Usage, EventEmitter);

Usage.IGNORED_HEADERS = IGNORED_HEADERS;

Usage.prototype.collect = function() {
  var self = this;
  return function(server) {
    var cloud = server.httpServer.cloud;
    var requestServer = server.httpServer.server;
    var name = server.httpServer.zetta.id;
    var usage = {};
    var timers = {};

    if (self.enableApi) {
      cloud.add(UsageResource, usage, name);
    }

    server.pubsub.subscribe('_peer/connect', function(ev, socket) {
      var name = socket.peer.name;
      var agentSocket = socket.peer.agent.socket;
      var connectionId = socket.peer.connectionId;
      usage[connectionId] = { name: name, connectionId: connectionId };

      if (self.publishHeaders) {
        usage[connectionId].headers = {};
        Object.keys(socket.peer.ws.upgradeReq.headers).forEach(function(k) {
          if (self.ignoredHeaders.indexOf(k) >= 0) {
            return;
          }
          usage[connectionId].headers[k] = socket.peer.ws.upgradeReq.headers[k];
        });
      }
      
      usage[connectionId].bytesWritten = 0;
      usage[connectionId].bytesRead = 0;  
      usage[connectionId].active = true;
      usage[connectionId].connected = new Date().getTime();

      timers[connectionId] = setInterval(function() {
        usage[connectionId].bytesWritten = agentSocket.bytesWritten;
        usage[connectionId].bytesRead = agentSocket.bytesRead;
        usage[connectionId].active = true;

        self.emit('data', usage[connectionId]);
      }, self.publishFrequency);
    });

    server.pubsub.subscribe('_peer/disconnect', function(ev, socket) {
      var connectionId = socket.peer.connectionId

      clearInterval(timers[connectionId]);
      delete timers[connectionId];

      if (!usage[connectionId]) {
        return;
      }

      var agentSocket = socket.peer.agent.socket;
      usage[connectionId].bytesWritten = agentSocket.bytesWritten;
      usage[connectionId].bytesRead = agentSocket.bytesRead;
      usage[connectionId].active = false;  
      usage[connectionId].disconnected = new Date().getTime();

      self.emit('data', usage[connectionId]);
      delete usage[connectionId];
    });
  }  
};


