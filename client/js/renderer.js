var socket = null;

function renderInit() {
	app = new PIXI.Application(640, 640);
	$('#mainMenu').after(app.view);

	//stage = new PIXI.Container();
}

var moves = [];
var moves_max = 50;
var canModifyMoves = false;
function moves_debug() {
	console.log(moves);
}

function createDeleteMoveCallback(move_index){
	return (function(){
		$('#command_'+move_index).remove();
		moves.splice(move_index, 1);
		render_moves();
		canModifyMoves = true;
	});
}

function render_moves() {
	var command_divs = '';
	for (var i=0;i<moves.length;++i){
		var div = '<div id="command_'+i+'" class="single_command"><input type="hidden" name="moveId" value="'+i+'"/>';
		switch (moves[i]){
			case 0:
				div += '... Wait';
				break;
			case 1:
				div += '&#x2191;&nbsp; Move';
				break;
			case 2:
				div += '&#x21B6; Rotate left';
				break;
			case 3:
				div += '&#x21B7; Rotate right';
				break;
			default:
				break;
		}
		div += '</div>';
		command_divs += div;
	}
	$('#command_log').html(command_divs);
	for (var i=0;i<moves.length;++i){
		$('#command_'+i).click((function(i){
				return function(){
				$(this).animate({
				  backgroundColor: "#808080",
				  color: "#808080",
				  borderColor: '#808080'
				}, 500 );
				canModifyMoves = false;
				setTimeout(createDeleteMoveCallback(i), 500);
			}
		})(i));
	}
}

function scroll_to_latest_command(){
	var objDiv = document.getElementById('command_log');
	objDiv.scrollTop = objDiv.scrollHeight;
}

function startGame() {
	$('#mainMenu').hide();
	$('#commands').show();

	// WebSocket
	$('#line1').text('Connecting...');
	socket = new WebSocket('ws://127.0.0.1:4420');
	var socket_err = false;
	socket.addEventListener('open',function(event){
    		socket.send("client");
	});

	socket.addEventListener('message',function(event){
    		//console.log('Message from server ', event.data);
			if (event.data == 'hb'){
			} else if (event.data == 'client:OK'){
				$('#gameplay_controls').show();
				$('#line1').text('Authenticating...');
				console.log(event.data);
				socket.send('queue');
			} else if (event.data == 'queue:OK'){
				$('#line1').text('Searching for partner...');
				console.log('Queueing...')
			} else if (event.data.indexOf('start:')===0){
				canModifyMoves = true;
				$('#line1').text('Game started. Awaiting commands...');
				if (event.data==='start:0'){
					$('#line2').text('Your robot is on the left.');
				} else if (event.data==='start:1'){
					$('#line2').text('Your robot is on the right.');
				}
				console.log(event.data);
				console.log('Game starting...');
				//socket.send('submit\n0\n1\n2\n3');
			} else if (event.data == 'submit:OK'){
				$('#line1').text('Commands accepted.');
				console.log('Program submission accepted.');
				socket.send('simStart');
			} else if (event.data == 'simStart:OK'){
				$('#line1').text('Waiting for partner...');
				console.log(event.data);
			} else if (event.data == 'simStop:OK'){
				$('#line1').text('Waiting for partner...');
				console.log(event.data);
			} else if (event.data == 'sim:started'){
				$('#line1').text('Simulation running...');
				console.log(event.data);
				$('#btn_submit').hide();
				$('#btn_stop').show();
			} else if (event.data == 'sim:stopped'){
				$('#line1').text('Simulation stopped. Awaiting commands...');
				console.log(event.data);
				$('#btn_submit').show();
				$('#btn_stop').hide();
			} else if (event.data.indexOf('termination:')===0){
				$('#line1').text('End of simulation.');
				console.log(event.data);
				alert(event.data.substring(12, event.data.length));
				location.reload();
			} else if (event.data.indexOf('{')===0){
				//console.log(event.data);
				var level = JSON.parse(event.data);
				update_stage(level);
			}
	});

	socket.addEventListener('error', (error) => {
		console.log('Error: Cannot connect to server!');
		socket_err = true;
	});
	// let loop = Promise::new((resolve, reject) => {
	// 	var level = []; // Init level data
	// });

	// Input
	document.getElementById('btn_left').addEventListener('click',function(event){
		if((canModifyMoves)&&(moves_max > 0)){
			moves.push(2);
			moves_max--;
			render_moves();
			scroll_to_latest_command();
		}
		
	});
	document.getElementById('btn_right').addEventListener('click',function(event){
		if((canModifyMoves)&&(moves_max > 0)){
			moves.push(3);
			moves_max--;
			render_moves();
			scroll_to_latest_command();
		}
	});
	document.getElementById('btn_move').addEventListener('click',function(event){
		if((canModifyMoves)&&(moves_max > 0)){
			moves.push(1);
			moves_max--;
			render_moves();
			scroll_to_latest_command();
		}
	});
	document.getElementById('btn_wait').addEventListener('click',function(event){
		if((canModifyMoves)&&(moves_max > 0)){
			moves.push(0);
			moves_max--;
			render_moves();
			scroll_to_latest_command();
		}
	});
	document.getElementById('btn_submit').addEventListener('click',function(event){
		if (!socket_err) {
			if (canModifyMoves) {
				var commandStr = "submit";
				for (var i=0;i<moves.length;++i){
					commandStr += ("\n"+moves[i]);
				}
				socket.send(commandStr);
			}
		}
		else {
			console.log("Pass!");
		}
	});
	document.getElementById('chat').value = ""; // Reset chat
	document.getElementById('chat').addEventListener("keypress",function(event){
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
	var background = PIXI.Sprite.fromImage("assets/back.png");
	background.width = 640;
	background.height = 640;
	background.anchor.set(0);
	tiles.background = background;
	var wall = PIXI.Texture.fromImage("assets/wall1.png");
	tiles.wall = [wall, wall];
	var ground = PIXI.Texture.fromImage("assets/ground1.png");
	tiles.ground = [ground, ground];
	var door1 = PIXI.Texture.fromImage("assets/door0.png");
	var door2 = PIXI.Texture.fromImage("assets/door1.png");
	tiles.door = [door1, door2];
	var plate = PIXI.Texture.fromImage("assets/plate1.png");
	tiles.plate = [plate, plate];
	//var player1 = PIXI.Texture.fromImage("assets/player1.png");	
	//var player2 = PIXI.Texture.fromImage("assets/player2.png");
	//tiles.player = [[player1, player1, player1, player1], [player2, player2, player2, player2]];
	player_textures = [];
	for (var i=0;i<2;++i){
		player_directions = [];
		for (var j=0;j<4;++j){
			player_directions.push(PIXI.Texture.fromImage("assets/robot"+i+"_"+j+".png"));
		}
		player_textures.push(player_directions);
	}
	tiles.player = player_textures;
	var exit = PIXI.Texture.fromImage("assets/exit1.png");
	tiles.exit = [exit, exit];
}

var tiles = Object();
var tile_types = ["ground", "wall", "door", "plate", "exit", "player"];

function update_stage(level) {
	app.stage.removeChildren();
	for (var y=0;y<level.state.length;++y){
		var row = level.state[y];
		//console.log(row);
		for (var x=0;x<row.length;++x){
			var tile = row[x];
			for (var idx=0;idx<tile.length;++idx){
				var obj = tile[idx];
				//console.log("%s %s %s %s", JSON.stringify(obj[0]), x, y, tile_types[obj[0]]);
				var texture;
				if (obj[0] == 5) {
					texture = tiles[tile_types[obj[0]]][obj[1]][obj[2]];
				}
				else {
					texture = tiles[tile_types[obj[0]]][obj[1]];
				}
				//console.log(texture);
				var tileSprite = new PIXI.Sprite(texture);
				tileSprite.anchor.set(0);
				tileSprite.width = TILE_WIDTH;
				tileSprite.height = TILE_HEIGHT;
				tileSprite.position.x = TILE_WIDTH * x;
				tileSprite.position.y = TILE_HEIGHT * y;
				app.stage.addChild(tileSprite);
			}
		};
	};
	// app.stage.addChild(array.background);
	// for (let i = 0; i < 10; i++){
	// 	var position = TILE_WIDTH * i;
		// console.log(position);
	// 	var tile = new PIXI.Sprite(array.wall);
	// 	tile.anchor.set(0);
	// 	tile.width = TILE_WIDTH;
	// 	tile.height = TILE_HEIGHT;
	// 	tile.position.x = position;
	// 	app.stage.addChild(tile);
	// }
	//app.stage.addChild(wall);
}
