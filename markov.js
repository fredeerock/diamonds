var redis = require("redis"),
    client = redis.createClient();
var csv = require('csv-parser');
var fs = require('fs');

client.on("error", function (err) {
    console.log("Error " + err);
});

// client.set("string key", "string val", redis.print);
// client.hset("hash key", "hashtest 1", "some value", redis.print);
// client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// client.hkeys("hash key", function (err, replies) {
//     console.log(replies.length + " replies:");
//     replies.forEach(function (reply, i) {
//         console.log("    " + i + ": " + reply);
//     });
//     client.quit();
// });

var listName = "items";

client.ltrim(listName, -1, -2, handleTrim);

function handleTrim() {
	console.log("trimmed");
	fs.createReadStream('data/test.csv').pipe(csv()).on('data', handleRead);
}

function handleRead(err, data) {
	// console.log(data);
	client.rpush(listName, data, handlePush);
	console.log("pushing...");
}

function handlePush (err, push){
	console.log('finished!', push);
	client.llen(listName, function(err, len){console.log(len)});
}




