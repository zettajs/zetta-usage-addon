var assert = require('assert');
var request = require('supertest');
var zetta = require('zetta');
var zettacluster = require('zetta-cluster');

var Photocell = require('zetta-photocell-mock-driver');
var UsageApp = require('../');

describe('ZettaUsage', function() {
  
  it('receives usage from hub', function(done) {
    var collector = new UsageApp({ publishFrequency: 10 });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    collector.once('data', function(msg) {
      assert.equal(msg.name, 'test1');
      assert.equal(msg.active, true);
      assert(msg.connectionId);
      assert(msg.connected);
      assert.equal(typeof msg.bytesRead, 'number');
      assert.equal(typeof msg.bytesWritten, 'number');
      cluster.stop();
      setTimeout(done, 10);
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });


  it('receives a usage with active=false when hub disconnects', function(done) {
    var collector = new UsageApp({ publishFrequency: 10000 });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    cluster.on('ready', function() {
      collector.once('data', function(msg) {
        assert(msg.disconnected);
        assert.equal(msg.active, false);
        cluster.stop();
        setTimeout(done, 10);
      });

      cluster.servers['cloud'].httpServer.peers['test1'].close()
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });


  it('will only emit data events at internal set in options', function(done) {
    var interval = 1000;
    var delay = interval*3 + interval/4;
    var collector = new UsageApp({ publishFrequency: interval });
    var dataCollector = function(runtime) {
      runtime.pubsub.subscribe('_peer/connect', function(ev, msg) {
        msg.peer.subscribe('**');
      });
    };
    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect(), dataCollector])
        .server('test1', [Photocell], ['cloud']);

    var received = 0;
    cluster.on('ready', function() {
      collector.on('data', function(msg) {
        received++;
      });
    });

    setTimeout(function() {
      var c = delay/interval;
      assert(received > c-1 && received < c+1, 'should have received ' + c + ' but instead received ' + received);
      cluster.stop();
      setTimeout(done, 10);
    }, delay)

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  })

  it('includes headers that are not ignored', function(done) {
    var collector = new UsageApp({ publishFrequency: 10, ignoredHeaders: ['host'] });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    collector.once('data', function(msg) {
      assert.equal(Object.keys(msg.headers).length, 4);
      cluster.stop();
      setTimeout(done, 10);
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });

  it('publishHeaders disables headers in message', function(done) {
    var collector = new UsageApp({ publishFrequency: 10, publishHeaders: false });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    collector.once('data', function(msg) {
      assert.equal(msg.headers, undefined);
      cluster.stop();
      setTimeout(done, 10);
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });

  it('api enabled by default /', function(done) {
    var collector = new UsageApp({ publishFrequency: 10 });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    cluster.once('ready', function() {
      request(cluster.servers['cloud'].httpServer.server)
        .get('/usage')
        .expect(function(res) {
          var json = JSON.parse(res.text);
          assert(json.class.indexOf('usage') >= 0);
          assert.equal(json.links.length, 2);
          assert.equal(json.entities.length, 1);
        })
        .end(done);
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });

  it('enableApi would disables api when false', function(done) {
    var collector = new UsageApp({ enableApi: false });

    var cluster = zettacluster({ zetta: zetta })
        .server('cloud', [collector.collect()])
        .server('test1', [Photocell], ['cloud']);

    cluster.once('ready', function() {
      request(cluster.servers['cloud'].httpServer.server)
        .get('/usage')
        .expect(404)
        .end(done);
    });

    cluster.run(function(err) {
      if (err) {
        done(err);
      }
    });
  });

   
});
