const positions = [
	-1, 1, 0,
	1, 1, 0,
	-1, -1, 0,
	1, -1, 0
];
const uvs = [
	-1, 1,
	1, 1,
	-1, -1,
	1, -1
];
const index = [
	0, 2, 1,
	2, 3, 1
];

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
		points.forEach((p, i) => {
			bufferArray.push(p.x, p.y, p.z);
			if (i === 0 || i === length - 1) {
				bufferArray.push(p.x, p.y, p.z);
			}
		});

		// Convert to instance buffer
		// prev2---prev1---next1---next2

		const instanceBuffer = new THREE.InstancedInterleavedBuffer(new Float32Array(bufferArray), 3, 1);
		instanceBuffer.count -= 3; // fix count

		this.setAttribute('instancePrev2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0));
		this.setAttribute('instancePrev1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 3));
		this.setAttribute('instanceNext1', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 6));
		this.setAttribute('instanceNext2', new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 9));

		this.computeBoundingBox();
		this.computeBoundingSphere();

		return this;
	}

	computeBoundingBox() {
		// TODO
	}

	computeBoundingSphere() {
		// TODO
	}

}