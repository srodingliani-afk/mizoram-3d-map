import fs from 'fs';
import { PNG } from 'pngjs';

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

let highest = -Infinity, highestLat = 0, highestLon = 0;
// Search in Mizoram bounds: lat [21.94 .. 24.52], lon [92.26 .. 93.44]
for (let lat = 21.94; lat <= 24.52; lat += 0.01) {
  for (let lon = 92.26; lon <= 93.44; lon += 0.01) {
    const elev = getElevation(lat, lon);
    if (elev > highest) {
      highest = elev;
      highestLat = lat;
      highestLon = lon;
    }
  }
}
console.log(`Statewide peak in dataset: ${highest}m at lat ${highestLat.toFixed(2)}, lon ${highestLon.toFixed(2)}`);
