/* https://github.com/shawn0326/three.instancedline */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.THREE = global.THREE || {}));
}(this, (function (exports) { 'use strict';

	// TODO
	class InstancedLine extends THREE.Mesh {

		constructor() {
			super();
		}

	}

	exports.InstancedLine = InstancedLine;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
