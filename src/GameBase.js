/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */

this.AdventureGame = this.AdventureGame || {};


(function() {
	"use strict";

	/**
	* Provides functions to load and store a game and defines base functions for initial setup, gameloop and exit
	* @class AdventureGame.GameBase
	* @summary Base functions to load a game.
	**/
	var GameBase = function(options) {
		this.initialize(options);
	};
	var p = GameBase.prototype;

	/**
	* Setup function called by constructor.
	* ### Expected options are
	* * stage createjs.Stage The stage to draw this game on (required)
	* * saveGame Object Save document for this game (from which data will be loaded and saved to pouchdb throughout gameplay)
	* * saveGame PouchDB PouchDB databaes connection for saving data
	* * assets Object passing array of AdventureGame.ImageInfo objects in options.images and options.audio
	* * setup function Setup function for this game
	* * loop function Gameloop functio for this game
	* * exit function Callback function when the game exits
	* * defaultSize Object The default size of this game in options.defaultSize.x and options.defaultSize.y
	* * pageScale int The amount to scale all images in this game (defaults to 1)
	* @function initialize
	* @memberof AdventureGame.GameBase
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		if(!options.stage) {
			throw "Stage is not set";
		}
		this.stage = options.stage;
		AdventureGame.stage = this.stage;
		if(options.saveGame) {
			AdventureGame.saveGame = options.saveGame;
		}
		if(options.db) {
			AdventureGame.db = options.db;
		}
		this.assets = options.assets || {images:[], audio:[]};
		if(options.setup) {
			this.setup = options.setup;
		}
		if(options.loop) {
			this.setup = options.loop;
		}
		if(options.exit) {
			this.setup = options.exit;
		}
		this.defaultSize = options.defaultSize || null;
		this.pageScale = 1;		// Scale all images by this amount (used to set to page scale)
		if(this.defaultSize && this.defaultSize.x) {
			this.pageScale = this.stage.canvas.width / this.defaultSize.x;
		}
		if(this.defaultSize && this.defaultSize.y && this.pageScale > this.stage.canvas.height / this.defaultSize.y) {
			this.pageScale = this.stage.canvas.height / this.defaultSize.y;
		}
	};
	
	/**
	* Default initial setup for the game. 
	* Sets ticket to run gameloop. This may be overridden by passing the setup option to the constructor
	* @function setup
	* @memberof AdventureGame.GameBase
	**/
	p.setup = function() {
		this.tickerCallback = createjs.Ticker.addEventListener('tick', this.loop.bind(this));
		return true;
	};

	/**
	* Default game loop
	* Updates the screen and returns true to indicate success
	* @function loop
	* @memberof AdventureGame.GameBase
	* @return true
	**/
	p.loop = function() {
		this.stage.update();
		return true;
	};

	/**
	* Default exit function
	* Disables ticker (which calls loop by default unless setup() has been replaced)
	* @function exit
	* @memberof AdventureGame.GameBase
	* @return true
	**/
	p.exit = function() {
		createjs.Ticker.removeEventListener('tick', this.tickerCallback);
		this.stage.removeAllChildren();
		return true;
	};

	/**
	* Build a manifest file from supplied assets.
	* @function assetsToManifest
	* @memberof AdventureGame.GameBase
	* @param assets Object containing two arrays of asset information. assets.images and assets.audio
	* @return manifest file
	**/
	p.assetsToManifest = function(assets) {
		console.log(assets);
		var manifest = [], key;
		for(key in assets.images) {
			if(assets.images.hasOwnProperty(key)) {
				manifest.push({src:assets.images[key].src, id: key});
			}
		}
		for(key in assets.audio) {
			if(assets.audio.hasOwnProperty(key)) {
				manifest.push({src:assets.audio[key].src, id: key});
			}
		}
		return manifest;
	};

	/**
	* Callback function when an asset is loaded
	* @function assetLoaded
	* @memberof AdventureGame.GameBase
	* @param event Event information containing the loaded asset
	**/
	p.assetLoaded = function(event) {
		console.log("Loaded asset "+event.item.id);
		var item = event.item,
			img = null;
//			thisImage = this.assets.images[event.item.id];
		switch(item.type) {
			case createjs.LoadQueue.IMAGE:
				// Scale any loaded images to the game scale if set
				/*
				if(!thisImage.gamescale && this.pageScale) {
					thisImage.scale = thisImage.scale * this.pageScale;
					thisImage.gamescale = true;
				}
				*/
				if(this.assets.images[event.item.id].spritesheet) {
					img = new createjs.SpriteSheet({
						images: [item.src],
						frames: this.assets.images[event.item.id].frames,
						animations: this.assets.images[event.item.id].animations
					});
					this.assets.images[event.item.id].loaded = true;
					this.assets.images[event.item.id].obj = new createjs.Sprite(img, 'idle');
					this.assets.images[event.item.id].obj.scaleX = this.assets.images[event.item.id].scale;
					this.assets.images[event.item.id].obj.scaleY = this.assets.images[event.item.id].scale;
				} else {
					img = new Image();
					img.src = item.src;
					this.assets.images[event.item.id].loaded = true;
					this.assets.images[event.item.id].obj = new createjs.Bitmap(img);
					this.assets.images[event.item.id].obj.scaleX = this.assets.images[event.item.id].scale;
					this.assets.images[event.item.id].obj.scaleY = this.assets.images[event.item.id].scale;
				}
				break;
			case createjs.LoadQueue.AUDIO:
				throw "Audio files not yet supported";
			default:
				console.error("Unhandled file type: "+item.type);
		}
	};
	
	AdventureGame.GameBase = GameBase;
	
}());