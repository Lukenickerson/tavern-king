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
	//==== WORLD
	var World = function(){
		this.dimensions = 2;
		this.min = new Coords(-300,-300);
		this.max = new Coords(300, 300);
		this.size = new Coords(600, 600);
		this.grid = {
			size : { x: 1, y: 1 }
		};
		this.entityGroups = ["all", "physical", "movable", "physics"];
		this.entities = { 
			"all" : [],
			"physical" : [],
			"movable" : [],
			"physics" : []
		};
		// World traits / booleans
		this.isBounded = false;
	}
	// Sets
	World.prototype.setSizeRange = function(min, max){
		this.min.set(min);
		this.max.set(max);
		var sizeX = Math.abs(max.x) + Math.abs(min.x);
		var sizeY = Math.abs(max.y) + Math.abs(min.y);
		this.size.set( new Coords(sizeX, sizeY) );
	}
	World.prototype.snapToGrid = function(pos){
		pos.x = Math.round(pos.x / this.grid.size.x) * this.grid.size.x;
		pos.y = Math.round(pos.y / this.grid.size.y) * this.grid.size.y;
		return pos;
	}
	World.prototype.clearHighlighted = function(){
		this.loopOverEntities("all",function(entityIndex, ent){
			ent.isHighlighted = false;
		});
	}
	
	
	// Adds
	World.prototype.addEntity = function(ent, groups, isFront){
		if (typeof groups == "string") groups = [groups];
		if (typeof isFront != "boolean") isFront = false;
		var grp = "", groupIndex = -1;
		// Add entity to groups
		for (var t = 0; t < groups.length; t++){
			grp = groups[t];
			this.addEntityGroup(grp);
			//console.log(ent);
			if (!ent.isInGroup(grp)) {  // Is entity not in this group yet?
				groupIndex = (this.entities[grp].push(ent) - 1);
				if (isFront) {
					ent.groups = [grp].concat(ent.groups);
				} else {
					ent.groups.push(grp);
				}
				ent.groupIndices[grp] = groupIndex;
			}
		}
		return ent;
	}
	World.prototype.addNewEntity = function(name, groups){
		var ent = new this.Entity(name,this);
		groups = groups.concat("all");
		ent = this.addEntity(ent, groups);
		this.categorizeEntitiesByGroup();
		return ent;
	}
	World.prototype.addEntityGroup = function(type){
		var typeId = this.entityGroups.indexOf(type);
		if (typeId == -1) {
			typeId = (this.entityGroups.push(type) - 1);
			this.entities[type] = [];
		}
		return typeId;
	}
	World.prototype.removeEntity = function(ent, remGroups){
		//console.log("Remove groups", remGroups, typeof remGroups);
		if (typeof remGroups == "string") remGroups = [remGroups];
		else if (typeof remGroups == "undefined") remGroups = ["all"];
		// Remove "all" groups?
		if (remGroups.indexOf("all") != -1) {	
			remGroups = ent.groups.join("/").split("/");
		}
		//console.log("Remove groups", remGroups, ent.groups);
		var remGroup = "", remGroupIndex = -1;
		// Loop over groups to remove
		for (var g = 0; g < remGroups.length; g++){
			remGroup = remGroups[g];
			if (ent.isInGroup(remGroup)) {
				
				remGroupIndex = ent.groupIndices[remGroup];
				//console.log("Removing", remGroup, remGroupIndex);
				// Remove from group array
				//this.entities[remGroup].splice(remGroupIndex, 1);
				// ^ can't splice this out or all the indices get messed up
				this.entities[remGroup][remGroupIndex] = null;
				// *** ^ This might cause memory issues??
				// Remove from entity's properties
				ent.groups.splice( ent.groups.indexOf(remGroup), 1 );
				delete ent.groupIndices[remGroup];
			}
		}
		return ent;
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
	World.prototype.getRandomGridPosition = function(){
		var randPos = this.getRandomPosition();
		return this.snapToGrid(randPos);
	}
	World.prototype.getCenter = function(){
		var x = this.min.x + (this.size.x / 2);
		var y = this.min.y + (this.size.y / 2);
		return new Coords(x,y);
	}
	World.prototype.getNearestEntity = function(pos, range, type){
		var nearestEnt = null;
		var nearestDistance = range;
		// *** get a subset of all entities based on range?
		// *** then only loop over them
		//console.log("------\nLoop over", type);
		this.loopOverEntities(type, function(entityIndex, ent){
			var d = ent.pos.getDistance(pos);
			//console.log(ent, d);
			if (d < nearestDistance) {
				nearestEnt = ent;
				nearestDistance = d;
			}			
		});
		return nearestEnt;
	}
	// Others
	World.prototype.loopOver = function(ents, fn){
		for (var i = 0, el = ents.length; i < el; i++){
			fn(i, ents[i]);
		}		
	}
	World.prototype.loopOverEntities = function(type, fn){
		var ents;
		if (typeof this.entities[type] == 'object') {
			ents = this.entities[type];
			for (var i = 0, el = ents.length; i < el; i++){
				if (ents[i] != null) {
					fn(i, ents[i]);
				}
			}			
		}
	}
	World.prototype.keepCoordsInBounds = function(coords){
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
	World.prototype.isEntityInBounds = function(ent){
		var coords = ent.pos;
		return (coords.x >= this.min.x && coords.x <= this.max.x
			&& coords.y >= this.min.y && coords.y <= this.max.y);	
	}
	World.prototype.categorizeEntitiesByGroup = function(){
		var w = this;
		w.entities.physical = [];
		w.entities.movable = [];
		w.entities.physics = [];
		w.loopOverEntities("all", function(entityIndex, ent){
			if (ent.isPhysical) {
				w.entities.physical.push(ent);
				if (ent.isMovable) w.entities.physics.push(ent);
			}
			if (ent.isMovable) 
				w.entities.movable.push(ent);
		});
	}
	World.prototype.applyPhysics = function(physics){
		physics.apply(this);	
	}
	

	
	//==== Entity
	World.prototype.Entity = function(name, world){
		this.name = name;
		this.groups	= [];
		this.groupIndices = {};
		this.world 	= world;
		this.stageOffset = new Coords(0,0); // for minor pixel offsets
		this.pos 	= new Coords(0,0);
		this.vel 	= new Coords(0,0);
		this.mass	= 1;
		this.size 	= new Coords(world.grid.size.x, world.grid.size.y);
		this._halfSize = new Coords(world.grid.size.x/2, world.grid.size.y/2);
		this.radius = parseInt(world.grid.size.x/2);
		this.image	= null;
		this.color 	= "#666";
		this.collisionShape = "circle"; // *** doesn't matter yet
		// various on/off states
		this.isHighlighted 	= false;
		this.isPhysical 	= true;
		this.isMovable		= true;
		// Custom draw functions
		this.customDraw = {
			highlighted : null
		};
	}
	World.prototype.Entity.prototype.getType = function(){
		return this.groups[0];
	}
	World.prototype.Entity.prototype.isInGroup = function(group){
		return (this.groups.indexOf(group) == -1) ? false : true;
	}
	/*
	World.prototype.Entity.prototype.isEqual = function(ent){
		return "????";
	}
	*/

	
	
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent("world", "World", World);
	} else window.World = World;
})();