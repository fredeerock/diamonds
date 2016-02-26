var redis = require("redis"),
    client = redis.createClient();

var csv = require('csv-parser');
var fs = require('fs');

var rita = require('rita');

client.on("error", function (err) {
    console.log("Error " + err);
});

var listName = "items";

client.ltrim(listName, -1, -2, handleTrim);

function handleTrim() {
	console.log("---Trimmed---");
	fs.createReadStream('data/test.csv').pipe(csv()).on('data', handleRow).on('end', handleEnd);
}

function handleRow(data) {
    console.log(data.title, "by", data.author)
	client.rpush(listName, JSON.stringify(data), redis.print);
}

function handleEnd() {
	console.log('---Done reading file---');
	client.llen(listName, function(err, len){
		var totalItems = len
		console.log("---Total Number of Items:", totalItems, "---");
	});
	
	// client.lindex(listName, 2, function (err, data) {console.log(data)})
	client.quit();
}
