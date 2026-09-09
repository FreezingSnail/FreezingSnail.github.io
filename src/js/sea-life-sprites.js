import * as THREE from "three";
import { fishModel, fishParts, mantaModel, sharkModel, snailModel, whaleModel } from "./sea-life-3d.js";

/**
 * Bridges the 3D sea-life models into the 2D Canvas scenes.
 *
 * The scenes composite hundreds of kelp polygons per frame, so giving each animal
 * its own WebGL context is not an option. Instead one shared offscreen renderer
 * draws the real animated models into small tiles, and the scenes blit those tiles
 * with nearest-neighbour scaling. The animals are genuinely the 3D studies —
 * swept hulls, hinged tails, flapping wings — rendered live rather than redrawn as
 * flat silhouettes, and the low tile resolution reinforces the PS1 read.
 *
 * `span` is the tile's on-screen size at scale 1, chosen so each animal matches
 * the pixel footprint the flat forms used; `radius` frames the orthographic
 * camera. `interval` throttles pose rendering, so a pose is drawn once per frame
 * and then shared by every animal using it, across every scene canvas.
 */
const TILE = 160;

const SPECIES = {
  "fish-wedge": { radius: 1.8, span: 60, poses: 2, interval: 36, beat: 1.6 },
  "fish-needle": { radius: 2.2, span: 67, poses: 2, interval: 36, beat: 1.9 },
  "fish-disk": { radius: 1.8, span: 58, poses: 2, interval: 36, beat: 1.35 },
  "fish-heavy": { radius: 2, span: 65, poses: 2, interval: 36, beat: 1.25 },
  snail: { radius: 1.6, span: 79, poses: 3, interval: 90, beat: 1 },
  whale: { radius: 2.7, span: 134, poses: 1, interval: 33, beat: 1 },
  manta: { radius: 2.7, span: 113, poses: 1, interval: 33, beat: 1 },
  shark: { radius: 2.3, span: 123, poses: 1, interval: 33, beat: 1 },
};

function buildModel(kind, poseIndex) {
  if (kind.startsWith("fish-")) return fishModel(fishParts(kind.slice(5)));
  if (kind === "snail") return snailModel(poseIndex);
  if (kind === "whale") return whaleModel();
  if (kind === "manta") return mantaModel();
  return sharkModel();
}

export function createSpriteBook() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power", preserveDrawingBuffer: true });
  } catch (error) {
    return null;
  }
  if (!renderer?.domElement) return null;
  renderer.setPixelRatio(1);
  renderer.setSize(TILE, TILE, false);
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const book = new Map();
  Object.entries(SPECIES).forEach(([kind, spec]) => {
    const poses = Array.from({ length: spec.poses }, (_, poseIndex) => {
      const model = buildModel(kind, poseIndex);
      const carrier = new THREE.Group();
      carrier.add(model.group);
      const tile = document.createElement("canvas");
      tile.width = TILE;
      tile.height = TILE;
      return { model, carrier, tile, ctx: tile.getContext("2d"), drawnAt: -Infinity, offset: poseIndex * 900 };
    });
    book.set(kind, { spec, poses });
  });

  function renderPose(kind, poseIndex, time) {
    const entry = book.get(kind);
    const pose = entry.poses[poseIndex % entry.poses.length];
    if (time - pose.drawnAt < entry.spec.interval) return pose;
    const { spec } = entry;
    pose.model.animate(time + pose.offset, spec.beat);
    scene.clear();
    scene.add(pose.carrier);
    camera.position.set(0, 0, 10);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.left = -spec.radius;
    camera.right = spec.radius;
    camera.top = spec.radius;
    camera.bottom = -spec.radius;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    pose.ctx.clearRect(0, 0, TILE, TILE);
    pose.ctx.drawImage(renderer.domElement, 0, 0);
    pose.drawnAt = time;
    return pose;
  }

  return {
    /** Pixel footprint of a species at a given scale, for callers that need it. */
    span(kind, scale) {
      return (SPECIES[kind]?.span ?? 60) * scale;
    },
    /**
     * Renders the requested pose if it is stale and blits it. Rotation orients the
     * model's nose along the travel direction; `flip` mirrors it for leftward
     * movement, matching how the flat forms were used.
     */
    draw(ctx, kind, poseIndex, x, y, scale, { angle = 0, alpha = 1, flip = 1, time = 0, squeeze = 1 } = {}) {
      const pose = renderPose(kind, poseIndex, time);
      const size = SPECIES[kind].span * scale;
      ctx.save();
      ctx.globalAlpha = Math.max(alpha, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(x), Math.round(y));
      if (angle) ctx.rotate(angle);
      if (flip < 0 || squeeze !== 1) ctx.scale(flip < 0 ? -squeeze : squeeze, 1);
      ctx.drawImage(pose.tile, -size / 2, -size / 2, size, size);
      ctx.restore();
    },
  };
}
