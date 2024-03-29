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

	function setBox3FromBuffer(box, buffer) {
		var minX = +Infinity;
		var minY = +Infinity;
		var minZ = +Infinity;
		var maxX = -Infinity;
		var maxY = -Infinity;
		var maxZ = -Infinity;

		for (var i = 0, l = buffer.count + 2; i < l; i++) {
			var x = buffer.array[i * buffer.stride + 0];
			var y = buffer.array[i * buffer.stride + 1];
			var z = buffer.array[i * buffer.stride + 2];
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (z < minZ) minZ = z;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
			if (z > maxZ) maxZ = z;
		}

		box.min.set(minX, minY, minZ);
		box.max.set(maxX, maxY, maxZ);
		return box;
	}

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

		_proto.setFromPoints = function setFromPoints(points, breakIndices) {
			// Convert to flat array and add start/end point
			// 0	 0---1---2---3---4	 4
			var useBreak = breakIndices && breakIndices.length > 0;
			var bufferArray = [];
			var length = points.length;
			var dist = 0;
			points.forEach(function (p, i) {
				if (i > 0) {
					dist += p.distanceTo(points[i - 1]);
				}

				if (useBreak) {
					var breakState = 0;

					if (breakIndices.indexOf(i) > -1) {
						breakState = 1;
						dist = 0;
					} else if (breakIndices.indexOf(i + 1) > -1) {
						breakState = 1;
					}

					bufferArray.push(p.x, p.y, p.z, dist, breakState);

					if (i === 0 || i === length - 1) {
						bufferArray.push(p.x, p.y, p.z, dist, breakState);
					}
				} else {
					bufferArray.push(p.x, p.y, p.z, dist);

					if (i === 0 || i === length - 1) {
						bufferArray.push(p.x, p.y, p.z, dist);
					}
				}
			}); // Convert to instance buffer
			// prev2---prev1---next1---next2

			var stride = useBreak ? 5 : 4;
			var instanceBuffer = new THREE.InstancedInterleavedBuffer(new Float32Array(bufferArray), stride, 1);
			instanceBuffer.count = Math.max(0, instanceBuffer.count - 3); // fix count

			this.setAttribute('instancePrev2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, stride * 0));
			this.setAttribute('instancePrev1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, stride * 1));
			this.setAttribute('instanceNext1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, stride * 2));
			this.setAttribute('instanceNext2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, stride * 3));
			this.setAttribute('instancePrevDist', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, stride * 1 + 3));
			this.setAttribute('instanceNextDist', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, stride * 2 + 3));

			if (useBreak) {
				this.setAttribute('instancePrevBreak', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, stride * 1 + 4));
				this.setAttribute('instanceNextBreak', new THREE.InterleavedBufferAttribute(instanceBuffer, 1, stride * 2 + 4));
			}

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

			if (instancePrev1 !== undefined && instancePrev1.data.count > 0) {
				setBox3FromBuffer(this.boundingBox, instancePrev1.data);
			} else {
				this.boundingBox.makeEmpty();
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

			if (instancePrev1 !== undefined && instancePrev1.data.count > 0) {
				var center = this.boundingSphere.center;
				this.boundingBox.getCenter(center);
				var maxRadiusSq = 0;

				for (var i = 0, il = instancePrev1.data.count + 2; i < il; i++) {
					_vec3_1.fromArray(instancePrev1.data.array, i * instancePrev1.data.stride);

					maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vec3_1));
				}

				this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

				if (isNaN(this.boundingSphere.radius)) {
					console.error('THREE.InstancedLineGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this);
				}
			} else {
				this.boundingSphere.makeEmpty();
			}
		};

		return InstancedLineGeometry;
	}(THREE.InstancedBufferGeometry);

	var vertexShader = "\n#include <common>\n\nattribute vec3 instancePrev2;\nattribute vec3 instancePrev1;\nattribute vec3 instanceNext1;\nattribute vec3 instanceNext2;\n\nattribute float instancePrevDist;\nattribute float instanceNextDist;\n\n#ifdef LINE_BREAK\n		attribute float instancePrevBreak;\n		attribute float instanceNextBreak;\n\n		varying float vDiscard;\n#endif\n\nuniform float lineWidth;\nuniform vec2 resolution;\n\nuniform float cornerThreshold;\n\nuniform mat3 uvTransform;\nvarying vec2 vUv;\n\n#ifdef USE_ALPHAMAP\n		uniform mat3 uvTransform1;\n		varying vec2 vAlphaUv;\n#endif\n\nvoid trimSegment(const in vec4 start, inout vec4 end) {\n		// trim end segment so it terminates between the camera plane and the near plane\n\n		// conservative estimate of the near plane\n		float a = projectionMatrix[2][2]; // 3nd entry in 3th column\n		float b = projectionMatrix[3][2]; // 3nd entry in 4th column\n		float nearEstimate = -0.5 * b / a;\n\n		float alpha = (nearEstimate - start.z) / (end.z - start.z);\n\n		end.xyz = mix(start.xyz, end.xyz, alpha);\n}\n\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n\nvoid main() {\n		float aspect = resolution.x / resolution.y;\n		float flagY = position.y * 0.5 + 0.5;\n\n		// camera space\n		vec4 prev = modelViewMatrix * vec4(mix(instancePrev2, instancePrev1, flagY), 1.0);\n		vec4 curr = modelViewMatrix * vec4(mix(instancePrev1, instanceNext1, flagY), 1.0);\n		vec4 next = modelViewMatrix * vec4(mix(instanceNext1, instanceNext2, flagY), 1.0);\n\n		#ifdef LINE_BREAK\n				vDiscard = instancePrevBreak * instanceNextBreak;\n				if (position.y > 0.0 && instanceNextBreak > 0.5) {\n						next = curr;\n				} else if (position.y < 0.0 && instancePrevBreak > 0.5) {\n						prev = curr;\n				}\n		#endif\n\n		// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n		bool perspective = (projectionMatrix[2][3] == -1.0); // 4th entry in the 3rd column\n\n		if (perspective) {\n				if (position.y < 0.) {\n						if (curr.z < 0.0 && next.z >= 0.0) {\n								trimSegment(curr, next);\n						} else if (next.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(next, curr);\n						}\n\n						if (prev.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(prev, curr);\n						} else if (curr.z < 0.0 && prev.z >= 0.0) {\n								trimSegment(curr, prev);\n						}\n				} else {\n						if (prev.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(prev, curr);\n						} else if (curr.z < 0.0 && prev.z >= 0.0) {\n								trimSegment(curr, prev);\n						}\n\n						if (curr.z < 0.0 && next.z >= 0.0) {\n								trimSegment(curr, next);\n						} else if (next.z < 0.0 && curr.z >= 0.0) {\n								trimSegment(next, curr);\n						}\n				} \n		}\n\n		// clip space\n		vec4 clipPrev = projectionMatrix * prev;\n		vec4 clipCurr = projectionMatrix * curr;\n		vec4 clipNext = projectionMatrix * next;\n\n		// ndc space\n		vec2 ndcPrev = clipPrev.xy / clipPrev.w;\n		vec2 ndcCurr = clipCurr.xy / clipCurr.w;\n		vec2 ndcNext = clipNext.xy / clipNext.w;\n\n		// direction\n		vec2 dir, dir1, dir2;\n		float w = 1.0;\n\n		if (prev == curr) {\n				dir = ndcNext - ndcCurr;\n				dir.x *= aspect;\n				dir = normalize(dir);\n		} else if(curr == next) {\n				dir = ndcCurr - ndcPrev;\n				dir.x *= aspect;\n				dir = normalize(dir);\n		} else {\n				dir1 = ndcCurr - ndcPrev;\n				dir1.x *= aspect;\n				\n				dir2 = ndcNext - ndcCurr;\n				dir2.x *= aspect;\n\n				dir1 = normalize(dir1);\n				dir2 = normalize(dir2);\n\n				dir = normalize(dir1 + dir2);\n\n				w = dot(dir1, dir);\n\n				#ifdef DISABLE_CORNER_BROKEN	\n						w = 1.0 / max(w, cornerThreshold);\n				#else\n						float flagT = step(w, cornerThreshold);\n						w = 1.0 / mix(w, 1.0, flagT);\n						dir = mix(dir, mix(dir2, dir1, flagY), flagT);\n				#endif\n		}\n\n		// perpendicular to dir\n		vec2 offset = vec2(dir.y, -dir.x);\n\n		// undo aspect ratio adjustment\n		offset.x /= aspect;\n\n		// sign flip\n\toffset *= float(sign(position.x));\n\n		// adjust for lineWidth\n		offset *= lineWidth * w;\n		\n		// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n		offset /= resolution.y;\n		\n		// select end\n		vec4 clip = clipCurr;\n\n		// back to clip space\n		offset *= clip.w;\n\n		clip.xy += offset;\n\n		gl_Position = clip;\n		\n		vec4 mvPosition = curr;\n		#include <fog_vertex>\n		#include <logdepthbuf_vertex>\n\n		#ifdef FLAT_W\n				if (gl_Position.w > -1.0) {\n						gl_Position.xyz /= gl_Position.w;\n						gl_Position.w = 1.0;\n				}\n		#endif\n\n		// uv\n		// TODO trim uv\n		vec2 tUv = vec2(0.0, 0.0);\n		#ifdef SIMPLE_UV\n				tUv = uv;\n		#else\n				#ifdef SCREEN_UV\n						tUv = uv;\n				#else\n						tUv.x = uv.x;\n						tUv.y = mix(instancePrevDist, instanceNextDist, flagY);\n				#endif\n		#endif\n\n		#ifdef SWAP_UV\n\t\ttUv = tUv.yx;\n\t#endif\n\n		vUv = (uvTransform * vec3(tUv, 1.)).xy;\n		#ifdef USE_ALPHAMAP\n				vAlphaUv = (uvTransform1 * vec3(tUv, 1.)).xy;\n		#endif\n}\n";

	var fragmentShader = "\n#include <common>\n\nuniform float opacity;\nuniform vec3 color;\n\n#include <map_pars_fragment>\n\n#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n		varying vec2 vAlphaUv;\n#endif\n\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n\n#ifdef LINE_BREAK\n		varying float vDiscard;\n#endif\n\nvarying vec2 vUv;\n\nvoid main() {\n		#ifdef LINE_BREAK\n				if (vDiscard > 0.5) {\n						discard;\n				}\n		#endif\n\n		vec4 diffuseColor = vec4(color, opacity);\n		#include <map_fragment>\n\n		#ifdef USE_ALPHAMAP\n\t		diffuseColor.a *= texture2D(alphaMap, vAlphaUv).g;\n		#endif\n\n		gl_FragColor = diffuseColor;\n		#include <fog_fragment>\n		#include <logdepthbuf_fragment>\n}\n";

	var modifiedShaderChunk = THREE.ShaderChunk.logdepthbuf_vertex.replace('vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) )', 'vIsPerspective = isPerspectiveMatrix( projectionMatrix ) ? 1.0 : 0.0');
	var modifiedVertexShader = vertexShader.replace('#include <logdepthbuf_vertex>', modifiedShaderChunk);
	var InstancedLineMaterial = /*#__PURE__*/function (_THREE$ShaderMaterial) {
		_inheritsLoose(InstancedLineMaterial, _THREE$ShaderMaterial);

		function InstancedLineMaterial() {
			var _this;

			_this = _THREE$ShaderMaterial.call(this, {
				type: 'InstancedLineMaterial',
				defines: {
					LINE_BREAK: false,
					DISABLE_CORNER_BROKEN: false,
					FLAT_W: false,
					SWAP_UV: false,
					SIMPLE_UV: false,
					SCREEN_UV: false // TODO

				},
				uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib['fog'], {
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
					alphaMap: {
						value: null
					},
					uvTransform: {
						value: new THREE.Matrix3()
					},
					uvTransform1: {
						value: new THREE.Matrix3()
					} // for alpha map

				}]),
				vertexShader: modifiedVertexShader,
				fragmentShader: fragmentShader
			}) || this;
			_this.fog = true;
			return _this;
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
		}, {
			key: "alphaMap",
			get: function get() {
				return this.uniforms.alphaMap.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.alphaMap.value = value;
				}
			}
		}, {
			key: "uvTransform1",
			get: function get() {
				return this.uniforms.uvTransform1.value;
			},
			set: function set(value) {
				if (this.uniforms) {
					this.uniforms.uvTransform1.value = value;
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
