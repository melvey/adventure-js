/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* A single room containing items, characters and doors
* The room requires a background image, coordinates for the floor (walkable area) and any items or characters that will appear in it
*/
(function() {
	"use strict";

	/**
	 * @class Room
	 */
	var Room = function(options) {
		this.initialize(options);
	};
	var p = Room.prototype;
	
	// Public Properties
	
	/**
	 * Background image for room
	 * @property background
	 * @type URIString | Image
	 * @memberof Room
	 **/
	p.background = null;
	
	/**
	 * Area that player can click to walk
	 * @property floor
	 * @type createjs.Shape
	 * @memberof Room
	 **/
	p.floor = null;
	
	/**
	 * Associative array of objects to display in this room
	 * @property items
	 * @type Object
	 * @memberof Room
	 **/
	p.items = null;
	
	/**
	 * Associative array of characters to display in this room (note yet fully implemented)
	 * @property characters
	 * @type Object
	 * @memberof Room
	 **/
	p.characters = null;
	
	/**
	 * Array of doors to exit the room (not yet full implemented)
	 * @property doors
	 * @type Object
	 * @memberof Room
	 **/
	p.doors = null;
	
	/**
	 * Function to call when the room is loaded
	 * @property onLoad
	 * @type function
	 * @memberof Room
	 **/
	p.onLoad = null;
	
	/**
	 * Function to call when the player enters the room. Run after onLoad
	 * @property onEnter
	 * @type function
	 * @memberof Room
	 **/
	p.onEnter = null;

	/**
	 * Function to call when the player exits the room
	 * @property onExit
	 * @type function
	 * @memberof Room
	 **/
	p.onExit = null;
	
	/**
	 * Flag indicating if the room has been entered yet
	 * @property entered
	 * @type Boolean
	 * @memberof Room
	 **/
	p.entered = null;
	
	
	/**
	* Setup this room object from given options
	* @param options Object containing options to setup this room
	* @return null
	 * @memberof Room
	*/
	p.initialize = function(options) {
		if(!options.background) {
			throw "Background not set for room";
		}
		this.background = new createjs.Bitmap(options.background);
		if(options.floor) {
			this.floor = options.floor;
		} else if(options.floorCoords){
			this.floor = this.createFloor(options.floorCoords);
		} else {
			throw "No floor or coordinates for floor are set";
		}
		this.items = (options.items !== undefined ? options.items : {});
		this.characters = (options.characters !== undefined ? options.characters : {});
		this.doors = (options.doors !== undefined ? options.doors : {});
		this.onEnter = (options.onEnter !== undefined ? options.onEnter : function() {return true;});
		this.onLoad = (options.onLoad !== undefined ? options.onLoad : function() {return true;});
		this.onExit = (options.onExit !== undefined ? options.onExit : function() {return true;});
		this.entered = false;
	};

	/**
	* Create a floor shape from an array of coordinates
	* @param array Coordinates of shape to use for floor
	* @return The createjs.Shape object used to represent the form
	 * @memberof Room
	*/
	p.createFloor = function(points) {
		var floor = new createjs.Shape(),
			itemIndex;
		floor.graphics.beginFill("rgba(255, 255, 255, 0.21)");
		floor.graphics.moveTo(points[0][0], points[0][1]);	// Put cursor at first pint
		// Now draw lines to all remaining points
		for(itemIndex=1; itemIndex<points.length; itemIndex++) {
			floor.graphics.lineTo(points[itemIndex][0], points[itemIndex][1]);
		}
		floor.graphics.lineTo(points[0][0], points[0][1]);	// Draw line back to the start
		floor.x = 0;
		floor.y = 0;
		return floor;
	};

	/**
	* Scale the background and floor to fit the stage size. This can fail if the image is improperly loaded as occurrs in phonegap
	* @return Promise
	* @memberof Room
	**/
	p.scaleBackground = function() {
		var _this = this,
			stage = AdventureGame.stage;
		return new Promise(function(resolve, reject) {
			if(!_this.background.image.width || !_this.background.image.height) {
				reject(new Error("Background image loaded but dimensions not set!"));
			} else {
				// Scale and load background
				_this.background.scaleX = stage.canvas.width / _this.background.image.width;
				_this.background.scaleY = stage.canvas.height / _this.background.image.height;
				console.log("Background scale: "+_this.background.scaleX+","+_this.background.scaleY);
				// Make sure the floor scales with the background
				_this.floor.scaleX = _this.background.scaleX;
				_this.floor.scaleY = _this.background.scaleY;
				_this.backgroundScaled = true;
				resolve();
			}
		});
	};

	/**
	* Load this room and draw on the stage
	* @param player Character object representing the playable character
	* @param door Object with x,y and direction information for player to enter from
	* @return null
	 * @memberof Room
	*/
	p.load = function(player, door) {
		console.log("Loading room");
		var _this = this;
		return new Promise(function(resolve, reject) {
			var 
				itemID,
				characterID,
				stage = AdventureGame.stage,
				characterHeight = player.getHeight(),
				characterWidth = player.getWidth(),
				aCharacter,
				doorCoord;
		
			stage.addChild(_this.background);
			stage.addChild(_this.floor);
			_this.floor.on('click', function(event) {
				player.walkToPosition(event.stageX, event.stageY);
				player.destinationCallback = null;
			});

			for(itemID in _this.items) {
				if(_this.items.hasOwnProperty(itemID)) {
					_this.items[itemID].room = _this;
					stage.addChild(_this.items[itemID]);
				}
			}


			console.log(_this.characters);
			for(characterID in _this.characters) {
				if(_this.characters.hasOwnProperty(characterID)) {
					aCharacter = _this.characters[characterID];
					stage.addChild(aCharacter);
				}
			}
	
			// Add characters
			// Add player first
			if(door) {
				// Convert door % value to px for the stage
				doorCoord = AdventureGame.percentToStageCoord(door.x, door.y, AdventureGame.stage);
				console.log(AdventureGame.stage.canvas.width+' * ('+door.x+'/100)');
				switch(door.location) {
					case 'N':
						player.setCharacterPosition(doorCoord.x, doorCoord.y-5);
						player.nextPosition = {x: doorCoord.x, y: doorCoord.y+characterHeight+5};
						break;
					case 'E':
						player.setCharacterPosition(doorCoord.x-characterWidth+5, doorCoord.y);
						player.nextPosition = {x: doorCoord.x+characterWidth+5, y: doorCoord.y};
						break;
					case 'S':
						player.setCharacterPosition(doorCoord.x, doorCoord.y+characterHeight+5);
						player.nextPosition = {x: doorCoord.x, y: doorCoord.y-5};
						break;
					case 'W':
						player.setCharacterPosition(doorCoord.x-characterWidth-5, doorCoord.y);
						player.nextPosition = {x: doorCoord.x+characterWidth+5, y: doorCoord.y};
						break;
					default:
						player.setCharacterPosition(doorCoord.x, doorCoord.y);
				}
			} else {
				// This is hardly necessecary now as the player is already standing here
				player.setCharacterPosition(player.getXLocation(), player.getYLocation());
			}
			stage.addChild(player);
			
			stage.update();
			if(_this.onLoad) {
				_this.onLoad();
			}
			
			resolve();
		}).then(function() {
			// Scale the background once the room is fully loaded
			_this.scaleBackground(true).then(null, function() {
				console.log("Retrying loading background image");
				setTimeout(function() {
					_this.scaleBackground(false);
				}, 200);
			});
		});
	};
	
	/**
	 * Get a walkable path across the floor from one given point to another
	 * @param startX The X coordinate for the starting location
	 * @param startY The Y coordinate for the starting lcoation
	 * @param endX X coordinate for the destination location
	 * @param endY Y coordinate for the destination location
	 * @param excludedObsticles Array of objects that should be ignored when evaluating obsticles
	 * @return array of points for walking path | false if no path can be found
	 * @memberof Room
	 */
	p.getPath = function(startX,startY,endX,endY,excludedObsticles) {
		var 
//			nodesPerStage = 100,
//			distanceBetweenNodes = AdventureGame.stage.width / nodesPerStage,
			distanceBetweenNodes = 100,		// the distance in pixels between each node
			map = [],						// 2 dimension array of all points on the map
			visited = [],					// Array of nodes that have been visited
			toVisit = [],					// Array of nodes to visit
			currentDistance = 0,			// How far we are from the starting point
			currentX = startX,				// The X dimension for the current node we're at
			currentY = startY,				// The Y dimension for the current node we're at
			xOffset,						// The X offset in neighbouring nodes to check
			yOffset,						// The Y offset in neighbouring nodes to check
			localObjects,					// Objects at the given point
			objIndex,						// Iterator index when walking through objects at a certain point
			isWalkable = false,				// Flag indicating if this is available floor
			tmpX,							// A temp storage of the neighbouring node's X index
			tmpY,							// Temp storage of the neighbouring node's Y index
			tmpCoord,						// Temp variable to hold array coordinates for next node when splitting to currentX and currentY
			visitedIndex,
			isVisited = false,				// Flag inticating if the node has been visited yet
			path,							// Array holding the path we have located
			closestX,						// The X coord for the current closest node when walking back down the path
			closestY;						// The Y coord for the current closest node when walking back down the path
		// Set start and end values to multiples of the node distance to ensure they fit node coordinates
		// If we ensure that is always a square of 10 we can use Math.round to get the cloest value rather than just rounding down as we do here
		startX = startX - (startX % distanceBetweenNodes);
		startY = startY - (startY % distanceBetweenNodes);
		endX = endX - (endX % distanceBetweenNodes);
		endY = endY - (endY % distanceBetweenNodes);
		// Draw the initial point on the map
		if (!map[currentX]) {
			map[currentX] = [];
		}
		map[currentX][currentY] = currentDistance;
		visited.push([currentX,currentY]);

		while (currentX !== endX && currentY !== endY) {
			currentDistance = map[currentX][currentY];
			// Check neighbouring nodes
			for (xOffset = -1; xOffset <= 1; xOffset++) {
				for (yOffset = -1; yOffset <= 1; yOffset++) {
					tmpX = currentX + xOffset;
					tmpY = currentY + yOffset;
					isWalkable = false;
					localObjects = AdventureGame.stage.getObjectsUnderPoint(tmpX, tmpY);
					for(objIndex =0; objIndex < localObjects.length; objIndex++) {
						console.log(localObjects[objIndex]);
						if(excludedObsticles.indexOf(localObjects[objIndex]) === -1) {
							// This item is not to be excluded
							if(excludedObsticles[objIndex] === this.floor) {
								// There is still floor here so can walk here unless we find another obsticle
								isWalkable = true;
							} else {
								// We found an obsticle and so cannot walk here
								isWalkable = false;
								break;
							}
						}
					}
					if (isWalkable) {
						// If we don't have an array for this X yet add it
						if(!map[tmpX]) {
							map[tmpX] = [];
						}
						// If this node hasn't been checked yet add it to the list to visit
						if (map[tmpX][tmpY] !== undefined) {
							// Now check if we've visited it
							isVisited = false;
							for(visitedIndex = 0; visitedIndex < visited.length; visitedIndex++) {
									if(visited[visitedIndex][0] === tmpX && visited[visitedIndex][1] === tmpY) {
										isVisited = true;
										break;
									}
							}
							if(!isVisited) {
								toVisit.push([tmpX,tmpY]);
							}
						}
						// If this path is the first or shortest path to the new node update the distance
						if (!map[tmpX][tmpY] || map[tmpX][tmpY] < currentDistance + distanceBetweenNodes) {
							map[tmpX][tmpY] = currentDistance + distanceBetweenNodes;
						}
					}
				}
			}
			// Now set new location to one from the list to visit
			tmpCoord = toVisit.shift();
			currentX = tmpCoord[0];
			currentY = tmpCoord[1];
			// If we're at the end finish the loop
			if(currentX === endX && currentY === endY) {
				break;
			}
		}
		// We have nodes with their distances so we just need to walk back and find the shortest path
		// Check neighbouring nodes
		path = [];
		while(currentX !== startX && currentY !== startY) {
			path.shift([currentX,currentY]);	// Store this point in our path
			// Start using our current node as the "closest" point for reference
			closestX = currentX;
			closestY = currentY;
			// Now check all surrounding nodes for a closer one
			for (xOffset = -1; xOffset <= 1; xOffset++) {
				for (yOffset = -1; yOffset <= 1; yOffset++) {
					tmpX = currentX + xOffset;
					tmpY = currentY + yOffset;
					// If this square is closer to the destination than the last hold on to it
					if(map[tmpX][tmpY] < map[closestX][closestY]) {
						closestX = tmpX;
						closestY = tmpY;
					}
				}
			}
			currentX = closestX;
			currentY = closestY;
		}
		return path;
	};
	
	
	
	/**
	* Gameloop for room
	 * @memberof Room
	*/
	p.loop = function() {
	
	};
	
	
	AdventureGame.Room = Room;
}());
