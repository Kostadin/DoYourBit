function spawn(wave, now){
	wave.count -= 1;
	wave.lastSpawnMS = now;
	var unit = {
		num: wave.count,
		maxHP: wave.maxHP,
		hp: wave.maxHP,
		sizeX: wave.sizeX,
		halfSizeX: wave.sizeX/2.0,
		sizeY: wave.sizeY,
		halfSizeY: wave.sizeY/2.0,
		avgRadius: (wave.sizeY + wave.sizeX)/3.5,
		sheet: wave.sheet,
		x: wave.x*TILE_WIDTH+(HALF_TILE_WIDTH),
		y: wave.y*TILE_HEIGHT+(HALF_TILE_HEIGHT),
		speed: wave.speed,
		lastX: -1,
		lastY: -1
	};
	state.units.push(unit);
	var ucY = Math.floor(unit.y/TILE_HEIGHT);
	var ucX = Math.floor(unit.x/TILE_WIDTH);
	state.unitCell[ucY][ucX].push(unit);
	/*
	var sprite = PIXI.Sprite.fromImage("assets/" + unit.sheet+"/"+unit.sheet+"_down1.png");
	sprite.position.x = unit.x - (unit.halfSizeX);
	sprite.position.y = unit.y - (unit.halfSizeY);
	unit.sprite = sprite;
	stage.addChild(sprite);
	*/
	var sprite = new PIXI.Container();
	sprite.anchor = new PIXI.Point(0.5, 0.5);
	unit.sprite = sprite;
	var clip = new PIXI.extras.AnimatedSprite(minionAnimations[unit.sheet]);
	clip.visible = true;
	clip.position = new PIXI.Point(0, 0);
	clip.animationSpeed = MINION_ANIM_SCALE;
	sprite.position.x = unit.x - (unit.halfSizeX);
	sprite.position.y = unit.y - (unit.halfSizeY);
	sprite.addChild(clip);
	stage.addChild(sprite);
	clip.play();
}

function removeUnit(unit){
	var gridX = Math.floor(unit.x/TILE_WIDTH);
	var gridY = Math.floor(unit.y/TILE_WIDTH);
	var oldUnitCell = state.unitCell[gridY][gridX];
	for (var i=0;i<oldUnitCell.length;++i){
		if (oldUnitCell[i] === unit){
			oldUnitCell.splice(i, 1);
			break;
		}
	}
	for (var i=0; i<state.units.length; ++i){
		if (state.units[i] === unit){
			state.units.splice(i, 1);
			break;
		}
	}
	unit.sprite.visible = false;
	stage.removeChild(unit.sprite);
}

function unitExits(unit){
	
	
	//console.log(unit);

	removeUnit(unit);
	var health_bar = document.getElementById('healthbar');
	//console.log("health " + health_bar.style.width);
	health = health - 50;
	health_bar.style.width =  health;
	if(health <= 0){
		//Game Over
		gameOver();
	}
}

function gameOver(){
	$('#level').hide();
	$('#gameOver').show();
	$('#stats').hide();
	var now = lastUpdate + STEP_TIME;
	restartingSince = now;
	restartingUntil = now + restartingLengthMS;
	restarting = true;
	//restartingSprite.visible = true;
}

function killUnit(unit, projectile_type){
	removeUnit(unit);
	updateMoney(50);
}

function updateMoney(num){
	money += num;
	$('#money').text(money);
	if (money>=100){
		$('#tower1').css({color: 'white'});
	}
	else
	{
		$('#tower1').css({color: 'red'});
	}
	if (money>=500){
		$('#tower2').css({color: 'white'});
	}
	else
	{
		$('#tower2').css({color: 'red'});
	}
	if (money>=250){
		$('#tower3').css({color: 'white'});
	}
	else
	{
		$('#tower3').css({color: 'red'});
	}
}

function updateWave(wave, now){
	if (!wave.started){
		if (wave.startMS <= now){
			wave.started = true;
			if (wave.count>0){
				spawn(wave, now);
			}
		}
	}
	if (wave.started){
		if ((wave.count>0) && (now - wave.lastSpawnMS >= wave.interval)){
			spawn(wave, now);
		}
		wave.passedMS = now - wave.startMS;
	}
}

function honorLimits(unit){
	var gridY = Math.floor(unit.y/TILE_WIDTH);
	var gridX = Math.floor(unit.x/TILE_WIDTH);
	
	// Walls
	// Up
	if ((gridY-1>=0)&&(!state.passable[gridY-1][gridX])&&(unit.y<gridY*TILE_HEIGHT+unit.halfSizeY)){
		unit.y = gridY*TILE_HEIGHT+unit.halfSizeY;
	}
	// Left
	if ((gridX-1>=0)&&(!state.passable[gridY][gridX-1])&&(unit.x<gridX*TILE_WIDTH+unit.halfSizeX)){
		unit.x = gridX*TILE_WIDTH+unit.halfSizeX;
	}
	// Right
	if ((gridX+1<state.levelGridWidth)&&(!state.passable[gridY][gridX+1])&&(unit.x>(gridX+1)*TILE_WIDTH-unit.halfSizeX)){
		unit.x = (gridX+1)*TILE_WIDTH-unit.halfSizeX;
	}
	// Down
	if ((gridY+1<state.levelGridHeight)&&(!state.passable[gridY+1][gridX])&&(unit.y>(gridY+1)*TILE_HEIGHT-unit.halfSizeY)){
		unit.y = (gridY+1)*TILE_HEIGHT-unit.halfSizeY;
	}
	
	// Up left
	if ((gridY-1>=0)&&(gridX-1>=0)&&(!state.passable[gridY-1][gridX-1])){
		var dTop = (unit.y-unit.halfSizeY) - (gridY*TILE_HEIGHT);
		var dLeft = (unit.x-unit.halfSizeX) - (gridX*TILE_WIDTH);
		if ((dTop<0)&&(dLeft<0)){
			var aTop = Math.abs(dTop);
			var aLeft = Math.abs(dLeft);
			if (aTop>aLeft){ // Shift right
				unit.x = gridX*TILE_WIDTH+unit.halfSizeX;
			} else if (aTop<aLeft){ // Shift down
				unit.y = gridY*TILE_HEIGHT+unit.halfSizeY;
			} else { // Shift down right
				unit.x = gridX*TILE_WIDTH+unit.halfSizeX;
				unit.y = gridY*TILE_HEIGHT+unit.halfSizeY;
			}
		}
	}
	// Up right
	if ((gridY-1>=0)&&(gridX+1<state.levelGridWidth)&&(!state.passable[gridY-1][gridX+1])){
		var dTop = (unit.y-unit.halfSizeY) - (gridY*TILE_HEIGHT);
		var dRight = (unit.x+unit.halfSizeX) - ((gridX+1)*TILE_WIDTH);
		if ((dTop<0)&&(dRight>0)){
			var aTop = Math.abs(dTop);
			var aRight = Math.abs(aRight);
			if (aTop>aRight){ // Shift left
				unit.x = (gridX+1)*TILE_WIDTH-unit.halfSizeX;
			} else if (aTop<aRight){ // Shift down
				unit.y = gridY*TILE_HEIGHT+unit.halfSizeY;
			} else { // Shift down left
				unit.x = (gridX+1)*TILE_WIDTH-unit.halfSizeX;
				unit.y = gridY*TILE_HEIGHT+unit.halfSizeY;
			}
		}
	}
	// Down left
	if ((gridY+1<state.levelGridHeight)&&(gridX-1>=0)&&(!state.passable[gridY+1][gridX-1])){
		var dDown = (unit.y+unit.halfSizeY) - ((gridY+1)*TILE_HEIGHT);
		var dLeft = (unit.x-unit.halfSizeX) - (gridX*TILE_WIDTH);
		if ((dDown>0)&&(dLeft<0)){
			var aDown = Math.abs(dDown);
			var aLeft = Math.abs(dLeft);
			if (aDown>aLeft){ // Shift right
				unit.x = gridX*TILE_WIDTH+unit.halfSizeX;
			} else if (aDown<aRight){ // Shift up
				unit.y = (gridY+1)*TILE_HEIGHT-unit.halfSizeY;
			} else { // Shift up left
				unit.x = gridX*TILE_WIDTH+unit.halfSizeX;
				unit.y = (gridY+1)*TILE_HEIGHT-unit.halfSizeY;
			}
		}
	}
	// Down right
	if ((gridY+1<state.levelGridHeight)&&(gridX+1<state.levelGridWidth)&&(!state.passable[gridY+1][gridX+1])){
		var dDown = (unit.y+unit.halfSizeY) - ((gridY+1)*TILE_HEIGHT);
		var dRight = (unit.x+unit.halfSizeX) - ((gridX+1)*TILE_WIDTH);
		if ((dDown>0)&&(dRight>0)){
			var aDown = Math.abs(dDown);
			var aRight = Math.abs(aRight);
			if (aDown>aRight){ // Shift left
				unit.x = (gridX+1)*TILE_WIDTH-unit.halfSizeX;
			} else if (aDown<aRight){ // Shift up
				unit.y = (gridY+1)*TILE_HEIGHT-unit.halfSizeY;
			} else { // Shift up left
				unit.x = (gridX+1)*TILE_WIDTH-unit.halfSizeX;
				unit.y = (gridY+1)*TILE_HEIGHT-unit.halfSizeY;
			}
		}
	}
	// Level limits
	if (unit.y<(unit.halfSizeY)){
		unit.y = (unit.halfSizeY);
	}
	if (unit.y>(state.levelGridHeight*TILE_HEIGHT - (unit.halfSizeY))){
		unit.y = (state.levelGridHeight*TILE_HEIGHT - (unit.halfSizeY))
	}
	if (unit.x<(unit.halfSizeX)){
		unit.x = (unit.halfSizeX);
	}
	if (unit.x>(state.levelGridWidth*TILE_WIDTH - (unit.halfSizeX))){
		unit.x =(state.levelGridWidth*TILE_WIDTH - (unit.halfSizeX))
	}
}

var WALL_WIND_THRESHOLD = 2;

function updateUnit(unit, now){
	var gridX = Math.floor(unit.x/TILE_WIDTH);
	var gridY = Math.floor(unit.y/TILE_WIDTH);
	var oldGridX = gridX;
	var oldGridY = gridY;
	var oldUnitCell = state.unitCell[oldGridY][oldGridX];
	
	// Flow
	var flowArr = state.flow[gridY][gridX][unit.num % state.flow[gridY][gridX].length];
	var flow = {y: flowArr[0], x: flowArr[1]};
	scaleVector(flow, unit.speed);
	pointAdd(unit, flow);
	
	honorLimits(unit);
	
	// Wall wind
	for (var y=-1; y<=1; ++y){
		if ((gridY+y>=0)&&(gridY+y<state.levelGridHeight)){
			for (var x=-1; x<=1; ++x){
				if ((gridX+x>=0)&&(gridX+x<state.levelGridWidth)&&(!state.passable[gridY+y][gridX+x])){
					var dx = unit.x - ((gridX+x)*TILE_WIDTH + HALF_TILE_WIDTH);
					var dy = unit.y - ((gridY+y)*TILE_HEIGHT + HALF_TILE_HEIGHT);
					if (Math.abs(dx)<HALF_TILE_WIDTH+unit.halfSizeX+WALL_WIND_THRESHOLD){
						unit.x += Math.sign(dx)*WALL_WIND_THRESHOLD;
					}
					if (Math.abs(dy)<HALF_TILE_HEIGHT+unit.halfSizeY+WALL_WIND_THRESHOLD){
						unit.y += Math.sign(dy)*WALL_WIND_THRESHOLD;
					}
				}
			}
		}
	}
	
	honorLimits(unit);
	
	// Evade other minions
	var evade = {x: 0.0, y: 0.0};
	var evadedUnits = 0;
	for (var y=oldGridY-1; y<=oldGridY+1; ++y){
		if ((0<=y)&&(y<state.levelGridHeight)){
			for (var x=oldGridX-1; x<=oldGridX+1; ++x){
				if ((0<=x)&&(x<state.levelGridWidth)&&(state.passable[y][x])&&(state.unitCell[y][x].length>0)){
					var unitCell = state.unitCell[y][x];
					for (var i=0; i<unitCell.length; ++i){
						var otherUnit = unitCell[i];
						if (otherUnit != unit){
							var dist = Math.sqrt(sqrDist(unit, otherUnit));
							if (dist<(unit.avgRadius + otherUnit.avgRadius)){
								var scale = 1-(dist/(unit.avgRadius + otherUnit.avgRadius));
								scale *= scale;
								var evasionMove = {x: (unit.x-otherUnit.x)*scale, y: (unit.y-otherUnit.y)*scale};
								if (scale>0.9){ // Random escape if the units are right on top of each other
									evasionMove.x += Math.floor(Math.random()*5-2);
									evasionMove.y += Math.floor(Math.random()*5-2);
								}
								//pointAdd(evade, evasionMove);
								//evadedUnits += 1;
								pointAdd(unit, evasionMove);
								honorLimits(unit);
							}
						}
					}
				}
			}
		}
	}
	/*
	if (evadedUnits>0){
		scaleVector(evade, 1/evadedUnits);
		pointAdd(unit, evade);
		honorLimits(unit);
	}
	*/
	
	var gridY = Math.floor(unit.y/TILE_HEIGHT);
	var gridX = Math.floor(unit.x/TILE_WIDTH);
	unit.sprite.position.x = unit.x - (unit.halfSizeX);
	unit.sprite.position.y = unit.y - (unit.halfSizeY);
	var newUnitCell = state.unitCell[gridY][gridX];
	if (oldUnitCell != newUnitCell){
		for (var i=0;i<oldUnitCell.length;++i){
			if (oldUnitCell[i] === unit){
				oldUnitCell.splice(i, 1);
				newUnitCell.push(unit);
				break;
			}
		}
	}

	// Jiggle to get unstuck
	if ((unit.lastX === Math.floor(unit.x))&&(unit.lastY === Math.floor(unit.y))){
		unit.x += Math.round(Math.random()*3-1.5);
		unit.y += Math.round(Math.random()*3-1.5);
	}

	honorLimits(unit);

	// Check the exit
	if (state.exit[gridY][gridX]){
		unitExits(unit);
	}

	unit.lastX = Math.floor(unit.x);
	unit.lastY = Math.floor(unit.y);
}

function unitRenderSortComparator(a, b){
	if (a.y === b.y){
		return a.x - b.x;
	} else {
		return a.y - b.y;
	}
}

function sortUnits(){
	for (var y=0; y<state.levelGridHeight; ++y){
		for (var x=0; x<state.levelGridWidth; ++x){
			if (state.unitCell[y][x].length>1){
				state.unitCell[y][x].sort(unitRenderSortComparator);
				for (var i=0; i<state.unitCell[y][x].length; ++i){
					var unit = state.unitCell[y][x][i];
					stage.removeChild(unit.sprite);
					stage.addChild(unit.sprite);
				}
			}
		}
	}
}

function buildTower(gridY, gridX, template_key){
	if (state.tower_templates[template_key] === undefined){
		return;
	}
	if (state.buildable[gridY][gridX]){
		tower = $.extend(true, {}, state.tower_templates[template_key]);
		if (tower.cost > money){
			return;
		}
		tower.gridX = gridX;
		tower.gridY = gridY;
		tower.x = gridX*TILE_WIDTH+HALF_TILE_WIDTH;
		tower.y = gridY*TILE_HEIGHT+HALF_TILE_WIDTH;
		tower.sqrRange = tower.range*tower.range;
		tower.lastFireMS = 0;
		tower.sprite1 = PIXI.Sprite.fromFrame(tower.sheet+'_fire1.png');
		tower.sprite2 = PIXI.Sprite.fromFrame(tower.sheet+'_fire2.png');
		tower.sprite1.visible = true;
		tower.sprite2.visible = false;
		tower.sprite1.x = gridX*TILE_WIDTH;
		tower.sprite2.x = tower.sprite1.x;
		tower.sprite1.y = gridY*TILE_HEIGHT;
		tower.sprite2.y = tower.sprite1.y;
		stage.addChild(tower.sprite1);
		stage.addChild(tower.sprite2);
		state.buildable[gridY][gridX] = false;
		state.towers.push(tower);
		updateMoney(-tower.cost);
	}
}

function destroyTower(tower){
	stage.removeChild(tower.sprite1);
	stage.removeChild(tower.sprite2);
	for (var i=0; i<state.towers.length; ++i){
		if (state.towers[i] === tower){
			state.towers.splice(i, 1);
			break;
		}
	}
	state.buildable[tower.gridY][tower.gridX] = true;
	updateMoney(tower.cost/2);
}

function prioritiseForPlasma(a, b){
	if (a.maxHP === b.maxHP){
		return (a.hp - b.hp);
	} else {
		return (b.maxHP - a.maxHP);
	}
}

function fireLaser(startX, startY, endX, endY, tower, now){
	playSound("splash");
	tower.sprite1.visible = false;
	tower.sprite2.visible = true;
	tower.lastFireMS = now;
	var projectile = {
		type: tower.projectile,
		startX: startX,
		startY: startY,
		endX: endX,
		endY: endY,
		x: startX,
		y: startY,
		originX: tower.x,
		originY: tower.y-24,
		damage: tower.damage,
		aoe: tower.aoe,
		speed: 8,
		width: 128,
		height: 32
	};
	var sprite = PIXI.Sprite.fromImage('assets/red_laser.png');
	sprite.blendMode = PIXI.BLEND_MODES.SCREEN;
	sprite.anchor.x = 1;
	sprite.anchor.y = 0.5;
	var dirVector = {x: (projectile.endX - projectile.startX), y: (projectile.endY - projectile.startY)};
	var tripLength = vecLength(dirVector);
	projectile.speed = tripLength/(Math.ceil(tower.duration/STEP_TIME));
	normalize(dirVector);
	projectile.dirVector = dirVector;
	scaleVector(projectile.dirVector, projectile.speed);
	sprite.position.x = projectile.x;
	sprite.position.y = projectile.y;
	projectile.sprite = sprite;
	var originVector = {x: (projectile.x-projectile.originX), y: (projectile.y-projectile.originY)};
	var laserLength = vecLength(originVector);
	normalize(originVector);
	projectile.sprite.rotation = Math.atan2(originVector.y, originVector.x);
	projectile.sprite.scale.x = laserLength/projectile.width;
	state.projectiles.push(projectile);
	stage.addChild(projectile.sprite);
}

function updateTower(tower, now){
	// Turn off
	if (tower.lastFireMS < now - tower.duration){
		tower.sprite1.visible = true;
		tower.sprite2.visible = false;
	}

	// Try firing
	if (tower.sprite1.visible && (tower.lastFireMS + tower.interval < now)){
		if (tower.projectile === "plasma"){
			var potential = [];
			for (var i=0; i<state.units.length; ++i){
				var unit = state.units[i];
				if (sqrDist(tower, unit)<=tower.sqrRange){
					potential.push(unit);
				}
			}
			if (potential.length>1){
				potential.sort(prioritiseForPlasma);
			}
			if (potential.length>0){
				var target = potential[0];
				// Emit projectile
				tower.sprite1.visible = false;
				tower.sprite2.visible = true;
				tower.lastFireMS = now;
				var projectile = {
					type: tower.projectile,
					damage: tower.damage,
					aoe: tower.aoe,
					startX: tower.gridX*TILE_WIDTH+31,
					startY: tower.gridY*TILE_HEIGHT+6,
					endX: target.x,
					endY: target.y,
					speed: 32,
					width: 64,
					height: 16
				};
				var sprite = PIXI.Sprite.fromImage("assets/green_laser.png");
				sprite.anchor.x = 1;
				sprite.anchor.y = 0.5;
				var dirVector = {x: (projectile.endX - projectile.startX), y: (projectile.endY - projectile.startY)};
				normalize(dirVector);
				projectile.dirVector = dirVector;
				sprite.rotation = Math.atan2(dirVector.y, dirVector.x);
				scaleVector(projectile.dirVector, projectile.speed);
				projectile.x = projectile.startX;
				projectile.y = projectile.startY;
				pointAdd(projectile, projectile.dirVector);
				sprite.position.x = projectile.x;
				sprite.position.y = projectile.y;
				sprite.scale.x = projectile.speed / projectile.width;
				sprite.scale.y = sprite.scale.x;
				projectile.sprite = sprite;
				stage.addChild(sprite);
				state.projectiles.push(projectile);
				playSound("pew");
			}
		} else if (tower.projectile === "laser"){
			var coordsInRange = [];
			var potentialDamage = [];
			var maxDamageGroup = [];
			var maxDamage = 0;
			var currentDamage = 0;
			var currentGroup = [];
			var visited = [];
			for (var gridY=0; gridY<state.levelGridHeight; ++gridY){
				for (var gridX=0; gridX<state.levelGridWidth; ++gridX){
					if ((state.passable[gridY][gridX])&&(sqrVecLength({x: (gridX*TILE_WIDTH+HALF_TILE_WIDTH-tower.x), y: (gridY*TILE_HEIGHT+HALF_TILE_HEIGHT-tower.y)})<tower.range*tower.range)){
						coordsInRange.push([gridY, gridX]);
						visited.push(false);
						potentialDamage.push(state.unitCell[gridY][gridX].length*tower.damage);
					}
				}
			}
			if ((coordsInRange.length === 1)&&(potentialDamage[0] > 0)){
				// Fire on a single cell
				fireLaser(coordsInRange[0][1]*TILE_WIDTH, coordsInRange[0][0]*TILE_HEIGHT, (coordsInRange[0][1]+1)*TILE_WIDTH, (coordsInRange[0][0]+1)*TILE_HEIGHT, tower, now);
			} else if ((coordsInRange.length === 2)&&(potentialDamage[0]+potentialDamage[1] > 0)){
				// Fire on two cells
				fireLaser(coordsInRange[0][1]*TILE_WIDTH+HALF_TILE_WIDTH, coordsInRange[0][0]*TILE_HEIGHT+HALF_TILE_HEIGHT, coordsInRange[1][1]*TILE_WIDTH+HALF_TILE_WIDTH, coordsInRange[1][0]*TILE_HEIGHT+HALF_TILE_HEIGHT, tower, now);
			} else if (coordsInRange.length >= 3){
				for (var i=0; i<coordsInRange.length; ++i){
					currentGroup.push(coordsInRange[i]);
					visited[i] = true;
					currentDamage += potentialDamage[i];
					for (var j=0; j<coordsInRange.length; ++j){
						if (!visited[j]){
							var condj1 = (coordsInRange[j][0]-coordsInRange[i][0] === 1);
							var condj2 = (coordsInRange[j][1]-coordsInRange[i][1] === 1);
							var condj3 = (coordsInRange[j][0]-coordsInRange[i][0] === 0);
							var condj4 = (coordsInRange[j][1]-coordsInRange[i][1] === 0);
							if ((condj1||condj2)&&(condj3||condj4)){
								currentGroup.push(coordsInRange[j]);
								visited[j] = true;
								currentDamage += potentialDamage[j];
								for (var k=0; k<coordsInRange.length; ++k){
									if (!visited[k]){
										var condk1 = (coordsInRange[k][0]-coordsInRange[j][0] === 1);
										var condk2 = (coordsInRange[k][1]-coordsInRange[j][1] === 1);
										var condk3 = (coordsInRange[k][0]-coordsInRange[j][0] === 0);
										var condk4 = (coordsInRange[k][1]-coordsInRange[j][1] === 0);
										if ((condk1||condk2)&&(condk3||condk4)){
											currentGroup.push(coordsInRange[k]);
											currentDamage += potentialDamage[k];
											if (currentDamage > maxDamage){
												maxDamage = currentDamage;
												maxGroup = $.extend(true, {} , currentGroup);
											}
											currentDamage -= potentialDamage[k];
											currentGroup.splice(currentGroup.length-1, 1);
										}
									}
								}
								currentDamage -= potentialDamage[j];
								visited[j] = false;
								currentGroup.splice(currentGroup.length-1, 1);
							}
						}
					}
					currentDamage -= potentialDamage[i];
					visited[i] = false;
					currentGroup.splice(currentGroup.length-1, 1);
				}
				if (maxDamage > 0){
					// Fire on three cells
					fireLaser(maxGroup[0][1]*TILE_WIDTH+HALF_TILE_WIDTH, maxGroup[0][0]*TILE_HEIGHT+HALF_TILE_HEIGHT, maxGroup[2][1]*TILE_WIDTH+HALF_TILE_WIDTH, maxGroup[2][0]*TILE_HEIGHT+HALF_TILE_HEIGHT, tower, now);
				}
			}
		} else if (tower.projectile === "granade"){
			var maxDamage = 0;
			var maxDamageCell = null;
			for (var gridY=0; gridY<state.levelGridHeight; ++gridY){
				for (var gridX=0; gridX<state.levelGridWidth; ++gridX){
					if ((state.passable[gridY][gridX])&&(sqrVecLength({x: (gridX*TILE_WIDTH+HALF_TILE_WIDTH-tower.x), y: (gridY*TILE_HEIGHT+HALF_TILE_HEIGHT-tower.y)})<tower.range*tower.range)){
						var damage = state.unitCell[gridY][gridX].length*tower.damage;
						if (damage > maxDamage){
							maxDamageCell = state.unitCell[gridY][gridX];
						}
					}
				}
			}
			if (maxDamageCell != null){
				var target = {x: 0, y: 0};
				for (var i=0; i<maxDamageCell.length; ++i){
					pointAdd(target, maxDamageCell[i]);
				}
				scaleVector(target, 1/maxDamageCell.length);
				tower.sprite1.visible = false;
				tower.sprite2.visible = true;
				tower.lastFireMS = now;
				var projectile = {
					type: tower.projectile,
					damage: tower.damage,
					aoe: tower.aoe,
					startX: tower.gridX*TILE_WIDTH+31,
					startY: tower.gridY*TILE_HEIGHT+6,
					endX: target.x,
					endY: target.y,
					speed: 11,
					width: 64,
					height: 64
				};
				var sprite = PIXI.Sprite.fromImage("assets/fireball.png");
				sprite.anchor.x = 1;
				sprite.anchor.y = 0.5;
				var dirVector = {x: (projectile.endX - projectile.startX), y: (projectile.endY - projectile.startY)};
				normalize(dirVector);
				projectile.dirVector = dirVector;
				sprite.rotation = Math.atan2(dirVector.y, dirVector.x);
				scaleVector(projectile.dirVector, projectile.speed);
				projectile.x = projectile.startX;
				projectile.y = projectile.startY;
				pointAdd(projectile, projectile.dirVector);
				sprite.position.x = projectile.x;
				sprite.position.y = projectile.y;
				sprite.scale.x = 1/2;
				sprite.scale.y = sprite.scale.x;
				projectile.sprite = sprite;
				stage.addChild(sprite);
				state.projectiles.push(projectile);
			}
		}
	}
}

function removeProjectile(projectile){
	projectile.sprite.visible = false;
	stage.removeChild(projectile.sprite);
	for (var i=0; i<state.projectiles.length; ++i){
		if (state.projectiles[i] === projectile){
			state.projectiles.splice(i, 1);
			break;
		}
	}
}

function damageUnits(point, projectile, tower){
	for (var i=0; i<state.units.length; ++i){
		var unit = state.units[i];
		if (sqrDist(unit, point)<(Math.pow((unit.avgRadius*1.5)+tower.aoe, 2))){
			// Damage calculation
			unit.hp -= projectile.damage;
			// Target elimination
			if (unit.hp <= 0){
				killUnit(unit);
			}
		}
	}
}

function updateProjectile(projectile, now){
	if (projectile.remove === true){
		removeProjectile(projectile);
	}
	if (projectile.type === "plasma"){
		var distVec = {x: (projectile.endX - projectile.x), y: (projectile.endY - projectile.y)};
		if (sqrVecLength(distVec)<projectile.speed*projectile.speed){
			projectile.remove = true;
			projectile.sprite.scale.x = projectile.sprite.scale.x/2.0;
			projectile.sprite.x = projectile.endX;
			projectile.sprite.y = projectile.endY;
			damageUnits({x: projectile.endX, y: projectile.endY}, projectile, tower);
		} else {
			pointAdd(projectile, projectile.dirVector);
			projectile.sprite.x = projectile.x;
			projectile.sprite.y = projectile.y;
		}
	} else if (projectile.type === "laser"){
		var distVec = {x: (projectile.endX - projectile.x), y: (projectile.endY - projectile.y)};
		if (sqrVecLength(distVec)<projectile.speed*projectile.speed){
			projectile.remove = true;
			projectile.x = projectile.endX;
			projectile.y = projectile.endY;
		} else {
			pointAdd(projectile, projectile.dirVector);
		}
		projectile.sprite.x = projectile.x;
		projectile.sprite.y = projectile.y;
		var originVector = {x: (projectile.x-projectile.originX), y: (projectile.y-projectile.originY)};
		var laserLength = vecLength(originVector);
		normalize(originVector);
		projectile.sprite.rotation = Math.atan2(originVector.y, originVector.x);
		projectile.sprite.scale.x = laserLength/projectile.width;
		damageUnits({x: projectile.x, y: projectile.y}, projectile, tower);
	} else if (projectile.type === "granade"){
		if ((projectile.wait != null)&&(projectile.wait > 0)){
			projectile.wait -= 1;
			if (projectile.wait === 0){
				projectile.remove = true;
			}
			projectile.sprite.scale.x = (4 - projectile.wait)/2.0;
			projectile.sprite.scale.y = projectile.sprite.scale.x;
			projectile.sprite.rotation += Math.random()*0.5;
		}
		else
		{
			var distVec = {x: (projectile.endX - projectile.x), y: (projectile.endY - projectile.y)};
			if (sqrVecLength(distVec)<projectile.speed*projectile.speed){
				playSound("explosion");
				projectile.wait = 4;
				//projectile.sprite.visible = false;
				projectile.sprite.destroy();
				var spr = stage.sprite;
				stage.removeChild(spr);
				projectile.sprite = null;
				projectile.sprite = PIXI.Sprite.fromImage('assets/explosion.png');
				projectile.sprite.blendMode = PIXI.BLEND_MODES.SCREEN;
				projectile.sprite.scale.x = 1;
				projectile.sprite.scale.y = 1;
				projectile.sprite.anchor.x = 0.5;
				projectile.sprite.anchor.y = 0.5;
				projectile.sprite.rotation = Math.random()*Math.PI;
				projectile.sprite.x = projectile.endX;
				projectile.sprite.y = projectile.endY;
				//stage.addChild(projectile.sprite);
				damageUnits({x: projectile.endX, y: projectile.endY}, projectile, tower);
			} else {
				pointAdd(projectile, projectile.dirVector);
				projectile.sprite.x = projectile.x;
				projectile.sprite.y = projectile.y;
			}
		}
	}
}

function playerClickedOn(pos){
	if (command != null){
		if ((0<=pos.x)&&(pos.x<state.levelGridWidth)&&(0<=pos.y)&&(pos.y<state.levelGridHeight)){
			if (command === 'd'){
				for (var i=0; i<state.towers.length; ++i){
					var tower = state.towers[i];
					if ((tower.gridX === pos.x)&&(tower.gridY === pos.y)){
						destroyTower(tower);
						break;
					}
				}
			}
			else
			{
				if ((state.buildable[pos.y][pos.x])){
					buildTower(pos.y, pos.x, command);
				}
			}
		}
	}
}

function playerDied(now) {
/*
	//alert('dead');
	//loadLevel(state.currentLevelIndex);
	//renderLevel();
	// Code above moved to renderer
	restartingSince = now;
	restartingUntil = now + restartingLengthMS;
	restarting = true;
	restartingSprite.visible = true;
*/
}

function goToNextLevel() {
	if (levels.length>state.currentLevelIndex+1){
		loadLevel(state.currentLevelIndex+1);
		renderLevel();
		gameStartTime = Date.now();
		currentTime = gameStartTime;
		lastUpdate = 0;//currentTime;
	} else {
		showFinal();
	}
}
