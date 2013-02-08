fs = require 'fs'
path = require 'path'
debug = require('debug') 'routes'
extend = require 'node.extend'

_ = require 'underscore'

expressRoutes = module.exports = exports = (app) ->
  # Setting helpers as view response locals
  app.use (req, res, next) ->
    res.locals[expressRoutes.config.helpers.getPattern] = expressRoutes.getPattern;
    res.locals[expressRoutes.config.helpers.generateUrl] = expressRoutes.generateUrl;
    next()
  
  # keep reference to app
  expressRoutes.app = app
  
  if not expressRoutes.config.directory?
    debug 'You have not set any routes directory (or array of directories). See: expressRoutes.configure'
    expressRoutes.config.directory = []
  
  expressRoutes.config.directory.forEach (directory) ->
    debug 'Loading routes: %s', directory
    fs.readdirSync(directory).forEach (file) ->
      return if not file or (file is 'index.js')
      return if path.extname file is '.js' and path.extname file is '.coffee'
      route = path.join directory, file
      debug 'Adding route file: %s', file
      require(route) app


expressRoutes.register = (routes) ->
  
  return if not routes
  
  if {}.toString.call routes is '[object Object]'
    routes = [routes] 
  else if not Array.isArray routes
    throw new Error 'Argument supplied is neither a route nor an Array of rout'
    
  routes.forEach (route) ->
    if 'name' not of route or 'pattern' not of route
      throw new Error "One of the routes is invalid: #{console.dir route}"
    # TODO: require 'methods' package and use their 'verbs'
    ['all','get','post','put','delete'].forEach (verb) ->
      if verb in route and typeof route[verb] isnt 'function' # and not Array.isArray route[verb]
        throw new Error "The route #{route.name} is trying to register a #{verb} handler that is not a function or an array of functions" 
      
  routes.forEach (route) ->
    # console.dir expressRoutes._routes
    if route.name of expressRoutes._routes
      debug "Overwriting route: #{route.name}"
    else
      debug "Registering route: #{route.name}"
    
    # TODO: change datastructure to add the method verb too to have all information  together...
    # TODO: require 'methods' package and us their 'verbs'
    # console.log route
    ['all','get','post','put','delete'].forEach (verb) ->
      # console.log verb, route, verb of route
      if verb of route
        routeObj = {name: route.name, pattern: route.pattern, method: verb}
        # console.dir routeObj
        expressRoutes._routes[route.name] = routeObj
        # console.dir expressRoutes._routes
        
        # FIX ME: use not only one middleware but a array of middlewares like it's intended
        # console.log 'Verb', verb, 'Pattern', expressRoutes.getPattern(route.name), 'type of callbacks', Array.isArray(route[verb])
        expressRoutes.app[verb](expressRoutes.getPattern(route.name), route[verb])
        


###
  Object holding the registered routes (name: pattern)
  @type {Object}
###
expressRoutes._routes = expressRoutes._routes or {};

###
  Default Configuration 
  @type {Object}
###
expressRoutes.config = expressRoutes.config or {
  basePath: null
  directory: null
  prefix: '/'
  helpers:
    generateUrl: 'url'
    getPattern: 'pattern'
}



###
  Function to configure the module
  @param  {Object} config Configuration to override the default configuration for the module
###
expressRoutes.configure = (config) ->
  return if not config
  
  routesConf = expressRoutes.config
  oldDirectory = routesConf.directory
  
  extend true, routesConf, config
  
  routesConf.directory = [] if not routesConf.directory
  
  routesConf.directory = [routesConf.directory] if not Array.isArray routesConf.directory
  
  if not not oldDirectory
    if not Array.isArray oldDirectory
      oldDirectory = [oldDirectory]
    routesConf.directory = oldDirectory.concat routesConf.directory


###
  Gets the pattern for the route with the specified name
  @param  {String}   routeName Name of the route
  @param  {Boolean}  absolute  Whether to return an absolute URL pattern
  @return {String}             The URL pattern
###
expressRoutes.getPattern = (routeName, absolute) ->
  if routeName not of expressRoutes._routes
    if expressRoutes.app.settings.env is 'development'
      throw new Error "Tried to get pattern for #{routeName} but it hasn't been registered"
    else
      return null
  return (if absolute then expressRoutes.config.basePath else '') + expressRoutes.config.prefix + expressRoutes._routes[routeName].pattern


###
  Generates the URL for the route with the specified name, using the specified parameters
  @param  {String}   routeName       Name of the route
  @param  {Object}   routeParameters Object containing the values of the parameters in the route pattern
  @param  {Boolean}  absolute        Whether to return an absolute URL pattern
  @return {String}                   The generated URL
###
expressRoutes.generateUrl = (routeName, routeParameters, absolute) ->
  if typeof routeParameters is 'boolean'
    absolute = routeParameters
    routeParameters = null
  
  url = routeName
  parts = url.split '?'
  
  if parts.length > 1
    url = parts[0]
    query = parts[1]
  
  try
    url = expressRoutes.getPattern url, absolute
  catch err
    console.error err
  
  if url? and routeParameters?
    paramNames = Object.getOwnPropertyNames routeParameters
    paramNames.forEach (paramName) ->
      url = url.replace new RegExp("\:#{paramName}","i"), routeParameters[paramName]
  
  return if query then "#{url}?#{query}" else url


