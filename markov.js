var redis = require("redis");
var client = redis.createClient();

var rita = require('rita');

client.on("error", function (err) {
    console.log("Error " + err);
});

var sio = require('socket.io');

// client.set("string key", "string val", redis.print);
// client.hset("hash key", "hashtest 1", "some value", redis.print);
// client.hset(["hash key", "hashtest 2", "some other value"], redis.print);

// client.llen("items", function (err, replies) {
//     console.log(replies.length + " replies:");
//     replies.forEach(function (reply, i) {
//         console.log("    " + i + ": " + reply);
//     });
    // client.quit();
// });

var dataObj = [];
var listName = "items";
var listLength = 2000;

client.llen(listName, handleLength);

function handleLength(err, len){
	listLength = len;
	console.log("---Total Number of Items:", len, "---");
	for (i = 0; i < len; i++ ) {
		client.lindex(listName, i, handleParsing)
	}
};

function handleParsing(err, data) {

	dataObj.push(JSON.parse(data));
	// console.log(dataObj);
	// console.log(dataObj.length);

	if (dataObj.length == listLength) {
		// console.log("-------------")
		// console.log(dataObj[2].content)
		console.log("list length:", listLength);

		var markov = new rita.RiMarkov(4);

		generate();

		function generate() {
			markov.loadText(dataObj[0].content);
			markov.loadText(dataObj[1].content);
			markov.loadText(dataObj[2].content);
			console.log("markov sie:", markov.size());
			if (!markov.ready()) return;
			lines = markov.generateSentences(10);
			linesJoined = lines.join(' ');
			client.lpush("markov", linesJoined, redis.print);
			console.log(linesJoined);
		}


	}

}


