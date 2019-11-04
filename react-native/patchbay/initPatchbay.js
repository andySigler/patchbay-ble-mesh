var testingGUI = true;

var testingGUI_Nodes = [
	{
		'name':'Phone',
		'inputs':['Dial','Mic'],
		'outputs':['Bell']
	},
	{
		'name':'Biggie',
		'inputs':[],
		'outputs':['Nod','Position']
	},
	{
		'name':'Switch',
		'inputs':['State'],
		'outputs':[]
	},
	{
		'name':'Toy-Pony',
		'inputs':[],
		'outputs':['speed']
	},
	{
		'name':'Maraca',
		'inputs':['Intensity','Beat'],
		'outputs':[]
	},
	{
		'name':'Guitar',
		'inputs':['Volume','Speed','Pitch'],
		'outputs':[]
	},
	{
		'name':'Lamp',
		'inputs':[],
		'outputs':['Brightness','State']
	},
	{
		'name':'Boombox',
		'inputs':['Beat','Volume'],
		'outputs':['Volume','Song']
	},
	{
		'name':'Snare',
		'inputs':['Beat','Volume'],
		'outputs':['Volume']
	},
	{
		'name':'Monome',
		'inputs':['Pitch','State'],
		'outputs':[]
	},
	{
		'name':'Drawing-Bot',
		'inputs':[],
		'outputs':['Speed','Direction','Pen-Height']
	}
];

export function initPatchbay(canvas){
	// canvas.addEventListener('resize', adjustCanvas);
	setupCanvas(canvas);
	// setupWebsockets();
	if(testingGUI){
		makeTestingNodes();
	}
	adjustCanvas();
	drawLoop();
}

function makeTestingNodes(){
	// test nodes for playing with patchbay
	// create a new arc for the Tester
	var startingIndex = Math.floor(Math.random()*testingGUI_Nodes.length)%testingGUI_Nodes.length;
	for(var index=0;index<testingGUI_Nodes.length;index++){
		var i = (index+startingIndex)%testingGUI_Nodes.length;
		var rColorIndex = i % colorPalette.length;
		var color = colorPalette[rColorIndex];
	    outCircle.addArc(testingGUI_Nodes[i].name,color,i+2);
	    inCircle.addArc(testingGUI_Nodes[i].name,color,i+2);

	    var rOutputs =testingGUI_Nodes[i].outputs.length;
	    for(var o=0;o<rOutputs;o++){
	        outCircle.arcs[outCircle.arcs.length-1].addPort(o);
	        outCircle.arcs[outCircle.arcs.length-1].ports[o].name = testingGUI_Nodes[i].outputs[o];
	        outCircle.arcs[outCircle.arcs.length-1].paletteIndex = rColorIndex;
	    }

	    var rInputs = testingGUI_Nodes[i].inputs.length;
	    for(var o=0;o<rInputs;o++){
	        inCircle.arcs[inCircle.arcs.length-1].addPort(o);
	        inCircle.arcs[inCircle.arcs.length-1].ports[o].name = testingGUI_Nodes[i].inputs[o];
	        inCircle.arcs[inCircle.arcs.length-1].paletteIndex = rColorIndex;
	    }
	}

	for(var c=0;c<inCircle.arcs.length;c++){
		var inArc = c;
		if(inCircle.arcs[inArc].ports.length>0){
			for(var d=0;d<20;d++){
				var outArc = Math.floor(Math.random()*outCircle.arcs.length);
				if(outCircle.arcs[outArc].ports.length>0){
					var inPort = Math.floor(Math.random()*inCircle.arcs[inArc].ports.length);
					var outPort = Math.floor(Math.random()*outCircle.arcs[outArc].ports.length);
					sendRoute(outCircle.arcs[outArc].id,inCircle.arcs[inArc].id,inPort,outPort);
					console.log('port made');
				}
			}
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var host, ws;

function setupWebsockets(){
	// host = location.origin.replace(/^http/, 'ws');
	// if(!testingGUI) ws = new WebSocket(host);
	// else ws = {};
	// ws.onopen = function(){
	// 	console.log("WebSocket Connection made with "+host);
	// }

	// ws.onmessage = function(data){
	// 	var msg = JSON.parse(data.data);
	// 	if(!testingGUI){
	// 		wsHandlers[msg.type](msg.packet);
	// 	}
	// }
}

var receivedStuff;

var wsHandlers = {
	'clone': function(data){
		receivedStuff = data;
		updateNodes(data.nodes);
		updateConnections(data.connections,data.testerStuff);
	},
	'testerValue': function(data){
		tester.inputs[data.index].handleValue(data.value);
	}
};

function sendRoute(receiveID,senderID,inputIndex,outputIndex){
	var msg = {
		'type':'route',
		'data':{
			'receiveID':Number(receiveID),
			'senderID':Number(senderID),
			'inputIndex':Number(inputIndex),
			'outputIndex':Number(outputIndex)
		}
	};
	if(!testingGUI){
		ws.send(JSON.stringify(msg));
		console.log(msg);
	}
	else{
		testConnectionExistence(receiveID,senderID,inputIndex,outputIndex); // for while in GUI debugging
	}
}

function updateConnections(router,testerStuff){

	for(var c in allConnections){
		allConnections[c].exists = false;
	}

	for(var i in router){
		for(var n in router[i]){
			for(var b=0;b<router[i][n].length;b++){
				if(router[i][n][b]!=99 && router[i][n][b]!=""){
					var outputArcID = Number(i);
					var inputArcID = Number(n);
					if(inputArcID==0) inputArcID = outputArcID;
					var inIndex = Number(b);
					var outIndex = Number(router[i][n][b]);
					testConnectionExistence(outputArcID,inputArcID,inIndex,outIndex);
				}
			}
		}
	}

	for(var c in allConnections){
		if(!allConnections[c].exists){
			delete allConnections[c];
		}
	}
}

function testConnectionExistence(outputID,inputID,inputIndex,outputIndex){
	var tempName = Number(outputID)+'/'+Number(inputID)+'__'+Number(inputIndex)+'/'+Number(outputIndex);
	if(!allConnections[tempName]){
		var outPort = undefined;
		var inPort = undefined;
		for(var h=0;h<outCircle.arcs.length;h++){
			if(outCircle.arcs[h].id==outputID){
				outPort = outCircle.arcs[h].ports[outputIndex];
			}
			if(inCircle.arcs[h].id==inputID){
				inPort = inCircle.arcs[h].ports[inputIndex];
			}
			if(outPort && inPort){
				allConnections[tempName] = new Cord(context,outPort,inPort,tempName);
				break;
			}
		}
	}
	else{
		allConnections[tempName].exists = true;
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////


////////////////////////////////////
////////////////////////////////////

var canvas,context;
var theWidth,theHeight,usedSize,middleX,middleY;

var outCircle, inCircle;
var mouse;

var touchedPort = undefined;
var hoveredPort = undefined;

var allConnections = {};

var colorPalette = [
	{
		'r':30,
		'g':147,
		'b':175
	},
	{
		'r':176,
		'g':176,
		'b':176
	},
	{
		'r':252,
		'g':120,
		'b':43
	},
	{
		'r':176,
		'g':176,
		'b':79
	},
	{
		'r':43,
		'g':211,
		'b':252
	},
	{
		'r':176,
		'g':79,
		'b':176
	},
	{
		'r':176,
		'g':79,
		'b':79
	}
];

function setupCanvas(c){
	canvas = c
	context = canvas.getContext('2d');
	setupTouch();
	makeCircles();
	adjustCanvas();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function setupTouch() {
	mouse = new Mouse();

  function getPos(e){
  	var x = e.gesture.center.pageX-canvas.andyX;
		var y = e.gesture.center.pageY-canvas.andyY;
		return {'x':x,'y':y};
  }

	// hammerTime.on('touch',function(event){
	// 	event.gesture.preventDefault();
	// 	var pos = getPos(event);
	// 	mouse.dragEvent(pos.x,pos.y,true);
	// 	mouse.touchEvent();
	// });
	// var didTap = false;
	// hammerTime.on('tap',function(event){
	// 	event.gesture.preventDefault();
	// 	didTap = true;
	// });
	// hammerTime.on('release',function(event){
	// 	event.gesture.preventDefault();
	// 	var pos = getPos(event);

	// 	if(didTap) mouse.tapEvent(pos.x,pos.y);

	// 	else mouse.releaseEvent(pos.x,pos.y);

	// 	if(hoveredPort){
	// 		hoveredPort.hovereed = false;
	// 		hoveredPort = undefined;
	// 	}
	// 	didTap = false;
	// });
	// hammerTime.on('dragleft dragright dragup dragdown swipeleft swiperight swipeup swipedown',function(event){
	// 	event.gesture.preventDefault();
	// 	var pos = getPos(event);
	// 	mouse.dragEvent(pos.x,pos.y,false);
	// });
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function drawLoop(){

	mouse.update();

	outCircle.update(usedSize);
	inCircle.update(usedSize);

	for(var i in allConnections){
		allConnections[i].update();
	}

	context.clearRect(0,0,canvas.width,canvas.height);
	context.save();

	outCircle.drawArcs();
	inCircle.drawArcs();

	outCircle.drawNames();
	inCircle.drawNames();

	outCircle.drawPorts();
	inCircle.drawPorts();

	for(var i in allConnections){
		allConnections[i].draw();
	}

	if(touchedPort) drawTouchedPort();
	if(hoveredPort) drawHoveredPort();

	context.restore();

	requestAnimationFrame(drawLoop);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function drawCircleLabels(){
	context.save();

	context.font = '30px Helvetica';
	context.fillStyle = 'black';
	context.textAlign = 'center';
	context.fillText('inputs',0,-inCircle.radiusPercentage*usedSize*.6);

	context.font = '30px Helvetica';
	context.fillStyle = 'black';
	context.textAlign = 'center';
	context.fillText('outputs',0,outCircle.radiusPercentage*usedSize*.85);

	context.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function drawTouchedPort(){

	// first draw the dot
	var scaler = touchedPort.scaler;
	scaler*=1.25;
	if(scaler>1) scaler = 1;
	else if(scaler<0) scaler = 0;

	// then draw the outlining circle
	var tempSize = touchedPort.size;

	context.save();
	context.lineWidth = tempSize*.1;
	context.strokeStyle = 'white';
	context.beginPath();
	context.arc(touchedPort.x,touchedPort.y,tempSize,0,Math.PI*2,false);
	context.stroke();
	context.restore();

	// then draw the line
	context.save();

	context.lineWidth = (Math.sin(touchedPort.wobbleCounter)*2)+Math.max(touchedPort.size*.05,2);
	context.strokeStyle = 'rgb(100,255,100)';

	context.beginPath();
	context.moveTo(touchedPort.x,touchedPort.y);
	context.lineTo(mouse.x,mouse.y);

	context.stroke();
	context.restore();

	context.save();

	context.fillStyle = 'white';
	var tempSize = touchedPort.size*scaler*.3;

	context.beginPath();
	context.arc(touchedPort.x,touchedPort.y,tempSize*.33,0,Math.PI*2,false);

	context.fill();
	context.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function drawHoveredPort(){
	var scaler = hoveredPort.scaler;
	scaler*=1.25;
	if(scaler>1) scaler = 1;
	else if(scaler<0) scaler = 0;

	var tempSize = hoveredPort.size;

	context.save();
	context.lineWidth = tempSize*.1;
	context.strokeStyle = 'rgb(100,255,100)';
	context.beginPath();
	context.arc(hoveredPort.x,hoveredPort.y,tempSize,0,Math.PI*2,false);
	context.stroke();
	context.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function makeCircles(){
	var tempThickness = .1;

	var screenPercentage = 0.25;

	outCircle = new Circle(context,'out',screenPercentage,tempThickness);
	inCircle = new Circle(context,'in',screenPercentage,tempThickness);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function updateNodes(nodes){
	for(var n in nodes){
		nodes[n].represented = false;
	}
	for(var i=0;i<outCircle.arcs.length;i++){
		if(outCircle.arcs[i].id>0){
			var stillReal = false;
			for(var n in nodes){
				if(nodes[n].id===outCircle.arcs[i].id){
					var stillReal = true;
					nodes[n].represented = true;
					// it already exists, so just update it's info
					outCircle.arcs[i].handleMeta(nodes[n]);
					inCircle.arcs[i].handleMeta(nodes[n]);
					break;
				}
			}
			if(!stillReal){
				// make sure there are no more connections from/to it
				eraseNodeFromConnections(outCircle.arcs[i].id);

				// then erase this arc from the circles
				outCircle.deleteArc(outCircle.arcs[i].id);
				inCircle.deleteArc(inCircle.arcs[i].id);
			}
		}
	}
	for(var n in nodes){
		if(!nodes[n].represented){
			var test = false;
			for(var i=0;i<outCircle.arcs.length;i++){
				if(outCircle.arcs[i].id===nodes[n].id){
					test = true;
				}
			}
			if(!test){
				var rColorIndex = nodes[n].id%colorPalette.length;
				var color = colorPalette[rColorIndex];
				// create a new arc for this node
				outCircle.addArc(nodes[n].name,color,nodes[n].id);
				inCircle.addArc(nodes[n].name,color,nodes[n].id);
			}
		}
	}
}

function eraseNodeFromConnections(id){
	for(var n in allConnections){
		var portIDs = n.split('__')[0].split('/');
		if(portIDs[0]==id || portIDs[1]==id){
			delete allConnections[n];
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var counter = 0;

function adjustCanvas(){
	if(outCircle && inCircle){

		// if(window.innerWidth<500){
		// 	document.getElementById('container').className = 'minScaler';
		// }
		// else if(window.innerWidth>950){
		// 	document.getElementById('container').className = 'maxScaler';
		// }
		// else{
		// 	document.getElementById('container').className = 'middleScaler';
		// }

		theWidth = canvas.width;
		//theHeight = canvas.parentNode.offsetHeight;
		theHeight = Math.floor(theWidth*(925/1200))*.97;

		// console.log(canvas.parentNode.offsetHeight);

		// if(theHeight>canvas.parentNode.offsetHeight) {
		// 	var multiplier = canvas.parentNode.offsetHeight / theHeight;
		// 	theHeight *= multiplier;
		// 	theWidth *= multiplier;
		// }

		canvas.width = theWidth;
		canvas.height = theHeight;
		// canvas.style.width = theWidth+'px';
		// canvas.style.height = theHeight+'px';

		middleX = Math.floor(theWidth/2);
		middleY = Math.floor(theHeight/2);

		usedSize = Math.min(theWidth,theHeight*1.2) * .9;

		if(theWidth<theHeight){
			var Xoffset = theWidth*.2;
			var Yoffset = theHeight*0.2;
			inCircle.centerX = middleX-Xoffset;
			outCircle.centerX = middleX+Xoffset;
			inCircle.centerY = middleY-Yoffset;
			outCircle.centerY = middleY+Yoffset;
		}
		else{
			var Xoffset = usedSize*.3;
			var Yoffset = theHeight*0.1;
			inCircle.centerX = middleX-Xoffset;
			outCircle.centerX = middleX+Xoffset;
			inCircle.centerY = middleY-Yoffset;
			outCircle.centerY = middleY+Yoffset;
		}
	}

	function findPos(obj) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
			while (obj = obj.offsetParent);
			return [curleft,curtop];
		}
	}
	// var canPos = findPos(canvas);
	// canvas.andyX = canPos[0];
	// canvas.andyY = canPos[1];

	// var title = document.getElementById('patchbayTitle');
	// var title = undefined;
	// if(title) {
	// 	title.style.left = Math.floor(outCircle.centerX-(usedSize*.15))+'px';
	// 	title.style.fontSize = Math.floor(usedSize*.15)+'px';
	// }

	// canvas.parentNode.style.height = canvas.height+'px';
}

window.onresize = adjustCanvas;

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Mouse() {
	this.x = undefined;
	this.y = undefined;
	this.xDiff = undefined;
	this.yDiff = undefined;
	this.down = false;
	this.in_radianDiff = undefined;
	this.in_radianPrev = undefined;
	this.in_radianNew = undefined;
	this.out_radianDiff = undefined;
	this.out_radianPrev = undefined;
	this.out_radianNew = undefined;
	this.topSide = false;

	this.justErased = false;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.touchEvent = function(){

	this.down = true;

	this.xDiff = 0;
	this.yDiff = 0;

	var test = false;

	for(var i in allConnections){
		if(allConnections[i].hovered){
			var xDiff = this.x-allConnections[i].deleteX;
			var yDiff = this.y-allConnections[i].deleteY;
			var tempDist = Math.sqrt(xDiff*xDiff+yDiff*yDiff);
			if(tempDist<allConnections[i].deleteSize){
				var receiveID = allConnections[i].outPort.parent.id;
				var routeID = allConnections[i].inPort.parent.id;
				var inportIndex = allConnections[i].inPort.index;
				sendRoute(receiveID,routeID,inportIndex,99);
				this.justErased = true;
				if(testingGUI) delete allConnections[i];
				test = true;
				break;
			}
		}
	}

	if(!test){
		var in_xDist = Math.abs(inCircle.centerX-this.x);
		var in_yDist = Math.abs(inCircle.centerY-this.y);
		var out_xDist = Math.abs(outCircle.centerX-this.x);
		var out_yDist = Math.abs(outCircle.centerY-this.y);

		var in_distFromCenter = Math.sqrt(in_xDist*in_xDist+in_yDist*in_yDist);
		var out_distFromCenter = Math.sqrt(out_xDist*out_xDist+out_yDist*out_yDist);
		var outOuterRad = (outCircle.radiusPercentage*usedSize)+(outCircle.lineWidth*.4);
		var outInnerRad = (outCircle.radiusPercentage*usedSize)-(outCircle.lineWidth*.4);
		var inOuterRad = (inCircle.radiusPercentage*usedSize)+(inCircle.lineWidth*.4);
		var inInnerRad = (inCircle.radiusPercentage*usedSize)-(inCircle.lineWidth*.4);

		if(out_distFromCenter<=outOuterRad && out_distFromCenter>=outInnerRad){
			outCircle.mouseEvent(this.x,this.y);
		}
		else if(in_distFromCenter<=inOuterRad && in_distFromCenter>=inInnerRad){
			inCircle.mouseEvent(this.x,this.y);
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.tapEvent = function(_x,_y){
	if(inCircle.touched){
		for(var i=0;i<inCircle.arcs.length;i++){
			if(inCircle.arcs[i].touched){
				inCircle.startAutoMove(i);
			}
		}
	}
	else if(outCircle.touched){
		for(var i=0;i<outCircle.arcs.length;i++){
			if(outCircle.arcs[i].touched){
				outCircle.startAutoMove(i);
			}
		}
	}

	if(this.x&&this.y){
		this.xDiff = _x-this.x;
		this.yDiff = _y-this.y;
	}
	this.x = _x;
	this.y = _y;
	this.down = false;
	this.radianDown = undefined;
	this.radianDiff = undefined;

	if(touchedPort || this.justErased){
		if(touchedPort && touchedPort.type==='in'){
			for(var n in allConnections){
				if(allConnections[n].inPort===touchedPort){
					allConnections[n].hovered = true;
				}
				else{
					allConnections[n].hovered = false;
				}
			}
		}
		else if(touchedPort){
			for(var n in allConnections){
				if(allConnections[n].outPort===touchedPort){
					allConnections[n].hovered = true;
				}
				else{
					allConnections[n].hovered = false;
				}
			}
		}
		this.justErased = false;
	}
	else{
		for(var n in allConnections){
			allConnections[n].hovered = false;
		}
	}

	touchedPort = undefined;
	hoveredPort = undefined;

	outCircle.touched = false;
	for(var i=0;i<outCircle.arcs.length;i++){
		outCircle.arcs[i].touched = false;
		for(var n=0;n<outCircle.arcs[i].ports.length;n++){
			outCircle.arcs[i].ports[n].touched = false;
			outCircle.arcs[i].ports[n].hovered = false;
		}
	}

	inCircle.touched = false;
	for(var i=0;i<inCircle.arcs.length;i++){
		inCircle.arcs[i].touched = false;
		for(var n=0;n<inCircle.arcs[i].ports.length;n++){
			inCircle.arcs[i].ports[n].touched = false;
			inCircle.arcs[i].ports[n].hovered = false;
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.releaseEvent = function(_x,_y){
	if(this.x&&this.y){
		this.xDiff = _x-this.x;
		this.yDiff = _y-this.y;
	}
	this.x = _x;
	this.y = _y;
	this.down = false;
	this.radianDown = undefined;
	this.radianDiff = undefined;

	if(touchedPort && hoveredPort && hoveredPort!=touchedPort){
		this.makeConnection(hoveredPort,touchedPort);
	}

	touchedPort = undefined;
	hoveredPort = undefined;

	for(var n in allConnections){
		allConnections[n].hovered = false;
	}

	outCircle.touched = false;
	for(var i=0;i<outCircle.arcs.length;i++){
		outCircle.arcs[i].touched = false;
		for(var n=0;n<outCircle.arcs[i].ports.length;n++){
			outCircle.arcs[i].ports[n].touched = false;
			outCircle.arcs[i].ports[n].hovered = false;
		}
	}

	inCircle.touched = false;
	for(var i=0;i<inCircle.arcs.length;i++){
		inCircle.arcs[i].touched = false;
		for(var n=0;n<inCircle.arcs[i].ports.length;n++){
			inCircle.arcs[i].ports[n].touched = false;
			inCircle.arcs[i].ports[n].hovered = false;
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.makeConnection = function(port1,port2){
	var inPort,outPort;

	if(port1.type==='in'){
		inPort = port1;
		outPort = port2;
	}
	else{
		inPort = port2;
		outPort = port1;
	}

	// var tempName = outputArcID+'-'+inputArcID+'__'+outIndex+'-'+inIndex;
	var tempName = String(outPort.parent.id+'/'+inPort.parent.id+'__'+inPort.index+'/'+outPort.index);

	if(!allConnections[tempName]){
		var receiverID = outPort.parent.id;
		var senderID = inPort.parent.id;
		sendRoute(receiverID,senderID,inPort.index,outPort.index);
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.dragEvent = function(_x,_y,initRadians){
	if(this.x&&this.y){
		this.xDiff = _x-this.x;
		this.yDiff = _y-this.y;
	}
	this.x = _x;
	this.y = _y;

	if(this.y>middleY) this.topSide = true;
	else this.topSide = false;

	if(!initRadians){
		this.in_radianPrev = this.in_radianNew;
		this.out_radianPrev = this.out_radianNew;
	}
	this.in_radianNew = this.radiansFromCenter(this.x,this.y,'in');
	this.out_radianNew = this.radiansFromCenter(this.x,this.y,'out');
	if(initRadians){
		this.in_radianPrev = this.in_radianNew;
		this.out_radianPrev = this.out_radianNew;
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.update = function(){
	var blockSpeed = 0.002;
	if(this.down || touchedPort) this.findHover();

	if(this.down && outCircle.arcs.length>1){
		var in_radianDiff = this.in_radianNew-this.in_radianPrev;
		var out_radianDiff = this.out_radianNew-this.out_radianPrev;

		if(outCircle.touched){
			outCircle.radiansMoved = out_radianDiff;
		}
		else if(inCircle.touched){
			inCircle.radiansMoved = in_radianDiff;
		}
	}

	this.xDiff = 0;
	this.yDiff = 0;

	this.in_radianPrev = this.in_radianNew;
	this.out_radianPrev = this.out_radianNew;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.findHover = function(){

	if(hoveredPort) hoveredPort.hovered = false;

	hoveredPort = undefined;

	if(!outCircle.touched && !inCircle.touched){

		if(outCircle.arcs.length>0 && ((touchedPort&&touchedPort.type=='in')||!touchedPort)){
			for(var i=0;i<2;i++){
				if(!hoveredPort && outCircle.highlighted[String(i)]){
					var index = (i+outCircle.arcOffset)%outCircle.arcs.length;
					var len = outCircle.arcs[index].ports.length;
					for(var n=0;n<len;n++){
						var xDiff = outCircle.arcs[index].ports[n].x-mouse.x;
						var yDiff = outCircle.arcs[index].ports[n].y-mouse.y;
						var absDiff = Math.sqrt(xDiff*xDiff+yDiff*yDiff);
						if(absDiff<outCircle.arcs[index].ports[n].size*.75){
							hoveredPort = outCircle.arcs[index].ports[n];
							outCircle.arcs[index].ports[n].hovered = true;
							break;
						}
						else{
							outCircle.arcs[index].ports[n].hovered = false;
						}
					}
				}
			}
		}
		if(!hoveredPort && inCircle.arcs.length>0 && ((touchedPort&&touchedPort.type=='out')||!touchedPort)){
			//loop through inner seen ports
			for(var i=0;i<2;i++){
				if(!hoveredPort && inCircle.highlighted[String(i)]){
					var index = (i+inCircle.arcOffset)%inCircle.arcs.length;
					var len = inCircle.arcs[index].ports.length;
					for(var n=0;n<len;n++){
						var xDiff = inCircle.arcs[index].ports[n].x-mouse.x;
						var yDiff = inCircle.arcs[index].ports[n].y-mouse.y;
						var absDiff = Math.sqrt(xDiff*xDiff+yDiff*yDiff);
						if(absDiff<inCircle.arcs[index].ports[n].size/2){
							hoveredPort = inCircle.arcs[index].ports[n];
							inCircle.arcs[index].ports[n].hovered = true;
							break;
						}
						else{
							inCircle.arcs[index].ports[n].hovered = false;
						}
					}
				}
			}
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Mouse.prototype.radiansFromCenter = function(x,y,which){
	var radFromCenter;

	var _middleX = outCircle.centerX;
	var _middleY = outCircle.centerY;
	if(which==='in'){
		_middleX = inCircle.centerX;
		_middleY = inCircle.centerY;
	}

	var yDist = Math.abs(_middleY-y);
	var xDist = Math.abs(_middleX-x);

	if(x>_middleX){
		if(y>_middleY){
			// bottom right
			radFromCenter = Math.atan(yDist/xDist);
		}
		else if(y<_middleY){
			// top right
			radFromCenter = Math.atan(xDist/yDist) + (Math.PI*1.5);
		}
		else{
			// we're touching the y line
			radFromCenter = 0;
		}
	}
	else if(x<_middleX){
		if(y>_middleY){
			// bottom left
			radFromCenter = Math.atan(xDist/yDist) + (Math.PI*.5);
		}
		else if(y<_middleY){
			// top left
			radFromCenter = Math.atan(yDist/xDist) + Math.PI;
		}
		else{
			// we're touching the y line
			radFromCenter = Math.PI;
		}
	}
	else{
		//we're touching the x line
		if(y>_middleY){
			radFromCenter = Math.PI*.5;
		}
		else if(y<_middleY){
			radFromCenter = Math.PI*1.5;
		}
		else{
			// we're touching the middle
			radFromCenter = 0;
		}
	}

	return radFromCenter;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Circle(_ctx,_type,scale,thickness){
	this.radiusPercentage = scale;
	this.relativeLineWidth = thickness;
	this.lineWidth;

	this.arcOffset = 0;
	this.targetOffset = 0;
	this.isAutoMoving = false;
	this.autoStepTotal = 20;
	this.autoStepCount = 0;
	this.autoStepSize = 0;
	this.targetArc = 0;

	this.highlighted = {
		0:true,
		1:false
	};

	this.animPercent = 0;
	this.animDirection = -1;

	this.touched = false;

	this.ctx = _ctx;

	this.type = _type;

	this.arcs = [];

	this.arcEndPoints = [];

	this.radiansMoved = 0;
	this.rotateFeedback = .85;

	this.padding = Math.PI/100;
	if(this.type==='out') this.padding*=.5;
	this.lineWidth;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.update = function(screenSize){

	if(this.isAutoMoving) this.updateAutoMoving();
	else this.rotateDrag();

	var totalArcs = this.arcs.length;
	if(totalArcs>0 && this.arcOffset<totalArcs){
		this.lineWidth = Math.floor(this.relativeLineWidth*screenSize);

		var points = this.transpose(0);
		this.arcs[this.arcOffset].update(points[0],points[1],this.radiusPercentage*screenSize,this.lineWidth,this.padding,this.highlighted[0]);

		var smallerWidth = Math.PI/(totalArcs-1);
		for(var i=1;i<totalArcs;i++){
			var index = (i+this.arcOffset)%totalArcs;
			var points = this.transpose(i);
			this.arcs[index].update(points[0],points[1],this.radiusPercentage*screenSize,this.lineWidth,this.padding,this.highlighted[i]);
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.drawArcs = function(){
	if(this.arcs.length>0){
		this.ctx.save();
		this.ctx.translate(this.centerX,this.centerY);

		var tempScaler = Math.floor(usedSize*.025);
		var fontSize = tempScaler;
		this.ctx.font = fontSize+'px Helvetica';
		this.ctx.textAlign = 'center';
		var labelOffsetY = tempScaler*2;
		if(this.type=='in') labelOffsetY *= -1;
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(this.type.toUpperCase(),0,labelOffsetY);

		tempScaler = Math.floor(usedSize*.05);
		fontSize = tempScaler;
		this.ctx.font = fontSize+'px Helvetica';

		// then draw the currently displayed arc's name
		var xOffsetScaler = 0.05;

		var arc_0 = this.arcs[this.arcOffset];
		tempScaler = Math.floor(usedSize*.04);
		fontSize = tempScaler*arc_0.scaler;
		this.ctx.font = fontSize+'px Helvetica';
		var name_0 = arc_0.name;
		var opacity = arc_0.scaler;
		if(opacity>1) opacity = 1;
		this.ctx.fillStyle = 'rgba('+arc_0.c.r+','+arc_0.c.g+','+arc_0.c.b+','+opacity+')';
		var xOffset_0;
		if(arc_0.type=='in'){
			xOffset_0 = (this.lineWidth*tempScaler*xOffsetScaler)*this.animPercent;
		}
		else{
			xOffset_0 = (-this.lineWidth*tempScaler*xOffsetScaler)*this.animPercent;
		}
		this.ctx.fillText(name_0,xOffset_0*1.5,0);

		var nextIndex = (this.arcOffset+1)%this.arcs.length;
		var arc_1 = this.arcs[nextIndex]
		var name_1 = arc_1.name;
		opacity = arc_1.scaler;
		if(opacity>1) opacity = 1;
		this.ctx.fillStyle = 'rgba('+arc_1.c.r+','+arc_1.c.g+','+arc_1.c.b+','+opacity+')';
		var xOffset_1;
		if(arc_1.type=='in'){
			xOffset_1 = (-this.lineWidth*tempScaler*xOffsetScaler)*(1-this.animPercent);
		}
		else{
			xOffset_1 = (this.lineWidth*tempScaler*xOffsetScaler)*(1-this.animPercent);
		}
		fontSize = tempScaler*arc_1.scaler;
		this.ctx.font = fontSize+'px Helvetica';
		this.ctx.fillText(name_1,xOffset_1*1.5,0);


		var totalArcs = this.arcs.length;
		var shouldDrawGrey = true;
		if(totalArcs>20) shouldDrawGrey = false;
		for(var i=0;i<totalArcs;i++){
			this.arcs[i].drawArc(this.lineWidth,shouldDrawGrey);
		}

		this.ctx.restore();
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.drawNames = function(){
	this.ctx.save();
	this.ctx.translate(this.centerX,this.centerY);
	if(!touchedPort || (touchedPort&&touchedPort.type!=this.type)){
		var totalArcs = this.arcs.length;

		for(var i=0;i<totalArcs;i++){
			if(this.arcs[i].isSelected){
				this.arcs[i].drawName(this.lineWidth);
			}
		}
	}
	else{
		this.ctx.save();
		this.ctx.rotate(touchedPort.parent.start+(touchedPort.parent.rotStep/2));
		this.ctx.rotate(touchedPort.parent.rotStep*touchedPort.index);
		touchedPort.drawName(this.lineWidth);
		this.ctx.restore();
	}
	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.drawPorts = function(){
	this.ctx.save();
	this.ctx.translate(this.centerX,this.centerY);

	var totalArcs = this.arcs.length;

	for(var i=0;i<totalArcs;i++){
		if(this.arcs[i].isSelected){
			var scaler = this.animPercent;
			if(this.arcOffset===i){
				scaler = 1-scaler;
			}
			if(!touchedPort){
				this.arcs[i].drawPorts(scaler);
			}
			else if(touchedPort.parent===this.arcs[i] || touchedPort.parent.type!=this.type){
				this.arcs[i].drawPorts(scaler);
			}
		}
	}

	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.startAutoMove = function(newOffset){
	this.targetOffset = newOffset;
	this.isAutoMoving = true;

	var moveUp = newOffset - (this.arcOffset+this.arcs.length);
	var moveDown = newOffset - this.arcOffset;

	var amountToMove = moveUp-this.animPercent;
	if(Math.abs(moveUp)>Math.abs(moveDown)){
		if(Math.abs(moveDown)>this.arcs.length/2){
			amountToMove = moveDown+this.arcs.length+this.animPercent;
		}
		else if(moveDown===0){
			amountToMove = (moveDown-this.animPercent)%this.arcs.length;
		}
		else{
			amountToMove = (moveDown+this.animPercent)%this.arcs.length;
		}
	}

	this.autoStepSize = amountToMove/this.autoStepTotal;
	this.autoStepCount = 0;

	// if(this.arcs[this.arcOffset]) this.arcs[this.arcOffset].scaler = 0;
	// this.arcOffset = newOffset;
	// this.animPercent = 0;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.updateAutoMoving = function(){
	if(this.autoStepCount<this.autoStepTotal){
		this.animPercent += this.autoStepSize;
		this.autoStepCount++;
		if(this.animPercent>=1){
			this.arcOffset-=this.animDirection;
			if(this.arcOffset>=this.arcs.length) this.arcOffset = 0;
			else if(this.arcOffset<0) this.arcOffset = this.arcs.length-1;
			this.animPercent = 0;
		}

		else if(this.animPercent<0){
			this.arcOffset+=this.animDirection;
			if(this.arcOffset>=this.arcs.length) this.arcOffset = 0;
			else if(this.arcOffset<0) this.arcOffset = this.arcs.length-1;
			this.animPercent = 1+this.animPercent;
		}
	}
	else{
		this.isAutoMoving = false;
		this.arcOffset = this.targetOffset;
		this.animPercent = 0;
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.transpose = function(i){

	var realStart = this.arcEndPoints[i].start;
	var realEnd = this.arcEndPoints[i].end;

	var target = i+this.animDirection;
	if(target<0) target = this.arcs.length+target;
	else if(target>=this.arcs.length) target = target%this.arcs.length;

	var destStart = this.arcEndPoints[target].start;
	var destEnd = this.arcEndPoints[target].end;

	var startDiff = (destStart-realStart);
	var endDiff = (destEnd-realEnd);

	if(i===0 && this.animDirection===1){
		startDiff = startDiff*-1;
		endDiff = endDiff+(Math.PI*2);
	}
	else if(i===1 && this.animDirection===-1){
		startDiff = startDiff*-1;
		endDiff = (Math.PI*-2)+endDiff;
	}

	var currentStart = (startDiff*this.animPercent)+realStart;
	var currentEnd = (endDiff*this.animPercent)+realEnd;

	if(currentStart>Math.PI*2) currentStart = currentStart%(Math.PI*2);
	else if(currentStart<0) currentStart+=(Math.PI*2);
	if(currentEnd>Math.PI*2) currentEnd = currentEnd%(Math.PI*2);
	else if(currentEnd<0) currentEnd+=(Math.PI*2);

	var highlightCuttoff = 1/50;
	if(this.animPercent>=0 && this.animPercent<highlightCuttoff){
		this.highlighted = {
			0:true,
			1:false
		};
	}
	else if(this.animPercent>=highlightCuttoff && this.animPercent<.5){
		this.highlighted = {
			0:true,
			1:true
		};
	}
	else if(this.animPercent>=.5 && this.animPercent<1-highlightCuttoff){
		this.highlighted = {
			0:true,
			1:true
		};
	}
	else if(this.animPercent>=1-highlightCuttoff && this.animPercent<1){
		this.highlighted = {
			0:false,
			1:true
		};
	}

	return [currentStart,currentEnd];
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.mouseEvent = function(mouseX,mouseY){

	var portTouched = false;

	for(var i in this.highlighted){
		i = Number(i);
		if(this.highlighted[i]){
			var arcIndex = (i+this.arcOffset)%this.arcs.length;
			var scaler = this.animPercent*1.25;
			if(i==0) scaler = 1-scaler;
			//scaler = 1;
			if(this.arcs[arcIndex].isTouchingPort(mouseX,mouseY,scaler)){
				this.touched = false;
				portTouched = true;
			}
		}
	}
	if(!portTouched){
		this.touched = true;
		// see wich arc was touched
		for(var n=0;n<this.arcs.length;n++){
			var compRad = this.type=='in' ? mouse.in_radianNew : mouse.out_radianNew;
			if(n==this.arcOffset && this.type=='in'){
				compRad += (Math.PI*2);
			}
			if(compRad>this.arcs[n].start&&compRad<this.arcs[n].end){
				this.arcs[n].touched = true;
				break;
			}
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.rotateDrag = function(){

	if(this.radiansMoved>Math.PI/2) this.radiansMoved = (Math.PI-(this.radiansMoved%Math.PI))*-1;
	if(this.radiansMoved<-Math.PI/2) this.radiansMoved = (Math.PI-(Math.abs(this.radiansMoved)%Math.PI));

	if(!this.touched){
		this.radiansMoved *= this.rotateFeedback;
	}

	var relativeMovement = this.radiansMoved/(Math.PI*2);
	if(relativeMovement>.5) relativeMovement = 1-(relativeMovement%1);
	else if(relativeMovement<-.5) relativeMovement = 1+(relativeMovement%1);

	if(relativeMovement&&relativeMovement<1&&relativeMovement>-1){

		if(Math.abs(relativeMovement)<0) this.direction = -1;
		else this.direction = 1;

		var animStep = relativeMovement / (1/this.arcs.length);
		this.animPercent-=animStep;

		if(this.animPercent>=1){
			this.arcOffset-=this.animDirection;
			if(this.arcOffset>=this.arcs.length) this.arcOffset = 0;
			else if(this.arcOffset<0) this.arcOffset = this.arcs.length-1;
			this.animPercent = 0;
		}

		else if(this.animPercent<0){
			this.arcOffset+=this.animDirection;
			if(this.arcOffset>=this.arcs.length) this.arcOffset = 0;
			else if(this.arcOffset<0) this.arcOffset = this.arcs.length-1;
			this.animPercent = 1+this.animPercent;
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.addArc = function(name,color,id){
	var tempArc = new Arc(this.ctx,this,this.type,color,name,id,this.arcs.length);
	this.arcs.push(tempArc);
	this.updateDimensionStuff();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.deleteArc = function(id){
	for(var i=0;i<this.arcs.length;i++){
		if(this.arcs[i].id===id){
			this.arcs.splice(i,1);
			break;
		}
	}
	if(this.arcOffset>=this.arcs.length && this.arcOffset>0) this.arcOffset = this.arcs.length-1;
	this.updateDimensionStuff();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Circle.prototype.updateDimensionStuff = function(){
	this.arcEndPoints = [];

	if(this.arcs.length===1){
		this.arcEndPoints = [
			{
				'start':Math.PI/2,
				'end':Math.PI/2
			}
		];
	}
	else if(this.arcs.length===2){
		this.arcEndPoints = [
			{
				'start':Math.PI,
				'end':Math.PI*2
			},
			{
				'start':0,
				'end':Math.PI
			},
		];
	}
	else{
		this.arcEndPoints[0] = {
			'start':Math.PI,
			'end':Math.PI*2
		};
		var smallerWidth = Math.PI/(this.arcs.length-1);
		for(var i=1;i<this.arcs.length;i++){
			this.arcEndPoints[i] = {
				'start':(i-1)*smallerWidth,
				'end':i*smallerWidth
			};
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Arc(_ctx,_parent,_type,_color,_name,_id,_index){
	this.focused = false;

	this.ctx = _ctx;

	this.type = _type;
	this.parent = _parent;
	this.c = _color;

	this.index = _index;

	this.name = _name;
	this.id = _id;

	this.touched = false;

	this.start;
	this.end;
	this.radius;
	this.portSize;

	this.ports = [];

	this.test = true;

	this.scaler = 0;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.addPort = function(index){
	var tempPort = new Port(this.ctx,this,this.type,index);
	this.ports.push(tempPort);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.handleMeta = function(data){
	if(this.ports.length==0){
		for(var i=0;i<Number(data.totalPorts[this.type]);i++){
			this.addPort(i);
		}
	}
	else if(this.test){
		for(var i in data.ports[this.type]){
			for(var p=0;p<this.ports.length;p++){
				if(data.ports[this.type][i] && this.ports[p].index==data.ports[this.type][i].index){
					this.ports[p].name = data.ports[this.type][i].name;
					break;
				}
			}
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.update = function(start,end,radius,portSize,padding,isSelected){

	this.start = start + padding;
	this.end = end - padding;

	if(this.parent.type==='out'){
		if(theWidth<theHeight){
			this.start = (this.start+(Math.PI*1.75))%(Math.PI*2);
			this.end = (this.end+(Math.PI*1.75))%(Math.PI*2);
		}
		else{
			this.start = (this.start+(Math.PI*.25))%(Math.PI*2);
			this.end = (this.end+(Math.PI*.25))%(Math.PI*2);
		}
	}
	else{
		if(theWidth<theHeight){
			this.start = (this.start+(Math.PI*.75))%(Math.PI*2);
			this.end = (this.end+(Math.PI*.75))%(Math.PI*2);
		}
		else{
			this.start = (this.start+(Math.PI*1.25))%(Math.PI*2);
			this.end = (this.end+(Math.PI*1.25))%(Math.PI*2);
		}
	}
	if(theHeight<theWidth){
		this.start = (this.start+Math.PI*1.5)%(Math.PI*2);
		this.end = (this.end+Math.PI*1.5)%(Math.PI*2);
	}

	this.radius = radius;
	this.portSize = portSize;
	this.isSelected = isSelected;

	if(this.end<this.start) this.end+=Math.PI*2;

	if(this.isSelected){
		this.updatePorts();
	}
	else{
		for(var i=0;i<this.ports.length;i++){
			if(this.ports[i]){
				this.ports[i].visible = false;
			}
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.drawArc = function(parentLineWidth,shouldDrawGray){

	this.ctx.save();

	this.ctx.strokeStyle = 'rgb('+this.c.r+','+this.c.g+','+this.c.b+')';

	if(this.ports.length>0){

		this.ctx.lineWidth = Math.max(parentLineWidth*.65,1);

		// draw a thick arc
		this.ctx.beginPath();
		this.ctx.arc(0,0,this.radius,this.start,this.end,false);

		this.ctx.stroke();

		if(this.parent.type==='in' && (shouldDrawGray||this.isSelected)){
			// draw a white arc in the middle of the main arc
			this.ctx.lineWidth = Math.max(parentLineWidth*.45,1);

			var gutter = Math.PI*.012;
			this.ctx.strokeStyle = 'rgb(79,79,79)';
			this.ctx.beginPath();
			this.ctx.arc(0,0,this.radius,this.start+gutter,this.end-gutter,false);
			this.ctx.stroke();
		}
	}
	else{
		this.ctx.lineWidth = Math.max(parentLineWidth*.1,1);

		// draw a thick arc
		this.ctx.beginPath();
		this.ctx.arc(0,0,this.radius,this.start,this.end,false);

		this.ctx.stroke();
	}
	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.drawName = function(lineWidth){

	this.ctx.save();

	this.ctx.rotate(this.start+(this.rotStep/2));

	for(var i=0;i<this.ports.length;i++){
		if(this.ports[i]){
			this.ports[i].drawName(lineWidth);
			this.ctx.rotate(this.rotStep);
		}
	}
	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.updatePorts = function(){

	this.rotStep = (this.end-this.start)/this.ports.length;

	for(var i=0;i<this.ports.length;i++){
		if(this.ports[i]){
			this.ports[i].visible = true;
			this.ports[i].radLocation = this.start+(this.rotStep*i)+(this.rotStep/2);
			this.ports[i].update(this.radius,this.portSize);
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.drawPorts = function(scaler){
	this.ctx.save();

	this.ctx.rotate(this.start+(this.rotStep/2)-(Math.PI*.5));

	var cuttoff = .85;
	var multiplier = 1.7;
	scaler*=multiplier;
	if(scaler>cuttoff) scaler = cuttoff;
	if(scaler<0) scaler = 0;

	scaler*=scaler;

	this.scaler = scaler/cuttoff;

	for(var i=0;i<this.ports.length;i++){
		if(this.ports[i]){
			this.ports[i].draw(scaler);
			this.ctx.rotate(this.rotStep);
		}
	}
	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Arc.prototype.isTouchingPort = function(x,y,scaler){

	for(var i=0;i<this.ports.length;i++){
		if(this.ports[i]){
			var xDiff = this.ports[i].x-x;
			var yDiff = this.ports[i].y-y;
			var absDiff = Math.sqrt(xDiff*xDiff+yDiff*yDiff);
			if(absDiff<this.ports[i].size*.4*scaler){
				this.ports[i].touched = true;
				touchedPort = this.ports[i];
				return true;
			}
		}
	}
	return false;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////


////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Port(_ctx,_parent,_type,_index){
	this.ctx = _ctx;

	this.parent = _parent;
	this.type = _type;
	this.name = "";

	this.index = _index;

	this.circleRad;
	this.size;
	this.radLocation;

	this.x = 0;
	this.y = 0;

	this.touched = false;
	this.hovered = false;

	this.wobbleCounter = Math.random()*Math.PI*2;
	this.wobbleStep = 0.07;
	this.wobbleAmount = 3;

	this.scaler = 0;

	this.connections = {};
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Port.prototype.update = function(rad,size){
	this.circleRad = rad;
	this.size = size;

	this.wobbleCounter = (this.wobbleCounter+this.wobbleStep)%(Math.PI*2);

	this.x = this.circleRad * Math.cos(this.radLocation) + this.parent.parent.centerX;
	this.y = this.circleRad * Math.sin(this.radLocation) + this.parent.parent.centerY;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Port.prototype.draw = function(scaler){

	this.scaler = scaler;

	var tempSize = this.size*scaler*.53;

	if(tempSize>2){
		this.ctx.save();

		this.ctx.strokeStyle = 'rgb(79,79,79)';
		this.ctx.fillStyle = 'rgb('+this.parent.c.r+','+this.parent.c.g+','+this.parent.c.b+')';

		this.ctx.lineWidth = Math.floor(tempSize*.2);

		this.ctx.beginPath();
		var circleSize = tempSize;
		if(touchedPort && touchedPort.type!=this.type) circleSize += (Math.sin(this.wobbleCounter)*this.wobbleAmount);
		circleSize = Math.max(circleSize,1);
		this.ctx.arc(0,this.circleRad,circleSize,0,Math.PI*2,false);

		this.ctx.fill();
		if(tempSize>4) this.ctx.stroke();

		this.ctx.restore();
	}
}

Port.prototype.drawName = function(){
	this.ctx.save();

	var radOffset = this.parent.radius-(usedSize*0.05);
	this.ctx.translate(radOffset,0);

	if(this.x<this.parent.parent.centerX){
		this.ctx.textAlign = 'left';
		this.ctx.rotate(Math.PI);
	}
	else{
		this.ctx.textAlign = 'right';
	}

	var fontSize = Math.floor(this.scaler*this.size*.4);
	this.ctx.font = fontSize+'px Helvetica';
	if(this.touched || this.hovered) this.ctx.fillStyle = 'white';
	else this.ctx.fillStyle = 'rgb('+this.parent.c.r+','+this.parent.c.g+','+this.parent.c.b+')';;

	this.ctx.fillText(this.name,0,fontSize*.2);
	this.ctx.restore();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////


////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Cord(_ctx,outPort,inPort,name){
	this.x1,this.y1,this.x2,this.y2;
	this.lineWidth = 2;
	this.stroke;

	this.name = name;

	this.outPort = outPort;
	this.inPort = inPort;

	this.exists = true;
	this.hovered = false;

	this.deleteX = 0;
	this.deleteY = 0;
	this.deleteSize = this.inPort.size*.4;

	this.wobbleCounter = Math.random()*Math.PI*2;
	this.wobbleStep = 0.05;
	this.wobbleAmount = 2;

	this.ctx = _ctx;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Cord.prototype.update = function(){
	this.x1 = this.outPort.x;
	this.y1 = this.outPort.y;
	this.x2 = this.inPort.x;
	this.y2 = this.inPort.y;

	var xDiff = this.x1-this.x2;
	var yDiff = this.y1-this.y2;
	this.dist = Math.sqrt(xDiff*xDiff+yDiff*yDiff);

	this.lineWidth = Math.max(usedSize*.003,2);

	this.wobbleCounter = (this.wobbleCounter+this.wobbleStep)%(Math.PI*2);

	this.deleteSize = this.inPort.size*.4;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

Cord.prototype.draw = function(){
	if(this.outPort.visible && this.inPort.visible){
		this.ctx.save();
		var opacity = Math.min(this.outPort.scaler,this.inPort.scaler)*1.5;
		this.ctx.lineWidth = Math.floor(this.lineWidth*opacity*2);
		if(this.hovered) {
			this.ctx.strokeStyle = 'rgba(226,39,39,'+opacity+')';
		}
		else{
			this.ctx.strokeStyle = 'rgba(255,255,255,'+opacity+')';
		}
		this.ctx.fillStyle = 'rgba(255,255,255,'+opacity+')';
		this.ctx.beginPath();
		this.ctx.moveTo(this.x1,this.y1);
		this.ctx.lineTo(this.x2,this.y2);
		this.ctx.stroke();

		this.ctx.beginPath();
		var circleSize =  Math.floor(this.lineWidth*opacity*3);
		this.ctx.arc(this.x1,this.y1,circleSize,0,Math.PI*2,false);
		this.ctx.fill();
		this.ctx.arc(this.x2,this.y2,circleSize,0,Math.PI*2,false);
		this.ctx.fill();
		this.ctx.restore();

		if(this.hovered){
			this.deleteX = ((this.x1-this.x2)/2)+this.x2;
			this.deleteY = ((this.y1-this.y2)/2)+this.y2;

			this.ctx.save();

			this.ctx.fillStyle = 'rgba(255,255,255,'+opacity+')';
			this.ctx.strokeStyle = 'rgba(226,39,39,'+opacity+')';

			var tempDeleteSize = this.deleteSize + (Math.sin(this.wobbleCounter)*this.wobbleAmount);
			var tempSize = tempDeleteSize * opacity;

			this.ctx.translate(this.deleteX,this.deleteY);
			this.ctx.rotate(Math.PI/4);

			this.ctx.lineWidth = tempDeleteSize*.15;

			this.ctx.beginPath();
			this.ctx.arc(0,0,tempSize/2,0,Math.PI*2,false);
			this.ctx.fill();
			this.ctx.stroke();

			this.ctx.beginPath();
			this.ctx.moveTo(0,tempSize*.3);
			this.ctx.lineTo(0,-tempSize*.3);
			this.ctx.stroke();

			this.ctx.rotate(-Math.PI/2);

			this.ctx.beginPath();
			this.ctx.moveTo(0,tempSize*.3);
			this.ctx.lineTo(0,-tempSize*.3);
			this.ctx.stroke();

			this.ctx.restore();
		}
	}
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////


