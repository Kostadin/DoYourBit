
function renderInit() {
	renderer = PIXI.autoDetectRenderer(1280, 720);
	$('#mainMenu').after(renderer.view);

	stage = new PIXI.Container();
}

// var minionNames = ['minion1', 'minion2', 'minion3', 'minionboss'];
// var towerNames = ['tower1', 'tower2', 'tower3'];

function loadAnimations() {
// 	var loader = new PIXI.loaders.Loader();
// 	for (var i=0; i< minionNames.length; ++i){
// 		var name = minionNames[i];
// 		loader.add(name, 'assets/'+name+'/'+name+'_down.json');
// 	}
// 	for (var i=0; i< towerNames.length; ++i){
// 		var name = towerNames[i];
// 		loader.add(name, 'assets/'+name+'/'+name+'_fire.json');
// 	}
// 	loader.once('complete', function() {
// 		loadMinionAnimations();
// 		loadTowerAnimations();
// 	});
// 	loader.load();
}

// function loadMinionAnimations() {
// 	minionAnimations = {};
// 	for (var i=0; i< minionNames.length; ++i){
// 		var name = minionNames[i];
// 		minionAnimations[name] = [];
// 		for(var j=1; j<=2; ++j){
// 			minionAnimations[name].push(PIXI.Texture.fromFrame(name+'_down'+j+'.png'));
// 		}
// 	}
// }

// function loadTowerAnimations() {
// 	towerAnimations = {};
// 	for (var i=0; i< towerNames.length; ++i){
// 		var name = towerNames[i];
// 		towerAnimations[name] = [];
// 		for(var j=1; j<=2; ++j){
// 			towerAnimations[name].push(PIXI.Texture.fromFrame(name+'_fire'+j+'.png'));
// 		}
// 	}
// }

function startGame(level) {
	//just in case
	//if(max_sounds != MAX_SOUNDS){
	//	max_sounds == MAX_SOUNDS;
	//	console.log("max_sounds shoud be " + MAX_SOUNDS);
	//}

	//mainTheme.pause();
	//backgroundTrack.currentTime = 0;
	//backgroundTrack.play();

	$('#mainMenu').hide();
	$('#stats').show();

	// loadLevel(level);

	renderInit();
	renderLevel();
	startUpdate();

	addMouseHandler();

	gameStartTime = Date.now();
	currentTime = gameStartTime;

	lastUpdate = 0;//currentTime;
	// setInterval(function updateLoop() {
		// var now = lastUpdate + STEP_TIME;
		// if (!showingScroll && !showingFinal){
		// 	if (!restarting){
		// 		for (var i=0; i<state.projectiles.length; ++i){
		// 			updateProjectile(state.projectiles[i], now);
		// 		}
		// 		for (var i=0; i<state.waves.length; ++i){
		// 			updateWave(state.waves[i], now);
		// 		}
		// 		for (var i=0; i<state.units.length; ++i){
		// 			updateUnit(state.units[i], now);
		// 		}
		// 		sortUnits();
		// 		for (var i=0; i<state.projectiles.length; ++i){
		// 			var sprite = state.projectiles[i].sprite;
		// 			stage.removeChild(sprite);
		// 			stage.addChild(sprite);
		// 		}
		// 		for (var i=0; i<state.towers.length; ++i){
		// 			updateTower(state.towers[i], now);
		// 		}
		// 		if (state.units.length === 0){
		// 			var waveFound = false;
		// 			for (var i=0; i<state.waves.length; ++i){
		// 				if (state.waves[i].count>0){
		// 					waveFound = true;
		// 					break;
		// 				}
		// 			}
		// 			if (!waveFound){
		// 				goToNextLevel();
		// 				return;
		// 			}
		// 		}
		// 	} else {
		// 		if (now>= restartingUntil){
		// 			location.reload();
		// 			/*
		// 			restartingSprite.visible = false;
		// 			restarting = false;
		// 			restartingSprite.alpha = 0;
		// 			loadLevel(state.currentLevelIndex);
		// 			renderLevel();
		// 			*/
		// 		} else {
		// 			restartingSprite.alpha = (now - restartingSince)/(restartingUntil - restartingSince);
		// 		}
		// 	}
		// } else if (showingFinal) {
		// 	if (!finalStartTimeMS){
		// 		finalStartTimeMS = now;
				// Mute everything else
				//backgroundTrack.pause();
				//mainTheme.pause();
				//spikesFX.pause();
				//stepsFX.pause();
				//openDoorFX.pause();
				// Play explosion
				//finalExplosion.position = 0;
				//finalExplosion.play();
		// 	} else {
		// 		if (now>=finalStartTimeMS + reloadAfterMS){
		// 			location.reload();
		// 		} else {
		// 			if (now >= finalStartTimeMS + blendAfterMS){
		// 				var blendCoef = (now - (finalStartTimeMS + blendAfterMS)) / blendForMS;
		// 				blendCoef = Math.max(0, Math.min(blendCoef, 1));
		// 				finalSprite2.alpha = blendCoef;
		// 			}
		// 			if (now >= finalStartTimeMS + fadeAfterMS){
		// 				var fadeCoef = (now - (finalStartTimeMS + fadeAfterMS)) / (reloadAfterMS - fadeAfterMS);
		// 				fadeCoef = Math.max(0, Math.min(fadeCoef, 1));
		// 				if (fadeCoef<1){
							//console.log(fadeCoef);
		// 				}
		// 				fadeSprite.alpha = fadeCoef;
		// 			}
		// 		}
		// 	}
		// }
		// lastUpdate = now;
	// }, STEP_TIME);
	$('canvas').show();
}

function pauseGame(){
}

function update() {
	renderer.render(stage);
	requestAnimationFrame(update);
};

function startUpdate() {
	requestAnimationFrame( update );
}

function renderLevel(onLoaded) {
	/*
	stage.removeChildren();

	var currentLevel = state.currentLevel;

	for (var y = 0; y < currentLevel.length; y++) {
		for (var x = 0; x < currentLevel[y].length; x++) {
			var tiles = currentLevel[y][x];
			if (!(tiles.constructor === Array)){
				tiles = [tiles];
			}
			for (var i=0;i<tiles.length;++i){
				var tile = tiles[i];
				var sprite = PIXI.Sprite.fromImage("assets/" + tile.sprite);
				sprite.position.x = TILE_WIDTH * x;
				sprite.position.y = TILE_HEIGHT * y;
				stage.addChild(sprite);
				tile.sprite = sprite;
			}
		};
	};

	var darkSprite = PIXI.Sprite.fromImage("assets/dark.png");
	darkSprite.position.x = 0;
	darkSprite.position.y = 0;
	stage.addChild(darkSprite);
	restartingSprite = PIXI.Sprite.fromImage("assets/restarting.png");
	restartingSprite.position.x = 0;
	restartingSprite.position.y = 0;
	restartingSprite.alpha = 0;
	restartingSprite.visible = false;
	finalSprite1 = PIXI.Sprite.fromImage("assets/final_frame_1.png");
	finalSprite1.position.x = 0;
	finalSprite1.position.y = 0;
	finalSprite1.visible = false;
	finalSprite2 = PIXI.Sprite.fromImage("assets/final_frame_2.png");
	finalSprite2.position.x = 0;
	finalSprite2.position.y = 0;
	finalSprite2.alpha = 0;
	finalSprite2.visible = false;
	fadeSprite = PIXI.Sprite.fromImage("assets/fade.png");
	fadeSprite.position.x = 0;
	fadeSprite.position.y = 0;
	fadeSprite.alpha = 0;
	fadeSprite.visible = false;
	//resetPlayerPos();
	//resetGuards();

	stage.addChild(restartingSprite);
	stage.addChild(finalSprite1);
	stage.addChild(finalSprite2);
	stage.addChild(fadeSprite); */
}

// function showFinal(){
// 	showingFinal = true;
// 	stage.removeChild(finalSprite1);
// 	stage.removeChild(finalSprite2);
// 	finalSprite1.visible = true;
// 	finalSprite2.visible = true;
// 	stage.addChild(finalSprite1);
// 	stage.addChild(finalSprite2);
// 	fadeSprite.visible = true;
// 	$('#stats').hide();
// }



