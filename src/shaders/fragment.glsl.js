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

#ifdef LINE_BREAK
    varying float vDiscard;
#endif

varying vec2 vUv;

void main() {
    #ifdef LINE_BREAK
        if (vDiscard > 0.5) {
            discard;
        }
    #endif

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