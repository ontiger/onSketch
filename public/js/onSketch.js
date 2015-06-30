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

OnSketch.Application = function() {
	this.scene = null;
	this.camera=null;
	this.renderer=null;
	this.grid=null;
	this.view=null;
	this.defaultSketchPlane = null;
	
	var application = this;
	
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
		
		this.orbitControl = new THREE.OrbitControls( this.camera );
		this.orbitControl.damping = 0.2;
		this.orbitControl.addEventListener( 'change', this.renderer );
		
		this.raycaster = new THREE.Raycaster();
	};
	
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
