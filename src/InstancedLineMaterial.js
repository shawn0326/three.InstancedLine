import vertexShader from './shaders/vertex.glsl.js';
import fragmentShader from './shaders/fragment.glsl.js';

export class InstancedLineMaterial extends THREE.ShaderMaterial {

	constructor() {
		super({
			type: 'InstancedLineMaterial',
			defines: {
				DISABLE_CORNER_BROKEN: false,
				SIMPLE_UV: false,
				SCREEN_UV: false // TODO
			},
			uniforms: {
				resolution: { value: new THREE.Vector2(512, 512) },
				lineWidth: { value: 2 },
				cornerThreshold: { value: 0.4 },

				opacity: { value: 1 },
				color: { value: new THREE.Color() },
				map: { value: null },

				uvTransform: { value: new THREE.Matrix3() }
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});
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

}