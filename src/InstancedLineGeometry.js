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

function setBox3FromBuffer(box, buffer) {
	let minX = +Infinity;
	let minY = +Infinity;
	let minZ = +Infinity;

	let maxX = -Infinity;
	let maxY = -Infinity;
	let maxZ = -Infinity;

	for (let i = 0, l = buffer.count + 2; i < l; i++) {
		const x = buffer.array[i * 4 + 0];
		const y = buffer.array[i * 4 + 1];
		const z = buffer.array[i * 4 + 2];

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

export class InstancedLineGeometry extends THREE.InstancedBufferGeometry {

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

		if (instancePrev1 !== undefined && instancePrev1.data.count > 0) {
			setBox3FromBuffer(this.boundingBox, instancePrev1.data);
		} else {
			this.boundingBox.makeEmpty();
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
		if (instancePrev1 !== undefined && instancePrev1.data.count > 0) {
			const center = this.boundingSphere.center;
			this.boundingBox.getCenter(center);

			let maxRadiusSq = 0;

			for (let i = 0, il = instancePrev1.data.count + 2; i < il; i++) {
				_vec3_1.fromArray(instancePrev1.data.array, i * 4);
				maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vec3_1));
			}

			this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

			if (isNaN(this.boundingSphere.radius)) {
				console.error('THREE.InstancedLineGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this);
			}
		} else {
			this.boundingSphere.makeEmpty();
		}
	}

}