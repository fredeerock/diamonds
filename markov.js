var redis = require("redis"),
    client = redis.createClient();

var csv = require('csv-parser');
var fs = require('fs');

var rita = require('rita');

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
	console.log("---Trimmed---");
	fs.createReadStream('data/test.csv').pipe(csv()).on('data', handleRow).on('end', handleEnd);
}

function handleRow(data) {
    console.log(data.title, "by", data.author)
	client.rpush(listName, JSON.stringify(data), redis.print);
}

function handleEnd() {
	console.log('---Done reading file---');
	client.llen(listName, function(err, len){console.log("---Total Number of Items:", len, "---")});
	client.lindex(listName, 2, function (err, data) {console.log(data)})
	client.quit();
}

// var rs = rita.RiString("The elephant took a bite!");
// console.log(rs.features());

// var lines, markov;
// markov = new RiMarkov(4);

// RiTa.loadString('../../data/kafka.txt', function (data1) {
// 	RiTa.loadString('../../data/wittgenstein.txt', function (data2) {
// 		markov.loadText(data1);
// 		markov.loadText(data2);
// 	});
// });

var rm = new rita.RiMarkov(3);
// rm.loadText()

// rm.loadText(theText);

// sentences = rm.generateSentences(10);

// for (int i = 0; i < sentences.length; i++) {
// 	println(sentences[i]);
// }

// markov.loadText(data1);
// markov.loadText(data2);

// function generate() {
// 	if (!markov.ready()) return;
// 	lines = markov.generateSentences(10);
// 	console.log(lines);
// }
