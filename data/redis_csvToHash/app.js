var cth = require("redis_csvToHash");
var keyname='article';
var filename='../test1.csv';
cth.csvToHash(filename,keyname,'codebarre',function(err, obj){
	console.dir(obj);
});
