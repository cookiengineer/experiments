#!/usr/bin/env nodejs

var _cli = require(__dirname + '/cli.js');



/*
 * USAGE
 */

if (typeof Array.prototype.diff !== 'function') {

	Array.prototype.diff = function(array) {

		var i;
		var diff = [];

		for (i = 0; i < this.length; i++) {

			if (array.indexOf(this[i]) === -1) {
				diff.push(this[i]);
			}

		}

		for (i = 0; i < array.length; i++) {

			if (this.indexOf(array[i]) === -1) {

				if (diff.indexOf(array[i]) === -1) {
					diff.push(array[i]);
				}

			}

		}

		return diff;

	};

}

var _print_help = function() {

	console.log('                                                                                            ');
	console.log('============================================================================================');
	console.log('                   _                                                                        ');
	console.log('              {+~/`o;==-    ,_(+--,                    lycheeJS v0.8 Dispenser              ');
	console.log('         .----+-/`-/          (+--; ,--+)_,                                                 ');
	console.log('          `+-..-| /               | ;--+)     @        (API Documentation Tool)             ');
	console.log('               /|/|           .-. |.| .-.    <|>                                            ');
	console.log('               `--`              ~| |~        |                                             ');
	console.log('    ^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^=^-.-^     ');
	console.log('                                                                                            ');
	console.log('                                                                                            ');
	console.log('Usage: dispenser [/path/to/project/api/Definition.md]                                       ');
	console.log('                                                                                            ');
	console.log('                                                                                            ');
	console.log('Important:                                                                                  ');
	console.log('                                                                                            ');
	console.log('- The path to the file MUST contain the /api/ directory structure.                          ');
	console.log('- A valid Definition.js MUST exist in the /source/ directory structure.                     ');
	console.log('- If the file does not exist, it will create a template.                                    ');
	console.log('- If the file does exist, it will validate the api documentation.                           ');
	console.log('                                                                                            ');
	console.log('Examples:                                                                                   ');
	console.log('                                                                                            ');
	console.log('dispenser ./lychee/api/core/Input.md                                                        ');
	console.log('dispenser ./lychee/api/data/JSON.md                                                         ');
	console.log('                                                                                            ');

};


var _settings = null;

(function() {

	var get_candidates = function(path) {

		var identifier = get_identifier(path);
		var pkg        = get_package(path);
		var tmp        = path.split('/');
		var index      = tmp.indexOf('api');

		var candidates = [];

		if (index > 0) {

			var iscore = false;

			for (var t = index; t < tmp.length; t++) {

				if (tmp[t] === 'core') {
					tmp.splice(t, 1);
					index  = tmp.indexOf('api');
					iscore = true;
					break;
				}

			}

			tmp[tmp.length - 1] = tmp[tmp.length - 1].split('.')[0];


			if (iscore === true) {
				candidates.push(tmp.slice(0, index).join('/') + '/source/core/' + tmp.slice(index + 1).join('/') + '.js');
			} else {
				candidates.push(tmp.slice(0, index).join('/') + '/source/' + tmp.slice(index + 1).join('/') + '.js');
			}

		}


		if (pkg !== null) {

			var tags = pkg.source.tags || null;
			if (tags !== null) {

				Object.keys(tags).forEach(function(tag) {
					Object.keys(tags[tag]).forEach(function(value) {
						candidates.push(tmp.slice(0, index).join('/') + '/source/' + tags[tag][value] + '/' + identifier.split('.').slice(1).join('/') + '.js');
					});
				});

			}

		}


		return candidates.filter(function(candidate) {
			return _cli.isFile(candidate);
		});

	};

	var get_identifier = function(path) {

		var tmp   = path.split('/');
		var index = tmp.indexOf('api');


		if (index > 0) {

			var namespace = tmp[index - 1];

			tmp[tmp.length - 1] = tmp[tmp.length - 1].split('.')[0];

			if (tmp[index + 1] === 'core') {
				return namespace + '.' + tmp.slice(index + 2).join('.');
			} else {
				return namespace + '.' + tmp.slice(index + 1).join('.');
			}

		}


		return null;

	};

	var get_package = function(path) {

		var tmp   = path.split('/');
		var index = tmp.indexOf('api');

		if (index > 0) {
			return _cli.read(tmp.slice(0, index).join('/') + '/lychee.pkg');
		}


		return null;

	};



	var path = process.argv[2] || null;
	if (path !== null) {

		var tmp  = path.split('/');
		var mode = 'create';

		if (_cli.isFile(path) === true) {
			mode = 'validate';
		}


		var index = tmp.indexOf('api');
		if (index > 0) {

			var candidates = get_candidates(path);
			var identifier = get_identifier(path);

			if (candidates.length > 0 && identifier !== null) {

				_settings = {
					identifier: identifier,
					mode:       mode,
					path:       path,
					candidates: candidates
				};

			}

		}

	}

})();



/*
 * IMPLEMENTATION
 */

(function(cli, settings) {

	var lychee = cli.lychee;
	var global = cli.global;



	/*
	 * HELPERS
	 */

	var _parse_expression = function(name, expr) {

		if (expr.indexOf('?') !== -1) {
			expr = expr.split('?')[0].trim();
		}

		if (expr[0] === '(') expr = expr.substr(1);

		if (expr.indexOf('&&') !== -1) {
			expr = expr.substr(0, expr.indexOf('&&')).trim();
		}


		var type = undefined;

		if (expr === name + ' instanceof Object') {
			type = 'Object';
		} else if (expr === name + ' instanceof Function') {
			type = 'Function';
		} else if (expr === 'typeof ' + name + ' === \'number\'') {
			type = 'Number';
		} else if (expr === 'typeof ' + name + ' === \'string\'') {
			type = 'String';
		} else if (name === 'scope' && expr === 'scope !== undefined') {
			type = 'Scope';
		}


		return type;

	};

	var _parse_definition = function(identifier, code) {

		var classindex  = code.indexOf('\n\tvar Class = function(');
		var moduleindex = code.indexOf('\n\tvar Module = {');
		if (classindex !== -1) {
			return _parse_definition_class(identifier, code.substr(classindex));
		} else if (moduleindex !== -1) {
			return _parse_definition_module(identifier, code.substr(moduleindex));
		}


		return null;

	};

	var _parse_definition_class = function(identifier, code) {

		var api = {
			identifier: identifier,
			type:       'Class',
			arguments:  [],
			enums:      [],
			events:     [],
			properties: [],
			methods:    []
		};



		/*
		 * 1. Parse Constructor
		 */

		(function(chunk) {

			var str1 = '\n\tvar Class = function(';
			var str2 = '\t\tthis.';
			var str3 = '\t\tthis._';
			var str4 = 'settings.';

			var l1   = str1.length;
			var l2   = str2.length;
			var l3   = str3.length;
			var l4   = str4.length;


			var args = chunk.substr(l1, chunk.indexOf(') {\n') - l1).split(', ');
			if (args[0] === 'data' || args[0] === 'settings') {

				api.arguments.push({
					name:       'settings',
					type:       'Object',
					properties: []
				});

			} else {

				args.forEach(function(value) {

					api.arguments.push({
						name:       value,
						type:       'undefined',
						properties: []
					});

				});

			}


			chunk.split('\n').filter(function(value) {
				return value.substr(0, 2) === '\t\t';
			}).forEach(function(line) {

				if (line.substr(0, l2) === str2 && line.substr(0, l3) !== str3) {

					var ch = line.substr(l2);
					if (ch.indexOf('=') !== -1) {

						var name  = ch.split('=')[0].trim();
						var value = ch.split('=')[1].trim().split(';')[0];
						var type  = 'undefined';

						if (value === 'true' || value === 'false') {
							type = 'Boolean';
						} else if (value.substr(0, 1) === '{') {
							type = 'Object';
						} else if (!isNaN(parseInt(value, 10))) {
							type = 'Number';
						} else if (value.substr(0, 6) === 'Class.') {
							type = 'Enum';
						} else if (ch.indexOf('?') !== -1) {

							var tmp1 = _parse_expression('settings.' + name, ch.split('=').slice(1).join('=').trim());
							var tmp2 = ch.split(':').pop().split(';')[0].trim();

							if (tmp1 !== undefined) {
								value = tmp2;
								type  = tmp1;
							}

							if (tmp2.substr(0, 1) === '_') {
								value = 'undefined';
							}

						} else if (value.substr(0, 1) === '_') {
							value = 'undefined';
						}


						api.properties.push({
							name:   name,
							type:   type,
							value:  value,
							method: null
						});

					} else if (ch.indexOf('(') !== -1) {

						var method = ch.split('(')[0].trim();
						var prop   = null;

						if (method.substr(0, 3) === 'set') {
							prop = method.substr(3).toLowerCase();
						}


						var tmp3 = api.properties.map(function(val) { return val.name; });
						var tmp4 = ch.substr(ch.indexOf(str4) + l4).split(')')[0];

						if (prop !== null) {

							if (tmp3.indexOf(prop) !== -1) {
								api.properties[tmp3.indexOf(prop)].method = method;
							}

						}

						if (ch.indexOf(str4) !== -1) {

							api.arguments[0].properties.push({
								name: tmp4,
								type: api.properties[tmp3.indexOf(prop)].type
							});

						}

					}

				}

			});

		})(code.substr(code.indexOf('\n\tvar Class = '), code.indexOf('\n\t};')));

		code = code.substr(code.indexOf('\n\t};') + 4);



		/*
		 * 2. Parse Enums
		 */

		(function(chunk) {

			var str1 = 'Class.';
			var str2 = '= {';

			var l1   = str1.length;
			var l2   = str2.length;


			var enums = chunk.split('\n\t};');
			if (enums.length > 0) {

				enums.forEach(function(ch) {

					var i1         = ch.indexOf(str1);
					var i2         = ch.indexOf(str2, ch.indexOf(str1));
					var name       = ch.substr(i1, i2 - i1).split('.').slice(1).join('.').trim();
					var properties = [];

					ch.substr(i2 + l2).split('\n').forEach(function(sch) {

						if (sch.indexOf(':') !== -1) {

							var tmp1 = sch.split(':')[0].trim();
							if (properties.indexOf(tmp1) === -1) {
								properties.push(tmp1);
							}

						}

					});


					if (name !== '' && properties.length > 0) {

						api.enums.push({
							name:       name,
							properties: properties
						});

					}

				});

			}

		})(code.substr(code.indexOf('\n\tClass.'), code.indexOf('\n\tClass.prototype = {')));

		code = code.substr(code.indexOf('\n\tClass.prototype = {'));


		/*
		 * 3. Parse Methods
		 */

		(function(chunk) {

			var str1 = '\n\tClass.prototype = {';
			var str2 = 'function(';
			var str3 = 'return';
			var str4 = '\t\t\tif (lychee.enumof(';

			var l1   = str1.length;
			var l2   = str2.length;
			var l3   = str3.length;
			var l4   = str4.length;

			var methods = chunk.substr(l1).split('\n\t\t},');
			if (methods.length > 0) {

				methods.forEach(function(ch) {

					var name   = null;
					var args   = [];
					var values = [];


					ch.split('\n').forEach(function(line) {

						if (line.trim().substr(0, 2) === '//') return;

						if (line.indexOf(str2) !== -1) {

							name = line.split(':')[0].trim();
							args = line.split(':')[1].trim().substr(l2).split(')')[0].split(', ').map(function(value) {
								return { name: value, type: 'undefined' };
							});

							if (args[0].name === '') {
								args = [];
							}

						}

					});


					ch.split('\n').forEach(function(line) {

						if (line.indexOf(str3) !== -1) {

							var expr = line.substr(line.indexOf(str3) + l3).trim().split(';')[0];
							if (expr.substr(0, 1) === '{') {

								if (name === 'serialize') {

									if (values.indexOf('Serialization Object') === -1) {
										values.push('Serialization Object');
									}

								} else {

									if (values.indexOf('Object') === -1) {
										values.push('Object');
									}

								}

							} else if (expr === 'true' || expr === 'false' || expr.indexOf('(') !== -1 || expr.indexOf('&&')) {

								if (values.indexOf('true') === -1) {
									values.push('true');
								}

								if (values.indexOf('false') === -1) {
									values.push('false');
								}

							}

						}

					});


					ch.split('\n').forEach(function(line) {

						var tmp1 = args.map(function(val) { return val.name });

						if (line.substr(0, 3) === '\t\t\t' && line.indexOf('=') !== -1 && line.indexOf('?') !== -1) {

							var argname = line.split('=')[0].trim();
							var argtype = _parse_expression(argname, line.split('=').slice(1).join('=').trim());

							if (argtype !== undefined && tmp1.indexOf(argname) !== -1) {
								args[tmp1.indexOf(argname)].type = argtype;
							}

						} else if (line.indexOf('if (') !== -1 && line.indexOf(' === true') !== -1 && line.indexOf(' === false') !== -1) {

							var argname = line.trim().substr('if ('.length).split('=')[0].trim();

							if (tmp1.indexOf(argname) !== -1) {
								args[tmp1.indexOf(argname)].type = 'Boolean';
							}

						} else if (line.substr(0, l4) === str4) {

							var tmp2    = line.substr(l4, line.indexOf(')') - l4);
							var argenum = tmp2.split(',')[0].trim();
							var argname = tmp2.split(',')[1].trim();
							var argtype = 'Enum';

							if (tmp1.indexOf(argname) !== -1) {
								args[tmp1.indexOf(argname)].type = argtype;
								args[tmp1.indexOf(argname)].enum = argenum;
							}

						}

					});


					if (name !== null) {

						api.methods.push({
							name:      name,
							arguments: args,
							returns:   values
						});

					}

				});

			}


		})(code.substr(code.indexOf('\n\tClass.prototype = {'), code.indexOf('\n\t};')));


		/*
		 * TODO: Parse Events
		 */


		return api;

	};

	var _parse_definition_module = function(identifier, code) {

		var api = {
			identifier: identifier,
			type:       'Module',
			methods:    []
		};



		/*
		 * 1. Parse Methods
		 */

		(function(chunk) {

			var str1 = '\n\tvar Module = {';
			var str2 = 'function(';
			var str3 = 'return';
			var str4 = '\t\tif (lychee.enumof(';

			var l1   = str1.length;
			var l2   = str2.length;
			var l3   = str3.length;
			var l4   = str4.length;

			var methods = chunk.substr(l1).split('\n\t\t},');
			if (methods.length > 0) {

				methods.forEach(function(ch) {

					var name   = null;
					var args   = [];
					var values = [];


					ch.split('\n').forEach(function(line) {

						if (line.trim().substr(0, 2) === '//') return;

						if (line.indexOf(str2) !== -1) {

							name = line.split(':')[0].trim();
							args = line.split(':')[1].trim().substr(l2).split(')')[0].split(', ').map(function(value) {
								return { name: value, type: 'undefined' };
							});

							if (args[0].name === '') {
								args = [];
							}

						}

					});


					ch.split('\n').forEach(function(line) {

						if (line.indexOf(str3) !== -1) {

							var expr = line.substr(line.indexOf(str3) + l3).trim().split(';')[0];
							if (expr.substr(0, 1) === '{') {

								if (name === 'serialize') {

									if (values.indexOf('Serialization Object') === -1) {
										values.push('Serialization Object');
									}

								} else {

									if (values.indexOf('Object') === -1) {
										values.push('Object');
									}

								}

							} else if (expr === 'true' || expr === 'false' || expr.indexOf('&&') !== -1) {

								if (values.indexOf('true') === -1) {
									values.push('true');
								}

								if (values.indexOf('false') === -1) {
									values.push('false');
								}

							} else if (expr === 'null') {

								if (values.indexOf('null') === -1) {
									values.push('null');
								}

							} else if (expr === 'object') {

								if (values.indexOf('Object') === -1) {
									values.push('Object');
								}

							} else if (expr.indexOf('toString()') !== -1) {

								if (values.indexOf('String') === -1) {
									values.push('String');
								}

							}

						}

					});


					ch.split('\n').forEach(function(line) {

						var tmp1 = args.map(function(val) { return val.name });

						if (line.substr(0, 3) === '\t\t\t' && line.indexOf('=') !== -1 && line.indexOf('?') !== -1) {

							var argname = line.split('=')[0].trim();
							var argtype = _parse_expression(argname, line.split('=').slice(1).join('=').trim());

							if (argtype !== undefined && tmp1.indexOf(argname) !== -1) {
								args[tmp1.indexOf(argname)].type = argtype;
							}

						} else if (line.substr(0, l4) === str4) {

							var tmp2    = line.substr(l4, line.indexOf(')') - l4);
							var argenum = tmp2.split(',')[0].trim();
							var argname = tmp2.split(',')[1].trim();
							var argtype = 'Enum';

							if (tmp1.indexOf(argname) !== -1) {
								args[tmp1.indexOf(argname)].type = argtype;
								args[tmp1.indexOf(argname)].enum = argenum;
							}

						}

					});


					if (name !== null) {

						api.methods.push({
							name:      name,
							arguments: args,
							returns:   values
						});

					}

				});

			}

		})(code.substr(code.indexOf('\n\tvar Module = {'), code.indexOf('\n\t};')));


		return api;

	};



	/*
	 * INITIALIZATION
	 */

	if (settings !== null) {

		// 1. Parse Definition Constructor and Methods
		// 2. If Mode is validate
		// 2t Validate the Markdown File
		// 2f Create the Markdown Template



		var identifier  = settings.identifier;
		var candidates  = settings.candidates;
		var definitions = candidates.map(function(url) {
			return _cli.read(url);
		}).filter(function(value) {
			return value !== null;
		});


		var main_candidate  = null;
		var main_definition = null;
		var main_api        = null;


		if (candidates.length === definitions.length) {

			main_candidate  = candidates.pop();
			main_definition = definitions.pop();
			main_api        = _parse_definition(identifier, main_definition);


			definitions.forEach(function(test_definition, index) {

				var test_candidate = candidates[index];
				var test_api       = _parse_definition(identifier, test_definition);

				if (lychee.diff(main_api, test_api) === true) {

					var types  = [ 'events', 'enums', 'properties', 'methods' ];
					var labels = [ 'Event',  'Enum',  'Property',   'Method'  ];

					types.forEach(function(type, index) {

						var label = labels[index];
						var adata = main_api[type].map(function(value) { return value.name; });
						var bdata = test_api[type].map(function(value) { return value.name; });

						var diff  = adata.diff(bdata);
						if (diff.length > 0) {

							diff.forEach(function(name) {
								console.error('dispenser: Missing ' + label + ' ' + identifier + '.' + name);
							});

						} else {

							if (type === 'methods') {

								main_api.methods.forEach(function(main_method, index) {

									var test_method = test_api.methods[index];
									if (JSON.stringify(main_method) !== JSON.stringify(test_method)) {
										console.error('dispenser: Difference in Method ' + identifier + '.prototype.' + test_method.name + '(' + test_method.arguments.join(', ') + ')');
									}

								});

							}

						}

					});

				}

			});

		}


// TODO: Parse Markdown into API structure
// TODO: Compare Markdown File with Definition API


		if (main_api !== null) {

			if (settings.mode === 'validate') {
				// TODO: Validate API against Markdown API
			} else if (settings.mode === 'create') {

			}

console.log(settings);
console.log('APIDATA', JSON.stringify(main_api, null, '\t'));

		} else {

			console.error('dispenser: Code Style not supported by Dispenser');
			process.exit(1);

		}


		process.exit(0);

	} else {

		console.error('fertilizer: Invalid File');


		_print_help();
		process.exit(1);

	}

})(_cli, _settings);

