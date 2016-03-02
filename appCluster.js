//
//
// To start server with Xtra RAM - node --max_old_space_size=4096 app.js

// Todo: Incorporate Node Cluster

// Notes: 
// - There is no large data shared between workers. We can't just load up huge models in each worker as it fills up available ram very quickly.  Perhaps we can store smaller ones in redis and pull them as needed?
// - We need to pull the Markov model generation out into it's own file to be run outside of the server and submit rita models to the redis server.  
// - Then we can pull the model from the redis server by key inside each worker when needed.
// - Still not sure this will solve things as even a few MB files may cause problems when doing it 100 times/second.
// - Throttling may be necessary.  Or aggregation?


var cluster = require('cluster');
var http = require('http');

if(cluster.isMaster) {
	
	// we create a HTTP server, but we do not use listen
	// that way, we have a socket.io server that doesn't accept connections
	var server = require('http').createServer();
	var io = require('socket.io').listen(server);
	var redis = require('socket.io-redis');

	io.adapter(redis({ host: 'localhost', port: 6379 }));

	// Count the machine's CPUs
	// var cpuCount = require('os').cpus().length;

	// Create a worker for each CPU
	for (var i = 0; i < 5; i += 1) {
	   cluster.fork();
	}


	// Listen for dying workers
	cluster.on('exit', function (worker) {

		// Replace the dead worker,
		// we're not sentimental
		console.log('Worker %d died :(', worker.id);
		cluster.fork();

	});
	
	
	
	/*   All this code is to populate a Markov Model either the full one, or by grouping 10 talks at a time into an array.  Haven't verified that the array version works.  
	// 
	
	
	var redis = require("redis");
	var client = redis.createClient();

	client.on("error", function (err) {
	    console.log("Error " + err);
	});


	// *******	RITA Markov Setup   ********
	var rita = require('rita');

	var dataObj = [];
	var listName = "items";
	var listLength = 2000;

	var markov = new rita.RiMarkov(4);
	var markovArray = [];
	var markovArrayCount = 0;
	var markovArrayCallCount = 0;


	client.llen(listName, handleLength);

	function handleLength(err, len){
		listLength = len;
		console.log("---Total Number of Items:", len, "---");

		//	All 2050 Ted Talk Transcripts using handleMarkovParsing
		// for (i = 0; i < len; i++ ) {
		//	client.lindex(listName, i, handleMarkovParsing);
		// }

		// Ted Transcripts in groups of 10 using handleMarkovArrayParsing
		for (var i = 0; i < len; i++) {
				var markovArrayIndex = Math.floor(markovArrayCallCount/10);
				console.log("markovArrayIndex: ", markovArrayIndex);
				if (typeof markovArray[markovArrayIndex] === 'undefined')	{
					markovArray[markovArrayIndex] = new rita.RiMarkov(4);
				}
				client.lindex(listName, i, handleMarkovArrayParsing);
				markovArrayCallCount++;
		}
		//
					// This doesn't work because it's not done making the chains by the time this code is called.
		//for (var i=0;i<markovArray.length;i++){
		//	client.lpush("markovArray", markovArray[i], redis.print);
		//	// JSON.parse client.LINDEX("markovArray", 0);		// Recalling is something like this...
		//}
	}

	function handleMarkovParsing(err, data) {
		//	If you want to store an array of the collected data
		// dataObj.push(JSON.parse(data));
		// console.log(dataObj);
		// console.log(dataObj.length);
		//

		markov.loadText(JSON.parse(data).content);
		console.log("Loading: ", JSON.parse(data).title);

	}

	function handleMarkovArrayParsing(err, data) {
		var markovArrayIndex = Math.floor(markovArrayCount/10);
		console.log("markovArrayIndex2: ", markovArrayIndex);
		markovArray[markovArrayIndex].loadText(JSON.parse(data).content);
		console.log("Loading: ", JSON.parse(data).title);
		
					// Trying to store markov array in redis.  Not sure if this works, may need to delay until the markov array is loaded.
		if(markovArrayCount%10 == 0){
			client.lpush("markovArray", markovArray[markovArrayIndex], redis.print);
		}
		markovArrayCount++;
	}
	*/
	
	
} else {
	
	
	// ****************  The Node Cluster ****************
	
	var redis = require("redis");
	var client = redis.createClient();

	client.on("error", function (err) {
	    console.log("Error " + err);
	});
	
	// *******	RITA Markov Setup   ********
	var rita = require('rita');

	var dataObj = [];
	var listName = "items";
	var listLength = 2000;

	var markov = new rita.RiMarkov(4);
	var markovArray = [];
	var markovArrayCount = 0;
	
	//for (var i=0; i < client.LLEN("markovArray");i++) {
	//	markovArray[i] = JSON.parse client.LGET("markovArray", i);
	//}
	
	
	// ***************************************************
	//	NEXUS Node SERVER
	//	Jesse Allison (2015)
	//
	//	To Launch:
	//		NODE_ENV=production sudo node nexus-server.js
	//		(sudo is required to launch on port 80.)
	// ***************************************************

	// Setup web app - using express to serve pages
	var express = require('express'),
			sio = require('socket.io')


	var app = express();

	app.use(express.static(__dirname + '/public'));


	// ***************************************************
	//	OSC Setup for sending (and receiving) OSC (to Max)

	var osc = require('node-osc');

	var oscReceiverIP = '167.96.127.8';

		// oscReceiver is used for receiving osc messages (from Max, and friends!)
	var oscReceiver = new osc.Server(7746, oscReceiverIP);

		oscReceiver.on("message", function (msg, rinfo) {
			// console.log("OSC message:");
			// console.log(msg);

			// Setup messages to receive here //
			if(msg[0] = "/goToSection") {
				currentSection = msg[1];
				shareSection(currentSection);
			}

		});

			// oscSend is used to send osc messages (to Max, and freinds!)
		var oscSend = new osc.Client(oscReceiverIP, 7745);

	//
	// ***************************************************



	// ***************************************************
	// server is the node server (web app via express)
	// this code launches the server on port 80 and switches the user id away from sudo
	// apparently this makes it more secure - if something goes awry it isn't running under the superuser.

	var serverPort = 8000;
	// var serverPort = 80;

	var server = http.createServer(app)
		.listen(serverPort, function(err) {
			if (err) return cb(err);

			// Find out which user used sudo through the environment variable
			var uid = parseInt(process.env.SUDO_UID);
			// Set our server's uid to that user

			if (uid) process.setuid(uid);
			console.log('Server\'s UID is now ' + process.getuid());
		});

	// start socket.io listening on the server
	var io = sio.listen(server);
	var redis = require('socket.io-redis');
	
	io.adapter(redis({ host: 'localhost', port: 6379 }));

	// ***************************************************
	// Global Variables!

	var ioClients = [];		// list of clients who have logged in.  // FIXME: not removing properly
	var currentSection = 0;		// current section.
	var theaterID;
	var conrollerID;

	// ***************************************************

	// Respond to web sockets with socket.on
	io.sockets.on('connection', function (socket) {
		var ioClientCounter = 0; // Can I move this outside into global vars?

		socket.on('addme', function(data) {
			var username = data.name;
			var userColor = data.color;
			var userNote = data.note;
			var userLocation = data.location;

			if(username == "theater"){
				theaterID = socket.id;
				console.log("Hello Theater: " + theaterID);
			}

			if(username == "controller"){
				controllerID = socket.id;
				console.log("Hello Controller: " + controllerID);
			}

			if(username == "a_user") {
				ioClients.push(socket.id);
			}

			socket.username = username; // allows the username to be retrieved anytime the socket is used
			socket.userLocation = userLocation;
			socket.userColor = userColor;
			socket.userNote = userNote;
			// Can add any other pertinent details to the socket to be used later

			// .emit to send message back to caller.
			socket.emit('chat', 'SERVER: You have connected. Hello: ' + username + " " + socket.id + 'Color: ' + socket.userColor);
			// .broadcast to send message to all sockets.
			//socket.broadcast.emit('chat', 'SERVER: A new user has connected: ' + username + " " + socket.id + 'Color: ' + socket.userColor);

			var title = getSection(currentSection);

			if(username == "a_user") {
				console.log("Hello:", socket.username, "currentSection:", currentSection, "id:", socket.id, "userColor:", socket.userColor, "userLocation:", socket.userLocation, "userNote:", socket.userNote);
			}
			
			// Set Section to the current one.
			socket.emit('setSection', {sect: currentSection, title: title});

			if(username == "a_user") {
				// oscSend.send('/causeway/registerUser', socket.id, socket.userColor, socket.userLocation[0],socket.userLocation[1], socket.userNote);
			}

		});

		socket.on('disconnect', function() {
			// ioClients.remove(socket.id);	// FIXME: Remove client if they leave
			// io.sockets.emit('chat', 'SERVER: ' + socket.id + ' has left the building');
		});

		// Transmit to everyone who is connected //
		socket.on('sendchat', function(data) {
			io.sockets.emit('chat', socket.username, data);
		});

		// Send to all other users connected // 
		socket.on('tap', function(data) {
			// console.log("Data: ", data.inspect);
			// oscSend.send('/tapped', 1);
			socket.broadcast.emit('tapped', socket.username, 1);
		});


		socket.on('location', function(data) {
			if(data) {
				// oscSend.send('/location', data[0], data[1]);
			}
		});


		socket.on('item' , function(data) {
			console.log(socket.id + " tapped item: " + data);
			// handleParsing();
			// LINDEX mylist 0

			// var mark = require("./markov.js");

			//  LOAD Talk from submitted word
			//markov.loadText(dataObj[0].content);
			
			// ********* !!!!!!!!  FIXME: Once the array is loaded in redis, something like this will pull it back out for usage.
			markov = client.LINDEX("markovArray", 0);
			// ********* !!!!!!!!    

			// console.log("markov size:", markov.size());
			// if (!markov.ready()) return;		// Discontinue if markov is not ready
			lines = markov.generateSentences(10);
			linesJoined = lines.join(' ');
			client.lpush("markov", linesJoined, redis.print);
			console.log(linesJoined);


			client.lindex("markov", 0, function (err, data) {
				// io.sockets.emit('chat', data);
				// console.log(data);
			})

			// diamonds > Sending to the Theatre if connected
			if(io.sockets.connected[theaterID]!== null) {
				// io.sockets.connected[theaterID].emit('itemback', {phrase: data, color: socket.userColor}, 1);
			}

			// socket.broadcast.emit('itemback', {phrase: data, color: socket.userColor}, 1);
			// oscSend.send('/causeway/phrase/number', socket.id, data);

		});


		// Functions to send on to Max //
		socket.on('triggerCauseway', function(data) {
			// oscSend.send('/causeway/triggerCauseway', socket.id);
		});

		socket.on('triggerPitch', function(data) {
			// oscSend.send('/causeway/triggerPitch', socket.id);
		});

		socket.on('slider', function(data) {
			// console.log("slider! " + data);
			// oscSend.send('/slider', socket.username, data);
		});


		socket.on('section', function(data) {
			console.log("Section is now: "+ data);
			currentSection = data;
			sendSection(currentSection);
		})

		// ***************************************************
		// Functions for handling stuff
		// **** SECTIONS ****

		var sectionTitles = ["Welcome", "Markov", "Diamonds in Distopia", "Markov", "for a minute", "End"];

		// sendSection(currentSection);	 // Sets everyone's section
		sendSection = function (sect) {
			var title = getSection(sect);
			io.sockets.emit('setSection', {sect: sect, title: title});
			// oscSend.send('/setSection', sect, title);
			oscSend.send('/causeway/currentSection', sect);

		};

		// Section shared from Max to UIs
		shareSection = function(sect) {
			var title = getSection(sect);
			io.sockets.emit('setSection', sect, title);
		};

		getSection = function(sect) {
			var title = "none";

			if(sect == 'w'){
				title = sectionTitles[0];
			} 

			if(sect == 'e'){
				title = sectionTitles[35];
			} 

			if(sect !== 'e' && sect !== 'w') {
				sect++;
				title = sectionTitles[sect];
			} 

			return title;
		};


		// Return random connected user name //
		socket.on('getSomebody', function(data) {
			console.log("Get Somebody! ");

			var user = getNextUser();
			// Make sure you don't get yourself
			if(user.username == socket.username || user.username == null) {
				user = getNextUser();
				if(user.username == socket.username || user.username == null) {
					socket.emit("somebodyToYou","Somebody");
				}
			} else {
				socket.emit("somebodyToYou",user.username);
			}
		});


		// pick a random user from those still connected and return the user
		getRandomUser = function() {
			var randomUser = Math.floor(Math.random() * ioClients.length);
			var user = io.sockets.socket(ioClients[randomUser]);
			return user;
		};

		getNextUser = function() {
			// console.log("ioClients Length: ", ioClients.length);
			// console.log("io.sockets.socket length: ", io.sockets.socket.length);
			var user = io.sockets.socket(ioClients[ioClientCounter]);
			ioClientCounter = ioClientCounter + 1;
			if (ioClientCounter >= ioClients.length) {
				ioClientCounter = 0;
			}
			// console.log("Username ", user.username);

			return user;
		};

	});
	
}
