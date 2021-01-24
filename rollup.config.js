const INDENT = '\t';
const BANNER = '/* https://github.com/shawn0326/three.instancedline */';

export default {
	input: 'src/main.js',
	plugins: [
	],
	// sourceMap: true,
	output: [
		{
			format: 'umd',
			file: 'build/three.instancedline.js',
			indent: INDENT,
			banner: BANNER,
			name: 'THREE',
			extend: true
		},
		{
			format: 'es',
			file: 'build/three.instancedline.module.js',
			indent: INDENT,
			banner: BANNER
		}
	]
};