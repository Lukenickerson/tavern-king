/*
	Stage
	Stage class
	By Luke Nickerson, 2014
*/
(function(){
	var Stage = function(eltId, size){
		console.log("Stage: Creating stage", eltId, size);
		this.elementId = eltId;
		this.size = { x: size.x, y: size.y };
		this._halfSize = { x: size.x/2, y: size.y/2 };
		this.element = document.getElementById(eltId);
		//this.element.style.width	= size.x;
		//this.element.style.height	= size.y;
		this.layers = [];
		this.layerCount = 0;
		this.layerOngoingCounter = 0;
		this.camera = new this.Camera();
		
	}
	//==== Stage Functions
	Stage.prototype.addLayer = function(tagName){
		if (typeof tagName == 'undefined') tagName = "canvas";
		this.layerOngoingCounter++;
		var layer = new this.Layer(tagName, this);
		console.log(layer);
		this.element.appendChild(layer.element);
		this.layers.push(layer);
		this.layerCount++;
		return layer;
	}
	Stage.prototype.removeLayer = function(){
		this.layerCount--;
	}
	Stage.prototype.loopOverLayers = function(fn){
		for (var i = 0; i < this.layerCount; i++){
			fn(i, this.layers[i]);
		}		
	}
	Stage.prototype.draw = function(){
		this.camera.adjust();
		this.loopOverLayers(function(i, layer){
			layer.draw();
		});
	}
	Stage.prototype.resize = function(size){
		if (typeof size == 'undefined') {
			var $elt = $(this.element);
			size = {
				x : $elt.width()
				,y : $elt.height()
			};
		}
		console.log("Stage: Resize stage to", size);
		this.size.x = size.x;
		this.size.y = size.y;
		this._halfSize = { x: size.x/2, y: size.y/2 };
		this.loopOverLayers(function(i, layer){
			layer.resize(size);
		});
		this.draw();
	}
	Stage.prototype.getStageXY = function(pos){
		return {
			x:	(pos.x - this.camera.pos.x) + this._halfSize.x
			,y: this._halfSize.y - pos.y + this.camera.pos.y
		};
	}
	Stage.prototype.getPosition = function(stageX, stageY){
		return {
			x:	stageX + this.camera.pos.x - this._halfSize.x
			,y: this.camera.pos.y + this._halfSize.y - stageY
		};		
	}
	Stage.prototype.addClickEvent = function(fn){
		var s = this;
		$(this.element).click(function(e){
			
			fn(s.getPosition(e.offsetX, e.offsetY), e);
		});
	}

	
	//==== CAMERA
	Stage.prototype.Camera = function(stage){
		this.pos = {x: 0, y: 0};
		this.followCoords = null;
	}
	Stage.prototype.Camera.prototype.set = function(coords){
		this.pos.x = coords.x;
		this.pos.x = coords.y;
		this.adjust();
		return this;
	}
	Stage.prototype.Camera.prototype.follow = function(coords){
		this.followCoords = coords;
		this.adjust();
		return this;
	}
	Stage.prototype.Camera.prototype.stop = function(){
		this.adjust();
		this.followCoords = null;
		return this;
	}
	Stage.prototype.Camera.prototype.adjust = function(coords){
		if (this.followCoords != null) {
			this.pos.x = this.followCoords.x;
			this.pos.y = this.followCoords.y;
		}
		return this;
	}	
	


	//==== LAYER
	Stage.prototype.Layer = function(tagName, stage){
		this.tagName = tagName;
		this.stage = stage;
		this.element = document.createElement(tagName);
		this.elementId = stage.elementId + "-" + stage.layerOngoingCounter;
		// Set some values for the newly created layer element
		this.element.id 		= this.elementId;
		this.element.className 	= "layer";
		this.element.width		= stage.size.x;
		this.element.height		= stage.size.y;
		
		this.size = { x: stage.size.x, y: stage.size.y };
		this.ctx = (tagName == "canvas") ? this.element.getContext('2d') : null;
		this.entities = [];
	}
	//==== Layer Functions
	Stage.prototype.Layer.prototype.resize = function(size)
	{
		if (typeof size == 'undefined') {
			var $elt = $(this.element);
			size = {
				x : $elt.width()
				,y : $elt.height()
			};
		}
		this.size.x = size.x;
		this.size.y = size.y;
		this.element.width		= size.x;
		this.element.height		= size.y;
	}
	Stage.prototype.Layer.prototype.connectEntities = function(ents)
	{
		this.entities = ents;
	}
	Stage.prototype.Layer.prototype.draw = function()
	{
		var entCount = this.entities.length;
		this.ctx.clearRect(0,0,this.size.x,this.size.y);
		for (var i = 0; i < entCount; i++){
			this.drawEntity(this.entities[i]);
		}
	}
	Stage.prototype.Layer.prototype.drawEntity = function(ent)
	{
		var stageXY = this.stage.getStageXY(ent.pos);
		stageXY.x -= ent._halfSize.x;
		stageXY.y -= ent._halfSize.y;
		
		if (ent.image) {
			this.ctx.drawImage( ent.image,
				stageXY.x, stageXY.y, ent.size.x, ent.size.y);
		} else {
			this.ctx.fillStyle = '#ffff66';
			this.ctx.fillRect(stageXY.x, stageXY.y, ent.size.x, ent.size.y);		
		}
		
		if (ent.isHighlighted) {
			if (typeof ent.customDraw.highlighted == 'function') {
				ent.customDraw.highlighted();
			} else {
				this.ctx.strokeStyle = '#ff0000';
				this.ctx.strokeRect(stageXY.x, stageXY.y, ent.size.x, ent.size.y);
			}
		}
	}







	
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent("stage", "Stage", Stage);
	} else window.Stage = Stage;
})();