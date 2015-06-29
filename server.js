var express = require('express'),
    app = express();
	
//app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  // later return home page instead
  res.send('hello world');
});

app.post('/drawline', function(req, res){
	// response client request - drawline
	// call Fusion server to draw line and return the line informations to webserver, and then return to client
	res.json('{"message":"hello world"}');
	console.log("drawing a line");
});

app.listen(8080);
