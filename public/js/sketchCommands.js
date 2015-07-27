function getNDCPt(event){
	// NDC (normalized Device Coordinate) x [-1, 1], y[1,-1]
	var newPt = new THREE.Vector2();
	newPt.x = ( event.clientX / OnSketch.App.view.width ) * 2 - 1;
	newPt.y = - ( event.clientY / OnSketch.App.view.height ) * 2 + 1;
	return newPt;
}

function getPickPoint(event){
	mouse = getNDCPt(event);
	OnSketch.App.raycaster.setFromCamera(mouse, OnSketch.App.camera);
	
	// compute the intersection between ray and the default sketch plane
	raycaster = OnSketch.App.raycaster;
	
	//sketchPlane = OnSketch.App.defaultSketchPlane;
	normal = new THREE.Vector3(0, 0, 1);
	sketchPlane = new THREE.Plane(normal, 0);
	if(sketchPlane != null) {
		intPt = raycaster.ray.intersectPlane(sketchPlane);
		if(intPt != null)
			return intPt;
	}
	
	// perspective camera
	var point = new THREE.Vector3(mouse.x, mouse.y, 0.5);
	point.unproject(OnSketch.camera);
	return point;
}

Object.extend = function(destination, source) { 
  for (property in source) { 
    destination[property] = source[property]; 
  } 
  return destination; 
}
Object.prototype.extend = function(object) { 
  return Object.extend.apply(this, [this, object]); 
}

// base command
function InteractiveCommand(id){
	this.id = id;
	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
										
	this.subScriptEvents = function(){
		OnSketch.App.renderer.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
		OnSketch.App.renderer.domElement.addEventListener( 'mousemove', this.onMouseMove, false );
		
		// canvas doesn't support keyboard event, use window instead
		window.addEventListener( 'keydown', this.onKeyPress, true);
		
		OnSketch.App.enableOrbit(false);
	}

	this.unsubScriptEvents = function(){
		OnSketch.App.renderer.domElement.removeEventListener( 'mousedown', this.onMouseDown, false );
		OnSketch.App.renderer.domElement.removeEventListener( 'mousemove', this.onMouseMove, false );
		
		// canvas doesn't support keyboard event, use window instead
		window.addEventListener( 'keydown', this.onKeyPress, true);
		
		OnSketch.App.enableOrbit(true);
	}	
}

InteractiveCommand.prototype={
	begin:function(){
		this.onBegin();
	}
}
InteractiveCommand.prototype={
	end:function(){
		this.onEnd();
	}
}

// sketch base command
function SketchCommand(id){
	InteractiveCommand.call(this, id);
}

SketchCommand.prototype = new InteractiveCommand;
SketchCommand.prototype.extend({
	onBegin:function(){ 
		this.subScriptEvents();
	}
})		
SketchCommand.prototype.extend({
	onEnd:function(){
		this.clearPreview();
		this.clearData();
		this.unsubScriptEvents();
	}
})

// draw polyline command
function DrawPolylineCmd(id){
	SketchCommand.call(this, id);
	
	var startPt = null;
	var previewline = null;		
	var that = this; // store this
	
	this.onMouseDown = function(event){
		var newPt = getPickPoint(event);
		if(startPt == null)
			startPt = newPt;
		else{				
			that.drawLine(startPt, newPt, false);
			startPt =  newPt;
		}
	}

	this.onMouseMove = function(event){
		if(startPt != null){
			var tempPt = getPickPoint(event);		
			that.drawLine(startPt, tempPt, true);
		}
	}

	this.onKeyPress = function(event){
		var  keyCode = event.keyCode ? event.keyCode : event.which;
		switch(keyCode)
		{
		   case 27: //ESC
			   {
					that.clearPreview();
					that.clearData();
					//that.unsubScriptEvents();
			   }
			   break;
		   default:
			   break;
		}
	}		
	
	this.clearPreview = function(){
		if(previewline != null){
			OnSketch.App.scene.remove(previewline);
			previewline = null;
		}
	}
	
	this.clearData = function(){
		startPt = null;
		previewline = null;	
	}
	
	this.drawLine = function(pt1, pt2, preview){
		that.clearPreview();
	
		var geometry = new THREE.Geometry;
		geometry.vertices.push(pt1, pt2);
		var material = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
		
		if(preview == true){
			previewline = new THREE.Line(geometry, material);
			OnSketch.App.scene.add(previewline);
		}
		else
			OnSketch.App.scene.add(new THREE.Line(geometry, material));
	}
}	

DrawPolylineCmd.prototype = new SketchCommand();

// Circle center Radius command
function CircleCenterRadiusCmd(id){
	SketchCommand.call(this, id);
	
	var centerPt = null;
	var previewCircle = null;
	var segments = 64;				
	var that = this; // store this
	
	this.onMouseDown = function(event){
		var newPt = getPickPoint(event);							
		if(centerPt == null)
			centerPt = newPt;
		else{
			var center = new THREE.Vector3(centerPt.x, centerPt.y, centerPt.z);
			var	radius = center.distanceTo(newPt);;				
			that.drawCircle(centerPt, radius, false);
			centerPt =  null;
		}
	}

	this.onMouseMove = function(event){
		if(centerPt != null){
			var tempPt = getPickPoint(event);
			var center = new THREE.Vector3(centerPt.x, centerPt.y, centerPt.z);
			var	radius = center.distanceTo(tempPt);	
			that.drawCircle(centerPt, radius, true);
		}
	}	
	
	this.onKeyPress = function(event){
		var  keyCode = event.keyCode ? event.keyCode : event.which;
		switch(keyCode)
		{
		   case 27: //ESC
			   {
					that.clearPreview();
					that.clearData();
					that.unsubScriptEvents();
			   }
			   break;
		   default:
			   break;
		}
	}
	
	this.clearPreview = function(){
		if(previewCircle != null){
			OnSketch.App.scene.remove(previewCircle);
			previewCircle = null;
		}
	}
	
	this.clearData = function(){
		centerPt = null;
		previewCircle = null;
	}
	
	this.drawCircle = function(center, radius, preview){
		that.clearPreview();
		
		if(radius < 0.00001)
			return;
	
		var curve = new THREE.EllipseCurve(center.x, center.y, radius, radius, 0,  2 * Math.PI, false);
		var points = curve.getSpacedPoints( segments );
		var path = new THREE.Path();
		var geometry = path.createGeometry( points );
		var material = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
		if(preview == true){			
			previewCircle = new THREE.Line( geometry, material );
			OnSketch.App.scene.add( previewCircle );
		}
		else
			OnSketch.App.scene.add(new THREE.Line( geometry, material ));
	}
}	

CircleCenterRadiusCmd.prototype = new SketchCommand();

// two point rectangle Radius command
function RectangleTwoPointCmd(id){
	SketchCommand.call(this, id);
	
	var previewLines = new Array;
	var firstPt = null;		
	var that = this; // store this
	
	this.onMouseDown = function(event){
		var newPt = getPickPoint(event);
		if(firstPt == null)
			firstPt = newPt;
		else{				
			that.drawRectangle(firstPt, newPt, false);
			firstPt =  null;
		}
	}

	this.onMouseMove = function(event){
		if(firstPt != null){
			var tempPt = getPickPoint(event);		
			that.drawRectangle(firstPt, tempPt, true);
		}
	}	
	
	this.onKeyPress = function(event){
		var  keyCode = event.keyCode ? event.keyCode : event.which;
		switch(keyCode)
		{
		   case 27: //ESC
			   {
					that.clearPreview();
					that.clearData();
					that.unsubScriptEvents();
			   }
			   break;
		   default:
			   break;
		}
	}
	
	this.clearPreview = function(){
		for (i = 0; i < previewLines.length; i++){
			var line = previewLines[i];
			OnSketch.App.scene.remove(line);
			previewLines.pop();
		}
	}
	
	this.clearData = function(){
		firstPt = null;
		//previewLines.clear();
	}
	
	this.drawRectangle = function(pt1, pt3, preview){
		that.clearPreview();
		
		// calculate the other two point position
		uDir = new THREE.Vector3(1, 0, 0);
		vDir = new THREE.Vector3(0, 1, 0);
		var Uvec = new THREE.Vector3(pt3.x-pt1.x, pt3.y-pt1.y, pt3.z-pt1.z);
		var Vvec = new THREE.Vector3(pt3.x-pt1.x, pt3.y-pt1.y, pt3.z-pt1.z);
		Uvec.projectOnVector( uDir);
		Vvec.projectOnVector( vDir);
		pt2 = new THREE.Vector3(pt1.x+Uvec.x, pt1.y+Uvec.y, pt1.z+Uvec.z);
		pt4 = new THREE.Vector3(pt1.x+Vvec.x, pt1.y+Vvec.y, pt1.z+Vvec.z);
		
		var geometry = new THREE.Geometry;
		geometry.vertices.push(pt1, pt2, pt3, pt4, pt1);
		var material = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
		
		if(preview == true){
			previewline = new THREE.Line(geometry, material);
			OnSketch.App.scene.add(previewline);
			previewLines.push(previewline);
		}
		else
			OnSketch.App.scene.add(new THREE.Line(geometry, material));
	}
}	

RectangleTwoPointCmd.prototype = new SketchCommand();

var commands = new Array;
function CommandManager(){	
	this.addCommand = function(command){
		for (i = 0; i < commands.length; i++){
			var cmd = commands[i];
			cmd.onEnd();
			commands.pop();
		}
					
		command.onBegin();
		commands.push(command);
	}
}

var commandManager = new CommandManager();
function drawPolyline(){
	commandManager.addCommand(new DrawPolylineCmd("drawPolyline"));
}

function drawCircleCenterRadius(){
	commandManager.addCommand(new CircleCenterRadiusCmd("drawCircleCenterRadius"));
}

function drawRectangleTwoPoint(){
	commandManager.addCommand(new RectangleTwoPointCmd("drawRectangleTwoPoint"));
}