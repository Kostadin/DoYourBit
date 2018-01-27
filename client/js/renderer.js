function renderInit() {
	app = new PIXI.Application(1280, 720);
	$('#mainMenu').after(app.view);

	//stage = new PIXI.Container();
}

var moves = [];
var moves_max = 6;
function moves_debug() {
	console.log(moves);
}

function startGame() {
	$('#mainMenu').hide();
	$('#commands').show();

	const TILE_WIDTH = 64;
	const TILE_HEIGHT = 64;


	// WebSocket
	const socket = new WebSocket('ws://localhost:8080');
	var socket_err = false;
	socket.addEventListener('open', (event) => {
    		socket.send(JSON.stringify({"command": "login"}));
	});

	socket.addEventListener('message', (event) => {
    		console.log('Message from server ', event.data);
	});

	socket.addEventListener('error', (error) => {
		console.log('Error: Cannot connect to server!');
		socket_err = true;
	});
	// let loop = Promise::new((resolve, reject) => {
	// 	let level = []; // Init level data
	// });

	// Input
	document.getElementById('btn_left').addEventListener('click', (event) => {
		if(moves_max > 0){
			moves.push("left");
			moves_max--;
		}
		moves_debug();
	});
	document.getElementById('btn_right').addEventListener('click', (event) => {
		if(moves_max > 0){
			moves.push("right");
			moves_max--;
		}
		moves_debug();
	});
	document.getElementById('btn_move').addEventListener('click', (event) => {
		if(moves_max > 0){
			moves.push("move");
			moves_max--;
		}
		moves_debug();
	});
	document.getElementById('btn_wait').addEventListener('click', (event) => {
		if(moves_max > 0){
			moves.push("wait");
			moves_max--;
		}
		moves_debug();
	});
	document.getElementById('btn_submit').addEventListener('click', (event) => {
		if (!socket_err) {
			socket.send(JSON.stringify({"move": moves}));
			moves = [];
		}
		else {
			console.log("Pass!");
		}
		moves_debug();
	});
	document.getElementById('chat').value = ""; // Reset chat
	document.getElementById('chat').addEventListener("keypress", (event) => {
		if (event.key == 'Enter') {
			console.log(event.target.value);
			console.log(event.target.value.length);
			if (!socket_err) {
				socket.send(JSON.stringify({"chat": event.target.value}));
			}
			event.target.value = "";
		}
	});

	//Load Pixi stuff
	renderInit();
	let background = PIXI.Sprite.fromImage("assets/back.png");
	background.width = 1280;
	background.height = 720;
	background.anchor.set(0);
	let wall = PIXI.Texture.fromImage("assets/wall1.png");
	update_stage({background: background, wall: wall});
}

function update_stage(array) {
	// app.stage.removeChildren();
	app.stage.addChild(array.background);
	for (let i = 0; i < 10; i++){
		let position = TILE_WIDTH * i;
		console.log(position);
		let tile = new PIXI.Sprite(array.wall);
		tile.anchor.set(0);
		tile.width = TILE_WIDTH;
		tile.height = TILE_HEIGHT;
		tile.position.x = position;
		app.stage.addChild(tile);
	}
	//app.stage.addChild(wall);
}
