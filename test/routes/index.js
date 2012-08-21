var routes = require('../../index');

module.exports = exports = function(app) {
  routes.register([{
    name: 'homepage',
    pattern: '',
    get: function(req, res) {}
  },
  {
    name: 'aboutus',
    pattern: 'aboutus',
    get: function(req, res) {}
  }]);
}