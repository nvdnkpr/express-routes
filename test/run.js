var assert = require("assert"),
    path = require("path"),
    express = require("express"),
    request = require("supertest"),
    routes = require("../index");

// Setup
var app = express();

app.use(function(req, res){
  res.end();
});

describe('routes', function(){
  describe('.configure()', function(){
    it('should configure the module correctly', function(){
      routes.configure({
        basePath: 'http://local.host',
        prefix: '/app/',
        helpers: {
          generateUrl: 'genUrl'
        }
      });

      assert.equal('http://local.host', routes.config.basePath);
      assert.equal('/app/', routes.config.prefix);
      assert.equal('genUrl', routes.config.helpers.generateUrl);
    });

    it('should configure the directories to look for routes', function(){
      routes.configure({
        directory: path.join(__dirname, 'routes')
      });

      assert.equal(1, routes.config.directory.length);
      assert.equal(path.join(__dirname, 'routes'), routes.config.directory[0]);
    });
  });

  describe('express helper', function(){
    it('should not error when calling the helper', function(){
      routes(app);
    });
  });

  describe('.register()', function(){
    it('should not error if no arguments were provided', function(){
      routes.register();
    });

    it('should error if argument is not an object or an Array', function(){
      try {
        routes.register(true);
      } catch(err) {
        return;
      }

      throw new Error('Supplied an invalid argument but no error was thrown.');
    });

    it('should error if argument provided is an object but with no name or pattern properties', function(){
      try {
        routes.register({});
      } catch(err) {
        return;
      }

      throw new Error('Supplied an invalid route (no name or pattern) but no error was thrown.');
    });

    it('should error if argument provided is an object with name and pattern properties but with an express VERB handler that is not a function', function(){
      try {
        routes.register({
          name: 'route',
          pattern: 'route/',
          get: true
        });
      } catch(err) {
        return;
      }

      throw new Error('Supplied an invalid route (invalid "get" property) but no error was thrown.');
    });

    it('should register 1 route', function(){
      routes.register({
        name: 'route',
        pattern: 'asd/',
        get: function() {}
      });

      if(!('route' in routes._routes))
        throw new Error('Valid route provided for registration, but it was not registered.');
    });
  });

  describe('.generateUrl()', function(){
    it('should generate these URLs correctly', function(){
      routes.register({
        name: 'generateUrl',
        pattern: 'test/:name',
        get: function() {}
      });

      assert.equal('/app/test/test', routes.generateUrl('generateUrl', {name: 'test'}));
      assert.equal('http://local.host/app/test/test', routes.generateUrl('generateUrl', {name: 'test'}, true));
      assert.equal('http://local.host/', routes.generateUrl('http://local.host/'));
      assert.equal('http://local.host/app/test/test?q=something', routes.generateUrl('generateUrl?q=something', {name: 'test'}, true));
      assert.equal('/app/test/test?q=something', routes.generateUrl('generateUrl?q=something', {name: 'test'}));
    });
  });
});

describe('requests', function(){
  it('should be successful', function(done){
    routes.register({
      name: 'request',
      pattern: 'request',
      get: function() {}
    });

    request(app).get('/app/request').expect(200, done);
  });
});