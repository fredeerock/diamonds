var redis = require("redis");
var client = redis.createClient();

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
var dataObj = [];
var listName = "items";
var listLength;

// client.lindex(listName, 0, function (err, data) {
// 	console.log(JSON.parse(data))
// })

client.llen(listName, handleLength);

function handleLength(err, len){
	listLength = len;
	console.log("---Total Number of Items:", len, "---");
	for (i = 0; i < len; i++ ) {
		client.lindex(listName, i, handleParsing)
	}
	// done();
};

function handleParsing(err, data) {

	dataObj.push(JSON.parse(data));
	console.log(dataObj);
	console.log(dataObj.length);

	if (dataObj.length == listLength) {
		console.log("-------------")
		console.log(dataObj[2].content)
		console.log(listLength);

		var markov = new rita.RiMarkov(3);

		generate();

		function generate() {
			markov.loadText(dataObj[0].content);
			markov.loadText(dataObj[1].content);
			markov.loadText(dataObj[2].content);
			if (!markov.ready()) return;
			lines = markov.generateSentences(10);
			console.log(lines);
		}


	}


}

// function done() {
// 	console.log(dataObj[2].content)

// }

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





// rm.loadText()

// rm.loadText(theText);

// sentences = rm.generateSentences(10);

// for (int i = 0; i < sentences.length; i++) {
// 	println(sentences[i]);
// }

// markov.loadText(data1);
// markov.loadText(data2);


