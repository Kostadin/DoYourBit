var state = null;
var renderer = null;
var stage = null;

var levels = [];
var TILE_HEIGHT = 32;
var TILE_WIDTH = 32;
var HALF_TILE_HEIGHT = TILE_HEIGHT/2.0;
var HALF_TILE_WIDTH = TILE_WIDTH/2.0;

//var player = null;
//var guards = null;

//var playerAnimations;
//var guardAnimations;

var gameStartTime = null;
var currentTime = null;

var STEP_TIME = Math.floor(1000/30);
var PLAYER_COMPLETE_MOVEMENT_MS = 1000;
var ZERO_EPS = 0.1;

//var PLAYER_SPEED = 125;
//var GUARD_SPEED = 100;

//var MINION_ANIM_SCALE = 0.1;
//var PLAYER_ANIM_SCALE = 0.34;
//var GUARD_ANIM_SCALE = 0.18;

var restartingSprite = null;
var restarting = false;
var restartingUntil = null;
var restartingLengthMS = 2000;

var scrollSprite = null;
var showingScroll = false;

//var finalSprite1 = null;
//var finalSprite2 = null;
//var fadeSprite = null;
//var showingFinal = false;
var finalStartTimeMS = null;
//var blendAfterMS = 800;
//var blendForMS = 500;
//var fadeAfterMS = 10000;
//var reloadAfterMS = 15000;
//var MAX_HP = 1000;
//var health;
//var money;
//var command = null;
