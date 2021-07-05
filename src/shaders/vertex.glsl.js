export default `
#include <common>

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
    
    #include <logdepthbuf_vertex>

    #ifdef FLAT_W
        if (gl_Position.w > -1.0) {
            gl_Position.xyz /= gl_Position.w;
            gl_Position.w = 1.0;
        }
    #endif

    // uv
    // TODO trim uv
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

    #ifdef SWAP_UV
        vUv = vUv.yx;
    #endif
}
`;