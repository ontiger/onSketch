var express = require('express'),
    app = express();

var http = require('http').Server(app);
// install socket.io if not
var io = require('socket.io')(http);

//var sketchSrvs = require('./gen-nodejs/SketchServiceMgr.js');
//var sketchSrvMgr = new sketchSrvs.SketchSrvMgr();
//sketchSrvMgr.createClient();

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  // later return home page instead
  //res.sendFile(__dirname + '/public/index.html');
  //res.send('hello world');
});

io.on('connection', function(socket){
  socket.on('drawCurve', function(inputs){
	//call drawline function to create curve and then return data to client
      console.log("socket::drawCurve - drawing a curve");
      //sketchSrvMgr.createGeometry(io, inputs);
	io.emit('drawCurve', {'test':'curve creation complete'});
  });
});

http.listen(80);
