var OnSketch = {REVISION:"1"}

OnSketch.View = function(){
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;	
	
	this.update = function()
	{
		var sketchView = $("#SketchCanvas")[0];
		this.x = 0;
		this.y = sketchView.offsetTop;
		this.width = sketchView.offsetWidth;
		this.height = window.innerHeight - sketchView.offsetTop;		
	};
	
	this.updateRenderer = function(renderer)
	{
		renderer.setSize( this.width, this.height );
		renderer.setViewport(this.x, this.y, this.width, this.height);
	}
	
	this.update();
};

OnSketch.Cursor = function(obj, o)
{
	var CursorType = 
	{
		eMove : 0,
		eSnap : 1
	}
	this.size = 10;
	this.node = obj;
	this.orbitControl = o;
	this.cursorType = CursorType.eMove;
	this.clearCursor = function()
	{
		this.node.children = [];
	}

	this.updateCursor = function(pt)
	{
		var sz = this.size;
		if ( this.orbitControl.object instanceof THREE.PerspectiveCamera ) {
			var dist = this.orbitControl.object.position.distanceTo(this.orbitControl.target);
			dist /= 300;
			sz *= dist;
		} else if ( this.orbitControl.object instanceof THREE.OrthographicCamera ) {
			// not tested
			sz *= this.orbitControl.object.zoom;
		}	
		this.node.children = [];
		/*
		if(window.console)
		{
			window.console.log(this.orbitControl.object.position.x + ' ' + this.orbitControl.object.position.y + ' ' + this.orbitControl.object.position.z);
		}
		*/

		var geometry1 = new THREE.Geometry;
		var geometry2 = new THREE.Geometry;
		if(this.cursorType === CursorType.eMove)
		{
			var pt1 = new THREE.Vector3(pt.x - sz, pt.y, 0);
			var pt2 = new THREE.Vector3(pt.x + sz, pt.y, 0);
			var pt3 = new THREE.Vector3(pt.x, pt.y - sz, 0);
			var pt4 = new THREE.Vector3(pt.x, pt.y + sz, 0);
			geometry1.vertices.push(pt1, pt2);
			geometry2.vertices.push(pt3, pt4);
		}
		else if(this.cursorType === CursorType.eSnap)
		{
			var pt1 = new THREE.Vector3(pt.x - sz, pt.y - sz, 0);
			var pt2 = new THREE.Vector3(pt.x + sz, pt.y + sz, 0);
			var pt3 = new THREE.Vector3(pt.x - sz, pt.y + sz, 0);
			var pt4 = new THREE.Vector3(pt.x + sz, pt.y - sz, 0);
			geometry1.vertices.push(pt1, pt2);
			geometry2.vertices.push(pt3, pt4);
		}
		else
		{
			return;
		}

		var material = new THREE.LineBasicMaterial( { color : 0x0000ff } );
		
		var line1 = new THREE.Line(geometry1, material);
		var line2 = new THREE.Line(geometry2, material);
		this.node.add(line1);
		this.node.add(line2);	
	}
}

OnSketch.InferenceInfo = function(pos, geom) {
	this.updatedPosition = pos;
	this.geometry = geom;
}

OnSketch.Application = function() {
	this.scene = null;
	this.camera=null;
	this.renderer=null;
	this.grid=null;
	this.view=null;
	this.defaultSketchPlane = null;
	this.planes = new Array;

	this.geometries = null;

	this.cursorNode = null;
	this.cursor = null;

/*
	this.tooltipConext = null;
	this.tooltipTexture = null;
	this.tooltipSprite = null;
	*/
	
	var application = this;
	this.profiles = null;
	
	this.init = function()
	{
		this.view = new OnSketch.View();

		this.renderer = new THREE.WebGLRenderer();
		this.view.updateRenderer(this.renderer);
		// set background color
		this.renderer.setClearColor(0xFFFFFF, 1); 
		document.body.appendChild( this.renderer.domElement );
		
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, this.view.width / this.view.height, 0.1, 1000 );
		this.geometries = new THREE.Object3D();
		this.cursorNode = new THREE.Object3D();
		this.profiles = new THREE.Object3D();

		// default eye position
		this.camera.position.z = 150;
		this.camera.position.x = 150;
		this.camera.position.y = 100;
		var a = new THREE.Vector3( 0, 0, 0 );
		this.camera.lookAt(a);
		
		// initial light
		function initLight() {
			light = new THREE.DirectionalLight(0x0000FF,1.0,0);
			light.position.set(50,50,50);
			this.scene.add(light);
		}
		
		this.createOrigin();
		this.createGrid();
		this.scene.add(this.geometries);
		this.scene.add(this.cursorNode);
		
		this.orbitControl = new THREE.OrbitControls( this.camera );
		this.orbitControl.damping = 0.2;
		this.orbitControl.addEventListener( 'change', this.renderer );
		this.cursor = new OnSketch.Cursor(this.cursorNode, this.orbitControl);
		
		this.raycaster = new THREE.Raycaster();
		this.raycaster.linePrecision = 4;
		
		this.createPalette();

		/*
		// create a canvas element
		var canvas1 = document.createElement('canvas');
		this.tooltipConext = canvas1.getContext('2d');
		this.tooltipConext.font = "15px Arial";
		this.tooltipConext.fillStyle = "rgba(0,0,0,0.95)";
		this.tooltipConext.fillText('onsketch', 0, 20);
    
		// canvas contents will be used for a texture
		this.tooltipTexture = new THREE.Texture(canvas1) 
		this.tooltipTexture.needsUpdate = true;
	
		var spriteMaterial = new THREE.SpriteMaterial( { map: this.tooltipTexture, useScreenCoordinates: true } );
	
		this.tooltipSprite = new THREE.Sprite(spriteMaterial);
		this.tooltipSprite.scale.set(100,100,1.0);
		this.tooltipSprite.position.set( 0, 0, 0 );
		this.scene.add(this.tooltipSprite);	
		*/
	};
	
	this.createPalette = function()
	{
		gui = new dat.GUI();
		var parameters =
		{
			name: "Sketch1", 
			showProfile: false,
			showPlanes: true,
			lookAt: function () 
			{ 
				lookAtSketch();
			}
		};
		gui.add( parameters, 'name' ).name('Sketch');
		gui.add( parameters, 'showProfile' ).name('Show Profile');
		var planesCheck = gui.add(parameters, 'showPlanes').name('Show Planes');
		planesCheck.onChange(
			function(value)
			{
				var l = application.planes.length;
				for(var i = 0; i < l; ++i)
				{
					application.planes[i].visible = value;
				}
			});
		gui.add( parameters, 'lookAt' ).name('Look At');
		gui.open();	
	}

	this.updateTooltip = function(pos, str)
	{
		// update sprite position
		/*
		application.tooltipSprite.position.set( pos.x, pos.y + 20, 0 );
		application.tooltipTexture.needsUpdate = true;
		*/
	}

	function lookAtSketch()
	{
		application.camera.position.set(0, 0, 100);
		application.camera.lookAt(application.scene.position);
		application.orbitControl.center.x = application.scene.position.x;
		application.orbitControl.center.y = application.scene.position.y;
		application.orbitControl.center.z = application.scene.position.z;
	}

	this.createOrigin = function()
	{
		// x, y, z axis
		var axis = new THREE.AxisHelper( 60 );
		axis.position.set( 0, 0, 0 );
		this.scene.add( axis );
		// xy plane
		var xyPlaneGeometry = new THREE.PlaneGeometry( 50, 50, 320 );
		var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
		material.opacity = 0.9;
		material.transparent= true;
		var xyPlane = new THREE.Mesh( xyPlaneGeometry, material );
		xyPlane.position.x = 30;
		xyPlane.position.y = 30;
		this.scene.add( xyPlane );
		
		this.defaultSketchPlane = xyPlane;

		// yz plane
		var yzPlaneGeometry = new THREE.PlaneGeometry( 50, 50, 320 );
		var yzPlane = new THREE.Mesh( yzPlaneGeometry, material );
		yzPlane.rotation.y = Math.PI/2;
		yzPlane.position.y = 30;
		yzPlane.position.z = 30;
		this.scene.add( yzPlane );
		
		// xz plane
		var xzPlaneGeometry = new THREE.PlaneGeometry( 50, 50, 320 );
		var xzPlane = new THREE.Mesh( xzPlaneGeometry, material );
		xzPlane.rotation.x = Math.PI/2;
		xzPlane.position.x = 30;
		xzPlane.position.z = 30;
		this.scene.add( xzPlane );

		this.planes.push(xyPlane);
		this.planes.push(xzPlane);
		this.planes.push(yzPlane);
	};
	
	this.createGrid = function()
	{
		this.grid = new THREE.GridHelper( 200, 10 );
		this.grid.setColors( 0x0000ff, 0x808080 );
		this.grid.position.y = -50;
		this.scene.add( this.grid );
	}
	
	this.onWindowResize = function()
	{
		this.view.update();
		
		this.camera.aspect = this.view.width / this.view.height;
		this.camera.updateProjectionMatrix();
		
		this.view.updateRenderer(this.renderer);
	}
	
	this.enableOrbit = function(enabled)
	{
		this.orbitControl.enabled = enabled;
	}
	
	this.startSocket = function()
	{
        this.socket = io();
        var that = this;
		this.socket.on('drawCurve', function(msg){
            that.drawProfiles(msg.meshes);
		  });
    }
	
	this.drawProfiles = function(meshes)
	{
		if(meshes && meshes.length > 0)
		{
			// clear old profile scene nodes
			this.scene.remove(this.profiles);
				
			this.profiles = new THREE.Object3D();
			this.scene.add(this.profiles);
			var material = new THREE.MeshBasicMaterial( { color: 0x225588 } );
			for(var i = 0; i < meshes.length; ++i)
			{
				var mesh = meshes[i];
				var faceGeometry = new THREE.Geometry();
				
				for(var j = 0; j < mesh.points.length; ++j)
				{
					var tpt = new THREE.Vector3(mesh.points[j].x, mesh.points[j].y, mesh.points[j].z);
					faceGeometry.vertices.push(tpt);
				}
				
				var normal = null;
				for(var j = 0; j < mesh.normals.length; ++j)
				{
					vnormal = new THREE.Vector3(mesh.normals[j].x, mesh.normals[j].y, mesh.normals[j].z);
					//faceGeometry.
					break;
				}
				
				for(var j = 0; j < mesh.indices.length; j=j+3)
				{
					var facet = new THREE.Face3(mesh.indices[j], mesh.indices[j+1], mesh.indices[j+2]);
					faceGeometry.faces.push(facet);
				}
				var tmesh = new THREE.Mesh(faceGeometry, material);
				tmesh.userData = mesh.id;
				this.profiles.add(tmesh);
			}
		}
	}
    
    this.disconnect = function ()
    {
        this.socket.disconnect(true);
        this.socket = null;
    }
	
	this.writeData = function(data)
	{
		if(this.socket == null)
			this.startSocket();
		this.socket.emit('drawCurve', data);
	}

	
	this.run = function()
	{					
		onDraw();
	}
	
	function onWindowResize()
	{
		application.onWindowResize();
	}
	
	function onDraw()
	{
		requestAnimationFrame( onDraw );
		application.renderer.render( application.scene, application.camera );
	}
	
	this.init();
	
	// canvas doesn't support keyboard event, use window instead
	//window.addEventListener( 'keydown', onKeyPress, true);
	window.addEventListener( 'resize', onWindowResize, true);
	
	this.run();
};

$(function() {
	// application entry
	OnSketch.App = new OnSketch.Application();
})
