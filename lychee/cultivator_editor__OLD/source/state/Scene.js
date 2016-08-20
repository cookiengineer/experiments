
lychee.define('tool.state.Scene').includes([
	'lychee.app.State',
	'lychee.event.Emitter'
]).tags({
	platform: 'html'
}).exports(function(lychee, tool, global, attachments) {

	var _environment = lychee.environment;



	/*
	 * HELPERS
	 */

	var _bind_wrapper = function(sandbox) {

		var canvas  = document.querySelector('body > .lychee-Renderer');
		var wrapper = document.querySelector('#scene-preview-wrapper');

		if (canvas !== null && wrapper !== null) {

			canvas.parentNode.removeChild(canvas);
			wrapper.appendChild(canvas);
			wrapper.style.height = (global.innerHeight - 208) + 'px';


			if (this.input === null && sandbox.MAIN.input !== null) {

				sandbox.MAIN.input.unbind = function() {};
				sandbox.MAIN.input.destroy();
				sandbox.MAIN.input.unbind = lychee.Input.prototype.unbind;


				this.input = new lychee.Input({
					touch:       true,
					swipe:       true,
					key:         true,
					keymodifier: false
				});

				this.input.bind('key', function(key, name, delta) {
					sandbox.MAIN.input.trigger('key', [ key, name, delta ]);
				}, this);

				this.input.bind('touch', function(id, position, delta) {

					var box = wrapper.getBoundingClientRect();
					var x1  = box.left;
					var x2  = box.left + box.width;
					var y1  = box.top;
					var y2  = box.top + box.height;


					if (position.x >= x1 && position.y >= y1 && position.x <= x2 && position.y <= y2) {

						position.x += wrapper.scrollLeft;
						position.y += wrapper.scrollTop;

						sandbox.MAIN.input.trigger('touch', [ id, position, delta ]);

					}

				}, this);

				this.input.bind('swipe', function(id, state, position, delta, swipe) {

					var box = wrapper.getBoundingClientRect();
					var x1  = box.left;
					var x2  = box.left + box.width;
					var y1  = box.top;
					var y2  = box.top + box.height;


					if (position.x >= x1 && position.y >= y1 && position.x <= x2 && position.y <= y2) {

						position.x += wrapper.scrollLeft;
						position.y += wrapper.scrollTop;

						sandbox.MAIN.input.trigger('swipe', [ id, state, position, delta, swipe ]);

					}

				}, this);

			}

		}

	};

	var _unbind_wrapper = function() {

		if (this.input !== null) {
			this.input.destroy();
			this.input = null;
		}


		var wrapper = document.querySelector('#scene-preview-wrapper');
		var canvas  = wrapper.querySelector('canvas');
		if (canvas !== null && wrapper !== null) {
			wrapper.removeChild(canvas);
		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(main) {


		this.sandbox = null;


		lychee.app.State.call(this, main);
		lychee.event.Emitter.call(this);



		/*
		 * INITIALIZATION
		 */

		this.bind('changetool', function(tool) {

console.log(tool);

		}, this);

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		serialize:   function() {},
		deserialize: function() {},



		/*
		 * CUSTOM API
		 */

		update: function(clock, delta) {

		},

		enter: function() {

			// TODO: Figure out if timestamps are necessary or if caching issues can be prevented in Project State
			var that        = this;
			var path        = this.main.project.package.url.split('?')[0];
			var environment = new lychee.Environment({
				id:      'sandbox',
				debug:   true,
				sandbox: true,
				build:   'app.Main',
				packages: [
					new lychee.Package('lychee', '/lib/lychee/lychee.pkg'),
					new lychee.Package('app',    path)
				],
				tags: {
					platform: [ 'html' ]
				}
			});

			lychee.setEnvironment(environment);

			lychee.init(function(sandbox) {

				if (sandbox !== null) {

					var lychee = sandbox.lychee;
					var app    = sandbox.app;

					if (typeof app.Main !== 'undefined') {

						sandbox.MAIN = new app.Main();

						sandbox.MAIN.bind('init', function() {
							_bind_wrapper.call(that, sandbox);
						}, this);

						sandbox.MAIN.init();

					}

					that.environment = environment;
					that.sandbox     = sandbox;

				}

			});


			lychee.app.State.prototype.enter.call(this);

		},

		leave: function() {

			_unbind_wrapper.call(this);

			lychee.setEnvironment(_environment);


			if (this.sandbox !== null) {

				var main = this.sandbox.MAIN || null;
				if (main !== null) {
					main.destroy();
				}

				this.sandbox     = null;
				this.environment = null;

			}


			lychee.app.State.prototype.leave.call(this);

		}

	};


	return Class;

});

