var express = require('express'),
    app = express();

var http = require('http').Server(app);
// install socket.io if not
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  // later return home page instead
  //res.sendFile(__dirname + '/public/index.html');
  //res.send('hello world');
});

io.on('connection', function(socket){
  socket.on('drawline', function(inputs){
	//call drawline function to create line and then return data to client
	console.log("socket::drawline - drawing a line");
	io.emit('drawline', {'test':'line creation complete'});
  });
});

http.listen(8080);
