import { InstancedLineGeometry } from './InstancedLineGeometry.js';
import { InstancedLineMaterial } from './InstancedLineMaterial.js';

export class InstancedLine extends THREE.Mesh {

	constructor() {
		const geometry = new InstancedLineGeometry();
		const material = new InstancedLineMaterial();

		super(geometry, material);

		this.type = 'InstancedLine';
	}

	// TODO raycast

}