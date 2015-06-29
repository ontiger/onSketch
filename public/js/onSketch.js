var OnSketch = {REVISION:"1"}

OnSketch.Application = function() {
	this.scene = null;
	this.camera=null;
	this.renderer=null;
	this.grid=null;
	this.orbitControl = null;
	
	this.init = function()
	{
		var viewWidth = window.innerWidth;
		var viewHeight = window.innerHeight*0.95;
		var viewX = 0;
		var viewY = window.innerHeight *0.05;
		
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( viewWidth, viewHeight );
		this.renderer.setViewport(viewX, viewY, viewWidth, viewHeight);
		// set background color
		this.renderer.setClearColor(0x334455, 1.0);
		document.body.appendChild( this.renderer.domElement );
		
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight), 0.1, 1000 );

		// default eye position
		this.camera.position.z = 500;
		this.camera.position.x = 100;
		this.camera.position.y = 100;
		var a = new THREE.Vector3( 0, 0, 0 );
		this.camera.lookAt(a);
		
		this.createOrigin();
		this.createGrid();
		
		this.orbitControl = new THREE.OrbitControls( this.camera );
		this.orbitControl.damping = 0.2;
		this.orbitControl.addEventListener( 'change', this.renderer );
	};
	
	this.createOrigin = function()
	{
		// x, y, z axis
		var axis = new THREE.AxisHelper( 100 );
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
};

