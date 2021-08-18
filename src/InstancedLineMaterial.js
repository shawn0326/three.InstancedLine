import vertexShader from './shaders/vertex.glsl.js';
import fragmentShader from './shaders/fragment.glsl.js';

// Fix shader bug
const modifiedShaderChunk = THREE.ShaderChunk.logdepthbuf_vertex.replace(
	'vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) )',
	'vIsPerspective = isPerspectiveMatrix( projectionMatrix ) ? 1.0 : 0.0'
);
const modifiedVertexShader =  vertexShader.replace('#include <logdepthbuf_vertex>', modifiedShaderChunk);

export class InstancedLineMaterial extends THREE.ShaderMaterial {

	constructor() {
		super({
			type: 'InstancedLineMaterial',
			defines: {
				DISABLE_CORNER_BROKEN: false,
				FLAT_W: false,
				SWAP_UV: false,
				SIMPLE_UV: false,
				SCREEN_UV: false // TODO
			},
			uniforms: THREE.UniformsUtils.merge([
				THREE.UniformsLib['fog'],
				{
					resolution: { value: new THREE.Vector2(512, 512) },
					lineWidth: { value: 2 },
					cornerThreshold: { value: 0.4 },

					opacity: { value: 1 },
					color: { value: new THREE.Color() },
					map: { value: null },
					alphaMap: { value: null },

					uvTransform: { value: new THREE.Matrix3() },
					uvTransform1: { value: new THREE.Matrix3() } // for alpha map
				}
			]),
			vertexShader: modifiedVertexShader,
			fragmentShader: fragmentShader
		});
		this.fog = true;
	}

	set lineWidth(value) {
		this.uniforms.lineWidth.value = value;
	}

	get lineWidth() {
		return this.uniforms.lineWidth.value;
	}

	set cornerThreshold(value) {
		this.uniforms.cornerThreshold.value = value;
	}

	get cornerThreshold() {
		return this.uniforms.cornerThreshold.value;
	}

	set opacity(value) {
		if (this.uniforms) {
			this.uniforms.opacity.value = value;
		}
	}

	get opacity() {
		return this.uniforms.opacity.value;
	}

	set color(value) {
		if (this.uniforms) {
			this.uniforms.color.value = value;
		}
	}

	get color() {
		return this.uniforms.color.value;
	}

	set map(value) {
		if (this.uniforms) {
			this.uniforms.map.value = value;
		}
	}

	get map() {
		return this.uniforms.map.value;
	}

	set uvTransform(value) {
		if (this.uniforms) {
			this.uniforms.uvTransform.value = value;
		}
	}

	get uvTransform() {
		return this.uniforms.uvTransform.value;
	}

	set alphaMap(value) {
		if (this.uniforms) {
			this.uniforms.alphaMap.value = value;
		}
	}

	get alphaMap() {
		return this.uniforms.alphaMap.value;
	}

	set uvTransform1(value) {
		if (this.uniforms) {
			this.uniforms.uvTransform1.value = value;
		}
	}

	get uvTransform1() {
		return this.uniforms.uvTransform1.value;
	}

}