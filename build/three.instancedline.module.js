// github.com/shawn0326/three.instancedline
const positions = [
	-1, 1, 0,
	1, 1, 0,
	-1, -1, 0,
	1, -1, 0
];
const uvs = [
	0, 1,
	1, 1,
	0, 0,
	1, 0
];
const index = [
	0, 2, 1,
	2, 3, 1
];

const _vec3_1 = new THREE.Vector3();

class InstancedLineGeometry extends THREE.InstancedBufferGeometry {

	constructor() {
		super();

		this.type = 'InstancedLineGeometry';

		this.setIndex(index);
		this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	}

	setFromPoints(points) {
		// Convert to flat array and add start/end point
		// 0   0---1---2---3---4   4

		const bufferArray = [];
		const length = points.length;
		let dist = 0;
		points.forEach((p, i) => {
			if (i > 0) {
				dist += p.distanceTo(points[i - 1]);
			}

			bufferArray.push(p.x, p.y, p.z, dist);
			if (i === 0 || i === length - 1) {
				bufferArray.push(p.x, p.y, p.z, dist);
			}
		});

		// Convert to instance buffer
		// prev2---prev1---next1---next2

		const instanceBuffer = new THREE.InstancedInterleavedBuffer(new Float32Array(bufferArray), 4, 1);
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
	}

	computeBoundingBox() {
		if (this.boundingBox === null) {
			this.boundingBox = new THREE.Box3();
		}

		const instancePrev1 = this.attributes.instancePrev1;

		if (instancePrev1 !== undefined) {
			this.boundingBox.setFromBufferAttribute(instancePrev1);
		}
	}

	computeBoundingSphere() {
		if (this.boundingSphere === null) {
			this.boundingSphere = new THREE.Sphere();
		}

		if (this.boundingBox === null) {
			this.computeBoundingBox();
		}

		const instancePrev1 = this.attributes.instancePrev1;
		if (instancePrev1 !== undefined) {
			const center = this.boundingSphere.center;
			this.boundingBox.getCenter(center);

			let maxRadiusSq = 0;

			for (let i = 0, il = instancePrev1.count; i < il; i++) {
				_vec3_1.fromBufferAttribute(instancePrev1, i);
				maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vec3_1));
			}

			this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

			if (isNaN(this.boundingSphere.radius)) {
				console.error('THREE.InstancedLineGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this);
			}
		}
	}

}

var vertexShader = `
attribute vec3 instancePrev2;
attribute vec3 instancePrev1;
attribute vec3 instanceNext1;
attribute vec3 instanceNext2;

attribute float instancePrevDist;
attribute float instanceNextDist;

uniform float lineWidth;
uniform vec2 resolution;

uniform float cornerThreshold;

uniform mat3 uvTransform;
varying vec2 vUv;

void trimSegment(const in vec4 start, inout vec4 end) {
    // trim end segment so it terminates between the camera plane and the near plane

    // conservative estimate of the near plane
    float a = projectionMatrix[2][2]; // 3nd entry in 3th column
    float b = projectionMatrix[3][2]; // 3nd entry in 4th column
    float nearEstimate = -0.5 * b / a;

    float alpha = (nearEstimate - start.z) / (end.z - start.z);

    end.xyz = mix(start.xyz, end.xyz, alpha);
}

#include <logdepthbuf_pars_vertex>

void main() {
    float aspect = resolution.x / resolution.y;
    float flagY = position.y * 0.5 + 0.5;

    // camera space
    vec4 prev = modelViewMatrix * vec4(mix(instancePrev2, instancePrev1, flagY), 1.0);
    vec4 curr = modelViewMatrix * vec4(mix(instancePrev1, instanceNext1, flagY), 1.0);
    vec4 next = modelViewMatrix * vec4(mix(instanceNext1, instanceNext2, flagY), 1.0);

    // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
    bool perspective = (projectionMatrix[2][3] == -1.0); // 4th entry in the 3rd column

    if (perspective) {
        if (position.y < 0.) {
            if (curr.z < 0.0 && next.z >= 0.0) {
                trimSegment(curr, next);
            } else if (next.z < 0.0 && curr.z >= 0.0) {
                trimSegment(next, curr);
            }

            if (prev.z < 0.0 && curr.z >= 0.0) {
                trimSegment(prev, curr);
            } else if (curr.z < 0.0 && prev.z >= 0.0) {
                trimSegment(curr, prev);
            }
        } else {
            if (prev.z < 0.0 && curr.z >= 0.0) {
                trimSegment(prev, curr);
            } else if (curr.z < 0.0 && prev.z >= 0.0) {
                trimSegment(curr, prev);
            }

            if (curr.z < 0.0 && next.z >= 0.0) {
                trimSegment(curr, next);
            } else if (next.z < 0.0 && curr.z >= 0.0) {
                trimSegment(next, curr);
            }
        } 
    }

    // clip space
    vec4 clipPrev = projectionMatrix * prev;
    vec4 clipCurr = projectionMatrix * curr;
    vec4 clipNext = projectionMatrix * next;

    // ndc space
    vec2 ndcPrev = clipPrev.xy / clipPrev.w;
    vec2 ndcCurr = clipCurr.xy / clipCurr.w;
    vec2 ndcNext = clipNext.xy / clipNext.w;

    // direction
    vec2 dir, dir1, dir2;
    float w = 1.0;

    if (prev == curr) {
        dir = ndcNext - ndcCurr;
        dir.x *= aspect;
        dir = normalize(dir);
    } else if(curr == next) {
        dir = ndcCurr - ndcPrev;
        dir.x *= aspect;
        dir = normalize(dir);
    } else {
        dir1 = ndcCurr - ndcPrev;
        dir1.x *= aspect;
        
        dir2 = ndcNext - ndcCurr;
        dir2.x *= aspect;

        dir1 = normalize(dir1);
        dir2 = normalize(dir2);

        dir = normalize(dir1 + dir2);

        w = dot(dir1, dir);

        #ifdef DISABLE_CORNER_BROKEN  
            w = 1.0 / max(w, cornerThreshold);
        #else
            float flagT = step(w, cornerThreshold);
            w = 1.0 / mix(w, 1.0, flagT);
            dir = mix(dir, mix(dir2, dir1, flagY), flagT);
        #endif
    }

    // perpendicular to dir
    vec2 offset = vec2(dir.y, -dir.x);

    // undo aspect ratio adjustment
    offset.x /= aspect;

    // sign flip
	offset *= float(sign(position.x));

    // adjust for lineWidth
    offset *= lineWidth * w;
    
    // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
    offset /= resolution.y;
    
    // select end
    vec4 clip = clipCurr;

    // back to clip space
    offset *= clip.w;

    clip.xy += offset;

    gl_Position = clip;
    
    gl_Position.xyz /= gl_Position.w;
    gl_Position.w = 1.0;

    // uv
    #ifdef SIMPLE_UV
        vUv = (uvTransform * vec3(uv, 1.)).xy;
    #else
        #ifdef SCREEN_UV
            vUv = (uvTransform * vec3(uv, 1.)).xy;
        #else
            vUv.x = uv.x;
            vUv.y = mix(instancePrevDist, instanceNextDist, flagY);
            vUv = (uvTransform * vec3(vUv, 1.)).xy;
        #endif
    #endif

    #include <logdepthbuf_vertex>
}
`;

var fragmentShader = `
#include <common>

uniform float opacity;
uniform vec3 color;

#include <map_pars_fragment>
#include <logdepthbuf_pars_fragment>

varying vec2 vUv;

void main() {
    vec4 diffuseColor = vec4(color, opacity);
    #include <map_fragment>
    gl_FragColor = diffuseColor;
    #include <logdepthbuf_fragment>
}
`;

class InstancedLineMaterial extends THREE.ShaderMaterial {

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

class InstancedLine extends THREE.Mesh {

	constructor() {
		const geometry = new InstancedLineGeometry();
		const material = new InstancedLineMaterial();

		super(geometry, material);

		this.type = 'InstancedLine';
	}

	// TODO raycast

}

export { InstancedLine };
