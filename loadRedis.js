// load required modules
var redis = require("redis");
var client = redis.createClient();

var csv = require('csv-parser');
var fs = require('fs');

client.on("error", function (err) {
    console.log("Error " + err);
});

// list name and data path here
var listName = "items";
var dataSet = "data/test.csv";

// clear the list
client.ltrim(listName, -1, -2, handleTrim);

// pipe the csv one row at a time as json
function handleTrim() {
	console.log("---Trimmed---");
	fs.createReadStream(dataSet).pipe(csv()).on('data', handleRow).on('end', handleEnd);
}

// push each row into redis as a string
function handleRow(data) {
    console.log(data.title, "by", data.author)
	client.rpush(listName, JSON.stringify(data), redis.print);
}

// when done reading the file display total number of items and quit redis connection
function handleEnd() {
	console.log('---Done reading file---');
	client.llen(listName, function(err, len){
		var totalItems = len
		console.log("---Total Number of Items:", totalItems, "---");
	});
	// client.lindex(listName, 2, function (err, data) {console.log(data)})
	client.quit();
}
