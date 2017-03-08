// ************************************************
//	NEXUS Node Server
//	Jesse Allison (2016)
//
//	Before Launching:
//		Start up redis with, redis-server
//
//	To Launch:
//		sudo NODE_ENV=production node appCluster.js
//		(sudo is required to launch on port 80.)
//
//	To start server with Xtra RAM:
//		sudo NODE_DEBUG=cluster node --max_old_space_size=4096 appCluster.js
// ************************************************

// Setup web app
//  - using express to serve pages
//  - socket.io to maintain websocket communication
//  - redis for interworker communications/data

var cluster = require('cluster');
var workerNumber = require('os').cpus().length*2;
var express = require('express');
var http = require('http');
var sio = require('socket.io');
var io;
var redis = require('redis');
var redisAdapter = require('socket.io-redis');

// Below process.env variables allow you to set parameters when starting the application.
// For example you can run, sudo PORT=8080 WORKERS=32 node appCluster.js.
var serverPort = process.env.PORT || 80;
var workers = process.env.WORKERS || workerNumber;
var redisPort = process.env.REDISPORT || 6379;
var redisIP = process.env.REDISIP || "127.0.0.1";
var redisUrl = process.env.REDISURL || 'redis://'+ redisIP +':' + redisPort;

var app = express();
app.use(express.static(__dirname + '/public'));

// server is the node server (web app via express)
// this code can launch the server on port 80 and switch the user id away from sudo
// apparently this makes it more secure - if something goes awry it isn't running under the superuser.

function start() {
	var httpServer = http.createServer(app);
	var server = httpServer.listen(serverPort, function(err) {
		if (err) return cb(err);
		var uid = parseInt(process.env.SUDO_UID);	// Find out which user used sudo through the environment variable
		if (uid) process.setuid(uid);			// Set our server's uid to that user
		console.log('Server\'s UID is now ' + process.getuid());
	});

	io = sio.listen(server);
	io.adapter(redisAdapter({host: 'localhost', serverPort : redisPort }));
	console.log('Redis adapter started with url: ' + redisUrl);
}

if(cluster.isMaster) {
	console.log('Start cluster with %s workers', workers - 1);
	workers--;
	for (var i = 0; i < workers; ++i) {
		var worker = cluster.fork();
		console.log('Worker %s started.', worker.process.pid);
	}

	cluster.on('death', function(worker) {
		console.log('Worker %s died. restart...', worker.process.pid);
	});

} else {
	// Kickoff a Worker!
	start();

	var redisClient = redis.createClient();

	redisClient.on("error", function (err) {
   		console.log("Error " + err);
	});

	var rita = require('rita');

	var dataObj = [];
	var listName = "items";
	var listLength = 2000;

	var markov = new rita.RiMarkov(4);
	var markovArray = [];
	var markovArrayCount = 0;

		// redisClient.lpush("markov", markovJoined);
		//
		// redisClient.lindex("markov", 0, function (err, data) {
		// 	// io.sockets.emit('chat', data);
		// 	// console.log(data);
		// })
		// redisClient.llen(listName, handleLength);
		// var markovItem = redisClient.LINDEX("markovArray", 0);
		//
		// for (var i=0; i < redisClient.LLEN("markovArray");i++) {
		// 	markovArray[i] = JSON.parse redisClient.LGET("markovArray", i);
		// }

		//	client.sscan(
    //	    "itemsset",
    //	    cursor,
    //	    'MATCH', '*'+idata+'*',
    //	    'COUNT', '10',
    //	    function(err, res) {
    //
		//				redisClient.on("error", function (err) {
		//				    console.log("Redis Error " + err);
		//				});
		//			...}

	// *********************
		// Global Variables!

	var ioClients = [];		// list of clients who have logged in.
	var currentSection = 0;		// current section.
		redisClient.set("currentSection", currentSection);
			// Specific clients who we only want one of.
	var theaterID,
			conrollerID,
			audioControllerID;

	// *********************



// Respond to web sockets with socket.on
	io.sockets.on('connection', function (socket) {
		var ioClientCounter = 0;		// Can I move this outside into global vars?

		socket.on('addme', function(data) {
			username = data.name;
			var userColor = data.color;
			var userNote = data.note;
			var userLocation = data.location;

			if(username == "theater"){
				theaterID = socket.id;
				redisClient.set("theaterID", theaterID);
				console.log("Hello Theater: " + theaterID);
			}

			if(username == "controller"){
				controllerID = socket.id;
				redisClient.set("controllerID", controllerID);
				console.log("Hello Controller: " + controllerID);
			}

			if(username == "audio_controller"){
				audioControllerID = socket.id;
				redisClient.set("audioControllerID", audioControllerID);
				console.log("Hello Audio Controller: " + audioControllerID);
			}

			if(username == "a_user") {
				ioClients.push(socket.id);
			}

			socket.username = username;  // allows the username to be retrieved anytime the socket is used
			// Can add any other pertinent details to the socket to be retrieved later
			socket.userLocation = userLocation;
			socket.userColor = userColor;
			socket.userNote = userNote;
			// .emit to send message back to caller.
			socket.emit('chat', 'SERVER: You have connected. Hello: ' + username + " " + socket.id + 'Color: ' + socket.userColor);
			// .broadcast to send message to all sockets.
			//socket.broadcast.emit('chat', 'SERVER: A new user has connected: ' + username + " " + socket.id + 'Color: ' + socket.userColor);
			// socket.emit('bump', socket.username, "::dude::");

			redisClient.get('currentSection', function(err, reply) {
					currentSection = reply;
					if(currentSection) {
						var title = getSection(currentSection);
						socket.emit('setSection', {sect: currentSection, title: title});
						// socket.emit("section", num);
			    }
			});

			if(username == "a_user") {
				//console.log("Hello:", socket.username, "currentSection:", currentSection, "id:", socket.id, "userColor:", socket.userColor, "userLocation:", socket.userLocation, "userNote:", socket.userNote);
			}

			// io.sockets.emit('setSection', {sect: sect, title: title});
			if(username == "a_user") {
				// oscClient.send('/causeway/registerUser', socket.id, socket.userColor, socket.userLocation[0],socket.userLocation[1], socket.userNote);
				redisClient.get('audioControllerID', function(err, reply) {
						audioControllerID =reply;
						if(audioControllerID) {
								io.to(audioControllerID).emit('/causeway/registerUser', {id: socket.id, color: socket.userColor, locationX: socket.userLocation[0], locationY: socket.userLocation[1], note: socket.userNote}, 1);
				    }
				});
			}
		});


		 socket.on('disconnect', function() {
			// ioClients.remove(socket.id);	// FIXME: Remove client if they leave
			io.sockets.emit('chat', 'SERVER: ' + socket.id + ' has left the building');
		 });


		socket.on('item' , function(data) {
			console.log(socket.id + " tapped item: " + data);
			// client.sscan(0, );
			//sscan itemsset 0 match *Rwanda* count 2050
			
			var scanResults = [];
			var cursor = '0';
			
			idata = data;
			// console.log("outside data is", data);

			sscan();
			function sscan() {
				// console.log("fucntion data is", idata);

			    redisClient.sscan(
			        "itemsset",
			        cursor,
			        'MATCH', '*'+idata+'*',
			        'COUNT', '10', // Find 10 occurances of the word that was tapped in the CORPUS.
			        function(err, res) {
			            if (err) throw err;

			            // Update the cursor position for the next scan
			            cursor = res[0];
			            // get the SCAN result for this iteration
			            var keys = res[1]; // 	     

			            // Remember: more or less than COUNT or no keys may be returned
			            // See http://redis.io/commands/scan#the-count-option
			            // Also, SCAN may return the same key multiple times
			            // See http://redis.io/commands/scan#scan-guarantees
			            // Additionally, you should always have the code that uses the keys
			            // before the code checking the cursor.
			            if (keys.length > 0) {
							// if(keys != ''){
								// console.log("hi");
								// console.log(keys);
								try {
									// console.log(JSON.parse(keys).title);
									if(scanResults.length<10) {
										scanResults.push(JSON.parse(keys))
									}
								} catch (err){
									console.log("error:", err)
								}
								// 
							// } else {
								// console.log("none");
							// }
			            	// console.log(keys);
			                // console.log(JSON.parse(keys).title);
			                // if (scanResults.length<10){
			                	// scanResults.push(JSON.parse(keys));
			                // } 
			            }

			            // It's important to note that the cursor and returned keys
			            // vary independently. The scan is never complete until redis
			            // returns a non-zero cursor. However, with MATCH and large
			            // collections, most iterations will return an empty keys array.

			            // Still, a cursor of zero DOES NOT mean that there are no keys.
			            // A zero cursor just means that the SCAN is complete, but there
			            // might be one last batch of results to process.

			            // From <http://redis.io/commands/scan>:
			            // 'An iteration starts when the cursor is set to 0,
			            // and terminates when the cursor returned by the server is 0.'
			            if (cursor === '0') {

			            	console.log('--- Iteration complete, matches below ---');
			            	var srCount = 0;
			            	
			            	scanResults.forEach(function(entry) {
			            		srCount++;
    							console.log(srCount+": "+entry.title);
    							
							});
							
							// console.log(scanResults);

							markoving(scanResults);

			                return console.log("--- Done ---");

			            }

			            return sscan(); //forgot about this. in the future should probably use this to pass data around instead of global idata.
			        }
			    );
			}

			function markoving(d) {
				var contents = [];

				for (var i = 0; i < d.length; i++) {
					contents[i] = d[i].content;
				}
				
				var joinedText = contents.join(' '); 
				
				// console.log("*** LINES JOINED ***", joinedText);

				markov.loadText(joinedText);

				//sscan itemsset 0 match *Rwanda* count 2050
				// handleParsing();
				// LINDEX mylist 0

				//  LOAD Talk from submitted word
				//markov.loadText(dataObj[0].content);
				
				// ********* !!!!!!!!  FIXME: Once the array is loaded in redis, something like this will pull it back out for usage.
				// var markovItem = client.LINDEX("markovArray", 0);
				// ********* !!!!!!!!    

				// console.log("markov size:", markov.size());
				if (!markov.ready()) {
					return console.log("markov not ready"); // Discontinue if markov is not ready
				} 

				// else {		
				// 	console.log("markov ready!", "size is:". markov.size());
				// }

				var lines = markov.generateSentences(3);
				var markovJoined = lines.join(' ');

				redisClient.lpush("markov", markovJoined);

				io.sockets.emit('itemback', {phrase: markovJoined, color: socket.userColor});

				// client.lindex("markov", 0, function (err, data) {
				// 	// io.sockets.emit('chat', data);
				// 	// console.log(data);
				// })

				// diamonds > Sending to the Theatre if connected
				// if(io.sockets.connected[theaterID]!== null) {
				// 	io.sockets.connected[theaterID].emit('itemback', {
				// 		phrase: markovJoined, 
				// 		color: socket.userColor});
				// }

				// socket.broadcast.emit('itemback', {phrase: data, color: socket.userColor}, 1);
				// oscSend.send('/causeway/phrase/number', socket.id, data);
			}

		}); 

		 socket.on('sendchat', function(data) {
			// Transmit to everyone who is connected //
			io.sockets.emit('chat', socket.username, data);
		 });

		socket.on('tap', function(data) {
			// console.log("Data: ", data.inspect);
			// oscClient.send('/tapped', 1);
			socket.broadcast.emit('tapped', socket.username, 1);
		});

		socket.on('interactionTrail', function(data) {
			console.log("Received interactionTrail: "+ data);
			// send somewhere?  perhaps theatre?
			redisClient.lpush("interactionTrail", data);		// Store for some other time...
		})

		socket.on('shareToggle', function(data) {
			socket.broadcast.emit('setSharedToggle', data);
		});

		socket.on('location', function(data) {
			if(data) {
				// oscClient.send('/location', data[0], data[1]);
			}
		});

		socket.on('item' , function(data) {
			console.log(socket.id + " tapped item: " + data);
			// TODO: Take out all the socket.broadcast.emits.
			// socket.broadcast.emit('chat', socket.id + " : " + data, 1);

			redisClient.get('theaterID', function(err, reply) {
				theaterID =reply;
				if(theaterID) {
					io.sockets.emit('itemback', {phrase: data, color: socket.userColor}, 1);
		    }
			});

			redisClient.get('audioControllerID', function(err, reply) {
					audioControllerID =reply;
					if(audioControllerID) {
						io.to(audioControllerID).emit('/causeway/phrase/number', {id: socket.id, item: data}, 1);
							// console.log("Item", data);
			    }
			});
		});

		socket.on('nextChord', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
					audioControllerID =reply;
					if(audioControllerID) {
						io.to(audioControllerID).emit('/causeway/nextChord', {id: socket.id}, 1);
			    }
			});
			socket.broadcast.emit('triggerNextChord', data);
		});

		socket.on('triggerCauseway', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
					audioControllerID =reply;
					if(audioControllerID) {
						io.to(audioControllerID).emit('/causeway/triggerCauseway', {id: socket.id}, 1);
			    }
			});
		});

		socket.on('triggerPitch', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
						io.to(audioControllerID).emit('/causeway/triggerPitch', {id: socket.id}, 1);
		    }
			});
		});

		socket.on('triggerBBCollapse', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerBBCollapse', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerBBCollapse', data);
		});

		socket.on('triggerSmolder', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerSmolder', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerSmolder', data);
		});

		socket.on('triggerWhoBrought', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerWhoBrought', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerWhoBrought', data);
		});

		socket.on('triggerCollide', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerCollide', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerCollide', data);
		});

		socket.on('triggerCricket', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerCricket', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerCricket', data);
		});

		socket.on('triggerSequins', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerSequins', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerSequins', data);
		});

		socket.on('triggerBreath', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
					io.to(audioControllerID).emit('/causeway/triggerBreath', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerBreath', data);
		});

		socket.on('triggerSonnet', function(data) {
			redisClient.get('audioControllerID', function(err, reply) {
				audioControllerID =reply;
				if(audioControllerID) {
        	io.to(audioControllerID).emit('/causeway/triggerSonnet', {id: socket.id}, 1);
		    }
			});
			socket.broadcast.emit('triggerSonnet', data);
		});

		socket.on('section', function(data) {
			console.log("Section is now: "+ data);
			currentSection = data;
			redisClient.set("currentSection", currentSection);
			sendSection(currentSection);
		})

		// *********************
		// Functions for handling stuff
		
		// **** SECTIONS ****
		var sectionTitles = ["Welcome", "Preface", "Section 1", "Section 2", "Section 3",
			"Section 4", "Section 5", "Section 6", "Section 7", "Section 8", "Section 9",
			"Section 10", "Section 11", "Section 12", "Section 13", "Section 14", "Section 15",
			"Section 16", "Section 17", "Section 18", "Section 19", "Section 20", "Section 21",
			"Section 22", "Section 23", "Section 24", "Section 25", "Section 26", "Section 27",
			"Section 28", "Section 29", "Section 30", "Section 31", "Section 32", "Section 33",
			"End"];

		// Todo: Add sections to correspond to organ interactions
		// sendSection(currentSection);	 // Sets everyone's section
		sendSection = function (sect) {
			var title = getSection(sect);
			io.sockets.emit('setSection', {sect: sect, title: title});

			redisClient.get('audioControllerID', function(err, reply) {
					audioControllerID =reply;
					if(audioControllerID) {
							io.to(audioControllerID).emit('/causeway/currentSection', {section: sect, title: title}, 1);
							// console.log("Section sent", sect);
			    }
			});
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

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
		    color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

}