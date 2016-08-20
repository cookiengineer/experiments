
lychee.define('Renderer').tags({
	platform: 'html-webgl'
}).supports(function(lychee, global) {

	/*
	 * Hint for check against undefined
	 *
	 * typeof WebGLRenderingContext is:
	 * > function in Chrome, Firefox, IE11
	 * > object in Safari, Safari Mobile
	 *
	 */

	if (
		   typeof global.document !== 'undefined'
		&& typeof global.document.createElement === 'function'
		&& typeof global.WebGLRenderingContext !== 'undefined'
	) {

		var canvas = global.document.createElement('canvas');
		if (typeof canvas.getContext === 'function') {

			if (canvas.getContext('webgl') instanceof global.WebGLRenderingContext) {
				return true;
			}

		}

	}


	return false;

}).exports(function(lychee, global, attachments) {

	/*
	 * HELPERS
	 */

	var _programs = {};

	(function(attachments) {

		for (var file in attachments) {

			var tmp = file.split('.');
			var id  = tmp[0];
			var ext = tmp[1];


			var entry = _programs[id] || null;
			if (entry === null) {
				entry = _programs[id] = {
					fs: '',
					vs: ''
				};
			}


			if (ext === 'fs') {
				entry.fs = attachments[file].buffer;
			} else if (ext === 'vs') {
				entry.vs = attachments[file].buffer;
			}

		}

	})(attachments);



	var _init_program = function(id) {

		id = typeof id === 'string' ? id : '';


		var shader = _programs[id] || null;
		if (shader !== null) {

			var gl      = this.__ctx;
			var program = gl.createProgram();


			var fs = gl.createShader(gl.FRAGMENT_SHADER);

			gl.shaderSource(fs, shader.fs);
			gl.compileShader(fs);


			var vs = gl.createShader(gl.VERTEX_SHADER);

			gl.shaderSource(vs, shader.vs);
			gl.compileShader(vs);


			gl.attachShader(program, vs);
			gl.attachShader(program, fs);
			gl.linkProgram(program);


			var status = gl.getProgramParameter(program, gl.LINK_STATUS);
			if (status === true) {

				gl.useProgram(program);

				return program;

			}

		}


		return null;

	};



	/*
	 * HELPERS
	 */

	var _color_cache = {};

	var _is_color = function(color) {

		if (typeof color === 'string') {

			if (
				   color.match(/(#[AaBbCcDdEeFf0-9]{6})/)
				|| color.match(/(#[AaBbCcDdEeFf0-9]{8})/)
			) {

				return true;

			}

		}


		return false;

	};

	var _hex_to_rgba = function(hex) {

		if (_color_cache[hex] !== undefined) {
			return _color_cache[hex];
		}


		var rgba = [ 0, 0, 0, 1.0 ];

		if (typeof hex === 'string') {

			if (hex.length === 7) {

				rgba[0] = parseInt(hex[1] + hex[2], 16) / 256;
				rgba[1] = parseInt(hex[3] + hex[4], 16) / 256;
				rgba[2] = parseInt(hex[5] + hex[6], 16) / 256;
				rgba[3] = 1.0;

			} else if (hex.length === 9) {

 				rgba[0] = parseInt(hex[1] + hex[2], 16) / 256;
				rgba[1] = parseInt(hex[3] + hex[4], 16) / 256;
				rgba[2] = parseInt(hex[5] + hex[6], 16) / 256;
				rgba[3] = parseInt(hex[7] + hex[8], 16) / 256;

			}

		}


		_color_cache[hex] = rgba;


		return rgba;

	};

	var _texture_cache = {};

	var _get_gltexture = function(texture) {

		var url = texture.url;
		if (_texture_cache[url] !== undefined) {
			return _texture_cache[url];
		}


		var gl        = this.__ctx;
		var gltexture = gl.createTexture();
		var size      = gl.getParameter(gl.MAX_TEXTURE_SIZE);


		if (
			   texture.width  <= size
			&& texture.height <= size
		) {

			gl.bindTexture(gl.TEXTURE_2D, gltexture);
// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.buffer);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

/*
 * TODO: Figure out why Mipmaps won't work :/
			var is_power_of_two = (texture.width & (texture.width - 1) === 0);
			if (is_power_of_two === true) {
				gl.generateMipmap(gl.TEXTURE_2D);
			}
*/

			gl.bindTexture(gl.TEXTURE_2D, null);

		}


		_texture_cache[url] = gltexture;


		return gltexture;

	};



	/*
	 * STRUCTS
	 */

	var _buffer = function(width, height) {

	};

	_buffer.prototype = {
	};



	/*
	 * IMPLEMENTATION
	 */

	var _id = 0;


	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.alpha      = 1.0;
		this.background = '#000000';
		this.id         = 'lychee-Renderer-' + _id++;
		this.width      = null;
		this.height     = null;
		this.offset     = { x: 0, y: 0 };

		this.__canvas           = global.document.createElement('canvas');
		this.__canvas.className = 'lychee-Renderer-canvas';
		this.__ctx              = this.__canvas.getContext('webgl');
		global.document.body.appendChild(this.__canvas);

		this.__programs = {};


		this.setAlpha(settings.alpha);
		this.setBackground(settings.background);
		this.setId(settings.id);
		this.setWidth(settings.width);
		this.setHeight(settings.height);


		settings = null;


		for (var id in _programs) {
			this.__programs[id] = _init_program.call(this, id);
		}

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var settings = {};


			if (this.alpha !== 1.0)                           settings.alpha      = this.alpha;
			if (this.background !== '#000000')                settings.background = this.background;
			if (this.id.substr(0, 16) !== 'lychee-Renderer-') settings.id         = this.id;
			if (this.width !== null)                          settings.width      = this.width;
			if (this.height !== null)                         settings.height     = this.height;


			return {
				'constructor': 'lychee.Renderer',
				'arguments':   [ settings ],
				'blob':        null
			};

		},



		/*
		 * SETTERS AND GETTERS
		 */

		setAlpha: function(alpha) {

			alpha = typeof alpha === 'number' ? alpha : null;


			if (
				   alpha !== null
				&& alpha >= 0
				&& alpha <= 1
			) {
				this.alpha = alpha;
			}

		},

		setBackground: function(color) {

			color = _is_color(color) === true ? color : null;


			if (color !== null) {
				this.background = color;
				this.__canvas.style.backgroundColor = color;
			}

		},

		setId: function(id) {

			id = typeof id === 'string' ? id : null;


			if (id !== null) {
				this.id = id;
				this.__canvas.id = id;
			}

		},

		setWidth: function(width) {

			width = typeof width === 'number' ? width : null;


			if (width !== null) {
				this.width = width;
			} else {
				this.width = global.innerWidth;
			}


			this.__canvas.width       = this.width;
			this.__canvas.style.width = this.width + 'px';
			this.__ctx._width         = this.width;
			this.offset.x             = this.__canvas.offsetLeft;

		},

		setHeight: function(height) {

			height = typeof height === 'number' ? height : null;


			if (height !== null) {
				this.height = height;
			} else {
				this.height = global.innerHeight;
			}


			this.__canvas.height       = this.height;
			this.__canvas.style.height = this.height + 'px';
			this.__ctx._height         = this.height;
			this.offset.y              = this.__canvas.offsetTop;

		},



		/*
		 * BUFFER INTEGRATION
		 */

		clear: function(buffer) {

			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {

				// TODO: Use gl.clear(gl.COLOR_BUFFER_BIT) on buffer;
				buffer.clear();

			} else {

				var gl    = this.__ctx;
				var color = _hex_to_rgba(this.background);

				gl.clearColor(color[0], color[1], color[2], color[3]);

			}

		},

		flush: function() {

		},

// TODO: createBuffer() implementation for gl.createFramebuffer();
		createBuffer: function(width, height) {
			return new _buffer(width, height);
		},

// TODO: setBuffer();

		setBuffer: function(buffer) {

			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {
				// this.__ctx = buffer.__ctx;
			} else {
				// this.__ctx = this.__canvas.getContext('2d');
			}

		},



		/*
		 * DRAWING API
		 */

		drawArc: function(x, y, start, end, radius, color, background, lineWidth) {

// TODO: drawArc() implementation;
return;


			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;
			var pi2 = Math.PI * 2;


			ctx.globalAlpha = this.alpha;
			ctx.beginPath();

			ctx.arc(
				x,
				y,
				radius,
				start * pi2,
				end * pi2
			);

			if (background === false) {
				ctx.lineWidth   = lineWidth;
				ctx.strokeStyle = color;
				ctx.stroke();
			} else {
				ctx.fillStyle   = color;
				ctx.fill();
			}

			ctx.closePath();

		},

		drawBox: function(x1, y1, x2, y2, color, background, lineWidth) {

// TODO: drawBox() implementation;
return;

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			ctx.globalAlpha = this.alpha;

			if (background === false) {
				ctx.lineWidth   = lineWidth;
				ctx.strokeStyle = color;
				ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
			} else {
				ctx.fillStyle   = color;
				ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
			}

		},

		drawBuffer: function(x1, y1, buffer) {

// TODO: drawBuffer() implementation;
return;


			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {

				var ctx = this.__ctx;


				ctx.globalAlpha = this.alpha;
				ctx.drawImage(buffer.__buffer, x1, y1);


				if (lychee.debug === true) {

					this.drawBox(
						x1,
						y1,
						x1 + buffer.width,
						y1 + buffer.height,
						'#00ff00',
						false,
						1
					);

				}

			}

		},

		drawCircle: function(x, y, radius, color, background, lineWidth) {

// TODO: drawCircle() implementation;
return;

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			ctx.globalAlpha = this.alpha;
			ctx.beginPath();

			ctx.arc(
				x,
				y,
				radius,
				0,
				Math.PI * 2
			);


			if (background === false) {
				ctx.lineWidth   = lineWidth;
				ctx.strokeStyle = color;
				ctx.stroke();
			} else {
				ctx.fillStyle   = color;
				ctx.fill();
			}

			ctx.closePath();

		},

		drawLight: function(x, y, radius, color, background, lineWidth) {

// TODO: drawLight() implementation;
return;


			color      = _is_color(color) ? _hex_to_rgba(color) : 'rgba(255,255,255,1.0)';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

			gradient.addColorStop(0, color);
			gradient.addColorStop(1, 'rgba(0,0,0,0)');


			ctx.globalAlpha = this.alpha;
			ctx.beginPath();

			ctx.arc(
				x,
				y,
				radius,
				0,
				Math.PI * 2
			);


			if (background === false) {
				ctx.lineWidth   = lineWidth;
				ctx.strokeStyle = gradient;
				ctx.stroke();
			} else {
				ctx.fillStyle   = gradient;
				ctx.fill();
			}

			ctx.closePath();

		},

		drawLine: function(x1, y1, x2, y2, color, lineWidth) {

// TODO: drawLine() implementation;
return;


			color     = _is_color(color) === true ? color : '#000000';
			lineWidth = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			ctx.globalAlpha = this.alpha;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);

			ctx.lineWidth   = lineWidth;
			ctx.strokeStyle = color;
			ctx.stroke();

			ctx.closePath();

		},

		drawTriangle: function(x1, y1, x2, y2, x3, y3, color, background, lineWidth) {

// TODO: drawTriangle() implementation;
return;


			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			ctx.globalAlpha = this.alpha;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.lineTo(x3, y3);
			ctx.lineTo(x1, y1);

			if (background === false) {
				ctx.lineWidth   = lineWidth;
				ctx.strokeStyle = color;
				ctx.stroke();
			} else {
				ctx.fillStyle   = color;
				ctx.fill();
			}

			ctx.closePath();

		},

		// points, x1, y1, [ ... x(a), y(a) ... ], [ color, background, lineWidth ]
		drawPolygon: function(points, x1, y1) {

// TODO: drawPolygon() implementation;
return;


			var l = arguments.length;

			if (points > 3) {

				var optargs = l - (points * 2) - 1;


				var color, background, lineWidth;

				if (optargs === 3) {

					color      = arguments[l - 3];
					background = arguments[l - 2];
					lineWidth  = arguments[l - 1];

				} else if (optargs === 2) {

					color      = arguments[l - 2];
					background = arguments[l - 1];

				} else if (optargs === 1) {

					color      = arguments[l - 1];

				}


				color      = _is_color(color) === true ? color : '#000000';
				background = background === true;
				lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


				var ctx = this.__ctx;


				ctx.globalAlpha = this.alpha;
				ctx.beginPath();
				ctx.moveTo(x1, y1);

				for (var p = 1; p < points; p++) {

					ctx.lineTo(
						arguments[1 + p * 2],
						arguments[1 + p * 2 + 1]
					);

				}

				ctx.lineTo(x1, y1);

				if (background === false) {
					ctx.lineWidth   = lineWidth;
					ctx.strokeStyle = color;
					ctx.stroke();
				} else {
					ctx.fillStyle   = color;
					ctx.fill();
				}

				ctx.closePath();

			}

		},

		drawSprite: function(x1, y1, texture, map) {

			texture = texture instanceof Texture ? texture : null;
			map     = map instanceof Object      ? map     : null;

console.log(x1, y1);

if (y1 < 0) {
	return;
}


			var program = this.__programs['Sprite'];
			if (
				   program !== null
				&& texture !== null
			) {

				var gl  = this.__ctx;
				var tex = _get_gltexture.call(this, texture);

				var  x2 = 0,  y2 = 0;
				var tx1 = 0, ty1 = 0;
				var tx2 = 0, ty2 = 0;


				// TODO: alpha implementation in shader
				// ctx.globalAlpha = this.alpha;

				if (map === null) {

					x2  = x1 + texture.width;
					y2  = y1 + texture.height;

					tx1 = 0;
					ty1 = 0;
					tx2 = 1.0;
					ty2 = 1.0;

				} else {

					x2  = x1 + map.w;
					y2  = y1 + map.h;

					tx1 = map.x / texture.width;
					ty1 = map.y / texture.height;
					tx2 = tx1 + (map.w / texture.width);
					ty2 = ty1 + (map.h / texture.height);

					if (lychee.debug === true) {

						this.drawBox(
							x1,
							y1,
							x2,
							y2,
							'#ff0000',
							false,
							1
						);

					}

				}


				gl.useProgram(program);
				gl.bindTexture(gl.TEXTURE_2D, tex);



				console.log(tx1, ty1, ' > ', tx2, ty2);
				console.log(x1, y1, ' >> ', x2, y2);


				var texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
				var texCoordBuffer   = gl.createBuffer();

				gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
					tx1, ty1,
					tx2, ty1,
					tx1, ty2,
					tx1, ty2,
					tx2, ty1,
					tx2, ty2
				]), gl.STATIC_DRAW);

				gl.enableVertexAttribArray(texCoordLocation);
				gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


				var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

				gl.uniform2f(resolutionLocation, gl._width, gl._height);


				var positionLocation = gl.getAttribLocation(program, 'a_position');
				var positionBuffer   = gl.createBuffer();

				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

				gl.enableVertexAttribArray(positionLocation);
				gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
					x1, y1,
					x2, y1,
					x1, y2,
					x1, y2,
					x2, y1,
					x2, y2
				]), gl.STATIC_DRAW);


				gl.drawArrays(gl.TRIANGLES, 0, 6);












/*


 // setup GLSL program
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);




}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

*/






































































/*

				var textureBuffer = gl.createBuffer();

				gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
					tx1 / texture.width, ty1 / texture.height,
					tx2 / texture.width, ty1 / texture.height,
					tx1 / texture.width, ty2 / texture.height,
					tx1 / texture.width, ty2 / texture.height,
					tx2 / texture.width, ty1 / texture.height,
					tx2 / texture.width, ty2 / texture.height
				]), gl.STATIC_DRAW);
				gl.vertexAttribPointer(program._aTexture, 2, gl.FLOAT, false, 0, 0);

				gl.bindTexture(gl.TEXTURE_2D, tex);


				gl.uniform2f(program._uViewport, gl._width, gl._height);
				gl.uniform1i(program._uSampler, 0);


				var positionBuffer = gl.createBuffer();

				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				gl.enableVertexAttribArray(program._aPosition);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
					x1 / gl._width, y1 / gl._height,
					x2 / gl._width, y1 / gl._height,
					x1 / gl._width, y2 / gl._height,
					x1 / gl._width, y2 / gl._height,
					x2 / gl._width, y1 / gl._height,
					x2 / gl._width, y2 / gl._height
				]), gl.STATIC_DRAW);
				gl.vertexAttribPointer(program._aPosition, 2, gl.FLOAT, false, 0, 0);


				gl.drawArrays(gl.TRIANGLES, 0, 6);

				gl.deleteBuffer(positionBuffer);
				gl.deleteBuffer(textureBuffer);

*/

			}

		},

		drawText: function(x1, y1, text, font, center) {

// TODO: drawText() implementation;
return;


			font   = font instanceof Font ? font : null;
			center = center === true;


			if (font !== null) {

				if (center === true) {

					var dim = font.measure(text);

					x1 -= dim.realwidth / 2;
					y1 -= (dim.realheight - font.baseline) / 2;

				}


				y1 -= font.baseline / 2;


				var margin  = 0;
				var texture = font.texture;
				if (texture !== null) {

					var ctx = this.__ctx;


					ctx.globalAlpha = this.alpha;

					for (t = 0, l = text.length; t < l; t++) {

						var chr = font.measure(text[t]);

						if (lychee.debug === true) {

							this.drawBox(
								x1 + margin,
								y1,
								x1 + margin + chr.realwidth,
								y1 + chr.height,
								'#00ff00',
								false,
								1
							);

						}

						ctx.drawImage(
							texture.buffer,
							chr.x,
							chr.y,
							chr.width,
							chr.height,
							x1 + margin - font.spacing,
							y1,
							chr.width,
							chr.height
						);

						margin += chr.realwidth + font.kerning;

					}

				}

			}

		},



		/*
		 * RENDERING API
		 */

		renderEntity: function(entity, offsetX, offsetY) {

			if (typeof entity.render === 'function') {

				entity.render(
					this,
					offsetX || 0,
					offsetY || 0
				);

			}

		}

	};


	return Class;

});

