precision mediump float;

uniform sampler2D uSampler;

varying vec2 v_texCoord;

void main(void) {
	gl_FragColor = texture2D(uSampler, v_texCoord);
}

