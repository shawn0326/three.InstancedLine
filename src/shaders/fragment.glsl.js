export default `
#include <common>

uniform float opacity;
uniform vec3 color;

#include <map_pars_fragment>

#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
    varying vec2 vAlphaUv;
#endif

#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>

varying vec2 vUv;

void main() {
    vec4 diffuseColor = vec4(color, opacity);
    #include <map_fragment>

    #ifdef USE_ALPHAMAP
	    diffuseColor.a *= texture2D(alphaMap, vAlphaUv).g;
    #endif

    gl_FragColor = diffuseColor;
    #include <fog_fragment>
    #include <logdepthbuf_fragment>
}
`;