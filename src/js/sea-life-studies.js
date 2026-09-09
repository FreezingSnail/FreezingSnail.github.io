/**
 * Canonical 2D sea-life silhouettes. The Sea life studies page renders the same
 * animals as animated WebGL models (see sea-life-3d.js); these flat forms exist
 * for the Canvas scene explorer and the theme background, which composite fish
 * against 2D kelp far too cheaply to justify a second WebGL context per card.
 */
const fishPalette = ["#17346b", "#2859ad", "#4e83dc", "#8fb6ff"];

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

export function drawManta(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  polygon(ctx, [[-48, 0], [-12, -29], [0, -9], [12, -29], [48, 0], [13, 22], [-13, 22]], "#223d63");
  polygon(ctx, [[-48, 0], [0, -9], [-13, 22]], "#315982");
  polygon(ctx, [[48, 0], [0, -9], [13, 22]], "#4b739c");
  polygon(ctx, [[-24, 5], [0, -6], [-8, 17]], "#3d668e");
  polygon(ctx, [[24, 5], [0, -6], [8, 17]], "#5b83ab");
  polygon(ctx, [[-13, 22], [13, 22], [5, 48], [-4, 48]], "#152b4b");
  polygon(ctx, [[-12, -29], [-6, -43], [0, -25]], "#6d9bbf");
  polygon(ctx, [[12, -29], [6, -43], [0, -25]], "#6d9bbf");
  ctx.restore();
}

export function drawShark(ctx, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
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
