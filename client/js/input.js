function handleClick(x, y){
	if (!showingScroll){
		var pos =  realToMapPos({x: x, y: y});
		//console.log(pos);
		playerClickedOn( pos );
	} else {
		if (!showingFinal){
			scrollSprite.visible = false;
			showingScroll = false;
		}
	}
}

function addMouseHandler(){
	$("body").on('keydown', function (e){
		command = String.fromCharCode(e.which).toLowerCase();
	});
	$("canvas").on("mousedown", function(event) {
		// handleClick(event.offsetX, event.offsetY);
	});
	$("canvas").on("touchstart", function(event) {
		// var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
		// handleClick(touch.clientX, touch.clientY);
	});
}
