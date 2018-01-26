//Audio objects
//var backgroundTrack = new Audio("sound/bg_music.mp3");
//Looping

// backgroundTrack.addEventListener('ended', function() {
//     this.currentTime = 0;
//     this.play();
// }, false);

//backgroundTrack.volume = 0.4;

//var mainTheme = new Audio("sound/theme.mp3");

// mainTheme.addEventListener('ended', function() {
//     this.currentTime = 0;
//     this.play();
// }, false);

//var spikesFX = new Audio("sound/spikes.mp3");

//var stepsFX = new Audio("sound/footsteps_stones.mp3");

// stepsFX.addEventListener('ended', function() {
//     this.currentTime = 0;
//     this.play();
// }, false);

//var openDoorFX = new Audio("sound/open_door.mp3");

//var finalExplosion = new Audio("sound/final_explosion.mp3");

//mainTheme.play();

var soundBoard = {
	pew: "sound/pew.mp3",
	splash: "sound/splash.mp3",
	explosion: "sound/explosion.mp3"
};

var pewSFX = new Audio("sound/pew.mp3")
var splashSFX = new Audio("sound/splash.mp3");
var explosionSFX = new Audio("sound/explosion.mp3");

var MAX_SOUNDS = 15;
var max_sounds = MAX_SOUNDS;

function soundTake(){
	max_sounds++;
	this.removeEventListener('ended', soundTake, false);
	//console.log('Max sounds restored: ' + max_sounds);
}

function soundDrop(){
	this.pause();
	max_sounds++;
	//console.log("pending");
	this.removeEventListener('waiting', soundDrop, false);
	//console.log('Max sounds restored (paused): ' + max_sounds);
}

function playSound(soundName){
	//console.log(max_sounds);
	if(max_sounds > 0){
		max_sounds--;
		//console.log('Max sounds lowered: ' + max_sounds);
		var sound = new Audio(soundBoard[soundName]);
		sound.loop = false;
		sound.play();
		// sound.addEventListener('waiting', soundDrop, false);
		sound.addEventListener('ended', soundTake, false);
	}
}
