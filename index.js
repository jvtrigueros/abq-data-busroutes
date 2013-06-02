/**
 * User: Jose V. Trigueros
 */
var fs = require('fs')
   ,xml2js = require('xml2js')
   ,inspect = require('eyes').inspector({maxLength: false})

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
//        console.log(util.inspect(result,false,null))
        inspect(result.document.placemark)
    })
})
