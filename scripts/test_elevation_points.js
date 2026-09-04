import fs from 'fs';
import { PNG } from 'pngjs';

function tile2lon(x, z) {
  return x / Math.pow(2, z) * 360 - 180;
}
function tile2lat(y, z) {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
function lon2tileFloat(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
}
function lat2tileFloat(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
}

const zoom = 9;
const tileCache = {};

for (let x = 387; x <= 388; x++) {
  for (let y = 220; y <= 224; y++) {
    const file = `public/assets/tile_${zoom}_${x}_${y}.png`;
    tileCache[`${x}_${y}`] = PNG.sync.read(fs.readFileSync(file));
  }
}

function getElevation(lat, lon) {
  const xf = lon2tileFloat(lon, zoom);
  const yf = lat2tileFloat(lat, zoom);
  
  const tileX = Math.floor(xf);
  const tileY = Math.floor(yf);
  const tile = tileCache[`${tileX}_${tileY}`];
  if (!tile) return null;

  const px = Math.min(255, Math.max(0, Math.floor((xf - tileX) * 256)));
  const py = Math.min(255, Math.max(0, Math.floor((yf - tileY) * 256)));

  const idx = (tile.width * py + px) << 2;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];
  return (r * 256 + g + b / 256) - 32768;
}

// Test known points in Mizoram:
// Aizawl: 23.7271° N, 92.7176° E (~1132m)
// Phawngpui (Blue Mountain): 22.6317° N, 93.0489° E (~2157m)
// Lunglei: 22.8872° N, 92.7441° E (~722m)
// Champhai: 23.4757° N, 93.3276° E (~1350m)
// Kolasib: 24.2246° N, 92.6784° E (~600m)
// Saiha: 22.4897° N, 92.9793° E (~729m)

console.log("Aizawl elevation:", getElevation(23.7271, 92.7176), "m (expected ~1132m)");
console.log("Phawngpui peak elevation:", getElevation(22.6317, 93.0489), "m (expected ~2157m)");
console.log("Lunglei elevation:", getElevation(22.8872, 92.7441), "m (expected ~722m)");
console.log("Champhai elevation:", getElevation(23.4757, 93.3276), "m (expected ~1350m)");
console.log("Kolasib elevation:", getElevation(24.2246, 92.6784), "m (expected ~600m)");
console.log("Saiha elevation:", getElevation(22.4897, 92.9793), "m (expected ~729m)");
