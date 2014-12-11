RocketBoots.loadComponents([
	"coords",
	"sound_cannon",
	"image_overseer",
	"state_machine",
	"dice",
	"looper",
	"entity",
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
		,"dwarf1" : "dwarf1.png"
		,"dwarf2" : "dwarf2.png"
		,"dwarf3" : "dwarf3.png"
		,"dwarf4" : "dwarf4.png"
		,"dwarf5" : "dwarf5.png"
		,"dwarf6" : "dwarf6.png"
		,"owner" : 	"dwarf_crowned1.png"
		,"pot" : 	"pot1.png"
		,"barrel" : "barrel1.png"
		,"table" : 	"table1.png"
		,"wall" : "wall.png"
		,"meal" : "food1.png"
	});
	
	g.sounds.loadSounds(["tk_beat", "coins", "durr"], "sounds/", ".wav");
	
	
	//=========== GAME CONSTANTS
	g.PI2 = Math.PI*2;
	
	
	//============================================================= STATES ====
	
	g.hasSeenIntro = false;
	g.selectedEnt = null;
	
	$('.playMusic').click(function(){
		g.sounds.on();
		g.sounds.play("tk_beat", true);
	});
	$('.toggleSound').click(function(){
		var isSoundOn = g.sounds.toggle();
		if (isSoundOn) {
			//g.sounds.play("tk_beat", true);
		} else {
			g.sounds.stop("tk_beat");
		}
		alert("Sound is " + ((isSoundOn) ? "ON" : "OFF"));
	});
	
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
		if (g.selectedEnt.pos.x < g.world.getCenter().x) {
			this.$view.addClass("right");
		} else {
			this.$view.addClass("left");
		}
		this.$view.find('.subList').hide();
		this.update();
	}
	var selectedEnd = function(){
		//g.state.get("game").$view.hide();
		g.selectedLoop.stop();
		this.$view.hide().removeClass("right").removeClass("left");
	}
	
	g.state.add("intro", {
		start: 	function(){ 
			if (g.hasSeenIntro) {
				g.state.transition("game");
			} else {
				this.$view.show(); 
				g.state.get("game").$view.show();
				g.hasSeenIntro = true;
			}
		},
		end: 	function(){ 
			this.$view.hide(); 
		},
		//type: 	"selectedMenu"
		
	}).add("ownerMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		type: 	"selectedMenu"
		
	}).add("customerMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		update: function(){
			var c = g.selectedEnt.character;
			var h = "";
			var a = ["hungry","thirsty","annoyed","disgusted","bored", "tired"];
			var trait, qualName, num;
			for (var i = 0; i < a.length; i++){
				trait = a[i];
				qualName = "";
				num = c[trait];
				if (num < 20) qualName = g.traits[trait][0];
				else if (num < 40) qualName = g.traits[trait][1];
				else if (num < 60) qualName = g.traits[trait][2];
				else if (num < 80) qualName = g.traits[trait][3];
				else qualName = g.traits[trait][4];
				
				h += '<li>' + qualName + ': ' + num + '</li>';
			}
			h += '<li>Rating: ' + c.rating + ' / 5</li>';
			this.$view.find('.traitList').html(h);
			this.$view.find('.action').html(c.action);
		},
		type: 	"selectedMenu"
		
	}).add("craftMenu", {
		start: 	selectedStart,
		end: 	selectedEnd,
		type: 	"selectedMenu",
		update: function(){
			var s = this;
			s.$view.find('.subList').hide();
			if (g.selectedEnt.craftingRecipe != null) {
				s.$view.find('.craftProgress').html(g.selectedEnt.craftingRecipe.name);
			}
			h = "";
			for (var i = 0; i < g.items.recipes.length; i++){
				recipe = g.items.recipes[i]
				h += '<li>'
					+ '<button type="button" data-recipe="' + i + '">'
					+ recipe.name
					+ ' (x' + recipe.makes + ')'
					+ ' Cost: ' + g.items.getRecipeCost(recipe)
					+ '</button>'
					+ '</li>';
			}
			s.$view.find('.cookList').html(h)
				.off("click").on("click", "button", function(e){
					var recipeIndex = parseInt($(e.target).data("recipe"));
					var recipe = g.items.recipes[recipeIndex];
					
					g.owner.setGoal({ 
						action: "cook", 
						ent: 	g.selectedEnt, 
						recipe: recipe 
					});
					
					g.state.transition("game");
				});
			s.$view.find('.openSubList').off("click").on("click", function(e){
				$(this).next('.subList').slideDown();
			});
		
		}
		
	}).add("furniture", {
		start: function(){
			g.state.get("game").$view.show();
			this.$view.fadeIn();
			this.$view.find('.buy').off("click").on("click", function(e){
				var furnitureIndex = parseInt($(this).data("furniture"));
				var furniture = g.items.furniture[furnitureIndex];
				var isBought = g.tavern.buyFurniture(furniture);
				if (isBought) g.state.transition("game");
			});			
		},
		end: function(){
			this.$view.hide();
		},
		type: "selectedMenu",
		update: function(){

		}
		
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
	
	

	//=================================== Setup the World & Tavern
	
	g.world.setSizeRange(
		{ x: 0, y: 0 }, 	// min
		{ x: 1024, y: 704 }	// max = 64x16, 64x11
	);
	g.world.grid.size = { x: 64, y: 64 };
	
	/*
	g.world.setSizeRange(
		{ x: 0, y: 0 }, 	// min
		{ x: 1024, y: 640 }	// max 
	);
	g.world.grid.size = { x: 128, y: 128 };	
	*/
	
	// Setup Tavern elements, stats, functions and top bar
	g.tavern = {
		$elts : {
			coinsNum : 		$('.coinsNum'),
			ratingNum : 	$('.ratingNum'),
			servedNum : 	$('.servedNum')	
		},
		customerCount : 0,
		coins : 100,
		rating: 0,
		served : 0,
		canAfford : function(coins){
			return (this.coins >= coins) ? true : false;
		},
		buy : function(cost, fn){
			if (this.canAfford(cost)) {
				this.addCoins(-1 * cost);
				fn();
				return true;
			} else {
				// play thud/error noise
				g.sounds.play("durr");
				alert("You cannot afford that.\nYou need " 
					+ (cost - this.coins) + " more coins."
				);
				return false;
			}
		},
		buyCooking : function(recipe, fn){
			var cost = g.items.getRecipeCost(recipe);
			return this.buy(cost, fn);
		},
		buyFurniture : function(furniture){
			return this.buy(furniture.cost, function(){
				g.createFurniture(furniture.type);
			});
		},
		addCoins : function(n){
			g.sounds.play("coins");
			this.coins += parseInt(n);
			this.$elts.coinsNum.html(this.coins);
		},
		addRating : function(n){
			this.rating = ((this.rating * 9) + n) / 10;
			this.$elts.ratingNum.html(parseInt(this.rating * 10) / 10);
		},
		addServed : function(n){
			this.served += parseInt(n);
			this.$elts.servedNum.html(this.served);
		},
		drawTopBar : function(){
			this.$elts.coinsNum.html(this.coins);
			this.$elts.ratingNum.html(this.rating);
			this.$elts.servedNum.html(this.served);	
		},
		addCustomers : function(){
			var maxCustomers = this.rating * 10;
			if (g.tavern.customerCount < maxCustomers) {
				var dSides = Math.round(60 - (this.rating*10));
				if (g.dice.roll1d(dSides) < 10) {
					var name = "Customer-" + g.dice.roll1d(999999);
					// Place at top of map
					var pos = g.world.getRandomPosition();
					pos.y = g.world.max.y;
					// Create customer character, initially walking
					var cust = g.createCustomer(name, pos);
					cust.setRandomTarget();
					cust.action = "walk";
					
					cust.entity.vel.y = -1;
					
					//console.log(cust.entity);
					//g.world.categorizeEntitiesByGroup();
				}
			}
		}
	};
	

	
	//=================================================== CREATE FURNITURE ====
	
	g.items = {
		recipes : [
			{
				"name" : "Cobblestone Biscuits", "heartiness" : 1, "makes" : 6, 
				"imageName" : "meal"
			},{
				"name" : "Onion Stew", "heartiness" : 2, "makes" : 6,
				"imageName" : "meal"
			},{
				"name" : "Kobold Sandwich", "heartiness" : 3, "makes" : 8,
				"imageName" : "meal"
			},{
				"name" : "Kraken with Noodles", "heartiness" : 4, "makes" : 8,
				"imageName" : "meal"
			},{
				"name" : "Tarrasque Steak", "heartiness" : 5, "makes" : 8,
				"imageName" : "meal"
			}
		],
		furniture : [
			{
				name : "Cooking Pot", type : "pot", cost : 1000
			},{
				name : "Table", type : "table", cost : 1000
			}
		]
		,getFoodPrice : function(recipe){
			return (Math.pow((recipe.heartiness * 2), 2));
		}
		,getRecipeCost : function(recipe){
			return Math.floor(this.getFoodPrice(recipe) * recipe.makes * 0.3);
		}
	};
	
	g.world.addEntityGroup("item");
	
	g.createItem = function(recipe, type, pos){
		var ent = g.world.addNewEntity(
			type + "-" + g.dice.roll1d(100000),
			[type, "item", "game"]
		);
		if (typeof pos == "undefined") pos = g.world.getRandomGridPosition();
		ent.pos.set(pos);
		ent.stageOffset = new rb.Coords(
			g.dice.getRandomIntegerBetween(-8,8),
			g.dice.getRandomIntegerBetween(-8,8)
		);
		
		ent.image = g.images.get(recipe.imageName);
		// Items are smaller usually
		ent.radius = parseInt(g.world.grid.size.x/4);
		ent.isPhysical = false;
		// Unique for items
		ent.recipe = recipe;

	}
	
	g.setPosAwayFromEdge = function(pos){
		if (pos.x <= 0) pos.x += g.world.grid.size.x;
		else if (pos.x >= g.world.max.x) pos.x -= g.world.grid.size.x;
		if (pos.y <= 0) pos.y += g.world.grid.size.y;
		else if (pos.y >= g.world.max.y) pos.y -= g.world.grid.size.y;	
	}
	
	g.createFurniture = function(type, pos){
		var ent = g.world.addNewEntity(
			type + "-" + g.dice.roll1d(100000),
			[type, "furniture", "game"]
		);
		if (typeof pos == "undefined") {
			pos = g.world.getRandomGridPosition();
			g.setPosAwayFromEdge(pos);
		}
		ent.pos.set(pos);
		
		ent.craftingRecipe	= null;	// Is this thing crafting/cooking?
		ent.isFurniture		= true;
		ent.allowCooking 	= false;
		ent.allowBrewing 	= false;
		ent.allowPlacement	= false;
		// Init
		ent.image = g.images.get(type);
		ent.size.set(g.world.grid.size);
		ent.isMovable = false;
		switch (type){
			case "pot":
				ent.allowCooking = true;
				break;
			case "barrel":
				ent.allowBrewing = true;
				break;
			case "table":
				ent.allowPlacement = true;
				break;
		}
		if (type == "pot") {
			g.world.addEntity(ent, "illumination");
		}
	}
	
	g.createFurniture("pot"); 
	g.createFurniture("barrel");
	g.createFurniture("table");
	
	
	//================================================== CREATE STRUCTURES ====
	
	// Add floors & walls
	g.makeWall = function(ent) {
		//console.log("----Make Wall\n", typeof ent, ent);
		ent.image = g.images.get("wall");
		ent.isPhysical = true;
		ent.isMovable = false;	
		g.world.addEntity(ent, "wall", true);
		g.world.removeEntity(ent, "floor");		
	}
	g.makeFloor = function(ent) {
		//console.log("----Make Floor\n", typeof ent, ent);
		ent.image = g.images.get("dirt" + g.dice.roll1d(2));
		ent.isPhysical = false;
		ent.isMovable = false;
		g.world.addEntity(ent, "floor", true);
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
					//console.log(ent);
					g.makeWall(ent);			
				} else {
					ent = g.world.addNewEntity("floor-"+structNum, ["floor", "remodel"]);
					//console.log(ent);
					g.makeFloor(ent);
				}
				ent.pos = new rb.Coords(x,y);
			}
		}
	}
	g.buildStructure();
	
	//============================================ CREATE PEOPLE

	g.races = {	
		"dwarf" : {}, 
		"elf" : {},
		"human" : {},
		"orc" : {}
	};
	g.traits = {
		"hungry" : ["Starving", "Hungry", "Peckish", "Full", "Stuffed"],
		"thirsty" : ["Dehydrated", "Parched", "Thirsty", "Quenched", "Hydrated"],
		"annoyed" : ["Exasperated", "Annoyed", "Frustrated", "Pleasant", "Happy"],
		"disgusted" : ["Revolted", "Disgusted", "Queasy", "Pleased", "Delighted"],
		"bored" : ["Bored", "Disinterested", "Inattentive", "Entertained", "Exhilarated"],
		"tired" : ["Exchausted", "Tired", "Sluggish", "Rested", "Bright Eyed"]
	};
	
	g.Character = function(name, race, ent){
		this.name 		= name;
		this.race 		= race;
		this.isAutomaton = false;
		this.action		= "think";
		this.actionEnt 	= null;
		this.goal = {
			action : 	null,
			pos : 		null,
			ent : 		null,
			recipe :	null
		};
		this.targetPos = new rb.Coords();
		this.brainCooldown = g.dice.roll1d(2);
		this.speed = 0.5 + g.dice.roll1d(5)/10;
		this.viewingDistance = 200;
		this.itemRange 		= (ent.size.x * 1.1); 	// how close to interact w/ something
		this.arrivalRange	= 10; //(ent.size.x / 2); 	// how close to arrive when walking
		this.slowRange		= (ent.size.x * 2);		// how close to arrival before slowing down
		
		this.hungry 	= 50;
		this.thirsty 	= 50;
		this.annoyed 	= 75;
		this.disgusted	= 75;
		this.bored		= 75;
		this.tired		= 50;
		this.rating		= 0;
		
		this.entity = ent;
		this.entity.radius = parseInt(g.world.grid.size.x/3);
	}
	g.Character.prototype.setAction = function(action){
		this.action = action;
		return this;
	}
	g.Character.prototype.setGoal = function(goalObj){
		if (typeof goalObj == "string") goalObj = { action: goalObj };
		this.goal.action 	= goalObj.action;
		this.goal.pos 		= (goalObj.pos || null);
		this.goal.ent		= (goalObj.ent || null)
		this.goal.recipe	= (goalObj.recipe || null);
		return this;
	}
	g.Character.prototype.passTime = function(){
		var c = this;
		c.hungry--;
		//c.thirst--;
		//c.annoyed
		//c.disgusted
		c.bored--;
		c.tired--;
		c.rating = 5 * ((c.hungry + c.annoyed + c.disgusted + c.bored + c.thirsty) / 500);
		// Check thresholds
		if (c.hungry <= 0) {
			c.annoyed--;
			c.hungry = 0;
		} else if (c.hungry > 100) {
			c.annoyed += 2;
			c.hungry = 100;
		}
		// *** optimize checks below w/ if-statements
		c.thirsty 	= Math.min(Math.max(c.thirsty, 0), 100);
		c.annoyed 	= Math.min(Math.max(c.annoyed, 0), 100);
		c.disgusted = Math.min(Math.max(c.disgusted, 0), 100);
		c.bored 	= Math.min(Math.max(c.bored, 0), 100);
		c.tired 	= Math.min(Math.max(c.tired, 0), 100);
		return this;
	}
	g.Character.prototype.performAction = function(){
		var c = this;
		c.brainCooldown--;
		switch (c.action) {

			case "think":					// Come up with a new goal
				c.entity.vel.multiply(0.2);
				if (c.isAutomaton) {
				
				} else {
					if (c.annoyed < 15 || c.tired <= 15) c.goal.action = "leave";
					else if (c.hungry < 60) c.goal.action = "eat";
					else if (c.bored < 75) c.goal.action = "walk";
					else c.goal.action = "rest";
				}
				c.action = "plan";
				c.entity.color = "#55f";
				break;
			case "plan":					// Figure out how to get the goal
				c.entity.vel.multiply(0.2);
				c.plan();
				c.entity.color = "#ff5";
				break;
			case "walk":					// Move towards target
				c.bored += 2;
				if (c.brainCooldown <= 0) {
					c.action = "think";
					c.brainCooldown = g.dice.roll1d(20);
				} else {
					var dist = c.entity.pos.getDistance( c.targetPos );
					if (dist < c.arrivalRange) {
						c.entity.pos.set( c.targetPos );
						c.entity.vel.clear();
						c.action = "think";
					} else if (dist < c.slowRange) {
						c.entity.vel.set(c.entity.pos.getUnitVector( c.targetPos ));
						c.entity.vel.multiply(c.speed/10);

					} else {
						c.entity.vel.set(c.entity.pos.getUnitVector( c.targetPos ));
						c.entity.vel.multiply(c.speed);
					}
				}
				c.entity.color = "#5f5";
				break;
			case "grab":
				if (c.actionEnt == null) { 	// Item already disappeared?
					// just re-plan
				} else {					// Grab it
					c.actionEnt.pos.set(c.entity.pos);
				}
				c.entity.vel.multiply(0.2);
				c.action = "plan";
				c.entity.color = "#fff";
				break;
			case "eat":						// Eating time
				if (c.actionEnt == null) { 	// Item already disappeared?
					c.action = "plan";
				} else {					// Item's there --> OM NOM NOM
					// Pay for the food
					var price = g.items.getFoodPrice(c.actionEnt.recipe);
					g.tavern.addCoins(price);
					g.tavern.addServed(1);
					// Nom is down
					c.hungry += (c.actionEnt.recipe.heartiness * 15);
					g.world.removeEntity(c.actionEnt);
					console.log("OM NOM", c.hungry);
					c.action = "think";
				}
				c.entity.vel.multiply(0.2);
				c.actionEnt = null;
				c.entity.color = "#000";
				break;
			case "rest":					// Be Lazy
			default:
				if (c.brainCooldown <= 0) {
					c.action = "think";
					c.brainCooldown = g.dice.roll1d(30);
				}
				c.entity.vel.multiply(0.5);
				c.entity.color = "rgba(255,85,85,0.4)";
				break;
		}
		return this;
	}
	g.Character.prototype.plan = function(){
		var c = this;
		c.actionEnt = null;
		// Figure out how I can achieve my goals!
		switch(c.goal.action){
			case "rest":
				c.action = "rest";	// that was easy
				break;
			case "cook":
				if (c.goal.ent == null) {
					c.goal.ent = g.world.getNearestEntity(c.entity.pos, c.viewingDistance, "pot");
				}
				// Still no destination?
				if (c.goal.ent == null) {
					c.setRandomTarget();
					c.action = "walk";
				} else {
					var d = c.entity.pos.getDistance(c.goal.ent.pos);
					if (d <= c.itemRange) {
						var cost = g.items.getRecipeCost(c.goal.recipe);
						// If you can afford it, cook up a number of items
						g.tavern.buyCooking(c.goal.recipe, function(){
							c.goal.ent.craftingRecipe = c.goal.recipe;
							for (var i = 0; i < c.goal.recipe.makes; i++){
								g.createItem(c.goal.recipe, "meal", c.goal.ent.pos);
							}
						});
						c.setGoal("rest");
					} else {
						c.targetPos.set(c.goal.ent.pos);
						c.action = "walk";
					}
				}
				break;
			case "eat":
				// Find nearest meal and go towards it
				var ne = g.world.getNearestEntity(c.entity.pos, c.viewingDistance, "meal");
				if (ne == null) {
					c.setRandomTarget();
					c.action = "walk";
				} else {
					var d = ne.pos.getDistance(c.entity.pos);
					//console.log("Food is", d, " away!", c.entity.radius, c.itemRange);
					// If close enough, just eat it or grab it
					if (d <= c.entity.radius) {
						c.action = "eat";
						c.actionEnt = ne;
					} else if (d <= c.itemRange) {
						c.action = "grab";
						c.actionEnt = ne;
					} else {
						c.targetPos.set(ne.pos);
						c.action = "walk";
					}
				}
				break;
			case "leave":
				var pos = new rb.Coords(c.entity.pos.x, g.world.size.y + 100);
				this.targetPos.set(pos);
				//console.log("Time to leave", pos);
				c.action = "walk";
				break;
			case "walk":
			default:
				c.setRandomTarget();
				c.action = "walk";
				break;
		}
	}
	g.Character.prototype.setRandomTarget = function(){
		// *** avoid walls
		var randPos = g.world.getRandomPosition();
		this.targetPos.set(randPos);
		return this;
	}
	g.Character.prototype.vote = function(){
		g.tavern.addRating(this.rating);
		return this;
	}
	
	g.createCustomer = function(name, pos){
		var ent = g.world.addNewEntity(name, ["customer", "game", "customerMenu"]);
		if (typeof pos == "undefined") {
			pos = g.world.getRandomGridPosition();
			g.setPosAwayFromEdge(pos);
		}
		ent.pos.set(pos);
		ent.image = g.images.get("dwarf" + g.dice.roll1d(6));		
		ent.character = new g.Character(name, "dwarf", ent);
		return ent.character;
	};
	
	(function(){
		var c;
		for (var i = 0; i < 20; i++) {
			c = g.createCustomer("initial-customer-"+i);
			if (g.dice.roll(4) > 1) {
				c.setRandomTarget().setAction("walk");
			}
		}
	})();
	
	g.owner = new g.Character(
		"Tavern Owner",
		"dwarf",
		g.world.addNewEntity("Owner", ["owner", "game"])
	);
	
	g.owner.entity.mass *= 3;
	g.owner.speed *= 4;
	g.owner.entity.pos.set( g.world.getRandomGridPosition() );
	g.owner.entity.image = g.images.get("owner");
	g.owner.entity.character = g.owner;
	g.owner.isAutomaton = true;
	
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
		.connectEntities( g.world.entities.furniture )
		.connectEntities( g.world.entities.item );
	g.stage.resize( g.world.size );
	g.stage.camera.set( g.world.getCenter() );

	g.stage.addClickEvent(function(p, e){ 
		//console.log("Clicked world position", p);
		var clickableEntGroup = g.state.currentState.name;
		var ne = g.world.getNearestEntity(p, 50, clickableEntGroup);
		console.log(">> Clicked", ne);
		
		if (ne == null) {
			g.owner.targetPos.set(p);
			g.owner.setAction("walk");
			return false;
		} else {
			g.selectedEnt = ne;
		}
		g.world.clearHighlighted();
		console.log(ne.getType());
		switch (ne.getType()) {
			case "owner":
				//ne.isHighlighted = true;
				g.state.transition("ownerMenu");
				break;
			case "customer":
				//ne.isHighlighted = true;
				g.state.transition("customerMenu");
				break;
			case "pot":
			case "barrel":
				//ne.isHighlighted = true;
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
				
				if (g.state.currentState.getType() == "selectedMenu") {
					g.state.transition("game");
					e.preventDefault();
				}
				break;
		}
	});	
	
	g.drawShading = function(){
		var r = g.dice.roll1d(4);
		var x, y, point, illum, stageXY;
		for (x = 0; x < g.world.size.x; x += 20) {
			for (y = 0; y < g.world.size.y; y += 20) {
				//console.log(".");
				point = new rb.Coords(x, y);
				illum = 0;
				g.world.loopOverEntities("illumination", function(entIndex, ent){
					var d = ent.pos.getDistance( point );
					if (d == 0) d = 0.00000001;
					// Adds a flicker -- will add to post-compo
					
					illum += Math.max( ((216 + r) / d), 0);
				});
				illum = Math.min(illum, 1.0);
				//console.log(illum);
				op = Math.max(1 - illum, 0.1);
				stageXY = g.stage.getStageXY(point);
				g.mainLayer.ctx.fillStyle = 'rgba(0,0,0,' + op + ')';
				g.mainLayer.ctx.fillRect(
					stageXY.x - 10, stageXY.y - 10, 20, 20
				);
			}
		}	
	};
	
	g.drawCircle = function(pos, r){
		var stageXY = g.stage.getStageXY(pos);
		g.mainLayer.ctx.strokeStyle = "#fff";
		g.mainLayer.ctx.fillStyle = "rgba(255,255,255,0.15)";
		g.mainLayer.ctx.beginPath();
		g.mainLayer.ctx.arc(stageXY.x, stageXY.y, r, 0, g.PI2);
		g.mainLayer.ctx.stroke();
		g.mainLayer.ctx.fill();	
	}
	
	//============================================== Loops
	// Setup Loops & modulus actions
	g.gameLoop = new rb.Looper(function(){
		g.world.applyPhysics(g.physics);
		g.stage.draw();
		g.drawShading();

		if (g.owner.goal.ent != null) {
			g.drawCircle(g.owner.goal.ent.pos, 20);
		} else {
			g.drawCircle(g.owner.targetPos, 10);
		}
		
		g.tavern.customerCount = 0;
		g.world.loopOverEntities("customer", function(entIndex, ent){
			g.tavern.customerCount++;
			if (!g.world.isEntityInBounds(ent)) {
				g.world.removeEntity(ent);
				console.log("GONE OFF WORLD");
				if (typeof ent.character == "object") {
					ent.character.vote();
				}
			}
		});
	});
	g.gameLoop.addModulusAction(1, function(){
		// Loop over customers
		g.world.loopOverEntities("customer", function(entIndex, ent){
			if (typeof ent.character == "object") {
				ent.character.performAction().passTime();
			} else {
				console.log(ent.character, typeof ent.character);
			}
		});
		/*
		for (var i = 0, cl = g.customers.length; i < cl; i++){
			g.customers[i].performAction().passTime();
		}
		*/
		var r = g.dice.roll1d(50);
		if (r == 1) {
			g.tavern.addCoins(1);
		} else if (r < 5) {
			// *** Do random voting
		}
		g.owner.performAction(); //.passTime();
		g.tavern.addCustomers();
	});
	
	// Selected Loop
	g.selectCircleSize = 10;
	g.selectCircleDirection = 3;
	g.selectedLoop = new rb.Looper(function(){
		g.stage.draw();
		if (g.selectedEnt != null) {
			
			g.selectCircleSize += g.selectCircleDirection;
			if (g.selectCircleSize > 100) {
				g.selectCircleDirection = -1;
			} else if (g.selectCircleSize < 20) {
				g.selectCircleDirection = 1;
			}
			
			g.drawCircle(g.selectedEnt.pos, g.selectCircleSize);
			g.mainLayer.drawEntity(g.selectedEnt);
		}
		
	});
	
	g.state.transition("mainmenu");

	window.setTimeout(function(){
		// Start 'er up!
		g.stage.draw(true);
		g.drawShading();
		g.tavern.drawTopBar();
		//g.state.transition("game");
	},100);

});