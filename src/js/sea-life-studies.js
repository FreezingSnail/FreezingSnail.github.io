/**
 * Canonical 2D sea-life silhouettes. The Sea life studies page renders the same
 * animals as animated WebGL models (see sea-life-3d.js); these flat forms exist
 * for the Canvas scene explorer and the theme background, which composite fish
 * against 2D kelp far too cheaply to justify a second WebGL context per card.
 */
const fishPalette = ["#17346b", "#2859ad", "#4e83dc", "#8fb6ff"];
const shellPalette = ["#3b2a52", "#5d4274", "#8a5f96", "#c08fb4"];

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

export function drawFish(ctx, x, y, angle, size, variant = "wedge", opacity = 1) {
  const shape = variant === "needle" ? [1.45, 0.5] : variant === "disk" ? [0.8, 1.22] : variant === "heavy" ? [1.2, 0.9] : [1, 0.72];
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size * shape[0], size * shape[1]);
  polygon(ctx, [[-12, 0], [-2, -9], [14, -5], [20, 0]], fishPalette[1]);
  polygon(ctx, [[-12, 0], [-2, 9], [14, 5], [20, 0]], fishPalette[2]);
  polygon(ctx, [[-2, -9], [8, -1], [14, -5]], fishPalette[3]);
  polygon(ctx, [[-12, 0], [-6, -4], [6, -2], [14, -5]], fishPalette[0]);
  polygon(ctx, [[-12, 0], [-28, -11], [-24, 0]], fishPalette[0]);
  polygon(ctx, [[-12, 0], [-28, 11], [-24, 0]], fishPalette[1]);
  polygon(ctx, [[-2, -7], [0, -16], [8, -4]], fishPalette[2]);
  polygon(ctx, [[2, 6], [5, 14], [10, 4]], fishPalette[0]);
  polygon(ctx, [[4, 2], [12, 3], [9, 8]], fishPalette[1]);
  ctx.fillStyle = "#d9edff";
  ctx.fillRect(12, -3, 3, 3);
  ctx.restore();
}

export function drawWhale(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-38, 0], [-20, -14], [19, -16], [42, -6], [52, 0]], "#29466d");
  polygon(ctx, [[-38, 0], [-20, 14], [19, 16], [42, 6], [52, 0]], "#3f6696");
  polygon(ctx, [[-20, -14], [8, -3], [19, -16]], "#6e96c1");
  polygon(ctx, [[-20, 14], [8, 4], [26, 13], [19, 16]], "#4d78a8");
  polygon(ctx, [[8, -3], [19, -16], [42, -6]], "#557fae");
  polygon(ctx, [[-38, 0], [-62, -18], [-58, 0]], "#1b3157");
  polygon(ctx, [[-38, 0], [-62, 18], [-58, 0]], "#29466d");
  polygon(ctx, [[-4, 11], [10, 29], [20, 8]], "#203b62");
  polygon(ctx, [[-6, -14], [4, -24], [12, -14]], "#5d87b4");
  ctx.fillStyle = "#dcecff"; ctx.fillRect(39, -4, 4, 4); ctx.restore();
}

/**
 * Top-down manta, matching the 3D study model: swept wings in three tone bands
 * per side, cephalic horns at the nose, and a segmented trailing tail. Callers
 * rotate it into the travel direction, so the nose points along -y here.
 */
export function drawManta(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  // Wings, root to tip, lit on the trailing band so the sweep reads as volume.
  [-1, 1].forEach((side) => {
    polygon(ctx, [[0, -14], [side * 17, -12], [side * 34, 4], [side * 12, 8]], side < 0 ? "#28486f" : "#2e5680");
    polygon(ctx, [[side * 17, -12], [side * 34, 4], [side * 47, 13], [side * 30, -4]], side < 0 ? "#31597f" : "#3d6a95");
    polygon(ctx, [[side * 30, -4], [side * 47, 13], [side * 33, 17]], side < 0 ? "#22405f" : "#28496c");
    polygon(ctx, [[side * 12, 8], [side * 34, 4], [side * 33, 17], [side * 10, 19]], side < 0 ? "#1d3a58" : "#224464");
  });
  // Core body ridge.
  polygon(ctx, [[0, -21], [10, -8], [8, 20], [-8, 20], [-10, -8]], "#43729c");
  polygon(ctx, [[0, -21], [5, -6], [0, 20], [-5, -6]], "#5b8bb2");
  // Cephalic horns and eyes.
  polygon(ctx, [[-10, -17], [-16, -30], [-3, -20]], "#6d9bbf");
  polygon(ctx, [[10, -17], [16, -30], [3, -20]], "#6d9bbf");
  ctx.fillStyle = "#111f33";
  ctx.fillRect(-12, -14, 3, 3);
  ctx.fillRect(9, -14, 3, 3);
  // Tail in tapering segments.
  polygon(ctx, [[-6, 19], [6, 19], [4, 33], [-4, 33]], "#1a3350");
  polygon(ctx, [[-4, 33], [4, 33], [2, 45], [-2, 45]], "#152b45");
  polygon(ctx, [[-2, 45], [2, 45], [0, 55]], "#101f34");
  ctx.restore();
}

export function drawShark(ctx, x, y, size) {  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-42, 0], [-15, -9], [22, -8], [45, 0]], "#2d5a83");
  polygon(ctx, [[-42, 0], [-15, 9], [22, 8], [45, 0]], "#4b7fa7");
  polygon(ctx, [[-15, -9], [6, -4], [22, -8]], "#3a6b93");
  polygon(ctx, [[-9, -8], [3, -28], [14, -7]], "#1c3e66");
  polygon(ctx, [[-2, 8], [13, 24], [19, 7]], "#264d75");
  polygon(ctx, [[-24, 8], [-14, 18], [-6, 8]], "#31608a");
  polygon(ctx, [[-42, 0], [-62, -18], [-56, 0]], "#1b365b");
  polygon(ctx, [[-42, 0], [-62, 18], [-56, 0]], "#2d5a83");
  ctx.fillStyle = "#dcecff"; ctx.fillRect(33, -3, 3, 3); ctx.restore();
}

/**
 * Flat-soled snail with nested whorls, matching the 3D study model: the sole sits
 * on y = 0 so callers can plant it directly on a floor line.
 */
export function drawSnail(ctx, x, y, size, shell = 0, flip = 1, opacity = 1) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.scale(size * flip, size);
  polygon(ctx, [[-22, 0], [-16, -7], [13, -8], [25, -3], [23, 0]], "#2f5f6d");
  polygon(ctx, [[-16, -7], [13, -8], [9, -4], [-12, -4]], "#3f7c8c");
  polygon(ctx, [[19, -6], [31, -10], [29, -2], [21, -2]], "#4d8a95");
  ctx.strokeStyle = "#4d8a95";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(27, -9); ctx.lineTo(32, -19);
  ctx.moveTo(29, -8); ctx.lineTo(37, -16);
  ctx.stroke();
  ctx.fillStyle = "#1b1030";
  ctx.fillRect(31, -22, 3, 3);
  ctx.fillRect(36, -19, 3, 3);

  const radius = shell === 1 ? 12 : shell === 2 ? 16 : 14;
  const sides = shell === 1 ? 5 : 6;
  const centerY = -radius * 0.9 - 4;
  for (let whorl = 0; whorl < 3; whorl += 1) {
    const r = radius * Math.pow(0.56, whorl);
    const angle = whorl * 2.1;
    const cx = -2 + Math.cos(angle) * (radius - r) * 0.55;
    const cy = centerY + Math.sin(angle) * (radius - r) * 0.55;
    const points = Array.from({ length: sides }, (_, index) => {
      const a = -Math.PI / 2 + (index / sides) * Math.PI * 2 + whorl * 0.4;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92];
    });
    polygon(ctx, points, shellPalette[Math.max(2 - whorl, 0)]);
    polygon(ctx, [[cx, cy], points[0], points[1]], shellPalette[3]);
  }
  polygon(ctx, [[radius * 0.5, centerY + radius * 0.5], [radius * 1.0, centerY + radius * 0.1], [radius * 0.86, centerY + radius * 0.78]], "#241738");
  ctx.restore();
}
