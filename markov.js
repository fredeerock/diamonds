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

// var listName = "items";
// client.ltrim(listName, -1, -2, handleTrim);

// function handleTrim(){
// 	fs.createReadStream('data/test.csv').pipe(csv()).on('data', handleRow);
// }

// function handleRow(data) {
//     console.log('Name: %s Age: %s', data.title, data.author)
//   	client.rpush("new1", data.title, redis.print);

// }

//***

var listName = "items";

client.ltrim(listName, -1, -2, handleTrim);

function handleTrim() {
	console.log("trimmed");
	fs.createReadStream('data/test.csv').pipe(csv()).on('data', handleRow).on('end', handleEnd);
}

function handleRow(data) {
    console.log(data.title, "by", data.author)
	client.rpush(listName, JSON.stringify(data), redis.print);
}

function handleEnd() {
	console.log('file read');
	client.llen(listName, function(err, len){console.log(len)});
		console.log('file read');

	client.lindex(listName, 2, function (err, data) {console.log(data)})
	client.quit();
}

//***

// function handlePush (err, data) {
// 	// redis.print;
// 	console.log("pushing... ", count);
// 	count++;
// }