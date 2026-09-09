import { drawFish as drawStudyFish, drawManta, drawShark, drawSnail, drawWhale } from "./sea-life-studies.js";
import { createSpriteBook } from "./sea-life-sprites.js";

/**
 * One shared sprite renderer serves every scene canvas on the page. When WebGL is
 * unavailable the flat forms are used instead, so scenes still render.
 */
const sprites = createSpriteBook();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const kelpSpecies = {
  ribbon: ["#071b23", "#0c3038", "#14504b", "#28705a"],
  fan: ["#0a2626", "#135047", "#23745c", "#55a475"],
  feather: ["#112b22", "#245237", "#42733d", "#729245"],
  bulb: ["#273321", "#536331", "#858340", "#b8a75b"],
  whip: ["#082524", "#0e4b45", "#177160", "#67ad8b"],
  sheet: ["#17291d", "#304f35", "#537840", "#88a45a"],
  giant: ["#0b2630", "#15515a", "#287d70", "#78b694"],
  palm: ["#182a1c", "#3a5833", "#668244", "#a5a85c"],
};
const speciesMix = {
  thicket: ["ribbon", "ribbon", "fan", "whip", "feather"],
  grove: ["feather", "ribbon", "bulb", "feather", "whip"],
  canopy: ["ribbon", "bulb", "ribbon", "sheet", "feather"],
  clearing: ["fan", "feather", "whip", "ribbon"],
  wall: ["ribbon", "ribbon", "sheet", "fan", "whip"],
  aisle: ["feather", "bulb", "feather", "ribbon"],
  tangle: ["sheet", "fan", "whip", "ribbon", "fan"],
  deep: ["ribbon", "whip", "feather", "ribbon", "sheet"],
  "bulb-bed": ["bulb", "bulb", "ribbon", "sheet", "bulb"],
  "feather-meadow": ["feather", "feather", "whip", "ribbon", "feather"],
  "fan-reef": ["fan", "fan", "sheet", "ribbon", "fan"],
  mosaic: ["ribbon", "fan", "feather", "bulb", "whip", "sheet"],
  "tower-grove": ["giant", "giant", "feather", "ribbon", "whip"],
  "palm-canopy": ["palm", "palm", "giant", "sheet", "fan"],
  "giant-wall": ["giant", "giant", "palm", "feather", "ribbon"],
  "open-forest": ["giant", "palm", "ribbon", "whip", "sheet"],
};
const bladeColors = kelpSpecies.ribbon;
export const UNDERWATER_SCENES = Object.freeze(Object.keys(speciesMix));

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function fit(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: bounds.width, height: bounds.height, ratio };
}

function water(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#78ad95");
  gradient.addColorStop(0.52, "#3a7b6c");
  gradient.addColorStop(1, "#1d554f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#8fc8a8";
  for (let x = 9; x < width; x += 37) for (let y = (x * 11) % 41; y < height; y += 47) ctx.fillRect(x, y, 1, 1);
}

/**
 * Virtual raster for the Canvas scenes. The PS1 could not place a vertex between
 * pixels, so kelp vertices are rounded onto this grid and the sway phase advances
 * in steps: the silhouette pops from pose to pose instead of sliding.
 */
const RASTER = 2;

function snap(value) {
  return Math.round(value / RASTER) * RASTER;
}

/** Deterministic hash so a scene's composition is stable frame to frame. */
function hash(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function sceneSeed(scene) {
  let seed = 7;
  for (let index = 0; index < scene.length; index += 1) seed += scene.charCodeAt(index) * (index + 3);
  return seed;
}

/**
 * Per-scene composition. `ground` decides whether the frame shows terrain at all:
 * "none" keeps the camera in mid-water with roots below the viewport, while
 * "slope" tilts the floor so the forest climbs toward the surface (signed
 * `slope`: positive rises to the right).
 */
const SCENE_PROFILE = {
  thicket: { far: 21, middle: 15, front: 10, height: 0.82, layout: "clumps", relief: 0.05, ground: "flat" },
  grove: { far: 17, middle: 11, front: 7, height: 1.22, layout: "clumps", relief: 0.06, ground: "slope", slope: 0.34 },
  canopy: { far: 19, middle: 14, front: 9, height: 1.08, layout: "even", relief: 0.04, ground: "none" },
  clearing: { far: 18, middle: 12, front: 8, height: 0.94, layout: "corridor", relief: 0.06, ground: "flat" },
  wall: { far: 25, middle: 19, front: 14, height: 1.03, layout: "wall", relief: 0.03, ground: "slope", slope: -0.38 },
  aisle: { far: 15, middle: 8, front: 6, height: 1.35, layout: "corridor", relief: 0.05, ground: "none" },
  tangle: { far: 27, middle: 20, front: 12, height: 0.72, layout: "clumps", relief: 0.09, ground: "flat" },
  deep: { far: 30, middle: 17, front: 8, height: 1.12, layout: "islands", relief: 0.1, ground: "none" },
  "bulb-bed": { far: 19, middle: 15, front: 10, height: 1.05, layout: "clumps", relief: 0.06, ground: "flat" },
  "feather-meadow": { far: 24, middle: 18, front: 9, height: 1.14, layout: "even", relief: 0.05, ground: "slope", slope: 0.24 },
  "fan-reef": { far: 22, middle: 19, front: 13, height: 0.78, layout: "islands", relief: 0.12, ground: "slope", slope: -0.44 },
  mosaic: { far: 26, middle: 18, front: 11, height: 1, layout: "clumps", relief: 0.06, ground: "flat" },
  "tower-grove": { far: 16, middle: 10, front: 6, height: 1.8, layout: "islands", relief: 0.09, ground: "none" },
  "palm-canopy": { far: 14, middle: 9, front: 5, height: 1.7, layout: "clumps", relief: 0.07, ground: "slope", slope: 0.3 },
  "giant-wall": { far: 21, middle: 15, front: 10, height: 1.6, layout: "wall", relief: 0.04, ground: "none" },
  "open-forest": { far: 13, middle: 8, front: 4, height: 1.75, layout: "islands", relief: 0.11, ground: "slope", slope: -0.32 },
};

/**
 * Spreads a layer's plants across the frame. Even spacing made every scene read
 * the same, so each composition now picks a distribution: clumped stands, an open
 * corridor, a solid wall, or widely separated islands.
 */
function placeX(layout, index, count, width, seed) {
  const jitter = (hash(seed + index * 3.7) - 0.5) * (width / count) * 0.7;
  if (layout === "wall") return (index + 0.5) * width / count + jitter * 0.4;
  if (layout === "corridor") {
    const side = index % 2 ? 1 : -1;
    const rank = Math.floor(index / 2) / Math.max(count / 2, 1);
    return width * 0.5 + side * (width * 0.22 + rank * width * 0.34) + jitter;
  }
  if (layout === "islands") {
    const islands = Math.max(2, Math.round(count / 6));
    const island = index % islands;
    const center = width * (0.12 + hash(seed + island * 12.3) * 0.76);
    return center + (hash(seed + index * 5.1) - 0.5) * width * 0.16 + jitter * 0.5;
  }
  if (layout === "clumps") {
    const clumps = Math.max(3, Math.round(count / 4));
    const clump = index % clumps;
    const center = (clump + 0.5) * width / clumps + (hash(seed + clump * 8.9) - 0.5) * width / clumps;
    return center + (hash(seed + index * 4.3) - 0.5) * width * 0.1 + jitter * 0.6;
  }
  return (index + 0.5) * width / count + jitter;
}

/** Jagged floor line shared by the terrain fill and every plant's root. */
function floorY(x, width, height, seed, profile, verticalLift) {
  const step = Math.max(width / 9, 40);
  const cell = Math.floor(x / step);
  const blend = (x - cell * step) / step;
  const near = hash(seed + cell * 2.7);
  const far = hash(seed + (cell + 1) * 2.7);
  const ridge = near + (far - near) * blend;
  // Sloped scenes tilt the whole floor so the forest climbs toward the surface.
  const tilt = profile.ground === "slope" ? (x / width - 0.5) * -(profile.slope ?? 0) * height : 0;
  const line = height * (0.93 - verticalLift) + tilt + (ridge - 0.5) * height * profile.relief * 2;
  return snap(Math.min(Math.max(line, height * 0.3), height + 20));
}

function seafloor(ctx, width, height, seed, profile, verticalLift) {
  const step = Math.max(width / 9, 40);
  const points = [];
  for (let x = -step; x <= width + step; x += step / 2) {
    points.push([snap(x), floorY(x, width, height, seed, profile, verticalLift)]);
  }
  ctx.save();
  polygon(ctx, [...points, [width + step, height + 4], [-step, height + 4]], "#123c3a");
  for (let index = 0; index < points.length - 1; index += 1) {
    const [ax, ay] = points[index];
    const [bx, by] = points[index + 1];
    polygon(ctx, [[ax, ay], [bx, by], [bx, by + 10 + hash(seed + index) * 14]], index % 2 ? "#0f3231" : "#16443f");
  }
  // Boulders break the ridge line so the floor is not just a sawtooth band.
  const boulders = Math.max(2, Math.round(width / 190));
  for (let index = 0; index < boulders; index += 1) {
    const x = snap(width * hash(seed + index * 6.1));
    const base = floorY(x, width, height, seed, profile, verticalLift);
    const size = snap(10 + hash(seed + index * 2.9) * 22);
    polygon(ctx, [
      [x - size, base + size * 0.4], [x - size * 0.6, base - size * 0.6],
      [x + size * 0.4, base - size * 0.8], [x + size, base - size * 0.1], [x + size * 0.7, base + size * 0.5],
    ], index % 2 ? "#0b2a2b" : "#0e3433");
    polygon(ctx, [[x - size * 0.6, base - size * 0.6], [x + size * 0.4, base - size * 0.8], [x - size * 0.1, base - size * 0.2]], "#1a4e46");
  }
  ctx.restore();
}

/** Faceted holdfast so near plants look anchored rather than pasted on. */
function holdfast(ctx, x, y, size, colors) {
  polygon(ctx, [[x - size, y + size * 0.5], [x - size * 0.5, y - size * 0.6], [x + size * 0.6, y - size * 0.4], [x + size, y + size * 0.5]], colors[0]);
  polygon(ctx, [[x - size * 0.5, y - size * 0.6], [x + size * 0.6, y - size * 0.4], [x, y + size * 0.2]], colors[1]);
}

/** Sweeping surface light. Cheap, and it keeps the whole frame moving. */
function lightShafts(ctx, width, height, time) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.05;
  for (let shaft = 0; shaft < 3; shaft += 1) {
    const sweep = Math.sin(time * 0.00013 + shaft * 2.1) * width * 0.3;
    const topX = snap(width * (0.2 + shaft * 0.3) + sweep);
    const spread = snap(width * 0.09 + shaft * 8);
    polygon(ctx, [
      [topX, -4], [topX + spread, -4],
      [topX + spread * 2.4 + height * 0.24, height], [topX + spread * 0.6 + height * 0.24, height],
    ], "#bfe6cf");
  }
  ctx.restore();
}

/**
 * Centre of a blade at a given progress along it. Crowns and leaflets attach with
 * this rather than the root x: a stipe bends and sways, so its tip is nowhere near
 * where it was planted, and anything pinned to the root floats free of the stem.
 */
function ribbonCenter(rootX, rootY, length, width, bend, time, sway, progress) {
  const steppedTime = Math.round(time / 42) * 42;
  const wobble = Math.sin(steppedTime * 0.00072 * sway + rootX * 0.041 + progress * 3.1) * progress * 13 * sway;
  return [rootX + bend * progress * progress + wobble, rootY - length * progress];
}

/**
 * Kelp blade. Near layers get a raised mid-rib, so each blade is three columns of
 * vertices and reads as a folded ribbon instead of a flat cutout; distant layers
 * stay two-column because the fold is invisible at that size and costs fills.
 */
function ribbon(ctx, rootX, rootY, length, width, bend, time, tone, sway = 1, colors = bladeColors, folded = true) {
  const segments = folded ? 6 : 7;
  const left = []; const mid = []; const right = [];
  for (let segment = 0; segment <= segments; segment += 1) {
    const progress = segment / segments;
    const [center, lineY] = ribbonCenter(rootX, rootY, length, width, bend, time, sway, progress);
    const centerX = center + (segment % 2 ? width * 0.1 : -width * 0.08);
    const half = Math.max(width * (1 - progress * 0.72), 1);
    const y = snap(lineY);
    left.push([snap(centerX - half), y]);
    right.push([snap(centerX + half), y]);
    if (folded) {
      const twist = Math.sin(progress * 4.1 + rootX * 0.021) * 0.4;
      mid.push([snap(centerX + half * (0.16 + twist * 0.34)), snap(y - half * 0.18)]);
    }
  }
  for (let segment = 0; segment < segments; segment += 1) {
    const band = (tone + segment) % 2;
    if (!folded) {
      polygon(ctx, [left[segment], right[segment], left[segment + 1]], colors[(tone + segment) % colors.length]);
      polygon(ctx, [right[segment], right[segment + 1], left[segment + 1]], colors[(tone + segment + 1) % colors.length]);
      continue;
    }
    const shadow = colors[band];
    const lit = colors[2 + band];
    polygon(ctx, [left[segment], mid[segment], mid[segment + 1]], shadow);
    polygon(ctx, [left[segment], mid[segment + 1], left[segment + 1]], colors[1 - band]);
    polygon(ctx, [mid[segment], right[segment], right[segment + 1]], lit);
    polygon(ctx, [mid[segment], right[segment + 1], mid[segment + 1]], colors[3 - band]);
  }
}

function fan(ctx, x, y, length, width, time, tone, colors, folded) {
  for (let blade = 0; blade < 4; blade += 1) {
    ribbon(ctx, x + (blade - 1.5) * width * 0.18, y, length * (0.7 + blade * 0.08), width * 0.58, (blade - 1.5) * width * 1.8, time, tone + blade, 0.7, colors, folded);
  }
}

function feather(ctx, x, y, length, width, time, tone, colors, folded) {
  ribbon(ctx, x, y, length, width * 0.2, width * 0.7, time, tone, 0.55, colors, folded);
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const progress = 0.2 + leaf * 0.14;
    const [leafX, leafY] = ribbonCenter(x, y, length, width * 0.2, width * 0.7, time, 0.55, progress);
    ribbon(ctx, leafX, leafY, length * 0.2, width * 0.52, leaf % 2 ? width * 1.9 : -width * 1.9, time, tone + leaf + 1, 0.65, colors, folded);
  }
}

function bulb(ctx, x, y, length, width, time, tone, colors, folded) {
  const stipeLength = length * 0.75;
  const stipeWidth = width * 0.17;
  const bend = width * 0.6;
  ribbon(ctx, x, y, stipeLength, stipeWidth, bend, time, tone, 0.5, colors, folded);
  // Float and crown ride the stipe tip, so they stay attached as the stem sways.
  const [crownX, crownY] = ribbonCenter(x, y, stipeLength, stipeWidth, bend, time, 0.5, 0.95);
  polygon(ctx, [[crownX, crownY - width * 0.5], [crownX + width * 0.43, crownY - width * 0.1], [crownX + width * 0.28, crownY + width * 0.36], [crownX - width * 0.3, crownY + width * 0.36], [crownX - width * 0.43, crownY - width * 0.1]], colors[(tone + 3) % colors.length]);
  polygon(ctx, [[crownX, crownY - width * 0.5], [crownX + width * 0.43, crownY - width * 0.1], [crownX + width * 0.06, crownY + width * 0.05]], colors[(tone + 1) % colors.length]);
  for (let blade = 0; blade < 4; blade += 1) ribbon(ctx, crownX, crownY, length * 0.2, width * 0.44, (blade - 1.5) * width * 1.7, time, tone + blade, 0.7, colors, folded);
}

function whips(ctx, x, y, length, width, time, tone, colors, folded) {
  for (let blade = 0; blade < 3; blade += 1) {
    ribbon(ctx, x + (blade - 1) * width * 0.32, y, length * (0.84 + blade * 0.08), width * 0.18, (blade - 1) * width * 2.4, time, tone + blade, 0.9, colors, folded);
  }
}

function sheets(ctx, x, y, length, width, time, tone, colors, folded) {
  ribbon(ctx, x - width * 0.22, y, length * 0.72, width * 1.15, -width * 1.7, time, tone, 0.72, colors, folded);
  ribbon(ctx, x + width * 0.25, y, length * 0.88, width * 0.86, width * 1.5, time, tone + 1, 0.68, colors, folded);
}

function giant(ctx, x, y, length, width, time, tone, colors, folded) {
  const stipeLength = length * 1.08;
  const stipeWidth = width * 0.16;
  const bend = width * 0.45;
  ribbon(ctx, x, y, stipeLength, stipeWidth, bend, time, tone, 0.45, colors, folded);
  for (let leaf = 0; leaf < 7; leaf += 1) {
    const progress = (0.18 + leaf * 0.12) / 1.08;
    const [leafX, leafY] = ribbonCenter(x, y, stipeLength, stipeWidth, bend, time, 0.45, progress);
    ribbon(ctx, leafX, leafY, length * 0.24, width * 0.48, leaf % 2 ? width * 2.2 : -width * 2.2, time, tone + leaf + 1, 0.6, colors, folded);
  }
}

function palm(ctx, x, y, length, width, time, tone, colors, folded) {
  const stipeLength = length * 0.82;
  const stipeWidth = width * 0.18;
  const bend = width * 0.35;
  ribbon(ctx, x, y, stipeLength, stipeWidth, bend, time, tone, 0.42, colors, folded);
  const [crownX, crownY] = ribbonCenter(x, y, stipeLength, stipeWidth, bend, time, 0.42, 0.96);
  polygon(ctx, [[crownX, crownY - width * 0.42], [crownX + width * 0.38, crownY - width * 0.08], [crownX + width * 0.23, crownY + width * 0.33], [crownX - width * 0.28, crownY + width * 0.32], [crownX - width * 0.4, crownY - width * 0.09]], colors[(tone + 3) % colors.length]);
  for (let frond = 0; frond < 7; frond += 1) {
    ribbon(ctx, crownX, crownY, length * 0.3, width * 0.48, (frond - 3) * width * 1.55, time, tone + frond, 0.62, colors, folded);
  }
}

function forestLayer(ctx, scene, width, height, time, layer, settings) {
  const { worldExtent, verticalLift, kelpHeight, structureReach, grounded } = settings;
  const profile = SCENE_PROFILE[scene] ?? SCENE_PROFILE.mosaic;
  const depth = layer === "far" ? 0 : layer === "middle" ? 1 : 2;
  const worldScale = 1 / Math.sqrt(worldExtent);
  const count = Math.ceil(profile[layer] * worldExtent);
  const alpha = [0.3, 0.6, 0.94][depth];
  const widthScale = [0.34, 0.7, 1.16][depth];
  const lengthScale = [0.43, 0.72, 1][depth] * profile.height;
  const seed = sceneSeed(scene) + depth * 31;
  const mix = speciesMix[scene] ?? speciesMix.mosaic;
  // Kelp is rooted: stable placement gives current-driven blade motion without
  // making the forest slide through the scene like travelling fauna.
  const grows = grounded && profile.ground !== "none";
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let index = 0; index < count; index += 1) {
    const variation = hash(seed + index * 19.7);
    const placed = placeX(profile.layout, index, count, width, seed);
    const x = snap(placed);
    // Grounded scenes root on the visible floor; mid-water scenes and the page
    // background keep roots below the viewport so no terrain edge cuts across.
    const rootY = grows
      ? floorY(x, width, height, sceneSeed(scene) + 62, profile, verticalLift) + 6 + variation * 8
      : height + 14 + variation * 18 - height * verticalLift;
    const length = height * (0.42 + variation * 0.55) * lengthScale * worldScale * kelpHeight;
    const bladeWidth = (8 + variation * 12) * widthScale * worldScale;
    // The mid-rib fold is invisible on thin blades, so only pay for it when wide.
    const folded = depth > 0 && bladeWidth >= 6;
    const structureRootY = rootY - height * structureReach * (0.72 + variation * 0.4);
    if (structureReach > 0) {
      ribbon(ctx, x, rootY, rootY - structureRootY, Math.max(bladeWidth * 0.16, 1.4), (variation - 0.5) * 18, time, index + depth, 0.35 + depth * 0.18, kelpSpecies.feather, false);
    }
    const form = mix[(index + depth * 2) % mix.length];
    const colors = kelpSpecies[form] ?? kelpSpecies.ribbon;
    if (depth > 0 && grows && structureReach === 0) holdfast(ctx, x, rootY, bladeWidth * 0.7, colors);
    if (form === "ribbon") ribbon(ctx, x, structureRootY, length, bladeWidth, (variation - 0.5) * 48, time, index + depth, 0.45 + depth * 0.3, colors, folded);
    else if (form === "fan") fan(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else if (form === "feather") feather(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else if (form === "bulb") bulb(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else if (form === "giant") giant(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else if (form === "palm") palm(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else if (form === "whip") whips(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    else sheets(ctx, x, structureRootY, length, bladeWidth, time, index + depth, colors, folded);
    if ((scene === "grove" || scene === "aisle") && depth > 0) {
      for (let leaf = 0; leaf < 5; leaf += 1) {
        const y = structureRootY - length * (0.2 + leaf * 0.14);
        ribbon(ctx, x + (leaf % 2 ? 3 : -3), y, height * 0.13 * lengthScale, bladeWidth * 0.65, leaf % 2 ? 28 : -28, time, index + leaf + 1, 0.5 + depth * 0.2, kelpSpecies.feather, folded);
      }
    }
  }
  ctx.restore();
}

/**
 * Distant layers are expensive to fill and barely change, so each is drawn once
 * into an offscreen strip. Only the front layer is redrawn every frame, which is
 * what keeps the scene from feeling like it is chugging.
 */
function makeLayerCache() {
  const canvas = document.createElement("canvas");
  return { canvas, ctx: canvas.getContext("2d"), key: "", drawnAt: -Infinity };
}

/** The water gradient and its mote field never change, so draw them once. */
function refreshBackdrop(cache, width, height, ratio) {
  const key = `${Math.round(width)}x${Math.round(height)}@${ratio}`;
  if (cache.key === key) return;
  cache.canvas.width = Math.max(1, Math.round(width * ratio));
  cache.canvas.height = Math.max(1, Math.round(height * ratio));
  cache.key = key;
  cache.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  water(cache.ctx, width, height);
}

/** Redraw a fixed-position layer strip when its stepped sway becomes stale. */
function refreshLayerCache(cache, scene, width, height, time, layer, settings, ratio, interval) {
  const key = `${scene}|${Math.round(width)}x${Math.round(height)}@${ratio}`;
  if (cache.key === key && time - cache.drawnAt < interval) return;
  const span = width * 1.4;
  if (cache.key !== key) {
    cache.canvas.width = Math.max(1, Math.round(span * ratio));
    cache.canvas.height = Math.max(1, Math.round(height * ratio));
    cache.key = key;
  }
  const ctx = cache.ctx;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, span, height);
  ctx.save();
  ctx.translate(width * 0.2, 0);
  forestLayer(ctx, scene, width, height, time, layer, settings);
  ctx.restore();
  cache.drawnAt = time;
}

function blitLayer(ctx, cache, width, height) {
  ctx.drawImage(cache.canvas, -width * 0.2, 0, width * 1.4, height);
}

/** Snails browse the floor line, giving the lower third its own slow motion. */function makeCrawlers(width, worldExtent, lifeScale) {
  const count = Math.max(1, Math.round(2 * Math.sqrt(worldExtent)));
  return Array.from({ length: count }, (_, index) => ({
    offset: Math.random() * width,
    speed: (0.006 + Math.random() * 0.008) * lifeScale,
    direction: Math.random() < 0.5 ? -1 : 1,
    shell: index % 3,
    scale: (0.5 + Math.random() * 0.3) * lifeScale,
  }));
}

function drawCrawlers(ctx, crawlers, scene, width, height, time, verticalLift) {
  const profile = SCENE_PROFILE[scene] ?? SCENE_PROFILE.mosaic;
  const seed = sceneSeed(scene) + 62;
  crawlers.forEach((crawler) => {
    const travel = (crawler.offset + time * crawler.speed) % (width + 80) - 40;
    const x = snap(crawler.direction > 0 ? travel : width - travel);
    const y = floorY(x, width, height, seed, profile, verticalLift) + 4;
    if (sprites) {
      sprites.draw(ctx, "snail", crawler.shell, x, y, crawler.scale, { alpha: 0.9, flip: crawler.direction, time });
      return;
    }
    drawSnail(ctx, x, y, crawler.scale, crawler.shell, crawler.direction, 0.9);
  });
}

const SCHOOL_FORMS = {
  needle: { band: 0.36, depth: [0.12, 0.38], direction: 1, scale: 0.76, phase: 0.2 },
  wedge: { band: 0.5, depth: [0.32, 0.63], direction: -1, scale: 0.94, phase: 1.7 },
  disk: { band: 0.42, depth: [0.56, 0.82], direction: 1, scale: 1.05, phase: 3.1 },
  heavy: { band: 0.64, depth: [0.72, 0.96], direction: -1, scale: 1.16, phase: 4.5 },
};
const SCHOOL_SEQUENCE = ["needle", "wedge", "needle", "wedge", "disk", "heavy"];

function drawFish(ctx, fish, time) {
  const heading = Math.round(Math.atan2(fish.vy, fish.vx) * 16) / 16;
  const size = (0.11 + fish.depth * 0.32) * fish.scale * fish.form.scale;
  const alpha = 0.26 + fish.depth * 0.66;
  if (sprites) {
    sprites.draw(ctx, `fish-${fish.variant}`, fish.pose, snap(fish.x), snap(fish.y), size, { angle: heading, alpha, time });
    return;
  }
  drawStudyFish(ctx, snap(fish.x), snap(fish.y), heading, size, fish.variant, alpha);
}

function makeSchool(width, height, worldExtent = 1, lifeScale = 1 / Math.sqrt(worldExtent), boidDensity = 1) {
  const count = Math.round(30 * Math.sqrt(worldExtent) * boidDensity);
  return Array.from({ length: count }, (_, index) => {
    const variant = SCHOOL_SEQUENCE[index % SCHOOL_SEQUENCE.length];
    const form = SCHOOL_FORMS[variant];
    const depth = form.depth[0] + Math.random() * (form.depth[1] - form.depth[0]);
    return {
      x: Math.random() * width,
      y: height * (form.band + (Math.random() - 0.5) * 0.15),
      vx: form.direction * (0.1 + Math.random() * 0.11),
      vy: (Math.random() - 0.5) * 0.18,
      variant, form, depth, depthBase: depth, depthSwing: 0.04 + Math.random() * 0.06,
      lane: index % 2 ? -1 : 1, phase: Math.random() * Math.PI * 2, scale: lifeScale,
      cruise: 0.2 + Math.random() * 0.14, burst: 0, nextBurst: Math.random() * 6000, pose: index % 2,
    };
  });
}

/** Independent body-form schools share boid rules but never blend into one flat flock. */
function updateSchool(school, width, height, time, dt) {
  school.forEach((fish) => {
    let nearby = 0; let centerX = 0; let centerY = 0; let headingX = 0; let headingY = 0; let avoidX = 0; let avoidY = 0; let alarm = 0;
    school.forEach((other) => {
      if (fish === other || fish.variant !== other.variant) return;
      const dx = other.x - fish.x; const dy = other.y - fish.y; const distance = Math.hypot(dx, dy);
      if (distance > 92) return;
      nearby += 1; centerX += other.x; centerY += other.y; headingX += other.vx; headingY += other.vy;
      if (other.burst > 0.55 && distance < 54) alarm += 1;
      if (distance < 23 && distance > 0.1) { avoidX -= dx / distance; avoidY -= dy / distance; }
    });
    if (nearby) {
      fish.vx += ((headingX / nearby - fish.vx) * 0.026 + (centerX / nearby - fish.x) * 0.0008 + avoidX * 0.035) * dt;
      fish.vy += ((headingY / nearby - fish.vy) * 0.026 + (centerY / nearby - fish.y) * 0.0008 + avoidY * 0.035) * dt;
    }
    if (fish.burst < 0.2 && time > fish.nextBurst) {
      fish.burst = 1;
      fish.nextBurst = time + 2200 + Math.random() * 7000;
    } else if (alarm && fish.burst < 0.4 && Math.random() < 0.05 * dt) {
      fish.burst = 0.85;
    }
    fish.burst *= Math.pow(0.982, dt);
    fish.depth = Math.min(Math.max(fish.depthBase + Math.sin(time * 0.00029 + fish.phase) * fish.depthSwing, 0.06), 0.98);
    const pulse = 0.5 - Math.cos(time * 0.00038 + fish.form.phase) * 0.5;
    const split = pulse * pulse * (3 - 2 * pulse);
    const target = fish.cruise * (1 + fish.burst * 2.4);
    const laneY = height * (fish.form.band + fish.lane * split * 0.09 + (fish.depth - 0.5) * 0.12) + Math.sin(time * 0.0011 + fish.phase) * 12;
    const currentX = fish.form.direction * (target + fish.depth * 0.08 + Math.sin(time * 0.00077 + fish.phase) * 0.1);
    const currentY = Math.cos(time * 0.00093 + fish.phase * 1.7) * 0.08;
    const response = fish.burst > 0.3 ? 0.06 : 0.012;
    fish.vx += ((currentX - fish.vx) * response + Math.cos(time * 0.0014 + fish.phase) * 0.006) * dt;
    fish.vy += ((laneY - fish.y) * 0.00048 + currentY * 0.018) * dt;
    const speed = Math.hypot(fish.vx, fish.vy);
    const cap = target * 1.25 + 0.08;
    if (speed > cap) { fish.vx = fish.vx / speed * cap; fish.vy = fish.vy / speed * cap; }
    fish.x += fish.vx * dt; fish.y += fish.vy * dt;
    if (fish.x > width + 14) { fish.x = -14; fish.y = height * (fish.form.band + (Math.random() - 0.5) * 0.16); }
    if (fish.x < -14) { fish.x = width + 14; fish.y = height * (fish.form.band + (Math.random() - 0.5) * 0.16); }
    if (fish.y < height * 0.16) fish.vy += 0.04 * dt;
    if (fish.y > height * 0.84) fish.vy -= 0.04 * dt;
  });
}

/** Draw depth slices separately, preserving kelp occlusion and far-to-near overlap. */
function drawSchool(ctx, school, time, from, to) {
  school
    .filter((fish) => fish.depth >= from && fish.depth < to)
    .sort((a, b) => a.depth - b.depth)
    .forEach((fish) => drawFish(ctx, fish, time));
}

function createRareLife() {
  return {
    offset: Math.random() * 32000,
    kindOffset: Math.floor(Math.random() * 3),
    direction: Math.random() < 0.5 ? -1 : 1,
    baseY: 0.27 + Math.random() * 0.32,
    phase: Math.random() * Math.PI * 2,
    // Animals cross the forest in depth as well as across it: they enter at one
    // distance and leave at another, so a pass is a diagonal through the scene.
    depthStart: Math.random() * 0.5,
    depthEnd: 0.5 + Math.random() * 0.5,
  };
}

/**
 * Resolves the current encounter into a drawable state. Depth drives scale,
 * opacity, and which layer slot the animal is drawn in, so it genuinely passes
 * between the far and near kelp instead of sliding across in one plane.
 */
function rareAnimalState(width, height, time, rareLife, worldExtent, lifeScale, animalScale) {
  const cycle = 32000;
  const duration = 8000;
  const encounterTime = time + rareLife.offset;
  const encounter = Math.floor(encounterTime / cycle);
  const phase = encounterTime % cycle;
  if (phase >= duration) return null;
  const progress = phase / duration;
  const direction = encounter % 2 ? -rareLife.direction : rareLife.direction;
  const swap = encounter % 3 === 1;
  const from = swap ? rareLife.depthEnd : rareLife.depthStart;
  const to = swap ? rareLife.depthStart : rareLife.depthEnd;
  // Eased so the animal lingers at its nearest point rather than sweeping past.
  const curve = progress * progress * (3 - 2 * progress);
  const depth = from + (to - from) * curve;
  const base = Math.min(width / 190, height / 105) * lifeScale * animalScale;
  const travel = direction > 0 ? -80 + progress * (width + 160) : width + 80 - progress * (width + 160);
  return {
    kind: (rareLife.kindOffset + encounter * 2) % 3,
    direction,
    depth,
    x: snap(travel),
    // Nearer animals ride lower in frame, matching a camera looking slightly down.
    y: snap(height * (rareLife.baseY + depth * 0.14) + Math.sin(progress * Math.PI * 1.4 + rareLife.phase) * height * 0.09),
    scale: base * (0.42 + depth * 1.05),
    alpha: (0.26 + depth * 0.34) * Math.sin(progress * Math.PI),
  };
}

function drawRareAnimal(ctx, animal, time) {
  const scale = animal.scale;
  const kinds = ["whale", "manta", "shark"];
  if (sprites) {
    // The manta model is top-down, so its nose is rotated onto the travel axis
    // and its wingspan squeezed to read as a flap rather than a flat glide.
    const manta = animal.kind === 1;
    sprites.draw(ctx, kinds[animal.kind], 0, animal.x, animal.y, scale, {
      alpha: animal.alpha,
      flip: animal.direction,
      angle: 0,
      squeeze: manta ? 0.78 + Math.abs(Math.sin(time * 0.0016)) * 0.22 : 1,
      time,
    });
    return;
  }
  ctx.save();
  ctx.globalAlpha = Math.max(animal.alpha, 0);
  if (animal.kind === 0) drawWhale(ctx, animal.x, animal.y, animal.direction > 0 ? scale : -scale);
  else if (animal.kind === 1) {
    // Manta wings lie horizontally in XZ, so the front scene camera sees a thin
    // profile rather than the overhead broadside used by the old fallback.
    ctx.translate(animal.x, animal.y);
    ctx.scale(1, 0.12);
    drawManta(ctx, 0, 0, scale);
  } else drawShark(ctx, animal.x, animal.y, animal.direction > 0 ? scale : -scale);
  ctx.restore();
}

export function startUnderwaterScene(canvas, initialScene = canvas.dataset.underwaterScene, onSceneChange, options = {}) {
  const worldExtent = Math.max(options.worldExtent ?? 1, 1);
  const verticalLift = Math.max(options.verticalLift ?? 0, 0);
  const kelpHeight = Math.max(options.kelpHeight ?? 1, 0.1);
  const structureReach = Math.max(options.structureReach ?? 0, 0);
  const lifeScale = options.lifeScale ?? 1 / Math.sqrt(worldExtent);
  const boidDensity = Math.max(options.boidDensity ?? 1, 0.1);
  const animalScale = Math.max(options.animalScale ?? 1, 0.1);
  const settings = {
    worldExtent,
    verticalLift,
    kelpHeight,
    structureReach,
    grounded: options.grounded ?? true,
  };
  let scene = initialScene;
  let state = fit(canvas);
  let school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
  let rareLife = createRareLife();
  let crawlers = makeCrawlers(state.width, worldExtent, lifeScale);
  let running = true;
  let last;
  const farCache = makeLayerCache();
  const middleCache = makeLayerCache();
  const backdrop = makeLayerCache();
  let frame;

  function setScene(nextScene) {
    if (!speciesMix[nextScene] || nextScene === scene) return;
    scene = nextScene;
    school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
    rareLife = createRareLife();
    crawlers = makeCrawlers(state.width, worldExtent, lifeScale);
    onSceneChange?.(scene);
  }

  function render(time) {
    const { ctx, width, height, ratio } = state;
    const profile = SCENE_PROFILE[scene] ?? SCENE_PROFILE.mosaic;
    const showGround = settings.grounded && profile.ground !== "none";
    // Frame-rate independent: motion is driven by elapsed time, not per-frame
    // constants, so raising the loop rate no longer speeds the scene up.
    const dt = last === undefined ? 1 : Math.min(Math.max((time - last) / 16.67, 0.2), 3);
    last = time;
    const worldScale = 1 / Math.sqrt(worldExtent);
    const animal = rareAnimalState(width, height, time, rareLife, worldExtent, lifeScale, animalScale);

    refreshBackdrop(backdrop, width, height, ratio);
    ctx.drawImage(backdrop.canvas, 0, 0, width, height);
    lightShafts(ctx, width, height, time);
    refreshLayerCache(farCache, scene, width, height, time, "far", settings, ratio, 240);
    blitLayer(ctx, farCache, width, height);
    updateSchool(school, width, height, time, dt);
    drawSchool(ctx, school, time, 0, 0.34);
    if (animal && animal.depth < 0.34) drawRareAnimal(ctx, animal, time);
    if (showGround) seafloor(ctx, width, height, sceneSeed(scene) + 62, profile, verticalLift);
    refreshLayerCache(middleCache, scene, width, height, time, "middle", settings, ratio, 120);
    blitLayer(ctx, middleCache, width, height);
    drawSchool(ctx, school, time, 0.34, 0.72);
    if (animal && animal.depth >= 0.34 && animal.depth < 0.78) drawRareAnimal(ctx, animal, time);
    if (showGround) drawCrawlers(ctx, crawlers, scene, width, height, time, verticalLift);
    forestLayer(ctx, scene, width, height, time, "front", settings);
    drawSchool(ctx, school, time, 0.72, 1);
    if (animal && animal.depth >= 0.78) drawRareAnimal(ctx, animal, time);
    frame = undefined;
    if (running && !reducedMotion.matches) frame = requestAnimationFrame(render);
  }

  /** Offscreen cards stop drawing; a page of scene studies is otherwise all fills. */
  function setRunning(next) {
    if (running === next) return;
    running = next;
    if (running && !reducedMotion.matches && !frame) frame = requestAnimationFrame(render);
    if (!running && frame) { cancelAnimationFrame(frame); frame = undefined; }
  }

  const onResize = () => {
    state = fit(canvas);
    school = makeSchool(state.width, state.height, worldExtent, lifeScale, boidDensity);
    crawlers = makeCrawlers(state.width, worldExtent, lifeScale);
    if (reducedMotion.matches) render(0);
  };
  window.addEventListener("resize", onResize);
  onSceneChange?.(scene);
  render(0);
  return { setScene, setRunning, destroy: () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); } };
}

document.querySelectorAll("[data-underwater-scene]").forEach((canvas) => {
  const renderer = startUnderwaterScene(canvas, undefined, undefined, { worldExtent: Number(canvas.dataset.worldExtent) || 1 });
  if (typeof IntersectionObserver !== "function") return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => renderer.setRunning(entry.isIntersecting));
  }, { rootMargin: "160px" });
  observer.observe(canvas);
});

document.querySelector("[data-scene-blur-toggle]")?.addEventListener("click", (event) => {
  const enabled = document.documentElement.classList.toggle("scene-study-blur");
  event.currentTarget.setAttribute("aria-pressed", String(enabled));
  event.currentTarget.textContent = enabled ? "Sharpen forest" : "Blur forest";
});
