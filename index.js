/**
 * Author: Jose V. Trigueros
 */
var fs = require('fs')
   ,xml2js = require('xml2js')
   ,http = require('http')
   ,request = require('request')
   ,AWS = require('aws-sdk')
   ,nconf = require('nconf').file({file:__dirname + '/config.json'})
//   ,inspect = require('eyes').inspector({maxLength: false})

// I don't like to be forced to use the payload this way! hmpf!
var payloadIdx = -1
process.argv.forEach( function(val, idx) {
    if ( val == '-payload' )
        payloadIdx = idx + 1
})

fs.readFile(process.argv[payloadIdx], 'ascii', function(err, payload) {
    var awsKey = JSON.parse(payload)
    AWS.config.update({
        accessKeyId: awsKey.access,
        secretAccessKey:awsKey.secretaccess,
        region: awsKey.region
    })
})

var parser = new xml2js.Parser({
    trim: true,
    normalize: true,
    normalizeTags: true,
    ignoreAttrs: true,
    explicitRoot: false,
    explicitArray: false
})

var s3Options = nconf.get('S3Options')
var s3PutObject = {
  ACL: s3Options.ACL,
  Bucket: s3Options.Bucket,
  ContentType: s3Options.ContentType
}

function kml2json(kmlString, callback) {
    parser.parseString(kmlString, function(err, result) {
//        inspect(result)
      try {
        var routes = result.document.placemark
        var jsonRoute = []
        if (routes !== undefined) {
          routes.forEach(function (route) {
            var currentRoute = {
              route      : route.name,
              description: {
                coordinates: route.point.coordinates,
                heading    : route.style.iconstyle.heading
              }
            }
            // TODO: There is probably a fancier way of doing this mumbo jumbo
            route.description.table.tr.forEach(function (tr) {
              var td = tr.td
              if (td[0].match(/.*(vehicle).*/i)) {
                currentRoute.description['vehicle'] = td[1]
              } else if (td[0].match(/.*(speed).*/i)) {
                currentRoute.description.speed = td[1].split(' ')[0]
              } else if (td[0].match(/.*(time).*/i)) {
                currentRoute.description.timestamp = td[1]
              } else if (td[0].match(/.*(stop).*/i)) {
                currentRoute.description.destination = td[1]
              }
            })

            jsonRoute.push(currentRoute)
          })
        }
        callback(JSON.stringify(jsonRoute, null, 2))
      } catch (e) {
        console.log(e)
        var s3 = new AWS.S3()
        s3PutObject.Key = 'error_'+ Date.now() +'.xml'
        s3PutObject.Body = kmlString
        s3.putObject(s3PutObject)
        callback({error: e})
      }
    })
}

// TODO: Convert this into a test of some sort
//fs.readFile(__dirname + '/test/allroutes.kml', function(err, kmlString) {
//  kml2json(kmlString, console.log)
//})

request(nconf.get('RouteBaseUrl') + nconf.get('Route'), function(err,res,body) {
    kml2json(body, function(jsonRoute) {
        var s3 = new AWS.S3()
        s3PutObject.Key = s3Options.Key
        s3PutObject.Body = jsonRoute
        s3.putObject(s3PutObject,function(err,data){
            if(err)
                console.log("Route data could not be save due to: " + err)
            else
                console.log("Successfully uploaded route data!")
        })
    })
})
