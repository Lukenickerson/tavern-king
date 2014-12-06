/*
	Physics
	Physics class
	By Luke Nickerson, 2014
*/
(function(){

	var Physics = function(){
	
	}
	Physics.prototype.applyVelocity = function(entityArray){
		for (var i = 0, el = entityArray.length; i < el; i++){
			var ent = entityArray[i];
			ent.pos.add( ent.vel );
		}
	}

	
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent("physics", "Physics", Physics);
	} else window.Physics = Physics;
})();