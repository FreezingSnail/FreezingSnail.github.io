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
  if (gl_Position.w > 0.00001) {
    vec2 ps1Grid = ps1Raster * 0.5;
    vec2 ps1Ndc = gl_Position.xy / gl_Position.w;
    ps1Ndc = floor(ps1Ndc * ps1Grid + 0.5) / ps1Grid;
    gl_Position.xy = ps1Ndc * gl_Position.w;
  }
}
`;

// Ordered 4×4 dithering in output color space, then five bits per channel.
// Alpha stays untouched so sprite edges remain cut out against the water.
const COLOR_CHUNK = `
{
  vec2 pixel = mod(floor(gl_FragCoord.xy), 4.0);
  vec2 low = mod(pixel, 2.0);
  vec2 high = floor(pixel / 2.0);
  float fine = 2.0 * low.x + 3.0 * low.y - 4.0 * low.x * low.y;
  float coarse = 2.0 * high.x + 3.0 * high.y - 4.0 * high.x * high.y;
  float threshold = (4.0 * fine + coarse + 0.5) / 16.0;
  gl_FragColor.rgb = clamp(floor(gl_FragColor.rgb * 31.0 + threshold) / 31.0, 0.0, 1.0);
}
`;

/**
 * Patches any built-in material so its projected vertices land on integer raster
 * positions. Applied after <project_vertex> so the snap happens in clip space,
 * exactly where the console's fixed-point pipeline lost precision.
 */
export function ps1Snap(material) {
  const raster = { value: { ...PS1_RASTER } };
  material.userData.ps1Raster = raster;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.ps1Raster = raster;
    shader.vertexShader = `uniform vec2 ps1Raster;\n${shader.vertexShader}`
      .replace("#include <project_vertex>", SNAP_CHUNK);
    shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", COLOR_CHUNK);
  };
  material.customProgramCacheKey = () => "ps1-raster-color-v2";
  return material;
}

/** Keep snapping on the same square-pixel grid as the actual drawing buffer. */
export function ps1SetRaster(scene, width, height) {
  scene.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const raster = material?.userData.ps1Raster;
      if (raster) Object.assign(raster.value, { x: width, y: height });
    });
  });
}

/** Render a small native framebuffer; CSS enlarges it with nearest-neighbor sampling. */
export function ps1Resize(renderer, scene, camera, bounds) {
  const width = Math.max(bounds.width, 1);
  const height = Math.max(bounds.height, 1);
  const scale = Math.min(1, 180 / height, 480 / width);
  const rasterWidth = Math.max(1, Math.round(width * scale));
  const rasterHeight = Math.max(1, Math.round(height * scale));
  renderer.setSize(rasterWidth, rasterHeight, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  ps1SetRaster(scene, rasterWidth, rasterHeight);
}

/** A steady 30 Hz pose cadence; hidden studies release their frame loops. */
export function ps1Animate(canvas, render) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = true;
  let frame;
  let last = -Infinity;
  const active = () => inView && !document.hidden && !reduced.matches;
  function tick(time) {
    frame = undefined;
    if (!active()) return;
    if (time - last >= 1000 / 30 - 0.5) {
      last = time;
      render(time);
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    last = -Infinity;
    if (reduced.matches) render(0);
    else if (active()) frame = requestAnimationFrame(tick);
  }
  const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }, { rootMargin: "100px" }) : null;
  observer?.observe(canvas);
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", schedule);
  render(0);
  if (!reduced.matches) schedule();
  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    document.removeEventListener("visibilitychange", schedule);
    reduced.removeEventListener("change", schedule);
  };
}

/**
 * Quantizes an animated value so sway advances in discrete steps instead of
 * gliding, matching the low-precision rotation tables PS1 games animated with.
 */
export function ps1Step(value, steps = 32) {
  return Math.round(value * steps) / steps;
}
