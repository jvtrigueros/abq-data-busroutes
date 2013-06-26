/*
 * GET bus route
 */

var request = require('request')
  , nconf = require('nconf').file({file: 'config.json'})

exports.route = function (req, response) {
  var route = req.params.route

  if (!(route === 'all' || !isNaN(parseInt(route)))) {
    response.end( JSON.stringify({error: route + " is not valid route"},null,2) )
  }

  request(nconf.get('S3BaseUrl') + nconf.get('S3Options:Key'), function(err, res, body) {
    var routeData = JSON.parse(body)
    if( route === 'all')
      response.jsonp(wrapFeatureCollection(routeData))
    else {
      response.jsonp( wrapFeatureCollection(routeData.filter( function(busRoute) {
        return busRoute.properties.route === route
      })) )
    }
  })
}

function wrapFeatureCollection(features) {
  return {
    type: 'FeatureCollection',
    features: features
  }
}