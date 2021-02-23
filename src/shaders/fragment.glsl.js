export default `
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