var UsageResource = module.exports = function(usage) {
  this.usage = usage;
};

UsageResource.prototype.init = function(config) {
  config
    .path('/usage')
    .get('/health', this.health)
    .get('/', this.list);  
};

UsageResource.prototype.list = function(env, next) {
  var doc = {}
  var self = this;
  doc.class = ['usage']
  doc.links = [{rel: ['self'], href: env.helpers.url.current()}]
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
