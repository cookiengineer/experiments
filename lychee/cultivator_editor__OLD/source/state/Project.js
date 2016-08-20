
lychee.define('tool.state.Project').includes([
	'lychee.app.State',
	'lychee.event.Emitter'
]).tags({
	platform: 'html'
}).exports(function(lychee, tool, global, attachments) {

	/*
	 * HELPERS
	 */

	var _save_project = function(project, callback) {

		callback = callback instanceof Function ? callback : function(){};


		var identifier = project.identifier || null;
		var data       = lychee.serialize(project.package);
		if (identifier !== null && data instanceof Object) {

			data.arguments[0] = data.arguments[0].split('?')[0];

			var xhr = new XMLHttpRequest();

			xhr.open('PUT', 'http://localhost:4848/api/Asset?identifier=' + identifier, true);

			xhr.onload = function() {
				callback(true);
			};

			xhr.onerror = xhr.ontimeout = function() {
				callback(false);
			};

			xhr.send(JSON.stringify(data));

		}

	};

	var _add_build = function(identifier, definition) {

		var namespace = definition.split('.')[0];
		var platforms = [ identifier.split('/')[0] ];
		if (platforms[0].indexOf('-') !== -1) {
			platforms.push(platforms[0].split('-')[0]);
		}

		var env = this.package.buffer.build.environments[identifier] || null;
		if (env !== null) {

			env.build         = definition;
			env.packages      = [[ namespace, './lychee.pkg' ]];
			env.tags.platform = platforms;

		} else {

			this.package.buffer.build.environments[identifier] = {
				build:    definition,
				debug:    false,
				sandbox:  false,
				packages: [[ namespace, './lychee.pkg' ]],
				tags:     {
					platform: platforms
				},
				variant:  'application'
			};

		}

	};

	var _remove_build = function(identifier) {

		var env = this.package.buffer.build.environments[identifier] || null;
		if (env !== null) {
			delete this.package.buffer.build.environments[identifier];
		}

	};

	var _ui_update = function(identifier) {

		var config = new Config('http://localhost:4848/api/Project?timestamp=' + Date.now());
		var that   = this;

		config.onload = function(result) {

			if (this.buffer instanceof Array) {

				var buffer = this.buffer.filter(function(project) {
					return !project.identifier.match(/cultivator/);
				});

				if (buffer.length > 0) {

					buffer.forEach(function(project) {

						var id = project.identifier;

						if (that.main.projects[id] instanceof Object) {

							that.main.projects[id].identifier = project.identifier;
							that.main.projects[id].filesystem = project.filesystem;
							that.main.projects[id].harvester  = project.harvester;
							that.main.projects[id].package    = new Config('/projects/' + project.identifier + '/lychee.pkg?timestamp=' + Date.now());

						} else {

							that.main.projects[id] = {
								identifier: project.identifier,
								filesystem: project.filesystem,
								harvester:  project.harvester === true,
								package:    new Config('/projects/' + project.identifier + '/lychee.pkg?timestamp=' + Date.now())
							};

						}

					});

				}


				if (that.main.project === null) {

					var project = that.main.projects[identifier] || that.main.projects['boilerplate'];
					if (project !== null) {

						that.main.project = project;
						that.main.project.package.onload = function() {
							_ui_render_settings.call(that, that.main.project);
						};

					}

				}


				_ui_render_selection.call(that, buffer);

				Object.values(that.main.projects).forEach(function(project) {
					project.package.load();
				});

			}

		};

		config.load();

	};

	var _ui_render_selection = function(projects) {

		if (projects instanceof Array) {

			var code = '';
			var that = this;
			var id   = this.main.project !== null ? this.main.project.identifier : null;


			code = projects.map(function(project, index) {

				var checked = id === project.identifier;
				var chunk   = '';

				chunk += '<li>';
				chunk += '<input name="identifier" type="radio" value="' + project.identifier + '"' + (checked ? ' checked' : '') + '>';
				chunk += '<span>' + project.identifier + '</span>';
				chunk += '</li>';

				return chunk;

			}).join('');


			ui.render(code, '#project-selection ul.select');

		}

	};

	var _ui_render_settings = function(project) {

		if (project instanceof Object) {

			var code = '';
			var data = {};

			Object.keys(project.package.buffer.build.environments).forEach(function(id, index) {

				var platform   = id.split('/')[0];
				var identifier = id.split('/')[1];
				var definition = project.package.buffer.build.environments[id].build;

				if (data[identifier] instanceof Object) {

					data[identifier].platforms.push(platform);

				} else {

					data[identifier] = {
						identifier: identifier,
						definition: definition,
						platforms:  [ platform ]
					};

				}

			});


			Object.keys(data).forEach(function(identifier, index) {

				var build = data[identifier];

				code += '<tr>';
				code += '<td><input name="identifier-'   + index + '" type="text" value="' + build.identifier + '"></td>';
				code += '<td><input name="definition-'   + index + '" type="text" value="' + build.definition + '"></td>';
				code += '<td><input name="html-'         + index + '" type="checkbox"' + (build.platforms.indexOf('html') !== -1         ? ' checked' : '') + '></td>';
				code += '<td><input name="html-nwjs-'    + index + '" type="checkbox"' + (build.platforms.indexOf('html-nwjs') !== -1    ? ' checked' : '') + '></td>';
				code += '<td><input name="html-webview-' + index + '" type="checkbox"' + (build.platforms.indexOf('html-webview') !== -1 ? ' checked' : '') + '></td>';
				code += '<td><input name="node-'         + index + '" type="checkbox"' + (build.platforms.indexOf('node') !== -1         ? ' checked' : '') + '></td>';
				code += '<td><input name="node-sdl'      + index + '" type="checkbox"' + (build.platforms.indexOf('node-sdl') !== -1     ? ' checked' : '') + '></td>';
				code += '<td><button class="ico-remove ico-only" onclick="MAIN.state.trigger(\'remove-build\', [ \'' + build.identifier + '\' ]);return false;"></button></td>';
				code += '</tr>';

			});


			ui.render(code,                                            '#project-settings table:nth-of-type(2) tbody');
			ui.render(project.identifier,                              '#project-settings-identifier');
			ui.render('/projects/' + project.identifier + '/icon.png', '#project-settings-preview');

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(main) {

		lychee.app.State.call(this, main);
		lychee.event.Emitter.call(this);



		/*
		 * INITIALIZATION
		 */

		this.main.bind('changestate', _ui_update, this);

		this.bind('submit', function(id, settings) {

			if (id === 'selection') {

				var project = this.main.projects[settings['identifier']] || null;
				if (project instanceof Object) {
					this.main.project = project;
					_ui_render_settings.call(this, this.main.project);
				}

			} else if (id === 'settings') {

				var project = this.main.project;
				if (project !== null) {


// TODO: Upload of settings.file


					delete settings.identifier;
					delete settings.file;
					delete settings[''];


					var length = (Object.keys(settings).length / 7) - 1;

					for (var i = 0; i <= length; i++) {

						var identifier   = settings['identifier-'   + i];
						var definition   = settings['definition-'   + i];
						var html         = settings['html-'         + i];
						var html_nwjs    = settings['html-nwjs-'    + i];
						var html_webview = settings['html-webview-' + i];
						var node         = settings['node-'         + i];
						var node_sdl     = settings['node-sdl'      + i];

						if (html === 'on') {
							_add_build.call(project, 'html/' + identifier, definition);
						} else {
							_remove_build.call(project, 'html/' + identifier);
						}

						if (html_nwjs === 'on') {
							_add_build.call(project, 'html-nwjs/' + identifier, definition);
						} else {
							_remove_build.call(project, 'html-nwjs/' + identifier);
						}

						if (html_webview === 'on') {
							_add_build.call(project, 'html-webview/' + identifier, definition);
						} else {
							_remove_build.call(project, 'html-webview/' + identifier);
						}

						if (node === 'on') {
							_add_build.call(project, 'node/' + identifier, definition);
						} else {
							_remove_build.call(project, 'node/' + identifier);
						}

						if (node_sdl === 'on') {
							_add_build.call(project, 'node-sdl/' + identifier, definition);
						} else {
							_remove_build.call(project, 'node-sdl/' + identifier);
						}

					}

					_save_project(project);

				}

			}

		}, this);

		this.bind('add-build', function(identifier, definition, html, html_nwjs, html_webview, node, node_sdl) {

			var project = this.main.project;
			if (project !== null) {

				if (html === 'on')         _add_build.call(project, 'html/'         + identifier, definition);
				if (html_nwjs === 'on')    _add_build.call(project, 'html-nwjs/'    + identifier, definition);
				if (html_webview === 'on') _add_build.call(project, 'html-webview/' + identifier, definition);
				if (node === 'on')         _add_build.call(project, 'node/'         + identifier, definition);
				if (node_sdl === 'on')     _add_build.call(project, 'node-sdl/'     + identifier, definition);

				_ui_render_settings.call(this, project);
				_save_project(project);

			}

		}, this);

		this.bind('remove-build', function(identifier) {

			var project = this.main.project;
			if (project !== null) {

				_remove_build.call(project, 'html/'         + identifier);
				_remove_build.call(project, 'html-nwjs/'    + identifier);
				_remove_build.call(project, 'html-webview/' + identifier);
				_remove_build.call(project, 'node/'         + identifier);
				_remove_build.call(project, 'node-sdl/'     + identifier);

				_ui_render_settings.call(this, project);
				_save_project(project);

			}

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

		enter: function(project) {

			project = project instanceof Object ? project : { identifier: null };


			_ui_update.call(this, project.identifier);


			lychee.app.State.prototype.enter.call(this);

		},

		leave: function() {

			lychee.app.State.prototype.leave.call(this);

		}

	};


	return Class;

});

