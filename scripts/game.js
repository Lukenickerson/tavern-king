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
		,"grass1" : "grass1.png"
		,"grass2" : "grass2.png"
		,"nsd" : "nude_shaved_dwarf.png"
	});
	
	g.state.add("ownerMenu", {
		start: function(){
			g.state.get("game").$view.show();
			this.$view.show();
		},
		end: function(){
			this.$view.hide();
		},
		type: "overlayMenu"
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
	
	g.Character = function(name, race, ent, imageName){
		this.entity = ent;
		this.race = race;
		this.action	= "wait";
		this.targetPos = new rb.Coords();
		
		this.entity.image = g.images.get(imageName);
	}
	g.Character.prototype.performAction = function(){
		var c = this;
		switch (c.action) {
			case "wait":
				var randPos = g.world.getRandomPosition();
				c.targetPos.set(randPos);
				c.action = "walk";
				break;
			case "walk":	// Move towards target
				var dist = c.entity.pos.getDistance( c.targetPos );
				if (dist < 30) {
					//c.entity.vel.multiply(0.75);
					if (dist < 10) {
						c.entity.pos.set( c.targetPos );
						c.entity.vel.clear();
						c.action = "wait";
					}
				} else {
					c.entity.vel.set(c.entity.pos.getUnitVector(c.targetPos));
					c.entity.vel.multiply(0.5);
				}
				break;
			default:
				// ??
		}
		
	}
	
	//g.owner = g.world.addEntity("owner");
	
	
	g.owner = new g.Character(
		"Tavern Owner",
		"dwarf",
		g.world.addNewEntity("owner"),
		"nsd"
	);
	g.customers = [];
	

	

	
	for (var i = 0; i < 20; i++) {
		var ent = g.world.addNewEntity("customer");
		var cust = new g.Character(
			"Customer",
			"dwarf",
			ent,
			"nsd"
		);		
		ent.pos.set( g.world.getRandomPosition() );
		g.customers.push(cust);
	}
	

	
	console.log( g.world.getCenter() );
	g.stage.camera.set( g.world.getCenter() );

	
	/*
	g.ball = g.world.entities[0];
	g.ball.vel.x = 1;
	g.ball.vel.y = 4;
	g.stage.camera.follow(g.ball.pos);
	*/

	g.mainLayer = g.stage.addLayer("canvas");
	g.mainLayer.connectEntities( g.world.entities );
	g.stage.resize( g.world.size );
	
	

	g.stage.addClickEvent(function(p, e){ 
		console.log("clicked world position", p);
		var ne = g.world.getNearestEntity(p, 100);
		ne.isHighlighted = true;
		console.log(ne.getType(), ne);
		switch (ne.getType()) {
			case "owner":
				g.state.transition("ownerMenu");
				break;
			// *** Add other clickable items
			case "":
				break;
			default:
				if (g.state.currentState.getType() == "overlayMenu") {
					g.state.transition("game");
					e.preventDefault();
				}
				break;
		}
	});	
	
	// Setup Game loop actions
	g.loop = new rb.Looper(function(){
		g.world.applyPhysics(g.physics);
		g.stage.draw();
	});
	g.loop.addModulusAction(30, function(){
		//console.log(g.ball.pos);
		/*
		g.ball.pos.add(g.ball.vel);
		var hitWall = g.world.keepCoordsInRange(g.ball.pos);
		if (hitWall) {
			g.ball.vel.multiply(-1);
		}
		*/
		g.tavern.addCoins(1);
	});
	
	g.loop.addModulusAction(1, function(){
		// Loop over customers
		for (var i = 0, cl = g.customers.length; i < cl; i++){
			g.customers[i].performAction();
		}
	});
	
	// Tie looping to the Game State
	g.state.get("game").setStart(function(){
		this.$view.fadeIn(300, function(){
			g.loop.start();
		});
	}).setEnd(function(){
		g.loop.pause();
		this.$view.hide();
	});

	
	// Start 'er up!
	g.stage.draw();
	g.tavern.drawTopBar();
	g.state.transition("game");

});