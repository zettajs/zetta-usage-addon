var UsageResource = require('./usage_resource');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Usage = module.exports = function() {
  EventEmitter.call(this);
};
util.inherits(Usage, EventEmitter);

Usage.prototype.collect = function() {
  var self = this;
  return function(server) {
    var cloud = server.httpServer.cloud;
    var requestServer = server.httpServer.server;
    var usage = {};
    cloud.add(UsageResource, usage);
    server.pubsub.subscribe('_peer/connect', function(ev, socket) {
      var name = socket.peer.name;
      var agentSocket = socket.peer.agent.socket;
      var connectionId = socket.peer.connectionId;
      usage[connectionId] = { name: name, connectionId: connectionId };
      usage[connectionId].bytesWritten = 0;
      usage[connectionId].bytesRead = 0;  
      usage[connectionId].active = true;
      usage[connectionId].connected = new Date().getTime();

      agentSocket.on('data', function(d) {
        usage[connectionId].bytesWritten = agentSocket.bytesWritten;
        usage[connectionId].bytesRead = agentSocket.bytesRead;  
        usage[connectionId].active = true;
        self.emit('data', usage[connectionId]);
      });

      server.pubsub.subscribe('_peer/disconnect', function() {
        usage[connectionId].active = false;  
        usage[connectionId].disconnected = new Date().getTime();
        self.emit('data', usage[connectionId]);
      });
    });
  }  
};


