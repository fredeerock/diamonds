var redis = require("redis");
var client = redis.createClient();

var rita = require('rita');

client.on("error", function (err) {
    console.log("Error " + err);
});

getTotal = function (callback) {
  var count = 0;
  Object.keys( items ).forEach( function(key) {
    ++count;
    app.client.llen(items[key].id + '_click', function (err, total) {
      items[key].total = total;
      if ( --count == 0 ) {
        callback( items );
      }
    })
  })
}

getTotal( function(items) {
  console.log( items );
})