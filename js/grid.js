// Tile grid + A* pathfinding.

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.occ = new Array(cols * rows).fill(null);
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows; }
  get(x, y) { return this.inside(x, y) ? this.occ[y * this.cols + x] : undefined; }
  set(x, y, b) { this.occ[y * this.cols + x] = b; }
}

// Distance from a point to a building's rectangle (0 if inside).
export function distToRect(px, py, b) {
  const dx = Math.max(b.x - px, 0, px - (b.x + b.w));
  const dy = Math.max(b.y - py, 0, py - (b.y + b.h));
  return Math.hypot(dx, dy);
}

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// Finds a tile path from (sx,sy) to any tile whose centre is within `range` of `target`.
// Live walls are walkable but expensive (units stop and chew through them).
// Returns an array of {x,y} steps (empty if already there) or null if unreachable.
export function findPath(grid, sx, sy, target, range, wallCost) {
  const { cols, rows } = grid;
  const N = cols * rows;
  const g = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = [];

  const cost = (x, y) => {
    const o = grid.get(x, y);
    if (o === undefined) return Infinity;
    if (!o || !o.alive) return 0;
    if (o.type === 'wall') return wallCost;
    return Infinity;
  };
  const isGoal = (x, y) => distToRect(x + 0.5, y + 0.5, target) <= range;
  const h = (x, y) => Math.max(0, distToRect(x + 0.5, y + 0.5, target) - range);

  sx = Math.max(0, Math.min(cols - 1, sx));
  sy = Math.max(0, Math.min(rows - 1, sy));
  const start = sy * cols + sx;
  g[start] = 0;
  open.push({ i: start, f: h(sx, sy) });

  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k;
    const { i } = open[best];
    open[best] = open[open.length - 1];
    open.pop();
    if (closed[i]) continue;
    closed[i] = 1;
    const x = i % cols, y = (i / cols) | 0;

    if (isGoal(x, y)) {
      const path = [];
      let c = i;
      while (c !== start) {
        path.push({ x: c % cols, y: (c / cols) | 0 });
        c = came[c];
      }
      return path.reverse();
    }

    for (const [dx, dy, step] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!grid.inside(nx, ny)) continue;
      const extra = cost(nx, ny);
      if (extra === Infinity) continue;
      if (dx && dy) {
        // no cutting corners past buildings or walls
        if (cost(x + dx, y) !== 0 || cost(x, y + dy) !== 0) continue;
      }
      const ni = ny * cols + nx;
      const ng = g[i] + step + extra;
      if (ng < g[ni]) {
        g[ni] = ng;
        came[ni] = i;
        open.push({ i: ni, f: ng + h(nx, ny) });
      }
    }
  }
  return null;
}
