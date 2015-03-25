var url = require('url');

var UsageResource = module.exports = function(usage, name) {
  this.usage = usage;
  this.name = name;
  this.topic = 'usage%2Fstats';
};

UsageResource.prototype.init = function(config) {
  config
    .path('/usage')
    .get('/health', this.health)
    .get('/', this.list);  
};

UsageResource.prototype.list = function(env, next) {
  var doc = {};
  var self = this;
  doc.class = ['usage'];
  doc.links = [{rel: ['self'], href: env.helpers.url.current()}];
  doc.links.push({
    title: 'usage',
    rel: ['monitor'],
    href: env.helpers.url.path('/servers/'+ this.name + '/events').replace('http', 'ws') + url.format({ query: { topic: this.topic }})
  });
  doc.entities = [];
  Object.keys(this.usage).forEach(function(hub) {
    doc.entities.push(self.usage[hub]);  
  });

  env.response.body = doc;
  env.response.statusCode = 200;
  next(env);
};

UsageResource.prototype.health = function(env, next) {
  env.response.statusCode = 200;
  env.response.body = 'Healthy';
  next(env);  
};
