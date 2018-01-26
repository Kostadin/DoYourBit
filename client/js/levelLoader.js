function loadLevel(num) {
	command = null;
	localStorage.setItem('level', num);

	var levelData = levels[num];
	health = MAX_HP;
	money = levelData['money'];
	updateMoney(0);

	if (!state) {
		state = {};
	}
	state.currentLevel = [];
	state.currentLevelIndex = num;
	
	var map = levelData.map;
	var definition = levelData.definition;
	var currentLevel = state.currentLevel;
	state.waves = [];
	state.towers = [];
	state.projectiles = [];
	state.tower_templates = levelData.tower_templates;
	state.buildable = new Array(map.length);
	state.passable = new Array(map.length);
	state.exit = new Array(map.length);
	state.flow = new Array(map.length);
	state.units = [];
	state.unitCell = new Array(map.length);
	var exits = [];
	var dist = new Array(map.length);
	state.levelGridHeight = map.length;
	for (var y = 0; y < map.length; y++) {
		state.levelGridWidth = map[y].length;
		currentLevel[y] = [];
		var buildable = new Array(map[y].length);
		var passable = new Array(map[y].length);
		var exit = new Array(map[y].length);
		var d = new Array(map[y].length);
		var flow = new Array(map[y].length);
		var cell = new Array(map[y].length);
		for (var x = 0; x < map[y].length; x++) {
			buildable[x] = false;
			passable[x] = true;
			exit[x] = false;
			d[x] = 99999;
			flow[x] = [[0, 0]];
			cell[x] = [];
			if (!(map[y][x].constructor === Array)){
				var tileType = map[y][x];
				var tile = $.extend(true, {} , definition[tileType]);
				buildable[x] |= tile.buildable;
				passable[x] &= tile.passable;
				if (tile.type === "exit" ){
					exit[x] = true;
					exits.push([y, x]);
					d[x] = 0;
				}
				currentLevel[y].push(tile);
			}
			else
			{
				var tiles = [];
				for (var i=0; i<map[y][x].length; ++i){
					var tileType = map[y][x][i];
					var tile = $.extend(true, {} , definition[tileType]);
					buildable[x] |= tile.buildable;
					passable[x] &= tile.passable;
					if (tile.type === "exit" ){
						exit[x] = true;
						exits.push([y, x]);
						d[x] = 0;
					}
					tiles.push(tile);
				}
				currentLevel[y].push(tiles);
			}
		};
		state.buildable[y] = buildable;
		state.passable[y] = passable;
		state.exit[y] = exit;
		state.flow[y] = flow;
		state.unitCell[y] = cell;
		dist[y] = d;
	};
	
	// Distance calculations
	var queue = [];
	var mods = [[-1, 0], [0, -1], [0, 1], [1, 0]];
	for (var i=0; i<exits.length; ++i){
		queue.push(exits[i]);
	}
	for (var i=0; i<queue.length; ++i){
		var coords = queue[i];
		var cy = coords[0];
		var cx = coords[1];
		var new_dist = dist[cy][cx]+1;
		for (var j=0; j<mods.length; ++j){
			var mod = mods[j];
			var y = cy + mod[0];
			var x = cx + mod[1];
			if ((0 <= y) && (y<map.length) && (0<=x) && (x<map[y].length) && (state.passable[y][x]) && (dist[y][x] > new_dist)){
				dist[y][x] = new_dist;
				queue.push([y, x]);
			}
		}
	}
	// Flow calculations
	for (var cy=0; cy<map.length; ++cy){
		for (var cx=0; cx<map[cy].length; ++cx){
			if (state.passable[cy][cx]){
				var min_dist = dist[cy][cx];
				var flow = state.flow[cy][cx]; 
				for (var j=0; j<mods.length; ++j){
					var mod = mods[j];
					var y = cy + mod[0];
					var x = cx + mod[1];
					if ((0 <= y) && (y<map.length) && (0<=x) && (x<map[y].length) && (state.passable[y][x])){
						if (dist[y][x] < min_dist){
							min_dist = dist[y][x];
							flow = [mod];
						}
						else if (dist[y][x] === min_dist){
							flow.push(mod);
						}
					}
				}
				state.flow[cy][cx] = flow;
			}
		}
	}
	// Wave management
	for (var i=0; i<levelData.waves.length; ++i){
		var wave = $.extend(true, {} , levelData.waves[i]);
		wave.started = false;
		wave.passedMS = 0;
		wave.lastSpawnMS = 0;
		state.waves.push(wave);
	}
}

var interactableUpdates = {
	"spikes" : function(spikes, now) {
		if (spikes.nextShow == undefined) {
			spikes.nextShow = now + 2000 + (Math.random() * 1200);
		}

		if (now > spikes.nextShow && spikes.spriteHidden.visible) {
			spikes.nextHide = now + 5000;
			spikes.spriteShown.visible = true;
			spikes.spriteHidden.visible = false;
			spikesFX.currentTime = 0;
			spikesFX.play();
		} else if (now > spikes.nextHide && spikes.spriteShown.visible) {
			spikes.nextShow = now + 2000;
			spikes.spriteShown.visible = false;
			spikes.spriteHidden.visible = true;
		}

		if (spikes.spriteHidden.visible) {
			return;
		}

		var playerMapPos = realToMapPos( player.container.position );
		var spikesMapPos = realToMapPos( spikes.spriteShown.position );
		if (sqrDist(playerMapPos, spikesMapPos) < 1) {
			playerDied(now);
		}
	},

	"door" : function(door, x, y) {
		if (!player.container) {
			return;
		}
		var playerMapPos = realToMapPos( player.container.position );
		var doorMapPos = realToMapPos( door.spriteOpenned.position );
		if (sqrDist(playerMapPos, doorMapPos) < 1) {
			if (door.final) {
				showFinal();
			} else {
				goToNextLevel();
			}
			
		}
	},

	"scroll" : function(scroll, x , y) {
		if (!player.container || !scroll.sprites.scroll.visible) {
			return;
		}

		var playerMapPos = realToMapPos( player.container.position );
		var doorMapPos = realToMapPos( scroll.sprites.scroll );
		if (sqrDist(playerMapPos, doorMapPos) < 1) {
			scroll.open();
		}
	}
}

function updateLevel(now) {
	var currentLevel = state.currentLevel;
	for (var y = 0; y < currentLevel.length; y++) {
		for (var x = 0; x < currentLevel[y].length; x++) {
			var tile = currentLevel[y][x];

			if (interactableUpdates[tile.type]) {
				interactableUpdates[tile.type](tile, now);
			}
		};
	};
}
