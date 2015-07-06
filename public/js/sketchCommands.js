

function getNDCPt(event)
{
	// NDC (normalized Device Coordinate) x [-1, 1], y[1,-1]
	var newPt = new THREE.Vector2();
	newPt.x = ( event.clientX / OnSketch.App.view.width ) * 2 - 1;
	newPt.y = - ( event.clientY / OnSketch.App.view.height ) * 2 + 1;
	return newPt;
}

function getPickPoint(event)
{
	mouse = getNDCPt(event);
	OnSketch.App.raycaster.setFromCamera(mouse, OnSketch.App.camera);
	
	// compute the intersection between ray and the defaule sketch plane
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

// base command
function InteractiveCommand(id){
	this.id = id;
	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
										
	this.subScriptEvents = function()
	{
		OnSketch.App.renderer.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
		OnSketch.App.renderer.domElement.addEventListener( 'mousemove', this.onMouseMove, false );
		
		// canvas doesn't support keyboard event, use window instead
		window.addEventListener( 'keydown', this.onKeyPress, true);
		
		OnSketch.App.enableOrbit(false);
	}

	this.unsubScriptEvents = function()
	{
		OnSketch.App.renderer.domElement.removeEventListener( 'mousedown', this.onMouseDown, false );
		OnSketch.App.renderer.domElement.removeEventListener( 'mousemove', this.onMouseMove, false );
		
		// canvas doesn't support keyboard event, use window instead
		window.addEventListener( 'keydown', this.onKeyPress, true);
		
		OnSketch.App.enableOrbit(true);
	}				
}

// sketch base command
function SketchCommand(id){
	InteractiveCommand.call(this, id);
}

SketchCommand.prototype = new InteractiveCommand;

// draw polyline command
function DrawPolylineCmd(id){
	SketchCommand.call(this, id);
	
	var startPt = null;
	var endPtPt = null;
	var previewline = null;		
	var that = this; // store this
	
	this.onMouseDown = function(event){
		var newPt = getPickPoint(event);
		if(this.startPt == null)
			this.startPt = newPt;
		else{				
			that.drawLine(this.startPt, newPt, false);
			this.startPt =  newPt;
		}
	}

	this.onMouseMove = function(event){
		if(this.startPt != null){
			var tempPt = getPickPoint(event);		
			that.drawLine(this.startPt, tempPt, true);
		}
	}

	this.onKeyPress = function(event){
		var  keyCode = event.keyCode ? event.keyCode : event.which;
		switch(keyCode)
		{
		   case 27: //ESC
			   {
					//clearPreview();
					startPt = null;
					that.unsubScriptEvents();
			   }
			   break;
		   default:
			   break;
		}
	}		
	
	this.drawLine = function(pt1, pt2, preview){
		if(previewline != null){
			OnSketch.App.scene.remove(previewline);
			previewline = null;
		}
	
		var geometry = new THREE.Geometry;
		geometry.vertices.push(pt1, pt2);
		var material = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
		
		if(preview == true){
			previewline = new THREE.Line(geometry, material);
			OnSketch.App.scene.add(previewline);
		}
		else
		{
			OnSketch.App.scene.add(new THREE.Line(geometry, material));
			OnSketch.App.writeData();
		}
	}		
}	

DrawPolylineCmd.prototype = new SketchCommand();

// Circle center Radius command
function CircleCenterRadiusCmd(id){
	SketchCommand.call(this, id);
	
	var centerPt = null;
	var radius = null;
	var previewCircle = null;
	var segments = 64;				
	var that = this; // store this
	
	this.onMouseDown = function(event){
		var newPt = getPickPoint(event);							
		if(this.centerPt == null)
			this.centerPt = newPt;
		else{
			var center = new THREE.Vector3(this.centerPt.x, this.centerPt.y, this.centerPt.z);
			var	radius = center.distanceTo(newPt);;				
			that.drawCircle(this.centerPt, radius, false);
			this.centerPt =  null;
		}
	}

	this.onMouseMove = function(event){
		if(this.centerPt != null){
			var tempPt = getPickPoint(event);
			var center = new THREE.Vector3(this.centerPt.x, this.centerPt.y, this.centerPt.z);
			var	radius = center.distanceTo(tempPt);	
			that.drawCircle(this.centerPt, radius, true);
		}
	}	
	
	this.drawCircle = function(center, radius, preview){
		if(previewCircle != null){
			OnSketch.App.scene.remove(previewCircle);
			previewCircle = null;
		}
		
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

	this.onKeyPress = function(event){
		var  keyCode = event.keyCode ? event.keyCode : event.which;
		switch(keyCode)
		{
		   case 27: //ESC
			   {
					//clearPreview();
					this.centerPt = null;
			   }
			   break;
		   default:
			   break;
		}
	}				
}	

CircleCenterRadiusCmd.prototype = new SketchCommand();

function drawPolyline(){
	var drawPolylineCmd = new DrawPolylineCmd("drawPolyline");
	drawPolylineCmd.subScriptEvents();
}

function drawCircleCenterRadius(){
	var circleCenterRadiusCmd = new CircleCenterRadiusCmd("drawCircleCenterRadius");
	circleCenterRadiusCmd.subScriptEvents();
}