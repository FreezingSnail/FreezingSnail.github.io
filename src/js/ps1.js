/**
 * PS1 hardware quirks, reproduced deliberately.
 *
 * The console's GTE transformed vertices in fixed point and handed the GPU
 * integer screen coordinates, so geometry could not land between pixels. Vertices
 * therefore snapped from one pixel to the next as an object moved, which is the
 * jitter people remember rather than any smooth interpolation. Modern GPUs
 * interpolate in floating point, so the wobble has to be added back: this module
 * rounds each projected vertex onto a low virtual raster and quantizes animation
 * values so motion advances in visible steps.
 */

/** Virtual raster the vertices snap onto. Lower values mean coarser wobble. */
export const PS1_RASTER = Object.freeze({ x: 240, y: 180 });

const SNAP_CHUNK = `
#include <project_vertex>
{
  float ps1W = max(abs(gl_Position.w), 0.00001);
  vec2 ps1Grid = vec2(${PS1_RASTER.x.toFixed(1)}, ${PS1_RASTER.y.toFixed(1)}) * 0.5;
  vec2 ps1Ndc = gl_Position.xy / ps1W;
  ps1Ndc = floor(ps1Ndc * ps1Grid + 0.5) / ps1Grid;
  gl_Position.xy = ps1Ndc * ps1W;
}
`;

/**
 * Patches any built-in material so its projected vertices land on integer raster
 * positions. Applied after <project_vertex> so the snap happens in clip space,
 * exactly where the console's fixed-point pipeline lost precision.
 */
export function ps1Snap(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", SNAP_CHUNK);
  };
  material.customProgramCacheKey = () => "ps1-snap";
  return material;
}

/**
 * Quantizes an animated value so sway advances in discrete steps instead of
 * gliding, matching the low-precision rotation tables PS1 games animated with.
 */
export function ps1Step(value, steps = 32) {
  return Math.round(value * steps) / steps;
}
