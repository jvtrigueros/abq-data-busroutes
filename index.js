/**
 * User: Jose V. Trigueros
 */
var fs = require('fs')
   ,xml2js = require('xml2js')
//   ,inspect = require('eyes').inspector({maxLength: false})
   ,traverse = require('traverse')

var parser = new xml2js.Parser({
    trim: true,
    normalize: true,
    normalizeTags: true,
    ignoreAttrs: true,
    explicitRoot: false,
    explicitArray: false
})

function kml2json(kmlString, callback) {
    parser.parseString(kmlString, function(err, result) {
//        inspect(result)
        var routes = result.document.placemark

        var jsonRoute = []
        routes.forEach(function(route){
            var currentRoute = {
                route: route.name,
                description: {
                    coordinates: route.point.coordinates,
                    heading: route.style.iconstyle.heading
                }
            }

            route.description.table.tr.forEach( function(tr) {
                var td = tr.td
                if(td[0].match(/.*(vehicle).*/i)) {
                    currentRoute.description['vehicle'] = td[1]
                } else if(td[0].match(/.*(speed).*/i)) {
                    currentRoute.description.speed = td[1]
                } else if(td[0].match(/.*(time).*/i)) {
                    currentRoute.description.timestamp = td[1]
                } else if(td[0].match(/.*(stop).*/i)) {
                    currentRoute.description.destination = td[1]
                }
            })

            jsonRoute.push(currentRoute)
        })
//        console.log(jsonRoute)
//        fs.writeFile('test/allroutes.json',JSON.stringify(jsonRoute,null,2))
        callback(JSON.stringify(jsonRoute,null,2))
    })
}

fs.readFile(__dirname + '/test/allroutes.kml', function(err, kmlString) {
  kml2json(kmlString, console.log)
})
