/*
	World
	World class
	By Luke Nickerson, 2014
*/
(function(){

	if (typeof RocketBoots.Coords == "function") {
		var Coords = RocketBoots.Coords;
	} else if (typeof Coords == "function") {
		var Coords = Coords;
	} else {
		console.error("Coords class not found in world.js. This may cause errors.");
		var Coords = function(x,y){
			this.x = x;
			this.y = y;
		}
	}


	var World = function(){
		this.dimensions = 2;
		this.min = new Coords(-300,-300);
		this.max = new Coords(300, 300);
		this.size = new Coords(600, 600);
		this.grid = {
			size : { x: 1, y: 1 }
		};
		this.entityTypes = [];
		this.entities = [];
	}
	// Sets
	World.prototype.setSizeRange = function(min, max){
		this.min.set(min);
		this.max.set(max);
		var sizeX = Math.abs(max.x) + Math.abs(min.x);
		var sizeY = Math.abs(max.x) + Math.abs(min.x);
		this.size.set( new Coords(sizeX, sizeY) );
	}
	// Adds
	World.prototype.addEntity = function(ent){
		this.entities.push(ent);
		return ent;
	}
	World.prototype.addNewEntity = function(type){
		var typeId = this.entityTypes.indexOf(type);
		if (typeId == -1) {
			typeId = (this.entityTypes.push(type) - 1);
		}
		return this.addNewEntityByTypeId(typeId);
	}
	World.prototype.addNewEntityByTypeId = function(typeId){
		var ent = new this.Entity(typeId, this);
		return this.addEntity(ent);
	}
	// Gets
	World.prototype.getRandomPosition = function(dice){
		if (typeof dice == "undefined") {
			var dice = new RocketBoots.Dice();
		}
		var x = dice.getRandomIntegerBetween(this.min.x, this.max.x);
		var y = dice.getRandomIntegerBetween(this.min.y, this.max.y);
		return new Coords(x,y);
	}
	World.prototype.getCenter = function(){
		var x = this.min.x + (this.size.x / 2);
		var y = this.min.y + (this.size.y / 2);
		return new Coords(x,y);
	}
	World.prototype.getNearestEntity = function(pos, range){
		var nearestEnt = null;
		var nearestDistance = 9999999;
		// *** get a subset of all entities based on range?
		// *** then only loop over them
		this.loopOverEntities(function(entityIndex, ent){
			var d = ent.pos.getDistance(pos);
			if (d < nearestDistance) {
				nearestEnt = ent;
				nearestDistance = d;
			}
		});
		return nearestEnt;
	}
	// Others
	World.prototype.loopOverEntities = function(fn){
		for (var i = 0, el = this.entities.length; i < el; i++){
			fn(i, this.entities[i]);
		}		
	}
	World.prototype.keepCoordsInRange = function(coords){
		var wasOutOfRange = false;
		if (coords.x < this.min.x) {
			coords.x = this.min.x;
			wasOutOfRange = true;
		} else if (coords.x > this.max.x) {
			coords.x = this.max.x;
			wasOutOfRange = true;
		}
		if (coords.y < this.min.y) {
			coords.y = this.min.y;
			wasOutOfRange = true;
		} else if (coords.y > this.max.y) {
			coords.y = this.max.y;
			wasOutOfRange = true;
		}
		return wasOutOfRange;
	}
	World.prototype.applyPhysics = function(physics){
		physics.applyVelocity(this.entities);	
	}
	

	
	//==== Entity
	World.prototype.Entity = function(typeId, world){
		this.typeId	= typeId;
		this.world 	= world;
		this.pos 	= new Coords(0,0);
		this.vel 	= new Coords(0,0);
		this.size 	= new Coords(world.grid.size.x, world.grid.size.y);
		this._halfSize = new Coords(5,5);
		this.image	= null;
		// various on/off states
		this.isHighlighted = false;
		// Custom draw functions
		this.customDraw = {
			highlighted : null
		};
	}
	World.prototype.Entity.prototype.getType = function(){
		return this.world.entityTypes[this.typeId];
	}

	
	
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent("world", "World", World);
	} else window.World = World;
})();