var fs = require('fs'),
    path = require('path');

var expressRoutes = module.exports = exports = function(app) {
  // Setting helpers as view application locals
  var locals = {};
  locals[expressRoutes.config.helpers.getPattern] = expressRoutes.getPattern;
  locals[expressRoutes.config.helpers.generateUrl] = expressRoutes.generateUrl;
  app.locals(locals);

  // Keeping reference to app
  expressRoutes.app = app;

  if(!expressRoutes.config.directory) {
    console.warn('You have not set any routes directory (or array of directories). See: expressRoutes.configure');
    expressRoutes.config.directory = [];
  }

  expressRoutes.config.directory.forEach(function(directory) {
    console.info('Loading routes:', directory);
    fs.readdirSync(directory).forEach(function(file) {
      if(!file || file == 'index.js') return;
      if(path.extname(file) != '.js') return;
      var route = path.join(directory, file);
      console.info('Adding route file:', file);
      require(route)(app);
    });
  });
};

expressRoutes.register = function(routes) {
  if(!Array.isArray(routes))
    throw new Error('Trying to register routes but argument passed is not an Array');
  
  routes.forEach(function(route) {
    if(route.name in expressRoutes._routes)
      console.warn('Overwriting route:', route.name);
    else
      console.info('Registering route:', route.name);

    expressRoutes._routes[route.name] = route.pattern;

    ['all','get','post','put','delete'].forEach(function(verb){
      if (verb in route) {
        switch(verb) {
          case 'all':
            expressRoutes.app.all(expressRoutes.getPattern(route.name), route[verb]);
            break;
          case 'get':
            expressRoutes.app.get(expressRoutes.getPattern(route.name), route[verb]);
            break;
          case 'post':
            expressRoutes.app.post(expressRoutes.getPattern(route.name), route[verb]);
            break;
          case 'put':
            expressRoutes.app.put(expressRoutes.getPattern(route.name), route[verb]);
            break;
          case 'delete':
            expressRoutes.app.delete(expressRoutes.getPattern(route.name), route[verb]);
            break;
        }
      }
    });
  });
};

/**
 * Object holding the registered routes (name: pattern)
 * @type {Object}
 */
expressRoutes._routes = expressRoutes._routes || {};

/**
 * Default Configuration 
 * @type {Object}
 */
expressRoutes.config = expressRoutes.config || {
  basePath: null,
  directory: null,
  prefix: '/',
  helpers: {
    generateUrl: 'url',
    getPattern: 'pattern'
  }
};

/**
 * Function to configure the module
 * @param  {Object} config Configuration to override the default configuration for the module
 */
expressRoutes.configure = function(config) {
  var oldDirectory = expressRoutes.config.directory;
  
  expressRoutes.config = expressRoutes.config.extend(config);
  if(!Array.isArray(expressRoutes.config.directory))
    expressRoutes.config.directory = [expressRoutes.config.directory];

  if(oldDirectory) {
    if(!Array.isArray(oldDirectory))
      oldDirectory = [oldDirectory];
    expressRoutes.config.directory = oldDirectory.concat(expressRoutes.config.directory);
  }
};

/**
 * Gets the pattern for the route with the specified name
 * @param  {String}   routeName Name of the route
 * @param  {Boolean}  absolute  Whether to return an absolute URL pattern
 * @return {String}             The URL pattern
 */
expressRoutes.getPattern = function(routeName, absolute) {
  if(!(routeName in expressRoutes._routes))
    if(app.settings.env == 'development')
      throw new Error('Tried to get pattern for "' + routeName + '" but it hasn\'t been registered');
    else
      return null;

  return (absolute? expressRoutes.config.basePath : '') + expressRoutes.config.prefix + expressRoutes._routes[routeName];
};

/**
 * Generates the URL for the route with the specified name, using the specified parameters
 * @param  {String}   routeName       Name of the route
 * @param  {Object}   routeParameters Object containing the values of the parameters in the route pattern
 * @param  {Boolean}  absolute        Whether to return an absolute URL pattern
 * @return {String}                   The generated URL
 */
expressRoutes.generateUrl = function(routeName, routeParameters, absolute) {
  if(typeof routeParameters == 'boolean') {
    absolute = routeParameters;
    routeParameters = null;
  }

  var url = expressRoutes.getPattern(routeName, absolute);
  
  if(url && routeParameters) {
    var paramNames = Object.getOwnPropertyNames(routeParameters);
    paramNames.forEach(function(paramName) {
      url = url.replace(new RegExp("\:"+paramName,"i"),routeParameters[paramName]);
    });
  }

  return url;
};

if(!('extend' in Object.prototype)) {
  Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from) {
        var props = Object.getOwnPropertyNames(from);
        var dest = this;
        props.forEach(function(name) {
            if (name in dest) {
                var destination = Object.getOwnPropertyDescriptor(from, name);
                Object.defineProperty(dest, name, destination);
            }
        });
        return this;
    }
  });
}