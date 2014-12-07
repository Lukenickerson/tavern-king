RocketBoots.loadComponents([
	"coords",
	"sound_cannon",
	"image_overseer",
	"state_machine",
	"dice",
	"looper",
	"world",
	"stage",
	"physics"
]);

var g = {};
RocketBoots.ready(function(){
	g = new RocketBoots.Game();
	
	console.log(rb);
	
	g.state.transition("preload");
	g.images.load({
		"dirt1" : "dirt1.png"
		,"dirt2" : "dirt2.png"
		,"nsd" : "shirtless_dwarf.png"
		,"owner" : 	"owner_placeholder.png"
		,"pot" : 	"pot_placeholder.png"
		,"barrel" : "barrel_placeholder.png"
		,"table" : 	"table_placeholder.png"
		,"wall" : "wall.png"
	});
	
	//============================================================= STATES ====
	// Tie looping to the Game State
	g.state.get("game").setStart(function(){
		this.$view.fadeIn(300, function(){
			g.gameLoop.start();
		});
		g.world.clearHighlighted();
	}).setEnd(function(){
		g.gameLoop.pause();
		this.$view.hide();
	});
	
	var selectedStart = function(){
		g.state.get("game").$view.show();
		g.selectedLoop.start();
		this.$view.show();
	}
	var selectedEnd = function(){
		//g.state.get("game").$view.hide();
		this.$view.hide();
	}
	
	g.state.add("ownerMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		type: 	"selectedMenu"
	}).add("customerMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		type: 	"selectedMenu"
	}).add("craftMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		type: 	"selectedMenu"
	}).add("furniture", {
		start: function(){
			g.state.get("game").$view.show();
			this.$view.fadeIn();
		},
		end: function(){
			this.$view.hide();
		},
		type: "selectedMenu"
	}).add("remodel", {
		start: function(){
			g.state.get("game").$view.show();
			$(g.mainLayer.element).css("opacity", 0.5);
			this.$view.fadeIn();
		},
		end: function(){
			$(g.mainLayer.element).css("opacity", 1.0);
			this.$view.hide();
		},
		type: "selectedMenu"
	});
	
	g.state.transition("mainmenu");

	// Setup the World
	/*
	g.world.setSizeRange(
		{ x: 0, y: 0 }, 	// min
		{ x: 992, y: 704 }	// max = 32x31, 32x22
	);
	g.world.grid.size = { x: 32, y: 32 };
	*/
	g.world.setSizeRange(
		{ x: 0, y: 0 }, 	// min
		{ x: 1024, y: 704 }	// max = 64x16, 64x11
	);
	g.world.grid.size = { x: 64, y: 64 };
	//g.world.grid.size = { x: 200, y: 200 };	
	
	// Setup Tavern elements, stats, functions and top bar
	g.tavern = {
		$elts : {
			coinsNum : 		$('.coinsNum'),
			popularityNum : $('.popularityNum'),
			servedNum : 	$('.servedNum')	
		},
		coins : 0,
		popularity: 0,
		served : 0,
		canAfford : function(coins){
			return (this.coins >= coins) ? true : false;
		},
		addCoins : function(n){
			this.coins += parseInt(n);
			this.$elts.coinsNum.html(this.coins);
		},
		addPopularity : function(n){
			this.popularity = (this.popularity + n) / 2;
			this.$elts.popularityNum.html(parseInt(this.popularity * 10) / 10);
		},
		addServed : function(n){
			this.served += parseInt(n);
			this.$elts.servedNum.html(this.served);
		},
		drawTopBar : function(){
			this.$elts.coinsNum.html(this.coins);
			this.$elts.popularityNum.html(this.popularity);
			this.$elts.servedNum.html(this.served);	
		}
	};
	
	g.races = {	
		"dwarf" : {}, 
		"elf" : {},
		"human" : {},
		"orc" : {}
	};
	
	g.Character = function(name, race, ent, pos, imageName){
		this.name = name;
		this.race = race;
		this.action	= "target";
		this.targets = [new rb.Coords()];
		this.brainCooldown = g.dice.roll1d(10);
		
		this.entity = ent;
		this.entity.pos.set(pos);
		this.entity.image = g.images.get(imageName);
		this.entity.radius = (g.world.grid.size.x/3);
	}
	g.Character.prototype.performAction = function(){
		var c = this;
		c.brainCooldown--;
		switch (c.action) {
			case "wait":
				if (c.brainCooldown <= 0) {
					c.action = "target";
					c.brainCooldown = g.dice.roll1d(30);
				}
				c.entity.vel.multiply(0.5);
				c.entity.color = "#f55";
				break;
			case "target":
				var randPos = g.world.getRandomPosition();
				c.targets[0].set(randPos);
				c.action = "walk";
				c.entity.color = "#f5f";
				break;
			case "walk":	// Move towards target
				if (c.brainCooldown <= 0) {
					c.action = "wait";
					c.brainCooldown = g.dice.roll1d(30);
				} else {
					var dist = c.entity.pos.getDistance( c.targets[0] );
					if (dist < 30) {
						//c.entity.vel.multiply(0.75);
						if (dist < 10) {
							c.entity.pos.set( c.targets[0] );
							c.entity.vel.clear();
							c.action = "wait";
						}
					} else {
						c.entity.vel.set(c.entity.pos.getUnitVector( c.targets[0] ));
						c.entity.vel.multiply(0.5);
					}
				}
				c.entity.color = "#5f5";
				break;
			default:
				// ??
		}
		
	}
	
	g.Furniture = function(type, ent, pos){
		this.name 	= type;
		this.type	= type;
		this.entity	= ent;
		this.allowCooking 	= false;
		this.allowBrewing 	= false;
		this.allowPlacement	= false;
		// Init
		this.entity.image = g.images.get(type);
		this.entity.size.set(g.world.grid.size);
		this.entity.pos.set(pos);
		this.entity.isMovable = false;
		switch (type){
			case "pot":
				this.allowCooking = true;
				break;
			case "barrel":
				this.allowBrewing = true;
				break;
			case "table":
				this.allowPlacement = true;
				break;
		}
		
		
	}
	
	//g.owner = g.world.addEntity("owner");
	
	//==== THINGS / ENTITIES IN THE WORLD
	g.owner		= null;
	g.customers = [];
	g.furniture = [];
	g.items		= [];
	
	// Add floors & walls
	g.makeWall = function(ent) {
		//console.log("----Make Wall\n", typeof ent, ent);
		ent.image = g.images.get("wall");
		ent.isPhysical = true;
		ent.isMovable = false;	
		g.world.addEntity(ent, "wall");
		g.world.removeEntity(ent, "floor");		
	}
	g.makeFloor = function(ent) {
		//console.log("----Make Floor\n", typeof ent, ent);
		ent.image = g.images.get("dirt" + g.dice.roll1d(2));
		ent.isPhysical = false;
		ent.isMovable = false;
		g.world.addEntity(ent, "floor");
		g.world.removeEntity(ent, "wall");		
	}
	g.buildStructure = function(){
		var ent = {};
		var structNum = 0;
		for (var y = g.world.size.y; y >= 0; y -= g.world.grid.size.y) {
			for (var x = 0; x <= g.world.size.x; x += g.world.grid.size.x) {
				structNum++;
				if (x == 0 || x == g.world.size.x || y == 0) {
					ent = g.world.addNewEntity("wall-"+structNum, ["wall", "remodel"]);
					console.log(ent);
					g.makeWall(ent);			
				} else {
					ent = g.world.addNewEntity("floor-"+structNum, ["floor", "remodel"]);
					console.log(ent);
					g.makeFloor(ent);
				}
				ent.pos = new rb.Coords(x,y);
			}
		}
	}
	g.buildStructure();
	

	g.owner = new g.Character(
		"Tavern Owner",
		"dwarf",
		g.world.addNewEntity("Owner", ["owner", "game"]),
		g.world.getRandomGridPosition(),
		"owner"
	);

	
	g.furniture.push( new g.Furniture(
		"pot",
		g.world.addNewEntity("pot-A", ["furniture", "game"]),
		g.world.getRandomGridPosition()
	));
	g.furniture.push( new g.Furniture(
		"barrel",
		g.world.addNewEntity("barrel-A", ["furniture", "game"]),
		g.world.getRandomGridPosition()
	));
	g.furniture.push( new g.Furniture(
		"table",
		g.world.addNewEntity("table-A", ["furniture", "game"]),
		g.world.getRandomGridPosition()
	));	


	
	for (var i = 0; i < 20; i++) {
		var ent = g.world.addNewEntity("customer-"+i, ["customer", "game"]);
		var cust = new g.Character(
			"Customer",
			"dwarf",
			ent,
			g.world.getRandomPosition(), //new rb.Coords(0,0), //
			"nsd"
		);		
		g.customers.push(cust);
	}
	
	// Done adding entities
	// So setup lists of physical and movable...
	g.world.categorizeEntitiesByGroup();


	//========================================= Setup the Stage and Layers ====
	g.floorLayer = g.stage.addLayer("canvas");
	g.floorLayer
		.connectEntities( g.world.entities.floor )
		.connectEntities( g.world.entities.wall );
	g.floorLayer.drawWithStage = false;
	g.mainLayer = g.stage.addLayer("canvas");
	g.mainLayer
		.connectEntities( g.world.entities.owner )
		.connectEntities( g.world.entities.customer )
		.connectEntities( g.world.entities.furniture );
	g.stage.resize( g.world.size );
	g.stage.camera.set( g.world.getCenter() );

	g.stage.addClickEvent(function(p, e){ 
		console.log("Clicked world position", p);
		var clickableEntGroup = g.state.currentState.name;
		var ne = g.world.getNearestEntity(p, 200, clickableEntGroup);
		console.log(ne);
		if (ne == null) {
			return false;
		}
		console.log(ne.getType());
		switch (ne.getType()) {
			case "owner":
				ne.isHighlighted = true;
				g.state.transition("ownerMenu");
				break;
			case "customer":
				ne.isHighlighted = true;
				g.state.transition("customerMenu");
				break;
			case "furniture":
				ne.isHighlighted = true;
				
				g.state.transition("craftMenu");
				break;
			case "wall":
				ne.isHighlighted = true;
				g.makeFloor(ne);
				g.world.categorizeEntitiesByGroup();
				g.stage.draw(true);
				break;				
			case "floor":
				ne.isHighlighted = true;
				g.makeWall(ne);
				g.world.categorizeEntitiesByGroup();
				g.stage.draw(true);
				break;
			// *** Add other clickable items?
			default:
				//ne.isHighlighted = true;
				g.world.clearHighlighted();
				if (g.state.currentState.getType() == "selectedMenu") {
					g.state.transition("game");
					e.preventDefault();
				}
				break;
		}
	});	
	
	// Setup Loops & modulus actions
	g.gameLoop = new rb.Looper(function(){
		g.world.applyPhysics(g.physics);
		g.stage.draw();
	});
	g.gameLoop.addModulusAction(2, function(){
		g.tavern.addCoins(1);
	});
	g.gameLoop.addModulusAction(1, function(){
		// Loop over customers
		for (var i = 0, cl = g.customers.length; i < cl; i++){
			g.customers[i].performAction();
		}
	});
	
	g.selectedLoop = new rb.Looper(function(){
		g.stage.draw();
	});
	


	window.setTimeout(function(){
		// Start 'er up!
		g.stage.draw(true);
		g.tavern.drawTopBar();
		g.state.transition("game");
	},500);

});