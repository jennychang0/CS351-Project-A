//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image;
                                    // in milliseconds; used by 'animate()' fcn
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.

var g_angle01 = 0;                  // initial arangle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second

var g_angleG_n = 0;                  // second rotation angle
var g_angleG_nRate = 10.0;          // second rotation angle rate, in deg/sec
var g_angleG_nMax = 35.0;            // max angle for rocking back and forth
var g_angleG_nMin = -10.0;

var g_angleG_h = 20.0;                  // second rotation angle
var g_angleG_hRate = -10.0;          // second rotation angle rate, in deg/sec
var g_angleG_hMax = 30.0;            // max angle for rocking back and forth
var g_angleG_hMin = -15.0;

var g_balloon_angle01 = 0;                  // initial rotation angle
var g_balloon_angle01Rate = 45.0;  
var g_balloon_angle02 = 0;
var g_balloon_angle02Rate = 180;     // rotation speed, in degrees/second 
var g_balloon_xdistance = 0;
var g_balloon_xdistancerate = 0.4;

var g_init_r = 0.5;
var g_init_g = 0.5;
var g_init_b = 0.5;


//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  

function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'g_canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(1, 1, 1, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global g_balloon_angle01 variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {

	g_maxVerts = initVertexBuffer(gl);  

    animate();  // Update the rotation angle
    drawAll();   // Draw all parts
//    console.log('g_angle01=',g_angle01.toFixed(5)); // put text in console.


//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		// document.getElementById('CurAngleDisplay').innerHTML= 
		// 	'g_balloon_angle01= '+g_balloon_angle01.toFixed(5);
		// // Also display our current mouse-dragging state:
		// document.getElementById('Mouse').innerHTML=
		// 	'Mouse Drag totals (CVV coords):\t'+
		// 	g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(5);	
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/
			// Face 0: (left side)  
     0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
	 c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
	
	// DRAW GIRAFFE

	// Neck
	2.0,  2.0,  0.0,  1.0,		0.2, 0.1, 0.0, // B
	1.0,  1.0, -1.0,  1.0,		1.0, 0.9, 0.2, // Y
	1.0,  1.0,  1.0,  1.0,		1.0, 0.9, 0.2, // R

	1.0,  1.0,  1.0,  1.0,		1.0, 0.9, 0.2, // R
	1.0,  1.0, -1.0,  1.0,		1.0, 0.9, 0.2, // Y
	-1.0, -1.0, 1.0,  1.0,		1.0, 0.8, 0.0, // O

	1.0,  1.0, -1.0,  1.0,		1.0, 0.9, 0.2, // Y
	-1.0, -1.0, 1.0,  1.0,		1.0, 0.8, 0.0, // O
	-1.0, -1.0, -1.0, 1.0,		1.0, 0.8, 0.0, // G

	-1.0, -1.0, -1.0, 1.0,		1.0, 0.8, 0.0, // G
	-1.0, -1.0, 1.0,  1.0,		1.0, 0.8, 0.0, // O
	-2.0, -2.0, 0.0,  1.0,		1.0, 0.9, 1.0, // P

	2.0,  2.0,  0.0,  1.0,		0.2, 0.1, 0.0, // B
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	1.0,  1.0,  1.0,  1.0,		1.0, 0.9, 0.2, // R

	1.0,  1.0,  1.0,  1.0,		1.0, 0.9, 0.2, // R
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	-1.0, -1.0, 1.0,  1.0,		1.0, 0.8, 0.0, // O

	-1.0, -1.0, 1.0,  1.0,		1.0, 0.8, 0.0, // O
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	-2.0, -2.0, 0.0,  1.0,		1.0, 0.9, 1.0, // P

	-2.0, -2.0, 0.0,  1.0,		1.0, 0.9, 1.0, // P
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	-1.0, -1.0, -1.0, 1.0,		1.0, 0.8, 0.0, // G

	-1.0, -1.0, -1.0, 1.0,		1.0, 0.8, 0.0, // G
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	1.0,  1.0, -1.0,  1.0,		1.0, 0.9, 0.2, // Y

	1.0,  1.0, -1.0,  1.0,		1.0, 0.9, 0.2, // Y
	-14.0, 14.0, 0.0, 1.0,		0.2, 0.1, 0.0, // W
	2.0,  2.0,  0.0,  1.0,		0.2, 0.1, 0.0, // B


	// Head
	2.0,  2.0,  0.0,  1.0,		1.0, 1.0, 1.0, // B
	1.0,  1.0, -1.0,  1.0,		0.2, 0.2, 0.2, // Y
	1.0,  1.0,  1.0,  1.0,		0.2, 0.2, 0.2, // R

	1.0,  1.0,  1.0,  1.0,		0.2, 0.2, 0.2, // R
	1.0,  1.0, -1.0,  1.0,		0.2, 0.2, 0.2, // Y
	-1.0, -1.0, 1.0,  1.0,		1.0, 1.0, 1.0, // O

	1.0,  1.0, -1.0,  1.0,		0.2, 0.2, 0.2, // Y
	-1.0, -1.0, 1.0,  1.0,		1.0, 1.0, 1.0, // O
	-1.0, -1.0, -1.0, 1.0,		1.0, 1.0, 1.0, // G

	-1.0, -1.0, -1.0, 1.0,		1.0, 1.0, 1.0, // G
	-1.0, -1.0, 1.0,  1.0,		1.0, 1.0, 1.0, // O
	-2.0, -2.0, 0.0,  1.0,		0.2, 0.2, 0.2, // P

	2.0,  2.0,  0.0,  1.0,		1.0, 1.0, 1.0, // B
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	1.0,  1.0,  1.0,  1.0,		0.2, 0.2, 0.2, // R

	1.0,  1.0,  1.0,  1.0,		0.2, 0.2, 0.2, // R
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	-1.0, -1.0, 1.0,  1.0,		1.0, 1.0, 1.0, // O

	-1.0, -1.0, 1.0,  1.0,		1.0, 1.0, 1.0, // O
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	-2.0, -2.0, 0.0,  1.0,		0.2, 0.2, 0.2, // P

	-2.0, -2.0, 0.0,  1.0,		0.2, 0.2, 0.2, // P
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	-1.0, -1.0, -1.0, 1.0,		1.0, 1.0, 1.0, // G

	-1.0, -1.0, -1.0, 1.0,		1.0, 1.0, 1.0, // G
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	1.0,  1.0, -1.0,  1.0,		0.2, 0.2, 0.2, // Y

	1.0,  1.0, -1.0,  1.0,		0.2, 0.2, 0.2, // Y
	-8.0,  8.0, 0.0, 1.0,		1.0, 0.4, 0.6, // W
	2.0,  2.0,  0.0,  1.0,		1.0, 1.0, 1.0, // B


	// Ear
	0.0,  0.0,  0.0,  1.0, 		0.5, 0.0, 0.5, // A
	1.0,  0.0,  1.0,  1.0,		0.0, 0.0, 0.0, // C
	0.0,  0.5,  1.0,  1.0,		1.0, 1.0, 0.0, // D

	0.0,  0.5,  1.0,  1.0,		1.0, 1.0, 0.0, // D
	1.0,  0.0,  1.0,  1.0,		0.0, 0.0, 0.0, // C
	0.0,  0.0,  3.0,  1.0,		0.0, 0.8, 0.4, // B

	0.0,  0.0,  3.0,  1.0,		0.0, 0.8, 0.4, // B
	1.0,  0.0,  1.0,  1.0,		0.0, 0.0, 0.0, // C
	0.0, -0.5,  1.0,  1.0,		0.7, 0.2, 0.0, // E

	0.0, -0.5,  1.0,  1.0,		0.7, 0.2, 0.0, // E
	1.0,  0.0,  1.0,  1.0,		0.0, 0.0, 0.0, // C
	0.0,  0.0,  0.0,  1.0, 		0.5, 0.0, 0.5, // A

	0.0,  0.0,  0.0,  1.0, 		0.5, 0.0, 0.5, // A
	0.0,  0.5,  1.0,  1.0,		1.0, 1.0, 0.0, // D
	0.0, -0.5,  1.0,  1.0,		0.7, 0.2, 0.0, // E

	0.0,  0.5,  1.0,  1.0,		1.0, 1.0, 0.0, // D
	0.0, -0.5,  1.0,  1.0,		0.7, 0.2, 0.0, // E
	0.0,  0.0,  3.0,  1.0,		0.0, 0.8, 0.4, // B


	 -0.25, 0.1, -0.25, 1.0,          1.0, 0.0, 0.0, // Node A
	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B
	 0.25, 0.1, -0.25, 1.0,            1.0, 0.0, 1.0, //Node C

	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D

	 -0.25, 0.1, -0.25, 1.0,          1.0, 0.0, 0.0, // Node A
	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B
	 -0.25, 1.1, 0.25, 1.0,            g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E

	 -0.25, 0.1, -0.25, 1.0,          1.0, 0.0, 0.0, // Node A
	 -0.25, 1.1, 0.25, 1.0,            g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E
	 -0.25, 1.1, -0.25, 1.0,            1.0, 1.0, 1.0, // Node F

	 0.25, 1.1, -0.25, 1.0,             0.0, 1.0, 1.0, //Node G
	 0.25, 1.1, 0.25, 1.0,             0.5, 1.0, 1.0, //Node H
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C

	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D
	 0.25, 1.1, 0.25, 1.0,             0.5, 1.0, 1.0, //Node H

	 -0.25, 0.1, -0.25, 1.0,           1.0, 0.0, 0.0, // Node A
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C
	 -0.25, 1.1, -0.25, 1.0,            1.0, 1.0, 1.0, // Node F

	 -0.25, 1.1, -0.25, 1.0,            1.0, 1.0, 1.0, // Node F
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C
	 0.25, 1.1, -0.25, 1.0,             0.0, 1.0, 1.0, //Node G

	 -0.25, 1.1, 0.25, 1.0,           g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E
	 0.25, 1.1, 0.25, 1.0,            0.5, 1.0, 1.0, //Node H
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D


	 -0.25, 1.1, 0.25, 1.0,            g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D
	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B

	 0.25, 1.1, -0.25, 1.0,             0.0, 1.0, 1.0, //Node G
	 0.25, 1.1, 0.25, 1.0,             0.5, 1.0, 1.0, //Node H
	 0.0, 1.2, 0.0, 1.0,       	     1.0, 0.0, 1.0, //Node I


	 0.0, 1.2, 0.0, 1.0,         1.0, 0.0, 1.0, //Node I
	 -0.25, 1.1, -0.25, 1.0,           1.0, 1.0, 1.0, // Node F
	 0.25, 1.1, -0.25, 1.0,             0.0, 1.0, 1.0, //Node G

	 0.0, 1.2, 0.0, 1.0,          1.0, 0.0, 1.0, //Node I
	 -0.25, 1.1, -0.25, 1.0,           1.0, 1.0, 1.0, // Node F
	 -0.25, 1.1, 0.25, 1.0,            g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E

	 0.0, 1.2, 0.0, 1.0,          1.0, 0.0, 1.0, //Node I
	 -0.25, 1.1, 0.25, 1.0,            g_init_r, g_init_g, g_init_b,//0.0, 0.0, 0.0,// Node E
	 0.25, 1.1, 0.25, 1.0,             0.5, 1.0, 1.0, //Node H

	 -0.25, 0.1, -0.25, 1.0,          1.0, 0.0, 0.0, // Node A
	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B
	 0.0, 0.0, 0.0, 1.0,        0.5, 0.5, 1.0, // Node J


	 -0.25, 0.1, -0.25, 1.0,          1.0, 0.0, 0.0, // Node A
	 0.0, 0.0, 0.0, 1.0,        0.5, 0.5, 1.0, // Node J
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C

	 0.0, 0.0, 0.0, 1.0,        0.5, 0.5, 1.0, // Node J
	 0.25, 0.1, -0.25, 1.0,             1.0, 0.0, 1.0, //Node C
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D

	 0.0, 0.0, 0.0, 1.0,        0.5, 0.5, 1.0, // Node J
	 0.25, 0.1, 0.25, 1.0,            1.0, 1.0, 0.0, //Node D
	 -0.25, 0.1, 0.25, 1.0,           1.0, 1.0, 1.0, //Node B


	 //Giraffe horns
	0.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // S
	0.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // T
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U

	0.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // S
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U
	1.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // V

	0.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // S
	0.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // T
	0.0,  5.0,  0.0,  1.0,		0.5, 0.25, 0.0, // W

	0.0,  5.0,  0.0,  1.0,		0.5, 0.25, 0.0, // W
	0.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // T
	0.0,  5.0,  1.0,  1.0,		0.2, 0.1, 0.0, // Z

	0.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // T
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U
	0.0,  5.0,  1.0,  1.0,		0.2, 0.1, 0.0, // Z

	0.0,  5.0,  1.0,  1.0,		0.2, 0.1, 0.0, // Z
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U
	1.0,  5.0,  1.0,  1.0,		0.5, 0.25, 0.0, // Y

	0.0,  5.0,  0.0,  1.0,		0.5, 0.25, 0.0, // W
	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X
	0.0,  5.0,  1.0,  1.0,		0.2, 0.1, 0.0, // Z

	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X
	0.0,  5.0,  1.0,  1.0,		0.2, 0.1, 0.0, // Z
	1.0,  5.0,  1.0,  1.0,		0.5, 0.25, 0.0, // Y

	0.0,  5.0,  0.0,  1.0,		0.5, 0.25, 0.0, // W
	0.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // S
	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X

	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X
	0.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // S
	1.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // V

	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U
	1.0,  5.0,  1.0,  1.0,		0.5, 0.25, 0.0, // Y

	1.0,  5.0,  0.0,  1.0,		0.2, 0.1, 0.0, // X
	1.0,  0.0,  1.0,  1.0,		1.0, 1.0, 1.0, // U
	1.0,  0.0,  0.0,  1.0,		1.0, 1.0, 1.0, // V


  ]);
  g_vertsMax = 148;		// 12 tetrahedron vertices.
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
  return nn;
*/
}

function drawAll() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);
	
  //-------Draw Spinning Tetrahedron

  //// draw lower body
  g_modelMatrix.setTranslate(-0.4,-0.8, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  g_modelMatrix.scale(0.25, 0.5, 0.5);
  g_modelMatrix.rotate(30, 0, 1, 0);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  g_modelMatrix.rotate(g_balloon_angle01*0.7, 1, 0, 0);  // Make new drawing axes that
  g_modelMatrix.translate(-0.25, -1.2, -0.25);
  g_modelMatrix.translate(g_balloon_xdistance, 1.0, 0, 0);
  // DRAW TETRA:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:
  		// Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  		// Draw triangles: start at vertex 0 and draw 12 vertices
  //gl.drawArrays(gl.TRIANGLES, 0, 12);

  DrawLowerBody();
  

  //pushMatrix(g_modelMatrix)

  /////  draw the smaller body above big body
  g_modelMatrix.translate(0.0, 1.2, 0.0);
  g_modelMatrix.scale(0.75, 0.77, -0.45);
  g_modelMatrix.rotate(g_balloon_angle01*-2, 1,0,0);
//   g_modelMatrix.translate(-0.25, 0.0, -0.25);
//   g_modelMatrix.translate(-0.1, 0, 0);


  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawUpperBody();

  pushMatrix(g_modelMatrix)
  
 /////draw head
 g_modelMatrix.translate(0.0, 1.2, 0.0);
 g_modelMatrix.scale(0.5, 0.25, 0.5);
 g_modelMatrix.rotate(g_balloon_angle01*-1.5, 1,0,0);
 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
 DrawHead();
 


 ////// ARMS

 g_modelMatrix = popMatrix();
 pushMatrix(g_modelMatrix);


	//-------------------------------
	// DRAW 2 TRIANGLES:		Use this matrix to transform & draw
	//						the different set of vertices stored in our VBO:

 g_modelMatrix.rotate(90, 0, 0, 1);
 g_modelMatrix.translate(0.7, 0, 0.0)
 g_modelMatrix.scale(0.3, 3, 0.3);
 g_modelMatrix.rotate(g_balloon_angle02, 0, 1, 0);
 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

 DrawLeftArm();
 
 


 g_modelMatrix = popMatrix();
 pushMatrix(g_modelMatrix);

 g_modelMatrix.rotate(270, 0, 0, 1);
 g_modelMatrix.translate(-0.7, 0.0, 0.0);
 g_modelMatrix.scale(0.3, 3, 0.3);
 g_modelMatrix.rotate(g_balloon_angle02, 0, 1, 0);
 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

 DrawRightArm();
 g_modelMatrix = popMatrix();


 ///JESSICA'S GIRAFFE


	// NEXT, create different drawing axes, and...
g_modelMatrix.setTranslate(0.6, 0.0, 0.0);  // 'set' means DISCARD old matrix,
// (drawing axes centered in CVV), and then make new
// drawing axes moved to the lower-left corner of CVV.

g_modelMatrix.scale(1.0, 1.0, -1.0);
g_modelMatrix.scale(0.9, 0.9, 0.9);
// Mouse-Dragging for Rotation:
//-----------------------------
// Attempt 1:  X-axis, then Y-axis rotation:
/*  						// First, rotate around x-axis by the amount of -y-axis dragging:
g_modelMatrix.rotate(-g_yMdragTot*120.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
	// Then rotate around y-axis by the amount of x-axis dragging
g_modelMatrix.rotate( g_xMdragTot*120.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
// Acts SENSIBLY if I always drag mouse to turn on Y axis, then X axis.
// Acts WEIRDLY if I drag mouse to turn on X axis first, then Y axis.
// ? Why is is 'backwards'? Duality again!
*/
//-----------------------------

var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);

  // Draw Giraffe Neck
  	g_modelMatrix.translate(0.0, 0.0, 0.0);  // 'set' means DISCARD old matrix,
					// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  	//g_modelMatrix.scale(0.1,0.1,-0.1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  	g_modelMatrix.scale(0.05, 0.05, 0.05);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(45, 0, 1, 0);  // Make new drawing axes that
	g_modelMatrix.rotate(g_angleG_n, 0, 0, 1);

  // DRAW:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:
  		// Pass our current matrix to the vertex shaders:
  	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  		// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeNeck();
	  

	// Draw Giraffe Head
	g_modelMatrix.translate(-14.0, 14.0, 0.0);  // 'set' means DISCARD old matrix,
	// (drawing axes centered in CVV), and then make new
		// drawing axes moved to the lower-left corner of CVV. 
	//g_modelMatrix.scale(1.0, 1.0, -1.0);							// convert to left-handed coord sys
																// to match WebGL display canvas.
	g_modelMatrix.scale(0.5, 0.5, 0.5);
		// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(90, 0, 0, 1);  // Make new drawing axes that
	g_modelMatrix.rotate(g_angleG_h, 0, 0, 1);

	// DRAW:  Use this matrix to transform & draw 
	//						the first set of vertices stored in our VBO:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeHead();
	pushMatrix(g_modelMatrix);

		// Draw Giraffe Left Horn
	g_modelMatrix.translate(1.0, 1.0, 0.5);  // 'set' means DISCARD old matrix,
	// (drawing axes centered in CVV), and then make new
		// drawing axes moved to the lower-left corner of CVV. 
	//g_modelMatrix.scale(1.0, 1.0, 1.0);							// convert to left-handed coord sys
																// to match WebGL display canvas.
	g_modelMatrix.scale(0.5, 0.5, 0.5);
		// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(-120, 0, 0, 1);  // Make new drawing axes that

	// DRAW:  Use this matrix to transform & draw 
	//						the first set of vertices stored in our VBO:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeHorn();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);

	// Draw Giraffe Right Horn
	g_modelMatrix.translate(1.0, 1.0, -1);  // 'set' means DISCARD old matrix,
	// (drawing axes centered in CVV), and then make new
		// drawing axes moved to the lower-left corner of CVV. 
	//g_modelMatrix.scale(1.0, 1.0, 1.0);							// convert to left-handed coord sys
																// to match WebGL display canvas.
	g_modelMatrix.scale(0.5, 0.5, 0.5);
		// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(-120, 0, 0, 1);  // Make new drawing axes that

	// DRAW:  Use this matrix to transform & draw 
	//						the first set of vertices stored in our VBO:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeHorn();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	
	// Draw Giraffe Left Ear
	g_modelMatrix.translate(0.0, 2.0, 1.0);  // 'set' means DISCARD old matrix,
	// (drawing axes centered in CVV), and then make new
		// drawing axes moved to the lower-left corner of CVV. 
	//g_modelMatrix.scale(1.0, 1.0, -1.0);							// convert to left-handed coord sys
																// to match WebGL display canvas.
	g_modelMatrix.scale(2.0, 2.0, 2.0);
		// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(-75, 0, -0.1, 1);  // Make new drawing axes that

	// DRAW:  Use this matrix to transform & draw 
	//						the first set of vertices stored in our VBO:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeEar();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);


	// Draw Giraffe Right Ear
	g_modelMatrix.translate(0.0, 2.0, -1.0);  // 'set' means DISCARD old matrix,
	// (drawing axes centered in CVV), and then make new
		// drawing axes moved to the lower-left corner of CVV. 
	//g_modelMatrix.scale(1.0, 1.0, 1.0);							// convert to left-handed coord sys
																// to match WebGL display canvas.
	g_modelMatrix.scale(2.0, 2.0, -2.0);
		// if you DON'T scale, tetra goes outside the CVV; clipped!
	g_modelMatrix.rotate(-75, 0, -0.2, 1);  // Make new drawing axes that

	// DRAW:  Use this matrix to transform & draw 
	//						the first set of vertices stored in our VBO:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw triangles: start at vertex 0 and draw 12 vertices
	DrawGiraffeEar();
	g_modelMatrix = popMatrix();

}

function DrawLowerBody(){
	gl.drawArrays(gl.TRIANGLES, 90, 42);
}

function DrawUpperBody(){
	gl.drawArrays(gl.TRIANGLES, 90, 54);
}

function DrawHead(){
	gl.drawArrays(gl.TRIANGLES, 90, 30);
	gl.drawArrays(gl.TRIANGLES, 132, 12);
}

function DrawLeftArm(){
	gl.drawArrays(gl.TRIANGLES, 90, 30);
}

function DrawRightArm(){
	gl.drawArrays(gl.TRIANGLES, 90, 30); 
}

function DrawGiraffeNeck() {
	gl.drawArrays(gl.TRIANGLES, 12, 30);
}

function DrawGiraffeHead() {
	gl.drawArrays(gl.TRIANGLES, 42, 30);
}

function DrawGiraffeEar() {
	gl.drawArrays(gl.TRIANGLES, 72, 18);
}

function DrawGiraffeHorn() {
	gl.drawArrays(gl.TRIANGLES, 144, 36);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:
  //if(g_angle01 >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
  //if(g_angle01 <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;


  var newAngle1 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(newAngle1 > 180.0) newAngle1 = newAngle1 - 360.0;
  if(newAngle1 <-180.0) newAngle1 = newAngle1 + 360.0;
  g_angle01 = newAngle1

  var newAngleG_n = g_angleG_n + (g_angleG_nRate * elapsed) / 1000.0;
  if(g_angleG_n >  g_angleG_nMax && g_angleG_nRate > 0) g_angleG_nRate = -g_angleG_nRate;
  if(g_angleG_n <  g_angleG_nMin && g_angleG_nRate < 0) g_angleG_nRate = -g_angleG_nRate;
  if(newAngleG_n > 180.0) newAngleG_n = newAngleG_n - 360.0;
  if(newAngleG_n <-180.0) newAngleG_n = newAngleG_n + 360.0;
  g_angleG_n = newAngleG_n

  var newAngleG_h = g_angleG_h + (g_angleG_hRate * elapsed) / 1000.0;
  if(g_angleG_h >  g_angleG_hMax && g_angleG_hRate > 0) g_angleG_hRate = -g_angleG_hRate;
  if(g_angleG_h <  g_angleG_hMin && g_angleG_hRate < 0) g_angleG_hRate = -g_angleG_hRate;
  if(newAngleG_h > 180.0) newAngleG_h = newAngleG_h - 360.0;
  if(newAngleG_h <-180.0) newAngleG_h = newAngleG_h + 360.0;
  g_angleG_h = newAngleG_h

  if(g_balloon_angle01 >  30.0 && g_balloon_angle01Rate > 0) g_balloon_angle01Rate = -g_balloon_angle01Rate;
  	if(g_balloon_angle01 < -30.0 && g_balloon_angle01Rate < 0) g_balloon_angle01Rate = -g_balloon_angle01Rate;
	  g_balloon_angle01 = g_balloon_angle01 + (g_balloon_angle01Rate * elapsed) / 1000.0;
	  
	  var newAngle = g_balloon_angle02 + (g_balloon_angle02Rate * elapsed) / 1000.0;
	  if(newAngle > 180.0) newAngle = newAngle - 360.0;
	  if(newAngle <-180.0) newAngle = newAngle + 360.0;
	  g_balloon_angle02= newAngle;

	
	  var newdisplacement = g_balloon_xdistance + g_balloon_xdistancerate * elapsed / 1000.0;
	  if (newdisplacement > 0.8) g_balloon_xdistancerate = -g_balloon_xdistancerate;
	  if (newdisplacement < -0.8) g_balloon_xdistancerate = -g_balloon_xdistancerate;
	  g_balloon_xdistance = newdisplacement;
}

//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_balloon_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function r_colorSubmit() {
	// Called when user presses 'Submit' button on our webpage
	//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
	//	the HTML 'input' element with id='usrAngle'.  Within that
	//	element you'll find a 'button' element that calls this fcn.
	
	// Read HTML edit-box contents:
		var UsrTxt = document.getElementById('usrColor').value;	
	// Display what we read from the edit-box: use it to fill up
	// the HTML 'div' element with id='editBoxOut':
	  // document.getElementById('EditBoxOut2').innerHTML ='You Typed: '+UsrTxt;
	  console.log('colorSubmit: UsrTxt:', UsrTxt); // print in console, and
	  g_init_r= parseFloat(UsrTxt);     // convert string to float number 
	  console.log('g_init_r: ', g_init_r)
	};
function g_colorSubmit() {
		// Called when user presses 'Submit' button on our webpage
		//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
		//	the HTML 'input' element with id='usrAngle'.  Within that
		//	element you'll find a 'button' element that calls this fcn.
		
		// Read HTML edit-box contents:
			var UsrTxt = document.getElementById('usrColor2').value;	
		// Display what we read from the edit-box: use it to fill up
		// the HTML 'div' element with id='editBoxOut':
		  // document.getElementById('EditBoxOut3').innerHTML ='You Typed: '+UsrTxt;
		  console.log('colorSubmit: UsrTxt:', UsrTxt); // print in console, and
		  g_init_g= parseFloat(UsrTxt);     // convert string to float number 
		  console.log('g_init_g: ', g_init_g)
		};
function b_colorSubmit() {
	// Called when user presses 'Submit' button on our webpage
	//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
	//	the HTML 'input' element with id='usrAngle'.  Within that
	//	element you'll find a 'button' element that calls this fcn.
	
	// Read HTML edit-box contents:
		var UsrTxt = document.getElementById('usrColor3').value;	
	// Display what we read from the edit-box: use it to fill up
	// the HTML 'div' element with id='editBoxOut':
	  // document.getElementById('EditBoxOut4').innerHTML ='You Typed: '+UsrTxt;
	  console.log('colorSubmit: UsrTxt:', UsrTxt); // print in console, and
	  g_init_b= parseFloat(UsrTxt);     // convert string to float number 
	  console.log('g_init_b: ', g_init_b)
	};


function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
	g_init_r = 0.5;
	g_init_g = 0.5;
	g_init_b = 0.5;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_balloon_angle01Rate += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_balloon_angle01Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_balloon_angle01Rate*g_balloon_angle01Rate > 1) {  // if nonzero rate,
	myTmp = g_balloon_angle01Rate;  // store the current rate,
	Tmp2 = g_balloon_angle02Rate;
	g_balloon_angle01Rate = 0;      // and set to zero.
	g_balloon_angle02Rate = 0;
	X_tmp = g_balloon_xdistancerate;
	g_balloon_xdistancerate = 0;
  }
  else {    // but if rate is zero,
	  g_balloon_angle01Rate = myTmp;  // use the stored rate.
	  g_balloon_angle02Rate = Tmp2;
	  g_balloon_xdistancerate = X_tmp;
  }
//   if(g_angleG_h*g_angleG_hRate > 1) {  // if nonzero rate,
// 	myTmp_gh = g_angleG_hRate;  // store the current rate,
// 	Tmp2_gn = g_angleG_nRate;
// 	g_angleG_hRate = 0;      // and set to zero.
// 	g_angleG_nRate = 0;
//   }
//   else {    // but if rate is zero,
// 	  g_angleG_hRate = myTmp_gh;  // use the stored rate.
// 	  g_angleG_nRate = Tmp2_gn;
//   }

}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	// document.getElementById('MouseAtResult').innerHTML = 
	//   'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	// document.getElementById('MouseAtResult').innerHTML = 
	//   'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
	// document.getElementById('MouseDragResult').innerHTML = 
	//   'Mouse Drag: '+(x - g_xMclik).toFixed(5)+', '+(y - g_yMclik).toFixed(5);

	g_xMclik = x;													// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
	// document.getElementById('MouseAtResult').innerHTML = 
	//   'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
	// console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',g_xMdragTot,',\t',g_yMdragTot);
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:
// 	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
//   document.getElementById('KeyModResult' ).innerHTML = ''; 
//   // key details:
//   document.getElementById('KeyModResult' ).innerHTML = 
//         "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
//     "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
//     "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
 
	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;  
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			g_balloon_angle02Rate = 90.0;
			document.getElementById('KeyDownResult').innerHTML =  
			'\n ARMS ROTATION RATE: '+g_balloon_angle02Rate+' degrees/second';
			break;
    case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'';
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'';
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'';
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  			document.getElementById('KeyDownResult').innerHTML =
			  '\n ARMS ROTATION RATE: '+g_balloon_angle02Rate+' degrees/second';
			g_balloon_angle02Rate = g_balloon_angle02Rate - 15;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  			document.getElementById('KeyDownResult').innerHTML =
			  '\n ARMS ROTATION RATE: '+g_balloon_angle02Rate+' degrees/second';
			g_balloon_angle02Rate = g_balloon_angle02Rate + 15;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  			document.getElementById('KeyDownResult').innerHTML =
  			'';
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  			document.getElementById('KeyDownResult').innerHTML =
  			'';
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'';
      break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}