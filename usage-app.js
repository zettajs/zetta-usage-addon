var UsageResource = require('./UsageResource');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Usage = module.exports = function() {
  EventEmitter.call(this);
};
util.inherits(Usage, EventEmitter);

Usage.prototype.collect = function() {
  var self = this;
  return function(server) {
    var argo = server.httpServer.cloud;
    var usage = {};
    argo.add(UsageResource, usage);
    server.pubsub.subscribe('_peer/connect', function(ev, socket) {
      var name = socket.peer.name;
      var agentSocket = socket.peer.agent.socket;
      var connectionId = socket.peer.connectionId;
      usage[connectionId].requests = 0; 
      argo.server.on('request', function() {
        usage[connectionId].requests++;t  
      });
      usage[connectionId] = { name: name, connectionId: connectionId };
      agentSocket.on('data', function(d) {
        usage[connectionId].bytesWritten = agentSocket.bytesWritten;
        usage[connectionId].bytesRead = agentSocket.bytesRead;  
        usage[connectionId].active = true;
        self.emit('data', usage[connectionId]);
      });

      agentSocket.on('close', function() {
        usage[connectionId].active = false;  
      });
    });
  }  
};


