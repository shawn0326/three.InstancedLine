// github.com/shawn0326/three.instancedline
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.THREE = global.THREE || {}));
}(this, (function (exports) { 'use strict';

	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}

	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		return Constructor;
	}

	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;

		_setPrototypeOf(subClass, superClass);
	}

	function _setPrototypeOf(o, p) {
		_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};

		return _setPrototypeOf(o, p);
	}

	var positions = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
	var uvs = [0, 1, 1, 1, 0, 0, 1, 0];
	var index = [0, 2, 1, 2, 3, 1];

	var _vec3_1 = new THREE.Vector3();

	var InstancedLineGeometry = /*#__PURE__*/function (_THREE$InstancedBuffe) {
		_inheritsLoose(InstancedLineGeometry, _THREE$InstancedBuffe);

		function InstancedLineGeometry() {
			var _this;

			_this = _THREE$InstancedBuffe.call(this) || this;
			_this.type = 'InstancedLineGeometry';

			_this.setIndex(index);

			_this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

			_this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

			return _this;
		}

		var _proto = InstancedLineGeometry.prototype;

		_proto.setFromPoints = function setFromPoints(points) {
			// Convert to flat array and add start/end point
			// 0	 0---1---2---3---4	 4
			var bufferArray = [];
			var length = points.length;
			var dist = 0;
			points.forEach(function (p, i) {
				if (i > 0) {
					dist += p.distanceTo(points[i - 1]);
				}

				bufferArray.push(p.x, p.y, p.z, dist);

				if (i === 0 || i === length - 1) {
					bufferArray.push(p.x, p.y, p.z, dist);
				}
			}); // Convert to instance buffer
			// prev2---prev1---next1---next2

			var instanceBuffer = new THREE.InstancedInterleavedBuffer(new Float32Array(bufferArray), 4, 1);
			instanceBuffer.count = Math.max(0, instanceBuffer.count - 3); // fix count

			this.setAttribute('instancePrev2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0));
			this.setAttribute('instancePrev1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 4));
			this.setAttribute('instanceNext1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 8));
			this.setAttribute('instanceNext2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 12));
			this.setAttribute('instancePrevDist', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, 7));
			this.setAttribute('instanceNextDist', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, 11));
			delete this._maxInstanceCount;
			this.computeBoundingBox();
			this.computeBoundingSphere();
			return this;
		};

		_proto.computeBoundingBox = function computeBoundingBox() {
			if (this.boundingBox === null) {
				this.boundingBox = new THREE.Box3();
			}

			var instancePrev1 = this.attributes.instancePrev1;

			if (instancePrev1 !== undefined) {
				this.boundingBox.setFromBufferAttribute(instancePrev1);
			}
		};

		_proto.computeBoundingSphere = function computeBoundingSphere() {
			if (this.boundingSphere === null) {
				this.boundingSphere = new THREE.Sphere();
			}

			if (this.boundingBox === null) {
				this.computeBoundingBox();
			}

			var instancePrev1 = this.attributes.instancePrev1;

			if (instancePrev1 !== undefined) {
				var center = this.boundingSphere.center;
				this.boundingBox.getCenter(center);
				var maxRadiusSq = 0;

				for (var i = 0, il = instancePrev1.count; i < il; i++) {
					_vec3_1.fromBufferAttribute(instancePrev1, i);

					maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vec3_1));
				}

				this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

				if (isNaN(this.boundingSphere.radius)) {
					console.error('THREE.InstancedLineGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this);
				}
			}
		};

		return InstancedLineGeometry;
	}(THREE.InstancedBufferGeometry);

	var vertexShader = "\nattribute vec3 instancePrev2;\nattribute vec3 instancePrev1;\nattribute vec3 instanceNext1;\nattribute vec3 instanceNext2;\n\nattribute float instancePrevDist;\nattribute float instanceNextDist;\n\nuniform float lineWidth;\nuniform vec2 resolution;\n\nuniform float cornerThreshold;\n\nuniform mat3 uvTransform;\nvarying vec2 vUv;\n\nvoid trimSegment(const in vec4 start, inout vec4 end) {\n		// trim end segment so it terminates between the camera plane and the near plane\n\n		// conservative estimate of the near plane\n		float a = projectionMatrix[2][2]; // 3nd entry in 3th column\n		float b = projectionMatrix[3][2]; // 3nd entry in 4th column\n		float nearEstimate = -0.5 * b / a;\n\n		float alpha = (nearEstimate - start.z) / (end.z - start.z);\n\n		end.xyz = mix(start.xyz, end.xyz, alpha);\n}\n\n#include <logdepthbuf_pars_vertex>\n\nvoid main() {\n		float aspect = resolution.x / resolution.y;\n		float flagY = position.y * 0.5 + 0.5;\n\n		// camera space\n		vec4 prev = modelViewMatrix * vec4(mix(instancePrev2, instancePrev1, flagY), 1.0);\n		vec4 curr = modelViewMatrix * vec4(mix(instancePrev1, instanceNext1, flagY), 1.0);\n		vec4 next = modelViewMatrix * vec4(mix(instanceNext1, instanceNext2, flagY), 1.0);\n\n		// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n		bool perspective = (projectionMatrix[2][3] == -1.0); // 4th entry in the 3rd column\n\n		if (perspective) {\n				if (position.y < 0.) {\n						if (curr.z < 0.0 && next.z >= 0.0) {\n								trimSegment(curr, next);\n						} else if (next.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(next, curr);\n						}\n\n						if (prev.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(prev, curr);\n						} else if (curr.z < 0.0 && prev.z >= 0.0) {\n								trimSegment(curr, prev);\n						}\n				} else {\n						if (prev.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(prev, curr);\n						} else if (curr.z < 0.0 && prev.z >= 0.0) {\n								trimSegment(curr, prev);\n						}\n\n						if (curr.z < 0.0 && next.z >= 0.0) {\n								trimSegment(curr, next);\n						} else if (next.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(next, curr);\n						}\n				} \n		}\n\n		// clip space\n		vec4 clipPrev = projectionMatrix * prev;\n		vec4 clipCurr = projectionMatrix * curr;\n		vec4 clipNext = projectionMatrix * next;\n\n		// ndc space\n		vec2 ndcPrev = clipPrev.xy / clipPrev.w;\n		vec2 ndcCurr = clipCurr.xy / clipCurr.w;\n		vec2 ndcNext = clipNext.xy / clipNext.w;\n\n		// direction\n		vec2 dir, dir1, dir2;\n		float w = 1.0;\n\n		if (prev == curr) {\n				dir = ndcNext - ndcCurr;\n				dir.x *= aspect;\n				dir = normalize(dir);\n		} else if(curr == next) {\n				dir = ndcCurr - ndcPrev;\n				dir.x *= aspect;\n				dir = normalize(dir);\n		} else {\n				dir1 = ndcCurr - ndcPrev;\n				dir1.x *= aspect;\n				\n				dir2 = ndcNext - ndcCurr;\n				dir2.x *= aspect;\n\n				dir1 = normalize(dir1);\n				dir2 = normalize(dir2);\n\n				dir = normalize(dir1 + dir2);\n\n				w = dot(dir1, dir);\n\n				#ifdef DISABLE_CORNER_BROKEN	\n						w = 1.0 / max(w, cornerThreshold);\n				#else\n						float flagT = step(w, cornerThreshold);\n						w = 1.0 / mix(w, 1.0, flagT);\n						dir = mix(dir, mix(dir2, dir1, flagY), flagT);\n				#endif\n		}\n\n		// perpendicular to dir\n		vec2 offset = vec2(dir.y, -dir.x);\n\n		// undo aspect ratio adjustment\n		offset.x /= aspect;\n\n		// sign flip\n\toffset *= float(sign(position.x));\n\n		// adjust for lineWidth\n		offset *= lineWidth * w;\n		\n		// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n		offset /= resolution.y;\n		\n		// select end\n		vec4 clip = clipCurr;\n\n		// back to clip space\n		offset *= clip.w;\n\n		clip.xy += offset;\n\n		gl_Position = clip;\n		\n		gl_Position.xyz /= gl_Position.w;\n		gl_Position.w = 1.0;\n\n		// uv\n		#ifdef SIMPLE_UV\n				vUv = (uvTransform * vec3(uv, 1.)).xy;\n		#else\n				#ifdef SCREEN_UV\n						vUv = (uvTransform * vec3(uv, 1.)).xy;\n				#else\n						vUv.x = uv.x;\n						vUv.y = mix(instancePrevDist, instanceNextDist, flagY);\n						vUv = (uvTransform * vec3(vUv, 1.)).xy;\n				#endif\n		#endif\n\n		#include <logdepthbuf_vertex>\n}\n";

	var fragmentShader = "\n#include <common>\n\nuniform float opacity;\nuniform vec3 color;\n\n#include <map_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n\nvarying vec2 vUv;\n\nvoid main() {\n		vec4 diffuseColor = vec4(color, opacity);\n		#include <map_fragment>\n		gl_FragColor = diffuseColor;\n		#include <logdepthbuf_fragment>\n}\n";

	var InstancedLineMaterial = /*#__PURE__*/function (_THREE$ShaderMaterial) {
		_inheritsLoose(InstancedLineMaterial, _THREE$ShaderMaterial);

		function InstancedLineMaterial() {
			return _THREE$ShaderMaterial.call(this, {
				type: 'InstancedLineMaterial',
				defines: {
					DISABLE_CORNER_BROKEN: false,
					SIMPLE_UV: false,
					SCREEN_UV: false // TODO

				},
				uniforms: {
					resolution: {
						value: new THREE.Vector2(512, 512)
					},
					lineWidth: {
						value: 2
					},
					cornerThreshold: {
						value: 0.4
					},
					opacity: {
						value: 1
					},
					color: {
						value: new THREE.Color()
					},
					map: {
						value: null
					},
					uvTransform: {
						value: new THREE.Matrix3()
					}
				},
				vertexShader: vertexShader,
				fragmentShader: fragmentShader
			}) || this;
		}

		_createClass(InstancedLineMaterial, [{
			key: "lineWidth",
			get: function get() {
				return this.uniforms.lineWidth.value;
			},
			set: function set(value) {
				this.uniforms.lineWidth.value = value;
			}
		}, {
			key: "cornerThreshold",
			get: function get() {
				return this.uniforms.cornerThreshold.value;
			},
			set: function set(value) {
				this.uniforms.cornerThreshold.value = value;
			}
		}, {
			key: "opacity",
			get: function get() {
				return this.uniforms.opacity.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.opacity.value = value;
				}
			}
		}, {
			key: "color",
			get: function get() {
				return this.uniforms.color.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.color.value = value;
				}
			}
		}, {
			key: "map",
			get: function get() {
				return this.uniforms.map.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.map.value = value;
				}
			}
		}, {
			key: "uvTransform",
			get: function get() {
				return this.uniforms.uvTransform.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.uvTransform.value = value;
				}
			}
		}]);

		return InstancedLineMaterial;
	}(THREE.ShaderMaterial);

	var InstancedLine = /*#__PURE__*/function (_THREE$Mesh) {
		_inheritsLoose(InstancedLine, _THREE$Mesh);

		function InstancedLine() {
			var _this;

			var geometry = new InstancedLineGeometry();
			var material = new InstancedLineMaterial();
			_this = _THREE$Mesh.call(this, geometry, material) || this;
			_this.type = 'InstancedLine';
			return _this;
		} // TODO raycast


		return InstancedLine;
	}(THREE.Mesh);

	exports.InstancedLine = InstancedLine;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
