/**
 * User: Jose V. Trigueros
 */
var fs = require('fs')
   ,xml2js = require('xml2js')
   ,inspect = require('eyes').inspector({maxLength: false})
   ,traverse = require('traverse')

var parser = new xml2js.Parser({
    trim: true,
    normalize: true,
    normalizeTags: true,
    ignoreAttrs: true,
    explicitRoot: false,
    explicitArray: false
})

fs.readFile(__dirname + '/test/allroutes.kml', function(err, data) {
    parser.parseString(data, function(err, result) {
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

            var rawDescription = traverse(route.description.table.tr).reduce( function(acc,node) {
                if(this.key === 'td') {
                    if(node[0].match(/.*(vehicle).*/i)) {
                        acc.push({vehicle: node[1]})
                    } else if(node[0].match(/.*(speed).*/i)) {
                        acc.push({speed: node[1]})
                    } else if(node[0].match(/.*(time).*/i)) {
                        acc.push({timestamp: node[1]})
                    } else if(node[0].match(/.*(stop).*/i)) {
                        acc.push({destination: node[1]})
                    }
                    this.delete(true)
                }
                return acc
            })

            rawDescription = rawDescription.filter(function(n){ return Object.keys(n).length !== 0 })
            rawDescription.forEach(function(item) {
                var key = Object.keys(item)[0]
                currentRoute.description[key] = item[key]
            })
            jsonRoute.push(currentRoute)
        })
        console.log(jsonRoute)
        fs.writeFile('test/allroutes.json',JSON.stringify(jsonRoute))
    })
})
