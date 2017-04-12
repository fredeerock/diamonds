// load required modules
var redis = require("redis");
var csv = require('csv-parser');
var fs = require('fs');

var redisPortNumber = 6379;
const RedisServer = require('redis-server');
 
// Simply pass the port that you want a Redis server to listen on.
const rserver = new RedisServer(redisPortNumber);
 
rserver.open((err) => {
	
	if (err !== null) {
		console.log(err);
	}

	if (err === null) {

		if(rserver.isRunning) {
	  		console.log("Redis server started on port " + redisPortNumber + ".")
	  	}


    // You may now connect a client to the Redis
    // server bound to `server.port` (e.g. 6379).


// function loadTheDatabase(callback1) {
		var client = redis.createClient();

		client.on("error", function (err) {
		    console.log("Error " + err);
		});

		// list name for storing as a list
		var listName = "items";
		// TextName for storing as a set
		var textName = "tedTalks"
		// Path to the data to load.  csv file.
		var dataSet = "data/corpus.csv";

		// clear the list (if using a list)
		//client.ltrim(listName, -1, -2, handleTrim);

		// Done Trimming (if trimming the list)
		// function handleTrim() {
		// 	console.log("---Trimmed---");
		// }

		// Clean out the database 
		client.flushall( function (err, res) {
		    console.log("Flush went:", res + "."); // will be true if successfull
		    // Load the data.
			fs.createReadStream(dataSet).pipe(csv()).on('data', handleRow).on('end', handleEnd);
		});

		// push each row into redis as a string
		function handleRow(data) {
		  	// console.log(data.title, "by", data.author)

						// ---- Load the texts into the set.
						// Uncomment if using a list instead of sets to store the texts. //
			// client.rpush(listName, JSON.stringify(data, escape), redis.print);
				// Load the data as a set //
			// console.log(escape);
			var jsonString = JSON.stringify(data, escape);
			client.sadd(textName, jsonString);
			// console.log(jsonString)

			// remove line breaks and other escaped formatting
			function escape (key, val) {
			    if (typeof(val)!="string"){ 
			    	return val;
			    }
			    
			    return val
			    .replace(/[\']/g, '')
				.replace(/[\"]/g, '')
				.replace(/[\\]/g, '')
				.replace(/[\/]/g, ' ')
				.replace(/[\b]/g, '')
				.replace(/[\f]/g, '')
				.replace(/[Í]/g, '')
				.replace(/[\n]/g, ' ')
				.replace(/[\r]/g, ' ')
				.replace(/[\t]/g, ' ')
				.replace(/[-]/g, '')
				// .replace(/[\']/g, '')
				// .replace(/[\"]/g, '')
				// .replace(/[,]/g, '')
				// .replace(/[\\]/g, '')
				// .replace(/[\/]/g, '\\/')
				// .replace(/[\b]/g, '\\b')
				// .replace(/[\f]/g, '\\f')
				// .replace(/[Í]/g, '')
				// .replace(/[\n]/g, '\\n')
				// .replace(/[\r]/g, ' ')
				// .replace(/[\t]/g, '\\t')
			    ;
			}
		}

		// when done reading the file display total number of items and quit redis connection
		function handleEnd() {
			client.scard(textName, function (err, res) {
		    	console.log("Number of sets read:", res + "."); // will be true if successfull
			});
			
			// client.llen(listName+"set", function(err, len){
			// 	var totalItems = len
			// 	console.log("---Total Number of Items:", totalItems, "---");
			// });

			// client.lindex(listName, 1, function (err, data) {console.log(data)})
			client.quit(function (err, res) {
				console.log("Client quit", res + ".");
				if (res + "OK") {
					// var appCluster = require('./appCluster.js');
					// appCluster.start1();
				}
				
			});
			
		}
// }
	} // Close error check
}); // Close started redis-server
