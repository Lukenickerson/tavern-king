/*
	Entity
	Entity class
	By Luke Nickerson, 2014
*/
(function(){

	//=========================================================================
	//==== Entity
	
	var Entity = function(name, world){
		this.name = name;
		this.groups	= [];
		this.groupIndices = {};
		this.world 	= world;
		this.stageOffset = new this.Coords(0,0); // for minor pixel offsets
		this.pos 	= new this.Coords(0,0);
		this.vel 	= new this.Coords(0,0);
		this.mass	= 1;
		this.size 	= new this.Coords(world.grid.size.x, world.grid.size.y);
		this._halfSize = new this.Coords(world.grid.size.x/2, world.grid.size.y/2);
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
	
	Entity.prototype.getType = function(){
		return this.groups[0];
	}
	Entity.prototype.isInGroup = function(group){
		return (this.groups.indexOf(group) == -1) ? false : true;
	}
	/*
	World.prototype.Entity.prototype.isEqual = function(ent){
		return "????";
	}
	*/

	// Bring in a pointer to the Coords class from RocketBoots
	Entity.prototype.Coords = (typeof RocketBoots.Coords == "function") ? RocketBoots.Coords : Coords;
	
	// Install as RocketBoots component
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent("entity", "Entity", Entity);
	} else window.Entity = Entity;
})();
