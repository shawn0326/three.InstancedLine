import vertexShader from './shaders/vertex.glsl.js';
import fragmentShader from './shaders/fragment.glsl.js';

export class InstancedLineMaterial extends THREE.ShaderMaterial {

	constructor() {
		super({
			type: 'InstancedLineMaterial',
			defines: {
				DISABLE_CORNER_BROKEN: false
			},
			uniforms: {
				resolution: { value: new THREE.Vector2(512, 512) },
				lineWidth: { value: 2 },
				cornerThreshold: { value: 0.4 },

				opacity: { value: 1 },
				color: { value: new THREE.Color() }
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

}