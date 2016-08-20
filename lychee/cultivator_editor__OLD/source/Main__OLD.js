
lychee.define('tool.Main').requires([
	'lychee.data.JSON',
	'tool.state.Project',
	'tool.state.Scene'
]).includes([
	'lychee.app.Main'
]).tags({
	platform: 'html'
}).exports(function(lychee, tool, global, attachments) {

	var _JSON   = lychee.data.JSON;
	var PROJECT = null;



	/*
	 * HACKS
	 */

	(function(global) {

		if (typeof global.addEventListener !== 'undefined') {

			global.addEventListener('click', function(event) {

				var target = event.target;
				if (target.tagName === 'A' && target.href.match(/lycheejs:\/\//g)) {

					setTimeout(function() {

						var main = global.MAIN || null;
						if (main !== null) {
							main.loop.trigger('update', []);
						}

					}, 200);

				}

			}, true);

		}

	})(global);

	(function(global) {

		try {

			var gui = require('nw.gui');
			PROJECT = gui.App.argv[0];

		} catch(e) {

		}


		var location = global.location || null;
		if (location instanceof Object) {

			var url = (location.search || '?').substr(1);
			if (url.length > 0) {
				PROJECT = url;
			}

		}

	})(global);



	/*
	 * HELPERS
	 */

	var _trace_entity = function(position) {

		var pos = {
			x: position.x - this.offset.x,
			y: position.y - this.offset.y
		};


		var entity = this.getEntity(null, pos);
		if (entity !== null) {

			if (typeof entity.getEntity === 'function') {

				var result = _trace_entity.call(entity, {
					x: pos.x - entity.position.x,
					y: pos.y - entity.position.y
				});

				if (result !== null) {
					return result;
				}

			}


			return entity;

		}


		return null;

	};

	var _on_touch = function(id, position, delta) {

		var main = this.environment.global.MAIN;
		var x1   = main.renderer.offset.x;
		var y1   = main.renderer.offset.y;
		var x2   = x1 + main.renderer.width;
		var y2   = y1 + main.renderer.height;


		if (position.x > x1 && position.x < x2 && position.y > y1 && position.y < y2) {

			switch (this.mode) {

				case 'play':

					this.__simulation.touch.forEach(function(event) {
						event.callback.call(event.scope, id, position, delta);
					});

				break;

				case 'modify':

					var found = null;
					var pos   = {
						x: position.x - main.renderer.offset.x - main.renderer.width  / 2,
						y: position.y - main.renderer.offset.y - main.renderer.height / 2
					};


					Object.values(main.state.__layers).reverse().forEach(function(layer) {

						var entity = _trace_entity.call(layer, pos);
						if (found === null) {
							found = entity;
						}

					});

					this.entity = found;

					var state = this.state;
					if (state !== null) {
						state.trigger('entity', [ this.entity ]);
					}

				break;

				case 'create':

// TODO: Place current layer/entity at current position

				break;

			}

		}

	};

	var _on_swipe = function(id, type, position, delta, swipe) {

		var main = this.environment.global.MAIN;
		var x1   = main.renderer.offset.x;
		var y1   = main.renderer.offset.y;
		var x2   = x1 + main.renderer.width;
		var y2   = y1 + main.renderer.height;


		if (position.x > x1 && position.x < x2 && position.y > y1 && position.y < y2) {

			switch (this.mode) {

				case 'play':

					this.__simulation.swipe.forEach(function(event) {
						event.callback.call(event.scope, id, type, position, delta, swipe);
					});

				break;

				case 'modify':

					var pos = {
						x: position.x - main.renderer.offset.x - main.renderer.width  / 2,
						y: position.y - main.renderer.offset.y - main.renderer.height / 2
					};


					var entity = this.entity;
					if (entity !== null) {

						entity.setPosition({
							x: pos.x,
							y: pos.y
						});

						var state = this.state;
						if (state !== null) {
							state.trigger('entity', [ entity ]);
						}

					}

				break;

				case 'create':

				break;

			}

		}

	};

	var _on_changestate = function(main) {

		var input = main.input;
		if (input !== null) {

			input.unbind('touch', _on_touch, this);
			input.unbind('swipe', _on_swipe, this);


			this.__simulation = {
				touch: input.___events.touch.splice(0),
				swipe: input.___events.swipe.splice(0)
			};

			input.___events.touch = [];
			input.___events.swipe = [];


			input.setTouch(true);
			input.setSwipe(true);


			input.bind('touch', _on_touch, this);
			input.bind('swipe', _on_swipe, this);

		}

	};

	var _initialize = function(url, callback, scope) {

console.log(url);

		if (typeof url === 'string' && url.split('/').pop() === 'lychee.pkg') {

			lychee.init(function(sandbox) {

				if (sandbox === null) {

					callback.call(scope, null);

				} else {

					var lychee = sandbox.lychee;
					var game   = sandbox.game;


					// This allows using #MAIN in JSON files
					game.Main.prototype.changeState = function(id) {
						sandbox.lychee.app.Main.prototype.changeState.call(this, id);
						that.trigger('changestate', [ id, this ]);
					};

					sandbox.MAIN = new game.Main();
					sandbox.MAIN.init();


					setTimeout(function() {

						var _canvas  = document.querySelector('body > .lychee-Renderer');
						var _wrapper = document.querySelector('#scene-preview-wrapper');

						if (_canvas !== null && _wrapper !== null) {
							_canvas.parentNode.removeChild(_canvas);
							_wrapper.appendChild(_canvas);
						}

					   	callback.call(scope, environment);

					}, 500);

				}

			});

		} else {

			callback.call(scope, null);

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = Object.assign({

			client:     null,
			input:      null,
			jukebox:    null,
			renderer:   null,
			server:     null,

			loop: {
				update: 1/10,
				render: 0
			},

			viewport: {
				fullscreen: false
			}

		}, data);


		this.entity   = null;
		this.mode     = 'play';
		this.template = null;


		lychee.app.Main.call(this, settings);



		/*
		 * INITIALIZATION
		 */

		this.bind('load', function(oncomplete) {
			oncomplete(true);
		}, this, true);

		this.bind('init', function() {

			this.setState('scene', new tool.state.Scene(this));


			if (PROJECT !== null) {
				this.open(PROJECT);
			}

		}, this, true);

		this.bind('changemode', function(mode) {

			this.mode   = mode;
			this.entity = null;

			var state = this.state;
			if (state !== null) {
				state.trigger('entity', [ this.entity ]);
			}

			ui.inactive('#scene-preview-mode button');
			ui.active('#scene-preview-mode-' + mode);

		}, this);

		this.bind('changestate', function(id, main) {

			_on_changestate.call(this, main);

		}, this);

	};


	Class.prototype = {

		open: function(url) {

			_initialize.call(this, url, function(environment) {

				if (environment !== null) {

					this.environment = environment;

					setTimeout(function() {
						ui.changeState('scene', environment);
					}, 500);


					// XXX: Wait for transition to complete until we dispatch
					setTimeout(function() {

						var sandbox = this;
						var width   = ((window.innerWidth - (16 + 3 * 64)) * 3) / 4; // don't touch this
						var height  = 768;

						sandbox.MAIN.settings.renderer.width  = width;
						sandbox.MAIN.settings.renderer.height = height;
						sandbox.MAIN.renderer.setWidth(width);
						sandbox.MAIN.renderer.setHeight(height);

						sandbox.MAIN.viewport.trigger('reshape', [
							sandbox.MAIN.viewport.orientation,
							sandbox.MAIN.viewport.rotation
						]);

					}.bind(environment.global), 1500);

				}

			}, this);

		}

	};


	return Class;

});
